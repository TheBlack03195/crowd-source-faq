import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';

export interface IFollowUp {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  isAdmin: boolean;
  message: string;
  createdAt: Date;
}

export interface ISupportRequest extends Document {
  userId: mongoose.Types.ObjectId;
  issueType: string;
  description: string;
  contextValues: Record<string, unknown>;
  status: SupportStatus;
  followUps: Types.DocumentArray<IFollowUp>;
  
  isGolden: boolean;
  spSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

const followUpSchema = new Schema<IFollowUp>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isAdmin: { type: Boolean, default: false },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const supportRequestSchema = new Schema<ISupportRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    issueType: { type: String, required: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    contextValues: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'rejected'], default: 'open', index: true },
    followUps: { type: [followUpSchema], default: [] },
    isGolden: { type: Boolean, default: false, index: true },
    spSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SupportRequest: Model<ISupportRequest> =
  mongoose.models.SupportRequest ||
  mongoose.model<ISupportRequest>('SupportRequest', supportRequestSchema, 'yaksha_faq_support_requests');
