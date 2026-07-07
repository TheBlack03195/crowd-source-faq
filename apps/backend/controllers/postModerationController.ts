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


export async function reportComment(req: Request, res: Response) {
  const post = await CommunityPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  comment.isReported = true;
  await post.save();
  res.json({ comment });
}


export async function dismissCommentReport(req: Request, res: Response) {
  const post = await CommunityPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  comment.isReported = false;
  await post.save();
  res.json({ comment });
}


export async function listReportedComments(_req: Request, res: Response) {
  const posts = await CommunityPost.find({ 'comments.isReported': true })
    .select('title comments')
    .populate('comments.authorId', 'name');

  const reported = posts.flatMap((post) =>
    post.comments
      .filter((c) => c.isReported && !c.isDeleted)
      .map((c) => ({
        postId: post._id,
        postTitle: post.title,
        commentId: c._id,
        content: c.content,
        authorId: c.authorId,
        createdAt: c.createdAt,
      }))
  );

  res.json({ items: reported });
}
