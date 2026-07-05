import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ZoomSourcing = 'webhook' | 'manual_vtt' | 'manual_txt' | 'manual_raw';
export type ZoomMeetingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IZoomMeeting extends Document {
  userId: mongoose.Types.ObjectId;
  zoomMeetingId: string;
  topic: string;
  sourcing: ZoomSourcing;
  status: ZoomMeetingStatus;
  batchId: mongoose.Types.ObjectId | null;
  startedAt: Date;
  errorMessage?: string;
  retryCount: number;
  deadLettered: boolean;
  insightsExtracted: number;
  createdAt: Date;
  updatedAt: Date;
}

const zoomMeetingSchema = new Schema<IZoomMeeting>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    zoomMeetingId: { type: String, required: true },
    topic: { type: String, default: 'Untitled meeting' },
    sourcing: {
      type: String,
      enum: ['webhook', 'manual_vtt', 'manual_txt', 'manual_raw'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null },
    startedAt: { type: Date, default: () => new Date() },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 },
    deadLettered: { type: Boolean, default: false, index: true },
    insightsExtracted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ZoomMeeting: Model<IZoomMeeting> =
  mongoose.models.ZoomMeeting ||
  mongoose.model<IZoomMeeting>('ZoomMeeting', zoomMeetingSchema, 'yaksha_faq_zoom_meetings');
