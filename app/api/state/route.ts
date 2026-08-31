import { ensureSchema, getRawDb } from "../../../db/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const db = getRawDb();
    const [leaderboard, directory, games] = await Promise.all([
      db.prepare(`SELECT id, name, image, rating, wins, losses, created_at AS createdAt
        FROM players WHERE wins + losses > 0
        ORDER BY rating DESC, wins DESC, losses ASC, name COLLATE NOCASE ASC`).all(),
      db.prepare(`SELECT id, name, image, rating, wins, losses, created_at AS createdAt
        FROM players ORDER BY name COLLATE NOCASE ASC`).all(),
      db.prepare(`SELECT g.id, g.winner_id AS winnerId, g.loser_id AS loserId,
        g.winner_before AS winnerBefore, g.winner_after AS winnerAfter,
        g.loser_before AS loserBefore, g.loser_after AS loserAfter,
        g.created_at AS createdAt,
        winner.name AS winnerName, winner.image AS winnerImage,
        loser.name AS loserName, loser.image AS loserImage
        FROM games g
        JOIN players winner ON winner.id = g.winner_id
        JOIN players loser ON loser.id = g.loser_id
        ORDER BY g.created_at DESC`).all(),
    ]);
    return Response.json({ leaderboard: leaderboard.results, directory: directory.results, games: games.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load the leaderboard." }, { status: 500 });
  }
}
