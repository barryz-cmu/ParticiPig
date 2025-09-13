import { saveClassesForUser, getClassesByUserId } from './models.js';
// ...existing code...
import express from 'express';
import dotenv from 'dotenv';
import { createTables } from './models.js';
import { signup, login, getUserById, authenticateToken } from './auth.js';
import { updateClassById, deleteClassById } from './models.classEdit.js';
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

// Edit a class (name/location/start_time/end_time)
app.put('/api/class/:id', authenticateToken, async (req, res) => {
  const classId = req.params.id;
  const { name, location, start_time, end_time } = req.body;
  if (!name || !location || !start_time || !end_time) return res.status(400).json({ error: 'Missing fields' });
  try {
    await updateClassById(req.user.id, classId, name, location, start_time, end_time);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Delete a class
app.delete('/api/class/:id', authenticateToken, async (req, res) => {
  const classId = req.params.id;
  try {
    await deleteClassById(req.user.id, classId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// Save (replace) all classes for a user
app.post('/api/classes', authenticateToken, async (req, res) => {
  const { classes } = req.body;
  if (!Array.isArray(classes)) return res.status(400).json({ error: 'Classes must be an array' });
  try {
    await saveClassesForUser(req.user.id, classes);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save classes' });
  }
});

// Get all classes for a user
app.get('/api/classes', authenticateToken, async (req, res) => {
  try {
    const result = await getClassesByUserId(req.user.id);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
