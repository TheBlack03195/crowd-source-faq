import type { Request, Response, NextFunction } from 'express';
import { verifyAndLoadUser, AuthError } from './authShared.js';

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AuthError('Not authenticated. Missing Bearer token.', 401);
    }
    const token = header.slice('Bearer '.length).trim();

    const { user, decoded } = await verifyAndLoadUser(token);

    req.user = user;
    req.auth = { userId: decoded.userId, role: decoded.role, jti: decoded.jti };
    next();
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('[auth] unexpected error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next();
    }
    const token = header.slice('Bearer '.length).trim();

    const { user, decoded } = await verifyAndLoadUser(token);

    req.user = user;
    req.auth = { userId: decoded.userId, role: decoded.role, jti: decoded.jti };
    next();
  } catch {
    
    next();
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}