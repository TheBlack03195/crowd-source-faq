import type { Request, Response } from 'express';
import { TranscriptKnowledge } from '../models/TranscriptKnowledge.js';
import { ZoomInsight } from '../models/ZoomInsight.js';
import { ZoomMeeting } from '../models/ZoomMeeting.js';
import { promoteInsightToFaq } from '../services/knowledgeBase.js';
import { getZoomHealth } from '../utils/zoomHealth.js';

export async function listTranscriptKnowledge(req: Request, res: Response) {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    TranscriptKnowledge.find()
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    TranscriptKnowledge.countDocuments(),
  ]);

  res.json({ items, total, page: pageNum, limit: limitNum });
}

export async function listZoomInsights(req: Request, res: Response) {
  const { reviewStatus = 'pending_review' } = req.query as Record<string, string>;
  const insights = await ZoomInsight.find({ reviewStatus }).sort({ createdAt: -1 }).limit(100);
  res.json({ insights });
}

export async function promoteInsight(req: Request, res: Response) {
  const { categoryId } = req.body as { categoryId?: string };
  if (!categoryId) return res.status(400).json({ error: 'categoryId is required' });

  try {
    const result = await promoteInsightToFaq(req.params.id, categoryId, req.user!._id.toString());
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function rejectInsight(req: Request, res: Response) {
  const insight = await ZoomInsight.findByIdAndUpdate(
    req.params.id,
    { reviewStatus: 'rejected', reviewedBy: req.user!._id },
    { new: true }
  );
  if (!insight) return res.status(404).json({ error: 'Insight not found' });
  res.json({ insight });
}

export async function listZoomMeetings(req: Request, res: Response) {
  const { status } = req.query as { status?: string };
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const meetings = await ZoomMeeting.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ meetings });
}

export async function zoomHealthCheck(_req: Request, res: Response) {
  const health = await getZoomHealth();
  res.json({ health });
}