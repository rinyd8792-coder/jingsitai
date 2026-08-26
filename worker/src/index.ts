interface Env {
  VOLC_API_KEY: string;
  VOLC_BASE_URL: string;
  VOLC_MODEL: string;
  ALLOWED_ORIGIN: string;
}

function cors(origin: string, allowed: string) {
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status: number, origin: string, env: Env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', ...cors(origin, env.ALLOWED_ORIGIN)},
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') {
      if (origin !== env.ALLOWED_ORIGIN) return json({error:'Origin not allowed'},403,origin,env);
      return new Response(null,{status:204,headers:cors(origin,env.ALLOWED_ORIGIN)});
    }
    if (origin !== env.ALLOWED_ORIGIN) return json({error:'Origin not allowed'},403,origin,env);
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ok:true,provider:'volcengine-coding',model:env.VOLC_MODEL,upstreamConfigured:Boolean(env.VOLC_API_KEY)},200,origin,env);
    }
    if (request.method !== 'POST' || url.pathname !== '/v1/generate') return json({error:'Not found'},404,origin,env);
    if (!env.VOLC_API_KEY) return json({error:'Proxy 未配置 VOLC_API_KEY'},500,origin,env);
    let body: any;
    try { body = await request.json(); } catch { return json({error:'请求 JSON 无效'},400,origin,env); }
    if (!body?.prompt?.trim()) return json({error:'prompt 不能为空'},400,origin,env);
    if (body.prompt.length > 12000 || String(body.system || '').length > 4000) return json({error:'请求内容过长'},413,origin,env);
    const endpoint = `${env.VOLC_BASE_URL.replace(/\/$/,'')}/chat/completions`;
    let upstream: Response;
    try {
      upstream = await fetch(endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${env.VOLC_API_KEY}`},
        body:JSON.stringify({
          model:env.VOLC_MODEL,
          max_tokens:2048,
          temperature:body.temperature ?? 0.2,
          messages:[...(body.system?[{role:'system',content:body.system}]:[]),{role:'user',content:body.prompt}],
        }),
      });
    } catch (error) {
      return json({error:'代理无法连接火山方舟',details:error instanceof Error?error.message:String(error)},502,origin,env);
    }
    const raw = await upstream.text();
    if (!upstream.ok) return json({error:`火山方舟返回 HTTP ${upstream.status}`,details:raw.slice(0,800)},upstream.status,origin,env);
    let payload:any;
    try { payload = JSON.parse(raw); } catch { return json({error:'火山方舟返回非 JSON',details:raw.slice(0,800)},502,origin,env); }
    const text = payload?.choices?.[0]?.message?.content;
    if (!text) return json({error:'火山方舟响应缺少 choices[0].message.content',details:raw.slice(0,800)},502,origin,env);
    return json({text,provider:'volcengine-coding',model:env.VOLC_MODEL,purpose:body.purpose||null},200,origin,env);
  }
};
