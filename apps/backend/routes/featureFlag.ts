import { Router } from 'express';
import { listFeatureFlags, toggleFeatureFlag } from '../controllers/featureFlagController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();

router.get('/', protect, listFeatureFlags);
router.patch('/:key', ...adminOnly, toggleFeatureFlag);

export default router;
