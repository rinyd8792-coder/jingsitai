import { useState, useEffect } from 'react';
import { Clock, ArrowRight, Loader2, User, Database, HelpCircle, MoreHorizontal } from 'lucide-react';
import { fetchWaitingTasks, resumeWaitingTask } from '@/lib/api/tasks';
import type { ITask } from '@/data/workspace';

const CATEGORIES = [
  { value: 'all', label: '全部', icon: MoreHorizontal },
  { value: 'person', label: '等人', icon: User },
  { value: 'data', label: '等数据', icon: Database },
  { value: 'confirm', label: '等确认', icon: HelpCircle },
  { value: 'other', label: '其他', icon: MoreHorizontal },
];

export default function WaitingPage() {
  const [category, setCategory] = useState('all');
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resumingId, setResumingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchWaitingTasks(category);
        setTasks(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [category]);

  const handleResume = async (taskId: string) => {
    setResumingId(taskId);
    try {
      await resumeWaitingTask(taskId, 'next');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } finally {
      setResumingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-light text-foreground tracking-wide flex items-center gap-2">
          <Clock className="size-6 text-primary" strokeWidth={1.5} />
          待续
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-light">管理外部依赖：在等待时也始终保留下一次跟进动作</p>
      </div>

      <div className="flex gap-4 border-b border-border/40 pb-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-1.5 pb-2 text-sm font-light transition-colors border-b-2 -mb-2 ${category === cat.value ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
            >
              <Icon className="size-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : tasks.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-16 text-center bg-card/50">
          <Clock className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground font-light">暂无等待事项</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="bg-card rounded-xl border border-border/40 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-light text-foreground">{task.title}</h3>
                  {task.type && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-md border border-border/60 text-muted-foreground font-light">{task.type}</span>}
                </div>
                <button
                  onClick={() => handleResume(task.id)}
                  disabled={resumingId === task.id}
                  className="shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border/60 text-sm font-light hover:bg-muted/50 disabled:opacity-50"
                >
                  {resumingId === task.id ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
                  恢复推进
                </button>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex gap-2 text-muted-foreground font-light">
                  <span className="shrink-0">等待对象：</span>
                  <span className="text-foreground">{task.waitingObject || '外部依赖'}</span>
                </div>
                {task.waitingReason && (
                  <div className="flex gap-2 text-muted-foreground font-light">
                    <span className="shrink-0">等待原因：</span>
                    <span className="text-foreground">{task.waitingReason}</span>
                  </div>
                )}
                {(task.expectedResumeTime || task.expectedResume) && (
                  <div className="flex gap-2 text-muted-foreground font-light">
                    <span className="shrink-0">预计恢复：</span>
                    <span className="text-foreground">{new Date((task.expectedResumeTime || task.expectedResume)!).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
                {(task.followUpAction || task.nextAction) && (
                  <div className="flex gap-2 text-muted-foreground font-light">
                    <span className="shrink-0">下一跟进动作：</span>
                    <span className="text-foreground">{task.followUpAction || task.nextAction}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
