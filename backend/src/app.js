import express from 'express';
import cors from 'cors';
import { config } from './config.js';

import authRoutes from './routes/auth.js';
import theaterRoutes from './routes/theaters.js';
import movieRoutes from './routes/movies.js';
import showRoutes from './routes/shows.js';
import bookingRoutes from './routes/bookings.js';
import smsRoutes from './routes/sms.js';
import statsRoutes from './routes/stats.js';

const app = express();

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/admin', authRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
