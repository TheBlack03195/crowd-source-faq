import type { Request, Response } from 'express';
import type { PipelineStage } from 'mongoose';
import { FAQ } from '../models/FAQ.js';
import { tryGenerateEmbedding } from '../utils/embeddings.js';
import { computeRRF } from '../utils/search.js';
import { logger } from '../utils/logger.js';

export const VECTOR_INDEX_NAME = 'faq_vector_index';

async function keywordSearchIds(q: string, batchId?: string): Promise<string[]> {
  const filter: Record<string, unknown> = { $text: { $search: q }, reviewStatus: 'approved' };
  if (batchId) filter.batchId = batchId;

  const docs = await FAQ.find(filter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(25)
    .select('_id');

  return docs.map((d) => d._id.toString());
}

async function vectorSearchIds(q: string, batchId?: string): Promise<string[]> {
  try {
    const queryVector = await tryGenerateEmbedding(q);
    if (!queryVector) return [];

    const pipeline = [
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: 'embedding',
          queryVector,
          numCandidates: 150,
          limit: 25,
          ...(batchId ? { filter: { batchId: { $eq: batchId } } } : {}),
        },
      },
      { $match: { reviewStatus: 'approved' } },
      { $project: { _id: 1 } },
    ] as unknown as PipelineStage[];

    const docs = await FAQ.aggregate(pipeline);
    return docs.map((d) => d._id.toString());
  } catch (err) {
    logger.warn('Vector search unavailable, falling back to keyword-only', {
      message: (err as Error).message,
    });
    return [];
  }
}


export async function search(req: Request, res: Response) {
  const { q, batchId } = req.query as { q?: string; batchId?: string };
  if (!q || q.trim().length < 2) {
    return res.json({ results: [] });
  }

  const [keywordIds, vectorIds] = await Promise.all([
    keywordSearchIds(q, batchId).catch(() => [] as string[]),
    vectorSearchIds(q, batchId),
  ]);

  const merged = computeRRF([keywordIds, vectorIds]).slice(0, 20);
  const orderedIds = merged.map((r) => r.id);

  if (orderedIds.length === 0) {
    return res.json({ results: [], query: q });
  }

  const docs = await FAQ.find({ _id: { $in: orderedIds } }).populate('categoryId', 'name slug');
  const byId = new Map(docs.map((d) => [d._id.toString(), d]));
  const results = orderedIds.map((id) => byId.get(id)).filter(Boolean);

  res.json({
    results,
    query: q,
    meta: { keywordHits: keywordIds.length, vectorHits: vectorIds.length },
  });
}

export async function suggest(req: Request, res: Response) {
  const { q } = req.query as { q?: string };
  if (!q || q.trim().length < 2) {
    return res.json({ suggestions: [] });
  }

  const suggestions = await FAQ.find(
    { $text: { $search: q }, reviewStatus: 'approved' },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(8)
    .select('question');

  res.json({ suggestions });
}


export async function trending(_req: Request, res: Response) {
  const results = await FAQ.find({ reviewStatus: 'approved' })
    .sort({ viewCount: -1 })
    .limit(10)
    .populate('categoryId', 'name slug');

  res.json({ results });
}
