import { Info } from 'lucide-react';
import type { AIProvider } from '@/lib/ai/types';

export default function VolcengineHelp({ provider }: { provider: AIProvider }) {
  if (provider !== 'volcengine' && provider !== 'volcengine-coding') return null;

  const isCoding = provider === 'volcengine-coding';

  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
      <div className="flex gap-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="space-y-2 text-xs leading-5 text-muted-foreground">
          <div className="font-medium text-foreground">
            {isCoding ? '火山方舟 Coding Plan' : '火山方舟在线推理'}
          </div>
          {isCoding ? (
            <>
              <p>浏览器通过独立 AI Proxy 访问火山方舟；火山 API Key 只保存在 Worker Secret 中。</p>
              <p>AI Proxy URL 请填写部署后的 workers.dev 地址。Model 固定由 Worker 配置，当前默认 glm-5.2。</p>
              <p className="text-amber-700">仅填写受你控制的 Proxy 地址。公开代理仍应配置限流和监控，避免额度被滥用。</p>
            </>
          ) : (
            <>
              <p>Base URL 已自动填入：<code className="ml-1 rounded bg-muted px-1 py-0.5">https://ark.cn-beijing.volces.com/api/v3</code></p>
              <p>Model 请填写火山方舟控制台中的模型标识 / Endpoint ID。</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}