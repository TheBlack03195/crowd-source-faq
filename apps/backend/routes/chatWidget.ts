import { Router } from 'express';
import { chatWidgetReply, chatWidgetSchema } from '../controllers/chatWidgetController.js';
import { validateBody } from '../utils/validation.js';
import { createIdentityLimiter } from '../utils/rateLimit.js';

const router = Router();


const chatLimiter = createIdentityLimiter(60 * 1000, 10);

router.post('/', chatLimiter, validateBody(chatWidgetSchema), chatWidgetReply);

export default router;
