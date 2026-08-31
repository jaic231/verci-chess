import { ensureSchema, getRawDb } from "../../../db/runtime";

type PlayerRow = { id:string; rating:number; wins:number; losses:number };

export async function POST(request:Request) {
  try {
    const body = await request.json() as { winnerId?:string; loserId?:string };
    if (!body.winnerId || !body.loserId || body.winnerId === body.loserId) return Response.json({ error:"Choose two different people." }, { status:400 });
    await ensureSchema();
    const db = getRawDb();
    const [winner, loser] = await Promise.all([
      db.prepare("SELECT id, rating, wins, losses FROM players WHERE id = ?").bind(body.winnerId).first<PlayerRow>(),
      db.prepare("SELECT id, rating, wins, losses FROM players WHERE id = ?").bind(body.loserId).first<PlayerRow>(),
    ]);
    if (!winner || !loser) return Response.json({ error:"One of those people is no longer in the directory." }, { status:404 });
    const winnerExpected = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
    const loserExpected = 1 / (1 + Math.pow(10, (winner.rating - loser.rating) / 400));
    const winnerK = winner.wins + winner.losses === 0 ? 40 : 32;
    const loserK = loser.wins + loser.losses === 0 ? 40 : 32;
    const winnerAfter = Math.round(winner.rating + winnerK * (1 - winnerExpected));
    const loserAfter = Math.round(loser.rating - loserK * loserExpected);
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    await db.batch([
      db.prepare("UPDATE players SET rating = ?, wins = wins + 1 WHERE id = ?").bind(winnerAfter, winner.id),
      db.prepare("UPDATE players SET rating = ?, losses = losses + 1 WHERE id = ?").bind(loserAfter, loser.id),
      db.prepare("INSERT INTO games (id, winner_id, loser_id, winner_before, winner_after, loser_before, loser_after, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, winner.id, loser.id, winner.rating, winnerAfter, loser.rating, loserAfter, createdAt),
    ]);
    return Response.json({ game:{ id, createdAt, winnerAfter, loserAfter } }, { status:201 });
  } catch (error) {
    return Response.json({ error:error instanceof Error ? error.message : "Unable to record the game." }, { status:500 });
  }
}
