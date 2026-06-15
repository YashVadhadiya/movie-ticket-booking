import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (username !== config.admin.username || password !== config.admin.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username, role: 'admin' }, config.jwtSecret, { expiresIn: '8h' });
  res.json({ token, username });
});

router.get('/verify', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], config.jwtSecret);
    res.json({ valid: true, username: decoded.username });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;
