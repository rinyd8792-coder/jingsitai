import { loadAISettingsV2 } from '@/lib/api/ai-settings';
import { PROVIDER_DEFAULTS } from './provider-defaults';
import { callAnthropic } from './providers/anthropic';
import { callGemini } from './providers/gemini';
import { callOpenAICompatible } from './providers/openai-compatible';
import type { AIProfile, AITextRequest, AITextResponse } from './types';
function resolveProfile(purpose:AITextRequest['purpose']):AIProfile{const s=loadAISettingsV2();const id=s.routing[purpose];const p=s.profiles.find(x=>x.id===id&&x.enabled);if(!p)throw new Error(`没有为「${purpose}」配置可用的 AI 模型`);if(!p.apiKey)throw new Error(`模型「${p.name}」还没有填写 API Key`);if(!p.baseUrl||!p.model)throw new Error(`模型「${p.name}」配置不完整`);return p;}
export async function aiGenerateText(request:AITextRequest):Promise<AITextResponse>{const p=resolveProfile(request.purpose);const a=PROVIDER_DEFAULTS[p.provider].adapter;const text=a==='anthropic'?await callAnthropic(p,request):a==='gemini'?await callGemini(p,request):await callOpenAICompatible(p,request);return {text,profileId:p.id,provider:p.provider,model:p.model};}
export function extractJSONObject(text:string){const c=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/i,'').trim();const s=c.indexOf('{'),e=c.lastIndexOf('}');if(s===-1||e<=s)throw new Error('AI 返回内容中没有可解析 JSON');return c.slice(s,e+1)}
export async function aiGenerateJSON<T>(request:AITextRequest):Promise<T>{const r=await aiGenerateText(request);return JSON.parse(extractJSONObject(r.text)) as T;}
