import { Router } from 'express';
import {
  listFaqs,
  getFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  checkMatch,
  createFaqSchema,
  updateFaqSchema,
} from '../controllers/faqController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateBody } from '../utils/validation.js';

const router = Router();

router.get('/', listFaqs);
router.get('/check-match', checkMatch);
router.get('/:id', getFaq);

router.post('/', protect, authorize('admin', 'moderator'), validateBody(createFaqSchema), createFaq);
router.patch('/:id', protect, authorize('admin', 'moderator'), validateBody(updateFaqSchema), updateFaq);
router.delete('/:id', protect, authorize('admin'), deleteFaq);

export default router;
