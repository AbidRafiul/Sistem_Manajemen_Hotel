-- ====================================================================
-- PEMBARUAN LENGKAP DATABASE PRODUCTION (RAILWAY MYSQL / DBEAVER)
-- Proyek       : Sistem Manajemen Hotel (PMS) Multi-Branch Enterprise
-- File         : production_railway_update.sql
-- Kompatibilitas: MySQL 8.0+ / MariaDB 10.5+ / Railway / DBeaver / Navicat
-- Sifat Skrip  : 100% IDEMPOTENT (Aman dijalankan berulang kali tanpa error/duplikasi)
--
-- PANDUAN EKSEKUSI DI DBEAVER:
-- 1. Buka DBeaver dan hubungkan ke database Railway Production Anda.
-- 2. Pastikan database aktif terpilih (misal: 'railway').
-- 3. Buka SQL Editor (Ctrl + ] atau Menu -> SQL Editor -> New SQL Script).
-- 4. Copy seluruh isi file ini, lalu paste ke SQL Editor DBeaver.
-- 5. Jalankan sebagai SQL Script (Tekan Alt + X atau klik icon 'Execute SQL Script').
-- 6. Tunggu beberapa detik hingga proses selesai (Success).
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- -------------------------------------------------------------
-- [BAGIAN 1] PEMBUATAN TABEL BARU (DDL - CREATE TABLE IF NOT EXISTS)
-- -------------------------------------------------------------

-- 1.1 Tabel companies (Holding / Induk Perusahaan Hotel)
CREATE TABLE IF NOT EXISTS `companies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_company_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Tabel org_nodes (Master Wilayah / Regional Hierarchy)
CREATE TABLE IF NOT EXISTS `org_nodes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `parent_id` BIGINT UNSIGNED NULL,
  `node_type` ENUM('company', 'region', 'branch_group', 'branch') NOT NULL DEFAULT 'region',
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_org_node_code` (`company_id`, `code`),
  KEY `idx_org_nodes_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3 Tabel user_scope_assignments (Penugasan Akses Multi-Cabang & Wilayah User)
