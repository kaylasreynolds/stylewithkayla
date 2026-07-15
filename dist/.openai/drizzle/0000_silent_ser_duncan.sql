CREATE TABLE `availability_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `availability_overrides_range_idx` ON `availability_overrides` (`starts_at`,`ends_at`);--> statement-breakpoint
CREATE TABLE `availability_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`weekday` integer NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	`timezone` text DEFAULT 'America/Boise' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `availability_rules_window_unique` ON `availability_rules` (`weekday`,`start_minute`,`end_minute`);--> statement-breakpoint
CREATE TABLE `booking_holds` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`kind` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`override_conflict` integer DEFAULT false NOT NULL,
	`released_at` integer,
	`release_reason` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `booking_holds_active_range_idx` ON `booking_holds` (`active`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX `booking_holds_booking_idx` ON `booking_holds` (`booking_id`,`active`);--> statement-breakpoint
CREATE TABLE `booking_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`timezone` text DEFAULT 'America/Boise' NOT NULL,
	`minimum_notice_minutes` integer DEFAULT 1440 NOT NULL,
	`booking_horizon_days` integer DEFAULT 60 NOT NULL,
	`pending_overdue_minutes` integer DEFAULT 1440 NOT NULL,
	`calendar_conflict_check_enabled` integer DEFAULT false NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `booking_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text,
	`reason` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `booking_status_history_booking_idx` ON `booking_status_history` (`booking_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`public_reference` text NOT NULL,
	`client_id` text NOT NULL,
	`service_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_start_at` integer NOT NULL,
	`requested_end_at` integer NOT NULL,
	`proposed_start_at` integer,
	`proposed_end_at` integer,
	`confirmed_start_at` integer,
	`confirmed_end_at` integer,
	`returning_client` integer NOT NULL,
	`how_heard` text NOT NULL,
	`age_range` text,
	`profile_type` text,
	`event_type` text,
	`event_date` text,
	`booking_notes` text,
	`admin_notes` text,
	`privacy_policy_version` text NOT NULL,
	`privacy_acknowledged_at` integer NOT NULL,
	`pending_since` integer NOT NULL,
	`confirmed_at` integer,
	`declined_at` integer,
	`cancelled_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_public_reference_unique` ON `bookings` (`public_reference`);--> statement-breakpoint
CREATE INDEX `bookings_client_idx` ON `bookings` (`client_id`);--> statement-breakpoint
CREATE INDEX `bookings_status_pending_idx` ON `bookings` (`status`,`pending_since`);--> statement-breakpoint
CREATE INDEX `bookings_requested_range_idx` ON `bookings` (`requested_start_at`,`requested_end_at`);--> statement-breakpoint
CREATE INDEX `bookings_confirmed_range_idx` ON `bookings` (`confirmed_start_at`,`confirmed_end_at`);--> statement-breakpoint
CREATE TABLE `calendar_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`account_id` text NOT NULL,
	`calendar_id` text NOT NULL,
	`display_name` text,
	`credential_secret_ref` text NOT NULL,
	`permission_mode` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`subscription_id` text,
	`subscription_expires_at` integer,
	`last_reconciled_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`connection_id` text NOT NULL,
	`provider_event_id` text NOT NULL,
	`provider_etag` text,
	`sync_status` text NOT NULL,
	`last_synced_at` integer,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connection_id`) REFERENCES `calendar_connections`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_events_booking_unique` ON `calendar_events` (`booking_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_events_provider_unique` ON `calendar_events` (`connection_id`,`provider_event_id`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`normalized_email` text NOT NULL,
	`phone` text NOT NULL,
	`normalized_phone` text,
	`last_completed_appointment_at` integer,
	`retention_delete_after` integer,
	`deletion_requested_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_normalized_email_unique` ON `clients` (`normalized_email`);--> statement-breakpoint
CREATE INDEX `clients_normalized_phone_idx` ON `clients` (`normalized_phone`);--> statement-breakpoint
CREATE INDEX `clients_retention_delete_after_idx` ON `clients` (`retention_delete_after`);--> statement-breakpoint
CREATE TABLE `communications` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`channel` text NOT NULL,
	`template_key` text NOT NULL,
	`recipient` text NOT NULL,
	`status` text NOT NULL,
	`provider_message_id` text,
	`metadata` text,
	`sent_at` integer,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `communications_booking_idx` ON `communications` (`booking_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `data_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`request_details` text,
	`resolution_note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `data_requests_status_idx` ON `data_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `inspiration_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`delete_after` integer,
	`deleted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `style_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inspiration_assets_profile_unique` ON `inspiration_assets` (`profile_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `inspiration_assets_r2_key_unique` ON `inspiration_assets` (`r2_key`);--> statement-breakpoint
CREATE INDEX `inspiration_assets_delete_after_idx` ON `inspiration_assets` (`delete_after`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `private_access_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`profile_id` text,
	`purpose` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `style_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `private_access_tokens_hash_unique` ON `private_access_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `private_access_tokens_lookup_idx` ON `private_access_tokens` (`purpose`,`expires_at`,`revoked_at`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`audience` text NOT NULL,
	`name` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`routing_mode` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_code_unique` ON `services` (`code`);--> statement-breakpoint
CREATE TABLE `style_profile_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`revision_number` integer NOT NULL,
	`action` text NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text,
	`answers_snapshot` text NOT NULL,
	`changed_keys` text,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `style_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `style_profile_revisions_number_unique` ON `style_profile_revisions` (`profile_id`,`revision_number`);--> statement-breakpoint
CREATE TABLE `style_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`client_id` text NOT NULL,
	`profile_type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`schema_version` integer DEFAULT 1 NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`current_section` integer DEFAULT 1 NOT NULL,
	`inspiration_link` text,
	`prefilled_from_profile_id` text,
	`submitted_at` integer,
	`locked_at` integer,
	`reopened_at` integer,
	`retention_delete_after` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `style_profiles_booking_unique` ON `style_profiles` (`booking_id`);--> statement-breakpoint
CREATE INDEX `style_profiles_client_type_idx` ON `style_profiles` (`client_id`,`profile_type`);--> statement-breakpoint
CREATE INDEX `style_profiles_retention_delete_after_idx` ON `style_profiles` (`retention_delete_after`);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_holds_one_active_per_booking` ON `booking_holds` (`booking_id`) WHERE `active` = 1;
--> statement-breakpoint
INSERT INTO `booking_settings` (`id`) VALUES ('default');
--> statement-breakpoint
INSERT INTO `services` (`id`, `code`, `audience`, `name`, `duration_minutes`, `routing_mode`, `sort_order`) VALUES
  ('svc_women_event', 'women_event', 'women', 'Women''s Event & Occasion Styling', 60, 'womens_event', 10),
  ('svc_women_everyday', 'women_everyday', 'women', 'Women''s Everyday Styling', 90, 'age', 20),
  ('svc_women_closet', 'women_closet', 'women', 'Women''s Full Closet Refresh', 180, 'age', 30),
  ('svc_men_event', 'men_event', 'men', 'Men''s Event & Occasion Styling', 60, 'mens_event', 40),
  ('svc_men_everyday', 'men_everyday', 'men', 'Men''s Everyday Styling', 90, 'mens_styling', 50),
  ('svc_men_closet', 'men_closet', 'men', 'Men''s Full Closet Refresh', 180, 'mens_styling', 60);
--> statement-breakpoint
INSERT INTO `availability_rules` (`id`, `weekday`, `start_minute`, `end_minute`) VALUES
  ('rule_tue_am', 2, 630, 810),
  ('rule_tue_pm', 2, 870, 1050),
  ('rule_wed_am', 3, 630, 810),
  ('rule_wed_pm', 3, 870, 1050),
  ('rule_thu_am', 4, 630, 810),
  ('rule_thu_pm', 4, 870, 1050),
  ('rule_fri_am', 5, 630, 810),
  ('rule_fri_pm', 5, 870, 1050),
  ('rule_sat_am', 6, 630, 810),
  ('rule_sat_pm', 6, 870, 1050);
