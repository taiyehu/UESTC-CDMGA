---
title: 开发环境
nav_order: 2
parent: 前端
---

# 前端开发和部署

当前开发与部署主线是 `reactproject/`（React、TypeScript、Vite）；`vueproject/` 是保留的旧版实现，用于对照和维护，不是当前部署产物。

在仓库根目录启用 pnpm 并进入 React 工程：
```Bash
corepack enable
corepack prepare pnpm@10.30.0 --activate
pnpm --version
cd reactproject
```

接着执行

```Bash
pnpm install --frozen-lockfile

# 启动 React 开发服务器
pnpm dev

```

开发服务器默认运行在 `http://localhost:5174`，并将 `/api` 代理到本地后端 `http://localhost:8080`。需要先启动后端和本地开发数据库，登录及业务请求才能正常工作。React 路由守卫会向 `/api/identity/me` 确认服务端会话；浏览器的 `sessionStorage` 只缓存显示所需的用户信息，不作为授权凭据。

>换源
>国内镜像较慢，可以执行`pnpm config set registry https://registry.npmmirror.com`进行换源操作



代码修改后 Vite 会自动热更新。旧版 Vue 前端仍可在 `vueproject/` 单独启动，默认端口为 8081。

前端的部署前要先进行打包

```Bash
pnpm build
```

构建产物位于 `reactproject/dist/`。生产构建由 `main` 分支工作流执行，开发站前端由 `dev` 分支工作流部署；不要将旧版 `vueproject/dist` 当作当前版本发布。

## 登录与权限

登录由后端建立服务端 HTTP Session，并通过 HttpOnly Cookie 维持。React 受保护路由向 `/api/identity/me` 查询当前身份；后端拦截器也会校验会话，并从数据库读取最新角色。前端路由检查只负责导航体验，不能替代后端授权。

个人主页允许已登录用户查看他人公开资料和已评分课题成绩；成绩查询不返回未评分或已删除记录。`/score/history` 和 Bingo 题目提交历史属于个人提交记录，只允许本人读取。管理接口需要管理员角色。新增接口时要对照前端调用和后端公开/登录/管理员权限规则。

## 检查

```Bash
pnpm build
pnpm test:e2e
```

Playwright 全套测试含 Vue/React 对照用例；运行前按测试说明启动对应本地服务，并检查历史断言失败。单独构建通过不代表业务权限已验证。

本地业务数据由 [合成数据生成器](Local_Test_Data.md) 创建，不导入真实用户资料或云端数据库导出。
