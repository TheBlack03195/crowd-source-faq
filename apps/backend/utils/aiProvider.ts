import { chatGemini, type ChatOptions } from './aiClient.js';

export type PipelineKey = 'AUTO_ANSWER' | 'FAQ_AUDIT' | 'ZOOM_EXTRACTOR' | 'CHAT_WIDGET';
export type AiProvider = 'gemini'; 
export interface PipelineProviderConfig {
  provider: AiProvider;
  model: string;
}

const DEFAULT_MODEL_BY_PROVIDER: Record<AiProvider, string> = {
  gemini: 'gemini-1.5-flash',
};


export function getPipelineProviderConfig(pipeline: PipelineKey): PipelineProviderConfig {
  const provider = (process.env[`${pipeline}_PROVIDER`] as AiProvider) || 'gemini';
  const model = process.env[`${pipeline}_MODEL`] || DEFAULT_MODEL_BY_PROVIDER[provider];
  return { provider, model };
}


export async function chatWithConfig(
  pipeline: PipelineKey,
  prompt: string,
  options: ChatOptions = {}
): Promise<string> {
  const config = getPipelineProviderConfig(pipeline);

  switch (config.provider) {
    case 'gemini':
    default:
      return chatGemini(prompt, { ...options, model: options.model || config.model });
  }
}
