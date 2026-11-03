# Vue 3 → React 迁移与等价性验证

## 工具链

- 源项目：`vueproject`（Vue 3 + Vite + Element Plus + Pinia + vue-router）
- 目标项目：`reactproject`（React 19 + Vite）
- 迁移项目：`@jianger666/vue-to-react-mcp@1.0.7`
  - 配置见 `mcp.json`
  - 工作流：`get_from_application` → 分析 Vue 页面及依赖 → `migrate_page` → 实现 → `save_ai_baseline` → `learn_from_changes`
  - 任务/基线产物在 `.ai-baseline/`（不提交）
  - MCP 分析结果留档在 `ref/migration/vue-to-react-mcp/`（本地，不提交）

不使用 `vue-to-react` / `vue2react`：它们只支持 Vue 2，会丢失 `v-for`、`<script setup>`。Veaury 仅作为互操作桥，不作为迁移工具。

## 页面等价性

已按页面组完成并验证：

- 认证：登录、注册、会话、后台守卫
- 首页、课题列表、课题详情、typical 子课题、成绩提交/历史/更新
- Bingo：棋盘 25 格、格子切换、完整 Bingo 工作区
- 活动、现场展示、扫码签到、签到核验
- 排行：赛季、并列名次、头像、分页、打榜/比赛副榜、详细榜
- 论坛：排序、我的帖子、点赞、举报、图片、附件、帖子编辑/删除、回复点赞/举报/删除
- 个人：资料、称号、成绩、编辑资料/申请称号入口、头像裁剪
- 后台：总览 + 15 个管理模块，资料/内容/成绩/Bingo/提示/Issue/队伍/排行/日志/称号/论坛/用户/课程/活动动作

## 等价性验证方式

- 使用 Playwright DOM/行为测试，不使用截图或多模态判断。
- 对 Vue 与 React 的关键页面做结构/数据/API 载荷对照，例如：
  - 登录结构与会话
  - 首页数据与 API 载荷
  - 课题、活动、论坛、排行、个人资料、后台动作
- 测试命令：`cd reactproject && pnpm test:e2e`
- 测试文件位于 `reactproject/tests/`；当前全量 45+ 用例。

## 新视觉约束

- 保留现有 `PageShell`、`page-card`、`page-btn`、毛玻璃/暗色卡片和 `@dsh-ui/tokens`。
- 功能补充沿用新视觉，不回退原 Vue/AntD 视觉。
- 不覆盖已完成的首页、登录、个人视觉重构。
