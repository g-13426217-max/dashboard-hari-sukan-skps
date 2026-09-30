ALTER TABLE `houses` ADD `logo_url` text;--> statement-breakpoint
ALTER TABLE `houses` ADD `is_active` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `participants` ADD `photo_key` text;--> statement-breakpoint
ALTER TABLE `participants` ADD `photo_updated_at` text;