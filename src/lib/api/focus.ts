import { mockStore, delay } from './mock-store';
import type { ICurrentFocus } from '@/data/workspace';

export function fetchCurrentFocus(): Promise<ICurrentFocus | null> {
  return delay(mockStore.getCurrentFocus());
}

export function setCurrentFocus(nodeId: string): Promise<ICurrentFocus> {
  const node = mockStore.getNodes().find((n) => n.id === nodeId);
  if (!node) return Promise.reject({ error: 'NotFound', message: '节点不存在' });

  const nodes = mockStore.getNodes();
  const idx = nodes.findIndex((n) => n.id === nodeId);
  if (idx !== -1) {
    nodes[idx] = { ...nodes[idx], status: 'doing', actualStartTime: nodes[idx].actualStartTime || new Date().toISOString() };
    mockStore.saveNodes(nodes);
  }

  const totalMs = new Date(node.plannedEndTime || node.estimatedEndTime).getTime() - new Date(node.plannedStartTime || node.startTime).getTime();
  const totalSeconds = Math.max(60, Math.floor(totalMs / 1000));

  const tasks = mockStore.getTasks();
  const taskIndex = tasks.findIndex((task) => task.id === node.taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex] = { ...tasks[taskIndex], status: 'doing', currentNodeId: node.id };
    mockStore.saveTasks(tasks);
  }

  const focus: ICurrentFocus = {
    nodeId: node.id,
    taskId: node.taskId,
    startedAt: new Date().toISOString(),
    totalSeconds,
    elapsedSeconds: 0,
    isPaused: false,
  };
  mockStore.saveCurrentFocus(focus);
  return delay(focus);
}

export function togglePauseFocus(): Promise<{ isPaused: boolean }> {
  const focus = mockStore.getCurrentFocus();
  if (!focus) return Promise.reject({ error: 'NotFound', message: '当前无专注任务' });
  const newPaused = !focus.isPaused;
  mockStore.saveCurrentFocus({
    ...focus,
    isPaused: newPaused,
    pausedAt: newPaused ? new Date().toISOString() : undefined,
  });
  return delay({ isPaused: newPaused });
}

export function tickFocus(seconds = 1): Promise<{ elapsedSeconds?: number; skipped?: boolean }> {
  const focus = mockStore.getCurrentFocus();
  if (!focus || focus.isPaused) return delay({ skipped: true });
  const newElapsed = Math.min(focus.elapsedSeconds + seconds, focus.totalSeconds);
  mockStore.saveCurrentFocus({ ...focus, elapsedSeconds: newElapsed });
  return delay({ elapsedSeconds: newElapsed });
}
