import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IRevokedToken extends Document {
  jti: string;
  expiresAt: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>({
  jti: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const RevokedToken: Model<IRevokedToken> =
  mongoose.models.RevokedToken ||
  mongoose.model<IRevokedToken>('RevokedToken', revokedTokenSchema, 'yaksha_faq_revoked_tokens');
