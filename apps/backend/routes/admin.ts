import { Router } from 'express';
import { getDashboardStats, listUsers, updateUserRole } from '../controllers/adminController.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();


router.get('/dashboard', ...adminOnly, getDashboardStats);
router.get('/users', ...adminOnly, listUsers);
router.patch('/users/:id/role', ...adminOnly, updateUserRole);

export default router;
