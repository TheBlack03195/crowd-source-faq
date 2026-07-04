import type { Request, Response } from 'express';
import { FAQ } from '../models/FAQ.js';
import { Category } from '../models/Category.js';


export async function publicRecent(req: Request, res: Response) {
  const { batchId } = req.query as { batchId?: string };
  const filter: Record<string, unknown> = { reviewStatus: 'approved' };
  if (batchId) filter.batchId = batchId;

  const faqs = await FAQ.find(filter)
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('categoryId', 'name slug');
  res.json({ faqs });
}


export async function publicPopular(req: Request, res: Response) {
  const { batchId } = req.query as { batchId?: string };
  const filter: Record<string, unknown> = { reviewStatus: 'approved' };
  if (batchId) filter.batchId = batchId;

  const faqs = await FAQ.find(filter)
    .sort({ viewCount: -1 })
    .limit(20)
    .populate('categoryId', 'name slug');
  res.json({ faqs });
}


export async function publicCategories(req: Request, res: Response) {
  const { batchId } = req.query as { batchId?: string };
  const filter: Record<string, unknown> = { isArchived: false };
  if (batchId) filter.batchId = batchId;
  const categories = await Category.find(filter).sort({ name: 1 });
  res.json({ categories });
}


export async function publicDetail(req: Request, res: Response) {
  const faq = await FAQ.findOneAndUpdate(
    { _id: req.params.id, reviewStatus: 'approved' },
    { $inc: { viewCount: 1 } },
    { new: true }
  ).populate('categoryId', 'name slug');
  if (!faq) return res.status(404).json({ error: 'FAQ not found' });
  res.json({ faq });
}
