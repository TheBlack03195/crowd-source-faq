import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type FreshnessTier = 'evergreen' | 'seasonal' | 'volatile';
export type ReviewStatus = 'approved' | 'pending_review';
export type FlagType = 'auto' | 'manual' | null;

export interface IFAQ extends Document {
  question: string;
  answer: string;
  categoryId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  tags: string[];
  viewCount: number;
  upvotes: number;
  freshnessTier: FreshnessTier;
  reviewStatus: ReviewStatus;
  lastVerifiedAt: Date;
  reviewCycle: number;
  flagType: FlagType;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true, trim: true, maxlength: 500 },
    answer: { type: String, required: true, trim: true, maxlength: 5000 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: { type: [String], default: [], index: true },
    viewCount: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    freshnessTier: {
      type: String,
      enum: ['evergreen', 'seasonal', 'volatile'],
      default: 'evergreen',
    },
    reviewStatus: {
      type: String,
      enum: ['approved', 'pending_review'],
      default: 'approved',
      index: true,
    },
    lastVerifiedAt: { type: Date, default: () => new Date() },
    reviewCycle: { type: Number, default: 0 },
    flagType: { type: String, enum: ['auto', 'manual', null], default: null },
    embedding: { type: [Number], select: false },
  },
  { timestamps: true }
);


faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });

export const FAQ: Model<IFAQ> =
  mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', faqSchema, 'yaksha_faq_faqs');
