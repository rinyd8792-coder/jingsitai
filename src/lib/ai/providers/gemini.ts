import type { AIProfile, AITextRequest } from '../types';
export async function callGemini(profile:AIProfile, request:AITextRequest):Promise<string>{
 const root=profile.baseUrl.replace(/\/$/,''); const endpoint=`${root}/models/${encodeURIComponent(profile.model)}:generateContent`;
 const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':profile.apiKey},body:JSON.stringify({contents:[{role:'user',parts:[{text:request.prompt}]}],...(request.system?{systemInstruction:{parts:[{text:request.system}]}}:{}),generationConfig:{temperature:request.temperature??0.2}})});
 if(!r.ok){const b=await r.text().catch(()=> '');throw new Error(`Gemini 请求失败：HTTP ${r.status}${b?` · ${b.slice(0,180)}`:''}`)}
 const p=await r.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>}; const t=p.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('').trim(); if(!t) throw new Error('Gemini 没有返回文本'); return t;
}
