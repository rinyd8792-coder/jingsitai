import { aiGenerateJSON } from '@/lib/ai/service';
import type { ITask } from '@/data/workspace';
export interface AIBreakdownNodeDraft{title:string;durationMinutes:number;priority:'high'|'medium'|'low';goal?:string}
export interface AIBreakdownResult{summary:string;nodes:AIBreakdownNodeDraft[]}
export async function suggestTaskBreakdown(task:ITask):Promise<AIBreakdownResult>{const deadline=task.deadline?new Date(task.deadline).toLocaleString('zh-CN'):'未设置';const result=await aiGenerateJSON<AIBreakdownResult>({purpose:'planning',temperature:0.2,system:'你负责把复杂事项转换为清晰、克制、可执行的工作节点。',prompt:`把下面任务拆成 2-7 个真正可以开始执行的工作节点，只返回 JSON。
任务标题：${task.title}
任务说明：${task.description||'无'}
任务类型：${task.type||'未分类'}
截止时间：${deadline}
交付物：${task.deliverable||'未设置'}
交付对象：${task.receiver||task.deliverTo||'未设置'}
完成标准：${task.completionCriteria||'未设置'}
返回：{"summary":"一句话说明拆解思路","nodes":[{"title":"节点名称","durationMinutes":45,"priority":"high","goal":"完成标准"}]}`});return{summary:String(result.summary||''),nodes:Array.isArray(result.nodes)?result.nodes.slice(0,10).map((n,i)=>({title:String(n.title||`节点 ${i+1}`),durationMinutes:Math.min(480,Math.max(10,Number(n.durationMinutes)||30)),priority:n.priority==='high'||n.priority==='low'?n.priority:'medium',goal:n.goal?String(n.goal):undefined})):[]}}
