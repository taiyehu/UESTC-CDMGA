// src/api/auth.js
//用户身份认证相关API
import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} credentials - 用户凭据
 * @param {string} credentials.account - 用户名
 * @param {string} credentials.password - 密码
 * @returns {Promise} Axios 请求的 Promise 对象
 */
export const login = (credentials) => {
    return request({
        url: '/identity/login',
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        data: credentials
    })
}
/**
 * 用户注册
 * @param {Object} credentials - 用户凭据
 * @param {string} credentials.account - 用户名
 * @param {string} credentials.password - 密码
 * @returns {Promise} Axios 请求的 Promise 对象
 */
export const  register = (credentials) => {
    return request({
        url: '/identity/register',
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: credentials,
        withCredentials: true
    })
}
