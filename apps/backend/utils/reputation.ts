import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { ReputationLog, type ReputationReason } from '../models/ReputationLog.js';

const POINTS: Record<ReputationReason, number> = {
  post_upvoted: 2,
  post_upvote_removed: -2,
  comment_upvoted: 2,
  comment_upvote_removed: -2,
  answer_accepted: 5,
  answer_unaccepted: -5,
  content_removed: -5,
};

export async function awardReputation(
  userId: mongoose.Types.ObjectId | string,
  reason: ReputationReason,
  refModel: 'CommunityPost' | 'Comment',
  refId: mongoose.Types.ObjectId | string
) {
  const amount = POINTS[reason];
  await User.findByIdAndUpdate(userId, { $inc: { reputation: amount } });
  await ReputationLog.create({ userId, amount, reason, refModel, refId });
}
