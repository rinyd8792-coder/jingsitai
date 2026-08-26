import type { AIProfile, AITextRequest } from '../types';
export async function callOpenAICompatible(profile:AIProfile, request:AITextRequest):Promise<string>{
 const r=await fetch(`${profile.baseUrl.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${profile.apiKey}`},body:JSON.stringify({model:profile.model,temperature:request.temperature??0.2,messages:[...(request.system?[{role:'system',content:request.system}]:[]),{role:'user',content:request.prompt}]})});
 if(!r.ok){const b=await r.text().catch(()=> '');throw new Error(`AI 请求失败：HTTP ${r.status}${b?` · ${b.slice(0,180)}`:''}`)}
 const p=await r.json() as {choices?:Array<{message?:{content?:string}}>}; const t=p.choices?.[0]?.message?.content; if(!t) throw new Error('模型没有返回文本'); return t;
}
