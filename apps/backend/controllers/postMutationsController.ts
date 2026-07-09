import type { Request, Response } from 'express';
import { z } from 'zod';
import { CommunityPost } from '../models/CommunityPost.js';
import { sanitizeText } from '../utils/sanitize.js';
import { awardReputation } from '../utils/reputation.js';
import { isOwnerOrModerator } from './postCore.js';

export const createPostSchema = z.object({
  title: z.string().trim().min(5).max(200),
  body: z.string().trim().min(5).max(5000),
  categoryId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  tags: z.array(z.string().trim().toLowerCase()).max(10).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().trim().min(5).max(200).optional(),
  body: z.string().trim().min(5).max(5000).optional(),
  tags: z.array(z.string().trim().toLowerCase()).max(10).optional(),
});

export async function createPost(req: Request, res: Response) {
  const body = req.body as z.infer<typeof createPostSchema>;

  const post = await CommunityPost.create({
    title: sanitizeText(body.title),
    body: sanitizeText(body.body),
    categoryId: body.categoryId || null,
    batchId: body.batchId || null,
    tags: body.tags || [],
    authorId: req.user!._id,
  });

  res.status(201).json({ post });
}

export async function editPost(req: Request, res: Response) {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!isOwnerOrModerator(req, post.authorId)) {
    return res.status(403).json({ error: 'Not allowed to edit this post' });
  }

  const body = req.body as z.infer<typeof updatePostSchema>;
  if (body.title) post.title = sanitizeText(body.title);
  if (body.body) post.body = sanitizeText(body.body);
  if (body.tags) post.tags = body.tags;
  await post.save();

  res.json({ post });
}


export async function votePost(req: Request, res: Response) {
  const direction = Number(req.body.direction) as 1 | -1;
  if (direction !== 1 && direction !== -1) {
    return res.status(400).json({ error: 'direction must be 1 or -1' });
  }

  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const userId = req.user!._id;
  const existing = post.votedBy.find((v) => v.userId.toString() === userId.toString());

  let resultingUserVote: 1 | -1 | 0;

  if (existing && existing.direction === direction) {
    post.votedBy = post.votedBy.filter((v) => v.userId.toString() !== userId.toString());
    post.upvotes -= direction;
    resultingUserVote = 0;
    if (direction === 1) {
      await awardReputation(post.authorId, 'post_upvote_removed', 'CommunityPost', post._id);
    }
  } else if (existing) {
    existing.direction = direction;
    post.upvotes += direction * 2;
    resultingUserVote = direction;
    if (direction === 1) {
      await awardReputation(post.authorId, 'post_upvoted', 'CommunityPost', post._id);
    } else {
      await awardReputation(post.authorId, 'post_upvote_removed', 'CommunityPost', post._id);
    }
  } else {
    post.votedBy.push({ userId, direction });
    post.upvotes += direction;
    resultingUserVote = direction;
    if (direction === 1) {
      await awardReputation(post.authorId, 'post_upvoted', 'CommunityPost', post._id);
    }
  }

  await post.save();
  res.json({ upvotes: post.upvotes, userVote: resultingUserVote });
}

export async function resolvePost(req: Request, res: Response) {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!isOwnerOrModerator(req, post.authorId)) {
    return res.status(403).json({ error: 'Not allowed to resolve this post' });
  }
  post.status = 'resolved';
  await post.save();
  res.json({ post });
}
