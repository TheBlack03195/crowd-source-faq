import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type FreshnessVoteValue = 'still_accurate' | 'needs_update';

export interface IFreshReviewVote extends Document {
  faqId: mongoose.Types.ObjectId;
  reviewCycle: number;
  voterId: mongoose.Types.ObjectId;
  vote: FreshnessVoteValue;
  suggestion?: string;
  createdAt: Date;
}

const freshReviewVoteSchema = new Schema<IFreshReviewVote>(
  {
    faqId: { type: Schema.Types.ObjectId, ref: 'FAQ', required: true, index: true },
    reviewCycle: { type: Number, required: true },
    voterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vote: { type: String, enum: ['still_accurate', 'needs_update'], required: true },
    suggestion: { type: String, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);


freshReviewVoteSchema.index({ faqId: 1, reviewCycle: 1, voterId: 1 }, { unique: true });

export const FreshReviewVote: Model<IFreshReviewVote> =
  mongoose.models.FreshReviewVote ||
  mongoose.model<IFreshReviewVote>('FreshReviewVote', freshReviewVoteSchema, 'yaksha_faq_fresh_review_votes');
