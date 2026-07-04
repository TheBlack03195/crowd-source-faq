import type { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { CommunityPost } from '../models/CommunityPost.js';
import { sanitizeText } from '../utils/sanitize.js';
import { awardReputation } from '../utils/reputation.js';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(3000),
});

export async function addComment(req: Request, res: Response) {
  const { content } = req.body as z.infer<typeof createCommentSchema>;

  const post = await CommunityPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.status === 'closed') {
    return res.status(400).json({ error: 'This post is closed to new comments' });
  }

  post.comments.push({
    _id: new mongoose.Types.ObjectId(),
    authorId: req.user!._id,
    content: sanitizeText(content),
    isAccepted: false,
    isVerified: req.user!.role === 'admin' || req.user!.role === 'moderator',
    upvotes: 0,
    downvotes: 0,
    votedBy: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  await post.save();
  res.status(201).json({ post });
}

export async function editComment(req: Request, res: Response) {
  const post = await CommunityPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  const isOwner = comment.authorId.toString() === req.user!._id.toString();
  const isMod = req.user!.role === 'admin' || req.user!.role === 'moderator';
  if (!isOwner && !isMod) return res.status(403).json({ error: 'Not allowed to edit this comment' });
  if (comment.isAccepted && !isMod) {
    return res.status(400).json({ error: 'Accepted answers are locked from further edits' });
  }

  const { content } = req.body as { content: string };
  comment.content = sanitizeText(content);
  await post.save();
  res.json({ post });
}

export async function deleteComment(req: Request, res: Response) {
  const post = await CommunityPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  const isOwner = comment.authorId.toString() === req.user!._id.toString();
  const isMod = req.user!.role === 'admin' || req.user!.role === 'moderator';
  if (!isOwner && !isMod) return res.status(403).json({ error: 'Not allowed to delete this comment' });

  comment.isDeleted = true;
  comment.content = '[deleted]';
  await post.save();
  res.json({ post });
}

export async function acceptAnswer(req: Request, res: Response) {
  const post = await CommunityPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const isAuthor = post.authorId.toString() === req.user!._id.toString();
  const isMod = req.user!.role === 'admin' || req.user!.role === 'moderator';
  if (!isAuthor && !isMod) {
    return res.status(403).json({ error: 'Only the post author can accept an answer' });
  }

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });


  if (post.acceptedCommentId) {
    const prev = post.comments.id(post.acceptedCommentId);
    if (prev && prev.isAccepted) {
      prev.isAccepted = false;
      await awardReputation(prev.authorId, 'answer_unaccepted', 'Comment', prev._id);
    }
  }

  comment.isAccepted = true;
  post.acceptedCommentId = comment._id;
  post.status = 'resolved';
  await post.save();

  await awardReputation(comment.authorId, 'answer_accepted', 'Comment', comment._id);

  res.json({ post });
}
