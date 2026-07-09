import type { Request, Response } from 'express';
import { CommunityPost } from '../models/CommunityPost.js';

function withUserVote(post: any, userId?: string) {
  const obj = typeof post.toObject === 'function' ? post.toObject() : post;
  const voted = userId
    ? obj.votedBy?.find((v: any) => v.userId.toString() === userId.toString())
    : undefined;
  obj.userVote = voted ? voted.direction : 0;
  delete obj.votedBy;
  return obj;
}

export async function listPosts(req: Request, res: Response) {
  const { categoryId, batchId, status, isReported, page = '1', limit = '20' } = req.query as Record<
    string,
    string
  >;
  const filter: Record<string, unknown> = { isTakenDown: false };
  if (categoryId) filter.categoryId = categoryId;
  if (batchId) filter.batchId = batchId;
  if (status) filter.status = status;
  if (isReported === 'true') filter.isReported = true;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    CommunityPost.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('authorId', 'name reputation')
      .populate('categoryId', 'name slug'),
    CommunityPost.countDocuments(filter),
  ]);

  const userId = req.user?._id?.toString();
  const itemsWithVote = items.map((post) => withUserVote(post, userId));

  res.json({ items: itemsWithVote, total, page: pageNum, limit: limitNum });
}

export async function getPost(req: Request, res: Response) {
  const post = await CommunityPost.findOne({ _id: req.params.id, isTakenDown: false })
    .populate('authorId', 'name reputation')
    .populate('categoryId', 'name slug')
    .populate('comments.authorId', 'name reputation');

  if (!post) return res.status(404).json({ error: 'Post not found' });

  const userId = req.user?._id?.toString();
  res.json({ post: withUserVote(post, userId) });
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