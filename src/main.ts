import { createApp } from 'vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import './style.css'
import App from './App.vue'

const app: any = createApp(App)

app.use(ElementPlus)

// 注册代码高亮指令
app.directive('highlight', (el: any) => {
  const blocks = el.querySelectorAll('pre code')
  blocks.forEach((block: HTMLElement) => {
    hljs.highlightElement(block)
  })
})

app.mount('#app')
