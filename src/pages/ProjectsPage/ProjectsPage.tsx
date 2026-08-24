import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, ChevronDown, ChevronRight, Play, Loader2,
  Briefcase, Home, GraduationCap, Users,
} from 'lucide-react';
import { fetchProjects } from '@/lib/api/projects';
import { fetchTasks } from '@/lib/api/tasks';
import { fetchNodes } from '@/lib/api/nodes';
import { setCurrentFocus } from '@/lib/api/focus';
import type { IProject, ITask, INode } from '@/data/workspace';

const CATEGORIES: { value: string; label: string; icon: any }[] = [
  { value: 'all', label: '全部', icon: FolderOpen },
  { value: 'work', label: '工作', icon: Briefcase },
  { value: 'life', label: '生活', icon: Home },
  { value: 'family', label: '家庭', icon: Users },
  { value: 'study', label: '学习', icon: GraduationCap },
];

const STATUS_LABEL: Record<IProject['status'], string> = { active: '进行中', paused: '暂停', done: '已完成', archived: '已归档' };
const TASK_STATUS_LABEL: Record<ITask['status'], string> = { inbox: '收件箱', next: '下一步', doing: '进行中', waiting: '等待中', done: '已完成', cancelled: '已取消' };

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [projects, setProjects] = useState<IProject[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [nodes, setNodes] = useState<INode[]>([]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [focusingId, setFocusingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [p, t, n] = await Promise.all([fetchProjects(), fetchTasks(), fetchNodes()]);
        setProjects(p);
        setTasks(t);
        setNodes(n);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredProjects = useMemo(() => {
    if (category === 'all') return projects;
    return projects.filter((p) => p.category === category);
  }, [projects, category]);

  const getProjectTasks = (projectId: string) => tasks.filter((t) => t.projectId === projectId);
  const getTaskNodes = (taskId: string) => nodes.filter((n) => n.taskId === taskId).sort((a, b) => a.order - b.order);
  const getProjectProgress = (projectId: string) => {
    const projTasks = getProjectTasks(projectId);
    if (projTasks.length === 0) return 0;
    const done = projTasks.filter((t) => t.status === 'done').length;
    return Math.round((done / projTasks.length) * 100);
  };

  const handleStartFocus = async (nodeId: string) => {
    setFocusingId(nodeId);
    try {
      await setCurrentFocus(nodeId);
      navigate('/now');
    } finally {
      setFocusingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-light text-foreground tracking-wide flex items-center gap-2">
          <FolderOpen className="size-6 text-primary" strokeWidth={1.5} />
          长物
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-light">项目、任务、节点——所有长期事项的全景</p>
      </div>

      <div className="flex gap-6 border-b border-border/40 pb-2">
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
      ) : filteredProjects.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-16 text-center bg-card/50">
          <FolderOpen className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground font-light">暂无项目</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const projTasks = getProjectTasks(project.id);
            const progress = getProjectProgress(project.id);
            const isExpanded = expandedProject === project.id;
            return (
              <div key={project.id} className="bg-card rounded-xl border border-border/40 overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-light text-foreground">{project.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-md border border-border/60 text-muted-foreground font-light">{STATUS_LABEL[project.status]}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-light">{projTasks.length} 个任务</span>
                      </div>
                      <p className="text-sm font-light text-muted-foreground">{project.description}</p>
                    </div>
                    <button className="shrink-0 size-8 rounded hover:bg-muted/50 flex items-center justify-center">
                      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground font-light tabular-nums shrink-0">{progress}%</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-2 border-t border-border/30 pt-4">
                    {projTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center font-light">暂无任务</p>
                    ) : (
                      projTasks.map((task) => {
                        const taskNodes = getTaskNodes(task.id);
                        const taskExpanded = expandedTask === task.id;
                        return (
                          <div key={task.id} className="rounded-lg border border-border/40 overflow-hidden">
                            <div
                              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                              onClick={() => setExpandedTask(taskExpanded ? null : task.id)}
                            >
                              <ChevronRight className={`size-3.5 text-muted-foreground transition-transform shrink-0 ${taskExpanded ? 'rotate-90' : ''}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{task.title}</div>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-md font-light shrink-0 ${task.status === 'doing' ? 'bg-primary/10 text-primary' : 'border border-border/60 text-muted-foreground'}`}>
                                {TASK_STATUS_LABEL[task.status]}
                              </span>
                            </div>
                            {taskExpanded && (
                              <div className="px-3 pb-3 pl-8 space-y-1.5 border-t border-border/20 pt-2">
                                {taskNodes.length === 0 ? (
                                  <p className="text-xs text-muted-foreground py-2 font-light">暂无节点</p>
                                ) : (
                                  taskNodes.map((node) => (
                                    <div key={node.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30">
                                      <div className={`size-2 rounded-full shrink-0 ${node.status === 'done' ? 'bg-emerald-500' : node.status === 'doing' ? 'bg-primary' : 'bg-border'}`} />
                                      <span className={`flex-1 text-sm font-light truncate ${node.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{node.name}</span>
                                      <span className="text-xs text-muted-foreground/70 font-light tabular-nums shrink-0">
                                        {new Date(node.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {node.status !== 'done' && (
                                        <button
                                          onClick={() => handleStartFocus(node.id)}
                                          disabled={focusingId === node.id}
                                          className="size-6 rounded hover:bg-muted/50 flex items-center justify-center shrink-0 disabled:opacity-50"
                                        >
                                          {focusingId === node.id ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                                        </button>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
