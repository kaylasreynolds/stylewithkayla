import { env } from "cloudflare:workers";
type RuntimeEnv = { DB?: D1Database; ADMIN_EMAILS?: string };
export function getD1() { const db = (env as unknown as RuntimeEnv).DB; if (!db) throw new Error("D1 binding DB is unavailable."); return db; }
export function getAdminEmails() { return new Set((((env as unknown as RuntimeEnv).ADMIN_EMAILS?.split(",")) ?? ["kaylasreynolds@gmail.com"]).map((v) => v.trim().toLowerCase()).filter(Boolean)); }
