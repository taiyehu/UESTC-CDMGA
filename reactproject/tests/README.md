# Vue ↔ React 等价性测试

`parity.spec.ts` 证明迁移后的 **结构 / 行为 / 数据** 等价；首页是刻意重写，因此**不做像素相等断言**。

| 用例 | 断言 |
| --- | --- |
| `login structure + session parity` | 两端登录页都有 用户名/密码/登录/重置/立即注册；请求体相同；响应 `code=0`；`sessionStorage.userInfo` 存在；跳转 `/home` |
| `home data parity` | 两端首页都能看到同一课程「夜航星」与活动「月面 Live 第 12 期」 |
| `home API payload parity` | 两端请求的 `/api/course/standalone`、`/api/activity/list` 返回 JSON 深度相等 |

截图保留在 `ref/local/shots/parity-{vue,react}-{login,home}.png`，供人工对比视觉。

## 为什么不做像素 diff

- 首页是重写（新视觉），像素必然不同。
- 登录页也按新设计调整了容器，但**表单语义、请求、会话、跳转**保持一致。
- 后续对「应保持原样」的页面（如后台列表）可追加 `toHaveScreenshot` 像素基线。
