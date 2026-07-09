import type { Request, Response } from 'express';
import { z } from 'zod';
import { FAQ } from '../models/FAQ.js';
import { chatWithConfig } from '../utils/aiProvider.js';
import { logger } from '../utils/logger.js';


export const chatWidgetSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  language: z.enum(['en', 'hi']).optional().default('en'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      })
    )
    .max(10)
    .optional(),
});

const NO_MATCH_REPLY = {
  en: "I couldn't find anything in the FAQ about that yet. Try rephrasing, or browse the FAQ list below.",
  hi: 'Mujhe abhi is baare mein FAQ mein kuch nahi mila. Sawaal alag tarah se poochein, ya neeche FAQ list dekhein.',
};

const DEGRADED_REPLY = {
  en: "I'm having trouble generating an answer right now, but here's what I found in the FAQ that looks related:",
  hi: 'Abhi jawaab generate karne mein dikkat aa rahi hai, lekin FAQ mein ye milta-julta content mila hai:',
};

const MAX_CONTEXT_FAQS = 5;

async function findContextFaqs(message: string) {
  
  const textMatches = await FAQ.find(
    { $text: { $search: message }, reviewStatus: 'approved' },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(MAX_CONTEXT_FAQS)
    .select('question answer');

  if (textMatches.length > 0) return textMatches;

 
  return FAQ.find({ reviewStatus: 'approved' })
    .sort({ viewCount: -1 })
    .limit(MAX_CONTEXT_FAQS)
    .select('question answer');
}

export async function chatWidgetReply(req: Request, res: Response) {
  const { message, history, language } = req.body as z.infer<typeof chatWidgetSchema>;

  const contextFaqs = await findContextFaqs(message);

  const matchedFaqs = contextFaqs.map((f) => ({ _id: f._id.toString(), question: f.question }));

  if (contextFaqs.length === 0) {
    return res.json({
      reply: NO_MATCH_REPLY[language],
      matchedFaqs: [],
    });
  }

  const contextBlock = contextFaqs
    .map((f, i) => `[${i + 1}] Q: ${f.question}\nA: ${f.answer}`)
    .join('\n\n');

  const historyBlock = (history || [])
    .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
    .join('\n');

  const prompt = [
    historyBlock ? `Conversation so far:\n${historyBlock}\n` : '',
    `FAQ context:\n${contextBlock}\n`,
    `User question: ${message}`,
  ]
    .filter(Boolean)
    .join('\n');

  const languageInstruction =
    language === 'hi'
      ? 'Reply in Hindi, written in Devanagari script. Keep widely-used English technical/administrative ' +
        'terms (e.g. NOC, FAQ, stipend) as-is rather than forcing an awkward translation.'
      : 'Reply in English.';

  try {
    const reply = await chatWithConfig('CHAT_WIDGET', prompt, {
      systemPrompt:
        'You are Yaksha-mini, a support widget answering ONLY from the numbered FAQ context provided. ' +
        'Be concise (2-4 sentences). If the context does not answer the question, say you don\'t have ' +
        'that information yet and suggest the user check the full FAQ page or log in and ask Yaksha at ' +
        'samagama.in for their specific case. Never invent policy details not present in the context. ' +
        languageInstruction,
      temperature: 0.2,
    });

    res.json({ reply: reply.trim(), matchedFaqs });
  } catch (err) {
    logger.error('Chat widget AI call failed, falling back to raw matches', {
      message: (err as Error).message,
    });
    res.json({
      reply: DEGRADED_REPLY[language],
      matchedFaqs,
      degraded: true,
    });
  }
}