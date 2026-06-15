import { Router } from 'express';
import { nanoid } from 'nanoid';
import { createTheater, getTheater, updateTheater, listTheaters, deleteTheater } from '../services/redis.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, location, seatLayout } = req.body;
    if (!name) return res.status(400).json({ error: 'Theater name is required' });
    const id = nanoid(8);
    await createTheater(id, { name, location, seatLayout: seatLayout || { rows: [], screen: { position: 'top' } } });
    const theater = await getTheater(id);
    res.status(201).json(theater);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const theaters = await listTheaters();
    res.json(theaters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const theater = await getTheater(req.params.id);
    if (!theater) return res.status(404).json({ error: 'Theater not found' });
    res.json(theater);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await getTheater(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Theater not found' });
    await updateTheater(req.params.id, req.body);
    const updated = await getTheater(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await deleteTheater(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
