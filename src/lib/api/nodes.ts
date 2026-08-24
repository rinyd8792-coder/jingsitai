import { mockStore, delay } from './mock-store';
import type { INode } from '@/data/workspace';

export function fetchNodes(params?: { taskId?: string; date?: string }): Promise<INode[]> {
  let list = mockStore.getNodes();
  if (params?.taskId) list = list.filter((n) => n.taskId === params.taskId);
  if (params?.date) {
    list = list.filter((n) => {
      const startDate = new Date(n.startTime).toISOString().split('T')[0];
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
    taskId: data.taskId,
    status: (data.status as INode['status']) || 'pending',
    startTime: data.startTime,
    estimatedEndTime: data.estimatedEndTime,
    actualEndTime: data.actualEndTime,
    output: data.output,
    priority: (data.priority as INode['priority']) || 'medium',
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
  newFocus: {
    nodeId: string;
    taskId: string;
    startedAt: string;
    totalSeconds: number;
    elapsedSeconds: number;
    isPaused: boolean;
  } | null;
}

export function completeNode(id: string, _completion: 'done' | 'partial' = 'done'): Promise<CompleteNodeResult> {
  const nodes = mockStore.getNodes();
  const idx = nodes.findIndex((n) => n.id === id);
  if (idx === -1) return Promise.reject({ error: 'NotFound', message: '节点不存在' });

  nodes[idx] = { ...nodes[idx], status: 'done', actualEndTime: new Date().toISOString() };
  const currentTaskId = nodes[idx].taskId;
  const currentOrder = nodes[idx].order;

  const nextNode = nodes
    .filter((n) => n.taskId === currentTaskId && n.status === 'pending' && n.order > currentOrder)
    .sort((a, b) => a.order - b.order)[0];

  mockStore.saveNodes(nodes);

  const tasks = mockStore.getTasks();
  const taskIdx = tasks.findIndex((t) => t.id === currentTaskId);
  if (taskIdx !== -1) {
    const taskNodes = nodes.filter((n) => n.taskId === currentTaskId);
    const allDone = taskNodes.length > 0 && taskNodes.every((n) => n.status === 'done');
    if (allDone) {
      tasks[taskIdx] = { ...tasks[taskIdx], status: 'done' };
      mockStore.saveTasks(tasks);
    }
  }

  if (nextNode) {
    nextNode.status = 'doing';
    mockStore.saveNodes(nodes);
    const totalMs = new Date(nextNode.estimatedEndTime).getTime() - new Date(nextNode.startTime).getTime();
    const totalSeconds = Math.max(60, Math.floor(totalMs / 1000));
    const newFocus = {
      nodeId: nextNode.id,
      taskId: nextNode.taskId,
      startedAt: new Date().toISOString(),
      totalSeconds,
      elapsedSeconds: 0,
      isPaused: false,
    };
    mockStore.saveCurrentFocus(newFocus);
    return delay({ success: true, newFocus });
  }

  mockStore.saveCurrentFocus(null);
  return delay({ success: true, newFocus: null });
}
