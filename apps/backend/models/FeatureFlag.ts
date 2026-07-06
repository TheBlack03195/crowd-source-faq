import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IFeatureFlag extends Document {
  key: string;
  label: string;
  enabled: boolean;
  updatedAt: Date;
}

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    enabled: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const FeatureFlag: Model<IFeatureFlag> =
  mongoose.models.FeatureFlag ||
  mongoose.model<IFeatureFlag>('FeatureFlag', featureFlagSchema, 'yaksha_faq_feature_flags');

const flagCache = new Map<string, { value: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 30_000;


export async function isFeatureEnabled(key: string): Promise<boolean> {
  const cached = flagCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const flag = await FeatureFlag.findOne({ key }).lean();
  const value = flag?.enabled ?? false;
  flagCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
