import { mockStore, delay } from './mock-store';
import type { IScratchpad, ScratchpadType } from '@/data/workspace';

export function fetchScratchpads(nodeId: string): Promise<IScratchpad[]> {
  const list = mockStore
    .getScratchpads()
    .filter((s) => s.nodeId === nodeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return delay(list);
}

export function createScratchpad(nodeId: string, content: string, type: ScratchpadType): Promise<IScratchpad> {
  const list = mockStore.getScratchpads();
  const newItem: IScratchpad = {
    id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nodeId,
    content,
    type,
    createdAt: new Date().toISOString(),
  };
  list.unshift(newItem);
  mockStore.saveScratchpads(list);
  return delay(newItem);
}

export function deleteScratchpad(id: string): Promise<{ success: boolean }> {
  const list = mockStore.getScratchpads().filter((s) => s.id !== id);
  mockStore.saveScratchpads(list);
  return delay({ success: true });
}
