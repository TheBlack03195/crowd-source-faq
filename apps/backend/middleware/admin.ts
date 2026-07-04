import type { Request, Response, NextFunction } from 'express';
import { protect, authorize } from './auth.js';

export const adminOnly = [protect, authorize('admin', 'moderator')];

export function adminOnlyFn(req: Request, res: Response, next: NextFunction) {
  protect(req, res, (err?: unknown) => {
    if (err) return next(err);
    authorize('admin', 'moderator')(req, res, next);
  });
}
