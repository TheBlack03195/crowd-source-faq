import { chatWithConfig } from './aiProvider.js';
import { safeParseJson } from './aiClient.js';

export interface ExtractedQA {
  question: string;
  answer: string;
}

const SYSTEM_PROMPT = `You extract reusable Q&A pairs from meeting transcripts for a community FAQ knowledge base. Only extract genuine question-and-answer exchanges where someone asked something and someone else gave a substantive answer — skip small talk, scheduling chatter, and anything without a clear factual answer.

Rewrite each question and answer in clear, standalone language (someone reading just the Q&A pair later, with no meeting context, should fully understand it).

Respond with ONLY a JSON array: [{ "question": string, "answer": string }, ...]
If there are no extractable Q&A pairs, respond with an empty array: []`;


export async function extractInsightsFromTranscript(transcriptText: string): Promise<ExtractedQA[]> {
  const MAX_CHARS = 12000;
  const truncated =
    transcriptText.length > MAX_CHARS ? transcriptText.slice(0, MAX_CHARS) + '\n[...truncated]' : transcriptText;

  const raw = await chatWithConfig('ZOOM_EXTRACTOR', truncated, {
    systemPrompt: SYSTEM_PROMPT,
    jsonMode: true,
  });

  const parsed = safeParseJson<ExtractedQA[]>(raw);
  if (!parsed || !Array.isArray(parsed)) return [];

  return parsed.filter(
    (qa): qa is ExtractedQA =>
      typeof qa?.question === 'string' && typeof qa?.answer === 'string' && qa.question.trim().length > 0
  );
}
