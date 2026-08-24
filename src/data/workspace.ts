// 数据类型定义
export type ProjectCategory = 'work' | 'life' | 'family' | 'study';
export type ProjectStatus = 'active' | 'paused' | 'done' | 'archived';
export type TaskStatus = 'inbox' | 'next' | 'doing' | 'waiting' | 'done' | 'cancelled';
export type NodeStatus = 'pending' | 'doing' | 'done';
export type NodePriority = 'high' | 'medium' | 'low';
export type ScratchpadType = 'idea' | 'confirm' | 'todo' | 'question' | 'resource' | 'decision';

export interface IProject {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  createdAt: string;
}

export interface ITask {
  id: string;
  title: string;
  type: string;
  projectId: string | null;
  status: TaskStatus;
  deadline?: string;
  deliverable?: string;
  deliverTo?: string;
  completionCriteria?: string;
  waitingReason?: string;
  expectedResume?: string;
  nextAction?: string;
  createdAt: string;
}

export interface INode {
  id: string;
  name: string;
  taskId: string;
  status: NodeStatus;
  startTime: string;
  estimatedEndTime: string;
  actualEndTime?: string;
  output?: string;
  priority: NodePriority;
  order: number;
}

export interface IScratchpad {
  id: string;
  nodeId: string;
  content: string;
  type: ScratchpadType;
  createdAt: string;
}

export interface IInboxItem {
  id: string;
  content: string;
  note?: string;
  createdAt: string;
  status: 'active' | 'processed';
}

export interface ICurrentFocus {
  nodeId: string;
  taskId: string;
  startedAt: string;
  totalSeconds: number;
  elapsedSeconds: number;
  isPaused: boolean;
  pausedAt?: string;
}

