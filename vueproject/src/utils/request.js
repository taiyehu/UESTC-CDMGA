// src/utils/request.js
import axios from 'axios'

const service = axios.create({
    baseURL: '/', // 保持根路径
    timeout: 5000
})

// 请求拦截器 - 统一添加 /api 前缀
service.interceptors.request.use(config => {
    // 排除特殊情况（如外部URL）
    const isExternalUrl = /^https?:\/\//i.test(config.url)
    const isStaticAsset = /\.(json|png|jpg|svg|css|js)$/i.test(config.url)

    // 添加 /api 前缀的条件：
    // 1. 不是外部URL
    // 2. 不是静态资源
    // 3. 不是以 /api 开头
    if (!isExternalUrl && !isStaticAsset && !config.url.startsWith('/api')) {
        config.url = `/api${config.url.startsWith('/') ? config.url : '/' + config.url}`
    }

    return config
}, error => {
    return Promise.reject(error)
})

// 响应拦截器保持不变
export default service
