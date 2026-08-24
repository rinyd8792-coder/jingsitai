import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ICurrentFocus, ITask, INode, IScratchpad } from '@/data/workspace';
import { fetchCurrentFocus, setCurrentFocus, togglePauseFocus, tickFocus } from '@/lib/api/focus';
import { fetchTask } from '@/lib/api/tasks';
import { fetchNode } from '@/lib/api/nodes';
import { fetchScratchpads, createScratchpad, deleteScratchpad } from '@/lib/api/scratchpads';
import { completeNode as apiCompleteNode } from '@/lib/api/nodes';

interface WorkspaceContextValue {
  currentFocus: ICurrentFocus | null;
  currentTask: ITask | null;
  currentNode: INode | null;
  scratchpads: IScratchpad[];
  isLoading: boolean;
  refreshFocus: () => Promise<void>;
  setFocus: (nodeId: string) => Promise<void>;
  togglePause: () => Promise<void>;
  tick: () => Promise<void>;
  completeNode: (completion?: 'done' | 'partial') => Promise<void>;
  addScratchpad: (content: string, type: IScratchpad['type']) => Promise<void>;
  removeScratchpad: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentFocus, setCurrentFocusState] = useState<ICurrentFocus | null>(null);
  const [currentTask, setCurrentTask] = useState<ITask | null>(null);
  const [currentNode, setCurrentNode] = useState<INode | null>(null);
  const [scratchpads, setScratchpads] = useState<IScratchpad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFocusData = useCallback(async (focus: ICurrentFocus | null) => {
    if (!focus) {
      setCurrentTask(null);
      setCurrentNode(null);
      setScratchpads([]);
      return;
    }
    try {
      const [task, node, pads] = await Promise.all([
        fetchTask(focus.taskId),
        fetchNode(focus.nodeId),
        fetchScratchpads(focus.nodeId),
      ]);
      setCurrentTask(task);
      setCurrentNode(node);
      setScratchpads(pads);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshFocus = useCallback(async () => {
    setIsLoading(true);
    try {
      const focus = await fetchCurrentFocus();
      setCurrentFocusState(focus);
      await loadFocusData(focus);
    } finally {
      setIsLoading(false);
    }
  }, [loadFocusData]);

  const setFocus = useCallback(async (nodeId: string) => {
    const focus = await setCurrentFocus(nodeId);
    setCurrentFocusState(focus);
    await loadFocusData(focus);
  }, [loadFocusData]);

  const togglePause = useCallback(async () => {
    const result = await togglePauseFocus();
    setCurrentFocusState((prev) => (prev ? { ...prev, isPaused: result.isPaused } : null));
  }, []);

  const tick = useCallback(async () => {
    const result = await tickFocus(1);
    if (result.elapsedSeconds !== undefined) {
      setCurrentFocusState((prev) =>
        prev ? { ...prev, elapsedSeconds: result.elapsedSeconds! } : null,
      );
    }
  }, []);

  const completeNode = useCallback(async (completion: 'done' | 'partial' = 'done') => {
    if (!currentFocus) return;
    const result = await apiCompleteNode(currentFocus.nodeId, completion);
    if (result.newFocus) {
      const newFocus: ICurrentFocus = {
        nodeId: result.newFocus.nodeId,
        taskId: result.newFocus.taskId,
        startedAt: result.newFocus.startedAt,
        totalSeconds: result.newFocus.totalSeconds,
        elapsedSeconds: result.newFocus.elapsedSeconds,
        isPaused: result.newFocus.isPaused,
      };
      setCurrentFocusState(newFocus);
      await loadFocusData(newFocus);
    } else {
      setCurrentFocusState(null);
      setCurrentTask(null);
      setCurrentNode(null);
      setScratchpads([]);
    }
  }, [currentFocus, loadFocusData]);

  const addScratchpad = useCallback(async (content: string, type: IScratchpad['type']) => {
    if (!currentFocus) return;
    const item = await createScratchpad(currentFocus.nodeId, content, type);
    setScratchpads((prev) => [item, ...prev]);
  }, [currentFocus]);

  const removeScratchpad = useCallback(async (id: string) => {
    await deleteScratchpad(id);
    setScratchpads((prev) => prev.filter((s) => s.id !== id));
  }, []);

  useEffect(() => {
    refreshFocus();
  }, [refreshFocus]);

  const value: WorkspaceContextValue = {
    currentFocus,
    currentTask,
    currentNode,
    scratchpads,
    isLoading,
    refreshFocus,
    setFocus,
    togglePause,
    tick,
    completeNode,
    addScratchpad,
    removeScratchpad,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return ctx;
}
