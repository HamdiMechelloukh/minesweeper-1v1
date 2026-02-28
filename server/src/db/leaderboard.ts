import { pool } from './database';

export interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  games: number;
  best_ms: number | null;
}

export async function upsertResult(
  username: string,
  won: boolean,
  timeMs: number | null
): Promise<void> {
  await pool.query(
    `INSERT INTO leaderboard (username, wins, losses, games, best_ms, updated_at)
     VALUES ($1, $2, $3, 1, $4, NOW())
     ON CONFLICT (username) DO UPDATE SET
       wins       = leaderboard.wins + $2,
       losses     = leaderboard.losses + $3,
       games      = leaderboard.games + 1,
       best_ms    = CASE
                      WHEN $4 IS NOT NULL AND (leaderboard.best_ms IS NULL OR $4 < leaderboard.best_ms)
                      THEN $4
                      ELSE leaderboard.best_ms
                    END,
       updated_at = NOW()`,
    [username, won ? 1 : 0, won ? 0 : 1, timeMs]
  );
}

export async function getTop20(): Promise<LeaderboardEntry[]> {
  const result = await pool.query<LeaderboardEntry>(
    `SELECT username, wins, losses, games, best_ms
     FROM leaderboard
     ORDER BY wins DESC, best_ms ASC NULLS LAST
     LIMIT 20`
  );
  return result.rows;
}
