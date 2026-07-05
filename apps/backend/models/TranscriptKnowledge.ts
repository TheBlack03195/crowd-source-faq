import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ITranscriptKnowledge extends Document {
  question: string;
  answer: string;
  sourceMeetingId: mongoose.Types.ObjectId;
  sourceMeetingTopic: string;
  batchId: mongoose.Types.ObjectId | null;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const transcriptKnowledgeSchema = new Schema<ITranscriptKnowledge>(
  {
    question: { type: String, required: true, trim: true, maxlength: 500 },
    answer: { type: String, required: true, trim: true, maxlength: 5000 },
    sourceMeetingId: { type: Schema.Types.ObjectId, ref: 'ZoomMeeting', required: true, index: true },
    sourceMeetingTopic: { type: String, default: '' },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    embedding: { type: [Number], select: false },
  },
  { timestamps: true }
);

transcriptKnowledgeSchema.index({ question: 'text', answer: 'text' });

export const TranscriptKnowledge: Model<ITranscriptKnowledge> =
  mongoose.models.TranscriptKnowledge ||
  mongoose.model<ITranscriptKnowledge>(
    'TranscriptKnowledge',
    transcriptKnowledgeSchema,
    'yaksha_faq_transcript_knowledge'
  );
