import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Bookmark, CheckCircle2, Clock3, FileOutput, Gavel,
  HelpCircle, Lightbulb, ListTodo, Loader2, Pause, Play, Send, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/context/WorkspaceContext';
import type { CompletionStatus, NodeCompletionInput, ScratchpadType } from '@/data/workspace';

const NOTE_TYPES: { value: ScratchpadType; label: string; icon: typeof Lightbulb }[] = [
  { value: 'idea', label: '想法', icon: Lightbulb },
  { value: 'question', label: '问题', icon: HelpCircle },
  { value: 'todo', label: '待办', icon: ListTodo },
  { value: 'resource', label: '资料', icon: Bookmark },
  { value: 'decision', label: '决策', icon: Gavel },
];

const COMPLETION_OPTIONS: { value: CompletionStatus; label: string; hint: string }[] = [
  { value: 'done', label: '已完成', hint: '本节点目标已经达成' },
  { value: 'partial', label: '部分完成', hint: '保留遗留问题并继续推进' },
  { value: 'waiting', label: '等待别人', hint: '转入外部依赖管理' },
  { value: 'paused', label: '暂停', hint: '稍后在明确时间继续' },
  { value: 'abandoned', label: '放弃', hint: '停止该节点但保留记录' },
];

function formatTime(value?: string) {
  if (!value) return '待安排';
  return new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(value?: string) {
  if (!value) return '未设置';
  return new Date(value).toLocaleString('zh-CN', {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatTimer(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hours, minutes, secs].map((part) => String(part).padStart(2, '0')).join(':');
}

function formatFocusRemaining(seconds: number) {
  const safe = Math.max(0, seconds);
  if (safe >= 3600) return formatTimer(safe);
  return [Math.floor(safe / 60), safe % 60].map((part) => String(part).padStart(2, '0')).join(':');
}

export default function NowV2Page() {
  const {
    currentFocus, currentTask, currentNode, scratchpads, actions, deliverables,
    isLoading, togglePause, tick, completeNode, addScratchpad, removeScratchpad,
  } = useWorkspace();
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState<ScratchpadType>('idea');
  const [savingNote, setSavingNote] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);
  const [completion, setCompletion] = useState<NodeCompletionInput>({
    status: 'done',
    output: '',
    unresolved: '',
    nextAction: '',
    continueTime: '',
    waitingObject: '',
  });

  useEffect(() => {
    if (!currentFocus || currentFocus.isPaused) return;
    const timer = window.setInterval(() => void tick(), 1000);
    return () => window.clearInterval(timer);
  }, [currentFocus?.nodeId, currentFocus?.isPaused, tick]);

  const nextAction = useMemo(
    () => actions.find((action) => action.status === 'pending' || action.status === 'doing'),
    [actions],
  );

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  if (!currentFocus || !currentTask || !currentNode) {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <div className="rounded-3xl border border-dashed border-border bg-card/40 px-8 py-16 text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Play className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-light tracking-wide">此刻没有正在执行的节点</h1>
          <p className="mt-3 text-sm font-light text-muted-foreground">从今日时间轴或项目任务中选择一个节点，让 NOW 只保留一件事。</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/today" className="rounded-xl bg-primary px-5 py-2.5 text-sm text-primary-foreground">查看今日</Link>
            <Link to="/projects" className="rounded-xl border border-border px-5 py-2.5 text-sm">打开项目</Link>
          </div>
        </div>
      </div>
    );
  }

  const plannedStart = currentNode.plannedStartTime || currentNode.startTime;
  const plannedEnd = currentNode.plannedEndTime || currentNode.estimatedEndTime;
  const elapsed = currentFocus.elapsedSeconds;
  const remaining = Math.max(0, currentFocus.totalSeconds - elapsed);
  const progress = Math.min(100, Math.round((elapsed / Math.max(1, currentFocus.totalSeconds)) * 100));

  async function submitNote(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await addScratchpad(note.trim(), noteType);
      setNote('');
      setNoteType('idea');
      toast.success('已记入当前节点');
    } finally {
      setSavingNote(false);
    }
  }

  async function submitCompletion(event: FormEvent) {
    event.preventDefault();
    setSubmittingCompletion(true);
    try {
      await completeNode(completion);
      setShowCompletion(false);
      toast.success(completion.status === 'waiting' ? '已转入 Waiting' : '节点复盘已保存');
    } finally {
      setSubmittingCompletion(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1040px] space-y-8 jingsitai-now">
      <header className="flex items-end justify-between gap-4 pt-8 pb-1">
        <div>
          <h1 className="font-serif text-4xl font-light tracking-[0.25em] text-foreground md:text-5xl">当 下</h1>
          <p className="mt-3 text-sm font-normal tracking-widest text-muted-foreground">专注此刻，一物一念</p>
        </div>
        <div className="text-right text-xs font-normal tracking-widest text-muted-foreground"><div>此时</div><time className="mt-2 block font-serif text-2xl tracking-normal text-foreground">{formatTime(new Date().toISOString())}</time></div>
      </header>
      <section className="jingsitai-focus-card relative overflow-hidden rounded-[22px] border border-border/30 bg-card px-7 py-11 md:px-14 md:py-12">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary/35" aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link to={'/tasks/' + currentTask.id} className="rounded-full border border-border/50 px-3 py-1 text-xs hover:text-primary">{currentTask.title}</Link>
          <span className="text-sm">{currentTask.deliverable || currentTask.description || '当前任务'}</span>
          <span className="ml-auto text-xs">{currentFocus.isPaused ? '已暂停' : '专注中'}</span>
        </div>
        <h2 className="mt-11 max-w-4xl font-serif text-[clamp(1.9rem,2.9vw,2.85rem)] font-light leading-[1.55] tracking-wide text-foreground">{currentNode.title || currentNode.name}</h2>
        <p className="mt-2 text-sm font-normal tracking-wide text-muted-foreground">{formatTime(plannedStart)} — {formatTime(plannedEnd)}</p>
        <div className="mt-7 rounded-2xl border border-primary/25 bg-[#F0F2E9] px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#416B4E]"><ArrowRight className="size-4" />现在只做这一步</div>
          <p className="mt-2 text-lg font-medium leading-8 text-foreground">{nextAction?.content || '先完成当前节点的第一个具体动作'}</p>
        </div>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-8">
          <div>
            <div className="mb-3 text-sm tracking-[0.2em] text-muted-foreground">余 时</div>
            <div role="timer" aria-label="当前节点剩余时间" className="jingsitai-timer font-serif text-[clamp(3.8rem,5.5vw,5rem)] font-normal leading-[1.08] tracking-[-0.035em] text-foreground tabular-nums">{formatFocusRemaining(remaining)}</div>
          </div>
          <div className="flex flex-wrap gap-3 pb-1">
            <button onClick={() => void togglePause()} className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-5 py-3 text-sm transition-colors hover:bg-muted/50">
              {currentFocus.isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {currentFocus.isPaused ? '继续' : '暂停'}
            </button>
            <button onClick={() => setShowCompletion(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground transition-colors hover:bg-primary/90"><CheckCircle2 className="size-4" />完成节点</button>
          </div>
        </div>
        <div className="mt-7 h-px bg-border/50"><div className="h-px bg-primary transition-all duration-700" style={{ width: String(progress) + '%' }} /></div>
        <div className="mt-6 border-t border-border/40 pt-6">
          <div className="mb-2 text-sm tracking-[0.12em] text-muted-foreground">完成的标准</div>
          <p className="max-w-3xl text-[15px] font-normal leading-7 text-foreground/90">{currentTask.completionCriteria || currentTask.deliverable || currentTask.description || '完成当前节点所设定的目标，并记录本次产出。'}</p>
          <p className="mt-2 text-sm text-muted-foreground">已专注 {formatTimer(elapsed)} · 进度 {progress}%</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[20px] border border-border/35 bg-card p-7">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ArrowRight className="size-4 text-primary" />Next Action
          </div>
          {nextAction ? (
            <div className="mt-4 rounded-2xl bg-primary/[0.06] p-5">
              <div className="text-lg font-light">{nextAction.content}</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" />预计 {formatDateTime(nextAction.plannedTime)}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-border px-5 py-7 text-sm text-muted-foreground">
              当前节点还没有明确下一动作。结束节点时必须补充一个，才能继续推进。
            </div>
          )}
        </section>

        <section className="rounded-[20px] border border-border/35 bg-card p-7">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileOutput className="size-4 text-primary" />Deliverable
          </div>
          {deliverables.length ? (
            <div className="mt-4 space-y-3">
              {deliverables.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/50 p-4">
                  <div className="font-light">{item.name}</div>
                  <div className="mt-2 text-xs leading-5 text-muted-foreground">
                    交付对象：{item.receiver || currentTask.receiver || '未设置'}<br />
                    截止：{formatDateTime(item.deadline)}
                  </div>
                  {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary">打开交付链接</a>}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">尚未定义交付物，可在任务详情中补充。</p>
          )}
        </section>
      </div>

      <section className="rounded-[20px] border border-border/35 bg-card p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-light">过程记录 Scratchpad</h2>
            <p className="mt-1 text-xs text-muted-foreground">快速写下，不要求先整理；节点结束时再统一复盘。</p>
          </div>
          <span className="text-xs text-muted-foreground">{scratchpads.length} 条记录</span>
        </div>

        <form onSubmit={submitNote} className="mt-5">
          <div className="rounded-2xl border border-border/30 bg-[#F7F4EE] p-4 focus-within:border-primary/50">
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="输入想法、问题、待办或资料…" rows={3} className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
              <div className="flex flex-wrap gap-1.5">
                {NOTE_TYPES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.value} type="button" onClick={() => setNoteType(item.value)} className={['flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs', noteType === item.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'].join(' ')}>
                      <Icon className="size-3.5" />{item.label}
                    </button>
                  );
                })}
              </div>
              <button disabled={savingNote || !note.trim()} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-40">
                {savingNote ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}记录
              </button>
            </div>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {scratchpads.map((item) => {
            const type = NOTE_TYPES.find((option) => option.value === item.type) || NOTE_TYPES[0];
            const Icon = type.icon;
            return (
              <div key={item.id} className="group flex gap-3 rounded-xl border border-border/40 p-4">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"><Icon className="size-4 text-muted-foreground" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{type.label}</span><span>·</span>
                    <span>{formatTime(item.createdTime || item.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm font-light leading-6">{item.content}</p>
                </div>
                <button onClick={() => void removeScratchpad(item.id)} className="self-start p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"><X className="size-3.5" /></button>
              </div>
            );
          })}
        </div>
      </section>

      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm">
          <form onSubmit={submitCompletion} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-primary">Node Review</div>
                <h2 className="mt-1 text-2xl font-light">结束“{currentNode.title || currentNode.name}”</h2>
              </div>
              <button type="button" onClick={() => setShowCompletion(false)} className="rounded-lg p-2 hover:bg-muted"><X className="size-4" /></button>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {COMPLETION_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => setCompletion((value) => ({ ...value, status: option.value }))} className={['rounded-xl border p-3 text-left', completion.status === option.value ? 'border-primary bg-primary/[0.06]' : 'border-border hover:bg-muted/40'].join(' ')}>
                  <div className="text-sm">{option.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{option.hint}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4">
              <label className="text-sm">
                <span className="mb-1.5 block text-muted-foreground">本次输出</span>
                <textarea value={completion.output} onChange={(event) => setCompletion((value) => ({ ...value, output: event.target.value }))} rows={2} placeholder="这次真正产出了什么？" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary" />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block text-muted-foreground">遗留问题</span>
                <textarea value={completion.unresolved} onChange={(event) => setCompletion((value) => ({ ...value, unresolved: event.target.value }))} rows={2} placeholder="还缺什么、卡在哪里？" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary" />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block text-muted-foreground">下一动作</span>
                <input required={completion.status !== 'abandoned'} value={completion.nextAction} onChange={(event) => setCompletion((value) => ({ ...value, nextAction: event.target.value }))} placeholder="用一个可以直接开始的动词描述" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary" />
              </label>
              {(completion.status === 'waiting' || completion.status === 'paused') && (
                <label className="text-sm">
                  <span className="mb-1.5 block text-muted-foreground">等待对象</span>
                  <input value={completion.waitingObject} onChange={(event) => setCompletion((value) => ({ ...value, waitingObject: event.target.value }))} placeholder="例如：设计协作者 / 外部审批" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary" />
                </label>
              )}
              <label className="text-sm">
                <span className="mb-1.5 block text-muted-foreground">继续时间</span>
                <input type="datetime-local" value={completion.continueTime} onChange={(event) => setCompletion((value) => ({ ...value, continueTime: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary" />
              </label>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCompletion(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm">取消</button>
              <button disabled={submittingCompletion} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-50">
                {submittingCompletion && <Loader2 className="size-4 animate-spin" />}保存复盘并继续
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
