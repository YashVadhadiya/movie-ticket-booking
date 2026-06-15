import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const mockSecret = 'test-secret';
process.env.JWT_SECRET = mockSecret;

let authenticate;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../../src/middleware/auth.js');
  authenticate = mod.authenticate;
});

describe('authenticate middleware', () => {
  it('should return 401 if no authorization header', () => {
    const req = { headers: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Basic token123' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 401 if token is invalid', () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('should call next with decoded payload if token is valid', () => {
    const token = jwt.sign({ username: 'admin', role: 'admin' }, mockSecret);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.admin).toBeDefined();
    expect(req.admin.username).toBe('admin');
    expect(req.admin.role).toBe('admin');
  });

  it('should reject token signed with different secret', () => {
    const token = jwt.sign({ username: 'admin' }, 'wrong-secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should reject expired token', () => {
    const token = jwt.sign({ username: 'admin' }, mockSecret, { expiresIn: '0s' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
