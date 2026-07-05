import { Router } from 'express';
import { runAutoAnswer, getAutoAnswerQueue } from '../controllers/autoAnswerController.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();


router.post('/auto-answer/run', ...adminOnly, runAutoAnswer);
router.get('/auto-answer/queue', ...adminOnly, getAutoAnswerQueue);

export default router;
