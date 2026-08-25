# 静思台 V0.2.2 待办入口修复补丁

本补丁解决“新建待办后不知道去哪里”的产品断点。

## 修改内容

1. 新增 `/tasks` 待办主页
2. 左侧导航新增「待办」
3. 顶部「新建任务」创建成功后自动跳转 `/tasks`
4. 待办页展示所有 Task，而不是只展示 Node
5. 无 Node 的简单事项可直接完成
6. 复杂事项点击「拆节点」进入原有 TaskDetailPage
7. Waiting 事项可从待办页快速恢复
8. 任务详情页在侧边栏归属「待办」，不再错误归属「长物」

## 产品逻辑

Capture → Task

- 简单事项 → 直接完成
- 复杂事项 → Node → Focus → Scratchpad → Review → Next

## 覆盖方式

将 ZIP 内 `src/` 对应文件覆盖到当前仓库，然后执行：

```bash
npm run typecheck
npm run build
```

确认通过后提交到 GitHub。
