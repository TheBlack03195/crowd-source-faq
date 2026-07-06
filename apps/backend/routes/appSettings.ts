import { Router } from 'express';
import { getPublicSettings, updateSettings } from '../controllers/appSettingsController.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();

router.get('/', getPublicSettings);
router.patch('/', ...adminOnly, updateSettings);

export default router;
