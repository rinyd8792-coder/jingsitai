import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  Play, Pause, CheckCircle2, ArrowRight, Lightbulb, HelpCircle,
  ListTodo, FileQuestion, Bookmark, Gavel, Plus, X, Loader2,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import type { ScratchpadType } from '@/data/workspace';

const SCRATCHPAD_TYPES: { value: ScratchpadType; label: string; icon: any; color: string }[] = [
  { value: 'idea', label: '想法', icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
  { value: 'confirm', label: '待确认', icon: HelpCircle, color: 'text-blue-600 bg-blue-50' },
  { value: 'todo', label: '待办', icon: ListTodo, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'question', label: '问题', icon: FileQuestion, color: 'text-purple-600 bg-purple-50' },
  { value: 'resource', label: '资料', icon: Bookmark, color: 'text-cyan-600 bg-cyan-50' },
  { value: 'decision', label: '决策', icon: Gavel, color: 'text-rose-600 bg-rose-50' },
];

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function NowPage() {
  const {
    currentFocus, currentTask, currentNode, scratchpads, isLoading,
    togglePause, tick, completeNode, addScratchpad, removeScratchpad,
  } = useWorkspace();

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionType, setCompletionType] = useState<'done' | 'partial'>('done');
  const [scratchInput, setScratchInput] = useState('');
  const [activeType, setActiveType] = useState<ScratchpadType>('idea');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentFocus || currentFocus.isPaused) return;
    const timer = setInterval(() => { tick(); }, 1000);
    return () => clearInterval(timer);
  }, [currentFocus, tick]);

  const handleComplete = useCallback(async () => {
    setSubmitting(true);
    try {
      await completeNode({ status: completionType });
      setShowCompleteDialog(false);
    } finally {
      setSubmitting(false);
    }
  }, [completeNode, completionType]);

  const handleAddScratchpad = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!scratchInput.trim()) return;
    try {
      await addScratchpad(scratchInput.trim(), activeType);
      setScratchInput('');
    } catch { /* ignore */ }
  }, [scratchInput, activeType, addScratchpad]);

  const remaining = currentFocus
    ? Math.max(0, currentFocus.totalSeconds - currentFocus.elapsedSeconds)
    : 0;
  const progress = currentFocus
    ? Math.min(100, (currentFocus.elapsedSeconds / currentFocus.totalSeconds) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentFocus || !currentNode) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="border border-dashed border-border rounded-xl p-16 text-center bg-card/50">
          <div className="size-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <CheckCircle2 className="size-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-light text-foreground mb-2">今日工作已完成</h2>
          <p className="text-sm text-muted-foreground">去「今日」或「长物」看看，开启新的节点吧</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Focus 卡片 */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-primary/20 overflow-hidden">
          <div
            className={`absolute inset-x-0 top-0 bg-primary rounded-full transition-all duration-500 ${currentFocus.isPaused ? 'opacity-40' : 'animate-pulse'}`}
            style={{ height: `${progress}%` }}
          />
        </div>

        <div className="ml-6 bg-card rounded-xl border border-border/40 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs px-2 py-1 rounded-md border border-border/60 text-muted-foreground font-light">
              {currentTask?.title || '未分配任务'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-md font-light ${currentFocus.isPaused ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 text-primary'}`}>
              {currentFocus.isPaused ? '已暂停' : '专注中'}
            </span>
          </div>
          <h1 className="text-3xl font-light tracking-wide text-foreground mb-1">{currentNode.name}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(currentNode.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {new Date(currentNode.estimatedEndTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            {' · '}优先级：{currentNode.priority === 'high' ? '高' : currentNode.priority === 'medium' ? '中' : '低'}
          </p>

          <div className="mt-6 flex items-baseline gap-4">
            <div className="text-5xl font-light tabular-nums tracking-tight text-foreground">
              {formatTime(remaining)}
            </div>
            <div className="text-sm text-muted-foreground">剩余 {Math.round(progress)}%</div>
          </div>

          <div className="mt-4 w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300 ease-linear rounded-full" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-4 h-9 rounded-lg border border-border/60 text-sm font-light hover:bg-muted/50 transition-colors"
            >
              {currentFocus.isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {currentFocus.isPaused ? '继续' : '暂停'}
            </button>
            <button
              onClick={() => setShowCompleteDialog(true)}
              className="flex items-center gap-2 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-light hover:bg-primary/90 transition-colors"
            >
              <CheckCircle2 className="size-4" />
              完成节点
            </button>
            <div className="flex-1" />
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowRight className="size-3" />
              下一节点自动推进
            </div>
          </div>
        </div>
      </div>

      {/* 完成确认对话框 */}
      {showCompleteDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowCompleteDialog(false)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-light text-foreground mb-1">完成节点</h3>
            <p className="text-sm text-muted-foreground mb-4">选择完成情况，将自动推进到下一个节点</p>
            <div className="space-y-3">
              <button
                className={`w-full text-left p-4 rounded-lg border transition-colors ${completionType === 'done' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                onClick={() => setCompletionType('done')}
              >
                <div className="font-medium text-foreground">已完成</div>
                <div className="text-xs text-muted-foreground mt-1">节点目标全部达成</div>
              </button>
              <button
                className={`w-full text-left p-4 rounded-lg border transition-colors ${completionType === 'partial' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                onClick={() => setCompletionType('partial')}
              >
                <div className="font-medium text-foreground">部分完成</div>
                <div className="text-xs text-muted-foreground mt-1">只完成部分内容，下次继续</div>
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCompleteDialog(false)} className="px-4 h-9 rounded-lg border border-border/60 text-sm font-light hover:bg-muted/50">取消</button>
              <button onClick={handleComplete} disabled={submitting} className="px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-light hover:bg-primary/90 disabled:opacity-50">
                {submitting && <Loader2 className="size-4 animate-spin inline mr-1" />}
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scratchpad */}
      <div className="space-y-4">
        <h2 className="text-lg font-light text-foreground flex items-center gap-2">
          <Lightbulb className="size-5 text-primary" strokeWidth={1.5} />
          思考记录
        </h2>

        <div className="bg-card rounded-xl border border-border/40 p-6">
          <form onSubmit={handleAddScratchpad} className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {SCRATCHPAD_TYPES.map((type) => {
                const Icon = type.icon;
                const active = activeType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setActiveType(type.value)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-light flex items-center gap-1.5 border transition-colors ${
                      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {type.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                value={scratchInput}
                onChange={(e) => setScratchInput(e.target.value)}
                placeholder={`记录一个${SCRATCHPAD_TYPES.find(t => t.value === activeType)?.label}...`}
                className="flex-1 h-10 px-3 bg-background/50 border border-border/60 rounded-lg font-light text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button type="submit" disabled={!scratchInput.trim()} className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50">
                <Plus className="size-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-2">
          {scratchpads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 font-light">还没有记录，想到什么就写下来吧</p>
          ) : (
            scratchpads.map((item) => {
              const typeConfig = SCRATCHPAD_TYPES.find((t) => t.value === item.type);
              const Icon = typeConfig?.icon || Lightbulb;
              return (
                <div key={item.id} className="group flex items-start gap-3 p-4 rounded-lg border border-border/40 bg-card/50 hover:bg-card transition-colors">
                  <span className={`shrink-0 text-xs px-2 py-1 rounded-md font-normal gap-1 flex items-center ${typeConfig?.color || ''}`}>
                    <Icon className="size-3" />
                    {typeConfig?.label || item.type}
                  </span>
                  <p className="flex-1 text-sm text-foreground font-light leading-relaxed">{item.content}</p>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/60">
                      {new Date(item.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => removeScratchpad(item.id)}
                      className="size-6 rounded hover:bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
