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
    title: data.title,
    type: data.type || '',
    projectId: data.projectId ?? null,
    status: (data.status as ITask['status']) || 'next',
    deadline: data.deadline,
    deliverable: data.deliverable,
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
  const newStatus = targetStatus as ITask['status'];
  list[idx] = { ...list[idx], status: newStatus };
  mockStore.saveTasks(list);
  return delay({ success: true, status: newStatus });
}
