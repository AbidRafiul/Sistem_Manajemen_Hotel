-- ====================================================================
-- [BAGIAN 1 / 2] SKEMA & STRUKTUR TABEL (DDL ONLY)
-- File: 01_schema_migration.sql
-- Generated: 2026-09-22T06:11:28.844Z
-- Compatibility: MySQL 8.0+ / Railway MySQL / DBeaver
-- Eksekusi file ini PERTAMA di DBeaver (Cukup 1-2 detik)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- 1. Tabel companies
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

-- 2. Tabel org_nodes
CREATE TABLE IF NOT EXISTS `org_nodes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL,
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

-- 3. Tabel user_scope_assignments (TINYINT tanpa display width)
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

-- 4. Tabel log (Error & Request Logging Sistem)
CREATE TABLE IF NOT EXISTS `log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Tgl` DATETIME NULL,
  `Controller` VARCHAR(255) NULL,
  `Function` VARCHAR(255) NULL,
  `Request` LONGTEXT NULL,
  `Response` LONGTEXT NULL,
  `Stack` LONGTEXT NULL,
  `User` VARCHAR(100) NULL,
  `DateTime` DATETIME NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel log_perubahan (Audit Trail Perubahan Data)
CREATE TABLE IF NOT EXISTS `log_perubahan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `keterangan` TEXT NULL,
  `nama_tabel` VARCHAR(100) NULL,
  `kode_referensi` VARCHAR(100) NULL,
  `aksi` VARCHAR(50) NULL,
  `data_sebelum` LONGTEXT NULL,
  `data_sesudah` LONGTEXT NULL,
  `tz` VARCHAR(50) NOT NULL DEFAULT 'UTC',
  `created_by` VARCHAR(100) NULL,
  `created_at` DATETIME NULL,
  `created_at_eng` DATETIME NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ALTER TABLE: Menambahkan Kolom Hierarchy pada mst_cabang & mst_user (Idempoten via Dynamic SQL)
-- Kolom mst_cabang.company_id
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_cabang' AND COLUMN_NAME = 'company_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_cabang` ADD COLUMN `company_id` BIGINT UNSIGNED NULL DEFAULT 1 AFTER `id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- Kolom mst_cabang.org_node_id
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_cabang' AND COLUMN_NAME = 'org_node_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_cabang` ADD COLUMN `org_node_id` BIGINT UNSIGNED NULL AFTER `company_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- Kolom mst_user.company_id
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'company_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `company_id` BIGINT UNSIGNED NULL DEFAULT 1 AFTER `role`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- Kolom mst_user.default_branch_id
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'default_branch_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `default_branch_id` BIGINT UNSIGNED NULL AFTER `company_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- Kolom mst_user.org_node_id
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'org_node_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `org_node_id` BIGINT UNSIGNED NULL AFTER `default_branch_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- Kolom mst_user.can_switch_branch
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'can_switch_branch');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `can_switch_branch` TINYINT NOT NULL DEFAULT 0 AFTER `org_node_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- Kolom mst_amenity.harga
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_amenity' AND COLUMN_NAME = 'harga');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_amenity` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `icon`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- Kolom mst_fasilitas.harga
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_fasilitas' AND COLUMN_NAME = 'harga');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_fasilitas` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `name`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mst_room_type_amenity` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_rta` VARCHAR(50) NOT NULL,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `kode_amenity` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rta` (`kode_tipe_kamar`, `kode_amenity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mst_room_type_fasilitas` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `kode_fasilitas` VARCHAR(50) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rtf` (`kode_tipe_kamar`, `kode_fasilitas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`, `created_at`, `updated_at`)
VALUES ('FMT-MSTSHIFT', 'mst_shift', 'SFT', 4, 6, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `is_active` = 1;

INSERT INTO `mst_shift` (`kode_cabang`, `kode_shift`, `nama_shift`, `waktu_mulai`, `waktu_selesai`, `default_opening_cash`, `is_night_audit`, `urutan`, `is_active`, `created_at`, `updated_at`)
VALUES 
  ('CAB0001', 'SFT-B001', 'Shift 1 – Pagi (Morning)', '07:00:00', '15:00:00', 1000000.00, 0, 1, 1, NOW(), NOW()),
  ('CAB0001', 'SFT-B002', 'Shift 2 – Sore (Evening)', '15:00:00', '23:00:00', 1000000.00, 0, 2, 1, NOW(), NOW()),
  ('CAB0001', 'SFT-B003', 'Shift 3 – Malam (Night Audit)', '23:00:00', '07:00:00', 1000000.00, 1, 3, 1, NOW(), NOW()),
  ('CAB0002', 'SFT-C001', 'Shift 1 – Pagi (Morning)', '07:00:00', '15:00:00', 1000000.00, 0, 1, 1, NOW(), NOW()),
  ('CAB0002', 'SFT-C002', 'Shift 2 – Sore (Evening)', '15:00:00', '23:00:00', 1000000.00, 0, 2, 1, NOW(), NOW()),
  ('CAB0002', 'SFT-C003', 'Shift 3 – Malam (Night Audit)', '23:00:00', '07:00:00', 1000000.00, 1, 3, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `nama_shift` = VALUES(`nama_shift`),
  `waktu_mulai` = VALUES(`waktu_mulai`),
  `waktu_selesai` = VALUES(`waktu_selesai`),
  `default_opening_cash` = VALUES(`default_opening_cash`),
  `is_night_audit` = VALUES(`is_night_audit`),
  `urutan` = VALUES(`urutan`);

SET FOREIGN_KEY_CHECKS = 1;
-- ====================================================================
-- SELESAI BAGIAN 1: STRUKTUR TABEL BERHASIL DISIAPKAN
-- ====================================================================