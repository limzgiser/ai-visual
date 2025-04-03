import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // 监听所有网络接口
    // port: 5173, // 可选：指定端口（默认 5173）
    strictPort: true, // 可选：严格使用指定端口（若端口被占用则报错）
  },
  plugins: [vue()],
})
