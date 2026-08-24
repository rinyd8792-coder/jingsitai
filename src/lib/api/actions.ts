import { mockStore, delay } from './mock-store';
import type { IAction } from '@/data/workspace';

export function fetchActions(nodeId: string): Promise<IAction[]> {
  const list = mockStore.getActions()
    .filter((action) => action.nodeId === nodeId)
    .sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      return new Date(a.plannedTime || a.createdTime).getTime() - new Date(b.plannedTime || b.createdTime).getTime();
    });
  return delay(list);
}

export function createAction(nodeId: string, content: string, plannedTime?: string): Promise<IAction> {
  const list = mockStore.getActions();
  const action: IAction = {
    id: 'action-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    nodeId,
    content,
    plannedTime,
    status: 'pending',
    createdTime: new Date().toISOString(),
  };
  list.push(action);
  mockStore.saveActions(list);
  return delay(action);
}

export function updateAction(id: string, data: Partial<IAction>): Promise<IAction> {
  const list = mockStore.getActions();
  const index = list.findIndex((action) => action.id === id);
  if (index === -1) return Promise.reject({ error: 'NotFound', message: '下一动作不存在' });
  list[index] = { ...list[index], ...data };
  if (data.status === 'done' && !list[index].completedTime) list[index].completedTime = new Date().toISOString();
  mockStore.saveActions(list);
  return delay(list[index]);
}
