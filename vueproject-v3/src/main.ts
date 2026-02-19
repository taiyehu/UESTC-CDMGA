import { createApp, reactive } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import ElementPlus, { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
// import { configureCompat } from '@vue/compat'


const app = createApp(App)

// 全局 axios
app.config.globalProperties.$axios = axios

// configureCompat({
//   MODE: 3, // 推荐 2：警告模式
// })

// 全局挂载 axios
app.config.globalProperties.$axios = axios

// 使用 Element Plus & Router
app.use(ElementPlus)
app.use(router)

app.mount('#app')

