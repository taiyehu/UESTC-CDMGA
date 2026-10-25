# Git 分支与 PR 快速流程

> 适用对象：刚开始参与协作、需要搞清楚「分支、push、PR、合并」这些概念的新人。  
> 本文在 [07-Git协作.md](07-Git协作.md) 的基础上，专门讲清楚几个最容易混的概念，以及一次完整任务从头到尾该怎么做。

## 一、先分清三个被混用的词

| 概念 | 一句话说明 | 覆盖范围 |
|---|---|---|
| `git push` | 把你的提交**上传到远程仓库** | 只是「搬运」，不等于合并 |
| PR（Pull Request） | 请求别人**把你的分支合并进目标分支** | 合并前要被审查 |
| `git merge` | 在**本地**把两个分支合并在一起 | 只影响你本地仓库 |

关键点：**push 不等于 merge，也不等于 PR 合并成功**。push 只是把自己的分支放到远程，让大家能看到；PR 才是「请别人审阅并合并」的入口；merge 是真正把代码合到一起的动作（可以是本地的，也可以是合并 PR 时远程发生的）。

## 二、push 和 PR 的区别

- **push**：`git push -u origin feat/xxx` 把本地分支 `feat/xxx` 上传到远程同名分支。它**不会**改动 `main`，也不会让任何人的代码被覆盖。
- **PR**：在 GitHub 上发起 Pull Request，表示「我想把 `feat/xxx` 合入 `main`」。此时代码**还没进 main**，需要有人 review、通过 CI、approve 后才合并。
- 一句话：**push 是「交作业到仓库」，PR 是「请老师把作业合并进正式版」**。push 完成后，GitHub 通常会提示你打开 PR 页面。

## 三、fetch 和 merge 的区别

- **`git pull` = `git fetch` + `git merge`**，是两个动作连在一起。
- **fetch**：只把远程的新提交**下载到本地**，比如更新 `origin/main` 的引用，**不碰你正在写的工作区和当前分支**。可以放心反复执行。
- **merge**：把另一个分支（如 `origin/main`）**合进你当前所在分支**，会改动你的工作目录和分支历史，可能产生冲突。

安全做法：把 pull 拆成两步——

```powershell
git fetch origin        # 只下载，不动当前分支
git merge origin/main   # 明确地把远程 main 合进当前分支
```

这样在 merge 之前，你可以先 `git log origin/main`、`git diff origin/main` 看清楚远程多了什么，再决定怎么合并。

## 四、如何分清不同分支

本仓库常见分支（可用 `git branch -a` 查看）：

| 分支 | 作用 | 能否直接开发 |
|---|---|---|
| `main` | 生产发布分支，远程默认分支 | ❌ 禁止直接改 |
| `dev` | 开发分支，当前会部署开发前端 | ❌ 禁止直接在上面试验 |
| `feat/xxx` / `fix/xxx` / `docs/xxx` | 你的任务分支 | ✅ 在这里开发 |

分清「你现在在哪个分支」：

```powershell
git branch            # 前面带 * 的就是当前分支
git status            # 第一行会写 On branch xxx
```

分清「本地分支」和「远程分支」：`git branch -a` 里，`remotes/origin/...` 开头的是远程分支（远程仓库上的状态），不带前缀的是本地分支。`origin/main` 表示「你本地保存的、远程 main 的最新样子」，它只有在你 `git fetch` 之后才是最新的。

分支命名约定：一项任务一个短分支，例如 `feat/course-filter`、`fix/upload-size`、`docs/onboarding`。

## 五、PR 应该从哪个分支推到哪个分支

- **推送方向**：把你本地的任务分支推到**远程同名分支**。

  ```powershell
  git push -u origin feat/course-filter
  ```

  这里 `origin feat/course-filter` 意思是：推到远程仓库 `origin` 的 `feat/course-filter` 分支。

- **PR 合并方向**：在 GitHub 上创建 PR 时，选择

  - **base（目标、要合并进的分支）**：`main`
  - **compare（来源、你的分支）**：`feat/course-filter`

  也就是 **`feat/course-filter` → `main`**。默认 base 通常是 `main`，但提交前务必点开 PR 页面确认，不要误选成 `dev` 或别人的分支。

- **不是**把 `main` 推到 `main`，也不是把你的分支推到 `main`（push 只推到同名分支，不会直接进 main）。

## 六、一次完整任务流程

### 1. 开始：从最新的 main 切新分支

```powershell
git status                     # 先确认没有陌生改动
git switch main
git pull --ff-only             # 只做快进，避免无意制造合并提交
git switch -c feat/course-filter
```

> 如果 `git status` 有看不懂的改动，先问改动者，不要清理或覆盖。

### 2. 开发：小步提交

```powershell
git status
git diff                        # 逐行看改动
git add 具体文件路径             # 不要习惯性 git add .
git diff --staged
git commit -m "feat: 增加课题筛选"
```

常用前缀：`feat`（新功能）、`fix`（修复）、`docs`（文档）、`refactor`（重构）、`test`（测试）、`chore`（工具配置）。

### 3. 测试

改前端（`vueproject`）：

```powershell
cd vueproject
pnpm install
pnpm build
pnpm dev            # 浏览器打开 http://localhost:8081 手测
```

改后端（`webpage`）：

```powershell
cd webpage
.\mvnw.cmd test     # Windows；Linux 用 ./mvnw test
```

手测至少覆盖：正常流程、失败/空数据、权限、重复点击。

### 4. 推送

```powershell
git push -u origin feat/course-filter
```

### 5. 发起 PR

在 GitHub 上打开 PR，确认 base 是 `main`、compare 是 `feat/course-filter`，并写清：
- 背景与改动
- 验证命令（上面的 build / test）
- 手测结果、截图
- 风险与回滚方案

> 涉及数据库改动必须附迁移与回滚；涉及生产配置不得粘贴任何秘密。

### 6. 处理冲突（如果有）

```powershell
git fetch origin        # 先下载远程最新
git merge origin/main   # 再把远程 main 合进当前分支
```

编辑 `<<<<<<<` / `=======` / `>>>>>>>` 冲突标记，理解双方意图后保留正确内容，再重新构建和测试。看不懂不要选「全部接受」。

## 七、安全底线

- 禁止对共享分支使用 `git reset --hard`、强制推送、删别人分支。
- 已共享的提交想改，优先 `git revert <commit>`。
- `application.properties`、`sql_script/CDMGA.sql` 是敏感文件，不要用 `git add .` 顺手提交。
- 提交前可检查：

  ```powershell
  git status --short
  git diff --check
  git diff --staged
  ```
