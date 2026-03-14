# 🚀 社团官方网站 (Club Official Website)

本项目是一个全栈 Web 应用，采用前后端分离架构，并集成了基于 GitHub Actions 的自动化 CI/CD 流程。

📖 **[点击此处查看项目在线文档手册](https://www.google.com/search?q=https://%3C%E4%BD%A0%E7%9A%84%E7%94%A8%E6%88%B7%E5%90%8D%3E.github.io/%3C%E9%A1%B9%E7%9B%AE%E5%90%8D%3E/)**

---

# 🖥 运行环境与生产配置 (Production Environment)

> **注意**：生产环境目前统一运行在物理服务器上，配置如下：

## 1. 操作系统

* **OS**: `Ubuntu 22.04 LTS` (长期支持版)
* **适用版本**: 标准 22.04 或 22.04-LTS 均可。

## 2. 前端服务 (Frontend)

* **框架**: Vue 3 + vite
* **运行时**: `Node 20`
* **部署**: 由 **Nginx** 托管构建后的静态文件。

## 3. 后端服务 (Backend)

* **框架**: Spring Boot (Maven 管理)
* **运行时**: `Java 17`
* **数据库**: `MySQL`

## 4. 网络与跨域 (Networking)

* **开发环境**: 跨域由后端服务通过 CORS 策略处理。
* **生产环境**: 跨域由 **Nginx 反向代理** 统一解决，前端通过 Nginx 访问后端 API。

---

# 📂 项目文档导航 (Docs)

为了保持根目录整洁，详细的技术细节已移至 `docs` 目录：

* **[开发环境搭建](https://www.google.com/search?q=./docs/Development_environment.md)**：包含 Arch Linux/WSL2 及 Ubuntu 下的具体配置步骤。
* **[部署手册](https://www.google.com/search?q=./docs/Deployment.md)**：Nginx 反向代理配置及 GitHub Actions 脚本。
* **[前端开发](https://www.google.com/search?q=./docs/Frontend.md)**：Vibe Coding 风格指南、Tailwind CSS 及 Shadcn-vue 使用说明。
* **[开发日志](https://www.google.com/search?q=./docs/Development.md)**：项目迭代与功能变更记录。

