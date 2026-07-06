import type { Request, Response } from 'express';
import { FeatureFlag } from '../models/FeatureFlag.js';

export async function listFeatureFlags(_req: Request, res: Response) {
  const flags = await FeatureFlag.find().sort({ key: 1 });
  res.json({ flags });
}

export async function toggleFeatureFlag(req: Request, res: Response) {
  const { enabled } = req.body as { enabled?: boolean };
  const flag = await FeatureFlag.findOneAndUpdate(
    { key: req.params.key },
    { $setOnInsert: { label: req.params.key }, $set: { enabled: Boolean(enabled) } },
    { new: true, upsert: true }
  );
  res.json({ flag });
}
