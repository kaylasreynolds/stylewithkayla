import { env } from "cloudflare:workers";

type RuntimeEnv = {
  DB?: D1Database;
  PHOTO_ASSETS?: R2Bucket;
  ADMIN_EMAILS?: string;
  LOCAL_ADMIN_EMAIL?: string;
  MAINTENANCE_SECRET?: string;
};

export function getD1() {
  const db = (env as unknown as RuntimeEnv).DB;
  if (!db) throw new Error("D1 binding DB is unavailable.");
  return db;
}

export function getPhotoAssetsBucket() {
  const bucket = (env as unknown as RuntimeEnv).PHOTO_ASSETS;
  if (!bucket) throw new Error("R2 binding PHOTO_ASSETS is unavailable.");
  return bucket;
}

export function getAdminEmails() {
  return new Set(
    ((env as unknown as RuntimeEnv).ADMIN_EMAILS?.split(",") ?? ["kaylasreynolds@gmail.com"])
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getLocalAdminEmail() {
  return (env as unknown as RuntimeEnv).LOCAL_ADMIN_EMAIL?.trim().toLowerCase() ?? null;
}

export function getMaintenanceSecret() {
  return (env as unknown as RuntimeEnv).MAINTENANCE_SECRET?.trim() ?? "";
}
