import express from 'express';
import dotenv from 'dotenv';
import { createTables } from './models.js';
import { signup, login, getUserById, authenticateToken } from './auth.js';

import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB tables
createTables().then(() => {
  console.log('Tables are ready.');
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const user = await signup(username, password);
    // Generate JWT token for the new user
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user });
  } catch (e) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const result = await login(username, password);
  if (!result) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(result);
});

// Get user data (protected)
app.get('/api/user', authenticateToken, async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
