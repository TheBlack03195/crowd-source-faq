import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { ModerationLog } from '../models/ModerationLog.js';

export async function banUser(req: Request, res: Response) {
  const { reason } = req.body as { reason?: string };
  const user = await User.findByIdAndUpdate(req.params.userId, { isBanned: true }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });

  await ModerationLog.create({ targetUserId: user._id, actorId: req.user!._id, action: 'ban', reason });
  res.json({ user: { id: user._id, isBanned: user.isBanned } });
}

export async function unbanUser(req: Request, res: Response) {
  const user = await User.findByIdAndUpdate(req.params.userId, { isBanned: false }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });

  await ModerationLog.create({ targetUserId: user._id, actorId: req.user!._id, action: 'unban' });
  res.json({ user: { id: user._id, isBanned: user.isBanned } });
}

export async function suspendUser(req: Request, res: Response) {
  const { hours, reason } = req.body as { hours?: number; reason?: string };
  if (!hours || hours <= 0) return res.status(400).json({ error: 'hours must be a positive number' });

  const suspendedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
  const user = await User.findByIdAndUpdate(req.params.userId, { suspendedUntil }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });

  await ModerationLog.create({
    targetUserId: user._id,
    actorId: req.user!._id,
    action: 'suspend',
    reason,
    durationHours: hours,
  });
  res.json({ user: { id: user._id, suspendedUntil: user.suspendedUntil } });
}

export async function unsuspendUser(req: Request, res: Response) {
  const user = await User.findByIdAndUpdate(req.params.userId, { suspendedUntil: null }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });

  await ModerationLog.create({ targetUserId: user._id, actorId: req.user!._id, action: 'unsuspend' });
  res.json({ user: { id: user._id, suspendedUntil: user.suspendedUntil } });
}


export async function warnUser(req: Request, res: Response) {
  const { reason } = req.body as { reason?: string };
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  await ModerationLog.create({ targetUserId: user._id, actorId: req.user!._id, action: 'warn', reason });
  res.json({ warned: true });
}

export async function listModerationLogs(req: Request, res: Response) {
  const { userId } = req.query as { userId?: string };
  const filter: Record<string, unknown> = {};
  if (userId) filter.targetUserId = userId;

  const logs = await ModerationLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('actorId', 'name')
    .populate('targetUserId', 'name email');
  res.json({ logs });
}
