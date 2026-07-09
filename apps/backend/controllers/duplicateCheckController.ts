import type { Request, Response } from 'express';
import { z } from 'zod';
import { FAQ } from '../models/FAQ.js';
import { CommunityPost } from '../models/CommunityPost.js';
import { AppSetting } from '../models/AppSetting.js';

export const checkDuplicateSchema = z.object({
  title: z.string().trim().min(5).max(300),
});

const MAX_MATCHES = 4;

export async function checkDuplicatePost(req: Request, res: Response) {
  const { title } = req.body as z.infer<typeof checkDuplicateSchema>;

  const [faqMatches, postMatches] = await Promise.all([
    FAQ.find(
      { $text: { $search: title }, reviewStatus: 'approved' },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(MAX_MATCHES)
      .select('question'),
    CommunityPost.find(
      { $text: { $search: title }, isTakenDown: false },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(MAX_MATCHES)
      .select('title status'),
  ]);

  const matches = [
    ...faqMatches.map((f) => ({ type: 'faq' as const, id: f._id.toString(), text: f.question })),
    ...postMatches.map((p) => ({
      type: 'post' as const,
      id: p._id.toString(),
      text: p.title,
      status: p.status,
    })),
  ].slice(0, MAX_MATCHES);

  res.json({ matches });
}


export async function recordDuplicateAverted(_req: Request, res: Response) {
  await AppSetting.updateOne({ key: 'singleton' }, { $inc: { duplicatesPreventedCount: 1 } }, { upsert: true });
  res.status(204).send();
}