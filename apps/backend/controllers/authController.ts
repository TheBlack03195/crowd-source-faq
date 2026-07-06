import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { User, type IUser } from '../models/User.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

function signToken(userId: string, role: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  const jti = randomUUID();
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  const token = jwt.sign({ userId, role, jti }, secret, { expiresIn });
  return token;
}

function publicUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    reputation: user.reputation,
    createdAt: user.createdAt,
  };
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as z.infer<typeof registerSchema>;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id.toString(), user.role);

  return res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.isDeleted) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.isBanned) {
    return res.status(403).json({ error: 'This account has been banned' });
  }
  if (user.suspendedUntil && user.suspendedUntil > new Date()) {
    return res.status(403).json({ error: 'This account is currently suspended' });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user._id.toString(), user.role);
  return res.json({ token, user: publicUser(user) });
}

export async function getMe(req: Request, res: Response) {
  
  return res.json({ user: publicUser(req.user!) });
}


export async function deleteAccount(req: Request, res: Response) {
  const user = req.user!;

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.name = 'Deleted User';
  user.email = `deleted-${user._id}@yaksha.invalid`;
  user.password = randomUUID(); 
  await user.save();

  res.status(204).send();
}
