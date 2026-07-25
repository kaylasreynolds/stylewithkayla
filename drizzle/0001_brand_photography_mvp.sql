CREATE TABLE `photo_prompt_builds` (
  `id` text PRIMARY KEY NOT NULL,
  `scene_id` text NOT NULL,
  `scene_name` text NOT NULL,
  `module_selections` text NOT NULL,
  `assembled_prompt` text NOT NULL,
  `build_notes` text,
  `status` text DEFAULT 'draft' NOT NULL,
  `created_by` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `photo_prompt_builds_scene_idx` ON `photo_prompt_builds` (`scene_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `photo_process_images` (
  `id` text PRIMARY KEY NOT NULL,
  `prompt_build_id` text NOT NULL,
  `parent_process_image_id` text,
  `storage_key` text NOT NULL,
  `original_filename` text NOT NULL,
  `mime_type` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `attempt_number` integer DEFAULT 1 NOT NULL,
  `label` text,
  `notes` text,
  `status` text DEFAULT 'unreviewed' NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`prompt_build_id`) REFERENCES `photo_prompt_builds`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`parent_process_image_id`) REFERENCES `photo_process_images`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photo_process_images_storage_key_unique` ON `photo_process_images` (`storage_key`);
--> statement-breakpoint
CREATE INDEX `photo_process_images_prompt_idx` ON `photo_process_images` (`prompt_build_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `photo_reviews` (
  `id` text PRIMARY KEY NOT NULL,
  `process_image_id` text NOT NULL,
  `results` text NOT NULL,
  `what_works` text,
  `corrections_needed` text,
  `refinement_instruction` text,
  `decision` text NOT NULL,
  `reviewed_by` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`process_image_id`) REFERENCES `photo_process_images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photo_reviews_process_unique` ON `photo_reviews` (`process_image_id`);
--> statement-breakpoint
CREATE TABLE `photo_assets` (
  `id` text PRIMARY KEY NOT NULL,
  `scene_id` text NOT NULL,
  `prompt_build_id` text NOT NULL,
  `source_process_image_id` text,
  `name` text NOT NULL,
  `storage_key` text NOT NULL,
  `original_filename` text NOT NULL,
  `mime_type` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `width` integer,
  `height` integer,
  `orientation` text NOT NULL,
  `approval_status` text DEFAULT 'approved' NOT NULL,
  `approved_uses` text DEFAULT '[]' NOT NULL,
  `final_notes` text,
  `created_by` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`prompt_build_id`) REFERENCES `photo_prompt_builds`(`id`) ON UPDATE no action ON DELETE restrict,
  FOREIGN KEY (`source_process_image_id`) REFERENCES `photo_process_images`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photo_assets_storage_key_unique` ON `photo_assets` (`storage_key`);
--> statement-breakpoint
CREATE INDEX `photo_assets_scene_idx` ON `photo_assets` (`scene_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `photo_assets_status_idx` ON `photo_assets` (`approval_status`,`created_at`);