CREATE TABLE IF NOT EXISTS `user_scope_assignments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `scope_type` ENUM('company', 'org_node', 'branch') NOT NULL,
  `scope_id` BIGINT UNSIGNED NOT NULL,
  `access_mode` ENUM('view', 'manage', 'operate') NOT NULL DEFAULT 'operate',
  `is_default` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_scope_user` (`user_id`),
  KEY `idx_user_scope_type_id` (`scope_type`, `scope_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.4 Tabel mst_shift (Master Shift Kasir Terintegrasi)
CREATE TABLE IF NOT EXISTS `mst_shift` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_shift` VARCHAR(50) NOT NULL,
  `nama_shift` VARCHAR(100) NOT NULL,
  `waktu_mulai` TIME NOT NULL,
  `waktu_selesai` TIME NOT NULL,
  `default_opening_cash` DECIMAL(14,2) NOT NULL DEFAULT 1000000.00,
  `is_night_audit` TINYINT(1) NOT NULL DEFAULT 0,
  `urutan` INT NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_by` INT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` INT DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_kode_shift` (`kode_shift`),
  KEY `fk_shift_cabang` (`kode_cabang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 1.5 Tabel mst_tipe_kamar_foto (Galeri Foto Tipe Kamar)
CREATE TABLE IF NOT EXISTS `mst_tipe_kamar_foto` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `foto_url` VARCHAR(255) NOT NULL,
  `urutan` INT NOT NULL DEFAULT 0,
  `is_cover` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` BIGINT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_by` BIGINT DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_tkf_tipe_kamar` (`kode_tipe_kamar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 1.6 Tabel mst_cashier_counter (Master Loket / Cashier Counter)
CREATE TABLE IF NOT EXISTS `mst_cashier_counter` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_counter` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `created_by` BIGINT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` BIGINT DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode_counter`),
  UNIQUE KEY `uq_counter` (`kode_cabang`, `kode_counter`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 1.7 Tabel user_navigation (Custom Menu Per User)
CREATE TABLE IF NOT EXISTS `user_navigation` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_code` VARCHAR(50) NOT NULL,
  `menu` LONGTEXT NULL,
  `tz` VARCHAR(50) NOT NULL DEFAULT 'UTC',
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_navigation_uniqueid` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- [BAGIAN 1.7] PENYELARASAN COLLATION TABEL OPERASIONAL (FIX ILLEGAL MIX OF COLLATIONS)
-- Memastikan tabel operasional yang sudah terlanjur dibuat di production diselaraskan ke utf8mb4_0900_ai_ci
-- -------------------------------------------------------------
ALTER TABLE `mst_shift` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE `mst_cashier_counter` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE `mst_tipe_kamar_foto` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;


-- -------------------------------------------------------------
-- [BAGIAN 2] ALTER TABLE PADA TABEL EKSISTING (IDEMPOTENT DYNAMIC SQL)
-- -------------------------------------------------------------

-- 2.1 Tambah kolom `company_id` pada mst_cabang jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_cabang' AND COLUMN_NAME = 'company_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_cabang` ADD COLUMN `company_id` BIGINT UNSIGNED NULL DEFAULT 1 AFTER `id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.2 Tambah kolom `org_node_id` pada mst_cabang jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_cabang' AND COLUMN_NAME = 'org_node_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_cabang` ADD COLUMN `org_node_id` BIGINT UNSIGNED NULL AFTER `company_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.3 Tambah kolom `company_id` pada mst_user jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'company_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `company_id` BIGINT UNSIGNED NULL DEFAULT 1 AFTER `role`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.4 Tambah kolom `default_branch_id` pada mst_user jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'default_branch_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `default_branch_id` BIGINT UNSIGNED NULL AFTER `company_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.5 Tambah kolom `org_node_id` pada mst_user jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'org_node_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `org_node_id` BIGINT UNSIGNED NULL AFTER `default_branch_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.6 Tambah kolom `can_switch_branch` pada mst_user jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'can_switch_branch');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `can_switch_branch` TINYINT NOT NULL DEFAULT 0 AFTER `org_node_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.7 Tambah kolom `harga` pada mst_amenity jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_amenity' AND COLUMN_NAME = 'harga');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_amenity` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `icon`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.8 Tambah kolom `harga` pada mst_fasilitas jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_fasilitas' AND COLUMN_NAME = 'harga');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_fasilitas` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `name`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.9 Kolom Kasir Shift Operational pada `trx_cashier_shift`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_cashier_shift' AND COLUMN_NAME = 'sesi');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_cashier_shift` ADD COLUMN `sesi` VARCHAR(50) NOT NULL DEFAULT \'pagi\' AFTER `kode_cashier_counter`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_cashier_shift' AND COLUMN_NAME = 'catatan_handover');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_cashier_shift` ADD COLUMN `catatan_handover` TEXT NULL AFTER `cash_difference`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.10 Integrasi Shift Kasir & Guest Count pada `trx_checkin`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkin' AND COLUMN_NAME = 'kode_cashier_shift');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkin` ADD COLUMN `kode_cashier_shift` VARCHAR(50) NULL AFTER `early_checkin`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkin' AND COLUMN_NAME = 'guest_count');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkin` ADD COLUMN `guest_count` INT NOT NULL DEFAULT 1 AFTER `kode_cashier_shift`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.11 Integrasi Shift Kasir & Guest Count pada `trx_checkout`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND COLUMN_NAME = 'kode_cashier_shift');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkout` ADD COLUMN `kode_cashier_shift` VARCHAR(50) NULL AFTER `grand_total`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND COLUMN_NAME = 'guest_count');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkout` ADD COLUMN `guest_count` INT NOT NULL DEFAULT 1 AFTER `kode_cashier_shift`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.12 Integrasi Shift Kasir pada `trx_folio_charge`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'kode_cashier_shift');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_folio_charge` ADD COLUMN `kode_cashier_shift` VARCHAR(50) NULL AFTER `kode_ref_source`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.13 Kolom CRM Master Tamu pada `mst_guest` (28 Kolom Baru)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'title');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `title` VARCHAR(20) NULL AFTER `is_active`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'first_name');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `first_name` VARCHAR(100) NULL AFTER `title`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'last_name');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `last_name` VARCHAR(100) NULL AFTER `first_name`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'birth_date');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `birth_date` DATE NULL AFTER `last_name`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'gender');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `gender` ENUM(\'L\',\'P\') NULL AFTER `birth_date`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'identity_file_path');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `identity_file_path` VARCHAR(255) NULL AFTER `gender`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'passport_no');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `passport_no` VARCHAR(50) NULL AFTER `identity_file_path`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'passport_issuing_country');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `passport_issuing_country` VARCHAR(50) NULL AFTER `passport_no`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'passport_expiry');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `passport_expiry` DATE NULL AFTER `passport_issuing_country`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'visa_type');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `visa_type` VARCHAR(50) NULL AFTER `passport_expiry`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'visa_no');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `visa_no` VARCHAR(50) NULL AFTER `visa_type`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'arrival_date_indonesia');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `arrival_date_indonesia` DATE NULL AFTER `visa_no`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'purpose_of_visit');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `purpose_of_visit` VARCHAR(100) NULL AFTER `arrival_date_indonesia`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'guest_type');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `guest_type` ENUM(\'individual\',\'corporate\',\'travel_agent\',\'group\') NOT NULL DEFAULT \'individual\' AFTER `purpose_of_visit`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'vip_level');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `vip_level` ENUM(\'none\',\'vip\',\'vvip\',\'owner\') NOT NULL DEFAULT \'none\' AFTER `guest_type`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'blacklist_by');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `blacklist_by` BIGINT UNSIGNED NULL AFTER `vip_level`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'blacklist_at');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `blacklist_at` DATETIME NULL AFTER `blacklist_by`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'company_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `company_id` VARCHAR(50) NULL AFTER `blacklist_at`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'loyalty_tier');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `loyalty_tier` VARCHAR(50) NULL AFTER `company_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'preferences');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `preferences` JSON NULL AFTER `loyalty_tier`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'internal_notes');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `internal_notes` TEXT NULL AFTER `preferences`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'consent_marketing');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `consent_marketing` TINYINT(1) NOT NULL DEFAULT 0 AFTER `internal_notes`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'consent_at');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `consent_at` DATETIME NULL AFTER `consent_marketing`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'total_night');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `total_night` INT NOT NULL DEFAULT 0 AFTER `consent_at`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'avg_adr');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `avg_adr` DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER `total_night`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'last_stay_date');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `last_stay_date` DATE NULL AFTER `avg_adr`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'source');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `source` ENUM(\'front_office\',\'manual_input\',\'ota_import\') NOT NULL DEFAULT \'manual_input\' AFTER `last_stay_date`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'completeness_score');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `completeness_score` INT NOT NULL DEFAULT 0 AFTER `source`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'is_merged');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `is_merged` TINYINT(1) NOT NULL DEFAULT 0 AFTER `completeness_score`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND COLUMN_NAME = 'merged_into_guest_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_guest` ADD COLUMN `merged_into_guest_id` VARCHAR(50) NULL AFTER `is_merged`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.14 Kolom Bank & Card pada `trx_payment`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_payment' AND COLUMN_NAME = 'bank_name');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_payment` ADD COLUMN `bank_name` VARCHAR(50) NULL AFTER `payment_method`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_payment' AND COLUMN_NAME = 'card_type');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_payment` ADD COLUMN `card_type` VARCHAR(20) NULL AFTER `bank_name`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

ALTER TABLE `trx_payment` MODIFY COLUMN `payment_method` ENUM('cash','card','transfer','qris','edc','deposit','voucher') NOT NULL;

-- 2.15 Kolom Task Lifecycle pada `trx_housekeeping_task`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'cancel_reason');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `cancel_reason` VARCHAR(255) NULL AFTER `is_active`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'started_at');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `started_at` DATETIME NULL AFTER `cancel_reason`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'finished_at');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `finished_at` DATETIME NULL AFTER `started_at`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;


-- -------------------------------------------------------------
-- [BAGIAN 3] INDEKS UNTUK OPTIMASI PERFORMA (IDEMPOTENT CHECK)
-- -------------------------------------------------------------

-- 3.1 Indeks pada tabel Shift & Transaksi
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkin' AND INDEX_NAME = 'idx_checkin_shift');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_checkin` ADD INDEX `idx_checkin_shift` (`kode_cashier_shift`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND INDEX_NAME = 'idx_checkout_shift');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_checkout` ADD INDEX `idx_checkout_shift` (`kode_cashier_shift`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND INDEX_NAME = 'idx_folio_charge_shift');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_folio_charge` ADD INDEX `idx_folio_charge_shift` (`kode_cashier_shift`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_payment' AND INDEX_NAME = 'idx_payment_shift');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_payment` ADD INDEX `idx_payment_shift` (`kode_cashier_shift`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 3.2 Indeks pada tabel CRM Master Tamu (mst_guest)
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND INDEX_NAME = 'idx_guest_phone');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `mst_guest` ADD INDEX `idx_guest_phone` (`phone`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND INDEX_NAME = 'idx_guest_email');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `mst_guest` ADD INDEX `idx_guest_email` (`email`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND INDEX_NAME = 'idx_guest_id_number');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `mst_guest` ADD INDEX `idx_guest_id_number` (`id_number`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND INDEX_NAME = 'idx_guest_full_name');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `mst_guest` ADD INDEX `idx_guest_full_name` (`full_name`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND INDEX_NAME = 'idx_guest_nationality');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `mst_guest` ADD INDEX `idx_guest_nationality` (`nationality`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND INDEX_NAME = 'idx_guest_is_blacklist');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `mst_guest` ADD INDEX `idx_guest_is_blacklist` (`is_blacklisted`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_guest' AND INDEX_NAME = 'idx_guest_last_stay_date');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `mst_guest` ADD INDEX `idx_guest_last_stay_date` (`last_stay_date`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;


-- -------------------------------------------------------------
-- [BAGIAN 4] SEEDING SEQUENCE FORMAT PENOMORAN (sys_format_penomoran)
-- -------------------------------------------------------------
INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`, `created_at`, `updated_at`)
VALUES 
  ('FMT-MSTSHIFT', 'mst_shift', 'SFT', 4, 6, 1, NOW(), NOW()),
  ('FMT-FASILITAS', 'mst_fasilitas', 'FAS', 4, 11, 1, NOW(), NOW()),
  ('FMT-AMENITY', 'mst_amenity', 'AMN', 4, 8, 1, NOW(), NOW()),
  ('FMT-RESERVASI', 'trx_reservation', 'RSV', 4, 21, 1, NOW(), NOW()),
  ('FMT-RESROOM', 'trx_reservation_room', 'RRO', 4, 23, 1, NOW(), NOW()),
  ('FMT-CHECKIN', 'trx_checkin', 'CHK', 4, 15, 1, NOW(), NOW()),
  ('FMT-CHECKOUT', 'trx_checkout', 'OUT', 4, 26, 1, NOW(), NOW()),
  ('FMT-FOLIO', 'trx_folio', 'FOL', 4, 16, 1, NOW(), NOW()),
  ('FMT-FOLIOCHARGE', 'trx_folio_charge', 'FCH', 4, 22, 1, NOW(), NOW()),
  ('FMT-PAYMENT', 'trx_payment', 'PAY', 4, 22, 1, NOW(), NOW()),
  ('FMT-SHIFT', 'trx_cashier_shift', 'SFT', 4, 7, 1, NOW(), NOW()),
  ('FMT-TAMU', 'mst_guest', 'TAM', 4, 10, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `is_active` = 1,
  `updated_at` = NOW();


-- -------------------------------------------------------------
-- [BAGIAN 5] SEEDING MASTER HOLDING & WILAYAH (companies & org_nodes)
-- -------------------------------------------------------------

-- 5.1 Perusahaan Holding (Grand Marstech Hotel & Resort)
INSERT INTO `companies` (`id`, `code`, `name`, `status`, `created_at`, `updated_at`) 
VALUES (1, 'CMP001', 'Grand Marstech Hotel & Resort', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `status` = VALUES(`status`),
  `updated_at` = NOW();

-- 5.2 Regional Wilayah (org_nodes)
INSERT INTO `org_nodes` (`id`, `company_id`, `parent_id`, `node_type`, `code`, `name`, `status`, `created_at`, `updated_at`) 
VALUES 
  (1, 1, NULL, 'region', 'REG-JATIM', 'Wilayah Jawa Timur', 'active', NOW(), NOW()),
  (2, 1, NULL, 'region', 'REG-JATENG', 'Wilayah Jawa Tengah & D.I. Yogyakarta', 'active', NOW(), NOW()),
  (3, 1, NULL, 'region', 'REG-BALI', 'Wilayah Bali & Nusa Tenggara', 'active', NOW(), NOW()),
  (4, 1, NULL, 'region', 'REG-JABAR', 'Wilayah Jawa Barat & Banten', 'active', NOW(), NOW()),
  (5, 1, NULL, 'region', 'REG-DKI', 'Wilayah DKI Jakarta & Sekitarnya', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `status` = VALUES(`status`),
  `updated_at` = NOW();


-- -------------------------------------------------------------
-- [BAGIAN 6] SEEDING & SINKRONISASI CABANG (mst_cabang)
-- -------------------------------------------------------------

-- 6.1 Pastikan 4 Cabang Hotel Terdaftar
INSERT INTO `mst_cabang` (`id`, `company_id`, `org_node_id`, `kode_cabang`, `nama_hotel`, `alamat`, `telepon`, `waktu_checkin`, `waktu_checkout`, `zona_waktu`, `is_pkp`, `is_active`, `created_at`, `updated_at`)
VALUES
  (28, 1, 1, 'CAB0001', 'Grand Marstech Hotel & Resort Magetan', 'Jl. Diponegoro No. 88, Magetan, Jawa Timur', '0351-890123', '14:00:00', '12:00:00', 'Asia/Jakarta', 1, 1, NOW(), NOW()),
  (29, 1, 1, 'CAB0002', 'Grand Marstech Resort & Spa Batu', 'Jl. Oro-Oro Ombo No. 12, Kota Batu, Jawa Timur', '0341-591234', '14:00:00', '12:00:00', 'Asia/Jakarta', 1, 1, NOW(), NOW()),
  (30, 1, 2, 'CAB0003', 'Grand Marstech Hotel Solo', 'Jl. Slamet Riyadi No. 45, Solo, Jawa Tengah', '0271-712345', '14:00:00', '12:00:00', 'Asia/Jakarta', 1, 1, NOW(), NOW()),
  (31, 1, 4, 'CAB0004', 'Grand Marstech Heritage Bandung', 'Jl. Asia Afrika No. 100, Bandung, Jawa Barat', '022-4201234', '14:00:00', '12:00:00', 'Asia/Jakarta', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `company_id` = VALUES(`company_id`),
  `org_node_id` = VALUES(`org_node_id`),
  `nama_hotel` = VALUES(`nama_hotel`),
  `alamat` = VALUES(`alamat`),
  `telepon` = VALUES(`telepon`),
  `is_active` = 1,
  `updated_at` = NOW();

-- 6.2 Sinkronkan cabang lain yang masih kosong ke Company 1 & Wilayah 1
UPDATE `mst_cabang` SET `company_id` = 1 WHERE `company_id` IS NULL OR `company_id` = 0;
UPDATE `mst_cabang` SET `org_node_id` = 1 WHERE `org_node_id` IS NULL OR `org_node_id` = 0;


-- -------------------------------------------------------------
-- [BAGIAN 7] SEEDING MASTER SHIFT KASIR (mst_shift)
-- -------------------------------------------------------------

-- 7.1 Shift Standar untuk Cabang CAB0001 (Grand Marstech Magetan)
INSERT INTO `mst_shift` (`kode_cabang`, `kode_shift`, `nama_shift`, `waktu_mulai`, `waktu_selesai`, `default_opening_cash`, `is_night_audit`, `urutan`, `is_active`, `created_at`, `updated_at`)
VALUES 
  ('CAB0001', 'SFT-B001', 'Shift 1 – Pagi (Morning)', '07:00:00', '15:00:00', 1000000.00, 0, 1, 1, NOW(), NOW()),
  ('CAB0001', 'SFT-B002', 'Shift 2 – Sore (Evening)', '15:00:00', '23:00:00', 1000000.00, 0, 2, 1, NOW(), NOW()),
  ('CAB0001', 'SFT-B003', 'Shift 3 – Malam (Night Audit)', '23:00:00', '07:00:00', 1000000.00, 1, 3, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `nama_shift` = VALUES(`nama_shift`),
  `waktu_mulai` = VALUES(`waktu_mulai`),
  `waktu_selesai` = VALUES(`waktu_selesai`),
  `default_opening_cash` = VALUES(`default_opening_cash`),
  `is_night_audit` = VALUES(`is_night_audit`),
  `urutan` = VALUES(`urutan`),
  `is_active` = 1;

-- 7.2 Shift Standar untuk Cabang CAB0002 (Grand Marstech Batu)
INSERT INTO `mst_shift` (`kode_cabang`, `kode_shift`, `nama_shift`, `waktu_mulai`, `waktu_selesai`, `default_opening_cash`, `is_night_audit`, `urutan`, `is_active`, `created_at`, `updated_at`)
VALUES 
  ('CAB0002', 'SFT-C001', 'Shift 1 – Pagi (Morning)', '07:00:00', '15:00:00', 1000000.00, 0, 1, 1, NOW(), NOW()),
  ('CAB0002', 'SFT-C002', 'Shift 2 – Sore (Evening)', '15:00:00', '23:00:00', 1000000.00, 0, 2, 1, NOW(), NOW()),
  ('CAB0002', 'SFT-C003', 'Shift 3 – Malam (Night Audit)', '23:00:00', '07:00:00', 1000000.00, 1, 3, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `nama_shift` = VALUES(`nama_shift`),
  `waktu_mulai` = VALUES(`waktu_mulai`),
  `waktu_selesai` = VALUES(`waktu_selesai`),
  `default_opening_cash` = VALUES(`default_opening_cash`),
  `is_night_audit` = VALUES(`is_night_audit`),
  `urutan` = VALUES(`urutan`),
  `is_active` = 1;


-- -------------------------------------------------------------
-- [BAGIAN 7B] SEEDING MASTER CASHIER COUNTER & FORMAT PENOMORAN
-- -------------------------------------------------------------

-- 7B.1 Seeding Cashier Counter Loket
INSERT INTO `mst_cashier_counter` (`kode_cabang`, `kode_counter`, `name`, `is_active`, `created_at`)
VALUES 
  ('CAB0001', 'CTR0001', 'Front Desk Counter 01', 1, NOW()),
  ('CAB0001', 'CTR0002', 'Front Desk Counter 02', 1, NOW()),
  ('CAB0001', 'CTR0003', 'Restaurant & Lounge Cashier', 1, NOW()),
  ('CAB0002', 'CTR-B01', 'Front Desk Cashier Batu 1', 1, NOW()),
  ('CAB0002', 'CTR-B02', 'Front Desk Cashier Batu 2', 1, NOW()),
  ('CAB0002', 'CTR-B03', 'Wellness & Spa Cashier', 1, NOW())
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `is_active` = 1;

-- 7B.2 Seeding Sequence Generator (sys_format_penomoran)
INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`)
VALUES 
  ('FMT-COUNTER', 'mst_cashier_counter', 'CTR', 4, 3, 1),
  ('FMT-MSTSHIFT', 'mst_shift', 'SFT', 4, 6, 1),
  ('FMT-SHIFT', 'trx_cashier_shift', 'SFT', 4, 1, 1)
