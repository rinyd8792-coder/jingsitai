import { mockStore, delay } from './mock-store';
import type { INode, NodeCompletionInput } from '@/data/workspace';
import { localDateKey } from '@/lib/utils';

export function fetchNodes(params?: { taskId?: string; date?: string }): Promise<INode[]> {
  let list = mockStore.getNodes();
  if (params?.taskId) list = list.filter((n) => n.taskId === params.taskId);
  if (params?.date) {
    list = list.filter((n) => {
      const startDate = localDateKey(n.plannedStartTime || n.startTime);
      return startDate === params.date;
    });
  }
  return delay(list);
}

export function fetchNode(id: string): Promise<INode> {
  const node = mockStore.getNodes().find((n) => n.id === id);
  if (!node) return Promise.reject({ error: 'NotFound', message: '节点不存在' });
  return delay(node);
}

export function createNode(data: Partial<INode> & { name: string; taskId: string; startTime: string; estimatedEndTime: string }): Promise<INode> {
  const list = mockStore.getNodes();
  const newItem: INode = {
    id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name,
    title: data.title || data.name,
    taskId: data.taskId,
    status: (data.status as INode['status']) || 'pending',
    startTime: data.startTime,
    estimatedEndTime: data.estimatedEndTime,
    plannedStartTime: data.plannedStartTime || data.startTime,
    plannedEndTime: data.plannedEndTime || data.estimatedEndTime,
    actualStartTime: data.actualStartTime,
    actualEndTime: data.actualEndTime,
    output: data.output,
    priority: (data.priority as INode['priority']) || 'medium',
    unresolved: data.unresolved,
    delayReason: data.delayReason,
    order: data.order ?? 0,
  };
  list.push(newItem);
  mockStore.saveNodes(list);
  return delay(newItem);
}

export function updateNode(id: string, data: Partial<INode>): Promise<INode> {
  const list = mockStore.getNodes();
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return Promise.reject({ error: 'NotFound', message: '节点不存在' });
  list[idx] = { ...list[idx], ...data };
  mockStore.saveNodes(list);
  return delay(list[idx]);
}

export function deleteNode(id: string): Promise<{ success: boolean }> {
  const list = mockStore.getNodes().filter((n) => n.id !== id);
  mockStore.saveNodes(list);
  return delay({ success: true });
}

export interface CompleteNodeResult {
  success: boolean;
  reviewId: string;
  newFocus: {
    nodeId: string;
    taskId: string;
    startedAt: string;
    totalSeconds: number;
    elapsedSeconds: number;
    isPaused: boolean;
  } | null;
}

function nodeDurationSeconds(node: INode) {
  const start = new Date(node.plannedStartTime || node.startTime).getTime();
  const end = new Date(node.plannedEndTime || node.estimatedEndTime).getTime();
  return Math.max(60, Math.floor((end - start) / 1000));
}

export function completeNode(id: string, input: NodeCompletionInput): Promise<CompleteNodeResult> {
  const nodes = mockStore.getNodes();
  const index = nodes.findIndex((node) => node.id === id);
  if (index === -1) return Promise.reject({ error: 'NotFound', message: '节点不存在' });

  const now = new Date().toISOString();
  const current = nodes[index];
  const shouldAdvance = input.status === 'done' || input.status === 'abandoned';
  const originalDurationMs = Math.max(
    60_000,
    new Date(current.plannedEndTime || current.estimatedEndTime).getTime()
      - new Date(current.plannedStartTime || current.startTime).getTime(),
  );

  let plannedStartTime = current.plannedStartTime || current.startTime;
  let plannedEndTime = current.plannedEndTime || current.estimatedEndTime;
  if (!shouldAdvance && input.continueTime) {
    const resumeAt = new Date(input.continueTime);
    if (!Number.isNaN(resumeAt.getTime())) {
      plannedStartTime = resumeAt.toISOString();
      plannedEndTime = new Date(resumeAt.getTime() + originalDurationMs).toISOString();
    }
  }

  nodes[index] = {
    ...current,
    status: input.status,
    actualEndTime: shouldAdvance ? now : current.actualEndTime,
    output: input.output || current.output,
    unresolved: input.unresolved || current.unresolved,
    delayReason: input.status === 'partial' ? input.unresolved : current.delayReason,
    plannedStartTime,
    plannedEndTime,
  };

  const nextNode = shouldAdvance
    ? nodes
        .filter((node) => node.taskId === current.taskId && node.status === 'pending' && node.order > current.order)
        .sort((a, b) => a.order - b.order)[0]
    : undefined;

  if (nextNode) {
    nextNode.status = 'doing';
    nextNode.actualStartTime = now;
  }
  mockStore.saveNodes(nodes);

  const reviewId = 'review-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  const reviews = mockStore.getReviews();
  reviews.unshift({
    id: reviewId,
    nodeId: id,
    status: input.status,
    output: input.output,
    unresolved: input.unresolved,
    nextAction: input.nextAction,
    continueTime: input.continueTime,
    createdTime: now,
  });
  mockStore.saveReviews(reviews);

  if (input.nextAction?.trim()) {
    const actions = mockStore.getActions();
    actions.push({
      id: 'action-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      nodeId: nextNode?.id || id,
      content: input.nextAction.trim(),
      plannedTime: input.continueTime,
      status: 'pending',
      createdTime: now,
    });
    mockStore.saveActions(actions);
  }

  const tasks = mockStore.getTasks();
  const taskIndex = tasks.findIndex((task) => task.id === current.taskId);
  if (taskIndex !== -1) {
    const taskNodes = nodes.filter((node) => node.taskId === current.taskId);
    const allFinished = taskNodes.length > 0 && taskNodes.every((node) => node.status === 'done' || node.status === 'abandoned');
    const taskStatus = input.status === 'waiting' || input.status === 'paused'
      ? 'waiting'
      : input.status === 'partial'
        ? 'next'
        : allFinished
          ? 'done'
          : 'doing';
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      status: taskStatus,
      currentNodeId: nextNode?.id || id,
      waitingObject: input.status === 'waiting' || input.status === 'paused'
        ? (input.waitingObject || tasks[taskIndex].waitingObject)
        : undefined,
      expectedResumeTime: input.continueTime || tasks[taskIndex].expectedResumeTime,
      followUpAction: input.nextAction || tasks[taskIndex].followUpAction,
    };
    mockStore.saveTasks(tasks);
  }

  if (nextNode) {
    const newFocus = {
      nodeId: nextNode.id,
      taskId: nextNode.taskId,
      startedAt: now,
      totalSeconds: nodeDurationSeconds(nextNode),
      elapsedSeconds: 0,
      isPaused: false,
    };
    mockStore.saveCurrentFocus(newFocus);
    return delay({ success: true, reviewId, newFocus });
  }

  // 部分完成 / 等待 / 暂停都先退出 NOW，保留当前节点，等待继续时间重新进入。
  mockStore.saveCurrentFocus(null);
  return delay({ success: true, reviewId, newFocus: null });
}
