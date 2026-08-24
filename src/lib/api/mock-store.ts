import {
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_NODES,
  MOCK_SCRATCHPADS,
  MOCK_ACTIONS,
  MOCK_DELIVERABLES,
  MOCK_REVIEWS,
  MOCK_INBOX_ITEMS,
  MOCK_CURRENT_FOCUS,
} from '@/data/workspace';
import type {
  IProject,
  ITask,
  INode,
  IScratchpad,
  IAction,
  IDeliverable,
  INodeReview,
  IInboxItem,
  ICurrentFocus,
} from '@/data/workspace';

const KEYS = {
  projects: '__pew_projects',
  tasks: '__pew_tasks',
  nodes: '__pew_nodes',
  scratchpads: '__pew_scratchpads',
  actions: '__pew_actions',
  deliverables: '__pew_deliverables',
  reviews: '__pew_reviews',
  inboxItems: '__pew_inbox_items',
  currentFocus: '__pew_current_focus',
  user: '__pew_user',
  seeded: '__pew_seeded',
  version: '__pew_data_version',
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
  if (seeded !== '1') {
    writeList(KEYS.projects, MOCK_PROJECTS);
    writeList(KEYS.tasks, MOCK_TASKS);
    writeList(KEYS.nodes, MOCK_NODES);
    writeList(KEYS.scratchpads, MOCK_SCRATCHPADS);
    writeList(KEYS.actions, MOCK_ACTIONS);
    writeList(KEYS.deliverables, MOCK_DELIVERABLES);
    writeList(KEYS.reviews, MOCK_REVIEWS);
    writeList(KEYS.inboxItems, MOCK_INBOX_ITEMS);
    writeItem(KEYS.currentFocus, MOCK_CURRENT_FOCUS);
    localStorage.setItem(KEYS.seeded, '1');
  }

  if (localStorage.getItem(KEYS.version) === '2') return;

  const nodes = readList<INode>(KEYS.nodes, MOCK_NODES).map((node) => ({
    ...node,
    title: node.title || node.name,
    plannedStartTime: node.plannedStartTime || node.startTime,
    plannedEndTime: node.plannedEndTime || node.estimatedEndTime,
    actualStartTime: node.actualStartTime || (node.status !== 'pending' ? node.startTime : undefined),
  }));
  const tasks = readList<ITask>(KEYS.tasks, MOCK_TASKS).map((task) => {
    const taskNodes = nodes.filter((node) => node.taskId === task.id).sort((a, b) => a.order - b.order);
    const currentNode = taskNodes.find((node) => node.status === 'doing') || taskNodes.find((node) => node.status === 'pending');
    return {
      ...task,
      description: task.description || task.completionCriteria || '',
      currentNodeId: task.currentNodeId || currentNode?.id,
      receiver: task.receiver || task.deliverTo,
      createdTime: task.createdTime || task.createdAt,
      waitingObject: task.waitingObject || (task.status === 'waiting' ? '外部协作者' : undefined),
      expectedResumeTime: task.expectedResumeTime || task.expectedResume,
      followUpAction: task.followUpAction || task.nextAction,
    };
  });
  const projects = readList<IProject>(KEYS.projects, MOCK_PROJECTS).map((project) => ({
    ...project,
    createdTime: project.createdTime || project.createdAt,
  }));
  const scratchpads = readList<IScratchpad>(KEYS.scratchpads, MOCK_SCRATCHPADS).map((item) => ({
    ...item,
    createdTime: item.createdTime || item.createdAt,
  }));

  writeList(KEYS.projects, projects);
  writeList(KEYS.tasks, tasks);
  writeList(KEYS.nodes, nodes);
  writeList(KEYS.scratchpads, scratchpads);
  if (!localStorage.getItem(KEYS.actions)) {
    writeList(KEYS.actions, MOCK_ACTIONS.filter((action) => nodes.some((node) => node.id === action.nodeId)));
  }
  if (!localStorage.getItem(KEYS.deliverables)) {
    const derived = tasks
      .filter((task) => task.deliverable && task.currentNodeId)
      .map((task) => ({
        id: 'deliverable-migrated-' + task.id,
        nodeId: task.currentNodeId!,
        name: task.deliverable!,
        type: 'document' as const,
        receiver: task.receiver || task.deliverTo,
        deadline: task.deadline,
      }));
    writeList(KEYS.deliverables, derived.length ? derived : MOCK_DELIVERABLES);
  }
  if (!localStorage.getItem(KEYS.reviews)) writeList(KEYS.reviews, MOCK_REVIEWS);
  localStorage.setItem(KEYS.version, '2');
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
  getActions: (): IAction[] => { ensureSeeded(); return readList<IAction>(KEYS.actions, MOCK_ACTIONS); },
  saveActions: (list: IAction[]) => writeList(KEYS.actions, list),
  getDeliverables: (): IDeliverable[] => { ensureSeeded(); return readList<IDeliverable>(KEYS.deliverables, MOCK_DELIVERABLES); },
  saveDeliverables: (list: IDeliverable[]) => writeList(KEYS.deliverables, list),
  getReviews: (): INodeReview[] => { ensureSeeded(); return readList<INodeReview>(KEYS.reviews, MOCK_REVIEWS); },
  saveReviews: (list: INodeReview[]) => writeList(KEYS.reviews, list),
  getInboxItems: (): IInboxItem[] => { ensureSeeded(); return readList<IInboxItem>(KEYS.inboxItems, MOCK_INBOX_ITEMS); },
  saveInboxItems: (list: IInboxItem[]) => writeList(KEYS.inboxItems, list),
  getCurrentFocus: (): ICurrentFocus | null => { ensureSeeded(); return readItem<ICurrentFocus | null>(KEYS.currentFocus, MOCK_CURRENT_FOCUS); },
  saveCurrentFocus: (focus: ICurrentFocus | null) => writeItem(KEYS.currentFocus, focus),
};

export { delay, ensureSeeded };