ON DUPLICATE KEY UPDATE 
  `nama_tabel` = VALUES(`nama_tabel`),
  `prefix` = VALUES(`prefix`),
  `is_active` = 1;


-- -------------------------------------------------------------
-- [BAGIAN 8] SINKRONISASI USER & PERMISSIONS (mst_user & user_scope_assignments)
-- -------------------------------------------------------------

-- 8.1 Pastikan seluruh user terikat ke Company 1
UPDATE `mst_user` SET `company_id` = 1 WHERE `company_id` IS NULL OR `company_id` = 0;

-- 8.2 Set default_branch_id ke cabang pertama jika masih kosong
SET @first_branch_id := (SELECT `id` FROM `mst_cabang` WHERE `is_active` = 1 AND `deleted_at` IS NULL ORDER BY `id` ASC LIMIT 1);
UPDATE `mst_user` SET `default_branch_id` = IFNULL(@first_branch_id, 28) WHERE `default_branch_id` IS NULL OR `default_branch_id` = 0;

-- 8.3 Sinkronkan org_node_id user otomatis dari cabang default-nya
UPDATE `mst_user` u
JOIN `mst_cabang` c ON u.`default_branch_id` = c.`id`
SET u.`org_node_id` = c.`org_node_id`
WHERE (u.`org_node_id` IS NULL OR u.`org_node_id` = 0) AND c.`org_node_id` IS NOT NULL;

