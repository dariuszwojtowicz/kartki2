CREATE DATABASE IF NOT EXISTS `karteczki_db` DEFAULT CHARACTER SET utf8 COLLATE utf8_polish_ci;
USE `karteczki_db`;

CREATE TABLE `users` (
	`id` int NOT NULL AUTO_INCREMENT,
	`login` varchar(100) NOT NULL UNIQUE,
	`password` varchar(1000) NOT NULL,
	`rank` int NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `cardSets` (
	`id` int NOT NULL AUTO_INCREMENT,
	`name` varchar(100) NOT NULL UNIQUE,
	`description` varchar(1000) NOT NULL,
	`numberOfCards` int NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `userLevels` (
	`id` int NOT NULL AUTO_INCREMENT,
	`number` int NOT NULL,
	`cardSetId` int NULL,
	`userId` int NOT NULL,
	`isFinished` bool NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `cards` (
	`id` int NOT NULL AUTO_INCREMENT,
	`cardSetId` int NOT NULL,
	`imagePath` varchar(1000) NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `levelCards` (
	`id` int NOT NULL AUTO_INCREMENT,
	`userLevelId` int NOT NULL,
	`cardId` int NOT NULL,
	`count` int NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `notifications` (
	`id` int NOT NULL AUTO_INCREMENT,
	`message` varchar(1000) NOT NULL,
	`userId` int NOT NULL,
	PRIMARY KEY (`id`)
);

ALTER TABLE `userLevels` ADD CONSTRAINT `userLevels_cardSet_fk0` FOREIGN KEY (`cardSetId`) REFERENCES `cardSets`(`id`);

ALTER TABLE `userLevels` ADD CONSTRAINT `userLevels_user_fk1` FOREIGN KEY (`userId`) REFERENCES `users`(`id`);

ALTER TABLE `cards` ADD CONSTRAINT `cards_cardSet_fk0` FOREIGN KEY (`cardSetId`) REFERENCES `cardSets`(`id`);

ALTER TABLE `levelCards` ADD CONSTRAINT `levelCards_userLevel_fk0` FOREIGN KEY (`userLevelId`) REFERENCES `userLevels`(`id`);

ALTER TABLE `levelCards` ADD CONSTRAINT `levelCards_card_fk1` FOREIGN KEY (`cardId`) REFERENCES `cards`(`id`);

ALTER TABLE `notifications` ADD CONSTRAINT `notif_user_fk1` FOREIGN KEY (`userId`) REFERENCES `users`(`id`);

