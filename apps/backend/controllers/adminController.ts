import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { FAQ } from '../models/FAQ.js';
import { CommunityPost } from '../models/CommunityPost.js';
import { SupportRequest } from '../models/SupportRequest.js';
import { ZoomMeeting } from '../models/ZoomMeeting.js';
import { PipelineResult } from '../models/PipelineResult.js';
import { getAppSettings } from '../models/AppSetting.js';

export async function getDashboardStats(_req: Request, res: Response) {
  const [
    totalUsers,
    totalFaqs,
    pendingReviewFaqs,
    totalPosts,
    openPosts,
    openSupportTickets,
    goldenTickets,
    failedZoomMeetings,
    recentPipelineActivity,
    appSettings,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    FAQ.countDocuments(),
    FAQ.countDocuments({ reviewStatus: 'pending_review' }),
    CommunityPost.countDocuments({ isTakenDown: false }),
    CommunityPost.countDocuments({ status: 'open', isTakenDown: false }),
    SupportRequest.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    SupportRequest.countDocuments({ isGolden: true, status: { $in: ['open', 'in_progress'] } }),
    ZoomMeeting.countDocuments({ status: 'failed' }),
    PipelineResult.find().sort({ checkedAt: -1 }).limit(10),
    getAppSettings(),
  ]);

  res.json({
    totalUsers,
    totalFaqs,
    pendingReviewFaqs,
    totalPosts,
    openPosts,
    openSupportTickets,
    goldenTickets,
    failedZoomMeetings,
    recentPipelineActivity,
    duplicatesPrevented: appSettings.duplicatesPreventedCount,
  });
}


export async function listUsers(req: Request, res: Response) {
  const { search, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const filter: Record<string, unknown> = { isDeleted: false };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('name email role reputation isBanned suspendedUntil sp createdAt'),
    User.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, limit: limitNum });
}


export async function updateUserRole(req: Request, res: Response) {
  const { role } = req.body as { role?: string };
  if (!role || !['user', 'moderator', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be user, moderator, or admin' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('name email role');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}