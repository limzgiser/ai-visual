<template>
  <div class="chat-container">


    <div class="left">
      <div v-for="(msg, index) of saved">

        <iframe class="ai-graphic" :src="msg.content"></iframe>

      </div>
    </div>
    <div class="right">
      <div id="messages" class="messages">
        <div class="item" :class="['message', msg.isAI ? 'ai-message' : 'user-message']"
          v-for="(msg, index) of chatContentList">

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
        <el-input v-model="input" style="width: 100%" type="textarea" placeholder=" 给DeepSeek发消息" :rows="2" />
        <el-button class="send" :icon="Message" @click="onhanderSend" :loading="loading" />
      </div>

    </div>


  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { marked } from 'marked'
import { HumanMessage } from "@langchain/core/messages";
import { ChatDeepSeek } from "@langchain/deepseek";

import {
  Message
} from '@element-plus/icons-vue'
import { CHAT_TYPE } from "./Constant";
import { ElMessage } from "element-plus";
import { MockAIContent } from "./mock";


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


let loading = ref(false)
const llm = new ChatDeepSeek({
  model: "deepseek-reasoner",
  temperature: 0,
  apiKey: 'sk-ffaa3fd19c194f1f86df34150e038209'

});
const input = ref<string>('给我下一个echart的demo，要求返回完整的html网页,echarts图的宽度设置为100% ,高度固定360px。')

onMounted(async () => {

  nextTick(() => {

    chatContentList.value = [
      {
        type: CHAT_TYPE.ANSWER,
        content: MockAIContent,
        isAI: true,
      },
      {
        type: CHAT_TYPE.ANSWER_GRAPHIC,
        content: htmlMatch(MockAIContent),
        isAI: true,
      }
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


  try {
    await llm.invoke([
      new HumanMessage(input.value)
    ]).then((aiMsg) => {

      // ai 回答文本
      chatContentList.value.push({
        type: CHAT_TYPE.ASK,
        content: aiMsg.content,
        isAI: true,
      })


      loading.value = false

      setTimeout(() => {


        const iframeUrl = htmlMatch(aiMsg.content as string)
        // ai 回答可视化图
        chatContentList.value.push({
          type: CHAT_TYPE.ANSWER_GRAPHIC,
          content: iframeUrl,
          isAI: true,
        })


        htmlMatch(aiMsg.content as string)
      }, 0);
    });


  } catch (error) {

    loading.value = false

    ElMessage.error("出错了！")
  }

}
const save = (item: any) => {

  let index = saved.value.length
  saved.value.push({
    label: "图表" + index + 1,
    content: item
  })
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
  height: 420px;
  border: 1px solid #ccc;
}

.left {
  width: 55%;
  border: 1px solid #f7f7f7;

}

.right {
  width: 45%;
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
</style>
