import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ModerationAction = 'ban' | 'unban' | 'suspend' | 'unsuspend' | 'warn' | 'soft_delete';

export interface IModerationLog extends Document {
  targetUserId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  action: ModerationAction;
  reason?: string;
  durationHours?: number;
  createdAt: Date;
}

const moderationLogSchema = new Schema<IModerationLog>(
  {
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['ban', 'unban', 'suspend', 'unsuspend', 'warn', 'soft_delete'], required: true },
    reason: { type: String, maxlength: 500 },
    durationHours: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ModerationLog: Model<IModerationLog> =
  mongoose.models.ModerationLog ||
  mongoose.model<IModerationLog>('ModerationLog', moderationLogSchema, 'yaksha_faq_moderation_logs');