-- 8.4 Berikan hak switch branch (can_switch_branch = 1) untuk role Management & Global
UPDATE `mst_user` 
SET `can_switch_branch` = 1 
WHERE LOWER(TRIM(`role`)) IN (
  'superadmin', 'admin', 'master', 'corporate_manager', 'regional_manager', 'auditor', 'director', 'owner'
);

-- 8.5 Batasi staf operasional cabang (frontdesk, kasir, housekeeping, receptionist, branch_manager) di 1 cabang
UPDATE `mst_user` 
SET `can_switch_branch` = 0 
WHERE LOWER(TRIM(`role`)) IN (
  'frontdesk', 'kasir', 'housekeeping', 'receptionist', 'branch_manager', 'staff', 'employee'
);

-- 8.6 Inisialisasi Scope Assignment untuk user yang belum memiliki assignment
-- A. User Corporate / Superadmin -> Scope Company
INSERT INTO `user_scope_assignments` (`user_id`, `scope_type`, `scope_id`, `access_mode`, `is_default`, `created_at`)
SELECT u.`id`, 'company', 1, 'manage', 1, NOW()
FROM `mst_user` u
WHERE LOWER(TRIM(u.`role`)) IN ('superadmin', 'admin', 'master', 'corporate_manager')
  AND NOT EXISTS (SELECT 1 FROM `user_scope_assignments` a WHERE a.`user_id` = u.`id`);

