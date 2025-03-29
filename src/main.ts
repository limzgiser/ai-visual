import { createApp } from 'vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import './style.css'
import App from './App.vue'

const app: any = createApp(App)

app.use(ElementPlus)

app.mount('#app')
