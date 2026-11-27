# CDMGA 桌游服务

## 新手教程

登录用户可从桌游列表进入 `/game/tutorial`，在独立的固定牌局里练习六类格子和三座建筑。每步调用正式规则函数，账号进度保存在 `game_tutorial_progress`，不占用正式房间；部署前运行更新后的 `sql_script/board_game_incremental.sql`。教程完成后可从头重玩。

本服务复用 Spring Session 登录态和 `team` 队伍成员关系。在发布内容页发布 `board_game` 课题时指定管理员裁判并自动创建房间。玩家在 `/game` 查看桌游课题，进入课题详情直接查看棋盘、创建或加入队伍；每房间最多三支队伍，每队最多三人。队长或裁判可解散队伍，成员可退出。三支队伍齐全后由裁判开始游戏，此时各队第一位成员成为操作者。游戏状态和操作日志写入 MySQL。

新对局从开局起将每次成功操作后的状态写入 `game_replay_frame`。对局结束后，所有登录用户可在房间页面进入回顾与重放，按回合查看真实操作顺序并切换三队视角。重放使用正式棋盘 SVG，移动按选牌、路径预览、出牌弃置、棋子移动、格子结算和补牌展示；事件、厄运和战斗播放过场动画。每步间隔 1 秒，队伍切换间隔 2 秒；路线较长时会等待棋子移动完毕。旧对局没有开局重放帧，不提供完整重放。部署新版服务前须先执行 `sql_script/board_game_incremental.sql` 创建重放表。

卡牌原图放在 `content/output/*.png`。新增或替换原图后，在 `game-service` 目录运行 `npm run images`（需要 FFmpeg 的 `libwebp` 编码器），将生成的完整 WebP 和 400 像素宽缩略 WebP 一并提交。文件名包含原图内容及编码配方的哈希；改动编码参数时须同步更新 `card-image-paths.js` 的 `RECIPE`。旧 PNG 继续保留，供已保存的对局记录使用。

裁判可在等待房间添加最多两支独立人机队伍，分别选择“稳健积累收入”或“积极抢分与交战”。服务端每三秒最多为每个房间执行一个人机动作，并在挑战、战斗待裁判判定时暂停；人机最多领先最慢的真人队伍一回合。人机不创建可登录账号，其队伍、席位与日志由 `game_room_bot` 和空身份字段区分。部署前需重新执行 `sql_script/board_game_incremental.sql` 补充人机表与字段。

终局按 `RULES.md` 判定：首次达到 20 分后从该轮起免于新战斗，等待三队完成该轮及以前的待结算战斗后，按达标轮次和时间确认胜者；跌回 20 分以下后再次达标则更新获胜轮次，免战起点保留。课题的结束时间用作比赛时间上限，到时按积分排名并自动结束房间。手机端使用独立房间页和游戏内面板切换；电脑端可通过房间工具栏进入全屏。

## 本地运行

1. 现有数据库执行汇总脚本 `sql_script/board_game_incremental.sql`，不必再分别执行裁判字段、队伍字段、房间建表和旧课题补房间脚本。脚本末尾会列出尚未指定有效管理员裁判的旧桌游课题；为这些课题指定裁判后可再次运行汇总脚本。新数据库若已使用更新后的建表脚本，也可运行该汇总脚本补齐桌游专属表。
2. 启动现有 Spring 后端，保持 `/api/identity/me` 可用。
3. `cd game-service && npm ci`，设置 `GAME_DB_NAME`、`GAME_DB_USER`、`GAME_DB_PASSWORD`（或复用 `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD`），运行 `npm start`。默认仅监听 `127.0.0.1:3001`。
4. `cd reactproject && pnpm dev`；Vite 把 `/game-api`、`/game-client`、`/game-assets` 代理到桌游服务。

数据库也可用 `GAME_DB_HOST`、`GAME_DB_PORT` 配置；身份接口可用 `GAME_IDENTITY_URL` 配置。服务与 Spring 必须位于可信的同机网络，因为桌游服务通过 Cookie 向 Spring 验证登录态。生产反向代理示例已写入 `script/cdmga_nginx*.conf`。生产部署使用 `script/board-game.service` 与 `.github/workflows/game_update.yml`，按 [部署清单](../script/BOARD_GAME_DEPLOY.md) 先完成服务器准备和数据库迁移。桌游服务可通过 `GAME_CONTENT_DIR` 读取单独存储的卡牌文件；本地默认使用项目内的 `content/`。

`content/` 保存已发行卡牌 CSV 与 PNG，`public/` 保存游戏客户端与地图。原图、模板、制卡脚本保留在制卡项目，不从线上服务公开。更新卡牌时应同步 CSV 和同版 PNG，且在已有房间结束后再切换牌组版本。
课题详情的等待棋盘使用 `reactproject/public/board-game-map.svg`；修改 `public/map.svg` 时应同步该预览图。

## 验证

`npm test` 运行规则测试。`integration.local.js` 在已启动的本地 Spring/MySQL/桌游服务上测试账户、房间、权限、移动、日志及第二进程恢复；使用独立临时账户和课题，结束时清理测试数据。运行前设置 `SPRING_DATASOURCE_USERNAME` 和 `SPRING_DATASOURCE_PASSWORD`，当前脚本目标数据库为 `cdmga_dev`。
