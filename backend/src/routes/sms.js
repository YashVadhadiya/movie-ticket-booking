import { Router } from 'express';
import {
  listSmsLogs, getBooking, getShow, getTheater, getMovie,
  createSmsLog
} from '../services/redis.js';
import { authenticate } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const logs = await listSmsLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/retry/:bookingId', authenticate, async (req, res) => {
  try {
    const booking = await getBooking(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const show = await getShow(booking.showId);
    if (!show) return res.status(404).json({ error: 'Show not found' });

    const theater = await getTheater(show.theaterId);
    const movie = await getMovie(show.movieId);

    const message = `Your ticket is confirmed for ${movie?.title || 'Movie'} on ${show.showDate} at ${show.showTime}. Seat(s): ${booking.seats.join(', ')}. Booking ID: ${booking.id}. Thank you for booking with ${theater?.name || 'Theater'}.`;

    const smsLogId = nanoid(12);
    await createSmsLog(smsLogId, {
      bookingId: booking.id,
      mobile: booking.mobile,
      message,
      status: 'retry_logged',
    });

    const whatsappUrl = `https://wa.me/${booking.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      message,
      whatsappUrl,
      smsLogId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
