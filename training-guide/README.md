# CDMGA 网站新人运行、开发与维护手册

> 适用对象：完全不了解计算机相关知识、需要借助 AI 完成基础运行与维护的新人。  
> 文档依据：当前仓库 `main` 分支代码与配置（整理日期：2026-07-22）。命令中的 `<...>` 都是占位符，必须替换，不能连尖括号一起复制。

## 先读这里

这是电子科技大学音游社的活动与课题平台。用户可以注册、维护资料、查看课题/活动、提交成绩、查看排名；管理员可以发布内容、审核资料与成绩，并管理用户、队伍、Bingo 等内容。

系统由四部分组成：

```text
浏览器
  ↓ 访问 80/443
Nginx（网页、静态上传文件、/api 反向代理）
  ├─ /              → Vue 3 构建产物
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

## 一页速查

| 目标 | 目录 | 命令 |
|---|---|---|
| 启动前端 | `vueproject` | `pnpm install`，然后 `pnpm dev` |
| 构建前端 | `vueproject` | `pnpm build` |
| 启动后端 | `webpage` | Windows：`.\mvnw.cmd spring-boot:run`；Linux：`./mvnw spring-boot:run` |
| 测试后端 | `webpage` | `.\mvnw.cmd test` 或 `./mvnw test` |
| 构建生产后端 | `webpage` | `.\mvnw.cmd clean package -P prod` 或 `./mvnw clean package -P prod` |
| 查看改动 | 仓库根目录 | `git status`、`git diff` |
| 前端地址 | 浏览器 | `http://localhost:8081` |
| 后端地址 | 浏览器/接口工具 | `http://localhost:8080` |

正常本地运行需要三个服务：MySQL、Spring Boot 后端、Vite 前端。只启动前端通常只能看到登录页，不能完成业务操作。

## 当前必须优先处理的风险

以下是基于代码审查得到的事实，不应把当前配置直接视为安全的生产模板：

1. `webpage/src/main/resources/application.properties` 中出现公网数据库地址和明文凭据。应立即轮换密码，将凭据移到 `/etc/webserver.env` 或本机不入库配置，并检查 Git 历史；仅添加 `.gitignore` 不能抹掉历史泄露。
2. `SecurityConfig` 对 `/**` 执行 `permitAll()`；前端路由的管理员判断不是安全边界，用户可绕过网页直接调用接口。生产使用前必须在后端实现身份认证和管理员接口授权。
3. `sql_script/CDMGA.sql` 是含实际记录的完整导出，不适合作为新人本地样例库或公开提交。应改用脱敏测试数据，并限制该文件访问。
4. `spring.jpa.hibernate.ddl-auto=update` 会自动变更表结构。生产库应改用版本化迁移（Flyway/Liquibase），至少先备份再部署。
5. 配置中后端允许 10 MB 上传，而 Nginx 只允许 5 MB，超过 5 MB 会先被 Nginx 拒绝，应统一限制。

## 新人的安全底线

- 不把密码、私钥、Token、生产数据库导出贴给 AI，也不提交到 Git。
- 不在 `main` 上直接开发；创建分支，经检查和 Pull Request 合并。
- 不在没有备份的情况下执行 `DROP`、`DELETE`、`TRUNCATE`、覆盖部署或修改生产库。
- AI 给出的命令先让它逐段解释；涉及 `sudo`、删除、数据库和生产服务器时由维护者复核。
- “页面能打开”不等于功能正确；至少完成构建、测试和关键页面手工验证。

