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
        <el-button class="send" :icon="Message" @click="onhanderSend" :loading="loading">
          确定
        </el-button>
        <el-button class="send" :icon="Message" @click="reset" :disabled="loading">
          新对话
        </el-button>
      </div>

    </div>


  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { marked } from 'marked'
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatDeepSeek } from "@langchain/deepseek";

import {
  Message
} from '@element-plus/icons-vue'
import { CHAT_TYPE } from "./Constant";
import { ElMessage } from "element-plus";



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

const input = ref<string>()

onMounted(async () => { });


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

  let params: any = asklist
    .map(ii => {
      if (ii.type == CHAT_TYPE.ASK) {
        return new HumanMessage(ii.content)
      } else {
        return new AIMessage(ii.content)
      }
    })

  try {
    await llm.invoke(
      params
    ).then((aiMsg) => {

      // ai 回答文本
      chatContentList.value.push({
        type: CHAT_TYPE.ANSWER,
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

  setTimeout(() => {
    input.value = ''
  }, 500);

}
const save = (item: any) => {

  let index = saved.value.length
  saved.value.push({
    label: "图表" + index + 1,
    content: item
  })
}

const reset = () => {
  chatContentList.value.length = 0
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
  overflow: auto;

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
