CREATE TABLE IF NOT EXISTS `reschedule_requests` (
  `id` text PRIMARY KEY NOT NULL,
  `booking_id` text NOT NULL REFERENCES `bookings`(`id`) ON DELETE cascade,
  `requested_start_at` integer NOT NULL,
  `requested_end_at` integer NOT NULL,
  `note` text,
  `status` text DEFAULT 'pending' NOT NULL,
  `reviewed_by` text,
  `reviewed_at` integer,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `reschedule_requests_booking_status_idx` ON `reschedule_requests` (`booking_id`,`status`);
