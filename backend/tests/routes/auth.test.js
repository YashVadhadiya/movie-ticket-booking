import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockConfig = {
  admin: { username: 'testadmin', password: 'testpass' },
  jwtSecret: 'test-secret',
};

vi.mock('../../src/config.js', () => ({
  config: mockConfig,
}));

let app;

beforeEach(async () => {
  vi.resetModules();
  app = (await import('../../src/app.js')).default;
});

describe('POST /api/admin/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'testpass' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.username).toBe('testadmin');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should reject missing username', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ password: 'testpass' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Username and password are required');
  });

  it('should reject missing password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Username and password are required');
  });
});

describe('GET /api/admin/verify', () => {
  it('should verify a valid token', async () => {
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'testpass' });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/admin/verify')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.username).toBe('testadmin');
  });

  it('should reject missing auth header', async () => {
    const res = await request(app).get('/api/admin/verify');
    expect(res.status).toBe(401);
    expect(res.body.valid).toBe(false);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/admin/verify')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.valid).toBe(false);
  });
});
