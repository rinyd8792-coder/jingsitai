import { Outlet } from 'react-router-dom';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoginPage from '@/pages/LoginPage/LoginPage';
import AppSidebar from '@/components/AppSidebar';
import { Leaf } from 'lucide-react';

function ProtectedContent() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground font-light">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/40 bg-background/70 backdrop-blur-lg px-6">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground font-light">{user?.name}</span>
              <button
                onClick={logout}
                className="text-xs text-muted-foreground hover:text-foreground font-light transition-colors"
              >
                退出
              </button>
            </div>
            <div className="text-xs text-muted-foreground/70 font-light tracking-wide">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </header>
          <main className="flex-1 w-full overflow-y-auto px-6 md:px-10 lg:px-16 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}

export function Layout() {
  return (
    <AuthProvider>
      <ProtectedContent />
    </AuthProvider>
  );
}
