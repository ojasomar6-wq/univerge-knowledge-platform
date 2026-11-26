CREATE TABLE `assessmentAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` int NOT NULL,
	`answers` text NOT NULL DEFAULT ('{}'),
	`score` int NOT NULL DEFAULT 0,
	`total` int NOT NULL DEFAULT 0,
	`status` enum('started','completed') NOT NULL DEFAULT 'started',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `assessmentAttempts_id` PRIMARY KEY(`id`)
);
