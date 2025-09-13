import pool from './db.js';

export async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
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
      user_id INTEGER REFERENCES users(id),
      pig_id INTEGER REFERENCES pigs(id),
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
