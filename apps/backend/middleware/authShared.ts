import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/User.js';
import { RevokedToken } from '../models/RevokedToken.js';

export interface DecodedToken {
  userId: string;
  role: string;
  jti: string;
  iat: number;
  exp: number;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function verifyAndLoadUser(token: string): Promise<{
  user: IUser;
  decoded: DecodedToken;
}> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AuthError('Server misconfiguration: JWT_SECRET not set', 500);
  }

  let decoded: DecodedToken;
  try {
    decoded = jwt.verify(token, secret) as DecodedToken;
  } catch {
    throw new AuthError('Invalid or expired token', 401);
  }

  if (decoded.jti) {
    const revoked = await RevokedToken.findOne({ jti: decoded.jti }).lean();
    if (revoked) {
      throw new AuthError('Token has been revoked', 401);
    }
  }

  const user = await User.findById(decoded.userId).select('+password');
  if (!user) {
    throw new AuthError('User no longer exists', 401);
  }
  if (user.isDeleted) {
    throw new AuthError('Account has been deleted', 401);
  }
  if (user.isBanned) {
    throw new AuthError('Account has been banned', 403);
  }
  if (user.suspendedUntil && user.suspendedUntil > new Date()) {
    throw new AuthError('Account is currently suspended', 403);
  }

  return { user, decoded };
}
