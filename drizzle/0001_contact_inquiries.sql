CREATE TABLE IF NOT EXISTS contact_inquiries (
  id TEXT PRIMARY KEY NOT NULL,
  inquiry_type TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  normalized_email TEXT NOT NULL,
  phone TEXT,
  preferred_contact_method TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  notification_status TEXT NOT NULL DEFAULT 'pending',
  notification_message_id TEXT,
  notification_error TEXT,
  source_ip_hash TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS contact_inquiries_created_at_idx
  ON contact_inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS contact_inquiries_status_idx
  ON contact_inquiries(status, created_at DESC);

CREATE INDEX IF NOT EXISTS contact_inquiries_rate_limit_idx
  ON contact_inquiries(source_ip_hash, created_at DESC);
