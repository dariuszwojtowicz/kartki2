use karteczki_db;

DELETE FROM cards WHERE id >= 1;
DELETE FROM cardSets WHERE id >= 1;

ALTER TABLE `karteczki_db`.`cards` AUTO_INCREMENT = 1;
ALTER TABLE `karteczki_db`.`cardSets` AUTO_INCREMENT = 1;

INSERT INTO `karteczki_db`.`cardSets` (`id`, `name`, `description`, `numberOfCards`) VALUES (1, 'Kubuś Puchatek', 'Duuuużo miodu', 2);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (1, '/1_kubus_puchatek/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (1, '/1_kubus_puchatek/2.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(2,'Gumisie','Poczuj moc gumisiowego soku', 3);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (2, '/2_gumisie/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (2, '/2_gumisie/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (2, '/2_gumisie/3.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(3,'Muminki','Przyjdzie Buka i Cię zje!', 3);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (3, '/2_muminki/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (3, '/2_muminki/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (3, '/2_muminki/3.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(4,'Bolek i Lolek','Dwóch kumpli i ich przygody', 4);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (4, '/3_bolek_i_lolek/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (4, '/3_bolek_i_lolek/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (4, '/3_bolek_i_lolek/3.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (4, '/3_bolek_i_lolek/4.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(5,'Krecik','Czyli kto pod kim dołki kopie', 4);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (5, '/3_krecik/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (5, '/3_krecik/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (5, '/3_krecik/3.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (5, '/3_krecik/4.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(6,'Rumcajs','Chcesz dostać z żołędzia?', 4);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (6, '/3_rumcajs/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (6, '/3_rumcajs/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (6, '/3_rumcajs/3.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (6, '/3_rumcajs/4.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(7,'Zestaw_4_1','Level 4-1', 4);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (7, '/4_zestaw1/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (7, '/4_zestaw1/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (7, '/4_zestaw1/3.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (7, '/4_zestaw1/4.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(8,'Zestaw_4_2','Level 4-2', 4);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (8, '/4_zestaw2/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (8, '/4_zestaw2/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (8, '/4_zestaw2/3.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (8, '/4_zestaw2/4.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(9,'Zestaw_4_3','Level 4-3', 4);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (9, '/4_zestaw3/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (9, '/4_zestaw3/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (9, '/4_zestaw3/3.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (9, '/4_zestaw3/4.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(10,'Zestaw_5_1','Level 5-1', 4);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (10, '/5_zestaw1/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (10, '/5_zestaw1/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (10, '/5_zestaw1/3.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (10, '/5_zestaw1/4.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(11,'Zestaw_5_2','Level 5-2', 4);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (11, '/5_zestaw2/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (11, '/5_zestaw2/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (11, '/5_zestaw2/3.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (11, '/5_zestaw2/4.jpg');

INSERT INTO `karteczki_db`.`cardSets`(`id`,`name`,`description`,`numberOfCards`) VALUES(12,'Zestaw_5_3','Level 5-3', 4);

INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (12, '/5_zestaw3/1.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (12, '/5_zestaw3/2.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (12, '/5_zestaw3/3.jpg');
INSERT INTO `karteczki_db`.`cards` (`cardSetId`, `imagePath`) VALUES (12, '/5_zestaw3/4.jpg');