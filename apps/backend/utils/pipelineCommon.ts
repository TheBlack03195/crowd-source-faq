import mongoose from 'mongoose';
import { FAQ } from '../models/FAQ.js';
import { CommunityPost } from '../models/CommunityPost.js';
import { TranscriptKnowledge } from '../models/TranscriptKnowledge.js';
import { PipelineResult, type PipelineName, type PipelineVerdict } from '../models/PipelineResult.js';

export interface KnowledgeCandidate {
  source: 'FAQ' | 'CommunityPost' | 'TranscriptKnowledge';
  id: string;
  question: string;
  answer: string;
}


export async function searchKnowledgeWithFallback(query: string, limit = 5): Promise<KnowledgeCandidate[]> {
  if (!query || query.trim().length < 3) return [];

  const [faqs, posts, transcripts] = await Promise.all([
    FAQ.find({ $text: { $search: query }, reviewStatus: 'approved' }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('question answer')
      .catch(() => []),
    CommunityPost.find(
      { $text: { $search: query }, isTakenDown: false, acceptedCommentId: { $ne: null } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('title body comments acceptedCommentId')
      .catch(() => []),
    TranscriptKnowledge.find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('question answer')
      .catch(() => []),
  ]);

  const candidates: KnowledgeCandidate[] = [];

  for (const f of faqs) {
    candidates.push({ source: 'FAQ', id: f._id.toString(), question: f.question, answer: f.answer });
  }
  for (const p of posts as any[]) {
    const accepted = p.comments?.find((c: any) => c._id.toString() === p.acceptedCommentId?.toString());
    if (accepted) {
      candidates.push({ source: 'CommunityPost', id: p._id.toString(), question: p.title, answer: accepted.content });
    }
  }
  for (const t of transcripts) {
    candidates.push({ source: 'TranscriptKnowledge', id: t._id.toString(), question: t.question, answer: t.answer });
  }

  return candidates;
}

export type Triage = 'auto_post' | 'queue_review' | 'escalate';


export function triageByScore(score: number): Triage {
  const approveThreshold = Number(process.env.PIPELINE_APPROVE_THRESHOLD) || 0.85;
  const queueThreshold = Number(process.env.PIPELINE_QUEUE_THRESHOLD) || 0.6;

  if (score >= approveThreshold) return 'auto_post';
  if (score >= queueThreshold) return 'queue_review';
  return 'escalate';
}


const SENSITIVE_PATTERNS = [
  /\bsuicid/i,
  /\bself[\s-]?harm/i,
  /\bkill (myself|him|her|them)\b/i,
  /\babus(e|ed|ing)\b/i,
  /\bassault/i,
  /\bharass/i,
];

export function isSensitiveContent(text: string): boolean {
  return SENSITIVE_PATTERNS.some((re) => re.test(text));
}

export async function logPipelineEvent(params: {
  pipeline: PipelineName;
  targetModel: 'CommunityPost' | 'FAQ' | 'ZoomMeeting';
  targetId: mongoose.Types.ObjectId | string;
  targetTitle: string;
  score: number;
  verdict: PipelineVerdict;
  flagged: boolean;
  reasoning?: string;
  provider?: string;
  aiModel?: string;
}) {
  await PipelineResult.create({ ...params, checkedAt: new Date() });
}


export function buildAuditMetaUpdate(verdict: 'correct' | 'drift_detected' | 'contradiction' | 'stale') {
  if (verdict === 'correct') {
    return { lastVerifiedAt: new Date() };
  }
  return {
    reviewStatus: 'pending_review' as const,
  };
}