-- B. User Regional -> Scope Org Node (Wilayah)
INSERT INTO `user_scope_assignments` (`user_id`, `scope_type`, `scope_id`, `access_mode`, `is_default`, `created_at`)
SELECT u.`id`, 'org_node', IFNULL(u.`org_node_id`, 1), 'manage', 1, NOW()
FROM `mst_user` u
WHERE LOWER(TRIM(u.`role`)) IN ('regional_manager', 'kepala_wilayah')
  AND NOT EXISTS (SELECT 1 FROM `user_scope_assignments` a WHERE a.`user_id` = u.`id`);

-- C. User Branch / Operasional -> Scope Branch
INSERT INTO `user_scope_assignments` (`user_id`, `scope_type`, `scope_id`, `access_mode`, `is_default`, `created_at`)
SELECT u.`id`, 'branch', u.`default_branch_id`, 'operate', 1, NOW()
FROM `mst_user` u
WHERE LOWER(TRIM(u.`role`)) NOT IN ('superadmin', 'admin', 'master', 'corporate_manager', 'regional_manager', 'kepala_wilayah')
  AND u.`default_branch_id` IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `user_scope_assignments` a WHERE a.`user_id` = u.`id`);


-- -------------------------------------------------------------
-- [BAGIAN 9] DATA INTEGRITY MULTI-BRANCH (PREVENT DATA LEAKAGE)
-- -------------------------------------------------------------
SET @default_branch_code := (SELECT `kode_cabang` FROM `mst_cabang` ORDER BY `id` ASC LIMIT 1);
SET @default_branch_code := IFNULL(@default_branch_code, 'CAB0001');

