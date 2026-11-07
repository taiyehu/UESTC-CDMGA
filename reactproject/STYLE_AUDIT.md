# 页面风格审计（当前分支 react）

生成依据：路由、页面入口组件、页面级 CSS、内联样式、共享 shell。不是截图判断。

## 结论

当前分支已没有 `FaithfulShell` 页面，但仍有 **混合视觉**：

- 统一的新视觉 shell：PageShell + `page-card/page-btn/page-table` + 新首页
- 独立新视觉页面：Home / Login / Register
- 混合页面：Bingo 总览、Bingo 详情、后台侧栏、部分 Sign 页面
- 这些混合页虽然不再是旧 faithful 布局，但颜色/内联样式仍来自旧组件，必须统一

## 页面清单

| 页面 | 当前入口 | 风格状态 |
|---|---|---|
| HomePage | 独立 `.home` | 新视觉（新首页） |
| LoginPage | 独立 login | 新视觉 |
| RegisterPage | 独立 | 新视觉 |
| TaskListPage | PageShell | 新视觉 shell，待逐页细节复核 |
| TaskDetailPage | PageShell | 新视觉 shell，typical 内容已接 |
| TaskBingoDetailPage | PageShell + 内联 TEAM/格子色 | **混合，优先统一** |
| TaskBingoOverview | 独立 BingoOverview.css | **混合，组件已共享但样式需并入新系统** |
| ActivityListPage | PageShell | 新视觉 shell |
| ActivityDetailPage | PageShell | 新视觉 shell |
| RankingPage | PageShell | 新视觉（含赛季/头像/副榜） |
| RankingNewPage | PageShell | 新视觉（历史/展开） |
| ContestRankingPage | PageShell | 新视觉 |
| ForumPage | PageShell + ForumPage.css | 新视觉 shell，列表已重写 |
| ForumPostPage | PageShell + ForumPage.css | 新视觉 shell，详情仍是简化版 |
| ProfilePage | PageShell | 新视觉 |
| ProfileSettingPage | PageShell | 新视觉 |
| LinksPage | PageShell | 新视觉 |
| SignCheckinPage | PageShell | 新视觉 shell |
| SignDisplayPage | 独立内联样式 | **混合，需改新视觉** |
| SignScannerPage | 独立内联样式 | **混合，需改新视觉** |
| AdminDashboardPage | PageShell + AdminSidebar | 新视觉 |
| 15 个 Admin 功能页 | PageShell + AdminSidebar | 新视觉 shell，表格/表单细节待统一 |
| NotFoundPage | 独立 | 新视觉 |

## 需要先统一的部分

1. 去掉 BingoDetail 的内联颜色，全部使用 `BingoGrid` + 统一 token。
2. BingoOverview 的 CSS 并入全局新视觉层，只保留格子布局隔离。
3. SignDisplay / SignScanner 的内联旧色改为统一样式。
4. ForumPost 详情的图片/点赞/回复沿用列表的新视觉。
5. 后台表格、分页、弹窗统一到同一套 surface/edge。
6. 顶栏统一：Home 使用自己的品牌区；其他页面使用同一个 `PageShell/AdminSidebar`，不再出现旧 Navbar 与页面顶栏叠加。

## 验证方式

- 按路由遍历，检查每个页面的 shell/侧栏/主题类。
- 不用截图判断新旧，按源码和 DOM 判断。
