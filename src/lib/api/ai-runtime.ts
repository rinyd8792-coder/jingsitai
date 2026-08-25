import { loadAISettings } from './ai-settings';
import type { ITask } from '@/data/workspace';

export interface AIBreakdownNodeDraft {
  title: string;
  durationMinutes: number;
  priority: 'high' | 'medium' | 'low';
  goal?: string;
}

export interface AIBreakdownResult {
  summary: string;
  nodes: AIBreakdownNodeDraft[];
}

function stripCodeFence(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function extractJson(value: string) {
  const cleaned = stripCodeFence(value);
  const objectStart = cleaned.indexOf('{');
  const objectEnd = cleaned.lastIndexOf('}');
  if (objectStart === -1 || objectEnd === -1 || objectEnd <= objectStart) {
    throw new Error('AI 返回内容中没有可解析的 JSON');
  }
  return cleaned.slice(objectStart, objectEnd + 1);
}

function normalizeResult(raw: unknown): AIBreakdownResult {
  if (!raw || typeof raw !== 'object') throw new Error('AI 返回格式不正确');
  const value = raw as { summary?: unknown; nodes?: unknown };

  if (!Array.isArray(value.nodes) || value.nodes.length === 0) {
    throw new Error('AI 没有生成可执行节点');
  }

  const nodes = value.nodes.slice(0, 10).map((item, index) => {
    const node = (item || {}) as {
      title?: unknown;
      durationMinutes?: unknown;
      priority?: unknown;
      goal?: unknown;
    };

    const duration = Number(node.durationMinutes);
    const priority: AIBreakdownNodeDraft['priority'] =
      node.priority === 'high' || node.priority === 'low' ? node.priority : 'medium';

    return {
      title: String(node.title || `节点 ${index + 1}`).trim(),
      durationMinutes: Number.isFinite(duration)
        ? Math.min(480, Math.max(10, Math.round(duration)))
        : 30,
      priority,
      goal: node.goal ? String(node.goal).trim() : undefined,
    };
  });

  return {
    summary: typeof value.summary === 'string' ? value.summary.trim() : '',
    nodes,
  };
}

export async function suggestTaskBreakdown(task: ITask): Promise<AIBreakdownResult> {
  const settings = loadAISettings();

  if (!settings.apiKey) {
    throw new Error('请先在「设置 → AI」中填写 API Key');
  }

  if (settings.provider !== 'openai' && settings.provider !== 'custom') {
    throw new Error('当前 AI 拆节点先支持 OpenAI / OpenAI-compatible 接口');
  }

  if (!settings.baseUrl || !settings.model) {
    throw new Error('请先补全 Base URL 和 Model');
  }

  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleString('zh-CN')
    : '未设置';

  const prompt = `你是个人执行系统“静思台”的任务规划助手。
请把下面任务拆成 2-7 个真正可以开始执行的工作节点。

原则：
1. 节点是“一个时间段内可以完成的工作阶段”，不是抽象建议。
2. 简单任务不要过度拆解。
3. 每个节点预计 10-180 分钟为宜；确有必要可以更长。
4. 节点顺序必须可执行。
5. 不替用户做最终决策，只给建议。
6. 只返回 JSON，不要 Markdown。

任务标题：${task.title}
任务说明：${task.description || '无'}
任务类型：${task.type || '未分类'}
截止时间：${deadline}
交付物：${task.deliverable || '未设置'}
交付对象：${task.receiver || task.deliverTo || '未设置'}
完成标准：${task.completionCriteria || '未设置'}

返回格式：
{
  "summary": "一句话说明拆解思路",
  "nodes": [
    {
      "title": "节点名称",
      "durationMinutes": 45,
      "priority": "high",
      "goal": "这个节点做到什么程度算结束"
    }
  ]
}`;

  const endpoint = `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: '你负责把复杂事项转换为清晰、克制、可执行的工作节点。',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      detail = '';
    }
    throw new Error(
      `AI 请求失败：HTTP ${response.status}${detail ? ` · ${detail.slice(0, 160)}` : ''}`,
    );
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 没有返回拆解结果');

  return normalizeResult(JSON.parse(extractJson(content)));
}
