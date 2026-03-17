import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import '@/styles/index.css'
// import MotionPlugin from 'motion-v'



const app = createApp(App)

// 全局 axios
app.config.globalProperties.$axios = axios

// configureCompat({
//   MODE: 3, // 推荐 2：警告模式
// })

// 全局挂载 axios
app.config.globalProperties.$axios = axios

// 使用 Router
app.use(router)
// app.use(MotionPlugin)
app.mount('#app')

