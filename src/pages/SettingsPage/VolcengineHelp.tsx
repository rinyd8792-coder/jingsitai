import { Info } from 'lucide-react';
import type { AIProvider } from '@/lib/ai/types';

export default function VolcengineHelp({ provider }: { provider: AIProvider }) {
  if (provider !== 'volcengine' && provider !== 'volcengine-coding') return null;

  const isCoding = provider === 'volcengine-coding';

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
      <div className="flex gap-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="space-y-2 text-xs leading-5 text-muted-foreground">
          <div className="font-medium text-foreground">
            {isCoding ? '火山方舟 Coding Plan' : '火山方舟在线推理'}
          </div>
          <p>
            Base URL 已自动填入：
            <code className="ml-1 rounded bg-muted px-1 py-0.5">
              {isCoding
                ? 'https://ark.cn-beijing.volces.com/api/coding/v3'
                : 'https://ark.cn-beijing.volces.com/api/v3'}
            </code>
          </p>
          <p>
            Model 请填写你在火山方舟控制台实际使用的模型标识 / Endpoint ID。
            不同账户与模型可能不同，因此静思台不写死默认 Model。
          </p>
          {isCoding && (
            <p className="text-amber-700">
              Coding Plan 和普通在线推理地址不同。若你使用 Coding Plan，请保持当前地址，避免误走按量计费接口。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
