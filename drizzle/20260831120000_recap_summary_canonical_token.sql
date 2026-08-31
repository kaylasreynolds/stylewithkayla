PRAGMA foreign_keys=OFF;--> statement-breakpoint
ALTER TABLE `private_access_tokens` RENAME TO `private_access_tokens_legacy`;--> statement-breakpoint
CREATE TABLE `private_access_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`profile_id` text,
	`purpose` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer,
	`used_at` integer,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`recap_summary_id` text,
	`token_ciphertext` text,
	`token_iv` text,
	`token_auth_tag` text,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `style_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recap_summary_id`) REFERENCES `recap_summaries`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `private_access_tokens` (`id`,`booking_id`,`profile_id`,`purpose`,`token_hash`,`expires_at`,`used_at`,`revoked_at`,`created_at`,`recap_summary_id`)
SELECT `id`,`booking_id`,`profile_id`,`purpose`,`token_hash`,`expires_at`,`used_at`,`revoked_at`,`created_at`,`recap_summary_id` FROM `private_access_tokens_legacy`;--> statement-breakpoint
DROP TABLE `private_access_tokens_legacy`;--> statement-breakpoint
CREATE UNIQUE INDEX `private_access_tokens_hash_unique` ON `private_access_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `private_access_tokens_lookup_idx` ON `private_access_tokens` (`purpose`,`expires_at`,`revoked_at`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
