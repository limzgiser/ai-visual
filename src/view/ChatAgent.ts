import { END, START, StateGraph, Annotation, MessagesAnnotation } from '@langchain/langgraph/web'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'
import { tool } from '@langchain/core/tools'
import { BaseLanguageModel } from '@langchain/core/language_models/base'
import { v4 as uuidv4 } from "uuid"
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history"
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"

interface MySQLVisualizerConfig {
  llm: BaseLanguageModel
  queryApiUrl?: string
  sessionId?: string
  historyNum: number
}

interface QueryResult {
  query: string
  result?: string
  html?: string
  sessionId?: string
}

const chatsBySessionId: Record<string, InMemoryChatMessageHistory> = {};

const getChatHistory = (sessionId: string) => {
  let chatHistory: InMemoryChatMessageHistory | undefined =
    chatsBySessionId[sessionId];
  if (!chatHistory) {
    chatHistory = new InMemoryChatMessageHistory();
    chatsBySessionId[sessionId] = chatHistory;
  }
  return chatHistory;
};

class ChatAgent {
  private llm: BaseLanguageModel
  private queryApiUrl: string
  private tableSchema: string = ''
  private graph: any
  private historyNum: number = 10
  private sessionId: string = ''
  private queryData: string = ''
  private chatHistory: InMemoryChatMessageHistory

  private StateAnnotation = Annotation.Root({
    question: Annotation<string>(),
    query: Annotation<string>(),
    result: Annotation<string>(),
    html: Annotation<string>(),
    sessionId: Annotation<string>(),
    isQuery: Annotation<boolean>(),
    isChart: Annotation<boolean>()
  })
  private InputStateAnnotation = Annotation.Root({
    question: Annotation<string>()
  })

  constructor(config: MySQLVisualizerConfig) {
    this.llm = config.llm
    this.queryApiUrl = config.queryApiUrl || 'http://localhost:8088/query'
    this.sessionId = config.sessionId || uuidv4()
    this.chatHistory = getChatHistory(this.sessionId)
    // Initialize annotations and graph
    this.initializeGraph()
    this.loadTableSchema()
  }

  private async loadTableSchema(): Promise<void> {
    if (!this.tableSchema) {
      const response = await fetch('/isolarroof_oversea.sql')
      this.tableSchema = await response.text()
    }
  }

  private initializeGraph(): void {
    // Build graph
    const graphBuilder = new StateGraph({
      stateSchema: this.StateAnnotation
    })
      .addNode('userIntention', this.userIntentionNode())
      .addNode('writeQuery', this.writeQueryNode())
      .addNode('executeQuery', this.executeQueryNode())
      .addNode('generateEChart', this.generateEChartNode())
      .addNode('general', async (state) => {
        if (!state.result || !state.query ) {
          return { msg: `Sorry, I don't understand your question. Please try again.` };
        }
      })
      .addEdge('__start__', 'userIntention')
      .addConditionalEdges('userIntention', (state)=> {
        if (state.isQuery) {
          return 'writeQuery';
        }

        if (state.isChart) {
          return 'generateEChart';
        }
        return "generateEChart";
      })
      .addEdge('writeQuery', 'executeQuery')
      .addConditionalEdges('executeQuery', (state) => {
        if (state.isChart) {
          return 'generateEChart';
        }
        return 'generateEChart';
      })
      .addEdge('generateEChart', '__end__')

    this.graph = graphBuilder.compile();
  }

  /**
   * Execute full pipeline: query generation -> execution -> visualization
   * @param question The natural language question to query the database
   * @returns Promise<QueryResult> containing SQL query, result and HTML visualization
   */
  public async executePipeline(question: string): Promise<QueryResult> {
    // await this.chatHistory.addMessage(new HumanMessage(question));

    const inputs = { 
      question,
      sessionId: this.sessionId // 传递sessionId
     };
    let finalResult: QueryResult = { query: '', sessionId: this.sessionId };

    for await (const step of await this.graph.stream(inputs, {
      streamMode: 'values'
    })) {
      finalResult = { ...finalResult, ...step };
      console.log(step);
      console.log("\n====\n");
    }

    // 添加AI响应到历史
    let aiMsg = "";
    if (finalResult.query) {
      aiMsg = `SQL 查询语句: ${finalResult.query}；\n`;
    }
    if (finalResult.result) {
      this.queryData = finalResult.result;
      aiMsg += `查询结果: ${finalResult.result}；\n`;
    }
    if (finalResult.html) {
      aiMsg += `echart图表 html: ${finalResult.html}；\n`;
    }
    await this.chatHistory.addMessage(new AIMessage(aiMsg));
    return finalResult;
  }


