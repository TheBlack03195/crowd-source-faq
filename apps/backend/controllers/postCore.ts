import type { Request } from 'express';
import mongoose from 'mongoose';

export function isOwnerOrModerator(req: Request, authorId: mongoose.Types.ObjectId) {
  if (!req.user) return false;
  if (req.user.role === 'admin' || req.user.role === 'moderator') return true;
  return req.user._id.toString() === authorId.toString();
}
