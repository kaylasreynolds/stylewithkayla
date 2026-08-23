CREATE TABLE `appointment_recaps` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`client_id` text NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`outcome` text,
	`what_we_solved` text,
	`kayla_note` text,
	`next_moment_service_type` text,
	`next_moment_timing` text,
	`next_moment_reason` text,
	`next_moment_booking_cta_enabled` integer DEFAULT false NOT NULL,
	`private_follow_up_note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appointment_recaps_booking_unique` ON `appointment_recaps` (`booking_id`);--> statement-breakpoint
CREATE INDEX `appointment_recaps_client_idx` ON `appointment_recaps` (`client_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `appointment_recaps_status_idx` ON `appointment_recaps` (`status`);--> statement-breakpoint
CREATE TABLE `client_style_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`category` text NOT NULL,
	`normalized_label` text,
	`insight_text` text NOT NULL,
	`source_recap_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_confirmed_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`confidence` text,
	`internal_notes` text,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_recap_id`) REFERENCES `appointment_recaps`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `client_style_notes_client_idx` ON `client_style_notes` (`client_id`,`active`);--> statement-breakpoint
CREATE INDEX `client_style_notes_client_category_idx` ON `client_style_notes` (`client_id`,`category`);--> statement-breakpoint
CREATE TABLE `recap_formulas` (
	`id` text PRIMARY KEY NOT NULL,
	`recap_id` text NOT NULL,
	`formula_text` text NOT NULL,
	`explanation` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`recap_id`) REFERENCES `appointment_recaps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recap_formulas_recap_idx` ON `recap_formulas` (`recap_id`);--> statement-breakpoint
CREATE TABLE `recap_insights` (
	`id` text PRIMARY KEY NOT NULL,
	`recap_id` text NOT NULL,
	`polarity` text NOT NULL,
	`category` text NOT NULL,
	`insight_text` text NOT NULL,
	`client_facing` integer DEFAULT false NOT NULL,
	`importance` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`saved_to_client_notes` integer DEFAULT false NOT NULL,
	`client_style_note_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`recap_id`) REFERENCES `appointment_recaps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_style_note_id`) REFERENCES `client_style_notes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `recap_insights_recap_idx` ON `recap_insights` (`recap_id`,`polarity`);--> statement-breakpoint
CREATE TABLE `recap_items` (
	`id` text PRIMARY KEY NOT NULL,
	`recap_id` text NOT NULL,
	`item_name` text NOT NULL,
	`brand` text,
	`size` text,
	`color` text,
	`category` text,
	`note` text,
	`disposition` text NOT NULL,
	`client_facing` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`recap_id`) REFERENCES `appointment_recaps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recap_items_recap_idx` ON `recap_items` (`recap_id`);--> statement-breakpoint
CREATE TABLE `recap_priorities` (
	`id` text PRIMARY KEY NOT NULL,
	`recap_id` text NOT NULL,
	`category` text,
	`priority_text` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`rank` integer DEFAULT 0 NOT NULL,
	`client_facing` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`recap_id`) REFERENCES `appointment_recaps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recap_priorities_recap_idx` ON `recap_priorities` (`recap_id`,`rank`);--> statement-breakpoint
CREATE TABLE `recap_summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`recap_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`sent_at` integer,
	`recipient` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`recap_id`) REFERENCES `appointment_recaps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recap_summaries_recap_version_unique` ON `recap_summaries` (`recap_id`,`version`);--> statement-breakpoint
ALTER TABLE `private_access_tokens` ADD `recap_summary_id` text REFERENCES recap_summaries(id) ON DELETE cascade;
