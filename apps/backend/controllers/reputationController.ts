import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { ReputationLog } from '../models/ReputationLog.js';


export async function leaderboard(_req: Request, res: Response) {
  const users = await User.find({ isDeleted: false, isBanned: false })
    .sort({ reputation: -1 })
    .limit(50)
    .select('name reputation role');
  res.json({ leaderboard: users });
}


export async function reputationHistory(req: Request, res: Response) {
  const logs = await ReputationLog.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(100);
  res.json({ logs });
}
