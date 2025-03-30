<template>
  <div class="container">

    <div class="chat-content">
      <div class="item" :class="{ isAsk: item.type == CHAT_TYPE.ASK }" v-for="(item, index) of chatContentList">


        <div>
          {{ item.value }}
        </div>
      </div>

    </div>

    <div class="msg-input">
      <el-input v-model="input" style="width: 100%" type="textarea" placeholder=" 给DeepSeek发消息" :rows="2" />

      <el-button class="send" :icon="Message" @click="onhanderSend" :loading="loading" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { HumanMessage } from "@langchain/core/messages";
import { ChatDeepSeek } from "@langchain/deepseek";

import {
  Message
} from '@element-plus/icons-vue'
import { CHAT_TYPE } from "./Constant";
import { ElMessage } from "element-plus";


let chatContentList = ref<Array<any>>([

])


let loading = ref(false)
const llm = new ChatDeepSeek({
  model: "deepseek-reasoner",
  temperature: 0,
  apiKey: 'sk-ffaa3fd19c194f1f86df34150e038209'

});
const input = ref<string>('给我下一个echart的demo，要发返回完整的echarts的options参数。')

onMounted(async () => {





});





const onhanderSend = async () => {

  loading.value = true
  chatContentList.value.push({
    type: CHAT_TYPE.ASK,
    value: input.value
  })

  try {
    const aiMsg = await llm.invoke([
      new HumanMessage(input.value)
    ]);

    chatContentList.value.push({
      type: CHAT_TYPE.ASK,
      value: aiMsg.content
    })

    loading.value = false

  } catch (error) {

    loading.value = false

    ElMessage.error("出错了！")
  }

}

</script>

<style lang="scss" scoped>
.container {
  width: 60vw;
  margin: 0 auto;
  padding: 24px;
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

.chat-content {
  border: 1px solid #efeff5;
  height: calc(100vh - 200px);
  overflow: auto;
  padding: 12px;

  .item {
    line-height: 32px;
    width: 100%;
    display: flex;

  }

  .isAsk {

    display: flex;
    justify-content: flex-end;

    div {
      background: #eff6ff;
      padding: 0 12px;
      border-radius: 6px;
    }


  }
}
</style>
