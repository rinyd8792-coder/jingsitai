import { mockStore, delay } from './mock-store';
import type { IProject } from '@/data/workspace';

export function fetchProjects(): Promise<IProject[]> {
  return delay(mockStore.getProjects());
}

export function fetchProjectDetail(id: string): Promise<IProject & { tasks: unknown[] }> {
  const project = mockStore.getProjects().find((p) => p.id === id);
  if (!project) return Promise.reject({ error: 'NotFound', message: '项目不存在' });
  const tasks = mockStore.getTasks().filter((t) => t.projectId === id);
  return delay({ ...project, tasks });
}

export function createProject(data: { name: string; description?: string; category?: string; status?: string }): Promise<IProject> {
  const list = mockStore.getProjects();
  const newItem: IProject = {
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name,
    description: data.description || '',
    category: (data.category as IProject['category']) || 'work',
    status: (data.status as IProject['status']) || 'active',
    createdAt: new Date().toISOString(),
    createdTime: new Date().toISOString(),
  };
  list.unshift(newItem);
  mockStore.saveProjects(list);
  return delay(newItem);
}

export function updateProject(id: string, data: Partial<IProject>): Promise<IProject> {
  const list = mockStore.getProjects();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return Promise.reject({ error: 'NotFound', message: '项目不存在' });
  list[idx] = { ...list[idx], ...data };
  mockStore.saveProjects(list);
  return delay(list[idx]);
}

export function deleteProject(id: string): Promise<{ success: boolean }> {
  const list = mockStore.getProjects().filter((p) => p.id !== id);
  mockStore.saveProjects(list);
  return delay({ success: true });
}
