-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: hotel_pms
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `access_token`
--

DROP TABLE IF EXISTS `access_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `access_token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `user_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `expired` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `expires_at` datetime DEFAULT NULL,
  `datetime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `access_token`
--

LOCK TABLES `access_token` WRITE;
/*!40000 ALTER TABLE `access_token` DISABLE KEYS */;
INSERT INTO `access_token` VALUES (1,'aec00655296ba086aa50dda09f784dbd9b9212b98707116a8274709691411dab8b8191ac8ebc6c4f','USR000000','1','2026-08-21 08:00:01',NULL),(2,'35c0e3ea22a7f777865221469af0433fd2231ac69e76e4108fb47a57c4493d40d957c3467a6532b5','USR000000','1','2026-08-19 02:55:31',NULL),(3,'95dab043f861e63979cbeb3b393e85b2254d22ae16daca97b2df3f5b539c39c1849daa478bad8b0b','USR000000','1','2026-08-25 05:03:53',NULL),(4,'62e2857cb4979f9b9d916487391562db630f1a6f3f8a06a020abb272245977da34c69a617a32c296','USR000000','1','2026-08-19 05:27:52',NULL),(5,'001b7d377fa46a2c92c98b973631f1990458f7e632187adfeff9c87b3c8dec08e2b5cff9a9f5d8a8','USR000000','1','2026-08-20 02:05:17',NULL),(6,'507bdabcfc279422e3fdaaf2bce715298bdd485828319c1e7c90593f2db15d1ff4de38cc55f785a0','USR000000','1','2026-08-20 02:06:37',NULL),(7,'e5ba3eb5eadbc2b5756dacc7a46921c11d3e3765594114b1c8fca9359c27fbddd19b2b1f1e6cfce3','USR000000','1','2026-08-20 19:51:35',NULL),(8,'a026910de11337094ef54c8be3dafbaf7e9f91c1fc85464845c8cdfab8927c946ccb9057fa6a97f0','USR000000','1','2026-08-20 19:52:06',NULL),(9,'b5c07a15b889cdba4f73646754193947a0b84bb5a1e21bc371ca38d1ebb9b5973ae666a4ab314d23','USR000000','1','2026-08-25 02:12:44',NULL),(10,'9b59ef915f69d4727107718e679740fc0dcf4992d22bc9ca27dbc78546aa5f2bb0e832505fd4b866','USR000000','1','2026-08-25 02:20:50',NULL),(11,'85f3e7ad8cd1778e938d02a31ce38935128262081f973f11386add77cb6f3139397524722da44b71','USR000000','1','2026-08-25 02:21:05',NULL),(12,'b895c87608ca1e9ebaa8c1bc588968dd17581fb3e0489b9c8d0a526f41dc237e53d5d74823b3cbc8','USR000000','1','2026-08-27 08:59:53',NULL),(13,'42b74794c6764e84cd7bd6bc6d06cf361ea4a3f3d7b19cac4f8e6b39dfd7e1cd41c85e6227de3201','USR000000','1','2026-08-28 02:08:11',NULL),(14,'ce6039939a8c21d097a794782432742d91416fc16aed8adf4bc6c70bef29490529bec72e181eebb4','USR000000','1','2026-08-28 02:26:45',NULL),(15,'5ac9c0e9d90f61af1be44936a37eaac85c6ec5faee55c5fba3caea9adf2e5a66ed8e63c58877f759','USR000000','1','2026-08-28 02:31:46',NULL),(16,'b8b8d8d53963fd54c198f5fa16118c67bfa684b23176c4793cf2dd1632e31920ab583c175c757bcb','USR000000','1','2026-08-28 02:47:28',NULL),(17,'5fac4afe88df123b6911a33fe109126137a0f25eca950a0156980f3efca1db6eee1dc0af885d3701','USR000000','1','2026-08-28 03:03:59',NULL),(18,'be65f8a697c7c0c0aad4370b93264fbaeb977cfbec57fd4ccbdaa80b96836b8fa7bcd1406ff707ca','USR000000','1','2026-08-28 03:05:04',NULL),(19,'419e201c0068d8584604fd063eb45975e49ab48d02b3edf3ec071e0331fb040ba8e6b82a0b53277e','USR000000','1','2026-08-28 03:26:03',NULL),(20,'9830906ee0b87287d896baf4a5decc01f5e07ede6d7766d40a13416f40a0af19c33a7828374299f6','USR000000','1','2026-08-28 03:26:38',NULL),(21,'695c600ec739a739d08b27276b6bbd4a2f39d57b69ef9a9394c6075f5a862c90f3efc7c91312c997','USR000000','1','2026-08-28 03:30:51',NULL),(22,'5c5332519d9d8a0ea13d24fe221cf156af3bcb3e8c15acb3f53e6a2a06c28ac4f4e8a76f65f6dcb8','USR0001','0','2026-08-28 03:35:43',NULL),(23,'cbb3419c3f76017a318cba7e7012c1ba2131ab1434cf2f01313950c1ee7d80febf8fd8c8732be1cd','USR000000','1','2026-08-28 03:36:07',NULL),(24,'b59d8d5de6293924a5c775fab6c6a4b2e25e11f3af32d4db11b84c33ef8419ca228f2f1d9bc39f66','USR000000','1','2026-08-28 04:21:46',NULL),(25,'6325d12d6878c47e63e306b530dc57741872776be3bb4e6bbf83731ad627caa42bad48d5e0381086','USR000000','1','2026-08-28 06:12:49',NULL),(26,'d1fe1f00de844b44228e0b74529cb384f4b43933b003bb743cdc75e45896d63f2859a4ebf9f346fa','USR000000','1','2026-08-29 02:41:40',NULL),(27,'b1718ff8bf43beb46fe946b72c819462f971853f53f93f02792551338fc5e4b4481cc67ca71da8af','USR000000','1','2026-08-29 03:22:05',NULL),(28,'55250a8012767ad9bc76693844e35e97f57352db0fc82f9da57e285169f07f62f97dbf2a53066dc6','USR000000','1','2026-08-29 04:09:07',NULL),(29,'99d9201fbf1214fbf533bb305ecf5b370f74f1dc7ee168e0f11b8448f29ac084cfca37ca6fdfc199','USR000000','1','2026-09-01 06:37:09',NULL),(30,'34f87a9a4977599cd8235fb65752d74187beeae51a502e4b6f37a7588faec14234bce071f0ee7489','USR000000','1','2026-09-01 06:45:38',NULL),(31,'46cb7aedd9b87051e65bd07b7508f4d2cff5774e87b9aa1ce2e24834614d778c5bf7769efc831fe9','USR000000','1','2026-09-03 02:09:53',NULL),(32,'dccafb8d48115409efa1b0cfc9ba8db206b219a6ff62d04a5b565d32cb2b802588deb3de5f75872f','USR000000','0','2026-09-03 02:11:14',NULL);
/*!40000 ALTER TABLE `access_token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `keterangan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tz` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config`
--

LOCK TABLES `config` WRITE;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;
INSERT INTO `config` VALUES (51,'msNamaPerusahaan','Hotel Grand Marstech','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50'),(52,'msSubNamaPerusahaan','Marstech Group','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50'),(53,'msAlamatPerusahaan','Jl. Teknologi No. 1, Jakarta','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50'),(54,'msKotaPerusahaan','Jakarta','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50'),(55,'msTeleponPerusahaan','021-1234567','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50'),(56,'msNamaPimpinan','Direktur Utama','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50'),(57,'msLogoPerusahaan','','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50'),(58,'msCatatanKasir','Terima kasih atas kunjungan Anda','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50'),(59,'msPPN','11','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50'),(60,'nominalPoint','10000','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50'),(61,'msVideoDisplay','','Asia/Jakarta','2026-09-02 02:51:50','2026-09-02 02:51:50');
/*!40000 ALTER TABLE `config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_amenity`
--

DROP TABLE IF EXISTS `mst_amenity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_amenity` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_amenity` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_amenity`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_amenity`
--

LOCK TABLES `mst_amenity` WRITE;
/*!40000 ALTER TABLE `mst_amenity` DISABLE KEYS */;
INSERT INTO `mst_amenity` VALUES (28,'AMN-001','Free WiFi','pi pi-wifi',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(29,'AMN-002','Air Conditioning','pi pi-box',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(30,'AMN-003','Minibar','pi pi-wallet',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1);
/*!40000 ALTER TABLE `mst_amenity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_bed_type`
--

DROP TABLE IF EXISTS `mst_bed_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_bed_type` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_bed_type` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_bed_type`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_bed_type`
--

LOCK TABLES `mst_bed_type` WRITE;
/*!40000 ALTER TABLE `mst_bed_type` DISABLE KEYS */;
INSERT INTO `mst_bed_type` VALUES (27,'BTY-001','Single Bed',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(28,'BTY-002','Double Bed',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(29,'BTY-003','King Bed',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1);
/*!40000 ALTER TABLE `mst_bed_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_cabang`
--

DROP TABLE IF EXISTS `mst_cabang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_cabang` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `nama_hotel` varchar(150) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `alamat` text,
  `telepon` varchar(30) DEFAULT NULL,
  `waktu_checkin` time NOT NULL DEFAULT '14:00:00',
  `waktu_checkout` time NOT NULL DEFAULT '12:00:00',
  `zona_waktu` varchar(50) NOT NULL DEFAULT 'Asia/Jakarta',
  `is_pkp` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_cabang`),
  UNIQUE KEY `uq_hotel_tenant_code` (`kode_cabang`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_cabang`
--

LOCK TABLES `mst_cabang` WRITE;
/*!40000 ALTER TABLE `mst_cabang` DISABLE KEYS */;
INSERT INTO `mst_cabang` VALUES (22,'HTL-001','Hotel Grand Marstech',NULL,NULL,NULL,'14:00:00','12:00:00','Asia/Jakarta',1,NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1);
/*!40000 ALTER TABLE `mst_cabang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_cashier_counter`
--

DROP TABLE IF EXISTS `mst_cashier_counter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_cashier_counter` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_counter` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_counter`),
  UNIQUE KEY `uq_counter` (`kode_cabang`,`kode_counter`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_cashier_counter`
--

LOCK TABLES `mst_cashier_counter` WRITE;
/*!40000 ALTER TABLE `mst_cashier_counter` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_cashier_counter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_channel_rate_mapping`
--

DROP TABLE IF EXISTS `mst_channel_rate_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_channel_rate_mapping` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_mapping` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_rate_plan` varchar(50) NOT NULL,
  `channel` enum('booking_com','agoda','traveloka','expedia','airbnb') NOT NULL,
  `channel_rate_plan_id` varchar(100) NOT NULL,
  `is_sync_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `last_synced_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_mapping`),
  KEY `fk_channel_map_hotel` (`kode_cabang`),
  KEY `fk_channel_map_rate_plan` (`kode_rate_plan`),
  CONSTRAINT `fk_channel_map_rate_plan` FOREIGN KEY (`kode_rate_plan`) REFERENCES `mst_paket_harga` (`kode_paket_harga`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_channel_rate_mapping`
--

LOCK TABLES `mst_channel_rate_mapping` WRITE;
/*!40000 ALTER TABLE `mst_channel_rate_mapping` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_channel_rate_mapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_corporate_account`
--

DROP TABLE IF EXISTS `mst_corporate_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_corporate_account` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_corporate` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `account_type` enum('corporate','travel_agent','ota') NOT NULL,
  `npwp` varchar(30) DEFAULT NULL,
  `billing_address` text,
  `payment_term_days` int NOT NULL DEFAULT '30',
  `commission_pct` decimal(5,2) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(30) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_corporate`),
  UNIQUE KEY `uq_corp_account` (`kode_cabang`,`kode_corporate`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_corporate_account`
--

LOCK TABLES `mst_corporate_account` WRITE;
/*!40000 ALTER TABLE `mst_corporate_account` DISABLE KEYS */;
INSERT INTO `mst_corporate_account` VALUES (1,'CBG8575','COR0001','Test Corp Upd','travel_agent',NULL,NULL,30,NULL,NULL,NULL,NULL,1,'2026-08-19 03:54:58',7,'2026-09-02 02:48:35',7,'2026-09-02 02:48:35',0),(2,'CBG6867','COR0002','Test Corp Upd','travel_agent',NULL,NULL,30,NULL,NULL,NULL,NULL,1,'2026-08-19 03:55:47',7,'2026-09-02 02:48:35',7,'2026-09-02 02:48:35',0),(3,'CBG9221','COR0003','Test Corp Upd','travel_agent',NULL,NULL,30,NULL,NULL,NULL,NULL,1,'2026-08-19 03:56:29',1,'2026-08-19 03:56:29',1,'2026-08-19 03:56:29',0),(4,'CBG1463','COR0004','Test Corp Upd','travel_agent',NULL,NULL,30,NULL,NULL,NULL,NULL,1,'2026-08-19 03:57:21',1,'2026-08-19 03:57:21',1,'2026-08-19 03:57:21',0),(5,'CBG2857','COR0005','Test Corp Upd','travel_agent',NULL,NULL,30,NULL,NULL,NULL,NULL,1,'2026-08-19 03:57:53',1,'2026-08-19 03:57:53',1,'2026-08-19 03:57:53',0),(6,'CBG1380','COR0006','Test Corp Upd','travel_agent',NULL,NULL,30,NULL,NULL,NULL,NULL,1,'2026-08-19 03:58:31',1,'2026-08-19 03:58:31',1,'2026-08-19 03:58:31',0);
/*!40000 ALTER TABLE `mst_corporate_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_currency_rate`
--

DROP TABLE IF EXISTS `mst_currency_rate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_currency_rate` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_currency_rate` varchar(50) NOT NULL,
  `from_currency` varchar(10) NOT NULL,
  `to_currency` varchar(10) NOT NULL,
  `rate` decimal(18,6) NOT NULL,
  `effective_date` date NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_currency_rate` (`from_currency`,`to_currency`,`effective_date`),
  UNIQUE KEY `uq_kode` (`kode_currency_rate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_currency_rate`
--

LOCK TABLES `mst_currency_rate` WRITE;
/*!40000 ALTER TABLE `mst_currency_rate` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_currency_rate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_document_type`
--

DROP TABLE IF EXISTS `mst_document_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_document_type` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_document_type` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_document_type`
--

LOCK TABLES `mst_document_type` WRITE;
/*!40000 ALTER TABLE `mst_document_type` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_document_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_fasilitas`
--

DROP TABLE IF EXISTS `mst_fasilitas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_fasilitas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_fasilitas` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_fasilitas`),
  UNIQUE KEY `uq_fasilitas` (`kode_cabang`,`kode_fasilitas`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_fasilitas`
--

LOCK TABLES `mst_fasilitas` WRITE;
/*!40000 ALTER TABLE `mst_fasilitas` DISABLE KEYS */;
INSERT INTO `mst_fasilitas` VALUES (19,'HTL-001','FAS-001','Kolam Renang',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(20,'HTL-001','FAS-002','Gym',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(21,'HTL-001','FAS-003','Spa',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1);
/*!40000 ALTER TABLE `mst_fasilitas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_fiscal_document_setup`
--

DROP TABLE IF EXISTS `mst_fiscal_document_setup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_fiscal_document_setup` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_fiscal_setup` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `doc_type` enum('invoice','receipt','tax_invoice','credit_note','debit_note') NOT NULL,
  `prefix` varchar(20) NOT NULL,
  `running_number` bigint unsigned NOT NULL DEFAULT '0',
  `reset_period` enum('never','yearly','monthly') NOT NULL DEFAULT 'yearly',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_fiscal_setup`),
  UNIQUE KEY `uq_fiscal_setup` (`kode_cabang`,`doc_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_fiscal_document_setup`
--

LOCK TABLES `mst_fiscal_document_setup` WRITE;
/*!40000 ALTER TABLE `mst_fiscal_document_setup` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_fiscal_document_setup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_gedung`
--

DROP TABLE IF EXISTS `mst_gedung`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_gedung` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_gedung` varchar(50) NOT NULL,
  `nama_gedung` varchar(100) NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_gedung`),
  UNIQUE KEY `uq_building` (`kode_cabang`,`kode_gedung`),
  CONSTRAINT `fk_building_hotel` FOREIGN KEY (`kode_cabang`) REFERENCES `mst_cabang` (`kode_cabang`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_gedung`
--

LOCK TABLES `mst_gedung` WRITE;
/*!40000 ALTER TABLE `mst_gedung` DISABLE KEYS */;
INSERT INTO `mst_gedung` VALUES (33,'HTL-001','GDG-001','Tower A',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(34,'HTL-001','GDG-002','Tower B',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1);
/*!40000 ALTER TABLE `mst_gedung` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_guest`
--

DROP TABLE IF EXISTS `mst_guest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_guest` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_tamu` varchar(50) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `id_type` enum('ktp','passport','sim','other') NOT NULL DEFAULT 'ktp',
  `id_number` varchar(50) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `is_vip` tinyint(1) NOT NULL DEFAULT '0',
  `is_blacklisted` tinyint(1) NOT NULL DEFAULT '0',
  `blacklist_reason` varchar(255) DEFAULT NULL,
  `total_stay` int NOT NULL DEFAULT '0',
  `total_spending` decimal(16,2) NOT NULL DEFAULT '0.00',
  `kode_favorite_room_type` varchar(50) DEFAULT NULL,
  `ref_crm_customer_id` bigint unsigned DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_tamu`),
  UNIQUE KEY `uq_guest_hotel_code` (`kode_cabang`,`kode_tamu`),
  KEY `idx_guest_tenant_lookup` (`id_number`,`phone`),
  KEY `fk_guest_fav_room_type` (`kode_favorite_room_type`),
  CONSTRAINT `fk_guest_fav_room_type` FOREIGN KEY (`kode_favorite_room_type`) REFERENCES `mst_tipe_kamar` (`kode_tipe_kamar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_guest`
--

LOCK TABLES `mst_guest` WRITE;
/*!40000 ALTER TABLE `mst_guest` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_guest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_harga_ruang_event`
--

DROP TABLE IF EXISTS `mst_harga_ruang_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_harga_ruang_event` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kode_harga_ruang_event` varchar(255) NOT NULL,
  `kode_ruang_event` varchar(255) NOT NULL,
  `tipe_sewa` enum('per_jam','half_day','full_day') NOT NULL,
  `kode_musim` varchar(255) DEFAULT NULL,
  `harga` decimal(18,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode_harga_ruang_event` (`kode_harga_ruang_event`),
  KEY `fk_hre_ruang` (`kode_ruang_event`),
  CONSTRAINT `fk_hre_ruang` FOREIGN KEY (`kode_ruang_event`) REFERENCES `mst_ruang_event` (`kode_ruang_event`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_harga_ruang_event`
--

LOCK TABLES `mst_harga_ruang_event` WRITE;
/*!40000 ALTER TABLE `mst_harga_ruang_event` DISABLE KEYS */;
INSERT INTO `mst_harga_ruang_event` VALUES (1,'HRG0001','RUA0001','half_day','SEA0002',700000.00,'2026-08-27 04:37:27','7','2026-08-27 06:13:44','7',NULL,NULL,1);
/*!40000 ALTER TABLE `mst_harga_ruang_event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_holiday`
--

DROP TABLE IF EXISTS `mst_holiday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_holiday` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_holiday` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `holiday_date` date NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_long_weekend` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_holiday`),
  UNIQUE KEY `uq_holiday` (`kode_cabang`,`holiday_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_holiday`
--

LOCK TABLES `mst_holiday` WRITE;
/*!40000 ALTER TABLE `mst_holiday` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_holiday` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_kamar`
--

DROP TABLE IF EXISTS `mst_kamar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_kamar` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_gedung` varchar(50) DEFAULT NULL,
  `kode_lantai` varchar(50) NOT NULL,
  `kode_tipe_kamar` varchar(50) NOT NULL,
  `kode_kamar` varchar(50) NOT NULL,
  `nomor_kamar` varchar(20) NOT NULL,
  `tipe_pemandangan` varchar(50) DEFAULT NULL,
  `catatan` text,
  `boleh_merokok` tinyint(1) NOT NULL DEFAULT '0',
  `occupancy_status` enum('vacant','occupied','blocked') NOT NULL DEFAULT 'vacant',
  `housekeeping_status` enum('clean','dirty','inspection','maintenance') NOT NULL DEFAULT 'clean',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_kamar`),
  UNIQUE KEY `uq_room` (`kode_cabang`,`kode_kamar`),
  KEY `fk_room_floor` (`kode_lantai`),
  KEY `fk_room_room_type` (`kode_tipe_kamar`),
  CONSTRAINT `fk_room_floor` FOREIGN KEY (`kode_lantai`) REFERENCES `mst_lantai` (`kode_lantai`),
  CONSTRAINT `fk_room_hotel` FOREIGN KEY (`kode_cabang`) REFERENCES `mst_cabang` (`kode_cabang`),
  CONSTRAINT `fk_room_room_type` FOREIGN KEY (`kode_tipe_kamar`) REFERENCES `mst_tipe_kamar` (`kode_tipe_kamar`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_kamar`
--

LOCK TABLES `mst_kamar` WRITE;
/*!40000 ALTER TABLE `mst_kamar` DISABLE KEYS */;
INSERT INTO `mst_kamar` VALUES (51,'HTL-001','GDG-001','LNT-001','TYP-001','KMR-101','101','city',NULL,0,'vacant','clean',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(52,'HTL-001','GDG-001','LNT-001','TYP-001','KMR-102','102','garden',NULL,0,'vacant','clean',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(53,'HTL-001','GDG-001','LNT-001','TYP-002','KMR-103','103','pool',NULL,0,'vacant','clean',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(54,'HTL-001','GDG-001','LNT-002','TYP-002','KMR-201','201','city',NULL,0,'vacant','clean',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(55,'HTL-001','GDG-001','LNT-002','TYP-003','KMR-202','202','pool',NULL,0,'vacant','dirty',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(56,'HTL-001','GDG-002','LNT-003','TYP-001','KMR-301','B-301','city',NULL,0,'vacant','clean',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(57,'HTL-001','GDG-002','LNT-003','TYP-002','KMR-302','B-302','garden',NULL,0,'vacant','clean',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(58,'HTL-001','GDG-002','LNT-003','TYP-003','KMR-303','B-303','pool',NULL,0,'vacant','maintenance',NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1);
/*!40000 ALTER TABLE `mst_kamar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_lantai`
--

DROP TABLE IF EXISTS `mst_lantai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_lantai` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_gedung` varchar(50) NOT NULL,
  `kode_lantai` varchar(50) NOT NULL,
  `nama_lantai` varchar(100) NOT NULL,
  `nomor_lantai` int NOT NULL DEFAULT '1',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_lantai`),
  UNIQUE KEY `uq_floor` (`kode_gedung`,`kode_lantai`),
  CONSTRAINT `fk_floor_building` FOREIGN KEY (`kode_gedung`) REFERENCES `mst_gedung` (`kode_gedung`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_lantai`
--

LOCK TABLES `mst_lantai` WRITE;
/*!40000 ALTER TABLE `mst_lantai` DISABLE KEYS */;
INSERT INTO `mst_lantai` VALUES (36,'GDG-001','LNT-001','Lantai 1 Tower A',1,NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(37,'GDG-001','LNT-002','Lantai 2 Tower A',2,NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1),(38,'GDG-002','LNT-003','Lantai 1 Tower B',1,NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1);
/*!40000 ALTER TABLE `mst_lantai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_musim`
--

DROP TABLE IF EXISTS `mst_musim`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_musim` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_musim` varchar(50) NOT NULL,
  `nama_musim` varchar(50) NOT NULL,
  `tanggal_mulai` date DEFAULT NULL,
  `tanggal_selesai` date DEFAULT NULL,
  `hari_berlaku` varchar(150) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_musim`),
  UNIQUE KEY `uq_season` (`kode_cabang`,`kode_musim`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_musim`
--

LOCK TABLES `mst_musim` WRITE;
/*!40000 ALTER TABLE `mst_musim` DISABLE KEYS */;
INSERT INTO `mst_musim` VALUES (1,'CAB0002','SEA0001','High Season 2026','2026-01-01','2026-12-31','Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu',1,'2026-08-19 03:54:59',7,'2026-08-24 02:14:08',NULL,NULL,1),(2,'CAB0003','SEA0002','Peak Season 2026','2026-01-01','2026-12-31','Senin, Selasa, Rabu, Kamis',1,'2026-08-19 03:55:47',7,'2026-08-24 02:14:33',NULL,NULL,1),(3,'CBG9221','SEA0003','Test Musim Upd','2026-01-01','2026-12-31','1,2,3,4,5,6,7',1,'2026-08-19 03:56:29',1,'2026-08-19 03:56:29',1,'2026-08-19 03:56:29',0),(4,'CBG1463','SEA0004','Test Musim Upd','2026-01-01','2026-12-31','1,2,3,4,5,6,7',1,'2026-08-19 03:57:21',1,'2026-08-19 03:57:21',1,'2026-08-19 03:57:21',0),(5,'CBG2857','SEA0005','Test Musim Upd','2026-01-01','2026-12-31','1,2,3,4,5,6,7',1,'2026-08-19 03:57:53',1,'2026-08-19 03:57:53',1,'2026-08-19 03:57:53',0),(6,'CBG1380','SEA0006','Test Musim Upd','2026-01-01','2026-12-31','1,2,3,4,5,6,7',1,'2026-08-19 03:58:31',1,'2026-08-19 03:58:31',1,'2026-08-19 03:58:31',0),(7,'CAB0002','SEA0007','Peak Season 2026','2026-08-24','2026-08-31','Senin, Selasa, Rabu, Kamis',7,'2026-08-24 02:13:50',7,'2026-08-24 02:14:19',NULL,NULL,1);
/*!40000 ALTER TABLE `mst_musim` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_navigation`
--

DROP TABLE IF EXISTS `mst_navigation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_navigation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `menu` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tz` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_navigation`
--

LOCK TABLES `mst_navigation` WRITE;
/*!40000 ALTER TABLE `mst_navigation` DISABLE KEYS */;
INSERT INTO `mst_navigation` VALUES (7,'[{\"label\":\"Utama\",\"items\":[{\"label\":\"Dashboard\",\"icon\":\"pi pi-fw pi-home\",\"to\":\"/dashboard\"}]},{\"label\":\"MASTER & SETUP CABANG\",\"icon\":\"pi pi-fw pi-cog\",\"items\":[{\"label\":\"Data Master Hotel\",\"icon\":\"pi pi-fw pi-building\",\"items\":[{\"label\":\"Master Cabang\",\"icon\":\"pi pi-fw pi-building\",\"to\":\"/master_cabang\"},{\"label\":\"Master Gedung\",\"icon\":\"pi pi-fw pi-th-large\",\"to\":\"/master_gedung\"},{\"label\":\"Master Lantai\",\"icon\":\"pi pi-fw pi-bars\",\"to\":\"/master_lantai\"},{\"label\":\"Corporate / Travel Agent\",\"icon\":\"pi pi-fw pi-briefcase\",\"to\":\"/master_corporate\"},{\"label\":\"Pajak & Service Charge\",\"icon\":\"pi pi-fw pi-percentage\",\"to\":\"/master_pajak\"}]},{\"label\":\"Kamar & Fasilitas\",\"icon\":\"pi pi-fw pi-home\",\"items\":[{\"label\":\"Tipe Kamar\",\"icon\":\"pi pi-fw pi-tag\",\"to\":\"/master_tipe_kamar\"},{\"label\":\"Master Kamar\",\"icon\":\"pi pi-fw pi-home\",\"to\":\"/master_kamar\"},{\"label\":\"Bed Type\",\"icon\":\"pi pi-fw pi-inbox\",\"to\":\"/master_bed_type\"},{\"label\":\"Fasilitas & Amenity\",\"icon\":\"pi pi-fw pi-star\",\"to\":\"/master_amenity\"},{\"label\":\"Master Fasilitas\",\"icon\":\"pi pi-fw pi-verified\",\"to\":\"/master_fasilitas\"}]},{\"label\":\"Ruang Event\",\"icon\":\"pi pi-fw pi-ticket\",\"items\":[{\"label\":\"Tipe Ruang Event\",\"icon\":\"pi pi-fw pi-tags\",\"to\":\"/master_tipe_ruang_event\"},{\"label\":\"Master Ruang Event\",\"icon\":\"pi pi-fw pi-ticket\",\"to\":\"/master_ruang_event\"},{\"label\":\"Harga Ruang Event\",\"icon\":\"pi pi-fw pi-money-bill\",\"to\":\"/master_harga_ruang_event\"}]},{\"label\":\"Harga & Season\",\"icon\":\"pi pi-fw pi-dollar\",\"items\":[{\"label\":\"Rate Plan (Paket Harga)\",\"icon\":\"pi pi-fw pi-dollar\",\"to\":\"/master_rate_plan\"},{\"label\":\"Master Harga Kamar\",\"icon\":\"pi pi-fw pi-money-bill\",\"to\":\"/master_rate_plan_price\"},{\"label\":\"Season & Pricing\",\"icon\":\"pi pi-fw pi-calendar\",\"to\":\"/master_season\"}]},{\"label\":\"Konfigurasi Sistem\",\"icon\":\"pi pi-fw pi-sliders-h\",\"items\":[{\"label\":\"User & Role Management\",\"icon\":\"pi pi-fw pi-users\",\"to\":\"/setup/users\"},{\"label\":\"Master Navigasi\",\"icon\":\"pi pi-fw pi-sitemap\",\"to\":\"/setup/navigation\"},{\"label\":\"Konfigurasi Perusahaan\",\"icon\":\"pi pi-fw pi-sliders-h\",\"to\":\"/setup/config\"}]}]},{\"label\":\"Contoh & Template\",\"icon\":\"pi pi-fw pi-bookmark\",\"items\":[{\"label\":\"Contoh Form Upload\",\"icon\":\"pi pi-fw pi-upload\",\"to\":\"/contoh_form_upload\"},{\"label\":\"Contoh Laporan\",\"icon\":\"pi pi-fw pi-file\",\"to\":\"/contoh_laporan\"},{\"label\":\"Contoh Popup\",\"icon\":\"pi pi-fw pi-window-maximize\",\"to\":\"/contoh_popup\"},{\"label\":\"Contoh Tabview\",\"icon\":\"pi pi-fw pi-folder\",\"to\":\"/contoh_tabview\"},{\"label\":\"Contoh Trx Cetak Nota\",\"icon\":\"pi pi-fw pi-print\",\"to\":\"/contoh_trx_cetak_nota\"}]}]','superadmin','Asia/Jakarta','2026-08-14 07:31:36','2026-09-02 02:51:50'),(10,'[{\"label\":\"Utama\",\"items\":[{\"label\":\"Dashboard\",\"icon\":\"pi pi-fw pi-home\",\"to\":\"/dashboard\"}]},{\"label\":\"MASTER & SETUP CABANG\",\"icon\":\"pi pi-fw pi-cog\",\"items\":[{\"label\":\"Data Master Hotel\",\"icon\":\"pi pi-fw pi-building\",\"items\":[{\"label\":\"Master Cabang\",\"icon\":\"pi pi-fw pi-building\",\"to\":\"/master_cabang\"},{\"label\":\"Master Gedung\",\"icon\":\"pi pi-fw pi-th-large\",\"to\":\"/master_gedung\"},{\"label\":\"Master Lantai\",\"icon\":\"pi pi-fw pi-bars\",\"to\":\"/master_lantai\"},{\"label\":\"Corporate / Travel Agent\",\"icon\":\"pi pi-fw pi-briefcase\",\"to\":\"/master_corporate\"},{\"label\":\"Pajak & Service Charge\",\"icon\":\"pi pi-fw pi-percentage\",\"to\":\"/master_pajak\"}]},{\"label\":\"Kamar & Fasilitas\",\"icon\":\"pi pi-fw pi-home\",\"items\":[{\"label\":\"Tipe Kamar\",\"icon\":\"pi pi-fw pi-tag\",\"to\":\"/master_tipe_kamar\"},{\"label\":\"Master Kamar\",\"icon\":\"pi pi-fw pi-home\",\"to\":\"/master_kamar\"},{\"label\":\"Bed Type\",\"icon\":\"pi pi-fw pi-inbox\",\"to\":\"/master_bed_type\"},{\"label\":\"Fasilitas & Amenity\",\"icon\":\"pi pi-fw pi-star\",\"to\":\"/master_amenity\"},{\"label\":\"Master Fasilitas\",\"icon\":\"pi pi-fw pi-verified\",\"to\":\"/master_fasilitas\"}]},{\"label\":\"Ruang Event\",\"icon\":\"pi pi-fw pi-ticket\",\"items\":[{\"label\":\"Tipe Ruang Event\",\"icon\":\"pi pi-fw pi-tags\",\"to\":\"/master_tipe_ruang_event\"},{\"label\":\"Master Ruang Event\",\"icon\":\"pi pi-fw pi-ticket\",\"to\":\"/master_ruang_event\"},{\"label\":\"Harga Ruang Event\",\"icon\":\"pi pi-fw pi-money-bill\",\"to\":\"/master_harga_ruang_event\"}]},{\"label\":\"Harga & Season\",\"icon\":\"pi pi-fw pi-dollar\",\"items\":[{\"label\":\"Rate Plan (Paket Harga)\",\"icon\":\"pi pi-fw pi-dollar\",\"to\":\"/master_rate_plan\"},{\"label\":\"Master Harga Kamar\",\"icon\":\"pi pi-fw pi-money-bill\",\"to\":\"/master_rate_plan_price\"},{\"label\":\"Season & Pricing\",\"icon\":\"pi pi-fw pi-calendar\",\"to\":\"/master_season\"}]},{\"label\":\"Konfigurasi Sistem\",\"icon\":\"pi pi-fw pi-sliders-h\",\"items\":[{\"label\":\"User & Role Management\",\"icon\":\"pi pi-fw pi-users\",\"to\":\"/setup/users\"},{\"label\":\"Master Navigasi\",\"icon\":\"pi pi-fw pi-sitemap\",\"to\":\"/setup/navigation\"},{\"label\":\"Konfigurasi Perusahaan\",\"icon\":\"pi pi-fw pi-sliders-h\",\"to\":\"/setup/config\"}]}]},{\"label\":\"Contoh & Template\",\"icon\":\"pi pi-fw pi-bookmark\",\"items\":[{\"label\":\"Contoh Form Upload\",\"icon\":\"pi pi-fw pi-upload\",\"to\":\"/contoh_form_upload\"},{\"label\":\"Contoh Laporan\",\"icon\":\"pi pi-fw pi-file\",\"to\":\"/contoh_laporan\"},{\"label\":\"Contoh Popup\",\"icon\":\"pi pi-fw pi-window-maximize\",\"to\":\"/contoh_popup\"},{\"label\":\"Contoh Tabview\",\"icon\":\"pi pi-fw pi-folder\",\"to\":\"/contoh_tabview\"},{\"label\":\"Contoh Trx Cetak Nota\",\"icon\":\"pi pi-fw pi-print\",\"to\":\"/contoh_trx_cetak_nota\"}]}]','admin','Asia/Jakarta','2026-08-27 03:30:14','2026-09-02 02:51:50'),(11,'[{\"label\":\"Utama\",\"items\":[{\"label\":\"Dashboard\",\"icon\":\"pi pi-fw pi-home\",\"to\":\"/dashboard\"}]},{\"label\":\"MASTER & SETUP CABANG\",\"icon\":\"pi pi-fw pi-cog\",\"items\":[{\"label\":\"Data Master Hotel\",\"icon\":\"pi pi-fw pi-building\",\"items\":[{\"label\":\"Master Cabang\",\"icon\":\"pi pi-fw pi-building\",\"to\":\"/master_cabang\"},{\"label\":\"Master Gedung\",\"icon\":\"pi pi-fw pi-th-large\",\"to\":\"/master_gedung\"},{\"label\":\"Master Lantai\",\"icon\":\"pi pi-fw pi-bars\",\"to\":\"/master_lantai\"},{\"label\":\"Corporate / Travel Agent\",\"icon\":\"pi pi-fw pi-briefcase\",\"to\":\"/master_corporate\"},{\"label\":\"Pajak & Service Charge\",\"icon\":\"pi pi-fw pi-percentage\",\"to\":\"/master_pajak\"}]},{\"label\":\"Kamar & Fasilitas\",\"icon\":\"pi pi-fw pi-home\",\"items\":[{\"label\":\"Tipe Kamar\",\"icon\":\"pi pi-fw pi-tag\",\"to\":\"/master_tipe_kamar\"},{\"label\":\"Master Kamar\",\"icon\":\"pi pi-fw pi-home\",\"to\":\"/master_kamar\"},{\"label\":\"Bed Type\",\"icon\":\"pi pi-fw pi-inbox\",\"to\":\"/master_bed_type\"},{\"label\":\"Fasilitas & Amenity\",\"icon\":\"pi pi-fw pi-star\",\"to\":\"/master_amenity\"},{\"label\":\"Master Fasilitas\",\"icon\":\"pi pi-fw pi-verified\",\"to\":\"/master_fasilitas\"}]},{\"label\":\"Ruang Event\",\"icon\":\"pi pi-fw pi-ticket\",\"items\":[{\"label\":\"Tipe Ruang Event\",\"icon\":\"pi pi-fw pi-tags\",\"to\":\"/master_tipe_ruang_event\"},{\"label\":\"Master Ruang Event\",\"icon\":\"pi pi-fw pi-ticket\",\"to\":\"/master_ruang_event\"},{\"label\":\"Harga Ruang Event\",\"icon\":\"pi pi-fw pi-money-bill\",\"to\":\"/master_harga_ruang_event\"}]},{\"label\":\"Harga & Season\",\"icon\":\"pi pi-fw pi-dollar\",\"items\":[{\"label\":\"Rate Plan (Paket Harga)\",\"icon\":\"pi pi-fw pi-dollar\",\"to\":\"/master_rate_plan\"},{\"label\":\"Master Harga Kamar\",\"icon\":\"pi pi-fw pi-money-bill\",\"to\":\"/master_rate_plan_price\"},{\"label\":\"Season & Pricing\",\"icon\":\"pi pi-fw pi-calendar\",\"to\":\"/master_season\"}]},{\"label\":\"Konfigurasi Sistem\",\"icon\":\"pi pi-fw pi-sliders-h\",\"items\":[{\"label\":\"User & Role Management\",\"icon\":\"pi pi-fw pi-users\",\"to\":\"/setup/users\"},{\"label\":\"Master Navigasi\",\"icon\":\"pi pi-fw pi-sitemap\",\"to\":\"/setup/navigation\"},{\"label\":\"Konfigurasi Perusahaan\",\"icon\":\"pi pi-fw pi-sliders-h\",\"to\":\"/setup/config\"}]}]},{\"label\":\"Contoh & Template\",\"icon\":\"pi pi-fw pi-bookmark\",\"items\":[{\"label\":\"Contoh Form Upload\",\"icon\":\"pi pi-fw pi-upload\",\"to\":\"/contoh_form_upload\"},{\"label\":\"Contoh Laporan\",\"icon\":\"pi pi-fw pi-file\",\"to\":\"/contoh_laporan\"},{\"label\":\"Contoh Popup\",\"icon\":\"pi pi-fw pi-window-maximize\",\"to\":\"/contoh_popup\"},{\"label\":\"Contoh Tabview\",\"icon\":\"pi pi-fw pi-folder\",\"to\":\"/contoh_tabview\"},{\"label\":\"Contoh Trx Cetak Nota\",\"icon\":\"pi pi-fw pi-print\",\"to\":\"/contoh_trx_cetak_nota\"}]}]','master','UTC','2026-08-31 07:38:45','2026-09-02 02:51:50');
/*!40000 ALTER TABLE `mst_navigation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_notification_setup`
--

DROP TABLE IF EXISTS `mst_notification_setup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_notification_setup` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_notif_setup` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `event_code` varchar(50) NOT NULL,
  `channel` enum('email','whatsapp','push') NOT NULL,
  `template` text,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_notif_setup`),
  UNIQUE KEY `uq_notif_setup` (`kode_cabang`,`event_code`,`channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_notification_setup`
--

LOCK TABLES `mst_notification_setup` WRITE;
/*!40000 ALTER TABLE `mst_notification_setup` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_notification_setup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_paket_harga`
--

DROP TABLE IF EXISTS `mst_paket_harga`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_paket_harga` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_template` varchar(50) DEFAULT NULL,
  `kode_paket_harga` varchar(50) NOT NULL,
  `nama_paket` varchar(100) NOT NULL,
  `tipe_paket` varchar(50) NOT NULL DEFAULT 'RO',
  `dapat_di_refund` tinyint(1) NOT NULL DEFAULT '1',
  `termasuk_sarapan` tinyint(1) NOT NULL DEFAULT '0',
  `minimal_malam` int NOT NULL DEFAULT '1',
  `maksimal_malam` int DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `tipe_markup` enum('nominal','persen') NOT NULL DEFAULT 'nominal',
  `nilai_markup` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_paket_harga`),
  UNIQUE KEY `uq_rate_plan` (`kode_cabang`,`kode_paket_harga`),
  KEY `fk_rate_plan_template` (`kode_template`),
  CONSTRAINT `fk_rate_plan_template` FOREIGN KEY (`kode_template`) REFERENCES `mst_rate_plan_template` (`kode_harga_template`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_paket_harga`
--

LOCK TABLES `mst_paket_harga` WRITE;
/*!40000 ALTER TABLE `mst_paket_harga` DISABLE KEYS */;
INSERT INTO `mst_paket_harga` VALUES (20,'HTL-001',NULL,'RP-001','Room Only (RO)','RO',1,0,1,NULL,NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1,'nominal',0.00),(21,'HTL-001',NULL,'RP-002','Bed & Breakfast (BB)','BB',1,1,1,NULL,NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1,'nominal',150000.00),(22,'HTL-001',NULL,'RP-003','Corporate Package','BB',0,1,2,NULL,NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1,'persen',10.00);
/*!40000 ALTER TABLE `mst_paket_harga` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_rate_plan_price`
--

DROP TABLE IF EXISTS `mst_rate_plan_price`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_rate_plan_price` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_harga_price` varchar(50) NOT NULL,
  `kode_tipe_kamar` varchar(50) NOT NULL,
  `kode_rate_plan` varchar(50) NOT NULL,
  `kode_season` varchar(50) DEFAULT NULL,
  `price` decimal(14,2) NOT NULL,
  `extra_bed_price` decimal(14,2) DEFAULT NULL,
  `valid_from` date NOT NULL,
  `valid_to` date DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_harga_price`),
  KEY `fk_rpp_rate_plan` (`kode_rate_plan`),
  KEY `fk_rpp_season` (`kode_season`),
  KEY `idx_rpp_lookup` (`kode_tipe_kamar`,`kode_rate_plan`,`valid_from`,`valid_to`),
  CONSTRAINT `fk_rpp_rate_plan` FOREIGN KEY (`kode_rate_plan`) REFERENCES `mst_paket_harga` (`kode_paket_harga`),
  CONSTRAINT `fk_rpp_room_type` FOREIGN KEY (`kode_tipe_kamar`) REFERENCES `mst_tipe_kamar` (`kode_tipe_kamar`),
  CONSTRAINT `fk_rpp_season` FOREIGN KEY (`kode_season`) REFERENCES `mst_musim` (`kode_musim`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_rate_plan_price`
--

LOCK TABLES `mst_rate_plan_price` WRITE;
/*!40000 ALTER TABLE `mst_rate_plan_price` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_rate_plan_price` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_rate_plan_template`
--

DROP TABLE IF EXISTS `mst_rate_plan_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_rate_plan_template` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_harga_template` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `plan_type` enum('bar','promo','corporate','ota','travel_agent') NOT NULL DEFAULT 'bar',
  `dapat_di_refund` tinyint(1) NOT NULL DEFAULT '1',
  `include_breakfast` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_harga_template`),
  UNIQUE KEY `uq_rate_template` (`kode_harga_template`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_rate_plan_template`
--

LOCK TABLES `mst_rate_plan_template` WRITE;
/*!40000 ALTER TABLE `mst_rate_plan_template` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_rate_plan_template` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_room_block`
--

DROP TABLE IF EXISTS `mst_room_block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_room_block` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_room_block` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `block_code` varchar(30) NOT NULL,
  `block_name` varchar(150) NOT NULL,
  `kode_corporate_account` varchar(50) DEFAULT NULL,
  `block_date_from` date NOT NULL,
  `block_date_to` date NOT NULL,
  `total_rooms_blocked` int NOT NULL DEFAULT '0',
  `rooming_list_deadline` date DEFAULT NULL,
  `status` enum('tentative','confirmed','released','cancelled') NOT NULL DEFAULT 'tentative',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_room_block`),
  UNIQUE KEY `uq_room_block` (`kode_cabang`,`block_code`),
  KEY `fk_room_block_corp` (`kode_corporate_account`),
  CONSTRAINT `fk_room_block_corp` FOREIGN KEY (`kode_corporate_account`) REFERENCES `mst_corporate_account` (`kode_corporate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_room_block`
--

LOCK TABLES `mst_room_block` WRITE;
/*!40000 ALTER TABLE `mst_room_block` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_room_block` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_room_type_amenity`
--

DROP TABLE IF EXISTS `mst_room_type_amenity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_room_type_amenity` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_rta` varchar(50) NOT NULL,
  `kode_tipe_kamar` varchar(50) NOT NULL,
  `kode_amenity` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_rta`),
  UNIQUE KEY `uq_rt_amenity` (`kode_tipe_kamar`,`kode_amenity`),
  KEY `fk_rta_amenity` (`kode_amenity`),
  CONSTRAINT `fk_rta_amenity` FOREIGN KEY (`kode_amenity`) REFERENCES `mst_amenity` (`kode_amenity`),
  CONSTRAINT `fk_rta_room_type` FOREIGN KEY (`kode_tipe_kamar`) REFERENCES `mst_tipe_kamar` (`kode_tipe_kamar`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_room_type_amenity`
--

LOCK TABLES `mst_room_type_amenity` WRITE;
/*!40000 ALTER TABLE `mst_room_type_amenity` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_room_type_amenity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_room_type_fasilitas`
--

DROP TABLE IF EXISTS `mst_room_type_fasilitas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_room_type_fasilitas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kode_tipe_kamar` varchar(255) NOT NULL,
  `kode_fasilitas` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_rtf_tipe_kamar` (`kode_tipe_kamar`),
  KEY `fk_rtf_fasilitas` (`kode_fasilitas`),
  CONSTRAINT `fk_rtf_fasilitas` FOREIGN KEY (`kode_fasilitas`) REFERENCES `mst_fasilitas` (`kode_fasilitas`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rtf_tipe_kamar` FOREIGN KEY (`kode_tipe_kamar`) REFERENCES `mst_tipe_kamar` (`kode_tipe_kamar`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_room_type_fasilitas`
--

LOCK TABLES `mst_room_type_fasilitas` WRITE;
/*!40000 ALTER TABLE `mst_room_type_fasilitas` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_room_type_fasilitas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_ruang_event`
--

DROP TABLE IF EXISTS `mst_ruang_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_ruang_event` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kode_ruang_event` varchar(255) NOT NULL,
  `kode_cabang` varchar(255) NOT NULL,
  `kode_gedung` varchar(100) DEFAULT NULL,
  `kode_lantai` varchar(100) DEFAULT NULL,
  `kode_tipe_ruang_event` varchar(255) NOT NULL,
  `nama_ruang` varchar(255) NOT NULL,
  `kapasitas_orang` int DEFAULT NULL,
  `luas_sqm` int DEFAULT NULL,
  `layout_support` text,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode_ruang_event` (`kode_ruang_event`),
  KEY `fk_re_cabang` (`kode_cabang`),
  KEY `fk_re_tipe` (`kode_tipe_ruang_event`),
  CONSTRAINT `fk_re_cabang` FOREIGN KEY (`kode_cabang`) REFERENCES `mst_cabang` (`kode_cabang`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_re_tipe` FOREIGN KEY (`kode_tipe_ruang_event`) REFERENCES `mst_tipe_ruang_event` (`kode_tipe_ruang_event`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_ruang_event`
--

LOCK TABLES `mst_ruang_event` WRITE;
/*!40000 ALTER TABLE `mst_ruang_event` DISABLE KEYS */;
INSERT INTO `mst_ruang_event` VALUES (1,'RUA0001','CAB0002','GED0014','LAN0008','TIP0001','Ballroom 1',20,80,'Theater','2026-08-27 04:15:25','7','2026-08-27 04:16:02','7',NULL,NULL,1);
/*!40000 ALTER TABLE `mst_ruang_event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_ruang_event_fasilitas`
--

DROP TABLE IF EXISTS `mst_ruang_event_fasilitas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_ruang_event_fasilitas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kode_ruang_event` varchar(255) NOT NULL,
  `kode_fasilitas` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ref_ruang` (`kode_ruang_event`),
  KEY `fk_ref_fasilitas` (`kode_fasilitas`),
  CONSTRAINT `fk_ref_fasilitas` FOREIGN KEY (`kode_fasilitas`) REFERENCES `mst_fasilitas` (`kode_fasilitas`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ref_ruang` FOREIGN KEY (`kode_ruang_event`) REFERENCES `mst_ruang_event` (`kode_ruang_event`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_ruang_event_fasilitas`
--

LOCK TABLES `mst_ruang_event_fasilitas` WRITE;
/*!40000 ALTER TABLE `mst_ruang_event_fasilitas` DISABLE KEYS */;
INSERT INTO `mst_ruang_event_fasilitas` VALUES (1,'RUA0001','FAS-003','2026-08-27 04:26:43','7');
/*!40000 ALTER TABLE `mst_ruang_event_fasilitas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_tax`
--

DROP TABLE IF EXISTS `mst_tax`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_tax` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_pajak` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `tax_type` enum('tax','service_charge') NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `is_compounding` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_pajak`),
  UNIQUE KEY `uq_tax` (`kode_cabang`,`kode_pajak`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_tax`
--

LOCK TABLES `mst_tax` WRITE;
/*!40000 ALTER TABLE `mst_tax` DISABLE KEYS */;
INSERT INTO `mst_tax` VALUES (1,'CBG2857','PAJ0001','Test Pajak Upd','tax',11.00,0,1,'2026-08-19 03:57:53',1,'2026-08-19 03:57:53',1,'2026-08-19 03:57:53',0),(2,'CBG1380','PAJ0002','Test Pajak Upd','tax',11.00,0,1,'2026-08-19 03:58:31',1,'2026-08-19 03:58:31',1,'2026-08-19 03:58:31',0);
/*!40000 ALTER TABLE `mst_tax` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_tipe_kamar`
--

DROP TABLE IF EXISTS `mst_tipe_kamar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_tipe_kamar` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_tipe_kamar` varchar(50) NOT NULL,
  `nama_tipe` varchar(100) NOT NULL,
  `kapasitas_dasar` int NOT NULL DEFAULT '2',
  `kapasitas_maksimal` int NOT NULL DEFAULT '2',
  `kapasitas_ekstra` int NOT NULL DEFAULT '0',
  `harga_default` decimal(15,2) DEFAULT NULL,
  `luas_sqm` decimal(6,2) DEFAULT NULL,
  `deskripsi` text,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `kode_bed_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_tipe_kamar`),
  UNIQUE KEY `uq_room_type` (`kode_cabang`,`kode_tipe_kamar`),
  KEY `fk_tipe_kamar_bed` (`kode_bed_type`),
  CONSTRAINT `fk_room_type_hotel` FOREIGN KEY (`kode_cabang`) REFERENCES `mst_cabang` (`kode_cabang`),
  CONSTRAINT `fk_tipe_kamar_bed` FOREIGN KEY (`kode_bed_type`) REFERENCES `mst_bed_type` (`kode_bed_type`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_tipe_kamar`
--

LOCK TABLES `mst_tipe_kamar` WRITE;
/*!40000 ALTER TABLE `mst_tipe_kamar` DISABLE KEYS */;
INSERT INTO `mst_tipe_kamar` VALUES (29,'HTL-001','TYP-001','Standard Room',2,3,0,NULL,24.00,NULL,NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1,NULL),(30,'HTL-001','TYP-002','Deluxe Room',2,4,0,NULL,32.00,NULL,NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1,NULL),(31,'HTL-001','TYP-003','Suite Room',2,4,0,NULL,64.00,NULL,NULL,'2026-09-02 02:51:50',NULL,'2026-09-02 02:51:50',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `mst_tipe_kamar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_tipe_ruang_event`
--

DROP TABLE IF EXISTS `mst_tipe_ruang_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_tipe_ruang_event` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kode_tipe_ruang_event` varchar(255) NOT NULL,
  `nama_tipe` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode_tipe_ruang_event` (`kode_tipe_ruang_event`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_tipe_ruang_event`
--

LOCK TABLES `mst_tipe_ruang_event` WRITE;
/*!40000 ALTER TABLE `mst_tipe_ruang_event` DISABLE KEYS */;
INSERT INTO `mst_tipe_ruang_event` VALUES (1,'TIP0001','Ballroom','2026-08-27 04:12:00','7','2026-08-27 04:12:00',NULL,NULL,NULL,1),(2,'TIP0002','Meeting Room','2026-08-27 04:14:42','7','2026-08-27 04:14:42',NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `mst_tipe_ruang_event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_user`
--

DROP TABLE IF EXISTS `mst_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_code` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fullname` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('0','1') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `tz` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_user_code` (`user_code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_user`
--

LOCK TABLES `mst_user` WRITE;
/*!40000 ALTER TABLE `mst_user` DISABLE KEYS */;
INSERT INTO `mst_user` VALUES (7,'USR000000','superadmin@admin.com','Superadmin','08100000000','superadmin','5e7bd870d5c8563803be2973dd4403ef50c918d3b728f22787c9514d0f379f94d7f6bbb7e8b0a8cc338a6a18bd399aa8e5888a28b5f91452ad55fd6e2cf0b58c','1','UTC','2026-08-14 07:31:36',NULL,NULL,'2026-09-02 02:51:51'),(8,'USR0001','abidrafiul9@gmail.com','Abid Rafiul','082338909501','admin','94d7065b7bfc1cd80e8f525864d89dcad03e084473c3dcad78e15fb3530d6a4cfcab0fab18109159b56330fdb47a699bd6a9910b3dd4a0b9306a8cf4f5516f76','1','Asia/Jakarta','2026-08-27 03:35:26','superadmin@admin.com',NULL,'2026-08-27 03:35:26');
/*!40000 ALTER TABLE `mst_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_voucher`
--

DROP TABLE IF EXISTS `mst_voucher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_voucher` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_voucher` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(14,2) NOT NULL,
  `valid_from` date NOT NULL,
  `valid_to` date NOT NULL,
  `usage_limit` int DEFAULT NULL,
  `used_count` int NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_voucher`),
  UNIQUE KEY `uq_voucher` (`kode_cabang`,`kode_voucher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_voucher`
--

LOCK TABLES `mst_voucher` WRITE;
/*!40000 ALTER TABLE `mst_voucher` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_voucher` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_format_penomoran`
--

DROP TABLE IF EXISTS `sys_format_penomoran`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_format_penomoran` (
  `kode_format` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_tabel` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefix` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `panjang_digit` int NOT NULL DEFAULT '4',
  `nomor_terakhir` bigint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`kode_format`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_format_penomoran`
--

LOCK TABLES `sys_format_penomoran` WRITE;
/*!40000 ALTER TABLE `sys_format_penomoran` DISABLE KEYS */;
INSERT INTO `sys_format_penomoran` VALUES ('FMT-AMENITY','mst_amenity','AME',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-BEDTYPE','mst_bedtype','BED',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-CABANG','mst_cabang','CAB',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-CORPORATE','mst_corporate','COR',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-GEDUNG','mst_gedung','GED',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-HARGAKAMAR','mst_hargakamar','HAR',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-HRGRUANGEVENT','mst_hrgruangevent','HRG',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-KAMAR','mst_kamar','KAM',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-LANTAI','mst_lantai','LAN',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-PAJAK','mst_pajak','PAJ',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-RATEPLAN','mst_rateplan','RAT',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-RTA','mst_rta','RTA',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-RUANGEVENT','mst_ruangevent','RUA',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-SEASON','mst_season','SEA',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-TIPEKAMAR','mst_tipekamar','TIP',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-TIPERUANGEVENT','mst_tiperuangevent','TIP',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50'),('FMT-USR','mst_usr','USR',4,0,1,'2026-09-02 02:51:50','2026-09-02 02:51:50');
/*!40000 ALTER TABLE `sys_format_penomoran` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_audit_log`
--

DROP TABLE IF EXISTS `trx_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_audit_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_audit_log` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `table_name` varchar(64) NOT NULL,
  `record_id` bigint unsigned NOT NULL,
  `action` enum('insert','update','delete') NOT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_audit_log`),
  KEY `idx_audit_table_record` (`table_name`,`record_id`),
  KEY `fk_audit_hotel` (`kode_cabang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_audit_log`
--

LOCK TABLES `trx_audit_log` WRITE;
/*!40000 ALTER TABLE `trx_audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_cashier_shift`
--

DROP TABLE IF EXISTS `trx_cashier_shift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_cashier_shift` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cashier_shift` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_cashier_counter` varchar(50) NOT NULL,
  `user_id` bigint NOT NULL,
  `opening_cash` decimal(14,2) NOT NULL DEFAULT '0.00',
  `closing_cash` decimal(14,2) DEFAULT NULL,
  `system_cash` decimal(14,2) DEFAULT NULL,
  `cash_difference` decimal(14,2) DEFAULT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `opened_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_cashier_shift`),
  KEY `fk_shift_hotel` (`kode_cabang`),
  KEY `fk_shift_counter` (`kode_cashier_counter`),
  KEY `fk_shift_user` (`user_id`),
  CONSTRAINT `fk_shift_counter` FOREIGN KEY (`kode_cashier_counter`) REFERENCES `mst_cashier_counter` (`kode_counter`),
  CONSTRAINT `fk_shift_user` FOREIGN KEY (`user_id`) REFERENCES `mst_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_cashier_shift`
--

LOCK TABLES `trx_cashier_shift` WRITE;
/*!40000 ALTER TABLE `trx_cashier_shift` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_cashier_shift` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_checkin`
--

DROP TABLE IF EXISTS `trx_checkin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_checkin` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_checkin` varchar(50) NOT NULL,
  `kode_reservation_room` varchar(50) NOT NULL,
  `id_scan_url` varchar(255) DEFAULT NULL,
  `vehicle_plate` varchar(20) DEFAULT NULL,
  `checkin_by` bigint unsigned DEFAULT NULL,
  `checkin_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `early_checkin` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_checkin`),
  KEY `fk_checkin_res_room` (`kode_reservation_room`),
  CONSTRAINT `fk_checkin_res_room` FOREIGN KEY (`kode_reservation_room`) REFERENCES `trx_reservation_room` (`kode_reservasi_room`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_checkin`
--

LOCK TABLES `trx_checkin` WRITE;
/*!40000 ALTER TABLE `trx_checkin` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_checkin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_checkout`
--

DROP TABLE IF EXISTS `trx_checkout`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_checkout` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_checkout` varchar(50) NOT NULL,
  `kode_reservation_room` varchar(50) NOT NULL,
  `late_checkout` tinyint(1) NOT NULL DEFAULT '0',
  `grand_total` decimal(16,2) NOT NULL DEFAULT '0.00',
  `checkout_by` bigint unsigned DEFAULT NULL,
  `checkout_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_checkout`),
  KEY `fk_checkout_res_room` (`kode_reservation_room`),
  CONSTRAINT `fk_checkout_res_room` FOREIGN KEY (`kode_reservation_room`) REFERENCES `trx_reservation_room` (`kode_reservasi_room`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_checkout`
--

LOCK TABLES `trx_checkout` WRITE;
/*!40000 ALTER TABLE `trx_checkout` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_checkout` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_extend_stay`
--

DROP TABLE IF EXISTS `trx_extend_stay`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_extend_stay` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_extend_stay` varchar(50) NOT NULL,
  `kode_reservation_room` varchar(50) NOT NULL,
  `additional_nights` int NOT NULL,
  `new_checkout_date` date NOT NULL,
  `requested_by` bigint unsigned DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_extend_stay`),
  KEY `fk_extend_res_room` (`kode_reservation_room`),
  CONSTRAINT `fk_extend_res_room` FOREIGN KEY (`kode_reservation_room`) REFERENCES `trx_reservation_room` (`kode_reservasi_room`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_extend_stay`
--

LOCK TABLES `trx_extend_stay` WRITE;
/*!40000 ALTER TABLE `trx_extend_stay` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_extend_stay` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_fiscal_document`
--

DROP TABLE IF EXISTS `trx_fiscal_document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_fiscal_document` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_fiscal_document` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_folio` varchar(50) NOT NULL,
  `doc_type` enum('invoice','receipt','tax_invoice','credit_note','debit_note') NOT NULL,
  `doc_number` varchar(50) NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `issued_by` bigint unsigned DEFAULT NULL,
  `issued_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pdf_url` varchar(255) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_fiscal_document`),
  UNIQUE KEY `uq_fiscal_doc` (`kode_cabang`,`doc_number`),
  KEY `fk_fiscal_doc_folio` (`kode_folio`),
  CONSTRAINT `fk_fiscal_doc_folio` FOREIGN KEY (`kode_folio`) REFERENCES `trx_folio` (`kode_folio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_fiscal_document`
--

LOCK TABLES `trx_fiscal_document` WRITE;
/*!40000 ALTER TABLE `trx_fiscal_document` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_fiscal_document` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_folio`
--

DROP TABLE IF EXISTS `trx_folio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_folio` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_folio` varchar(50) NOT NULL,
  `kode_reservation` varchar(50) NOT NULL,
  `folio_owner_type` enum('guest','corporate','travel_agent') NOT NULL DEFAULT 'guest',
  `kode_corporate_account` varchar(50) DEFAULT NULL,
  `status` enum('open','closed','void') NOT NULL DEFAULT 'open',
  `subtotal` decimal(16,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(16,2) NOT NULL DEFAULT '0.00',
  `service_charge_amount` decimal(16,2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(16,2) NOT NULL DEFAULT '0.00',
  `closed_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_folio`),
  UNIQUE KEY `uq_folio` (`kode_cabang`,`kode_folio`),
  KEY `fk_folio_reservation` (`kode_reservation`),
  KEY `fk_folio_corp` (`kode_corporate_account`),
  CONSTRAINT `fk_folio_corp` FOREIGN KEY (`kode_corporate_account`) REFERENCES `mst_corporate_account` (`kode_corporate`),
  CONSTRAINT `fk_folio_reservation` FOREIGN KEY (`kode_reservation`) REFERENCES `trx_reservation` (`kode_reservasi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_folio`
--

LOCK TABLES `trx_folio` WRITE;
/*!40000 ALTER TABLE `trx_folio` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_folio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_folio_charge`
--

DROP TABLE IF EXISTS `trx_folio_charge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_folio_charge` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_folio_charge` varchar(50) NOT NULL,
  `kode_folio` varchar(50) NOT NULL,
  `charge_type` enum('room','restaurant','room_service','laundry','minibar','spa','parking','penalty','deposit','other') NOT NULL,
  `description` varchar(255) NOT NULL,
  `qty` decimal(10,2) NOT NULL DEFAULT '1.00',
  `unit_price` decimal(14,2) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `ref_source_type` varchar(30) DEFAULT NULL,
  `kode_ref_source` varchar(50) DEFAULT NULL,
  `posted_by` bigint unsigned DEFAULT NULL,
  `posted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_folio_charge`),
  KEY `fk_folio_charge_folio` (`kode_folio`),
  KEY `idx_folio_charge_type` (`charge_type`),
  CONSTRAINT `fk_folio_charge_folio` FOREIGN KEY (`kode_folio`) REFERENCES `trx_folio` (`kode_folio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_folio_charge`
--

LOCK TABLES `trx_folio_charge` WRITE;
/*!40000 ALTER TABLE `trx_folio_charge` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_folio_charge` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_folio_split`
--

DROP TABLE IF EXISTS `trx_folio_split`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_folio_split` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_folio_split` varchar(50) NOT NULL,
  `kode_parent_folio` varchar(50) NOT NULL,
  `kode_split_folio` varchar(50) NOT NULL,
  `split_type` enum('per_guest','per_company','per_travel_agent','other') NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_folio_split`),
  KEY `fk_split_parent` (`kode_parent_folio`),
  KEY `fk_split_child` (`kode_split_folio`),
  CONSTRAINT `fk_split_child` FOREIGN KEY (`kode_split_folio`) REFERENCES `trx_folio` (`kode_folio`),
  CONSTRAINT `fk_split_parent` FOREIGN KEY (`kode_parent_folio`) REFERENCES `trx_folio` (`kode_folio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_folio_split`
--

LOCK TABLES `trx_folio_split` WRITE;
/*!40000 ALTER TABLE `trx_folio_split` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_folio_split` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_guest_document`
--

DROP TABLE IF EXISTS `trx_guest_document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_guest_document` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_guest_document` varchar(50) NOT NULL,
  `kode_guest` varchar(50) NOT NULL,
  `kode_checkin` varchar(50) DEFAULT NULL,
  `kode_document_type` varchar(50) NOT NULL,
  `doc_number` varchar(50) DEFAULT NULL,
  `scan_url` varchar(255) NOT NULL,
  `uploaded_by` bigint unsigned DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_guest_document`),
  KEY `fk_guest_doc_guest` (`kode_guest`),
  KEY `fk_guest_doc_checkin` (`kode_checkin`),
  KEY `fk_guest_doc_type` (`kode_document_type`),
  CONSTRAINT `fk_guest_doc_checkin` FOREIGN KEY (`kode_checkin`) REFERENCES `trx_checkin` (`kode_checkin`),
  CONSTRAINT `fk_guest_doc_guest` FOREIGN KEY (`kode_guest`) REFERENCES `mst_guest` (`kode_tamu`),
  CONSTRAINT `fk_guest_doc_type` FOREIGN KEY (`kode_document_type`) REFERENCES `mst_document_type` (`kode_document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_guest_document`
--

LOCK TABLES `trx_guest_document` WRITE;
/*!40000 ALTER TABLE `trx_guest_document` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_guest_document` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_guest_feedback`
--

DROP TABLE IF EXISTS `trx_guest_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_guest_feedback` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_guest_feedback` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_reservation` varchar(50) DEFAULT NULL,
  `kode_guest` varchar(50) DEFAULT NULL,
  `category` enum('room','service','food','cleanliness','facility','other') NOT NULL DEFAULT 'other',
  `rating` tinyint unsigned DEFAULT NULL,
  `comment` text,
  `is_complaint` tinyint(1) NOT NULL DEFAULT '0',
  `followup_status` enum('open','in_progress','resolved') DEFAULT NULL,
  `followup_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_guest_feedback`),
  KEY `fk_feedback_hotel` (`kode_cabang`),
  KEY `fk_feedback_reservation` (`kode_reservation`),
  KEY `fk_feedback_guest` (`kode_guest`),
  CONSTRAINT `fk_feedback_guest` FOREIGN KEY (`kode_guest`) REFERENCES `mst_guest` (`kode_tamu`),
  CONSTRAINT `fk_feedback_reservation` FOREIGN KEY (`kode_reservation`) REFERENCES `trx_reservation` (`kode_reservasi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_guest_feedback`
--

LOCK TABLES `trx_guest_feedback` WRITE;
/*!40000 ALTER TABLE `trx_guest_feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_guest_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_housekeeping_task`
--

DROP TABLE IF EXISTS `trx_housekeeping_task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_housekeeping_task` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_housekeeping_task` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_kamar` varchar(50) NOT NULL,
  `task_type` enum('cleaning','inspection','maintenance_check') NOT NULL DEFAULT 'cleaning',
  `assigned_to` bigint unsigned DEFAULT NULL,
  `priority` enum('normal','urgent') NOT NULL DEFAULT 'normal',
  `status` enum('assigned','in_progress','finished','supervisor_approved') NOT NULL DEFAULT 'assigned',
  `photo_url` varchar(255) DEFAULT NULL,
  `supervisor_id` bigint unsigned DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_housekeeping_task`),
  KEY `fk_hk_task_hotel` (`kode_cabang`),
  KEY `fk_hk_task_room` (`kode_kamar`),
  CONSTRAINT `fk_hk_task_room` FOREIGN KEY (`kode_kamar`) REFERENCES `mst_kamar` (`kode_kamar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_housekeeping_task`
--

LOCK TABLES `trx_housekeeping_task` WRITE;
/*!40000 ALTER TABLE `trx_housekeeping_task` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_housekeeping_task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_journal_reference`
--

DROP TABLE IF EXISTS `trx_journal_reference`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_journal_reference` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_journal_reference` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `source_type` enum('checkin_deposit','checkout_revenue','tax','refund','ta_commission','city_ledger') NOT NULL,
  `source_id` bigint unsigned NOT NULL,
  `kode_ref_journal` varchar(50) DEFAULT NULL,
  `amount` decimal(16,2) NOT NULL,
  `posted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_journal_reference`),
  KEY `fk_journal_ref_hotel` (`kode_cabang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_journal_reference`
--

LOCK TABLES `trx_journal_reference` WRITE;
/*!40000 ALTER TABLE `trx_journal_reference` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_journal_reference` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_laundry_order`
--

DROP TABLE IF EXISTS `trx_laundry_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_laundry_order` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_laundry_order` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_reservation_room` varchar(50) NOT NULL,
  `item_description` text NOT NULL,
  `status` enum('received','in_process','done','posted') NOT NULL DEFAULT 'received',
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `kode_folio_charge` varchar(50) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_laundry_order`),
  KEY `fk_laundry_hotel` (`kode_cabang`),
  KEY `fk_laundry_res_room` (`kode_reservation_room`),
  KEY `fk_laundry_folio_charge` (`kode_folio_charge`),
  CONSTRAINT `fk_laundry_folio_charge` FOREIGN KEY (`kode_folio_charge`) REFERENCES `trx_folio_charge` (`kode_folio_charge`),
  CONSTRAINT `fk_laundry_res_room` FOREIGN KEY (`kode_reservation_room`) REFERENCES `trx_reservation_room` (`kode_reservasi_room`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_laundry_order`
--

LOCK TABLES `trx_laundry_order` WRITE;
/*!40000 ALTER TABLE `trx_laundry_order` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_laundry_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_lost_and_found`
--

DROP TABLE IF EXISTS `trx_lost_and_found`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_lost_and_found` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_lost_and_found` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_kamar` varchar(50) DEFAULT NULL,
  `item_description` varchar(255) NOT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `found_by` bigint unsigned DEFAULT NULL,
  `found_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('stored','claimed','disposed') NOT NULL DEFAULT 'stored',
  `kode_claimed_by_guest` varchar(50) DEFAULT NULL,
  `claimed_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_lost_and_found`),
  KEY `fk_lnf_hotel` (`kode_cabang`),
  KEY `fk_lnf_room` (`kode_kamar`),
  KEY `fk_lnf_guest` (`kode_claimed_by_guest`),
  CONSTRAINT `fk_lnf_guest` FOREIGN KEY (`kode_claimed_by_guest`) REFERENCES `mst_guest` (`kode_tamu`),
  CONSTRAINT `fk_lnf_room` FOREIGN KEY (`kode_kamar`) REFERENCES `mst_kamar` (`kode_kamar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_lost_and_found`
--

LOCK TABLES `trx_lost_and_found` WRITE;
/*!40000 ALTER TABLE `trx_lost_and_found` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_lost_and_found` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_maintenance_ticket`
--

DROP TABLE IF EXISTS `trx_maintenance_ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_maintenance_ticket` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_maintenance_ticket` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_kamar` varchar(50) DEFAULT NULL,
  `issue_type` varchar(50) NOT NULL,
  `description` text,
  `status` enum('open','in_progress','done') NOT NULL DEFAULT 'open',
  `reported_by` bigint unsigned DEFAULT NULL,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_maintenance_ticket`),
  KEY `fk_maintenance_hotel` (`kode_cabang`),
  KEY `fk_maintenance_room` (`kode_kamar`),
  CONSTRAINT `fk_maintenance_room` FOREIGN KEY (`kode_kamar`) REFERENCES `mst_kamar` (`kode_kamar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_maintenance_ticket`
--

LOCK TABLES `trx_maintenance_ticket` WRITE;
/*!40000 ALTER TABLE `trx_maintenance_ticket` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_maintenance_ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_minibar_consumption`
--

DROP TABLE IF EXISTS `trx_minibar_consumption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_minibar_consumption` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_minibar_consumption` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_reservation_room` varchar(50) NOT NULL,
  `kode_ref_inventory_item` varchar(50) DEFAULT NULL,
  `item_name` varchar(100) NOT NULL,
  `qty` int NOT NULL DEFAULT '1',
  `unit_price` decimal(14,2) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `recorded_at_checkout` tinyint(1) NOT NULL DEFAULT '1',
  `kode_folio_charge` varchar(50) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_minibar_consumption`),
  KEY `fk_minibar_hotel` (`kode_cabang`),
  KEY `fk_minibar_res_room` (`kode_reservation_room`),
  KEY `fk_minibar_folio_charge` (`kode_folio_charge`),
  CONSTRAINT `fk_minibar_folio_charge` FOREIGN KEY (`kode_folio_charge`) REFERENCES `trx_folio_charge` (`kode_folio_charge`),
  CONSTRAINT `fk_minibar_res_room` FOREIGN KEY (`kode_reservation_room`) REFERENCES `trx_reservation_room` (`kode_reservasi_room`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_minibar_consumption`
--

LOCK TABLES `trx_minibar_consumption` WRITE;
/*!40000 ALTER TABLE `trx_minibar_consumption` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_minibar_consumption` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_night_audit`
--

DROP TABLE IF EXISTS `trx_night_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_night_audit` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_night_audit` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `business_date` date NOT NULL,
  `status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
  `room_charge_posted` tinyint(1) NOT NULL DEFAULT '0',
  `business_date_updated` tinyint(1) NOT NULL DEFAULT '0',
  `daily_report_generated` tinyint(1) NOT NULL DEFAULT '0',
  `transaction_locked` tinyint(1) NOT NULL DEFAULT '0',
  `started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `run_by` bigint unsigned DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_night_audit`),
  UNIQUE KEY `uq_night_audit` (`kode_cabang`,`business_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_night_audit`
--

LOCK TABLES `trx_night_audit` WRITE;
/*!40000 ALTER TABLE `trx_night_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_night_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_notification_log`
--

DROP TABLE IF EXISTS `trx_notification_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_notification_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_notification_log` varchar(50) NOT NULL,
  `kode_cabang` varchar(50) NOT NULL,
  `event_code` varchar(50) NOT NULL,
  `channel` enum('email','whatsapp','push') NOT NULL,
  `recipient` varchar(150) NOT NULL,
  `ref_type` varchar(30) DEFAULT NULL,
  `kode_ref` varchar(50) DEFAULT NULL,
  `status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_notification_log`),
  KEY `fk_notif_log_hotel` (`kode_cabang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_notification_log`
--

LOCK TABLES `trx_notification_log` WRITE;
/*!40000 ALTER TABLE `trx_notification_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_notification_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_payment`
--

DROP TABLE IF EXISTS `trx_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_payment` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_payment` varchar(50) NOT NULL,
  `kode_folio` varchar(50) NOT NULL,
  `payment_method` enum('cash','card','transfer','edc','deposit','voucher') NOT NULL,
  `kode_voucher` varchar(50) DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `kode_cashier_shift` varchar(50) DEFAULT NULL,
  `received_by` bigint unsigned DEFAULT NULL,
  `paid_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_payment`),
  KEY `fk_payment_folio` (`kode_folio`),
  KEY `fk_payment_voucher` (`kode_voucher`),
  KEY `fk_payment_shift` (`kode_cashier_shift`),
  CONSTRAINT `fk_payment_folio` FOREIGN KEY (`kode_folio`) REFERENCES `trx_folio` (`kode_folio`),
  CONSTRAINT `fk_payment_shift` FOREIGN KEY (`kode_cashier_shift`) REFERENCES `trx_cashier_shift` (`kode_cashier_shift`),
  CONSTRAINT `fk_payment_voucher` FOREIGN KEY (`kode_voucher`) REFERENCES `mst_voucher` (`kode_voucher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_payment`
--

LOCK TABLES `trx_payment` WRITE;
/*!40000 ALTER TABLE `trx_payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_refund`
--

DROP TABLE IF EXISTS `trx_refund`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_refund` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_refund` varchar(50) NOT NULL,
  `kode_folio` varchar(50) NOT NULL,
  `kode_payment` varchar(50) DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `refund_method` enum('cash','transfer','card_reversal') NOT NULL,
  `status` enum('requested','approved','rejected','completed') NOT NULL DEFAULT 'requested',
  `requested_by` bigint unsigned DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `refunded_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_refund`),
  KEY `fk_refund_folio` (`kode_folio`),
  KEY `fk_refund_payment` (`kode_payment`),
  CONSTRAINT `fk_refund_folio` FOREIGN KEY (`kode_folio`) REFERENCES `trx_folio` (`kode_folio`),
  CONSTRAINT `fk_refund_payment` FOREIGN KEY (`kode_payment`) REFERENCES `trx_payment` (`kode_payment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_refund`
--

LOCK TABLES `trx_refund` WRITE;
/*!40000 ALTER TABLE `trx_refund` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_refund` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_reservasi_event`
--

DROP TABLE IF EXISTS `trx_reservasi_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_reservasi_event` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kode_reservasi_event` varchar(255) NOT NULL,
  `kode_ruang_event` varchar(255) NOT NULL,
  `kode_cabang` varchar(255) NOT NULL,
  `kode_tamu` varchar(255) NOT NULL,
  `kode_corporate` varchar(255) DEFAULT NULL,
  `kode_reservasi_kamar` varchar(255) DEFAULT NULL,
  `tgl_mulai` date NOT NULL,
  `tgl_selesai` date NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `jumlah_tamu` int NOT NULL,
  `status_event` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode_reservasi_event` (`kode_reservasi_event`),
  KEY `fk_tre_ruang` (`kode_ruang_event`),
  KEY `fk_tre_cabang` (`kode_cabang`),
  CONSTRAINT `fk_tre_cabang` FOREIGN KEY (`kode_cabang`) REFERENCES `mst_cabang` (`kode_cabang`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tre_ruang` FOREIGN KEY (`kode_ruang_event`) REFERENCES `mst_ruang_event` (`kode_ruang_event`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_reservasi_event`
--

LOCK TABLES `trx_reservasi_event` WRITE;
/*!40000 ALTER TABLE `trx_reservasi_event` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_reservasi_event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_reservation`
--

DROP TABLE IF EXISTS `trx_reservation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_reservation` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_cabang` varchar(50) NOT NULL,
  `kode_reservasi` varchar(50) NOT NULL,
  `booking_type` enum('individual','group','corporate','walk_in') NOT NULL DEFAULT 'individual',
  `kode_guest` varchar(50) DEFAULT NULL,
  `kode_corporate_account` varchar(50) DEFAULT NULL,
  `kode_room_block` varchar(50) DEFAULT NULL,
  `group_code` varchar(30) DEFAULT NULL,
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `guest_count` int NOT NULL DEFAULT '1',
  `deposit_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `special_request` text,
  `status` enum('reserved','confirmed','waiting_list','cancelled','no_show','checked_in','checked_out') NOT NULL DEFAULT 'reserved',
  `source_channel` enum('direct','walk_in','booking_com','agoda','traveloka','expedia','airbnb','other') NOT NULL DEFAULT 'direct',
  `ref_channel_booking_id` varchar(100) DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `cancellation_penalty` decimal(14,2) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_reservasi`),
  UNIQUE KEY `uq_reservation` (`kode_cabang`,`kode_reservasi`),
  KEY `fk_reservation_guest` (`kode_guest`),
  KEY `fk_reservation_corp` (`kode_corporate_account`),
  KEY `fk_reservation_room_block` (`kode_room_block`),
  KEY `idx_reservation_dates` (`kode_cabang`,`check_in_date`,`check_out_date`),
  KEY `idx_reservation_group` (`group_code`),
  CONSTRAINT `fk_reservation_corp` FOREIGN KEY (`kode_corporate_account`) REFERENCES `mst_corporate_account` (`kode_corporate`),
  CONSTRAINT `fk_reservation_guest` FOREIGN KEY (`kode_guest`) REFERENCES `mst_guest` (`kode_tamu`),
  CONSTRAINT `fk_reservation_room_block` FOREIGN KEY (`kode_room_block`) REFERENCES `mst_room_block` (`kode_room_block`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_reservation`
--

LOCK TABLES `trx_reservation` WRITE;
/*!40000 ALTER TABLE `trx_reservation` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_reservation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_reservation_room`
--

DROP TABLE IF EXISTS `trx_reservation_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_reservation_room` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_reservasi_room` varchar(50) NOT NULL,
  `kode_reservation` varchar(50) NOT NULL,
  `kode_tipe_kamar` varchar(50) NOT NULL,
  `kode_rate_plan` varchar(50) NOT NULL,
  `kode_kamar` varchar(50) DEFAULT NULL,
  `room_preference` varchar(100) DEFAULT NULL,
  `rate_per_night` decimal(14,2) NOT NULL,
  `nights` int NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'booked',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` bigint DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `version` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_reservasi_room`),
  KEY `fk_res_room_reservation` (`kode_reservation`),
  KEY `fk_res_room_room_type` (`kode_tipe_kamar`),
  KEY `fk_res_room_rate_plan` (`kode_rate_plan`),
  KEY `fk_res_room_kamar` (`kode_kamar`),
  CONSTRAINT `fk_res_room_rate_plan` FOREIGN KEY (`kode_rate_plan`) REFERENCES `mst_paket_harga` (`kode_paket_harga`),
  CONSTRAINT `fk_res_room_reservation` FOREIGN KEY (`kode_reservation`) REFERENCES `trx_reservation` (`kode_reservasi`),
  CONSTRAINT `fk_res_room_room` FOREIGN KEY (`kode_kamar`) REFERENCES `mst_kamar` (`kode_kamar`),
  CONSTRAINT `fk_res_room_room_type` FOREIGN KEY (`kode_tipe_kamar`) REFERENCES `mst_tipe_kamar` (`kode_tipe_kamar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_reservation_room`
--

LOCK TABLES `trx_reservation_room` WRITE;
/*!40000 ALTER TABLE `trx_reservation_room` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_reservation_room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_reservation_status_log`
--

DROP TABLE IF EXISTS `trx_reservation_status_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_reservation_status_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_reservasi_log` varchar(50) NOT NULL,
  `kode_reservation` varchar(50) NOT NULL,
  `status_from` varchar(30) DEFAULT NULL,
  `status_to` varchar(30) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `changed_by` bigint unsigned DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_reservasi_log`),
  KEY `fk_res_status_log_reservation` (`kode_reservation`),
  CONSTRAINT `fk_res_status_log_reservation` FOREIGN KEY (`kode_reservation`) REFERENCES `trx_reservation` (`kode_reservasi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_reservation_status_log`
--

LOCK TABLES `trx_reservation_status_log` WRITE;
/*!40000 ALTER TABLE `trx_reservation_status_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_reservation_status_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_room_move`
--

DROP TABLE IF EXISTS `trx_room_move`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_room_move` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_room_move` varchar(50) NOT NULL,
  `kode_reservation_room` varchar(50) NOT NULL,
  `kode_from_room` varchar(50) NOT NULL,
  `kode_to_room` varchar(50) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `moved_by` bigint unsigned DEFAULT NULL,
  `moved_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_room_move`),
  KEY `fk_room_move_res_room` (`kode_reservation_room`),
  KEY `fk_room_move_from` (`kode_from_room`),
  KEY `fk_room_move_to` (`kode_to_room`),
  CONSTRAINT `fk_room_move_from` FOREIGN KEY (`kode_from_room`) REFERENCES `mst_kamar` (`kode_kamar`),
  CONSTRAINT `fk_room_move_res_room` FOREIGN KEY (`kode_reservation_room`) REFERENCES `trx_reservation_room` (`kode_reservasi_room`),
  CONSTRAINT `fk_room_move_to` FOREIGN KEY (`kode_to_room`) REFERENCES `mst_kamar` (`kode_kamar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_room_move`
--

LOCK TABLES `trx_room_move` WRITE;
/*!40000 ALTER TABLE `trx_room_move` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_room_move` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trx_room_status_log`
--

DROP TABLE IF EXISTS `trx_room_status_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trx_room_status_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_room_status_log` varchar(50) NOT NULL,
  `kode_kamar` varchar(50) NOT NULL,
  `status_from` varchar(30) DEFAULT NULL,
  `status_to` varchar(30) NOT NULL,
  `changed_by` bigint unsigned DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_room_status_log`),
  KEY `fk_room_status_log_room` (`kode_kamar`),
  CONSTRAINT `fk_room_status_log_room` FOREIGN KEY (`kode_kamar`) REFERENCES `mst_kamar` (`kode_kamar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trx_room_status_log`
--

LOCK TABLES `trx_room_status_log` WRITE;
/*!40000 ALTER TABLE `trx_room_status_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `trx_room_status_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_navigation`
--

DROP TABLE IF EXISTS `user_navigation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_navigation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `menu` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tz` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_user_navigation_uniqueid` (`user_code`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_navigation`
--

LOCK TABLES `user_navigation` WRITE;
/*!40000 ALTER TABLE `user_navigation` DISABLE KEYS */;
INSERT INTO `user_navigation` VALUES (4,'USR000000','[{\"label\":\"Utama\",\"items\":[{\"label\":\"Dashboard\",\"icon\":\"pi pi-fw pi-home\",\"to\":\"/dashboard\"}]},{\"label\":\"MASTER & SETUP CABANG\",\"icon\":\"pi pi-fw pi-cog\",\"items\":[{\"label\":\"Data Master Hotel\",\"icon\":\"pi pi-fw pi-building\",\"items\":[{\"label\":\"Master Cabang\",\"icon\":\"pi pi-fw pi-building\",\"to\":\"/master_cabang\"},{\"label\":\"Master Gedung\",\"icon\":\"pi pi-fw pi-th-large\",\"to\":\"/master_gedung\"},{\"label\":\"Master Lantai\",\"icon\":\"pi pi-fw pi-bars\",\"to\":\"/master_lantai\"},{\"label\":\"Corporate / Travel Agent\",\"icon\":\"pi pi-fw pi-briefcase\",\"to\":\"/master_corporate\"},{\"label\":\"Pajak & Service Charge\",\"icon\":\"pi pi-fw pi-percentage\",\"to\":\"/master_pajak\"}]},{\"label\":\"Kamar & Fasilitas\",\"icon\":\"pi pi-fw pi-home\",\"items\":[{\"label\":\"Tipe Kamar\",\"icon\":\"pi pi-fw pi-tag\",\"to\":\"/master_tipe_kamar\"},{\"label\":\"Master Kamar\",\"icon\":\"pi pi-fw pi-home\",\"to\":\"/master_kamar\"},{\"label\":\"Bed Type\",\"icon\":\"pi pi-fw pi-inbox\",\"to\":\"/master_bed_type\"},{\"label\":\"Fasilitas & Amenity\",\"icon\":\"pi pi-fw pi-star\",\"to\":\"/master_amenity\"},{\"label\":\"Master Fasilitas\",\"icon\":\"pi pi-fw pi-verified\",\"to\":\"/master_fasilitas\"}]},{\"label\":\"Ruang Event\",\"icon\":\"pi pi-fw pi-ticket\",\"items\":[{\"label\":\"Tipe Ruang Event\",\"icon\":\"pi pi-fw pi-tags\",\"to\":\"/master_tipe_ruang_event\"},{\"label\":\"Master Ruang Event\",\"icon\":\"pi pi-fw pi-ticket\",\"to\":\"/master_ruang_event\"},{\"label\":\"Harga Ruang Event\",\"icon\":\"pi pi-fw pi-money-bill\",\"to\":\"/master_harga_ruang_event\"}]},{\"label\":\"Harga & Season\",\"icon\":\"pi pi-fw pi-dollar\",\"items\":[{\"label\":\"Rate Plan (Paket Harga)\",\"icon\":\"pi pi-fw pi-dollar\",\"to\":\"/master_rate_plan\"},{\"label\":\"Master Harga Kamar\",\"icon\":\"pi pi-fw pi-money-bill\",\"to\":\"/master_rate_plan_price\"},{\"label\":\"Season & Pricing\",\"icon\":\"pi pi-fw pi-calendar\",\"to\":\"/master_season\"}]},{\"label\":\"Konfigurasi Sistem\",\"icon\":\"pi pi-fw pi-sliders-h\",\"items\":[{\"label\":\"User & Role Management\",\"icon\":\"pi pi-fw pi-users\",\"to\":\"/setup/users\"},{\"label\":\"Master Navigasi\",\"icon\":\"pi pi-fw pi-sitemap\",\"to\":\"/setup/navigation\"},{\"label\":\"Konfigurasi Perusahaan\",\"icon\":\"pi pi-fw pi-sliders-h\",\"to\":\"/setup/config\"}]}]},{\"label\":\"Contoh & Template\",\"icon\":\"pi pi-fw pi-bookmark\",\"items\":[{\"label\":\"Contoh Form Upload\",\"icon\":\"pi pi-fw pi-upload\",\"to\":\"/contoh_form_upload\"},{\"label\":\"Contoh Laporan\",\"icon\":\"pi pi-fw pi-file\",\"to\":\"/contoh_laporan\"},{\"label\":\"Contoh Popup\",\"icon\":\"pi pi-fw pi-window-maximize\",\"to\":\"/contoh_popup\"},{\"label\":\"Contoh Tabview\",\"icon\":\"pi pi-fw pi-folder\",\"to\":\"/contoh_tabview\"},{\"label\":\"Contoh Trx Cetak Nota\",\"icon\":\"pi pi-fw pi-print\",\"to\":\"/contoh_trx_cetak_nota\"}]}]','UTC','2026-08-14 07:31:36','2026-09-02 02:51:50'),(5,'USR0001','[{\"items\":[{\"to\":\"/dashboard\",\"icon\":\"pi pi-fw pi-home\",\"label\":\"Dashboard\"}],\"label\":\"Utama\"},{\"icon\":\"pi pi-fw pi-cog\",\"items\":[{\"to\":\"/master_Cabang\",\"icon\":\"pi pi-fw pi-building\",\"label\":\"Master Cabang\"},{\"to\":\"/master_gedung\",\"icon\":\"pi pi-fw pi-th-large\",\"label\":\"Master Gedung\"},{\"to\":\"/master_lantai\",\"icon\":\"pi pi-fw pi-bars\",\"label\":\"Master Lantai\"},{\"to\":\"/master_tipe_kamar\",\"icon\":\"pi pi-fw pi-tag\",\"label\":\"Tipe Kamar\"},{\"to\":\"/master_kamar\",\"icon\":\"pi pi-fw pi-home\",\"label\":\"Master Kamar\"},{\"to\":\"/master_bed_type\",\"icon\":\"pi pi-fw pi-inbox\",\"label\":\"Bed Type\"},{\"to\":\"/master_amenity\",\"icon\":\"pi pi-fw pi-star\",\"label\":\"Fasilitas & Amenity\"},{\"to\":\"/master_fasilitas\",\"icon\":\"pi pi-fw pi-verified\",\"label\":\"Master Fasilitas\"},{\"to\":\"/master_tipe_ruang_event\",\"icon\":\"pi pi-fw pi-tags\",\"label\":\"Tipe Ruang Event\"},{\"to\":\"/master_rate_plan\",\"icon\":\"pi pi-fw pi-dollar\",\"label\":\"Rate Plan (Paket Harga)\"},{\"to\":\"/master_season\",\"icon\":\"pi pi-fw pi-calendar\",\"label\":\"Season & Pricing\"},{\"to\":\"/master_pajak\",\"icon\":\"pi pi-fw pi-percentage\",\"label\":\"Pajak & Service Charge\"},{\"to\":\"/master_corporate\",\"icon\":\"pi pi-fw pi-briefcase\",\"label\":\"Corporate / Travel Agent\"}],\"label\":\"Master & Setup Hotel\"}]','UTC','2026-08-27 03:35:26','2026-08-27 03:35:26');
/*!40000 ALTER TABLE `user_navigation` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-02  9:51:56
