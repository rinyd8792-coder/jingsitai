export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'custom';

export interface AISettings {
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
}

const KEY = 'jingsitai:ai-settings:v1';

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-5.6',
};

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) } : DEFAULT_AI_SETTINGS;
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(settings: AISettings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export async function testAIConnection(settings: AISettings): Promise<string> {
  if (!settings.apiKey) throw new Error('请先填写 API Key');
  if (settings.provider !== 'openai' && settings.provider !== 'custom') {
    return '配置已保存。当前版本先支持 OpenAI-compatible 接口的在线连通性测试。';
  }
  const url = `${settings.baseUrl.replace(/\/$/, '')}/models`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${settings.apiKey}` } });
  if (!res.ok) throw new Error(`连接失败：HTTP ${res.status}`);
  return '连接成功';
}
