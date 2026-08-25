import { useMemo, useState } from 'react';
import { Bot, Check, Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { suggestTaskBreakdown, type AIBreakdownNodeDraft } from '@/lib/api/ai-runtime';
import { createNode } from '@/lib/api/nodes';
import { updateTask } from '@/lib/api/tasks';
import type { ITask } from '@/data/workspace';

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function roundedStart() {
  const now = new Date();
  now.setSeconds(0, 0);
  const minutes = now.getMinutes();
  const nextQuarter = Math.ceil(minutes / 15) * 15;
  if (nextQuarter >= 60) {
    now.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    now.setMinutes(nextQuarter, 0, 0);
  }
  return toLocalInputValue(now);
}

export default function AITaskBreakdown({
  task,
  open,
  onClose,
  onApplied,
}: {
  task: ITask | null;
  open: boolean;
  onClose: () => void;
  onApplied: (taskId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [summary, setSummary] = useState('');
  const [nodes, setNodes] = useState<AIBreakdownNodeDraft[]>([]);
  const [startTime, setStartTime] = useState(roundedStart);

  const totalMinutes = useMemo(
    () => nodes.reduce((sum, node) => sum + Number(node.durationMinutes || 0), 0),
    [nodes],
  );

  if (!open || !task) return null;
  const activeTask = task;

  async function generate() {
    setLoading(true);
    try {
      const result = await suggestTaskBreakdown(activeTask);
      setSummary(result.summary);
      setNodes(result.nodes);
      toast.success('AI 已生成节点建议，请确认后再写入');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 拆解失败');
    } finally {
      setLoading(false);
    }
  }

  function updateNode(index: number, patch: Partial<AIBreakdownNodeDraft>) {
    setNodes((current) =>
      current.map((node, nodeIndex) => nodeIndex === index ? { ...node, ...patch } : node),
    );
  }

  function removeNode(index: number) {
    setNodes((current) => current.filter((_, nodeIndex) => nodeIndex !== index));
  }

  function addNode() {
    setNodes((current) => [
      ...current,
      { title: '新的工作节点', durationMinutes: 30, priority: 'medium', goal: '' },
    ]);
  }

  async function apply() {
    if (!nodes.length) return;
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      toast.error('请设置有效的开始时间');
      return;
    }

    setApplying(true);
    try {
      let cursor = start.getTime();
      let firstNodeId: string | undefined;

      for (let index = 0; index < nodes.length; index += 1) {
        const draft = nodes[index];
        const nodeStart = new Date(cursor);
        const nodeEnd = new Date(cursor + draft.durationMinutes * 60_000);

        const created = await createNode({
          taskId: activeTask.id,
          name: draft.title,
          title: draft.title,
          startTime: nodeStart.toISOString(),
          estimatedEndTime: nodeEnd.toISOString(),
          plannedStartTime: nodeStart.toISOString(),
          plannedEndTime: nodeEnd.toISOString(),
          priority: draft.priority,
          order: index + 1,
          status: 'pending',
          output: draft.goal ? `完成标准：${draft.goal}` : undefined,
        });

        if (!firstNodeId) firstNodeId = created.id;
        cursor = nodeEnd.getTime();
      }

      await updateTask(activeTask.id, {
        status: 'next',
        currentNodeId: firstNodeId,
      });

      toast.success(`已写入 ${nodes.length} 个工作节点`);
      onApplied(activeTask.id);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '写入节点失败');
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border/50 bg-card/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
              <Sparkles className="size-4" />
              AI Task Planner
            </div>
            <h2 className="mt-2 text-xl font-light">{task.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              AI 只提出建议。节点名称、耗时和开始时间都由你最后确认。
            </p>
          </div>
          <button onClick={onClose} className="flex size-9 items-center justify-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {!nodes.length ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <Bot className="mx-auto size-10 text-primary/70" />
              <h3 className="mt-4 text-lg font-light">把任务变成可以开始的节点</h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-light leading-6 text-muted-foreground">
                AI 会参考任务说明、Deadline、交付物和完成标准生成 2-7 个建议节点。
              </p>
              <button
                onClick={() => void generate()}
                disabled={loading}
                className="mx-auto mt-5 flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {loading ? '正在拆解…' : '生成拆解建议'}
              </button>
            </div>
          ) : (
            <>
              {summary && (
                <div className="rounded-xl bg-primary/[0.06] px-4 py-3 text-sm font-light leading-6 text-foreground">
                  {summary}
                </div>
              )}

              <label className="block space-y-2 text-sm font-light">
                第一节点开始时间
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="block h-10 w-full max-w-xs rounded-lg border border-border bg-background px-3"
                />
              </label>

              <div className="space-y-3">
                {nodes.map((node, index) => (
                  <div key={`${index}-${node.title}`} className="rounded-2xl border border-border/60 p-4">
                    <div className="grid gap-3 md:grid-cols-[32px_1fr_120px_120px_36px] md:items-center">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">
                        {index + 1}
                      </div>
                      <input
                        value={node.title}
                        onChange={(event) => updateNode(index, { title: event.target.value })}
                        className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      />
                      <label className="text-xs text-muted-foreground">
                        分钟
                        <input
                          type="number"
                          min={10}
                          max={480}
                          step={5}
                          value={node.durationMinutes}
                          onChange={(event) => updateNode(index, { durationMinutes: Number(event.target.value) })}
                          className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                        />
                      </label>
                      <label className="text-xs text-muted-foreground">
                        优先级
                        <select
                          value={node.priority}
                          onChange={(event) => updateNode(index, { priority: event.target.value as AIBreakdownNodeDraft['priority'] })}
                          className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                        >
                          <option value="high">高</option>
                          <option value="medium">中</option>
                          <option value="low">低</option>
                        </select>
                      </label>
                      <button
                        onClick={() => removeNode(index)}
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="删除节点"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <input
                      value={node.goal || ''}
                      onChange={(event) => updateNode(index, { goal: event.target.value })}
                      placeholder="这个节点做到什么程度算结束（可选）"
                      className="mt-3 h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-xs"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={addNode}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-3.5" />
                手动补一个节点
              </button>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-5">
                <div className="text-xs text-muted-foreground">
                  {nodes.length} 个节点 · 预计约 {totalMinutes} 分钟
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => void generate()}
                    disabled={loading || applying}
                    className="h-10 rounded-xl border border-border px-4 text-sm disabled:opacity-50"
                  >
                    重新生成
                  </button>
                  <button
                    onClick={() => void apply()}
                    disabled={applying || nodes.some((node) => !node.title.trim() || node.durationMinutes < 10)}
                    className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50"
                  >
                    {applying ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    {applying ? '写入中…' : '确认并写入节点'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
