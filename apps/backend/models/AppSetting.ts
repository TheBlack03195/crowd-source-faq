import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAppSetting extends Document {
  key: 'singleton';
  goldenCooldownHours: number;
  duplicatesPreventedCount: number;
  updatedAt: Date;
}

const appSettingSchema = new Schema<IAppSetting>(
  {
    key: { type: String, default: 'singleton', unique: true },
    goldenCooldownHours: { type: Number, default: 48, min: 0, max: 720 },
    duplicatesPreventedCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const AppSetting: Model<IAppSetting> =
  mongoose.models.AppSetting ||
  mongoose.model<IAppSetting>('AppSetting', appSettingSchema, 'yaksha_faq_app_settings');


export async function getAppSettings(): Promise<IAppSetting> {
  let settings = await AppSetting.findOne({ key: 'singleton' });
  if (!settings) {
    settings = await AppSetting.create({ key: 'singleton' });
  }
  return settings;
}