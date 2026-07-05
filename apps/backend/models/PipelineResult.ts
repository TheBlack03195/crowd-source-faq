import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type PipelineName = 'auto_answer' | 'faq_audit' | 'zoom_extraction';
export type PipelineVerdict =
  | 'approved'
  | 'queued'
  | 'escalated'
  | 'correct'
  | 'drift_detected'
  | 'contradiction'
  | 'stale'
  | 'extracted';

export interface IPipelineResult extends Document {
  pipeline: PipelineName;
  targetModel: 'CommunityPost' | 'FAQ' | 'ZoomMeeting';
  targetId: mongoose.Types.ObjectId;
  targetTitle: string;
  score: number;
  verdict: PipelineVerdict;
  flagged: boolean;
  reasoning?: string;
  provider?: string;
  aiModel?: string;
  checkedAt: Date;
}

const pipelineResultSchema = new Schema<IPipelineResult>(
  {
    pipeline: {
      type: String,
      enum: ['auto_answer', 'faq_audit', 'zoom_extraction'],
      required: true,
      index: true,
    },
    targetModel: { type: String, enum: ['CommunityPost', 'FAQ', 'ZoomMeeting'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetTitle: { type: String, default: '' },
    score: { type: Number, required: true },
    verdict: {
      type: String,
      enum: [
        'approved',
        'queued',
        'escalated',
        'correct',
        'drift_detected',
        'contradiction',
        'stale',
        'extracted',
      ],
      required: true,
    },
    flagged: { type: Boolean, default: false, index: true },
    reasoning: { type: String, maxlength: 2000 },
    provider: { type: String },
    aiModel: { type: String },
    checkedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

pipelineResultSchema.index(
  { checkedAt: 1 },
  { expireAfterSeconds: (Number(process.env.PIPELINE_RESULT_TTL_DAYS) || 30) * 24 * 60 * 60 }
);

export const PipelineResult: Model<IPipelineResult> =
  mongoose.models.PipelineResult ||
  mongoose.model<IPipelineResult>('PipelineResult', pipelineResultSchema, 'yaksha_faq_pipeline_results');
