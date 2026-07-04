import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CommunityPost } from '../models/CommunityPost.js';
import { awardReputation } from '../utils/reputation.js';

type Vote = { userId: mongoose.Types.ObjectId; direction: 1 | -1 };

export async function voteComment(req: Request, res: Response) {
  const direction = Number(req.body.direction) as 1 | -1;
  if (direction !== 1 && direction !== -1) {
    return res.status(400).json({ error: 'direction must be 1 or -1' });
  }

  const post = await CommunityPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  const userId = req.user!._id;
  const existing = comment.votedBy.find((v: Vote) => v.userId.toString() === userId.toString());

  if (existing && existing.direction === direction) {
  
    comment.votedBy = comment.votedBy.filter(
      (v: Vote) => v.userId.toString() !== userId.toString()
    );
    if (direction === 1) {
      comment.upvotes -= 1;
      await awardReputation(comment.authorId, 'comment_upvote_removed', 'Comment', comment._id);
    } else {
      comment.downvotes -= 1;
    }
  } else if (existing) {
    existing.direction = direction;
    if (direction === 1) {
      comment.upvotes += 1;
      comment.downvotes -= 1;
      await awardReputation(comment.authorId, 'comment_upvoted', 'Comment', comment._id);
    } else {
      comment.downvotes += 1;
      comment.upvotes -= 1;
      await awardReputation(comment.authorId, 'comment_upvote_removed', 'Comment', comment._id);
    }
  } else {
    comment.votedBy.push({ userId, direction });
    if (direction === 1) {
      comment.upvotes += 1;
      await awardReputation(comment.authorId, 'comment_upvoted', 'Comment', comment._id);
    } else {
      comment.downvotes += 1;
    }
  }

  await post.save();
  res.json({ upvotes: comment.upvotes, downvotes: comment.downvotes });
}
