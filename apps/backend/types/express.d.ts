import type { IUser } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      auth?: {
        userId: string;
        role: string;
        jti: string;
      };
    }
  }
}

export {};
