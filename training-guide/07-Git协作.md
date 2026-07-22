# Git 协作：不会丢代码的最小流程

## 基本规则

- `main` 是生产发布分支，`dev` 当前会部署开发前端；不要直接在两者上试验。
- 一项任务一个短分支，例如 `feat/course-filter`、`fix/upload-size`、`docs/onboarding`。
- 提交前看 `git status` 和 `git diff`，不提交密码、生产数据、构建产物和无关文件。
- 小步提交，消息说明“做了什么及为什么”，不要写“update”。

## 开始任务

```powershell
git status
git switch main
git pull --ff-only
git switch -c feat/<简短任务名>
```

如果 `git status` 已有不认识的改动，不要清理或覆盖，先询问改动者。`git pull --ff-only` 避免新人无意制造合并提交。

## 开发中保存

```powershell
git status
git diff
git add <明确的文件路径>
git diff --staged
git commit -m "feat: 增加课题筛选"
```

不要习惯性 `git add .`。常用提交前缀：`feat` 新功能、`fix` 修复、`docs` 文档、`refactor` 重构、`test` 测试、`chore` 工具配置。

## 推送和 Pull Request

```powershell
git push -u origin feat/<简短任务名>
```

PR 写清背景、改动、验证命令、手测结果、截图、风险和回滚方案。涉及数据库必须附迁移与回滚；涉及生产配置不得粘贴秘密。

## 安全处理冲突

先提交自己的工作，再更新主分支：

```powershell
git fetch origin
git merge origin/main
```

编辑冲突标记 `<<<<<<<`、`=======`、`>>>>>>>`，理解双方意图后保留正确内容，再构建和测试。看不懂不要选择“全部接受”。

## 撤销但不破坏他人改动

- 未暂存文件：手工编辑回去，或确认文件只有自己的改动后用 `git restore <文件>`。
- 已暂存：`git restore --staged <文件>` 只取消暂存。
- 已共享提交：优先 `git revert <提交>` 生成反向提交。
- 禁止新人对共享分支使用 `git reset --hard`、强制推送或删除别人分支。

## 本仓库特别注意

`application.properties` 虽在 `.gitignore` 中，但已有敏感配置出现在工作区/历史的迹象；忽略文件不等于秘密安全。`sql_script/CDMGA.sql` 当前是未跟踪完整导出且含实际数据，不应顺手加入提交。提交前可检查：

```powershell
git status --short
git diff --check
git diff --staged
```

