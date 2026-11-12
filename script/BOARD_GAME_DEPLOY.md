# 桌游上线前清单

`main` 分支的 `CD.yml` 依次部署环境配置、Spring、桌游服务和前端。桌游部署会打包代码、卡牌 CSV/PNG，在服务器安装依赖，更新 `board-game.service`，检查数据库可用性，失败时恢复上一版服务链接，成功后每处保留最近六个版本。`dev` 分支只部署前端，仍使用同一台服务器上的桌游服务；若要隔离开发环境，需另设端口、数据库和 Nginx 路由。

上线前由服务器管理员手动完成以下事项，**先完成，再将本地改动（含新增的 `game-service/` 和卡牌文件）提交到 `main` 触发部署**：

1. 备份目标数据库，并在该数据库执行或重新执行 `sql_script/board_game_incremental.sql`。该脚本包含课题裁判字段、队伍字段、房间/状态/日志表、人机队伍表及旧课题补房间；新增人机功能需要 `game_room_bot`、可为空的操作身份字段和 `actor_type`。检查末尾两条查询结果：缺失裁判的桌游课题需补上有效的 `admin`，重复房间需人工处理。GitHub Actions 不自动运行数据库迁移。
2. 安装 Node.js 24 和 npm，确保 `/usr/bin/node`、`/usr/bin/npm` 可执行；服务器还需 `curl` 和 `tar`，并确认本机 3001 端口未被其他程序占用。CI 的 Node 安装仅在 GitHub runner 上生效。
3. 创建持久卡牌目录：`sudo install -d -o webserver -g webserver -m 750 /var/webserver/game`。此目录存储每次发布的卡牌 CSV/PNG，工作流管理其 `releases/` 和 `current` 链接。若此前未建论坛上传目录，也执行 `sudo install -d -o webserver -g www-data -m 2750 /var/webserver/forum`。`webserver.service` 已允许这两个路径写入。
4. 确认 `/etc/webserver.env` 存在且 `webserver` 用户可读，包含现有的 `SPRING_DATASOURCE_URL`、`SPRING_DATASOURCE_USERNAME` 和 `SPRING_DATASOURCE_PASSWORD`。桌游服务会从 Spring 的 JDBC URL 读取数据库名并复用账号密码；如需单独配置桌游数据库，再添加 `GAME_DB_HOST`、`GAME_DB_PORT`、`GAME_DB_NAME`、`GAME_DB_USER`、`GAME_DB_PASSWORD`。不要把密码提交到仓库。
5. 确认 GitHub Actions 的 `SSH_HOST`、`SSH_SUDO`、`SSH_PRIVATE_KEY` 已配置；若 SSH 端口不是 22，再配置 `SSH_PORT`。部署账号需可免交互使用 `sudo`。`/opt/webserver/upload` 应已由现有初始化流程创建。Nginx 的 `/game-api/`、`/game-client/`、`/game-assets/` 路由已在项目配置中，环境工作流会部署它们。

部署完成后在服务器检查 `systemctl status board-game.service`、`curl -f http://127.0.0.1:3001/game-api/health`，再在网站打开 `/game`。健康接口只验证桌游进程、卡牌加载和数据库表；还需使用真实账号验证 Spring 登录态、课题详情与房间操作。
