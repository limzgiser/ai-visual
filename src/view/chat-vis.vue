<template>
  <div class="chat-container">

    <div id="messages" class="messages">
      <div class="item" :class="['message', msg.isAI ? 'ai-message' : 'user-message']"
        v-for="(msg, index) of chatContentList">
        <div class="message-content" v-html="renderMarkdown(msg.content)" v-highlight></div>
      </div>
    </div>
    <div class="msg-input">
      <el-input v-model="input" style="width: 100%" type="textarea" placeholder=" 给DeepSeek发消息" :rows="2" />
      <el-button class="send" :icon="Message" @click="onhanderSend" :loading="loading" />
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


let chatContentList = ref<Array<any>>([

])


let loading = ref(false)
const llm = new ChatDeepSeek({
  model: "deepseek-reasoner",
  temperature: 0,
  apiKey: 'sk-ffaa3fd19c194f1f86df34150e038209'

});
const input = ref<string>('给我下一个echart的demo，要求返回完整的html网页,echarts图的宽度设置为100% ,高度固定360px。')

onMounted(async () => {

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
    const aiMsg: any = await llm.invoke([
      new HumanMessage(input.value)
    ]).then(() => {

      chatContentList.value.push({
        type: CHAT_TYPE.ASK,
        content: aiMsg.content
      })


      loading.value = false

      setTimeout(() => {
        htmlMatch(aiMsg.content as string)
      }, 0);
    });


  } catch (error) {

    loading.value = false

    ElMessage.error("出错了！")
  }

}


const htmlMatch = (originalString: string) => {


  // 使用正则表达式提取 HTML
  const htmlMatch = originalString.match(/```html\n([\s\S]*?)\n```/);
  if (htmlMatch) {
    // 处理转义字符
    let htmlContent = htmlMatch[1]
      .replace(/\\x3C/g, '<')   // 解码 <
      .replace(/\\n/g, '\n');  // 保留换行符（根据实际情况可选）

    // 创建 Data URL
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

    // 创建并插入 iframe
    const iframe = document.createElement('iframe');
    iframe.src = dataUrl;
    iframe.style.width = '100%';
    iframe.style.height = '420px';  // 稍大于原容器尺寸以避免滚动条
    iframe.style.border = '1px solid #ccc';

    document.getElementById('messages')?.appendChild(iframe);

  } else {
    document.body.innerHTML = '<p style="color:red">未找到 HTML 代码</p>';
  }
}
</script>

<style lang="scss" scoped>
.chat-container {
  padding: 20px;
  max-width: 70vw;
  margin: 0 auto;
  height: calc(100vh - 50px);
  display: flex;
  flex-direction: column;
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
  display: flex;
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
</style>
