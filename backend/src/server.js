import app from './app.js';
import { config } from './config.js';
import { ensureConnected } from './services/redis.js';

async function start() {
  try {
    await ensureConnected();
    console.log('Connected to Redis');
  } catch (err) {
    console.warn('Redis connection failed. Server will start but Redis features may not work:', err.message);
  }

  app.listen(config.port, () => {
    console.log(`Mini Theater API running on port ${config.port}`);
    console.log(`Frontend origin: ${config.frontendUrl}`);
  });
}

start();
