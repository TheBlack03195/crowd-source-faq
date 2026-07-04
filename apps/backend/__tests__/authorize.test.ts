import { describe, it, expect, vi } from 'vitest';
import { authorize } from '../middleware/auth.js';
import type { Request, Response } from 'express';

function mockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('authorize()', () => {
  it('returns 401 when req.user is missing', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when role is not permitted', () => {
    const req = { user: { role: 'user' } } as Request;
    const res = mockRes();
    const next = vi.fn();

    authorize('admin', 'moderator')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when role is permitted', () => {
    const req = { user: { role: 'admin' } } as Request;
    const res = mockRes();
    const next = vi.fn();

    authorize('admin', 'moderator')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
