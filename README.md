# 🚀 社团官方网站 (Club Official Website)

本项目是一个全栈 Web 应用，采用前后端分离架构，并集成了基于 GitHub Actions 的自动化 CI/CD 流程。

项目指南见仓库的 [`docs/`](docs/) 和 [`training-guide/`](training-guide/) 目录。

---

# 🖥 运行环境与生产配置 (Production Environment)

> **注意**：生产环境目前统一运行在物理服务器上，配置如下：

## 1. 操作系统

* **OS**: `Ubuntu 22.04 LTS` (长期支持版)
* **适用版本**: 标准 22.04 或 22.04-LTS 均可。

## 2. 前端服务 (Frontend)

* **当前主线**: `reactproject/`，React + TypeScript + Vite，由 pnpm 10.30.0 管理依赖。
* **旧版工程**: `vueproject/` 保留用于参考和维护，不作为当前主线构建目录。
* **运行时**: Node.js 24。
* **部署**: GitHub Actions 构建当前 React 工程，由 **Nginx** 托管静态文件。

## 3. 后端服务 (Backend)

* **框架**: Spring Boot (Maven 管理)
* **运行时**: `Java 25`
* **数据库**: `MySQL`

## 4. 网络与跨域 (Networking)

* **开发环境**: 跨域由后端服务通过 CORS 策略处理。
* **生产环境**: 跨域由 **Nginx 反向代理** 统一解决，前端通过 Nginx 访问后端 API。

---

# 📂 项目文档导航 (Docs)

为了保持根目录整洁，详细的技术细节已移至 `docs` 目录：

* **[开发环境搭建](docs/Development_environment.md)**：Ubuntu/WSL 开发工具与本地运行说明。
* **[部署手册](docs/Deployment.md)**：Nginx 反向代理配置及 GitHub Actions 工作流。
* **[前端开发](docs/Frontend.md)**：React 主线、pnpm 命令和前后端鉴权边界。
* **[新人运行与维护手册](training-guide/README.md)**：本地启动、开发和验证流程。
* **[开发日志](docs/Development.md)**：项目历史记录。

