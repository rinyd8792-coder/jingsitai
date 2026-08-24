import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-light text-foreground mb-4 tracking-tight">404</h1>
        <p className="text-muted-foreground mb-8 font-light">页面不存在</p>
        <Link to="/" className="inline-flex items-center px-4 h-10 rounded-lg border border-border/60 text-sm font-light hover:bg-muted/50 transition-colors">
          返回首页
        </Link>
      </div>
    </div>
  );
}
