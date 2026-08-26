export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'deepseek'
  | 'qwen'
  | 'glm'
  | 'volcengine'
  | 'volcengine-coding'
  | 'custom';

export type AIPurpose =
  | 'planning'
  | 'webAnalysis'
  | 'review'
  | 'quickClassify';

export interface AIProfile {
  id: string;
  name: string;
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface AIRouting {
  planning: string;
  webAnalysis: string;
  review: string;
  quickClassify: string;
}

export interface AISettingsV2 {
  profiles: AIProfile[];
  routing: AIRouting;
}

export interface AITextRequest {
  purpose: AIPurpose;
  system?: string;
  prompt: string;
  temperature?: number;
}

export interface AITextResponse {
  text: string;
  profileId: string;
  provider: AIProvider;
  model: string;
}
