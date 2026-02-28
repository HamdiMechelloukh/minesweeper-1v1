import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      username   TEXT PRIMARY KEY,
      wins       INTEGER DEFAULT 0,
      losses     INTEGER DEFAULT 0,
      games      INTEGER DEFAULT 0,
      best_ms    INTEGER,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
