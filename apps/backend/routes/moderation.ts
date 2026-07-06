import { Router } from 'express';
import {
  banUser,
  unbanUser,
  suspendUser,
  unsuspendUser,
  warnUser,
  listModerationLogs,
} from '../controllers/moderationController.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();

router.post('/:userId/ban', ...adminOnly, banUser);
router.post('/:userId/unban', ...adminOnly, unbanUser);
router.post('/:userId/suspend', ...adminOnly, suspendUser);
router.post('/:userId/unsuspend', ...adminOnly, unsuspendUser);
router.post('/:userId/warn', ...adminOnly, warnUser);
router.get('/logs', ...adminOnly, listModerationLogs);

export default router;
