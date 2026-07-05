import { Router } from 'express';
import {
  runFaqAudit,
  getAuditQueue,
  getAuditStats,
  approveAuditedFaq,
} from '../controllers/faqAuditController.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();


router.post('/faq-audit/run', ...adminOnly, runFaqAudit);
router.get('/faq-audit/queue', ...adminOnly, getAuditQueue);
router.get('/faq-audit/stats', ...adminOnly, getAuditStats);
router.post('/faq-audit/:id/approve', ...adminOnly, approveAuditedFaq);

export default router;
