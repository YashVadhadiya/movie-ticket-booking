import { Router } from 'express';
import { nanoid } from 'nanoid';
import { createMovie, getMovie, updateMovie, listMovies, deleteMovie } from '../services/redis.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { title, poster, youtube, duration, language, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Movie title is required' });
    const id = nanoid(8);
    await createMovie(id, { title, poster, youtube, duration: parseInt(duration) || 0, language, description });
    const movie = await getMovie(id);
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const movies = await listMovies();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await getMovie(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await getMovie(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Movie not found' });
    await updateMovie(req.params.id, req.body);
    const updated = await getMovie(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await deleteMovie(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
