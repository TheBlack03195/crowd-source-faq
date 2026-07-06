import { Router } from 'express';
import { renderMetrics } from '../utils/metrics.js';

const router = Router();

router.get('/', (_req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(renderMetrics());
});

export default router;
