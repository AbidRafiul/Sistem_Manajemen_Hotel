-- ====================================================================
-- MIGRASI IDEMPOTEN: Fitur Night Audit & Posting Biaya Kamar Harian
-- File: migration_night_audit.sql
-- Database: hotel_pms (MySQL 8.0+)
-- ====================================================================

-- 1. Tabel sys_business_date
CREATE TABLE IF NOT EXISTS `sys_business_date` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `current_business_date` DATE NOT NULL,
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `last_audit_id` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sys_business_date_cabang` (`kode_cabang`),
  CONSTRAINT `fk_sys_business_date_cabang` FOREIGN KEY (`kode_cabang`) REFERENCES `mst_cabang` (`kode_cabang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Inisialisasi sys_business_date untuk semua cabang aktif jika belum ada
INSERT INTO `sys_business_date` (`kode_cabang`, `current_business_date`, `is_locked`, `created_at`)
SELECT c.`kode_cabang`, '2026-10-05', 0, NOW()
FROM `mst_cabang` c
WHERE c.`is_active` = 1 AND c.`deleted_at` IS NULL
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- 2. Tabel trx_night_audit_item
CREATE TABLE IF NOT EXISTS `trx_night_audit_item` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_night_audit` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `business_date` DATE NOT NULL,
  `kode_reservation` VARCHAR(50) NOT NULL,
  `kode_reservasi_room` VARCHAR(50) NOT NULL,
  `kode_kamar` VARCHAR(50) NULL,
  `rate_applied` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `service_charge_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('POSTED', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'POSTED',
  `error_message` TEXT NULL,
  `kode_folio_charge` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nai_audit` (`kode_night_audit`),
  KEY `idx_nai_status` (`status`),
  KEY `idx_nai_res_date` (`kode_reservation`, `business_date`),
  KEY `idx_nai_room_date` (`kode_reservasi_room`, `business_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Penyesuaian Kolom pada trx_night_audit
-- Perbarui ENUM status
ALTER TABLE `trx_night_audit` 
MODIFY COLUMN `status` ENUM('pending', 'running', 'completed', 'completed_with_exceptions', 'failed', 'reopened') NOT NULL DEFAULT 'running';

-- Kolom triggered_by
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'triggered_by');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `triggered_by` ENUM('manual','scheduled') NOT NULL DEFAULT 'manual' AFTER `run_by`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom total_in_house
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_in_house');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_in_house` INT NOT NULL DEFAULT 0 AFTER `triggered_by`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom total_posted
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_posted');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_posted` INT NOT NULL DEFAULT 0 AFTER `total_in_house`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom total_failed
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_failed');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_failed` INT NOT NULL DEFAULT 0 AFTER `total_posted`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom total_room_revenue
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_room_revenue');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_room_revenue` DECIMAL(16,2) NOT NULL DEFAULT 0.00 AFTER `total_failed`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom total_tax
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_tax');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_tax` DECIMAL(16,2) NOT NULL DEFAULT 0.00 AFTER `total_room_revenue`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom total_service
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_service');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_service` DECIMAL(16,2) NOT NULL DEFAULT 0.00 AFTER `total_tax`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom total_no_show
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_no_show');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_no_show` INT NOT NULL DEFAULT 0 AFTER `total_service`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom warnings_acknowledged
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'warnings_acknowledged');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `warnings_acknowledged` JSON NULL AFTER `total_no_show`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom idempotency_key
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'idempotency_key');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `idempotency_key` VARCHAR(100) NULL AFTER `warnings_acknowledged`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom report_snapshots
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'report_snapshots');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `report_snapshots` LONGTEXT NULL AFTER `idempotency_key`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 4. Penyesuaian Kolom pada trx_folio_charge
-- Kolom business_date
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'business_date');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_folio_charge` ADD COLUMN `business_date` DATE NULL AFTER `amount`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom source
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'source');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_folio_charge` ADD COLUMN `source` ENUM('NIGHT_AUDIT', 'MANUAL', 'CHECKIN', 'CHECKIN_LEGACY', 'ADJUSTMENT') NOT NULL DEFAULT 'MANUAL' AFTER `business_date`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom kode_night_audit
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'kode_night_audit');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_folio_charge` ADD COLUMN `kode_night_audit` VARCHAR(50) NULL AFTER `source`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom reversal_of_id
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'reversal_of_id');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_folio_charge` ADD COLUMN `reversal_of_id` BIGINT UNSIGNED NULL AFTER `kode_night_audit`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom reversal_reason
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'reversal_reason');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_folio_charge` ADD COLUMN `reversal_reason` TEXT NULL AFTER `reversal_of_id`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Indeks idempotency pada trx_folio_charge
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND INDEX_NAME = 'idx_fc_idempotent');
SET @stmt_sql := IF(@idx_exists = 0, "ALTER TABLE `trx_folio_charge` ADD INDEX `idx_fc_idempotent` (`kode_folio`, `kode_ref_source`, `business_date`, `charge_type`, `source`)", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 5. Penyesuaian Kolom pada trx_reservation dan trx_reservation_room (Legacy Upfront Protection)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservation' AND COLUMN_NAME = 'is_charged_upfront');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_reservation` ADD COLUMN `is_charged_upfront` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservation_room' AND COLUMN_NAME = 'is_charged_upfront');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_reservation_room` ADD COLUMN `is_charged_upfront` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 6. Format Sequence Penomoran
INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`, `created_at`)
VALUES ('FMT-NIGHTAUDIT', 'trx_night_audit', 'NA', 4, 0, 1, NOW())
ON DUPLICATE KEY UPDATE `is_active` = 1;

SELECT 'MIGRASI NIGHT AUDIT BERHASIL DIJALANKAN' as status;
