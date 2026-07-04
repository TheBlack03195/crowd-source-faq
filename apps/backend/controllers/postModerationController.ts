import type { Request, Response } from 'express';
import { CommunityPost } from '../models/CommunityPost.js';
import { awardReputation } from '../utils/reputation.js';

export async function reportPost(req: Request, res: Response) {
  const post = await CommunityPost.findByIdAndUpdate(
    req.params.id,
    { isReported: true },
    { new: true }
  );
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ post });
}

export async function takeDownPost(req: Request, res: Response) {
  const post = await CommunityPost.findByIdAndUpdate(
    req.params.id,
    { isTakenDown: true },
    { new: true }
  );
  if (!post) return res.status(404).json({ error: 'Post not found' });
  await awardReputation(post.authorId, 'content_removed', 'CommunityPost', post._id);
  res.json({ post });
}

export async function restorePost(req: Request, res: Response) {
  const post = await CommunityPost.findByIdAndUpdate(
    req.params.id,
    { isTakenDown: false, isReported: false },
    { new: true }
  );
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ post });
}
