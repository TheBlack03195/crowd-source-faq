import { logger } from './logger.js';



export interface ChatOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  
  jsonMode?: boolean;
}

let genAIPromise: Promise<any> | null = null;

async function getGenAI() {
  if (!genAIPromise) {
    genAIPromise = import('@google/generative-ai').then(({ GoogleGenerativeAI }) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set — required for any AI pipeline to run.');
      }
      return new GoogleGenerativeAI(apiKey);
    });
  }
  return genAIPromise;
}

export async function chatGemini(prompt: string, options: ChatOptions = {}): Promise<string> {
  const genAI = await getGenAI();
  const model = genAI.getGenerativeModel({
    model: options.model || 'gemini-1.5-flash',
    systemInstruction: options.systemPrompt,
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      responseMimeType: options.jsonMode ? 'application/json' : 'text/plain',
    },
  });

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error('Gemini API call failed', { message: (err as Error).message });
    throw err;
  }
}


export function safeParseJson<T = unknown>(raw: string): T | null {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    logger.warn('Failed to parse AI response as JSON', { preview: cleaned.slice(0, 200) });
    return null;
  }
}
