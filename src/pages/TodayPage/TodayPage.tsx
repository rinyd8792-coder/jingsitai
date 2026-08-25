import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Play, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { fetchNodes } from '@/lib/api/nodes';
import { fetchTasks } from '@/lib/api/tasks';
import type { INode, ITask } from '@/data/workspace';
import { useWorkspace } from '@/context/WorkspaceContext';
import { localDateKey } from '@/lib/utils';

const PRIORITY_LABEL: Record<INode['priority'], string> = { high: '高', medium: '中', low: '低' };
const STATUS_LABEL: Record<INode['status'], string> = { pending: '未开始', doing: '进行中', partial: '部分完成', waiting: '等待中', paused: '已暂停', done: '已完成', abandoned: '已放弃' };

export default function TodayPage() {
  const navigate = useNavigate();
  const { setFocus } = useWorkspace();
  const [nodes, setNodes] = useState<INode[]>([]);
  const [taskMap, setTaskMap] = useState<Record<string, ITask>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [focusingId, setFocusingId] = useState<string | null>(null);

  const today = localDateKey();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [nodesData, tasksData] = await Promise.all([fetchNodes({ date: today }), fetchTasks()]);
        const map: Record<string, ITask> = {};
        tasksData.forEach((t) => { map[t.id] = t; });
        setTaskMap(map);
        setNodes(nodesData.sort((a, b) => new Date(a.plannedStartTime || a.startTime).getTime() - new Date(b.plannedStartTime || b.startTime).getTime()));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [today]);

  const handleStartFocus = async (nodeId: string) => {
    setFocusingId(nodeId);
    try {
      await setFocus(nodeId);
      navigate('/now');
    } finally {
      setFocusingId(null);
    }
  };
  const total = nodes.length;
  const doneCount = nodes.filter((n) => n.status === 'done').length;
  const doingCount = nodes.filter((n) => n.status === 'doing').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground tracking-wide flex items-center gap-2">
            <Calendar className="size-6 text-primary" strokeWidth={1.5} />
            今日
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-light">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right"><div className="text-2xl font-light tabular-nums text-foreground">{total}</div><div className="text-xs text-muted-foreground font-light">总节点</div></div>
          <div className="text-right"><div className="text-2xl font-light tabular-nums text-emerald-600">{doneCount}</div><div className="text-xs text-muted-foreground font-light">已完成</div></div>
          <div className="text-right"><div className="text-2xl font-light tabular-nums text-primary">{doingCount}</div><div className="text-xs text-muted-foreground font-light">进行中</div></div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : nodes.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-16 text-center bg-card/50">
          <Clock className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground font-light">今日暂无计划节点</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {nodes.map((node) => {
              const task = taskMap[node.taskId];
              const startTime = new Date(node.plannedStartTime || node.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
              const endTime = new Date(node.plannedEndTime || node.estimatedEndTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
              const isDone = node.status === 'done';
              const isDoing = node.status === 'doing';
              const plannedMinutes = Math.round((new Date(node.plannedEndTime || node.estimatedEndTime).getTime() - new Date(node.plannedStartTime || node.startTime).getTime()) / 60000);
              const actualMinutes = node.actualStartTime && node.actualEndTime
                ? Math.round((new Date(node.actualEndTime).getTime() - new Date(node.actualStartTime).getTime()) / 60000)
                : null;
              return (
                <div key={node.id} className="relative flex gap-4">
                  <div className="w-16 shrink-0 text-right pt-3">
                    <div className="text-sm font-light tabular-nums text-foreground">{startTime}</div>
                    <div className="text-xs text-muted-foreground font-light">{endTime}</div>
                  </div>
                  <div className="relative shrink-0 z-10">
                    <div className={`size-4 rounded-full mt-4 border-2 ${isDone ? 'bg-emerald-500 border-emerald-500' : isDoing ? 'bg-primary border-primary animate-pulse' : 'bg-background border-border'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`bg-card rounded-xl border p-4 transition-all ${isDone ? 'opacity-60 border-border/40' : isDoing ? 'border-primary/30 bg-primary/[0.02]' : 'border-border/40 hover:border-border'}`}>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-light ${isDoing ? 'bg-primary/10 text-primary' : isDone ? 'border border-border/60 text-muted-foreground' : 'bg-secondary text-secondary-foreground'}`}>{STATUS_LABEL[node.status]}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md border border-border/60 text-muted-foreground font-light">优先级 {PRIORITY_LABEL[node.priority]}</span>
                        {task && <span className="text-xs px-2 py-0.5 rounded-md border border-border/60 text-muted-foreground font-light">{task.title}</span>}
                      </div>
                      <h3 className={`text-base font-light mt-1 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{node.title || node.name}</h3>
                      <div className="mt-2 text-xs text-muted-foreground">
                        计划 {plannedMinutes} 分钟 · 实际 {actualMinutes === null ? '进行中 / 未记录' : actualMinutes + ' 分钟'}{node.delayReason ? ' · 延期：' + node.delayReason : ''}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {!isDone && (
                          isDoing ? (
                            <button onClick={() => navigate('/now')} className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-light hover:bg-primary/90">
                              <Play className="size-3.5" />继续专注
                            </button>
                          ) : (
                            <button onClick={() => void handleStartFocus(node.id)} disabled={focusingId === node.id} className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border/60 text-xs font-light hover:bg-muted/50 disabled:opacity-50">
                              <Play className="size-3.5" />开始执行
                            </button>
                          )
                        )}
                        {isDone && node.actualEndTime && (
                          <span className="text-xs text-muted-foreground font-light">实际完成：{new Date(node.actualEndTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
