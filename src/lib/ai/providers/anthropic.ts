import type { AIProfile, AITextRequest } from '../types';
export async function callAnthropic(profile:AIProfile, request:AITextRequest):Promise<string>{
 const r=await fetch(`${profile.baseUrl.replace(/\/$/,'')}/v1/messages`,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':profile.apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:profile.model,max_tokens:2048,temperature:request.temperature??0.2,...(request.system?{system:request.system}:{}),messages:[{role:'user',content:request.prompt}]})});
 if(!r.ok){const b=await r.text().catch(()=> '');throw new Error(`Anthropic 请求失败：HTTP ${r.status}${b?` · ${b.slice(0,180)}`:''}`)}
 const p=await r.json() as {content?:Array<{type?:string;text?:string}>}; const t=p.content?.find(x=>x.type==='text')?.text; if(!t) throw new Error('Anthropic 没有返回文本'); return t;
}
