import type { Request, Response } from 'express';
import { CommunityPost } from '../models/CommunityPost.js';
import { isOwnerOrModerator } from './postCore.js';

export async function closePost(req: Request, res: Response) {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!isOwnerOrModerator(req, post.authorId)) {
    return res.status(403).json({ error: 'Not allowed to close this post' });
  }
  post.status = 'closed';
  await post.save();
  res.json({ post });
}

export async function reopenPost(req: Request, res: Response) {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!isOwnerOrModerator(req, post.authorId)) {
    return res.status(403).json({ error: 'Not allowed to reopen this post' });
  }
  post.status = 'open';
  await post.save();
  res.json({ post });
}
