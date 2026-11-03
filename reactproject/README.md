# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## 路由覆盖（第二批后）

- 公开：`/`、`/home`、`/login`、`/register`
- 课题：`/task`、`/awards`、`/task/:id`、`/task/:id/bingo/:cellId`
- 活动：`/activity`、`/activity/:id`、`/activity/:id/sign-display`、`/sign/:activityId`、`/scan`
- 排行：`/ranking`、`/ranking-new`、`/contest-ranking`
- 社区：`/forum`、`/forum/:id`、`/profile/:id?`、`/profile-setting`
- 其他：`/links`、404
- 后台：`/admin/users|courses|content-publish|activities|forum|profiles|profiles-passed|titles|bingo-submissions|scores|rank-configs|score-logs|bingo-tips|issues|teams`

## 测试

`pnpm test:e2e` 目前 7 个用例：登录结构/接口/会话、首页数据、首页 API 载荷、注册结构、核心页数据、后台守卫、后台页面挂载与数据。后台冒烟使用本地账号 `admin / test123456`（仅测试库）。

## 已知功能差距（不是路由缺口）

- 普通课题的成绩提交/审核完整流程仍偏简化；Bingo 详情已有提交入口。
- 个人资料的裁剪器未迁（改为 canvas 缩放）。
- 论坛图片/附件、点赞/举报的完整交互未全部迁。
- 后台页面已可挂载和读写主要数据，但 Element Plus 的弹窗/批量交互被简化。
