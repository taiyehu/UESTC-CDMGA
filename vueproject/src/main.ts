import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/index.css'



const app = createApp(App)

// 全局 axios
app.config.globalProperties.$axios = axios

// configureCompat({
//   MODE: 3, // 推荐 2：警告模式
// })

// 全局挂载 axios
app.config.globalProperties.$axios = axios

 
const config: StorybookConfig = {
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: 'vue-component-meta',
    },
  },
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public'],
};
 
export default config;
// 使用 Element Plus & Router
app.use(ElementPlus)
app.use(router)

app.mount('#app')