  // nodes
  private userIntentionNode() {
    const output = z.object({
      isQuery: z.boolean().describe('Whether the user is asking for a sql query.'),
      isChart: z.boolean().describe('Whether the user is asking for drawing a chart.')
    });
    const structuredLLm = this.llm.withStructuredOutput(output);
    const userIntention = async (state: typeof this.InputStateAnnotation.State) => {
      const promptTemplate = ChatPromptTemplate.fromTemplate(
        `
        给定一个用户输入，请判定用户的意图，是否包含数据查询或者图表绘制方面的意图。
        用户输入：{input}
        `
      );
      const promptValue = await promptTemplate.invoke({
        input: state.question
      });
      const result = await structuredLLm.invoke(promptValue);
      return {
        isQuery: result.isQuery,
        isChart: result.isChart
      }
    };
    return userIntention;
  }

  private writeQueryNode() {
    // State annotations
    const queryOutput = z.object({
      query: z.string().describe('Syntactically valid SQL query.')
    });
    const structuredQueryLlm = this.llm.withStructuredOutput(queryOutput)

    const writeQuery = async (state: typeof this.InputStateAnnotation.State) => {
      
      const history = await this.chatHistory.getMessages();
      const queryPromptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(`你是一位mysql数据库专家，对 sql 查询语句非常擅长。\`\`\`包围的部分是多张表的schema。
请结合schema，充分理解客户的需求生成一条sql查询语句。如果无法生成sql，回复数据不存在。如果需要关联多张表查询，也可进行关联查询。
请检查生成的sql是否满足语法规范后，再进行回复。只查询相关的列，不要返回全部列数据。
注意schema中的列描述信息，不要使用不存在的列。也请注意哪个列在哪张表中，不要对应错了。仅使用schema中的表，请直接输出sql，不要输出其他内容。`),
        ...history.slice(-this.historyNum), // 包含最近的 historyNum 条历史消息
        new HumanMessage(`当前用户需求：${state.question};
table schema: \`\`\`${this.tableSchema}\`\`\`;`)
      ]);

      const promptValue = await queryPromptTemplate.invoke({
        table_info: this.tableSchema,
        input: state.question
      });
      const result = await structuredQueryLlm.invoke(promptValue);
      return { 
        query: result.query, 
        sessionId: this.sessionId // 传递sessionId 
      };
    };
    return writeQuery;
  }

  private executeQueryNode() {
    const executeParamSchema = z.object({
      sql: z.string()
    });
    const httpTool = tool(
      async (input): Promise<string> => {
        const param = encodeURIComponent(input.sql)
        return (await fetch(`${this.queryApiUrl}?sql=${param}`)).json()
      },
      {
        name: 'http',
        description: 'Query data from http api',
        schema: executeParamSchema
      }
    );

    const executeQuery = async (state: typeof this.StateAnnotation.State) => {
      return { result: JSON.stringify(await httpTool.invoke({ sql: state.query })) }
    };
    return executeQuery;
  }

  private generateEChartNode() {
    const generateEChart = async (state: typeof this.StateAnnotation.State) => {
      // 获取相关聊天历史
      const history = await this.chatHistory.getMessages();
      let userMsg = `当前用户问题: ${state.question}\n数据：${state.result||this.queryData}`;
      const promptValue = [
        new SystemMessage(`请根据用户的问题,如果用户提供数据请优先使用用户提供的数据，如果未提供，请从最近的查询结果获取数据。结合数据，使用echart生成可视化图表，并返回html代码。
请务必生成一份完整可执行的html代码，并可内嵌到 iframe 中。要求html的body高度为420px，宽度自适应。`),
        ...history.slice(-this.historyNum), // 包含最近的 historyNum 条历史消息
        new HumanMessage(userMsg)
      ];
      const response = await this.llm.invoke(promptValue);
      return {
        html: response.content, 
        sessionId: this.sessionId 
      };
    };
    return generateEChart;
  }
}

export { ChatAgent };
