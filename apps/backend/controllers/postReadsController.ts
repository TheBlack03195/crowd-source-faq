import type { Request, Response } from 'express';
import { CommunityPost } from '../models/CommunityPost.js';

export async function listPosts(req: Request, res: Response) {
  const { categoryId, batchId, status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { isTakenDown: false };
  if (categoryId) filter.categoryId = categoryId;
  if (batchId) filter.batchId = batchId;
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    CommunityPost.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-comments') 
      .populate('authorId', 'name reputation')
      .populate('categoryId', 'name slug'),
    CommunityPost.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, limit: limitNum });
}

export async function getPost(req: Request, res: Response) {
  const post = await CommunityPost.findOne({ _id: req.params.id, isTakenDown: false })
    .populate('authorId', 'name reputation')
    .populate('categoryId', 'name slug')
    .populate('comments.authorId', 'name reputation');

  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ post });
}


export async function relatedPosts(req: Request, res: Response) {
  const post = await CommunityPost.findById(req.params.id).select('categoryId');
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const related = await CommunityPost.find({
    _id: { $ne: post._id },
    categoryId: post.categoryId,
    isTakenDown: false,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('-comments');

  res.json({ related });
}
