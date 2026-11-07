# Vue ↔ React 等价性测试

## 当前本地数据入口

真实账号验证使用 [合成测试数据生成器](../../docs/Local_Test_Data.md)。在根目录执行 `bash script/synthetic-db.sh verify`，再启动 `bash script/synthetic-db.sh serve` 和 React 开发服务器。数据和密码全部在仓库外，禁止将抓取数据、数据库导出或已登录浏览器状态作为测试夹具提交。

生成器对应回归为 `synthetic-accounts.spec.ts`（桌面/手机登录、他人公开成绩、管理员守卫）和 `admin-forum-local.spec.ts`（合成管理员读取论坛）。通过 `DSH_SYNTHETIC_ACCOUNT_PASSWORD` 传入本机生成的密码，未提供时这些用例跳过。下面的 Vue/React 对照用例是历史套件，包含旧账号、旧页面文案和样例标题，需要维护后才能用于新数据集。

`parity.spec.ts` 证明迁移后的 **结构 / 行为 / 数据** 等价；首页是刻意重写，因此**不做像素相等断言**。

| 用例 | 断言 |
| --- | --- |
| `login structure + session parity` | 两端登录页都有 用户名/密码/登录/重置/立即注册；请求体相同；响应 `code=0`；`sessionStorage.userInfo` 存在；跳转 `/home` |
| `home data parity` | 两端首页都能看到同一课程「夜航星」与活动「月面 Live 第 12 期」 |
| `home API payload parity` | 两端请求的 `/api/course/standalone`、`/api/activity/list` 返回 JSON 深度相等 |
| `register structure parity` | 注册页字段/占位符/按钮一致 |
| `core pages data parity` | 两端 `/task`、`/activity`、`/forum`、`/profile` 都能看到同一测试数据 |
| `admin route guard parity` | 普通用户访问 `/admin/users` 都被送回 `/home` |
| `admin pages mount` | React 后台 12 个主页面挂载、无 pageerror，用户/课题/论坛/活动读到测试数据 |

截图保留在 `ref/local/shots/parity-{vue,react}-{login,home}.png`，供人工对比视觉。

## 为什么不做像素 diff

- 首页是重写（新视觉），像素必然不同。
- 登录页也按新设计调整了容器，但**表单语义、请求、会话、跳转**保持一致。
- 后续对「应保持原样」的页面（如后台列表）可追加 `toHaveScreenshot` 像素基线。

| `home controls are wired` | 课题/活动 tab、详情链接、论坛帖、快速入口、主题切换、签到和后台入口都可点击并到达目标 |
