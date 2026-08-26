import { aiGenerateJSON } from '@/lib/ai/service';
export interface WebCaptureAIResult{summary:string;suggestedType:'work'|'life'|'family'|'friend'|'shopping';suggestedTitle:string;nextAction:string;shouldBecomeTask:boolean;reason:string}
export async function analyzeWebCapture(input:{title:string;url:string;content?:string}):Promise<WebCaptureAIResult>{const r=await aiGenerateJSON<WebCaptureAIResult>({purpose:'webAnalysis',temperature:0.2,system:'你负责把网页信息转换为低负担、可执行的个人工作流输入。',prompt:`判断这个网页应该仅保存还是转成任务，只返回 JSON。
标题：${input.title}
URL：${input.url}
摘录：${input.content||'无'}
分类只能是 work/life/family/friend/shopping。
返回：{"summary":"80字以内摘要","suggestedType":"work","suggestedTitle":"动作型标题","nextAction":"一个最小下一动作","shouldBecomeTask":true,"reason":"原因"}`});const types=['work','life','family','friend','shopping'];return{summary:String(r.summary||''),suggestedType:types.includes(String(r.suggestedType))?r.suggestedType:'work',suggestedTitle:String(r.suggestedTitle||input.title),nextAction:String(r.nextAction||''),shouldBecomeTask:Boolean(r.shouldBecomeTask),reason:String(r.reason||'')}}
