import type { Request, Response } from 'express';
import { FAQ } from '../models/FAQ.js';
import { PipelineResult } from '../models/PipelineResult.js';
import { chatWithConfig } from '../utils/aiProvider.js';
import { safeParseJson } from '../utils/aiClient.js';
import { searchKnowledgeWithFallback, logPipelineEvent, buildAuditMetaUpdate } from '../utils/pipelineCommon.js';

interface AuditResponse {
  verdict: 'correct' | 'drift_detected' | 'contradiction' | 'stale';
  score: number; 
  reasoning: string;
}

const SYSTEM_PROMPT = `You are a fact-checking assistant auditing an FAQ answer against newer knowledge from the same organization. Compare the existing FAQ answer against the provided knowledge snippets (which may be more recent).

Verdicts:
- "correct": the FAQ answer is still accurate and consistent with the knowledge snippets (score >= 0.80)
- "drift_detected": the FAQ is broadly still right but details have shifted (score 0.60-0.79)
- "contradiction": the knowledge snippets directly contradict the FAQ answer (score < 0.60)
- "stale": there isn't enough new knowledge to judge either way

Respond with ONLY a JSON object: { "verdict": string, "score": number, "reasoning": string }`;

async function auditFaq(question: string, answer: string): Promise<AuditResponse | null> {
  const candidates = await searchKnowledgeWithFallback(question, 5);

  if (candidates.length === 0) {
    return { verdict: 'stale', score: 1, reasoning: 'No newer knowledge available to compare against.' };
  }

  const knowledgeBlock = candidates
    .map((c, i) => `[${i + 1}] (${c.source}) Q: ${c.question}\nA: ${c.answer}`)
    .join('\n\n');

  const prompt = `Existing FAQ:\nQ: ${question}\nA: ${answer}\n\nNewer knowledge:\n${knowledgeBlock}`;

  const raw = await chatWithConfig('FAQ_AUDIT', prompt, { systemPrompt: SYSTEM_PROMPT, jsonMode: true });
  return safeParseJson<AuditResponse>(raw);
}


export async function runFaqAudit(_req: Request, res: Response) {
  const faqs = await FAQ.find({ reviewStatus: 'approved' }).limit(100);
  const results: Array<{ faqId: string; verdict: string; score: number }> = [];

  for (const faq of faqs) {
    try {
      const audit = await auditFaq(faq.question, faq.answer);
      if (!audit) {
        results.push({ faqId: faq._id.toString(), verdict: 'error', score: 0 });
        continue;
      }

      if (audit.verdict !== 'correct') {
        await FAQ.findByIdAndUpdate(faq._id, buildAuditMetaUpdate(audit.verdict));
      } else {
        await FAQ.findByIdAndUpdate(faq._id, { lastVerifiedAt: new Date() });
      }

      await logPipelineEvent({
        pipeline: 'faq_audit',
        targetModel: 'FAQ',
        targetId: faq._id,
        targetTitle: faq.question,
        score: audit.score,
        verdict: audit.verdict,
        flagged: audit.verdict !== 'correct',
        reasoning: audit.reasoning,
        provider: 'gemini',
      });

      results.push({ faqId: faq._id.toString(), verdict: audit.verdict, score: audit.score });
    } catch (err) {
      results.push({ faqId: faq._id.toString(), verdict: 'error', score: 0 });
    }
  }

  res.json({ processed: results.length, results });
}


export async function getAuditQueue(_req: Request, res: Response) {
  const flagged = await FAQ.find({ reviewStatus: 'pending_review' }).sort({ updatedAt: -1 });
  res.json({ items: flagged });
}


export async function getAuditStats(_req: Request, res: Response) {
  const items = await PipelineResult.find({ pipeline: 'faq_audit' }).sort({ checkedAt: -1 }).limit(200);
  res.json({ items });
}


export async function approveAuditedFaq(req: Request, res: Response) {
  const faq = await FAQ.findByIdAndUpdate(
    req.params.id,
    { reviewStatus: 'approved', lastVerifiedAt: new Date() },
    { new: true }
  );
  if (!faq) return res.status(404).json({ error: 'FAQ not found' });
  res.json({ faq });
}
