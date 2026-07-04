import type { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Batch } from '../models/Batch.js';
import { Category } from '../models/Category.js';
import { FAQ } from '../models/FAQ.js';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}


export const createBatchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional(),
});

export async function listBatches(_req: Request, res: Response) {
  const batches = await Batch.find({ isArchived: false }).sort({ createdAt: -1 });
  res.json({ batches });
}

export async function getCurrentBatch(_req: Request, res: Response) {
  const batch = await Batch.findOne({ isActive: true, isArchived: false }).sort({ createdAt: -1 });
  res.json({ batch });
}

export async function createBatch(req: Request, res: Response) {
  const { name, description } = req.body as z.infer<typeof createBatchSchema>;
  const slug = slugify(name);

  const existing = await Batch.findOne({ slug });
  if (existing) return res.status(409).json({ error: 'A batch with this name already exists' });

  const batch = await Batch.create({ name, slug, description });
  res.status(201).json({ batch });
}

export async function archiveBatch(req: Request, res: Response) {
  const batch = await Batch.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  res.json({ batch });
}


export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional(),
  batchId: z
    .string()
    .refine((v) => mongoose.isValidObjectId(v), 'Invalid batchId')
    .optional()
    .nullable(),
});

export async function listCategories(req: Request, res: Response) {
  const { batchId } = req.query as { batchId?: string };
  const filter: Record<string, unknown> = { isArchived: false };
  if (batchId) filter.batchId = batchId;
  const categories = await Category.find(filter).sort({ name: 1 });
  res.json({ categories });
}

export async function createCategory(req: Request, res: Response) {
  const { name, description, batchId } = req.body as z.infer<typeof createCategorySchema>;
  const slug = slugify(name);

  const existing = await Category.findOne({ slug, batchId: batchId || null });
  if (existing) return res.status(409).json({ error: 'This category already exists for the batch' });

  const category = await Category.create({ name, slug, description, batchId: batchId || null });
  res.status(201).json({ category });
}

export async function archiveCategory(req: Request, res: Response) {
  const category = await Category.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json({ category });
}


export async function faqsByBatch(req: Request, res: Response) {
  const faqs = await FAQ.find({ batchId: req.params.batchId, reviewStatus: 'approved' })
    .sort({ createdAt: -1 })
    .populate('categoryId', 'name slug');
  res.json({ faqs });
}
