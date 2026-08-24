import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, Circle, Clock3, ExternalLink, FileOutput,
  Loader2, Play, Plus, Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/context/WorkspaceContext';
import { fetchTask } from '@/lib/api/tasks';
import { createNode, fetchNodes } from '@/lib/api/nodes';
import { createAction, fetchActions, updateAction } from '@/lib/api/actions';
import { createDeliverable, fetchDeliverables } from '@/lib/api/deliverables';
import type { IAction, IDeliverable, INode, ITask } from '@/data/workspace';

const STATUS_LABEL: Record<INode['status'], string> = {
  pending: '未开始',
  doing: '进行中',
  partial: '部分完成',
  waiting: '等待中',
  paused: '已暂停',
  done: '已完成',
  abandoned: '已放弃',
};

function formatDateTime(value?: string) {
  if (!value) return '未设置';
  return new Date(value).toLocaleString('zh-CN', {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function durationMinutes(start?: string, end?: string) {
  if (!start || !end) return null;
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

export default function TaskDetailPage() {
  const { taskId = '' } = useParams();
  const { setFocus } = useWorkspace();
  const [task, setTask] = useState<ITask | null>(null);
  const [nodes, setNodes] = useState<INode[]>([]);
  const [actions, setActions] = useState<Record<string, IAction[]>>({});
  const [deliverables, setDeliverables] = useState<Record<string, IDeliverable[]>>({});
  const [loading, setLoading] = useState(true);
  const [startingNode, setStartingNode] = useState<string | null>(null);
  const [actionNodeId, setActionNodeId] = useState('');
  const [actionContent, setActionContent] = useState('');
  const [deliverableName, setDeliverableName] = useState('');
  const [deliverableReceiver, setDeliverableReceiver] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeStart, setNewNodeStart] = useState('');
  const [newNodeEnd, setNewNodeEnd] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [taskData, nodeData] = await Promise.all([fetchTask(taskId), fetchNodes({ taskId })]);
      const ordered = nodeData.sort((a, b) => a.order - b.order);
      const [actionPairs, deliverablePairs] = await Promise.all([
        Promise.all(ordered.map(async (node) => [node.id, await fetchActions(node.id)] as const)),
        Promise.all(ordered.map(async (node) => [node.id, await fetchDeliverables(node.id)] as const)),
      ]);
      setTask(taskData);
      setNodes(ordered);
      setActions(Object.fromEntries(actionPairs));
      setDeliverables(Object.fromEntries(deliverablePairs));
      setActionNodeId(taskData.currentNodeId || ordered.find((node) => node.status !== 'done')?.id || ordered[0]?.id || '');
      setDeliverableReceiver(taskData.receiver || '');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [taskId]);

  const currentNode = useMemo(
    () => nodes.find((node) => node.id === task?.currentNodeId) || nodes.find((node) => node.status === 'doing') || nodes.find((node) => node.status === 'pending'),
    [nodes, task?.currentNodeId],
  );

  async function startNode(nodeId: string) {
    setStartingNode(nodeId);
    try {
      await setFocus(nodeId);
      toast.success('已切换为当前唯一焦点');
    } finally {
      setStartingNode(null);
    }
  }

  async function addAction(event: FormEvent) {
    event.preventDefault();
    if (!actionNodeId || !actionContent.trim()) return;
    const item = await createAction(actionNodeId, actionContent.trim());
    setActions((value) => ({ ...value, [actionNodeId]: [...(value[actionNodeId] || []), item] }));
    setActionContent('');
    toast.success('下一动作已添加');
  }

  async function toggleAction(action: IAction) {
    const updated = await updateAction(action.id, {
      status: action.status === 'done' ? 'pending' : 'done',
      completedTime: action.status === 'done' ? undefined : new Date().toISOString(),
    });
    setActions((value) => ({
      ...value,
      [action.nodeId]: (value[action.nodeId] || []).map((item) => item.id === updated.id ? updated : item),
    }));
  }

  async function addDeliverable(event: FormEvent) {
    event.preventDefault();
    if (!currentNode || !deliverableName.trim()) return;
    const item = await createDeliverable({
      nodeId: currentNode.id,
      name: deliverableName.trim(),
      type: deliverableUrl ? 'link' : 'document',
      url: deliverableUrl || undefined,
      receiver: deliverableReceiver || task?.receiver,
      deadline: task?.deadline,
    });
    setDeliverables((value) => ({ ...value, [currentNode.id]: [...(value[currentNode.id] || []), item] }));
    setDeliverableName('');
    setDeliverableUrl('');
    toast.success('交付物已定义');
  }

  async function addWorkNode(event: FormEvent) {
    event.preventDefault();
    if (!newNodeTitle.trim() || !newNodeStart || !newNodeEnd) return;
    const item = await createNode({
      taskId: taskId,
      name: newNodeTitle.trim(),
      title: newNodeTitle.trim(),
      startTime: newNodeStart,
      estimatedEndTime: newNodeEnd,
      plannedStartTime: newNodeStart,
      plannedEndTime: newNodeEnd,
      order: nodes.length + 1,
      status: 'pending',
    });
    setNodes((value) => [...value, item]);
    if (!actionNodeId) setActionNodeId(item.id);
    setNewNodeTitle('');
    setNewNodeStart('');
    setNewNodeEnd('');
    toast.success('工作节点已添加');
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!task) return <div className="py-16 text-center text-muted-foreground">任务不存在</div>;

  const completed = nodes.filter((node) => node.status === 'done').length;
  const progress = nodes.length ? Math.round((completed / nodes.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />返回项目</Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary">Task Execution Map</div>
            <h1 className="mt-2 text-3xl font-light tracking-wide">{task.title}</h1>
            <p className="mt-3 max-w-2xl text-sm font-light leading-7 text-muted-foreground">{task.description || task.completionCriteria || '还没有任务说明'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-5 py-4 text-right">
            <div className="text-2xl font-light">{progress}%</div>
            <div className="text-xs text-muted-foreground">{completed}/{nodes.length} 个节点完成</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card p-4"><div className="text-xs text-muted-foreground">任务状态</div><div className="mt-1 text-sm">{task.status}</div></div>
          <div className="rounded-xl border border-border/60 bg-card p-4"><div className="text-xs text-muted-foreground">交付对象</div><div className="mt-1 text-sm">{task.receiver || task.deliverTo || '未设置'}</div></div>
          <div className="rounded-xl border border-border/60 bg-card p-4"><div className="text-xs text-muted-foreground">截止时间</div><div className="mt-1 text-sm">{formatDateTime(task.deadline)}</div></div>
        </div>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-2"><Target className="size-4 text-primary" /><h2 className="text-lg font-light">工作节点</h2></div>
        <div className="mt-6 space-y-4">
          {nodes.map((node, index) => {
            const nodeActions = actions[node.id] || [];
            const nodeDeliverables = deliverables[node.id] || [];
            const plannedMinutes = durationMinutes(node.plannedStartTime || node.startTime, node.plannedEndTime || node.estimatedEndTime);
            const actualMinutes = durationMinutes(node.actualStartTime, node.actualEndTime);
            const isCurrent = currentNode?.id === node.id;
            return (
              <article key={node.id} className={['rounded-2xl border p-5', isCurrent ? 'border-primary/40 bg-primary/[0.03]' : 'border-border/50'].join(' ')}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className={['flex size-8 shrink-0 items-center justify-center rounded-full text-sm', node.status === 'done' ? 'bg-emerald-100 text-emerald-700' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'].join(' ')}>
                    {node.status === 'done' ? <Check className="size-4" /> : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-light">{node.title || node.name}</h3>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{STATUS_LABEL[node.status]}</span>
                      {isCurrent && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">当前节点</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <span>计划 {formatDateTime(node.plannedStartTime || node.startTime)} → {formatDateTime(node.plannedEndTime || node.estimatedEndTime)}</span>
                      <span>计划耗时 {plannedMinutes === null ? '—' : String(plannedMinutes) + ' 分钟'}</span>
                      <span>实际耗时 {actualMinutes === null ? '进行中 / 未记录' : String(actualMinutes) + ' 分钟'}</span>
                    </div>
                    {node.output && <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">输出：{node.output}</div>}
                    {node.unresolved && <div className="mt-2 text-xs text-amber-700">遗留：{node.unresolved}</div>}

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">下一动作</div>
                        <div className="mt-2 space-y-2">
                          {nodeActions.length ? nodeActions.map((action) => (
                            <button key={action.id} onClick={() => void toggleAction(action)} className="flex w-full items-start gap-2 rounded-lg border border-border/40 px-3 py-2 text-left text-xs hover:bg-muted/40">
                              {action.status === 'done' ? <Check className="mt-0.5 size-3.5 text-emerald-600" /> : <Circle className="mt-0.5 size-3.5 text-muted-foreground" />}
                              <span className={action.status === 'done' ? 'line-through text-muted-foreground' : ''}>{action.content}</span>
                            </button>
                          )) : <div className="text-xs text-muted-foreground">尚无下一动作</div>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">交付物</div>
                        <div className="mt-2 space-y-2">
                          {nodeDeliverables.length ? nodeDeliverables.map((item) => (
                            <div key={item.id} className="rounded-lg border border-border/40 px-3 py-2 text-xs">
                              <div>{item.name}</div>
                              <div className="mt-1 text-muted-foreground">给 {item.receiver || '未设置'}</div>
                            </div>
                          )) : <div className="text-xs text-muted-foreground">尚无交付物</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                  {node.status !== 'done' && node.status !== 'abandoned' && (
                    <button onClick={() => void startNode(node.id)} disabled={startingNode === node.id} className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-50">
                      {startingNode === node.id ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}设为 Focus
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <form onSubmit={addWorkNode} className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-2"><Clock3 className="size-4 text-primary" /><h2 className="text-lg font-light">拆分新的工作节点</h2></div>
        <p className="mt-1 text-xs text-muted-foreground">把任务继续拆成一个有明确时间边界、可以直接开始的阶段。</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_190px_190px_auto]">
          <input required value={newNodeTitle} onChange={(event) => setNewNodeTitle(event.target.value)} placeholder="节点标题" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input required type="datetime-local" value={newNodeStart} onChange={(event) => setNewNodeStart(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input required type="datetime-local" value={newNodeEnd} onChange={(event) => setNewNodeEnd(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <button className="rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">添加节点</button>
        </div>
      </form>


      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={addAction} className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2"><Plus className="size-4 text-primary" /><h2 className="text-lg font-light">添加下一动作</h2></div>
          <select value={actionNodeId} onChange={(event) => setActionNodeId(event.target.value)} className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            {nodes.map((node) => <option key={node.id} value={node.id}>{node.title || node.name}</option>)}
          </select>
          <input value={actionContent} onChange={(event) => setActionContent(event.target.value)} placeholder="下一步具体做什么？" className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <button className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">添加动作</button>
        </form>

        <form onSubmit={addDeliverable} className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2"><FileOutput className="size-4 text-primary" /><h2 className="text-lg font-light">定义当前交付物</h2></div>
          <input value={deliverableName} onChange={(event) => setDeliverableName(event.target.value)} placeholder="交付物名称" className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input value={deliverableReceiver} onChange={(event) => setDeliverableReceiver(event.target.value)} placeholder="交付对象" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <input value={deliverableUrl} onChange={(event) => setDeliverableUrl(event.target.value)} placeholder="链接（可选）" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <button className="mt-3 rounded-xl border border-primary px-4 py-2.5 text-sm text-primary">保存交付物</button>
        </form>
      </div>

      {task.url && <a href={task.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary"><ExternalLink className="size-4" />打开任务链接</a>}
    </div>
  );
}
