import { Router } from 'express';
import {
  publicRecent,
  publicPopular,
  publicCategories,
  publicDetail,
} from '../controllers/publicFaqController.js';

const router = Router();

router.get('/recent', publicRecent);
router.get('/popular', publicPopular);
router.get('/categories', publicCategories);
router.get('/:id', publicDetail);

export default router;
