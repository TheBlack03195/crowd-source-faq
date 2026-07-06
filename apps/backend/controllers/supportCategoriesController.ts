import type { Request, Response } from 'express';
import { SupportCategory, type IContextField } from '../models/SupportCategory.js';

export async function listSupportCategories(_req: Request, res: Response) {
  const categories = await SupportCategory.find();
  res.json({ categories });
}

export async function upsertSupportCategory(req: Request, res: Response) {
  const { issueType, label } = req.body as { issueType?: string; label?: string };
  if (!issueType || !label) return res.status(400).json({ error: 'issueType and label are required' });

  const category = await SupportCategory.findOneAndUpdate(
    { issueType },
    { $setOnInsert: { issueType, contextFields: [] }, $set: { label } },
    { new: true, upsert: true }
  );
  res.json({ category });
}


export async function addContextField(req: Request, res: Response) {
  const field = req.body as Partial<IContextField>;
  if (!field.key || !field.label || !field.type) {
    return res.status(400).json({ error: 'key, label, and type are required' });
  }

  const category = await SupportCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Support category not found' });

  category.contextFields.push({
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required ?? false,
    options: field.type === 'dropdown' ? field.options : undefined,
    order: category.contextFields.length,
    isArchived: false,
  });
  await category.save();

  res.status(201).json({ category });
}

export async function updateContextField(req: Request, res: Response) {
  const category = await SupportCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Support category not found' });

  const field = category.contextFields.find((f) => f.key === req.params.fieldKey);
  if (!field) return res.status(404).json({ error: 'Context field not found' });

  Object.assign(field, req.body);
  await category.save();
  res.json({ category });
}

export async function archiveContextField(req: Request, res: Response) {
  const category = await SupportCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Support category not found' });

  const field = category.contextFields.find((f) => f.key === req.params.fieldKey);
  if (!field) return res.status(404).json({ error: 'Context field not found' });

  field.isArchived = true;
  await category.save();
  res.json({ category });
}
