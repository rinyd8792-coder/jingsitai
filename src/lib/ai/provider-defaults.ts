import type { AIProvider } from './types';

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  gemini: 'Google Gemini',
  deepseek: 'DeepSeek',
  qwen: '阿里通义千问 / DashScope',
  glm: '智谱 GLM',
  volcengine: '火山方舟 Ark · 在线推理',
  'volcengine-coding': '火山方舟 Ark · Coding Plan',
  custom: '自定义 OpenAI-compatible',
};

export const PROVIDER_DEFAULTS: Record<AIProvider, {
  baseUrl: string;
  model: string;
  adapter: 'openai-compatible' | 'anthropic' | 'gemini';
}> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-5.6',
    adapter: 'openai-compatible',
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-5',
    adapter: 'anthropic',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-3.7-flash',
    adapter: 'gemini',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    adapter: 'openai-compatible',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    adapter: 'openai-compatible',
  },
  glm: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4.5',
    adapter: 'openai-compatible',
  },
  volcengine: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: '',
    adapter: 'openai-compatible',
  },
  'volcengine-coding': {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3',
    model: '',
    adapter: 'openai-compatible',
  },
  custom: {
    baseUrl: '',
    model: '',
    adapter: 'openai-compatible',
  },
};
