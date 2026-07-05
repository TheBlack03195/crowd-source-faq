import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ZoomInsightStatus = 'pending_review' | 'approved' | 'rejected';

export interface IZoomInsight extends Document {
  question: string;
  answer: string;
  sourceMeetingId: mongoose.Types.ObjectId;
  reviewStatus: ZoomInsightStatus;
  promotedToFaqId: mongoose.Types.ObjectId | null;
  reviewedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const zoomInsightSchema = new Schema<IZoomInsight>(
  {
    question: { type: String, required: true, trim: true, maxlength: 500 },
    answer: { type: String, required: true, trim: true, maxlength: 5000 },
    sourceMeetingId: { type: Schema.Types.ObjectId, ref: 'ZoomMeeting', required: true, index: true },
    reviewStatus: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
      index: true,
    },
    promotedToFaqId: { type: Schema.Types.ObjectId, ref: 'FAQ', default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const ZoomInsight: Model<IZoomInsight> =
  mongoose.models.ZoomInsight ||
  mongoose.model<IZoomInsight>('ZoomInsight', zoomInsightSchema, 'yaksha_faq_zoom_insights');