// 今天的日期辅助
const today = new Date();
const dateStr = today.toISOString().split('T')[0];
function todayAt(hour: number, minute = 0) {
  return new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`).toISOString();
}

// Mock 数据
export const MOCK_PROJECTS: IProject[] = [
  {
    id: 'proj-001',
    name: 'XX产品口碑增长方案',
    description: '围绕产品口碑提升的完整方案制作与汇报',
    category: 'work',
    status: 'active',
    createdAt: '2026-08-20T09:00:00.000Z',
  },
  {
    id: 'proj-002',
    name: '个人学习计划',
    description: '整理学习资料并完成阶段性练习',
    category: 'work',
    status: 'active',
    createdAt: '2026-08-18T09:00:00.000Z',
  },
  {
    id: 'proj-003',
    name: '家庭规划',
    description: '家庭生活用品采购与日常事务管理',
    category: 'family',
    status: 'active',
    createdAt: '2026-08-15T09:00:00.000Z',
  },
];

export const MOCK_TASKS: ITask[] = [
  {
    id: 'task-001',
    title: '完成方案初稿',
    type: 'work',
    projectId: 'proj-001',
    status: 'doing',
    deadline: `${dateStr}T18:00:00.000Z`,
    deliverable: '方案PPT文档',
    deliverTo: '项目负责人',
    completionCriteria: '方案包含用户洞察、竞品分析、策略框架、执行计划四部分',
    createdAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'task-002',
    title: '整理学习笔记',
    type: 'work',
    projectId: 'proj-002',
    status: 'doing',
    deadline: '2026-08-30T18:00:00.000Z',
    deliverable: '结构化学习笔记',
    deliverTo: '自己',
    completionCriteria: '核心知识点整理完成，示例与总结齐全',
    createdAt: '2026-08-18T10:00:00.000Z',
  },
  {
    id: 'task-003',
    title: '补充日常用品',
    type: 'shopping',
    projectId: 'proj-003',
    status: 'next',
    deadline: '2026-08-28T18:00:00.000Z',
    deliverable: '日常用品清单',
    deliverTo: '自己',
    createdAt: '2026-08-22T10:00:00.000Z',
  },
  {
    id: 'task-004',
    title: '等待设计同事提供素材',
    type: 'person',
    projectId: 'proj-001',
    status: 'waiting',
    waitingReason: '等待设计同事提供品牌视觉素材',
    expectedResume: '2026-08-26T10:00:00.000Z',
    nextAction: '收到素材后整合到方案中',
    createdAt: '2026-08-23T10:00:00.000Z',
  },
  {
    id: 'task-005',
    title: '等待数据团队提供用户调研数据',
    type: 'data',
    projectId: 'proj-001',
    status: 'waiting',
    waitingReason: '等待数据团队导出最新用户调研数据',
    expectedResume: '2026-08-27T14:00:00.000Z',
    nextAction: '拿到数据后补充用户洞察部分',
    createdAt: '2026-08-23T11:00:00.000Z',
  },
];

export const MOCK_NODES: INode[] = [
  // 任务1：完成方案初稿
  { id: 'node-001', name: '用户洞察整理', taskId: 'task-001', status: 'done', startTime: todayAt(9, 0), estimatedEndTime: todayAt(10, 30), actualEndTime: todayAt(10, 20), priority: 'high', order: 1 },
  { id: 'node-002', name: '竞品分析', taskId: 'task-001', status: 'done', startTime: todayAt(10, 30), estimatedEndTime: todayAt(12, 0), actualEndTime: todayAt(11, 50), priority: 'high', order: 2 },
  { id: 'node-003', name: '策略框架搭建', taskId: 'task-001', status: 'doing', startTime: todayAt(14, 0), estimatedEndTime: todayAt(16, 0), priority: 'high', order: 3 },
  { id: 'node-004', name: 'PPT制作', taskId: 'task-001', status: 'pending', startTime: todayAt(16, 0), estimatedEndTime: todayAt(17, 30), priority: 'medium', order: 4 },
  { id: 'node-005', name: '汇报确认', taskId: 'task-001', status: 'pending', startTime: todayAt(17, 30), estimatedEndTime: todayAt(18, 0), priority: 'medium', order: 5 },
  // 任务2：整理学习笔记
  { id: 'node-006', name: '整理核心知识点', taskId: 'task-002', status: 'pending', startTime: todayAt(17, 30), estimatedEndTime: todayAt(18, 30), priority: 'high', order: 1 },
  { id: 'node-007', name: '统一笔记排版风格', taskId: 'task-002', status: 'pending', startTime: todayAt(19, 0), estimatedEndTime: todayAt(20, 0), priority: 'medium', order: 2 },
  { id: 'node-008', name: '补充练习示例', taskId: 'task-002', status: 'pending', startTime: todayAt(20, 0), estimatedEndTime: todayAt(20, 30), priority: 'low', order: 3 },
];

export const MOCK_SCRATCHPADS: IScratchpad[] = [
  { id: 'sp-001', nodeId: 'node-003', content: '策略框架可以参考AARRR模型，但需要结合口碑传播的特殊性', type: 'idea', createdAt: todayAt(14, 15) },
  { id: 'sp-002', nodeId: 'node-003', content: '需要确认竞品范围是3个还是5个', type: 'confirm', createdAt: todayAt(14, 30) },
  { id: 'sp-003', nodeId: 'node-003', content: '参考资料：行业口碑增长报告2026', type: 'resource', createdAt: todayAt(14, 45) },
  { id: 'sp-004', nodeId: 'node-003', content: '策略核心应该是"让用户愿意分享"而不是"强制传播"', type: 'decision', createdAt: todayAt(15, 0) },
  { id: 'sp-005', nodeId: 'node-003', content: '如何量化口碑增长效果？需要和数据团队对齐指标', type: 'question', createdAt: todayAt(15, 20) },
  { id: 'sp-006', nodeId: 'node-003', content: '下周一起草执行计划的时间节点', type: 'todo', createdAt: todayAt(15, 35) },
];

export const MOCK_INBOX_ITEMS: IInboxItem[] = [
  { id: 'inbox-001', content: '补充日常用品', note: '整理待购买清单', createdAt: todayAt(8, 30), status: 'active' },
  { id: 'inbox-002', content: '查看课程资料', note: '整理本周学习内容', createdAt: todayAt(9, 15), status: 'active' },
  { id: 'inbox-003', content: '保存网页', note: '一篇关于用户增长的好文', createdAt: todayAt(10, 0), status: 'active' },
  { id: 'inbox-004', content: '回复协作消息', note: '确认下周讨论时间', createdAt: todayAt(11, 30), status: 'active' },
  { id: 'inbox-005', content: '查看新品资料', note: '收集产品设计参考', createdAt: todayAt(12, 0), status: 'active' },
  { id: 'inbox-006', content: '安排下周事项', note: '确认时间并加入日历', createdAt: todayAt(13, 0), status: 'active' },
];

export const MOCK_CURRENT_FOCUS: ICurrentFocus = {
  nodeId: 'node-003',
  taskId: 'task-001',
  startedAt: todayAt(14, 0),
  totalSeconds: 7200, // 2小时
  elapsedSeconds: 1800, // 已过30分钟
  isPaused: false,
};
