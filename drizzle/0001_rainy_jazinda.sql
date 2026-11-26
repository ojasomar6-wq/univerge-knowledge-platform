CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`domainId` int NOT NULL,
	`level` enum('basic','intermediate','advanced') NOT NULL,
	`description` text NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 20,
	`questionCount` int NOT NULL DEFAULT 12,
	`competency` varchar(120) NOT NULL,
	`status` enum('draft','published') NOT NULL DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`accent` varchar(24) DEFAULT 'indigo',
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `domains_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `institutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`shortName` varchar(32) NOT NULL,
	`city` varchar(80) NOT NULL,
	`country` varchar(80) NOT NULL,
	`region` varchar(80) NOT NULL,
	`type` enum('university','college','institute') NOT NULL DEFAULT 'university',
	`studentCount` int NOT NULL DEFAULT 0,
	`status` enum('active','pending','invited') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `institutes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`instituteName` varchar(180) NOT NULL,
	`domain` varchar(100) NOT NULL,
	`sourceType` enum('syllabus','handbook','research','policy') NOT NULL DEFAULT 'handbook',
	`url` varchar(500),
	`excerpt` text NOT NULL,
	`embeddingRef` varchar(180),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledgeSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learnerProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`status` enum('started','completed') NOT NULL DEFAULT 'started',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learnerProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`prompt` text NOT NULL,
	`options` text NOT NULL,
	`correctIndex` int NOT NULL,
	`explanation` text NOT NULL,
	`sourceId` int,
	`difficulty` int NOT NULL DEFAULT 3,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
