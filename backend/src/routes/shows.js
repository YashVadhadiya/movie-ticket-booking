import { Router } from 'express';
import { nanoid } from 'nanoid';
import {
  createShow, getShow, getShowBySlug, updateShow, deleteShow, listShows,
  getShowSeats, getTheater, getMovie
} from '../services/redis.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { theaterId, movieId, showDate, showTime, price } = req.body;
    if (!theaterId || !movieId || !showDate || !showTime) {
      return res.status(400).json({ error: 'theaterId, movieId, showDate, and showTime are required' });
    }
    const slug = nanoid(10);
    const id = nanoid(8);
    const result = await createShow(id, {
      theaterId, movieId, showDate, showTime,
      price: parseFloat(price) || 0, slug,
    });
    const show = await getShow(id);
    res.status(201).json(show);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const shows = await listShows();
    const enriched = await Promise.all(shows.map(async (show) => {
      const theater = await getTheater(show.theaterId);
      const movie = await getMovie(show.movieId);
      return { ...show, theater: theater?.name || 'Unknown', movie: movie?.title || 'Unknown' };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const show = await getShowBySlug(req.params.slug);
    if (!show) return res.status(404).json({ error: 'Show not found' });
    const theater = await getTheater(show.theaterId);
    const movie = await getMovie(show.movieId);
    const seats = await getShowSeats(show.id);
    res.json({ ...show, theater, movie, seats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const show = await getShow(req.params.id);
    if (!show) return res.status(404).json({ error: 'Show not found' });
    const theater = await getTheater(show.theaterId);
    const movie = await getMovie(show.movieId);
    res.json({ ...show, theater, movie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/seats', async (req, res) => {
  try {
    const show = await getShow(req.params.id);
    if (!show) return res.status(404).json({ error: 'Show not found' });
    const seats = await getShowSeats(req.params.id);
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await getShow(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Show not found' });
    await updateShow(req.params.id, req.body);
    const updated = await getShow(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const success = await deleteShow(req.params.id);
    if (!success) return res.status(404).json({ error: 'Show not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
