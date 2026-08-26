import type { AIProfile, AITextRequest } from '../types';

export async function callJingsitaiProxy(profile: AIProfile, request: AITextRequest): Promise<string> {
  const proxyUrl = (profile.proxyUrl || '').replace(/\/$/, '');
  if (!proxyUrl) throw new Error('请先填写 AI Proxy URL');
  let response: Response;
  try {
    response = await fetch(`${proxyUrl}/v1/generate`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({purpose:request.purpose,system:request.system,prompt:request.prompt,temperature:request.temperature ?? 0.2}),
    });
  } catch {
    throw new Error('无法连接 AI Proxy。请确认 Proxy 已部署、URL 正确，并允许当前静思台域名访问。');
  }
  const payload = await response.json().catch(() => ({})) as any;
  if (!response.ok) throw new Error(payload.error || payload.details || `AI Proxy 请求失败：HTTP ${response.status}`);
  if (!payload.text) throw new Error('AI Proxy 没有返回文本');
  return payload.text;
}
