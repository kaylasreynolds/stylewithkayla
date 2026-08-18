import { env } from "cloudflare:workers";

type RuntimeEnv = {
  DB?: D1Database;
  PHOTO_ASSETS?: R2Bucket;
  ADMIN_EMAILS?: string;
  LOCAL_ADMIN_EMAIL?: string;
  MAINTENANCE_SECRET?: string;
  MICROSOFT_TENANT_ID?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  MICROSOFT_EVENT_MAILBOX?: string;
  EVENT_EMAIL_REPLY_TO?: string;
  APPOINTMENT_EMAIL_REPLY_TO?: string;
  APPOINTMENT_NOTIFICATION_TO?: string;
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

export function getEventEmailConfig() {
  const runtime = env as unknown as RuntimeEnv;
  const tenantId = runtime.MICROSOFT_TENANT_ID?.trim() ?? "";
  const clientId = runtime.MICROSOFT_CLIENT_ID?.trim() ?? "";
  const clientSecret = runtime.MICROSOFT_CLIENT_SECRET?.trim() ?? "";

  if (!tenantId || !clientId || !clientSecret) return null;

  return {
    tenantId,
    clientId,
    clientSecret,
    mailbox: runtime.MICROSOFT_EVENT_MAILBOX?.trim() || "kayla@stylewithkayla.com",
    replyTo: runtime.EVENT_EMAIL_REPLY_TO?.trim() || "kayla@stylewithkayla.com",
  };
}

export function getAppointmentEmailConfig() {
  const runtime = env as unknown as RuntimeEnv;
  const base = getEventEmailConfig();
  if (!base) return null;

  return {
    ...base,
    replyTo: runtime.APPOINTMENT_EMAIL_REPLY_TO?.trim() || "kayla.reynolds@macys.com",
    notificationTo: runtime.APPOINTMENT_NOTIFICATION_TO?.trim() || "kayla.reynolds@macys.com",
  };
}
