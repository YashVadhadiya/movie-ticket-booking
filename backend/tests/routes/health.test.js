import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

let app;

beforeEach(async () => {
  vi.resetModules();
  app = (await import('../../src/app.js')).default;
});

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});
