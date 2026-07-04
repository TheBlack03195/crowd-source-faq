import type { Request, Response } from 'express';
import { Bookmark } from '../models/Bookmark.js';

export async function toggleBookmark(req: Request, res: Response) {
  const userId = req.user!._id;
  const { postId } = req.params;

  const existing = await Bookmark.findOne({ userId, postId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ bookmarked: false });
  }

  await Bookmark.create({ userId, postId });
  res.json({ bookmarked: true });
}

export async function listBookmarks(req: Request, res: Response) {
  const bookmarks = await Bookmark.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'postId',
      select: 'title body status upvotes createdAt',
    });
  res.json({ bookmarks });
}
