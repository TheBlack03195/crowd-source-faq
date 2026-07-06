import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ContextFieldType = 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'dropdown';

export interface IContextField {
  key: string;
  label: string;
  type: ContextFieldType;
  required: boolean;
  options?: string[]; 
  order: number;
  isArchived: boolean;
}

export type SupportIssueType = 'internet' | 'camera' | 'microphone' | 'device' | 'power' | 'other';

export interface ISupportCategory extends Document {
  issueType: SupportIssueType;
  label: string;
  contextFields: IContextField[];
  createdAt: Date;
  updatedAt: Date;
}

const contextFieldSchema = new Schema<IContextField>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'textarea', 'number', 'date', 'boolean', 'dropdown'], required: true },
    required: { type: Boolean, default: false },
    options: { type: [String], default: undefined },
    order: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
  },
  { _id: false }
);

const supportCategorySchema = new Schema<ISupportCategory>(
  {
    issueType: {
      type: String,
      enum: ['internet', 'camera', 'microphone', 'device', 'power', 'other'],
      required: true,
      unique: true,
    },
    label: { type: String, required: true },
    contextFields: { type: [contextFieldSchema], default: [] },
  },
  { timestamps: true }
);

export const SupportCategory: Model<ISupportCategory> =
  mongoose.models.SupportCategory ||
  mongoose.model<ISupportCategory>('SupportCategory', supportCategorySchema, 'yaksha_faq_support_categories');
