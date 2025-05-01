<template>
  <div class="chat-container" v-loading="loading" element-loading-text="数据加载中.."
    element-loading-background="rgba(122, 122, 122, 0.5)">

    <div class="left">
      <span class="report-title">AI分析报告</span>
      <template v-if="saved && saved.length">
        <div class="left-item" v-for="(msg) of saved" :key="msg.id">

          <div class="left-title ">
            <span> {{ msg.label }} </span>
            <span class="remove-icon" @click="remove(msg.id)">
              <el-icon>
                <CloseBold />
              </el-icon>
            </span>
          </div>
          <div class="item-content">
            <iframe class="ai-graphic" :src="msg.content"></iframe>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="no-data">
          <el-empty description="暂无数据" />
        </div>
      </template>
    </div>

    <div class="right">
      <div id="messages" class="messages">
        <div class="item" :class="['message', msg.isAI ? 'ai-message' : 'user-message']"
          v-for="(msg) of chatContentList">

          <div class="graphic-container" v-if="msg.type === CHAT_TYPE.ANSWER_GRAPHIC">
            <iframe class="ai-graphic" :src="msg.content"></iframe>
            <div class="btn-add">
              <el-button type="primary" @click="save(msg.content)">暂存</el-button>
            </div>
          </div>
          <div v-else class="message-content" v-html="renderMarkdown(msg.content)" v-highlight></div>
        </div>
      </div>
      <div class="msg-input">
        <el-input v-model="input" style="width: 100%" type="textarea" placeholder=" 给DeepSeek发消息" :rows="3" />
        <el-button class="send" :icon="Message" @click="onhanderSend" :loading="loading">
          确定
        </el-button>
        <el-button class="send" :icon="Message" @click="reset" :disabled="loading">
          新对话
        </el-button>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="暂存" width="300">
      <el-form ref="refFrom" :model="form" :rules="rules">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSave()">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>


</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import { marked } from 'marked'
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatDeepSeek } from "@langchain/deepseek";

import {
  CloseBold,
  Message
} from '@element-plus/icons-vue'
import { CHAT_TYPE } from "./Constant";
import { ElMessage, FormRules } from "element-plus";
import { MockAIContent } from "./mock";
import { generateRandomId } from "../Tools/Tools";

import { ChatAgent } from "./ChatAgent";

const dialogVisible = ref(false)

const refFrom: any = ref(null)
let cacheSaveItem: any = null

const input = ref<string>()

const saved = ref<any>([])
let chatContentList = ref<Array<any>>([])
let loading = ref(false)

const form = reactive({
  name: '',
})

const llm = new ChatDeepSeek({
  model: "deepseek-reasoner",
  temperature: 0,
  apiKey: 'sk-ffaa3fd19c194f1f86df34150e038209'

});

const rules = reactive<FormRules<any>>({
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 1, max: 20, message: '名称长度不能超过20', trigger: 'blur' },
  ]
})

const htmlMatch = (originalString: string) => {
  const htmlMatch = originalString.match(/```html\n([\s\S]*?)\n```/);

  if (!htmlMatch) return

  let htmlContent = htmlMatch[1]
    .replace(/\\x3C/g, '<')
    .replace(/\\n/g, '\n');

  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

  return dataUrl

}

const saved = ref<any>([])
let chatContentList = ref<Array<any>>([])
const input = ref<string>('每个地区有多少个项目？')
let loading = ref(false)

const llm = new ChatDeepSeek({
  model: "deepseek-chat",
  temperature: 0,
  apiKey: 'sk-ffaa3fd19c194f1f86df34150e038209'

});

const chatAgent = new ChatAgent({
  llm: llm
});


onMounted(async () => {
  nextTick(() => {

    chatContentList.value = [
      {
        type: CHAT_TYPE.ANSWER,
        content: MockAIContent,
        isAI: true,
      },
      // {
      //   type: CHAT_TYPE.ANSWER_GRAPHIC,
      //   content: htmlMatch(MockAIContent),
      //   isAI: true,
      // }
    ]
  })
});


const renderMarkdown = (content: string) => {
  return marked(content, {
    breaks: true,
    gfm: true
  })
}


