import type { Request, Response } from 'express';
import { FAQ } from '../models/FAQ.js';
import { FreshReviewVote } from '../models/FreshReviewVote.js';
import { FreshReviewLog } from '../models/FreshReviewLog.js';

const TIER_DAYS: Record<string, number> = {
  evergreen: 365,
  seasonal: Number(process.env.FAQ_SEASONAL_DAYS) || 15,
  volatile: Number(process.env.FAQ_VOLATILE_DAYS) || 4,
};
const VERIFY_THRESHOLD = Number(process.env.FAQ_VERIFY_THRESHOLD) || 3;
const ESCALATION_DAYS = Number(process.env.FAQ_ESCALATION_DAYS) || 3;


export async function flagOutdated(req: Request, res: Response) {
  const { reason } = req.body as { reason?: string };
  const faq = await FAQ.findById(req.params.id);
  if (!faq) return res.status(404).json({ error: 'FAQ not found' });

  faq.reviewStatus = 'pending_review';
  faq.flagType = 'manual';
  faq.reviewCycle += 1;
  await faq.save();

  await FreshReviewLog.create({
    faqId: faq._id,
    reviewCycle: faq.reviewCycle,
    event: 'flagged',
    actorId: req.user!._id,
    reason,
  });

  res.json({ faq });
}


export async function voteFreshness(req: Request, res: Response) {
  const { vote, suggestion } = req.body as { vote?: 'still_accurate' | 'needs_update'; suggestion?: string };
  if (vote !== 'still_accurate' && vote !== 'needs_update') {
    return res.status(400).json({ error: 'vote must be "still_accurate" or "needs_update"' });
  }

  const faq = await FAQ.findById(req.params.id);
  if (!faq) return res.status(404).json({ error: 'FAQ not found' });
  if (faq.reviewStatus !== 'pending_review') {
    return res.status(400).json({ error: 'This FAQ is not currently under review' });
  }

  try {
    await FreshReviewVote.create({
      faqId: faq._id,
      reviewCycle: faq.reviewCycle,
      voterId: req.user!._id,
      vote,
      suggestion,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You already voted on this review cycle' });
    }
    throw err;
  }

  await FreshReviewLog.create({
    faqId: faq._id,
    reviewCycle: faq.reviewCycle,
    event: 'voted',
    actorId: req.user!._id,
  });

  const stillAccurateCount = await FreshReviewVote.countDocuments({
    faqId: faq._id,
    reviewCycle: faq.reviewCycle,
    vote: 'still_accurate',
  });

  if (stillAccurateCount >= VERIFY_THRESHOLD) {
    faq.reviewStatus = 'approved';
    faq.flagType = null;
    faq.lastVerifiedAt = new Date();
    await faq.save();
    await FreshReviewLog.create({
      faqId: faq._id,
      reviewCycle: faq.reviewCycle,
      event: 'auto_verified',
      actorId: null,
      reason: `${stillAccurateCount} peer votes confirmed accuracy`,
    });
  }

  res.json({ faq, stillAccurateCount });
}


export async function getReviewQueue(_req: Request, res: Response) {
  const items = await FAQ.find({ reviewStatus: 'pending_review' }).sort({ updatedAt: 1 });
  res.json({ items });
}


export async function dismissFlag(req: Request, res: Response) {
  const faq = await FAQ.findById(req.params.id);
  if (!faq) return res.status(404).json({ error: 'FAQ not found' });

  faq.reviewStatus = 'approved';
  faq.flagType = null;
  faq.lastVerifiedAt = new Date();
  await faq.save();

  await FreshReviewLog.create({
    faqId: faq._id,
    reviewCycle: faq.reviewCycle,
    event: 'dismissed',
    actorId: req.user!._id,
  });

  res.json({ faq });
}


export async function runFreshnessCheck(_req: Request, res: Response) {
  const tiers = Object.keys(TIER_DAYS) as Array<keyof typeof TIER_DAYS>;
  let flaggedCount = 0;

  for (const tier of tiers) {
    const cutoff = new Date(Date.now() - TIER_DAYS[tier] * 24 * 60 * 60 * 1000);
    const stale = await FAQ.find({
      freshnessTier: tier,
      reviewStatus: 'approved',
      lastVerifiedAt: { $lt: cutoff },
    });

    for (const faq of stale) {
      faq.reviewStatus = 'pending_review';
      faq.flagType = 'auto';
      faq.reviewCycle += 1;
      await faq.save();
      await FreshReviewLog.create({
        faqId: faq._id,
        reviewCycle: faq.reviewCycle,
        event: 'flagged',
        actorId: null,
        reason: `Exceeded ${tier} review interval (${TIER_DAYS[tier]} days)`,
      });
      flaggedCount++;
    }
  }

 
  const escalationCutoff = new Date(Date.now() - ESCALATION_DAYS * 24 * 60 * 60 * 1000);
  const stalledReviews = await FAQ.find({
    reviewStatus: 'pending_review',
    updatedAt: { $lt: escalationCutoff },
  });
  for (const faq of stalledReviews) {
    await FreshReviewLog.create({
      faqId: faq._id,
      reviewCycle: faq.reviewCycle,
      event: 'escalated',
      actorId: null,
      reason: `No resolution after ${ESCALATION_DAYS} days under review`,
    });
  }

  res.json({ flagged: flaggedCount, escalated: stalledReviews.length });
}
