<template>
  <div id="container">

    <div class="msg-input">
      <el-input v-model="input" style="width: 100%" type="textarea" placeholder=" 给DeepSeek发消息" :rows="2" />

      <el-button class="send" :icon="Message" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";


import { ChatDeepSeek } from "@langchain/deepseek";

import {
  Message
} from '@element-plus/icons-vue'

import { HumanMessage } from "@langchain/core/messages";


const input = ref('')

onMounted(async () => {


  const llm = new ChatDeepSeek({
    model: "deepseek-reasoner",
    temperature: 0,
    apiKey: 'sk-ffaa3fd19c194f1f86df34150e038209'

  });

  // const aiMsg = await llm.invoke([
  //   new HumanMessage("你好！")
  // ]);


  // console.log(aiMsg.content)

});






</script>

<style lang="scss" scoped>
.msg-input {
  display: flex;
  align-items: center;

  padding: 0 20px;

  .send {
    margin-left: 10px;
  }
}
</style>
