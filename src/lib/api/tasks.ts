import { mockStore, delay } from './mock-store';
import type { ITask } from '@/data/workspace';

export function fetchTasks(params?: { status?: string; projectId?: string }): Promise<ITask[]> {
  let list = mockStore.getTasks();
  if (params?.status && params.status !== 'all') list = list.filter((t) => t.status === params.status);
  if (params?.projectId) list = list.filter((t) => t.projectId === params.projectId);
  return delay(list);
}

export function fetchTask(id: string): Promise<ITask> {
  const task = mockStore.getTasks().find((t) => t.id === id);
  if (!task) return Promise.reject({ error: 'NotFound', message: '任务不存在' });
  return delay(task);
}

export function createTask(data: Partial<ITask> & { title: string }): Promise<ITask> {
  const list = mockStore.getTasks();
  const newItem: ITask = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: data.description || '',
    title: data.title,
    type: data.type || '',
    projectId: data.projectId ?? null,
    status: (data.status as ITask['status']) || 'next',
    deadline: data.deadline,
    deliverable: data.deliverable,
    currentNodeId: data.currentNodeId,
    receiver: data.receiver || data.deliverTo,
    url: data.url,
    createdTime: new Date().toISOString(),
    waitingObject: data.waitingObject,
    expectedResumeTime: data.expectedResumeTime || data.expectedResume,
    followUpAction: data.followUpAction || data.nextAction,
    deliverTo: data.deliverTo,
    completionCriteria: data.completionCriteria,
    createdAt: new Date().toISOString(),
  };
  list.unshift(newItem);
  mockStore.saveTasks(list);
  return delay(newItem);
}

export function updateTask(id: string, data: Partial<ITask>): Promise<ITask> {
  const list = mockStore.getTasks();
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return Promise.reject({ error: 'NotFound', message: '任务不存在' });
  list[idx] = { ...list[idx], ...data };
  mockStore.saveTasks(list);
  return delay(list[idx]);
}

export function deleteTask(id: string): Promise<{ success: boolean }> {
  const list = mockStore.getTasks().filter((t) => t.id !== id);
  mockStore.saveTasks(list);
  return delay({ success: true });
}

export function fetchWaitingTasks(category?: string): Promise<ITask[]> {
  let list = mockStore.getTasks().filter((t) => t.status === 'waiting');
  if (category && category !== 'all') list = list.filter((t) => t.type.includes(category));
  return delay(list);
}

export function resumeWaitingTask(taskId: string, targetStatus = 'next'): Promise<{ success: boolean; status: string }> {
  const list = mockStore.getTasks();
  const idx = list.findIndex((t) => t.id === taskId);
  if (idx === -1) return Promise.reject({ error: 'NotFound', message: '任务不存在' });

  const task = list[idx];
  const newStatus = targetStatus as ITask['status'];
  list[idx] = {
    ...task,
    status: newStatus,
    waitingReason: undefined,
    waitingObject: undefined,
    expectedResumeTime: undefined,
  };
  mockStore.saveTasks(list);

  // Waiting / Paused 节点恢复后回到“待执行”，由用户重新进入 Focus。
  if (task.currentNodeId) {
    const nodes = mockStore.getNodes();
    const nodeIndex = nodes.findIndex((node) => node.id === task.currentNodeId);
    if (nodeIndex !== -1 && (nodes[nodeIndex].status === 'waiting' || nodes[nodeIndex].status === 'paused')) {
      nodes[nodeIndex] = { ...nodes[nodeIndex], status: 'pending' };
      mockStore.saveNodes(nodes);
    }
  }

  return delay({ success: true, status: newStatus });
}
