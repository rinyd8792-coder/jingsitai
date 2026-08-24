import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Trash2, CheckCircle, Inbox, Loader2 } from 'lucide-react';
import { fetchInboxItems, createInboxItem, processInboxItem, deleteInboxItem } from '@/lib/api/inbox';
import type { IInboxItem } from '@/data/workspace';

export default function InboxPage() {
  const [items, setItems] = useState<IInboxItem[]>([]);
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInboxItems('active');
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const newItem = await createInboxItem(content.trim(), note.trim() || undefined);
      setItems((prev) => [newItem, ...prev]);
      setContent('');
      setNote('');
      setShowNoteInput(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcess = async (id: string) => {
    await processInboxItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteInboxItem(deleteId);
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground tracking-wide flex items-center gap-2">
            <Inbox className="size-6 text-primary" strokeWidth={1.5} />
            拾思
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-light">想到什么就先放进来，不让杂念打断当下</p>
        </div>
        <span className="text-sm px-3 py-1 rounded-full border border-border/60 font-light">{items.length} 条待整理</span>
      </div>

      <div className="bg-card rounded-xl border border-border/40 p-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="随手记下一个念头..."
            className="w-full font-light text-base h-12 px-4 bg-background/50 border border-border/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            onFocus={() => setShowNoteInput(true)}
          />
          {showNoteInput && (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="来源 / 备注（可选）"
              className="w-full font-light text-sm h-10 px-4 bg-background/50 border border-border/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={!content.trim() || submitting} className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-light hover:bg-primary/90 disabled:opacity-50">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              收入
            </button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-16 text-center bg-card/50">
          <Inbox className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground font-light">收件箱空空如也</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="group flex items-start gap-3 p-4 rounded-lg border border-border/40 bg-card/50 hover:bg-card hover:shadow-sm transition-all">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-foreground font-light leading-relaxed">{item.content}</p>
                {item.note && <p className="text-xs text-muted-foreground font-light">{item.note}</p>}
                <p className="text-xs text-muted-foreground/60 font-light">
                  {new Date(item.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleProcess(item.id)} title="标记已整理" className="size-8 rounded hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-emerald-600">
                  <CheckCircle className="size-4" />
                </button>
                <button onClick={() => setDeleteId(item.id)} title="删除" className="size-8 rounded hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-light text-foreground mb-1">确认删除</h3>
            <p className="text-sm text-muted-foreground mb-6">删除后不可恢复，确定要删除这条事项吗？</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 h-9 rounded-lg border border-border/60 text-sm font-light hover:bg-muted/50">取消</button>
              <button onClick={handleDelete} className="px-4 h-9 rounded-lg bg-destructive text-destructive-foreground text-sm font-light hover:bg-destructive/90">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
