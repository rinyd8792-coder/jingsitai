import { useState } from 'react';
import { Bot, Save, PlugZap, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { loadAISettings, saveAISettings, testAIConnection, type AIProvider } from '@/lib/api/ai-settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState(loadAISettings);
  const [testing, setTesting] = useState(false);

  const providerDefaults: Record<AIProvider, { baseUrl: string; model: string }> = {
    openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5.6' },
    anthropic: { baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-5' },
    gemini: { baseUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-2.5-pro' },
    custom: { baseUrl: '', model: '' },
  };

  const changeProvider = (provider: AIProvider) => setSettings((s) => ({ ...s, provider, ...providerDefaults[provider] }));

  const save = () => { saveAISettings(settings); toast.success('AI 配置已保存'); };
  const test = async () => {
    setTesting(true);
    try { toast.success(await testAIConnection(settings)); }
    catch (e) { toast.error(e instanceof Error ? e.message : '连接失败'); }
    finally { setTesting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-light tracking-wide flex items-center gap-2"><Bot className="size-6 text-primary" />设置 · AI</h1><p className="text-sm text-muted-foreground mt-1">为任务拆解、节点复盘和 Inbox 整理预留模型能力</p></div>
      <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-5">
        <label className="block space-y-2 text-sm">模型服务商
          <select value={settings.provider} onChange={(e) => changeProvider(e.target.value as AIProvider)} className="w-full h-11 px-3 rounded-lg border border-border bg-background">
            <option value="openai">OpenAI</option><option value="anthropic">Anthropic</option><option value="gemini">Gemini</option><option value="custom">自定义 OpenAI-compatible</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm">API Base URL<input value={settings.baseUrl} onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })} className="w-full h-11 px-3 rounded-lg border border-border bg-background" /></label>
        <label className="block space-y-2 text-sm">API Key<input type="password" value={settings.apiKey} onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })} placeholder="sk-..." className="w-full h-11 px-3 rounded-lg border border-border bg-background" /></label>
        <label className="block space-y-2 text-sm">Model<input value={settings.model} onChange={(e) => setSettings({ ...settings, model: e.target.value })} placeholder="模型名称" className="w-full h-11 px-3 rounded-lg border border-border bg-background" /></label>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex gap-3 text-sm text-muted-foreground"><ShieldAlert className="size-5 shrink-0 text-warning" /><p>当前版本配置保存在浏览器 localStorage，仅建议个人测试使用。正式上线应把密钥移到服务端，由后端代理 AI 请求。</p></div>
        <div className="flex justify-end gap-3"><button onClick={test} disabled={testing} className="h-10 px-4 rounded-lg border border-border flex items-center gap-2 text-sm"><PlugZap className="size-4" />{testing ? '测试中…' : '测试连接'}</button><button onClick={save} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm"><Save className="size-4" />保存配置</button></div>
      </div>
      <div className="rounded-2xl border border-dashed border-border p-5"><h2 className="font-light">下一步 AI 能力</h2><p className="text-sm text-muted-foreground mt-2 leading-6">① 把复杂任务建议拆成节点；② 节点结束时把 Scratchpad 归纳成结论 / 遗留问题 / Next Action；③ 帮助整理 Inbox，但所有结果由用户确认后写入。</p></div>
    </div>
  );
}
