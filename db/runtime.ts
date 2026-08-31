import { env } from "cloudflare:workers";

export function getRawDb() {
  if (!env.DB) throw new Error("The leaderboard database is unavailable.");
  return env.DB;
}

export function ensureSchema() {
  return initialize();
}

async function initialize() {
  const db = getRawDb();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL UNIQUE, image TEXT,
      rating INTEGER NOT NULL DEFAULT 1200, wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY NOT NULL, winner_id TEXT NOT NULL REFERENCES players(id),
      loser_id TEXT NOT NULL REFERENCES players(id), winner_before INTEGER NOT NULL,
      winner_after INTEGER NOT NULL, loser_before INTEGER NOT NULL,
      loser_after INTEGER NOT NULL, created_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_players_rating_wins ON players(rating DESC, wins DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC)"),
    db.prepare("PRAGMA optimize"),
  ]);
}
