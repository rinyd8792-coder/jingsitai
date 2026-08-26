import { PROVIDER_DEFAULTS } from '@/lib/ai/provider-defaults';
import type { AIProfile, AIProvider, AISettingsV2, AIPurpose } from '@/lib/ai/types';
export type { AIProvider, AIProfile, AISettingsV2, AIPurpose };
const KEY_V1='jingsitai:ai-settings:v1', KEY_V2='jingsitai:ai-settings:v2';
function newProfile(provider:AIProvider,name?:string):AIProfile{const d=PROVIDER_DEFAULTS[provider];return{id:`ai-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:name||provider,provider,baseUrl:d.baseUrl,apiKey:'',proxyUrl:'',model:d.model,enabled:true}}
export function createAIProfile(provider:AIProvider,name?:string){return newProfile(provider,name)}
const starter=newProfile('openai','主模型');
export const DEFAULT_AI_SETTINGS_V2:AISettingsV2={profiles:[starter],routing:{planning:starter.id,webAnalysis:starter.id,review:starter.id,quickClassify:starter.id}};
function migrateFromV1():AISettingsV2|null{try{const raw=localStorage.getItem(KEY_V1);if(!raw)return null;const old=JSON.parse(raw) as {provider?:AIProvider;baseUrl?:string;apiKey?:string;model?:string};const provider=old.provider||'openai';const p={...newProfile(provider,'迁移的旧配置'),baseUrl:old.baseUrl||PROVIDER_DEFAULTS[provider].baseUrl,apiKey:old.apiKey||'',model:old.model||PROVIDER_DEFAULTS[provider].model};const s={profiles:[p],routing:{planning:p.id,webAnalysis:p.id,review:p.id,quickClassify:p.id}};localStorage.setItem(KEY_V2,JSON.stringify(s));return s}catch{return null}}
export function loadAISettingsV2():AISettingsV2{try{const raw=localStorage.getItem(KEY_V2);if(raw)return JSON.parse(raw);return migrateFromV1()||DEFAULT_AI_SETTINGS_V2}catch{return DEFAULT_AI_SETTINGS_V2}}
export function saveAISettingsV2(settings:AISettingsV2){localStorage.setItem(KEY_V2,JSON.stringify(settings))}
export async function testAIProfile(profile:AIProfile):Promise<string>{
 if(profile.provider==='volcengine-coding'){
  const proxyUrl=(profile.proxyUrl||'').replace(/\/$/,'');
  if(!proxyUrl)throw new Error('请先填写 AI Proxy URL');
  const r=await fetch(`${proxyUrl}/health`);
  const payload=await r.json().catch(()=>({})) as {upstreamConfigured?:boolean;model?:string;error?:string};
  if(!r.ok)throw new Error(payload.error||`连接失败：HTTP ${r.status}`);
  if(!payload.upstreamConfigured)throw new Error('Proxy 尚未配置火山方舟密钥');
  return `连接成功${payload.model?` · ${payload.model}`:''}`;
 }
 if(!profile.apiKey)throw new Error('请先填写 API Key');
 if(!profile.baseUrl||!profile.model)throw new Error('Base URL 或 Model 未填写');
 if(profile.provider==='anthropic'){const r=await fetch(`${profile.baseUrl.replace(/\/$/,'')}/v1/messages`,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':profile.apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:profile.model,max_tokens:8,messages:[{role:'user',content:'Reply OK'}]})});if(!r.ok)throw new Error(`连接失败：HTTP ${r.status}`);return'连接成功'}
 if(profile.provider==='gemini'){const root=profile.baseUrl.replace(/\/$/,'');const r=await fetch(`${root}/models/${encodeURIComponent(profile.model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':profile.apiKey},body:JSON.stringify({contents:[{parts:[{text:'Reply OK'}]}],generationConfig:{maxOutputTokens:8}})});if(!r.ok)throw new Error(`连接失败：HTTP ${r.status}`);return'连接成功'}
 const r=await fetch(`${profile.baseUrl.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${profile.apiKey}`},body:JSON.stringify({model:profile.model,max_tokens:8,messages:[{role:'user',content:'Reply OK'}]})});if(!r.ok)throw new Error(`连接失败：HTTP ${r.status}`);return'连接成功'
}
