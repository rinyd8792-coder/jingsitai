import { NavLink, useLocation } from 'react-router-dom';
import { Leaf, Inbox, ListTodo, Calendar, Clock, FolderOpen, User, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

const NAV_ITEMS = [
  { path: '/now', label: '当下', icon: Leaf, hint: '当前执行' },
  { path: '/inbox', label: '拾思', icon: Inbox, hint: '收件箱' },
  { path: '/tasks', label: '待办', icon: ListTodo, hint: '所有待推进事项' },
  { path: '/today', label: '今日', icon: Calendar, hint: '今日计划' },
  { path: '/waiting', label: '待续', icon: Clock, hint: '待续列表' },
  { path: '/projects', label: '长物', icon: FolderOpen, hint: '项目管理' },
  { path: '/settings', label: '设置', icon: Settings, hint: 'AI 与连接' },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? "w-[76px]" : "w-[264px]"} shrink-0 border-r border-border/35 bg-card/45 flex flex-col transition-[width] duration-300`}>
      <div className="border-b border-border/40 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="size-9 shrink-0 rounded-full bg-[#EEE8DC] text-[#817764] flex items-center justify-center">
            <Leaf className="size-5" strokeWidth={1.5} />
          </div>
          <div className={collapsed ? "hidden" : "flex-1 min-w-0"}>
            <div className="jingsitai-brand-title text-lg text-foreground truncate tracking-wide">静思台</div>
            <div className="jingsitai-editorial text-xs text-muted-foreground truncate">一座安静的书房</div>
          </div>
        </div>
      </div>

      <div className="flex justify-end px-3 pb-3 pt-2"><button onClick={() => setCollapsed(value => !value)} title={collapsed ? "展开侧边栏" : "收起侧边栏"} aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50">{collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}</button></div>
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isTaskDetail = pathname.startsWith('/tasks/');
            const isActive =
              item.path === '/now'
                ? pathname === '/now' || pathname === '/'
                : item.path === '/tasks'
                  ? pathname === '/tasks' || isTaskDetail
                  : pathname === item.path || pathname.startsWith(`${item.path}/`);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/now' || item.path === '/tasks'}
                title={item.hint}
                className={`flex items-center gap-3 h-11 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#EAE5DB] text-[#514B43]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="size-4.5 shrink-0" strokeWidth={1.5} />
                {!collapsed && <span className="jingsitai-editorial text-[16px] font-normal tracking-wide">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border/40 p-3">
        <div className="flex items-center gap-3 px-1 py-2">
          <div className="size-8 shrink-0 rounded-full bg-[#EEE8DC] text-[#817764] flex items-center justify-center">
            <User className="size-4" strokeWidth={1.5} />
          </div>
          <div className={collapsed ? "hidden" : "flex-1 min-w-0"}>
            <div className="text-sm font-normal truncate text-foreground">
              {user?.name || '访客'}
            </div>
            <div className="jingsitai-editorial text-xs text-muted-foreground truncate">
              今日安好
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
