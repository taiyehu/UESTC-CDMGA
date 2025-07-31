// vue.config.js
module.exports = {
  lintOnSave: false,
  devServer: {
    port: 8081, // 明确指定前端端口
    proxy: {
      '/api': {
        target: 'http://localhost:8079', // 后端服务器地址
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api' // 保持路径中的 /api
        }
      }
    }
  }
}
