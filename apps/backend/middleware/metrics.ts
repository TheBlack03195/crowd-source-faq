import type { Request, Response, NextFunction } from 'express';
import { incrementCounter, recordDuration } from '../utils/metrics.js';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    incrementCounter(`http_requests_total{method="${req.method}",status="${res.statusCode}"}`);
    recordDuration('http_request_duration_ms', Date.now() - start);
  });
  next();
}
