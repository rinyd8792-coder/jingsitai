import {
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_NODES,
  MOCK_SCRATCHPADS,
  MOCK_INBOX_ITEMS,
  MOCK_CURRENT_FOCUS,
} from '@/data/workspace';
import type {
  IProject,
  ITask,
  INode,
  IScratchpad,
  IInboxItem,
  ICurrentFocus,
} from '@/data/workspace';

const KEYS = {
  projects: '__pew_projects',
  tasks: '__pew_tasks',
  nodes: '__pew_nodes',
  scratchpads: '__pew_scratchpads',
  inboxItems: '__pew_inbox_items',
  currentFocus: '__pew_current_focus',
  user: '__pew_user',
  seeded: '__pew_seeded',
};

function readList<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function writeList<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
}

function readItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
}

function ensureSeeded() {
  const seeded = localStorage.getItem(KEYS.seeded);
  if (seeded === '1') return;
  writeList(KEYS.projects, MOCK_PROJECTS);
  writeList(KEYS.tasks, MOCK_TASKS);
  writeList(KEYS.nodes, MOCK_NODES);
  writeList(KEYS.scratchpads, MOCK_SCRATCHPADS);
  writeList(KEYS.inboxItems, MOCK_INBOX_ITEMS);
  writeItem(KEYS.currentFocus, MOCK_CURRENT_FOCUS);
  localStorage.setItem(KEYS.seeded, '1');
}

function delay<T>(data: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const mockStore = {
  getProjects: (): IProject[] => { ensureSeeded(); return readList<IProject>(KEYS.projects, MOCK_PROJECTS); },
  saveProjects: (list: IProject[]) => writeList(KEYS.projects, list),
  getTasks: (): ITask[] => { ensureSeeded(); return readList<ITask>(KEYS.tasks, MOCK_TASKS); },
  saveTasks: (list: ITask[]) => writeList(KEYS.tasks, list),
  getNodes: (): INode[] => { ensureSeeded(); return readList<INode>(KEYS.nodes, MOCK_NODES); },
  saveNodes: (list: INode[]) => writeList(KEYS.nodes, list),
  getScratchpads: (): IScratchpad[] => { ensureSeeded(); return readList<IScratchpad>(KEYS.scratchpads, MOCK_SCRATCHPADS); },
  saveScratchpads: (list: IScratchpad[]) => writeList(KEYS.scratchpads, list),
  getInboxItems: (): IInboxItem[] => { ensureSeeded(); return readList<IInboxItem>(KEYS.inboxItems, MOCK_INBOX_ITEMS); },
  saveInboxItems: (list: IInboxItem[]) => writeList(KEYS.inboxItems, list),
  getCurrentFocus: (): ICurrentFocus | null => { ensureSeeded(); return readItem<ICurrentFocus | null>(KEYS.currentFocus, MOCK_CURRENT_FOCUS); },
  saveCurrentFocus: (focus: ICurrentFocus | null) => writeItem(KEYS.currentFocus, focus),
};

export { delay, ensureSeeded };
