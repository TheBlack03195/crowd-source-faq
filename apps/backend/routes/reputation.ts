import { Router } from 'express';
import { leaderboard, reputationHistory } from '../controllers/reputationController.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();

router.get('/leaderboard', leaderboard);
router.get('/history/:userId', ...adminOnly, reputationHistory);

export default router;
