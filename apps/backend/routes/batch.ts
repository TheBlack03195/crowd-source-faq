import { Router } from 'express';
import {
  listBatches,
  getCurrentBatch,
  createBatch,
  archiveBatch,
  createBatchSchema,
  listCategories,
  createCategory,
  archiveCategory,
  createCategorySchema,
  faqsByBatch,
} from '../controllers/batchController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateBody } from '../utils/validation.js';

const router = Router();


router.get('/', listBatches);
router.get('/current', getCurrentBatch);
router.post('/', protect, authorize('admin'), validateBody(createBatchSchema), createBatch);
router.patch('/:id/archive', protect, authorize('admin'), archiveBatch);
router.get('/:batchId/faqs', faqsByBatch);

router.get('/categories/list', listCategories);
router.post(
  '/categories',
  protect,
  authorize('admin', 'moderator'),
  validateBody(createCategorySchema),
  createCategory
);
router.patch('/categories/:id/archive', protect, authorize('admin', 'moderator'), archiveCategory);

export default router;
