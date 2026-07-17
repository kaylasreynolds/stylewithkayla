import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const runtimeEnv = env as unknown as { DB?: D1Database };

  if (!runtimeEnv.DB) {
throw new Error(
  "Cloudflare D1 binding `DB` is unavailable. Confirm that the `DB` binding is configured in wrangler.jsonc."
    );
  }

  return drizzle(runtimeEnv.DB, { schema });
}
