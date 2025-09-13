// Get all classes for a user
export async function getClassesByUserId(userId) {
  return pool.query('SELECT id, name, location, start_time, end_time FROM classes WHERE user_id = $1', [userId]);
}

// Replace all classes for a user
export async function saveClassesForUser(userId, classes) {
  // Remove old classes
  await pool.query('DELETE FROM classes WHERE user_id = $1', [userId]);
  // Insert new classes
  for (const c of classes) {
    await pool.query('INSERT INTO classes (user_id, name, location, start_time, end_time) VALUES ($1, $2, $3, $4, $5)', [userId, c.name, c.location, c.start_time, c.end_time]);
  }
}

// Record attendance for a class
export async function recordAttendance(userId, classId, reward) {
  const result = await pool.query(
    'INSERT INTO attendance (user_id, class_id, reward) VALUES ($1, $2, $3) RETURNING *',
    [userId, classId, reward]
  );
  return result.rows[0];
}

// Check if user has attended this class within the last 23 hours
export async function hasRecentAttendance(userId, classId) {
  const result = await pool.query(
    'SELECT * FROM attendance WHERE user_id = $1 AND class_id = $2 AND attended_at > NOW() - INTERVAL \'23 hours\'',
    [userId, classId]
  );
  return result.rows.length > 0;
}

// Get total reward points for a user
export async function getTotalRewards(userId) {
  const result = await pool.query(
    'SELECT COALESCE(SUM(reward), 0) as total_rewards FROM attendance WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].total_rewards);
}
import pool from './db.js';

export async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      location VARCHAR(100),
      start_time VARCHAR(20),
      end_time VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS pigs (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      owner_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      reward INTEGER,
      attended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS battles (
      id SERIAL PRIMARY KEY,
      pig1_id INTEGER REFERENCES pigs(id),
      pig2_id INTEGER REFERENCES pigs(id),
      winner_id INTEGER REFERENCES pigs(id),
      battle_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
