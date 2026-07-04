import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IBatch extends Document {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 300 },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Batch: Model<IBatch> =
  mongoose.models.Batch || mongoose.model<IBatch>('Batch', batchSchema, 'yaksha_faq_batches');
