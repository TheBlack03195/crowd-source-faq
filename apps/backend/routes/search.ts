import { Router } from 'express';
import { search, suggest, trending } from '../controllers/searchController.js';

const router = Router();

router.get('/', search);
router.get('/suggest', suggest);
router.get('/trending', trending);

export default router;
