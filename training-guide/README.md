# CDMGA 网站新人运行、开发与维护手册

> 适用对象：完全不了解计算机相关知识、需要借助 AI 完成基础运行与维护的新人。  
> 文档依据：当前仓库 React 前端主线与 Spring Boot 后端代码。命令中的 `<...>` 都是占位符，必须替换，不能连尖括号一起复制。`vueproject/` 是保留的旧版前端。

## 先读这里

这是电子科技大学音游社的活动与课题平台。用户可以注册、维护资料、查看课题/活动、提交成绩、查看排名；管理员可以发布内容、审核资料与成绩，并管理用户、队伍、Bingo 等内容。

系统由四部分组成：

```text
浏览器
  ↓ 访问 80/443
Nginx（网页、静态上传文件、/api 反向代理）
  ├─ /              → React 构建产物
  ├─ /api/*         → Spring Boot :8080
  └─ /images 等     → /var/webserver 下的上传文件
                         ↓
                    MySQL 8（业务数据）
```

## 推荐阅读路线

1. [01-项目全景与词汇表.md](01-项目全景与词汇表.md)：先知道各目录做什么。
2. [02-第一次在本地运行.md](02-第一次在本地运行.md)：照着完成第一次启动。
3. 根据任务阅读 [03-前端开发.md](03-前端开发.md)、[04-后端与数据库开发.md](04-后端与数据库开发.md)。
4. 提交代码前阅读 [07-Git协作.md](07-Git协作.md) 和 [08-AI辅助开发工作流.md](08-AI辅助开发工作流.md)。
5. 只有维护服务器的人阅读 [05-服务器搭建与部署.md](05-服务器搭建与部署.md)。
6. 出错时查 [06-日常维护与故障排查.md](06-日常维护与故障排查.md)。
7. 每次上线前执行 [09-检查清单.md](09-检查清单.md)。
8. 讲解历史 Vue 登录实现可使用 [11-登录功能技术栈实例.md](11-登录功能技术栈实例.md)；其中已注明当前 React 主线和服务端会话的差异。旧培训讲稿和 PDF 不在当前仓库发布范围内。

## 一页速查

| 目标 | 目录 | 命令 |
|---|---|---|
| 启动前端 | `reactproject` | `pnpm install --frozen-lockfile`，然后 `pnpm dev` |
| 构建前端 | `reactproject` | `pnpm build` |
| 启动后端 | `webpage` | Windows：`.\mvnw.cmd spring-boot:run`；Linux：`./mvnw spring-boot:run` |
| 测试后端 | `webpage` | `.\mvnw.cmd test` 或 `./mvnw test` |
| 构建生产后端 | `webpage` | `.\mvnw.cmd clean package -P prod` 或 `./mvnw clean package -P prod` |
| 查看改动 | 仓库根目录 | `git status`、`git diff` |
| 前端地址 | 浏览器 | `http://localhost:5174`（React）；`http://localhost:8081`（旧 Vue） |
| 后端地址 | 浏览器/接口工具 | `http://localhost:8080` |

正常本地运行需要本地数据库、Spring Boot 后端、Vite 前端。只启动前端不能完成登录与业务操作。本地数据库使用隔离配置和 3307 端口；不要将 3306 SSH 隧道误认为本地开发库。

推荐直接使用 [合成测试数据方案](../docs/Local_Test_Data.md)：`bash script/synthetic-db.sh verify` 会在独立 13307 端口创建纯虚构数据库并跑真实接口回归，无需导入用户数据。数据库、密码和日志保存在仓库外。

## 当前必须优先处理的风险

以下是基于代码审查得到的事实，不应把当前配置直接视为安全的生产模板：

1. `application.properties` 是服务器基础配置，不要把个人数据库密码写入并提交。个人开发使用被忽略的 `application-local.properties`，只连接本地 3307 开发库；生产凭据由服务器环境注入。
2. `/api/**` 的接口鉴权由 `ApiAuthorizationInterceptor` 执行；`SecurityConfig` 中的 `permitAll()` 不代表 API 无需认证。新增接口需检查拦截器是否按预期区分公开、登录和管理员访问，并增加测试。
3. 历史中出现过 `sql_script/CDMGA.sql` 用户数据导出，当前版本已移除，不能恢复它作为本地种子。开发数据统一由 [生成器](../docs/Local_Test_Data.md) 创建；历史文件的删除不等于历史内容已被清除。
4. `spring.jpa.hibernate.ddl-auto=update` 会自动变更表结构。生产库应改用版本化迁移（Flyway/Liquibase），至少先备份再部署。
5. 配置中后端允许 10 MB 上传，而 Nginx 只允许 5 MB，超过 5 MB 会先被 Nginx 拒绝，应统一限制。

## 新人的安全底线

- 不把密码、私钥、Token、生产数据库导出贴给 AI，也不提交到 Git。
- 不在 `main` 上直接开发；创建分支，经检查和 Pull Request 合并。
- 不在没有备份的情况下执行 `DROP`、`DELETE`、`TRUNCATE`、覆盖部署或修改生产库。
- AI 给出的命令先让它逐段解释；涉及 `sudo`、删除、数据库和生产服务器时由维护者复核。
- “页面能打开”不等于功能正确；至少完成构建、测试和关键页面手工验证。
