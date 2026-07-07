import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SupportRequest } from '../models/SupportRequest.js';
import { SupportCategory } from '../models/SupportCategory.js';
import { sanitizeText } from '../utils/sanitize.js';

export async function createSupportRequest(req: Request, res: Response) {
  const { issueType, description, contextValues } = req.body as {
    issueType?: string;
    description?: string;
    contextValues?: Record<string, unknown>;
  };
  if (!issueType || !description) {
    return res.status(400).json({ error: 'issueType and description are required' });
  }

  const category = await SupportCategory.findOne({ issueType });
  if (category) {
    const missing = category.contextFields
      .filter((f) => f.required && !f.isArchived)
      .find((f) => contextValues?.[f.key] === undefined || contextValues?.[f.key] === '');
    if (missing) {
      return res.status(400).json({ error: `Missing required field: ${missing.label}` });
    }
  }

  const request = await SupportRequest.create({
    userId: req.user!._id,
    issueType,
    description: sanitizeText(description),
    contextValues: contextValues || {},
  });

  res.status(201).json({ request });
}

export async function listMySupportRequests(req: Request, res: Response) {
  const requests = await SupportRequest.find({ userId: req.user!._id }).sort({ createdAt: -1 });
  res.json({ requests });
}


export async function listAllSupportRequests(req: Request, res: Response) {
  const { status, issueType, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (issueType) filter.issueType = issueType;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    SupportRequest.find(filter)
      .sort({ isGolden: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('userId', 'name email'),
    SupportRequest.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, limit: limitNum });
}

export async function getSupportRequest(req: Request, res: Response) {
  const request = await SupportRequest.findById(req.params.id).populate('followUps.authorId', 'name role');
  if (!request) return res.status(404).json({ error: 'Support request not found' });

  const isOwner = request.userId.toString() === req.user!._id.toString();
  const isMod = req.user!.role === 'admin' || req.user!.role === 'moderator';
  if (!isOwner && !isMod) return res.status(403).json({ error: 'Not allowed to view this request' });

  res.json({ request });
}

export async function addFollowUp(req: Request, res: Response) {
  const { message } = req.body as { message?: string };
  if (!message) return res.status(400).json({ error: 'message is required' });

  const request = await SupportRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Support request not found' });

  const isOwner = request.userId.toString() === req.user!._id.toString();
  const isMod = req.user!.role === 'admin' || req.user!.role === 'moderator';
  if (!isOwner && !isMod) return res.status(403).json({ error: 'Not allowed to reply to this request' });

  request.followUps.push({
    _id: new mongoose.Types.ObjectId(),
    authorId: req.user!._id,
    isAdmin: isMod,
    message: sanitizeText(message),
    createdAt: new Date(),
  } as any);

  if (isMod && request.status === 'open') request.status = 'in_progress';
  await request.save();

  res.json({ request });
}


export async function updateSupportStatus(req: Request, res: Response) {
  const { status } = req.body as { status?: 'resolved' | 'rejected' | 'in_progress' };
  if (!status || !['resolved', 'rejected', 'in_progress'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const request = await SupportRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!request) return res.status(404).json({ error: 'Support request not found' });
  res.json({ request });
}


export async function deleteSupportRequest(req: Request, res: Response) {
  const request = await SupportRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Support request not found' });
  if (request.userId.toString() !== req.user!._id.toString()) {
    return res.status(403).json({ error: 'Not allowed to delete this request' });
  }
  await request.deleteOne();
  res.status(204).send();
}


export async function supportAnalytics(_req: Request, res: Response) {
  const [byStatus, byIssueType, total] = await Promise.all([
    SupportRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    SupportRequest.aggregate([{ $group: { _id: '$issueType', count: { $sum: 1 } } }]),
    SupportRequest.countDocuments(),
  ]);
  res.json({ total, byStatus, byIssueType });
}