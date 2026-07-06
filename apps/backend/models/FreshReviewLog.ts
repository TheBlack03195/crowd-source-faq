import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type FreshReviewEvent = 'flagged' | 'voted' | 'auto_verified' | 'escalated' | 'dismissed';

export interface IFreshReviewLog extends Document {
  faqId: mongoose.Types.ObjectId;
  reviewCycle: number;
  event: FreshReviewEvent;
  actorId: mongoose.Types.ObjectId | null;
  reason?: string;
  createdAt: Date;
}

const freshReviewLogSchema = new Schema<IFreshReviewLog>(
  {
    faqId: { type: Schema.Types.ObjectId, ref: 'FAQ', required: true, index: true },
    reviewCycle: { type: Number, required: true },
    event: { type: String, enum: ['flagged', 'voted', 'auto_verified', 'escalated', 'dismissed'], required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const FreshReviewLog: Model<IFreshReviewLog> =
  mongoose.models.FreshReviewLog ||
  mongoose.model<IFreshReviewLog>('FreshReviewLog', freshReviewLogSchema, 'yaksha_faq_fresh_review_logs');
