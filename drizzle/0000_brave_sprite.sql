CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`items` text NOT NULL,
	`total` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
