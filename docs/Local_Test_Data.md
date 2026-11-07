---
title: 本地合成测试数据
nav_order: 3
parent: 开发
---

# 本地合成测试数据

本地回归使用程序生成的虚构数据。初始化和测试不会下载网页、访问生产数据库、读取旧本地库或导入用户数据。Git 只保存生成器、结构迁移和断言；数据库、密码、运行日志、截图和抓包文件留在仓库外或已忽略目录。

## 一键生成并验证

需要 Java 25、Maven，以及本机 MariaDB 的 `mariadbd`、`mariadb-install-db`、`mariadb` 和 OpenSSL。在仓库根目录执行：

```bash
bash script/synthetic-db.sh verify
```

脚本初始化独立实例 `127.0.0.1:13307/CDMGA_SYNTHETIC`，数据目录默认为 `$HOME/.local/share/cdmga-synthetic`（支持 `XDG_DATA_HOME`），目录权限 700、文件权限 600。数据库用户名固定为 `synthetic`，数据库密码和网站测试账号密码在首次运行时随机生成，分别保存在该目录的 `db-password`、`account-password`，不会写进 Git。

测试代码使用当前 JPA 实体生成数据库结构，并执行仓库中两个纯建表脚本补齐论坛和会话表。随后生成 15 个虚构账号（`synthetic_admin`、`synthetic_member`、`synthetic_user_3` 等）、个人资料、5 门课题、活动、25 个 Bingo 格子、队伍、已评分/待审核/已删除成绩、4 种等级称号、23 条帖子和 23 条评论。数据不含真实姓名、联系方式、头像或上传文件，课程和帖子均标为 Synthetic。

重复执行会识别合成库版本并复用测试数据，不清空数据库；发现未知账号或没有版本标记的已有账号时拒绝继续。代码中的数据库地址固定为本机 13307，只允许独立合成库，无法通过环境变量切到生产地址。

## 自动验证的行为

- 匿名访问受保护 API 返回 401，公开活动仍可读。
- 普通用户可查看其他账号公开资料和已评分成绩，待审核及已删除成绩不出现在公开结果中。
- 本人提交历史可读，他人提交历史及队伍私有面板返回 403。
- 普通用户请求用户/论坛/课题/审核/队伍管理 API 返回 403，管理员正常访问。
- 论坛列表每页 10 条，可读后续页和 23 条评论，支持真实发帖、评论及删除流程。
- 成绩提交使用 Session 中的操作者身份；伪造 `identity_id` 无法替他人提交。管理员可评分和删除，普通用户不能评分。
- 登录响应不含密码，Cookie 带 HttpOnly，退出后会话失效，非法来源写请求被拒绝。

完整结果保存在仓库外 `verification.log`，JUnit 报告在已忽略的 `webpage/target/surefire-reports/`。普通 `mvn test` 默认跳过此真实数据库测试；只有启动脚本设置显式开关时才执行。

## 启停与本地页面

```bash
bash script/synthetic-db.sh start
bash script/synthetic-db.sh seed
bash script/synthetic-db.sh serve
bash script/synthetic-db.sh stop
```

`seed` 同时执行 HTTP 回归。后端在测试中使用随机本机端口并在测试完成后关闭；数据库保留，需停止时执行 `stop`。首次 `verify` 成功后，`serve` 自动读取仓库外的密码，以 8080 端口启动只连接合成库的后端；同时覆盖上传目录到仓库外，无需改动已有 `application-local.properties`。另一个终端在 `reactproject/` 执行 `pnpm dev`，访问 `http://localhost:5174`。不要把生成的密码输出到共享日志。

生成器专用浏览器回归（需先启动 `serve` 与 React）：

```bash
export DSH_SYNTHETIC_ACCOUNT_PASSWORD="$(cat "${XDG_DATA_HOME:-$HOME/.local/share}/cdmga-synthetic/account-password")"
cd reactproject
pnpm exec playwright test tests/synthetic-accounts.spec.ts tests/admin-forum-local.spec.ts
unset DSH_SYNTHETIC_ACCOUNT_PASSWORD
```

该回归覆盖桌面 1440×900 和手机 390×844，使用真实合成账号登录、查看他人的公开资料和成绩、伪造前端角色后尝试进入后台，以及管理员正常访问管理页。旧版对照套件保留供迁移研究，其中部分依赖旧固定账号和页面文案；它们不能作为新生成器数据集的回归入口。

## 提交检查

```bash
node script/check-test-data.mjs
```

检查读取 Git 索引，拒绝已暂存的本地数据目录、数据库文件、压缩 SQL 导出、CSV/TSV、HAR、日志、会话状态、私密 local 配置及包含用户表字面量行的 SQL。GitHub Actions 运行同样检查。它不能判断每个普通字符串是否来自真实用户，也不能清除已经存在的 Git 历史；提交前仍需审查具体文件来源。历史数据库导出应由维护者安排历史清理，不能以当前版本删除文件代替。

本机启用提交前检查：`git config core.hooksPath .githooks`。若已配置自己的 hooks，先将该检查合并到现有流程。检查器的负向测试用 `node --test script/check-test-data.test.mjs` 运行，使用仓库外的独立 Git 索引，不修改真实暂存区。
