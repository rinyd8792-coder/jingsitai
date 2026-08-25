import { useEffect, useState, type FormEvent } from 'react';
import { X, Plus, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createTask } from '@/lib/api/tasks';
import { fetchProjects } from '@/lib/api/projects';
import type { IProject, ITask } from '@/data/workspace';

export interface TaskComposerPreset {
  title?: string;
  description?: string;
  url?: string;
}

export default function TaskComposer({
  open,
  onClose,
  onCreated,
  preset,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (task: ITask) => void;
  preset?: TaskComposerPreset;
}) {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('work');
  const [projectId, setProjectId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [receiver, setReceiver] = useState('');
  const [deliverable, setDeliverable] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProjects().then(setProjects);
      setTitle(preset?.title || '');
      setDescription(preset?.description || '');
      setUrl(preset?.url || '');
      setType('work');
      setProjectId('');
      setDeadline('');
      setReceiver('');
      setDeliverable('');
    }
  }, [open, preset?.title, preset?.description, preset?.url]);

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const task = await createTask({
        title: title.trim(),
        description: description.trim(),
        type,
        projectId: projectId || null,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        receiver: receiver.trim() || undefined,
        deliverTo: receiver.trim() || undefined,
        deliverable: deliverable.trim() || undefined,
        url: url.trim() || undefined,
        status: 'next',
      });
      toast.success('任务已创建');
      onCreated?.(task);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-light tracking-wide">新建任务</h2>
            <p className="text-xs text-muted-foreground mt-1">先接住事情，细节可以之后再拆节点</p>
          </div>
          <button onClick={onClose} className="size-9 rounded-lg hover:bg-muted flex items-center justify-center"><X className="size-4" /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="要推进什么？" className="w-full h-12 px-4 rounded-xl border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="补充背景 / 完成标准（可选）" rows={3} className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5 text-sm font-light">分类
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background">
                <option value="work">工作</option><option value="life">生活</option><option value="family">家人</option><option value="friend">朋友</option><option value="shopping">购物</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-light">所属项目
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background">
                <option value="">不归属项目</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-light">截止时间
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background" />
            </label>
            <label className="space-y-1.5 text-sm font-light">交付对象
              <input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="自己 / 同事 / 客户" className="w-full h-10 px-3 rounded-lg border border-border bg-background" />
            </label>
            <label className="space-y-1.5 text-sm font-light">交付物
              <input value={deliverable} onChange={(e) => setDeliverable(e.target.value)} placeholder="文档、链接、消息……" className="w-full h-10 px-3 rounded-lg border border-border bg-background" />
            </label>
            <label className="space-y-1.5 text-sm font-light">来源网页
              <div className="relative"><LinkIcon className="size-4 absolute left-3 top-3 text-muted-foreground" /><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background" /></div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm">取消</button>
            <button type="submit" disabled={!title.trim() || submitting} className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-2 disabled:opacity-50"><Plus className="size-4" />{submitting ? '创建中…' : '创建任务'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
