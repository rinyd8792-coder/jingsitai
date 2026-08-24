# 静思台 · 个人执行工作台

> 一座安静的书房 · 时间为柴，自然作料

一个帮助人同时管理多线程人生，但每个时刻只专注执行一个线程的智能工作台。
## V0.2 升级

- Action：每个执行中的节点都可以维护明确的下一动作
- Deliverable：把输出、交付对象、截止时间与节点绑定
- Node Review：节点结束时记录状态、输出、遗留问题与继续时间
- Task Execution Map：从项目进入任务，查看 Node → Action → Deliverable 全链路
- Waiting：按等待对象、恢复时间与跟进动作管理外部依赖
- 时间复盘：同时展示计划耗时、实际耗时和延期原因
- 本地数据会从 V0.1 自动迁移到 V0.2，不会主动清空


## 核心理念

Capture → Plan → Focus → Think → Deliver → Review → Next

- **当下 (NOW)**：当前正在执行的一件事情，专注计时器 + 思考记录
- **拾思 (Inbox)**：所有未整理信息的收件箱
- **今日 (Today)**：当天需要推进的节点时间线
- **待续 (Waiting)**：暂时挂起的事项管理
- **长物 (Projects)**：长期项目的全景管理

## 技术栈

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- React Router 7
- Lucide React 图标
- Sonner 通知

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run typecheck
```

## 演示账号

- 用户名：`demo`
- 密码：`demo123456`

## 数据存储

当前版本使用浏览器 localStorage 进行数据持久化，所有数据保存在用户本地浏览器中。
本项目不会上传这些数据；请勿使用与其他网站相同的真实密码。

## 项目结构

```
src/
├── components/          # 通用组件
│   ├── AppSidebar.tsx   # 侧边导航
│   └── Layout.tsx       # 布局组件
├── context/             # React Context
│   ├── AuthContext.tsx  # 认证状态
│   └── WorkspaceContext.tsx  # 工作区状态
├── data/
│   └── workspace.ts     # 数据类型定义 + Mock 数据
├── lib/
│   ├── utils.ts         # 工具函数
│   └── api/             # API 层（localStorage 实现）
│       ├── auth.ts
│       ├── focus.ts
│       ├── inbox.ts
│       ├── mock-store.ts
│       ├── nodes.ts
│       ├── projects.ts
│       ├── scratchpads.ts
│       └── tasks.ts
└── pages/               # 页面组件
    ├── LoginPage/
    ├── NowPage/
    ├── InboxPage/
    ├── TodayPage/
    ├── WaitingPage/
    ├── ProjectsPage/
    └── NotFoundPage/
```

## 设计风格

参考观夏（to summer）品牌的东方极简美学：
- 宣纸米白背景 + 植物绿主色 + 暖赭石点缀
- 莫兰迪低饱和度色系
- 大量留白，呼吸感
- 东方意象命名（当下/拾思/今日/待续/长物）
