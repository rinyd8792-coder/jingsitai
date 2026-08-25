import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  CircleDot,
  Clock3,
  ExternalLink,
  ListTodo,
  Loader2,
  Play,
  RefreshCw,
  Route,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchTasks, updateTask } from '@/lib/api/tasks';
import { fetchNodes } from '@/lib/api/nodes';
import type { INode, ITask, TaskStatus } from '@/data/workspace';

const STATUS_LABEL: Record<TaskStatus, string> = {
  inbox: '收件箱',
  next: '待开始',
  doing: '进行中',
  waiting: '待续',
  done: '已完成',
  cancelled: '已取消',
};

const TYPE_LABEL: Record<string, string> = {
  work: '工作',
  life: '生活',
  family: '家人',
  friend: '朋友',
  shopping: '购物',
};

function formatDeadline(value?: string) {
  if (!value) return '未设置截止时间';
  const date = new Date(value);
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [nodes, setNodes] = useState<INode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | TaskStatus>('active');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [taskData, nodeData] = await Promise.all([fetchTasks(), fetchNodes()]);
      setTasks(taskData);
      setNodes(nodeData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const nodeCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    nodes.forEach((node) => {
      map[node.taskId] = (map[node.taskId] || 0) + 1;
    });
    return map;
  }, [nodes]);

  const visibleTasks = useMemo(() => {
    const active = tasks.filter((task) => !['done', 'cancelled'].includes(task.status));
    const source = filter === 'active' ? active : tasks.filter((task) => task.status === filter);
    return [...source].sort((a, b) => {
      if (!a.deadline && !b.deadline) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [filter, tasks]);

  async function completeSimpleTask(task: ITask) {
    setUpdatingId(task.id);
    try {
      const updated = await updateTask(task.id, { status: 'done' });
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success('待办已完成');
    } finally {
      setUpdatingId(null);
    }
  }

  async function resumeTask(task: ITask) {
    setUpdatingId(task.id);
    try {
      const updated = await updateTask(task.id, { status: 'next' });
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success('已移回待开始');
    } finally {
      setUpdatingId(null);
    }
  }

  const activeCount = tasks.filter((task) => !['done', 'cancelled'].includes(task.status)).length;
  const noNodeCount = tasks.filter((task) => !['done', 'cancelled'].includes(task.status) && !nodeCountMap[task.id]).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-light tracking-wide">
            <ListTodo className="size-6 text-primary" strokeWidth={1.5} />
            待办
          </h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            所有已创建但尚未结束的事情都在这里。简单事项直接完成，复杂事项再拆节点。
          </p>
        </div>

        <div className="flex gap-5 text-right">
          <div>
            <div className="text-2xl font-light tabular-nums">{activeCount}</div>
            <div className="text-xs text-muted-foreground">进行中的事情</div>
          </div>
          <div>
            <div className="text-2xl font-light tabular-nums text-primary">{noNodeCount}</div>
            <div className="text-xs text-muted-foreground">尚未拆节点</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['active', '全部待办'],
          ['next', '待开始'],
          ['doing', '进行中'],
          ['waiting', '待续'],
          ['done', '已完成'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value as typeof filter)}
            className={[
              'h-9 rounded-full px-4 text-sm font-light transition-colors',
              filter === value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border/60 bg-card text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <ListTodo className="mx-auto mb-3 size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">这里暂时没有待办</p>
          <p className="mt-1 text-xs text-muted-foreground/70">点击顶部「新建任务」，创建后会自动来到这里。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => {
            const nodeCount = nodeCountMap[task.id] || 0;
            const isSimple = nodeCount === 0;
            const isDone = task.status === 'done';
            const isWaiting = task.status === 'waiting';

            return (
              <article
                key={task.id}
                className={[
                  'rounded-2xl border bg-card p-5 transition-all',
                  isDone ? 'border-border/40 opacity-60' : 'border-border/60 hover:border-primary/30 hover:shadow-sm',
                ].join(' ')}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <button
                    disabled={isDone || updatingId === task.id}
                    onClick={() => !isDone && void completeSimpleTask(task)}
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground hover:border-primary hover:text-primary disabled:cursor-default"
                    title={isDone ? '已完成' : '直接完成'}
                  >
                    {updatingId === task.id
                      ? <Loader2 className="size-4 animate-spin" />
                      : isDone
                        ? <CheckCircle2 className="size-5 text-emerald-600" />
                        : <CircleDot className="size-4" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={['text-base font-light', isDone ? 'line-through' : ''].join(' ')}>
                        {task.title}
                      </h2>
                      <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {STATUS_LABEL[task.status]}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {TYPE_LABEL[task.type] || task.type || '未分类'}
                      </span>
                      {isSimple && !isDone && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                          可直接完成
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="mt-2 line-clamp-2 text-sm font-light leading-6 text-muted-foreground">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="size-3.5" />
                        {formatDeadline(task.deadline)}
                      </span>
                      <span>{nodeCount ? `${nodeCount} 个工作节点` : '尚未拆节点'}</span>
                      {(task.receiver || task.deliverTo) && <span>交付给：{task.receiver || task.deliverTo}</span>}
                    </div>

                    {task.url && (
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex max-w-full items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="size-3.5 shrink-0" />
                        <span className="truncate">打开来源网页</span>
                      </a>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {isWaiting && (
                      <button
                        onClick={() => void resumeTask(task)}
                        disabled={updatingId === task.id}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs hover:bg-muted/50 disabled:opacity-50"
                      >
                        <RefreshCw className="size-3.5" />
                        继续
                      </button>
                    )}

                    {!isDone && (
                      <button
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs hover:border-primary/40 hover:bg-primary/[0.03]"
                      >
                        {nodeCount ? <Play className="size-3.5" /> : <Route className="size-3.5" />}
                        {nodeCount ? '查看执行' : '拆节点'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-border p-5 text-sm font-light leading-6 text-muted-foreground">
        <strong className="font-medium text-foreground">执行规则：</strong>
        买东西、回消息这类简单事项可以直接完成；方案、作品集、项目推进等复杂事项进入任务详情后再拆成 Node，并进入 Focus。
      </div>
    </div>
  );
}
