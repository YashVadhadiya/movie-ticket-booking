import { vi } from 'vitest';

process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD = 'testpass';
process.env.PORT = '3002';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.REDIS_URL = 'redis://localhost:6379';
