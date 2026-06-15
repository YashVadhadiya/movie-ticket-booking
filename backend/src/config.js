import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
