import mongoose from 'mongoose';
import { ZoomMeeting, type IZoomMeeting } from '../models/ZoomMeeting.js';
import { ZoomInsight } from '../models/ZoomInsight.js';
import { TranscriptKnowledge } from '../models/TranscriptKnowledge.js';
import { FAQ } from '../models/FAQ.js';
import { Category } from '../models/Category.js';
import { extractInsightsFromTranscript } from '../utils/zoomExtractor.js';
import { tryGenerateEmbedding } from '../utils/embeddings.js';
import { isEmptyTranscript } from '../utils/vttParser.js';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 3;


export async function processZoomMeetingForKnowledge(
  meeting: IZoomMeeting,
  transcriptText: string
): Promise<{ extracted: number }> {
  meeting.status = 'processing';
  await meeting.save();

  try {
    if (isEmptyTranscript(transcriptText)) {
      meeting.status = 'completed';
      meeting.insightsExtracted = 0;
      await meeting.save();
      return { extracted: 0 };
    }

    const pairs = await extractInsightsFromTranscript(transcriptText);

    for (const pair of pairs) {
      const embedding = await tryGenerateEmbedding(`${pair.question}\n${pair.answer}`);

      await TranscriptKnowledge.create({
        question: pair.question,
        answer: pair.answer,
        sourceMeetingId: meeting._id,
        sourceMeetingTopic: meeting.topic,
        batchId: meeting.batchId,
        ...(embedding ? { embedding } : {}),
      });

      await ZoomInsight.create({
        question: pair.question,
        answer: pair.answer,
        sourceMeetingId: meeting._id,
        reviewStatus: 'pending_review',
      });
    }

    meeting.status = 'completed';
    meeting.insightsExtracted = pairs.length;
    await meeting.save();

    return { extracted: pairs.length };
  } catch (err) {
    meeting.retryCount += 1;
    meeting.status = 'failed';
    meeting.errorMessage = (err as Error).message;
    meeting.deadLettered = meeting.retryCount >= MAX_RETRIES;
    await meeting.save();

    logger.error('Zoom meeting processing failed', {
      meetingId: meeting._id.toString(),
      retryCount: meeting.retryCount,
      deadLettered: meeting.deadLettered,
      message: (err as Error).message,
    });

    throw err;
  }
}


export async function promoteInsightToFaq(
  insightId: string,
  categoryId: string,
  reviewerId: string
): Promise<{ faqId: string }> {
  const insight = await ZoomInsight.findById(insightId);
  if (!insight) throw new Error('Insight not found');

  const category = await Category.findById(categoryId);
  if (!category) throw new Error('categoryId does not reference a real category');

  const embedding = await tryGenerateEmbedding(`${insight.question}\n${insight.answer}`);

  const faq = await FAQ.create({
    question: insight.question,
    answer: insight.answer,
    categoryId,
    createdBy: reviewerId,
    ...(embedding ? { embedding } : {}),
  });

  insight.reviewStatus = 'approved';
  insight.promotedToFaqId = faq._id as mongoose.Types.ObjectId;
  insight.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
  await insight.save();

  return { faqId: faq._id.toString() };
}
