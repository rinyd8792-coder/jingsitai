import { mockStore, delay } from './mock-store';
import type { IInboxItem } from '@/data/workspace';

export function fetchInboxItems(status?: string): Promise<IInboxItem[]> {
  let list = mockStore.getInboxItems();
  if (status && status !== 'all') list = list.filter((i) => i.status === status);
  list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return delay(list);
}

export function createInboxItem(content: string, note?: string): Promise<IInboxItem> {
  const list = mockStore.getInboxItems();
  const newItem: IInboxItem = {
    id: `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    content,
    note: note || undefined,
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  list.unshift(newItem);
  mockStore.saveInboxItems(list);
  return delay(newItem);
}

export function processInboxItem(id: string): Promise<{ success: boolean }> {
  const list = mockStore.getInboxItems();
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return Promise.reject({ error: 'NotFound', message: '事项不存在' });
  list[idx] = { ...list[idx], status: 'processed' };
  mockStore.saveInboxItems(list);
  return delay({ success: true });
}

export function deleteInboxItem(id: string): Promise<{ success: boolean }> {
  const list = mockStore.getInboxItems().filter((i) => i.id !== id);
  mockStore.saveInboxItems(list);
  return delay({ success: true });
}
