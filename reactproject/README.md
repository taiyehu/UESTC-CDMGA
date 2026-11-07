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

`pnpm test:e2e` 运行 Playwright；部分用例是历史 Vue/React 对照，需启动两套前端。真实账号测试使用生成器提供的 `synthetic_admin` 和 `synthetic_member`，密码随机生成并保存在仓库外，见 [本地合成测试数据](../docs/Local_Test_Data.md)。

## 验证边界

当前 React 页面包括成绩提交、资料裁剪、论坛图片/附件与点赞举报等流程。历史迁移测试中的旧文案和固定数据断言不能代表当前全量功能已通过；以具体构建、自动化结果及真实账号回归报告为准。

## 设计规范

字号采用 `@dsh-ui/tokens`（DSH Design System）的 `xxxs-11 / xxs-12 / xs-13 / s-14 / base-16 / l-20 / xl-24` 字阶与行高，正文不低于 14px；首页大标题使用 Material 3 `displaySmall 36/44`，移动端 30/36。对应实现集中在 `src/styles.css` 末尾的 Typography layer。

## 本地测试数据

在仓库根目录运行 `bash script/synthetic-db.sh verify`，自动初始化 `127.0.0.1:13307/CDMGA_SYNTHETIC` 并生成纯虚构数据，再执行真实 HTTP 回归。此方案不导入任何生产或抓取的用户数据，且可重复运行。数据库、随机凭据和日志存放在仓库外；旧的依赖现存课题 ID 和用户密码的排名 SQL 已移除。
