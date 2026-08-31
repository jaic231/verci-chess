import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "The Cloudflare D1 database binding `DB` is unavailable. Check wrangler.jsonc before starting the app."
    );
  }

  return drizzle(env.DB, { schema });
}
