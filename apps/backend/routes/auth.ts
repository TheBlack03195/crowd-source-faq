import { Router } from 'express';
import { register, login, getMe, registerSchema, loginSchema } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateBody } from '../utils/validation.js';
import { authLimiter } from '../utils/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.get('/me', protect, getMe);

export default router;
