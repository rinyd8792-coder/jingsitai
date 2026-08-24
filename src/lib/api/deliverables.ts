import { mockStore, delay } from './mock-store';
import type { IDeliverable } from '@/data/workspace';

export function fetchDeliverables(nodeId: string): Promise<IDeliverable[]> {
  return delay(mockStore.getDeliverables().filter((item) => item.nodeId === nodeId));
}

export function createDeliverable(data: Omit<IDeliverable, 'id'>): Promise<IDeliverable> {
  const list = mockStore.getDeliverables();
  const item: IDeliverable = {
    ...data,
    id: 'deliverable-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
  };
  list.push(item);
  mockStore.saveDeliverables(list);
  return delay(item);
}

export function updateDeliverable(id: string, data: Partial<IDeliverable>): Promise<IDeliverable> {
  const list = mockStore.getDeliverables();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return Promise.reject({ error: 'NotFound', message: '交付物不存在' });
  list[index] = { ...list[index], ...data };
  mockStore.saveDeliverables(list);
  return delay(list[index]);
}
