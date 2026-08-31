-- ========================================================
-- Project: Intern Standart v2
-- Date Dump: 2026-08-31
-- Database: hotel_pms
-- ========================================================


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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tgl` date DEFAULT NULL,
  `controller` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `function` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `request` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `response` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `stack` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `user` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tz` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `datetime` datetime DEFAULT NULL,
  `datetime_eng` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=328 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `log_perubahan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_perubahan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `aksi` enum('CREATE','UPDATE','DELETE','RESTORE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `keterangan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_tabel` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kode_referensi` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_sebelum` json DEFAULT NULL,
  `data_sesudah` json DEFAULT NULL,
  `tz` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'UTC',
  `created_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at_eng` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_log_perubahan_tabel_ref` (`nama_tabel`,`kode_referensi`),
  KEY `idx_log_perubahan_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=482 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
  `status` enum('booked','assigned','checked_in','checked_out','room_moved') NOT NULL DEFAULT 'booked',
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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

