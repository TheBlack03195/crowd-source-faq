import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CommunityPost } from '../models/CommunityPost.js';
import { PipelineResult } from '../models/PipelineResult.js';
import { chatWithConfig } from '../utils/aiProvider.js';
import { safeParseJson } from '../utils/aiClient.js';
import {
  searchKnowledgeWithFallback,
  triageByScore,
  isSensitiveContent,
  logPipelineEvent,
} from '../utils/pipelineCommon.js';
import { getOrCreateAiUser } from '../utils/systemUser.js';

interface JudgeResponse {
  confidence: number; // 0-1
  answer: string;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are a support triage assistant for a community FAQ platform. Given a user's question and a set of candidate knowledge snippets, you must:
1. Judge your confidence (0.0 to 1.0) that you can correctly answer the question using ONLY the provided knowledge snippets.
2. If confident, synthesize a concise, helpful answer using the snippets.
3. If the snippets don't cover the question, set confidence low and leave the answer empty.

Respond with ONLY a JSON object: { "confidence": number, "answer": string, "reasoning": string }
Do not use any knowledge outside the provided snippets. Do not guess.`;

async function judgePost(title: string, body: string): Promise<JudgeResponse | null> {
  const candidates = await searchKnowledgeWithFallback(`${title} ${body}`, 5);

  if (candidates.length === 0) {
    return { confidence: 0, answer: '', reasoning: 'No matching knowledge found.' };
  }

  const knowledgeBlock = candidates
    .map((c, i) => `[${i + 1}] (${c.source}) Q: ${c.question}\nA: ${c.answer}`)
    .join('\n\n');

  const prompt = `Question: ${title}\n${body}\n\nCandidate knowledge:\n${knowledgeBlock}`;

  const raw = await chatWithConfig('AUTO_ANSWER', prompt, { systemPrompt: SYSTEM_PROMPT, jsonMode: true });
  return safeParseJson<JudgeResponse>(raw);
}


export async function runAutoAnswer(_req: Request, res: Response) {
  const unanswered = await CommunityPost.find({
    status: 'open',
    'comments.0': { $exists: false },
  }).limit(50);

  const results: Array<{ postId: string; verdict: string; score: number }> = [];

  for (const post of unanswered) {
    try {
      if (isSensitiveContent(`${post.title} ${post.body}`)) {
        await logPipelineEvent({
          pipeline: 'auto_answer',
          targetModel: 'CommunityPost',
          targetId: post._id,
          targetTitle: post.title,
          score: 0,
          verdict: 'escalated',
          flagged: true,
          reasoning: 'Sensitive content — always routed to human review regardless of AI confidence.',
        });
        results.push({ postId: post._id.toString(), verdict: 'escalated', score: 0 });
        continue;
      }

      const judgement = await judgePost(post.title, post.body);
      if (!judgement) {
        results.push({ postId: post._id.toString(), verdict: 'escalated', score: 0 });
        continue;
      }

      const triage = triageByScore(judgement.confidence);

      if (triage === 'auto_post' && judgement.answer.trim()) {
        const aiUser = await getOrCreateAiUser();
        post.comments.push({
          _id: new mongoose.Types.ObjectId(),
          authorId: aiUser._id,
          content: `🤖 AI-suggested answer (confidence ${(judgement.confidence * 100).toFixed(0)}%):\n\n${judgement.answer}`,
          isAccepted: false,
          isVerified: true,
          upvotes: 0,
          downvotes: 0,
          votedBy: [],
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        await post.save();

        await logPipelineEvent({
          pipeline: 'auto_answer',
          targetModel: 'CommunityPost',
          targetId: post._id,
          targetTitle: post.title,
          score: judgement.confidence,
          verdict: 'approved',
          flagged: false,
          reasoning: judgement.reasoning,
          provider: 'gemini',
        });
      } else {
        await logPipelineEvent({
          pipeline: 'auto_answer',
          targetModel: 'CommunityPost',
          targetId: post._id,
          targetTitle: post.title,
          score: judgement.confidence,
          verdict: triage === 'queue_review' ? 'queued' : 'escalated',
          flagged: true,
          reasoning: judgement.reasoning,
          provider: 'gemini',
        });
      }

      results.push({ postId: post._id.toString(), verdict: triage, score: judgement.confidence });
    } catch (err) {
      results.push({ postId: post._id.toString(), verdict: 'error', score: 0 });
    }
  }

  res.json({ processed: results.length, results });
}

export async function getAutoAnswerQueue(_req: Request, res: Response) {
  const items = await PipelineResult.find({ pipeline: 'auto_answer', flagged: true })
    .sort({ checkedAt: -1 })
    .limit(100);
  res.json({ items });
}
