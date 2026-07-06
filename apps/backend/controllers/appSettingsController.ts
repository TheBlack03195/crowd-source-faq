import type { Request, Response } from 'express';
import { getAppSettings, AppSetting } from '../models/AppSetting.js';


export async function getPublicSettings(_req: Request, res: Response) {
  const settings = await getAppSettings();
  res.json({ goldenCooldownHours: settings.goldenCooldownHours });
}

export async function updateSettings(req: Request, res: Response) {
  const { goldenCooldownHours } = req.body as { goldenCooldownHours?: number };
  if (goldenCooldownHours === undefined) {
    return res.status(400).json({ error: 'goldenCooldownHours is required' });
  }
  if (goldenCooldownHours < 0 || goldenCooldownHours > 720) {
    return res.status(400).json({ error: 'goldenCooldownHours must be between 0 and 720' });
  }

  const settings = await AppSetting.findOneAndUpdate(
    { key: 'singleton' },
    { goldenCooldownHours },
    { new: true, upsert: true }
  );
  res.json({ settings });
}