UPDATE `mst_gedung` SET `kode_cabang` = @default_branch_code WHERE `kode_cabang` IS NULL OR TRIM(`kode_cabang`) = '';
UPDATE `mst_tipe_kamar` SET `kode_cabang` = @default_branch_code WHERE `kode_cabang` IS NULL OR TRIM(`kode_cabang`) = '';
UPDATE `mst_kamar` SET `kode_cabang` = @default_branch_code WHERE `kode_cabang` IS NULL OR TRIM(`kode_cabang`) = '';


-- -------------------------------------------------------------
-- [BAGIAN 10] SINKRONISASI NAVIGASI MENU SIDEBAR LENGKAP (mst_navigation)
-- -------------------------------------------------------------

-- 10.0.1 Pastikan tabel mst_navigation ada
CREATE TABLE IF NOT EXISTS `mst_navigation` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `menu` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `role` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tz` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10.0.2 Hapus duplikasi lama di mst_navigation (mempertahankan ID terbaru)
DELETE n1 FROM `mst_navigation` n1
JOIN `mst_navigation` n2 
  ON LOWER(TRIM(n1.`role`)) = LOWER(TRIM(n2.`role`)) AND n1.`id` < n2.`id`;

-- 10.0.3 Tambahkan UNIQUE KEY pada kolom `role` agar ON DUPLICATE KEY UPDATE bekerja dengan benar
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_navigation' AND INDEX_NAME = 'uq_navigation_role');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `mst_navigation` ADD UNIQUE KEY `uq_navigation_role` (`role`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 10.1 Menu untuk Superadmin, Admin, dan Master
SET @menu_superadmin := '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"MASTER & SETUP CABANG","icon":"pi pi-fw pi-cog","items":[{"label":"Data Master Hotel","icon":"pi pi-fw pi-building","items":[{"label":"Master Wilayah","icon":"pi pi-fw pi-map","to":"/master_wilayah"},{"label":"Master Cabang","icon":"pi pi-fw pi-building","to":"/master_cabang"},{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Lantai","icon":"pi pi-fw pi-bars","to":"/master_lantai"},{"label":"Corporate / Travel Agent","icon":"pi pi-fw pi-briefcase","to":"/master_corporate"},{"label":"Pajak & Service Charge","icon":"pi pi-fw pi-percentage","to":"/master_pajak"},{"label":"Master Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"},{"label":"Master Shift Kasir","icon":"pi pi-fw pi-clock","to":"/master_shift"}]},{"label":"Kamar & Fasilitas","icon":"pi pi-fw pi-home","items":[{"label":"Tipe Kamar","icon":"pi pi-fw pi-tag","to":"/master_tipe_kamar"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"},{"label":"Bed Type","icon":"pi pi-fw pi-inbox","to":"/master_bed_type"},{"label":"Fasilitas & Amenity","icon":"pi pi-fw pi-star","to":"/master_amenity"},{"label":"Master Fasilitas","icon":"pi pi-fw pi-verified","to":"/master_fasilitas"}]},{"label":"Ruang Event","icon":"pi pi-fw pi-ticket","items":[{"label":"Tipe Ruang Event","icon":"pi pi-fw pi-tags","to":"/master_tipe_ruang_event"},{"label":"Master Ruang Event","icon":"pi pi-fw pi-ticket","to":"/master_ruang_event"},{"label":"Harga Ruang Event","icon":"pi pi-fw pi-money-bill","to":"/master_harga_ruang_event"}]},{"label":"Harga & Season","icon":"pi pi-fw pi-dollar","items":[{"label":"Rate Plan (Paket Harga)","icon":"pi pi-fw pi-dollar","to":"/master_rate_plan"},{"label":"Master Harga Kamar","icon":"pi pi-fw pi-money-bill","to":"/master_rate_plan_price"},{"label":"Season & Pricing","icon":"pi pi-fw pi-calendar","to":"/master_season"}]},{"label":"Master Tamu","icon":"pi pi-fw pi-users","items":[{"label":"Data Tamu","icon":"pi pi-fw pi-user","to":"/master_tamu"},{"label":"Dashboard Tamu","icon":"pi pi-fw pi-chart-bar","to":"/master_tamu/dashboard"}]},{"label":"Konfigurasi Sistem","icon":"pi pi-fw pi-sliders-h","items":[{"label":"User & Role Management","icon":"pi pi-fw pi-users","to":"/setup/users"},{"label":"Master Navigasi","icon":"pi pi-fw pi-sitemap","to":"/setup/navigation"},{"label":"Konfigurasi Perusahaan","icon":"pi pi-fw pi-sliders-h","to":"/setup/config"}]}]},{"label":"Kasir","icon":"pi pi-fw pi-wallet","items":[{"label":"Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Dashboard Reservasi","icon":"pi pi-fw pi-th-large","to":"/reservasi_dashboard"},{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Checkout","icon":"pi pi-fw pi-sign-out","to":"/checkout"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Contoh & Template","icon":"pi pi-fw pi-bookmark","items":[{"label":"Contoh Form Upload","icon":"pi pi-fw pi-upload","to":"/contoh_form_upload"},{"label":"Contoh Laporan","icon":"pi pi-fw pi-file","to":"/contoh_laporan"},{"label":"Contoh Popup","icon":"pi pi-fw pi-window-maximize","to":"/contoh_popup"},{"label":"Contoh Tabview","icon":"pi pi-fw pi-folder","to":"/contoh_tabview"},{"label":"Contoh Trx Cetak Nota","icon":"pi pi-fw pi-print","to":"/contoh_trx_cetak_nota"}]}]';

-- 10.2 Menu untuk Corporate Manager
SET @menu_corp := '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"Operasional Group","icon":"pi pi-fw pi-globe","items":[{"label":"Dashboard Reservasi","icon":"pi pi-fw pi-th-large","to":"/reservasi_dashboard"},{"label":"Tamu Menginap (In-House)","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Room Status Board","icon":"pi pi-fw pi-refresh","to":"/housekeeping/room_status_board"}]},{"label":"Master Tamu","icon":"pi pi-fw pi-users","items":[{"label":"Data Tamu","icon":"pi pi-fw pi-user","to":"/master_tamu"},{"label":"Dashboard Tamu","icon":"pi pi-fw pi-chart-bar","to":"/master_tamu/dashboard"}]},{"label":"Master Data Hotel","icon":"pi pi-fw pi-building","items":[{"label":"Master Wilayah","icon":"pi pi-fw pi-map","to":"/master_wilayah"},{"label":"Master Cabang","icon":"pi pi-fw pi-building","to":"/master_cabang"},{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"},{"label":"Rate Plan","icon":"pi pi-fw pi-dollar","to":"/master_rate_plan"},{"label":"Season & Pricing","icon":"pi pi-fw pi-calendar","to":"/master_season"}]}]';

-- 10.3 Menu untuk Regional Manager
SET @menu_reg := '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"Monitoring Wilayah","icon":"pi pi-fw pi-map","items":[{"label":"Dashboard Reservasi","icon":"pi pi-fw pi-th-large","to":"/reservasi_dashboard"},{"label":"Tamu Menginap (In-House)","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Room Status Board","icon":"pi pi-fw pi-refresh","to":"/housekeeping/room_status_board"}]},{"label":"Master Tamu","icon":"pi pi-fw pi-users","items":[{"label":"Data Tamu","icon":"pi pi-fw pi-user","to":"/master_tamu"},{"label":"Dashboard Tamu","icon":"pi pi-fw pi-chart-bar","to":"/master_tamu/dashboard"}]},{"label":"Informasi Properti","icon":"pi pi-fw pi-building","items":[{"label":"Master Wilayah","icon":"pi pi-fw pi-map","to":"/master_wilayah"},{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"}]}]';

-- 10.4 Menu untuk Branch Manager
SET @menu_bm := '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Dashboard Reservasi","icon":"pi pi-fw pi-th-large","to":"/reservasi_dashboard"},{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Checkout","icon":"pi pi-fw pi-sign-out","to":"/checkout"}]},{"label":"Kasir","icon":"pi pi-fw pi-wallet","items":[{"label":"Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Master Tamu","icon":"pi pi-fw pi-users","items":[{"label":"Data Tamu","icon":"pi pi-fw pi-user","to":"/master_tamu"},{"label":"Dashboard Tamu","icon":"pi pi-fw pi-chart-bar","to":"/master_tamu/dashboard"}]},{"label":"Setup & Master Cabang","icon":"pi pi-fw pi-cog","items":[{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Lantai","icon":"pi pi-fw pi-bars","to":"/master_lantai"},{"label":"Tipe Kamar","icon":"pi pi-fw pi-tag","to":"/master_tipe_kamar"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"},{"label":"Fasilitas Hotel","icon":"pi pi-fw pi-verified","to":"/master_fasilitas"},{"label":"Rate Plan","icon":"pi pi-fw pi-dollar","to":"/master_rate_plan"},{"label":"Season & Pricing","icon":"pi pi-fw pi-calendar","to":"/master_season"},{"label":"Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"},{"label":"Corporate / OTA","icon":"pi pi-fw pi-briefcase","to":"/master_corporate"},{"label":"Master Shift Kasir","icon":"pi pi-fw pi-clock","to":"/master_shift"}]}]';

-- 10.5 Menu untuk Frontdesk & Receptionist
SET @menu_fo := '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Dashboard Reservasi","icon":"pi pi-fw pi-th-large","to":"/reservasi_dashboard"},{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Master Tamu","icon":"pi pi-fw pi-users","items":[{"label":"Data Tamu","icon":"pi pi-fw pi-user","to":"/master_tamu"},{"label":"Dashboard Tamu","icon":"pi pi-fw pi-chart-bar","to":"/master_tamu/dashboard"}]}]';
SET @menu_rec := '[{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Master Tamu","icon":"pi pi-fw pi-users","items":[{"label":"Data Tamu","icon":"pi pi-fw pi-user","to":"/master_tamu"}]}]';

-- 10.6 Menu untuk Kasir
SET @menu_kasir := '[{"label":"Kasir","icon":"pi pi-fw pi-wallet","items":[{"label":"Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Operasional Kasir","icon":"pi pi-fw pi-money-bill","items":[{"label":"Tamu Menginap (Folio)","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Checkout & Tagihan","icon":"pi pi-fw pi-sign-out","to":"/checkout"}]}]';

-- 10.7 Menu untuk Housekeeping
SET @menu_hk := '[{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Kamar","icon":"pi pi-fw pi-home","items":[{"label":"Daftar Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"}]}]';

-- 10.8 Menu untuk Auditor
SET @menu_auditor := '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"Audit Transaksi","icon":"pi pi-fw pi-check-circle","items":[{"label":"Dashboard Reservasi","icon":"pi pi-fw pi-th-large","to":"/reservasi_dashboard"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Histori Checkout","icon":"pi pi-fw pi-sign-out","to":"/checkout"},{"label":"Log Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Analisis CRM","icon":"pi pi-fw pi-chart-line","items":[{"label":"Dashboard Tamu","icon":"pi pi-fw pi-chart-bar","to":"/master_tamu/dashboard"}]}]';

-- 10.9 Menu untuk Staff & Employee
SET @menu_staff := '[{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Master Tamu","icon":"pi pi-fw pi-users","items":[{"label":"Data Tamu","icon":"pi pi-fw pi-user","to":"/master_tamu"}]}]';

-- Masukkan / Perbarui seluruh role di `mst_navigation`
INSERT INTO `mst_navigation` (`role`, `menu`, `tz`, `created_at`, `updated_at`)
VALUES 
  ('superadmin', @menu_superadmin, 'UTC', NOW(), NOW()),
  ('admin', @menu_superadmin, 'UTC', NOW(), NOW()),
  ('master', @menu_superadmin, 'UTC', NOW(), NOW()),
  ('corporate_manager', @menu_corp, 'UTC', NOW(), NOW()),
  ('regional_manager', @menu_reg, 'UTC', NOW(), NOW()),
  ('branch_manager', @menu_bm, 'UTC', NOW(), NOW()),
  ('frontdesk', @menu_fo, 'UTC', NOW(), NOW()),
  ('receptionist', @menu_rec, 'UTC', NOW(), NOW()),
  ('kasir', @menu_kasir, 'UTC', NOW(), NOW()),
  ('housekeeping', @menu_hk, 'UTC', NOW(), NOW()),
  ('auditor', @menu_auditor, 'UTC', NOW(), NOW()),
  ('staff', @menu_staff, 'UTC', NOW(), NOW()),
  ('employee', @menu_staff, 'UTC', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `menu` = VALUES(`menu`),
  `updated_at` = NOW();


-- -------------------------------------------------------------
-- [BAGIAN 11] VERIFIKASI HASIL EKSEKUSI
-- -------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Status Jumlah Data Tabel Inti & Baru
SELECT 'companies' AS nama_tabel, COUNT(*) AS jumlah_data FROM `companies`
UNION ALL
SELECT 'org_nodes' AS nama_tabel, COUNT(*) AS jumlah_data FROM `org_nodes`
UNION ALL
SELECT 'mst_cabang' AS nama_tabel, COUNT(*) AS jumlah_data FROM `mst_cabang`
UNION ALL
SELECT 'mst_shift' AS nama_tabel, COUNT(*) AS jumlah_data FROM `mst_shift`
UNION ALL
SELECT 'mst_guest' AS nama_tabel, COUNT(*) AS jumlah_data FROM `mst_guest`
UNION ALL
SELECT 'user_scope_assignments' AS nama_tabel, COUNT(*) AS jumlah_data FROM `user_scope_assignments`
UNION ALL
SELECT 'mst_navigation' AS nama_tabel, COUNT(*) AS jumlah_data FROM `mst_navigation`;

-- 2. Cek Struktur Cabang & Wilayah
SELECT `id`, `kode_cabang`, `nama_hotel`, `company_id`, `org_node_id`, `is_active`
FROM `mst_cabang`
WHERE `deleted_at` IS NULL
ORDER BY `id` ASC
LIMIT 5;

-- 3. Cek Shift Kasir Aktif
SELECT `id`, `kode_cabang`, `kode_shift`, `nama_shift`, `waktu_mulai`, `waktu_selesai`, `is_night_audit`
FROM `mst_shift`
ORDER BY `kode_cabang` ASC, `urutan` ASC;
