import type { Request, Response } from 'express';
import { SupportRequest } from '../models/SupportRequest.js';
import { User } from '../models/User.js';
import { getAppSettings } from '../models/AppSetting.js';


export async function getGoldenBalance(req: Request, res: Response) {
  const user = await User.findById(req.user!._id).select('sp lastGoldenSubmissionAt');
  const settings = await getAppSettings();

  let cooldownRemainingMs = 0;
  if (user?.lastGoldenSubmissionAt && settings.goldenCooldownHours > 0) {
    const cooldownMs = settings.goldenCooldownHours * 60 * 60 * 1000;
    const elapsed = Date.now() - user.lastGoldenSubmissionAt.getTime();
    cooldownRemainingMs = Math.max(0, cooldownMs - elapsed);
  }

  res.json({ sp: user?.sp ?? 0, cooldownRemainingMs });
}


export async function submitGoldenTicket(req: Request, res: Response) {
  const { spAmount } = req.body as { spAmount?: number };
  if (!spAmount || spAmount <= 0) {
    return res.status(400).json({ error: 'spAmount must be a positive number' });
  }

  const user = await User.findById(req.user!._id).select('sp lastGoldenSubmissionAt');
  if (!user) return res.status(404).json({ error: 'User not found' });

  const settings = await getAppSettings();
  if (user.lastGoldenSubmissionAt && settings.goldenCooldownHours > 0) {
    const cooldownMs = settings.goldenCooldownHours * 60 * 60 * 1000;
    const elapsed = Date.now() - user.lastGoldenSubmissionAt.getTime();
    if (elapsed < cooldownMs) {
      const hoursLeft = ((cooldownMs - elapsed) / (60 * 60 * 1000)).toFixed(1);
      return res.status(429).json({ error: `Golden Ticket is on cooldown. Try again in ${hoursLeft}h.` });
    }
  }

  if (user.sp < spAmount) {
    return res.status(400).json({ error: `Insufficient Spurti Points (have ${user.sp}, need ${spAmount})` });
  }

  const request = await SupportRequest.findById(req.params.requestId);
  if (!request) return res.status(404).json({ error: 'Support request not found' });
  if (request.userId.toString() !== req.user!._id.toString()) {
    return res.status(403).json({ error: 'You can only escalate your own requests' });
  }
  if (request.isGolden) {
    return res.status(400).json({ error: 'This request has already been escalated' });
  }

  request.isGolden = true;
  request.spSpent = spAmount;
  await request.save();

  user.sp -= spAmount;
  user.lastGoldenSubmissionAt = new Date();
  await user.save();

  res.json({ request, remainingSp: user.sp });
}


export async function getEscalationQueue(req: Request, res: Response) {
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';

  const queue = await SupportRequest.find({ isGolden: true, status: { $in: ['open', 'in_progress'] } })
    .sort({ spSpent: -1, createdAt: 1 })
    .select(isAdmin ? '' : 'issueType description status spSpent createdAt');

  res.json({ queue, anonymized: !isAdmin });
}


export async function awardSp(req: Request, res: Response) {
  const { userId, amount } = req.body as { userId?: string; amount?: number };
  if (!userId || !amount) return res.status(400).json({ error: 'userId and amount are required' });

  const user = await User.findByIdAndUpdate(userId, { $inc: { sp: amount } }, { new: true }).select('name sp');
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ user });
}
