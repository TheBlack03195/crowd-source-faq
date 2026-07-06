import { Router } from 'express';
import {
  flagOutdated,
  voteFreshness,
  getReviewQueue,
  dismissFlag,
  runFreshnessCheck,
} from '../controllers/freshnessController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();

router.post('/:id/flag-outdated', protect, flagOutdated);
router.post('/:id/vote', protect, voteFreshness);
router.get('/review-queue', protect, getReviewQueue);
router.post('/:id/dismiss', ...adminOnly, dismissFlag);
router.post('/run', ...adminOnly, runFreshnessCheck);

export default router;
