import cron from 'node-cron';
import type { Request, Response } from 'express';
import { runAutoAnswer } from '../controllers/autoAnswerController.js';
import { runFaqAudit } from '../controllers/faqAuditController.js';
import { runFreshnessCheck } from '../controllers/freshnessController.js';
import { logger } from './logger.js';


function fakeReqRes() {
  const req = {} as Request;
  const res = {
    json: (body: unknown) => logger.info('[scheduler] job result', { body }),
    status: () => res,
  } as unknown as Response;
  return { req, res };
}


export function startSchedulers() {
  const autoAnswerCron = process.env.AUTO_ANSWER_CRON_SCHEDULE || '0 0 * * *'; 
  const faqAuditCron = process.env.FAQ_AUDIT_CRON_SCHEDULE || '0 */6 * * *'; 
  const freshnessCron = process.env.FAQ_FRESHNESS_CRON_SCHEDULE || '0 6 * * *'; 

  cron.schedule(freshnessCron, async () => {
    logger.info('[scheduler] Running FAQ freshness check');
    const { req, res } = fakeReqRes();
    try {
      await runFreshnessCheck(req, res);
    } catch (err) {
      logger.error('[scheduler] freshness check failed', { message: (err as Error).message });
    }
  });

  cron.schedule(autoAnswerCron, async () => {
    logger.info('[scheduler] Running auto-answer pipeline');
    const { req, res } = fakeReqRes();
    try {
      await runAutoAnswer(req, res);
    } catch (err) {
      logger.error('[scheduler] auto-answer pipeline failed', { message: (err as Error).message });
    }
  });

  cron.schedule(faqAuditCron, async () => {
    logger.info('[scheduler] Running FAQ audit pipeline');
    const { req, res } = fakeReqRes();
    try {
      await runFaqAudit(req, res);
    } catch (err) {
      logger.error('[scheduler] FAQ audit pipeline failed', { message: (err as Error).message });
    }
  });

  logger.info('[scheduler] Pipelines scheduled', { autoAnswerCron, faqAuditCron, freshnessCron });
}
