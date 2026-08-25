import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Bot, Check, Clock3, ExternalLink, Inbox, Loader2, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createInboxItem } from '@/lib/api/inbox';
import { createTask } from '@/lib/api/tasks';
import { fetchProjects } from '@/lib/api/projects';
import { analyzeWebCapture, type WebCaptureAIResult } from '@/lib/api/web-capture-ai';
import type { IProject } from '@/data/workspace';

const TYPE_OPTIONS = [
  ['work', '工作'], ['life', '生活'], ['family', '家人'], ['friend', '朋友'], ['shopping', '购物'],
] as const;

export default function CapturePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceTitle = searchParams.get('title') || '网页待办';
  const sourceUrl = searchParams.get('url') || '';
  const selection = searchParams.get('selection') || '';
  const excerpt = searchParams.get('excerpt') || '';
  const initialMode = searchParams.get('mode') || 'organize';

  const [projects, setProjects] = useState<IProject[]>([]);
  const [destination, setDestination] = useState<'inbox' | 'task'>(initialMode === 'quick' ? 'inbox' : 'task');
  const [title, setTitle] = useState(sourceTitle);
  const [type, setType] = useState('work');
  const [projectId, setProjectId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [aiResult, setAiResult] = useState<WebCaptureAIResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quickHandled, setQuickHandled] = useState(false);

  const pageContent = useMemo(() => selection || excerpt, [selection, excerpt]);

  useEffect(() => { fetchProjects().then(setProjects).catch(() => setProjects([])); }, []);

  useEffect(() => {
    if (initialMode !== 'quick' || quickHandled) return;
    setQuickHandled(true);
    void quickSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, quickHandled]);

  async function quickSave() {
    setSaving(true);
    try {
      await createInboxItem(sourceTitle, `来源网页：${sourceUrl}${selection ? `\n选中内容：${selection}` : ''}`);
      toast.success('网页已收入拾思');
      navigate('/inbox', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
      setSaving(false);
    }
  }

  async function analyze() {
    setAnalyzing(true);
    try {
      const result = await analyzeWebCapture({ title: sourceTitle, url: sourceUrl, content: pageContent });
      setAiResult(result);
      setDestination(result.shouldBecomeTask ? 'task' : 'inbox');
      setType(result.suggestedType);
      setTitle(result.suggestedTitle || sourceTitle);
      setNextAction(result.nextAction);
      setNote(result.summary);
      toast.success('AI 已给出整理建议');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 分析失败');
    } finally {
      setAnalyzing(false);
    }
  }

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (destination === 'inbox') {
        const details = [note.trim(), nextAction.trim() ? `下一动作建议：${nextAction.trim()}` : '', `来源网页：${sourceUrl}`].filter(Boolean).join('\n');
        await createInboxItem(title.trim(), details);
        toast.success('已收入拾思');
        navigate('/inbox');
        return;
      }

      const task = await createTask({
        title: title.trim(), description: note.trim() || undefined, type, projectId: projectId || null,
        deadline: deadline ? new Date(deadline).toISOString() : undefined, url: sourceUrl || undefined,
        nextAction: nextAction.trim() || undefined, followUpAction: nextAction.trim() || undefined, status: 'next',
      });
      toast.success('已创建待办');
      navigate(`/tasks/${task.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (initialMode === 'quick' && saving) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><Loader2 className="mx-auto size-6 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">正在收入拾思…</p></div></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div><div className="text-xs uppercase tracking-[0.18em] text-primary">Web Capture</div><h1 className="mt-2 text-2xl font-light tracking-wide">整理这个网页</h1><p className="mt-1 text-sm font-light text-muted-foreground">插件负责把网页带回来；你决定它只是资料，还是一件真正要推进的事。</p></div>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="text-sm font-light">{sourceTitle}</div>
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"><ExternalLink className="size-3.5" /><span className="truncate">{sourceUrl}</span></a>
        {pageContent && <div className="mt-4 max-h-32 overflow-y-auto rounded-xl bg-muted/40 p-3 text-xs font-light leading-6 text-muted-foreground">{pageContent}</div>}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <button onClick={() => setDestination('inbox')} className={['rounded-2xl border p-5 text-left transition-all', destination === 'inbox' ? 'border-primary/50 bg-primary/[0.04]' : 'border-border/60 bg-card hover:border-border'].join(' ')}>
          <Inbox className="size-5 text-primary" /><div className="mt-3 text-base font-light">收入拾思</div><div className="mt-1 text-xs leading-5 text-muted-foreground">先保存，不承诺马上执行。适合资料、灵感、稍后再判断的网页。</div>
        </button>
        <button onClick={() => setDestination('task')} className={['rounded-2xl border p-5 text-left transition-all', destination === 'task' ? 'border-primary/50 bg-primary/[0.04]' : 'border-border/60 bg-card hover:border-border'].join(' ')}>
          <Check className="size-5 text-primary" /><div className="mt-3 text-base font-light">创建待办</div><div className="mt-1 text-xs leading-5 text-muted-foreground">明确要做的事直接进入 Tasks，之后可直接完成、自己拆节点或 AI 拆节点。</div>
        </button>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="flex items-center gap-2"><Bot className="size-4 text-primary" /><h2 className="text-lg font-light">AI 帮我判断</h2></div><p className="mt-1 text-xs text-muted-foreground">自动摘要网页，并建议它是否应该成为任务、分类和最小下一动作。</p></div>
          <button onClick={() => void analyze()} disabled={analyzing} className="flex h-10 items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.04] px-4 text-sm text-primary disabled:opacity-50">{analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{analyzing ? '分析中…' : 'AI 分析'}</button>
        </div>
        {aiResult && <div className="mt-4 rounded-xl bg-primary/[0.05] p-4 text-sm font-light leading-6"><div>{aiResult.reason}</div><div className="mt-2 text-xs text-muted-foreground">建议：{aiResult.shouldBecomeTask ? '创建待办' : '先收入拾思'}</div></div>}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2 space-y-2 text-sm font-light">标题<input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3" /></label>
          <label className="space-y-2 text-sm font-light">分类<select value={type} onChange={(e) => setType(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3">{TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {destination === 'task' && <label className="space-y-2 text-sm font-light">所属项目<select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3"><option value="">不归属项目</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>}
          {destination === 'task' && <label className="space-y-2 text-sm font-light">截止时间<div className="relative"><Clock3 className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3" /></div></label>}
          <label className={destination === 'task' ? 'space-y-2 text-sm font-light' : 'md:col-span-2 space-y-2 text-sm font-light'}>下一动作<input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="例如：今晚读完并摘出 3 个可用观点" className="h-11 w-full rounded-xl border border-border bg-background px-3" /></label>
          <label className="md:col-span-2 space-y-2 text-sm font-light">摘要 / 备注<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="可以自己写，也可以先点 AI 分析" className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3" /></label>
        </div>
        <div className="mt-6 flex justify-end"><button onClick={() => void save()} disabled={saving || !title.trim()} className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : destination === 'task' ? <ArrowRight className="size-4" /> : <Save className="size-4" />}{saving ? '保存中…' : destination === 'task' ? '创建待办' : '收入拾思'}</button></div>
      </section>
    </div>
  );
}
