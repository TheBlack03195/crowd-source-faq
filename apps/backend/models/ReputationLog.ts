import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ReputationReason =
  | 'post_upvoted'
  | 'post_upvote_removed'
  | 'comment_upvoted'
  | 'comment_upvote_removed'
  | 'answer_accepted'
  | 'answer_unaccepted'
  | 'content_removed';

export interface IReputationLog extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  reason: ReputationReason;
  refModel: 'CommunityPost' | 'Comment';
  refId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const reputationLogSchema = new Schema<IReputationLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    reason: {
      type: String,
      enum: [
        'post_upvoted',
        'post_upvote_removed',
        'comment_upvoted',
        'comment_upvote_removed',
        'answer_accepted',
        'answer_unaccepted',
        'content_removed',
      ],
      required: true,
    },
    refModel: { type: String, enum: ['CommunityPost', 'Comment'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ReputationLog: Model<IReputationLog> =
  mongoose.models.ReputationLog ||
  mongoose.model<IReputationLog>('ReputationLog', reputationLogSchema, 'yaksha_faq_reputation_logs');
