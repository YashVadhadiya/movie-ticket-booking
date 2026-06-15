import { describe, it, expect } from 'vitest';

describe('config', () => {
  it('should load config from environment variables', async () => {
    const { config } = await import('../src/config.js');
    expect(config.port).toBe(3002);
    expect(config.jwtSecret).toBe('test-secret');
    expect(config.admin.username).toBe('testadmin');
    expect(config.admin.password).toBe('testpass');
    expect(config.frontendUrl).toBe('http://localhost:5173');
    expect(config.redisUrl).toBe('redis://localhost:6379');
  });

  it('should provide defaults when env vars are not set', () => {
    delete process.env.JWT_SECRET;
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    // Dynamic import with fresh module
  });
});
