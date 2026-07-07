import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';
import {
  createSupportRequest,
  listMySupportRequests,
  listAllSupportRequests,
  getSupportRequest,
  addFollowUp,
  updateSupportStatus,
  deleteSupportRequest,
  supportAnalytics,
} from '../controllers/supportRequestsController.js';
import {
  listSupportCategories,
  upsertSupportCategory,
  addContextField,
  updateContextField,
  archiveContextField,
} from '../controllers/supportCategoriesController.js';
import {
  getGoldenBalance,
  submitGoldenTicket,
  getEscalationQueue,
  awardSp,
} from '../controllers/supportGoldenController.js';

const router = Router();


router.post('/', protect, createSupportRequest);
router.get('/', ...adminOnly, listAllSupportRequests);
router.get('/mine', protect, listMySupportRequests);
router.get('/analytics', ...adminOnly, supportAnalytics);
router.get('/:id', protect, getSupportRequest);
router.post('/:id/follow-up', protect, addFollowUp);
router.patch('/:id/status', ...adminOnly, updateSupportStatus);
router.delete('/:id', protect, deleteSupportRequest);


router.get('/categories/list', listSupportCategories);
router.post('/categories', ...adminOnly, upsertSupportCategory);
router.post('/categories/:id/fields', ...adminOnly, addContextField);
router.patch('/categories/:id/fields/:fieldKey', ...adminOnly, updateContextField);
router.delete('/categories/:id/fields/:fieldKey', ...adminOnly, archiveContextField);


router.get('/golden/balance', protect, getGoldenBalance);
router.get('/golden/queue', protect, getEscalationQueue);
router.post('/golden/:requestId', protect, submitGoldenTicket);
router.post('/golden/award', ...adminOnly, awardSp);

export default router;