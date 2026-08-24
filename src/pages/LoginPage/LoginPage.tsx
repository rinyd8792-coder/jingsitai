import { useState, type FormEvent } from 'react';
import { Leaf } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, register, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo123456');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, name.trim() || username.trim());
      }
    } catch (err: any) {
      setError(err?.message || '操作失败');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-background to-secondary/40" />
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full bg-warning/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-5">
            <Leaf className="size-8" strokeWidth={1} />
          </div>
          <h1 className="text-3xl font-light text-foreground tracking-[0.2em] mb-2">静思台</h1>
          <p className="text-sm text-muted-foreground/80 font-light tracking-wide">
            一座安静的书房 · 时间为柴，自然作料
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-8 shadow-sm">
          <div className="flex mb-8 border-b border-border/50">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 pb-3 text-sm font-light tracking-widest transition-colors ${
                mode === 'login' ? 'text-foreground border-b-2 border-primary -mb-px' : 'text-muted-foreground/60 hover:text-foreground'
              }`}
            >登  入</button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 pb-3 text-sm font-light tracking-widest transition-colors ${
                mode === 'register' ? 'text-foreground border-b-2 border-primary -mb-px' : 'text-muted-foreground/60 hover:text-foreground'
              }`}
            >启  用</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-light tracking-wider">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full h-11 px-3 bg-background/50 border border-border/60 rounded-lg font-light text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-light tracking-wider">昵称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入昵称"
                  className="w-full h-11 px-3 bg-background/50 border border-border/60 rounded-lg font-light text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-light tracking-wider">密  码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full h-11 px-3 bg-background/50 border border-border/60 rounded-lg font-light text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {error && <p className="text-sm text-destructive font-light">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-light tracking-[0.3em] text-sm rounded-lg transition-all disabled:opacity-50"
            >
              {mode === 'login' ? '入  室' : '开  始'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground/60 font-light leading-relaxed">
            演示账号：demo / demo123456
            <br />
            所有数据将保存在您的浏览器本地
            <br />
            仅供本机演示，请勿使用真实密码
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-8 font-light tracking-wide">
          「所有的原创香都是讲究呼吸和留白的写意画」
        </p>
      </div>
    </div>
  );
}
