import type { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { FAQ } from '../models/FAQ.js';
import { Category } from '../models/Category.js';
import { sanitizeText } from '../utils/sanitize.js';
import { tryGenerateEmbedding } from '../utils/embeddings.js';

export const createFaqSchema = z.object({
  question: z.string().trim().min(5).max(500),
  answer: z.string().trim().min(2).max(5000),
  categoryId: z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid categoryId'),
  batchId: z
    .string()
    .refine((v) => mongoose.isValidObjectId(v), 'Invalid batchId')
    .optional()
    .nullable(),
  tags: z.array(z.string().trim().toLowerCase()).max(10).optional(),
});

export const updateFaqSchema = createFaqSchema.partial();

export async function listFaqs(req: Request, res: Response) {
  const { categoryId, batchId, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { reviewStatus: 'approved' };
  if (categoryId) filter.categoryId = categoryId;
  if (batchId) filter.batchId = batchId;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    FAQ.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('categoryId', 'name slug'),
    FAQ.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, limit: limitNum });
}

export async function getFaq(req: Request, res: Response) {
  const faq = await FAQ.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  ).populate('categoryId', 'name slug');
  if (!faq) return res.status(404).json({ error: 'FAQ not found' });
  res.json({ faq });
}

export async function createFaq(req: Request, res: Response) {
  const body = req.body as z.infer<typeof createFaqSchema>;

  const category = await Category.findById(body.categoryId);
  if (!category) return res.status(400).json({ error: 'categoryId does not reference a real category' });

  const question = sanitizeText(body.question);
  const answer = sanitizeText(body.answer);


  const embedding = await tryGenerateEmbedding(`${question}\n${answer}`);

  const faq = await FAQ.create({
    question,
    answer,
    categoryId: body.categoryId,
    batchId: body.batchId || null,
    tags: body.tags || [],
    createdBy: req.user!._id,
    ...(embedding ? { embedding } : {}),
  });

  res.status(201).json({ faq });
}

export async function updateFaq(req: Request, res: Response) {
  const body = req.body as z.infer<typeof updateFaqSchema>;
  const update: Record<string, unknown> = { ...body };
  if (body.question) update.question = sanitizeText(body.question);
  if (body.answer) update.answer = sanitizeText(body.answer);

  // Re-embed if the text content changed — a stale embedding is worse
  // than no embedding (it'd rank the FAQ for its *old* meaning).
  if (body.question || body.answer) {
    const existing = await FAQ.findById(req.params.id).select('question answer');
    if (!existing) return res.status(404).json({ error: 'FAQ not found' });
    const question = (update.question as string) || existing.question;
    const answer = (update.answer as string) || existing.answer;
    const embedding = await tryGenerateEmbedding(`${question}\n${answer}`);
    if (embedding) update.embedding = embedding;
  }

  const faq = await FAQ.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!faq) return res.status(404).json({ error: 'FAQ not found' });
  res.json({ faq });
}

export async function deleteFaq(req: Request, res: Response) {
  const faq = await FAQ.findByIdAndDelete(req.params.id);
  if (!faq) return res.status(404).json({ error: 'FAQ not found' });
  res.status(204).send();
}


export async function checkMatch(req: Request, res: Response) {
  const { text } = req.query as { text?: string };
  if (!text || text.trim().length < 5) {
    return res.json({ matches: [] });
  }

  const matches = await FAQ.find(
    { $text: { $search: text }, reviewStatus: 'approved' },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .select('question answer categoryId');

  res.json({ matches });
}
