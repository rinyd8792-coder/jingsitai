# V0.2.5 火山方舟 Ark 补丁

新增一级 Provider：

- 火山方舟 Ark · 在线推理
- 火山方舟 Ark · Coding Plan

默认 Base URL：

在线推理
`https://ark.cn-beijing.volces.com/api/v3`

Coding Plan
`https://ark.cn-beijing.volces.com/api/coding/v3`

两者均复用 OpenAI-compatible adapter。

## 需要在 SettingsPage 中补两处

1. Provider 下拉会自动读取 PROVIDER_LABELS，所以替换 provider-defaults.ts / types.ts 后会自动出现。
2. 建议在 Model 输入框下方引入：

```tsx
import VolcengineHelp from './VolcengineHelp';

<VolcengineHelp provider={selected.provider} />
```

## Model
火山方舟的模型标识 / Endpoint ID 请以你自己的控制台实际配置为准，不在静思台里写死。

## 适用能力
- AI 任务拆节点
- 网页摘要
- 网页 → 待办判断
- Inbox 分类
- 后续 Scratchpad 复盘

所有这些能力继续走统一 AI Service，无需为火山再写一套业务逻辑。