const onhanderSend = async () => {

  loading.value = true

  chatContentList.value.push({
    type: CHAT_TYPE.ASK,
    content: input.value
  })

  let asklist = chatContentList.value.filter(ii => [CHAT_TYPE.ASK, CHAT_TYPE.ANSWER].includes(ii.type))
  if (!asklist || !asklist.length) return

  let params: any = asklist.map(ii => {
    if (ii.type == CHAT_TYPE.ASK) {
      return new HumanMessage(ii.content)
    } else {
      return new AIMessage(ii.content)
    }
  })

  try {
    chatAgent.executePipeline( input.value).then((res) => {
      console.log("res: ", res);
      // ai 回答文本
      // chatContentList.value.push({
      //   type: CHAT_TYPE.ASK,
      //   content: res.html,
      //   isAI: true,
      // })

      loading.value = false

      setTimeout(() => {


        const iframeUrl = htmlMatch(res.html as string)
        // ai 回答可视化图
        chatContentList.value.push({
          type: CHAT_TYPE.ANSWER_GRAPHIC,
          content: iframeUrl,
          isAI: true,
        })
        htmlMatch(res.html as string)
      }, 0);
    });

    // await llm.invoke([
    //   new HumanMessage(input.value)
    // ]).then((aiMsg) => {

    //   // ai 回答文本
    //   chatContentList.value.push({
    //     type: CHAT_TYPE.ASK,
    //     content: aiMsg.content,
    //     isAI: true,
    //   })


    //   loading.value = false

    //   setTimeout(() => {


    //     const iframeUrl = htmlMatch(aiMsg.content as string)
    //     // ai 回答可视化图
    //     chatContentList.value.push({
    //       type: CHAT_TYPE.ANSWER_GRAPHIC,
    //       content: iframeUrl,
    //       isAI: true,
    //     })


    //     htmlMatch(aiMsg.content as string)
    //   }, 0);
    // });


  } catch (error) {

    loading.value = false
    ElMessage.error("出错了！")
  }

  setTimeout(() => input.value = '', 500);

}

const confirmSave = async () => {

  if (!refFrom.value) return
  await refFrom.value.validate((valid: boolean) => {
    if (valid) {
      saved.value.push({
        id: generateRandomId(),
        label: form.name,
        content: cacheSaveItem
      })
      dialogVisible.value = false
    }
  })
}


const save = (item: any) => {
  dialogVisible.value = true
  cacheSaveItem = item
  form.name = ''
}

const reset = () => {
  chatContentList.value.length = 0
}

const remove = (id: string) => {

  saved.value = saved.value.filter((item: any) => item.id !== id)

}
</script>

<style lang="scss" scoped>
.chat-container {
  padding: 20px;
  margin: 0 auto;
  height: calc(100vh - 50px);
  display: flex;
  flex-direction: row;
}

.ai-graphic {
  width: 100%;
  height: 320px;
  border: none;
}

.left {

  width: 65%;
  border: 1px solid #eee;
  overflow: auto;
  margin-right: 5px;
  box-sizing: border-box;
  overflow-y: overlay;
  overflow-x: hidden;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  scrollbar-gutter: stable;

  position: relative;
}



.left-item {

  display: flex;
  flex-direction: column;
  height: 340px;
  margin: 12px 0;
  border: 1px solid #ddd;
  display: flex;

  .left-title {
    box-sizing: border-box;
    height: 40px;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    padding: 0 12px;
    justify-content: space-between;
  }

  .remove-icon {
    cursor: pointer;
  }

  .item-content {
    overflow: hidden;
    display: flex;
    width: 100%;
    height: 320px;
  }
}



.right {
  flex: 1;
  flex-direction: column;
  display: flex;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
}

.message {
  margin: 10px 0;
  max-width: 80%;
}

.user-message {
  margin-left: auto;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ai-message {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.msg-input {
  display: flex;
  align-items: center;
  margin-top: 5px;
  padding: 0 20px;

  .send {
    margin-left: 10px;
  }
}

.graphic-container {
  position: relative;

  flex: 1;

  .btn-add {
    position: absolute;
    top: 0px;
    right: 0px;
  }
}

.no-data {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.report-title {
  display: flex;
  font-size: 18px;
  font-weight: bold;
  margin-top: 5px;
  border-left: 8px solid #409eff;
  padding-left: 8px;
  height: 18px;
  align-items: center;

}
</style>
