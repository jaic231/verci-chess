import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  image: text("image"),
  rating: integer("rating").notNull().default(1200),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_players_rating_wins").on(table.rating, table.wins)]);

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  winnerId: text("winner_id").notNull().references(() => players.id),
  loserId: text("loser_id").notNull().references(() => players.id),
  winnerBefore: integer("winner_before").notNull(),
  winnerAfter: integer("winner_after").notNull(),
  loserBefore: integer("loser_before").notNull(),
  loserAfter: integer("loser_after").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_games_created_at").on(table.createdAt)]);
