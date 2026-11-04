# Vue3 / React 功能一致性审计

使用开源 **Playwright** 作为第三方浏览器引擎，逐路由对比：

- 页面是否可打开、React 是否新增控制台错误
- 页面标题/标题层级
- 按钮与链接控件
- 表单输入
- 表格行数
- 页面加载触发的 API 路径（ID 归一化）

## 运行

```bash
# Vue 临时起在 8081（跑完停掉）
cd vueproject && pnpm dev --port 8081 --host 127.0.0.1

# 另一个终端
cd reactproject
VUE_URL=http://localhost:8081 node scripts/parity-audit.mjs
```

报告输出：

- `ref/local/logs/parity-audit.json`
- `ref/local/logs/parity-audit.md`

8081 只用于审计，跑完必须停；日常只使用 5174 + 8080 + 本地 3307。

## 最近一次审计（32 路由）

- React 新增错误：0
- API 缺口：5
- 控件缺口：25（包含部分仅文案差异）

### 真实 API 缺口

- `/task/:id/bingo/:cellId`
  - 缺 `/api/score/history/bingo-issue`
- `/profile/:id`
  - 缺 `/api/activity/rated-activities/:id`
  - 缺 `/api/identity-extra-profile/user/:id/school`
  - 缺 `/api/score/user-award-redemptions`
- `/admin`
  - 缺 `/api/identity/allaccount`（后台总览没有用户统计）

### 需要人工确认的控件差异

- 首页/列表：`进入课题`、`进入活动` 等按钮在 React 采用不同标签或卡片链接
- 课题详情：`提交该课题成绩` 文案差异
- Bingo：`切换到全局记录`
- 个人主页：`设置个人资料`
- 个人设置：`选择并裁剪头像`
- 发布内容：`选择图片`
- Links：React 卡片把整张卡做成链接，审计器只能读到文字，造成误报

## 限制

- 这是功能/DOM/API 审计，不是像素级视觉对比。
- 动态课程/活动/帖子 ID 用固定测试数据。
- Button/link 文案不同但功能等价时会被记为差异，需要人工确认。
