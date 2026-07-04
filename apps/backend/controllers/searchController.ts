import type { Request, Response } from 'express';
import { FAQ } from '../models/FAQ.js';


export async function search(req: Request, res: Response) {
  const { q, batchId } = req.query as { q?: string; batchId?: string };
  if (!q || q.trim().length < 2) {
    return res.json({ results: [] });
  }

  const filter: Record<string, unknown> = { $text: { $search: q }, reviewStatus: 'approved' };
  if (batchId) filter.batchId = batchId;

  const results = await FAQ.find(filter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(20)
    .populate('categoryId', 'name slug');

  res.json({ results, query: q });
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
