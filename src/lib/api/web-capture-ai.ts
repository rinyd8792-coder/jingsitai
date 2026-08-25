import { loadAISettings } from './ai-settings';

export interface WebCaptureAIResult {
  summary: string;
  suggestedType: 'work' | 'life' | 'family' | 'friend' | 'shopping';
  suggestedTitle: string;
  nextAction: string;
  shouldBecomeTask: boolean;
  reason: string;
}

function extractJson(value: string) {
  const cleaned = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('AI 返回格式无法解析');
  return cleaned.slice(start, end + 1);
}

export async function analyzeWebCapture(input: {
  title: string;
  url: string;
  content?: string;
}): Promise<WebCaptureAIResult> {
  const settings = loadAISettings();

  if (!settings.apiKey) throw new Error('请先在「设置 → AI」中填写 API Key');
  if (settings.provider !== 'openai' && settings.provider !== 'custom') {
    throw new Error('网页 AI 分析当前先支持 OpenAI / OpenAI-compatible 接口');
  }

  const endpoint = `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const prompt = `你是“静思台”的网页捕获整理助手。
用户正在浏览一个网页，希望决定是仅保存为资料/拾思，还是转成需要执行的任务。

请基于网页标题、URL 和摘录，给出克制、可执行的整理建议。
只返回 JSON，不要 Markdown。

网页标题：${input.title}
URL：${input.url}
网页摘录：${input.content || '没有抓取到正文，只根据标题判断'}

分类只能是：work / life / family / friend / shopping

返回：
{
  "summary": "80字以内摘要",
  "suggestedType": "work",
  "suggestedTitle": "如果转成任务，建议使用的动作型标题",
  "nextAction": "一个最小下一动作",
  "shouldBecomeTask": true,
  "reason": "为什么建议成为任务或仅保存"
}`;

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
        { role: 'system', content: '你负责把网页信息转换为低负担、可执行的个人工作流输入。' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI 请求失败：HTTP ${response.status}`);

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 没有返回结果');

  const parsed = JSON.parse(extractJson(content)) as Partial<WebCaptureAIResult>;
  const validTypes = ['work', 'life', 'family', 'friend', 'shopping'];

  return {
    summary: String(parsed.summary || ''),
    suggestedType: validTypes.includes(String(parsed.suggestedType))
      ? parsed.suggestedType as WebCaptureAIResult['suggestedType']
      : 'work',
    suggestedTitle: String(parsed.suggestedTitle || input.title),
    nextAction: String(parsed.nextAction || ''),
    shouldBecomeTask: Boolean(parsed.shouldBecomeTask),
    reason: String(parsed.reason || ''),
  };
}
