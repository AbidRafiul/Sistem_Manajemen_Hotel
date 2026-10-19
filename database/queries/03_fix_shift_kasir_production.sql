-- ====================================================================
-- SKRIP PERBAIKAN SHIFT KASIR & SINKRONISASI RESERVASI (PRODUCTION)
-- File         : 03_fix_shift_kasir_production.sql
-- Compatibility: MySQL 8.0+ / MariaDB / Railway Production / DBeaver
-- Keterangan   : Menambahkan kolom integrasi shift pada trx_checkin, trx_checkout,
--                trx_folio_charge, trx_cashier_shift, menutup shift gantung lama,
--                dan memastikan sequence FMT-SHIFT aktif.
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- --------------------------------------------------------------------
-- [LANGKAH 1] TAMBAH KOLOM PADA TABEL `trx_cashier_shift`
-- --------------------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_cashier_shift' AND COLUMN_NAME = 'sesi');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_cashier_shift` ADD COLUMN `sesi` VARCHAR(50) NOT NULL DEFAULT \'pagi\' AFTER `kode_cashier_counter`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_cashier_shift' AND COLUMN_NAME = 'catatan_handover');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_cashier_shift` ADD COLUMN `catatan_handover` TEXT NULL AFTER `cash_difference`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- --------------------------------------------------------------------
-- [LANGKAH 2] TAMBAH KOLOM PADA TABEL `trx_checkin`
-- --------------------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkin' AND COLUMN_NAME = 'kode_cashier_shift');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkin` ADD COLUMN `kode_cashier_shift` VARCHAR(50) NULL AFTER `early_checkin`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkin' AND COLUMN_NAME = 'guest_count');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkin` ADD COLUMN `guest_count` INT NOT NULL DEFAULT 1 AFTER `kode_cashier_shift`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- --------------------------------------------------------------------
-- [LANGKAH 3] TAMBAH KOLOM PADA TABEL `trx_checkout`
-- --------------------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND COLUMN_NAME = 'kode_cashier_shift');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkout` ADD COLUMN `kode_cashier_shift` VARCHAR(50) NULL AFTER `grand_total`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND COLUMN_NAME = 'guest_count');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkout` ADD COLUMN `guest_count` INT NOT NULL DEFAULT 1 AFTER `kode_cashier_shift`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- --------------------------------------------------------------------
-- [LANGKAH 4] TAMBAH KOLOM PADA TABEL `trx_folio_charge`
-- --------------------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'kode_cashier_shift');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_folio_charge` ADD COLUMN `kode_cashier_shift` VARCHAR(50) NULL AFTER `kode_ref_source`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- --------------------------------------------------------------------
-- [LANGKAH 5] TAMBAH INDEKS PERFORMA QUERY SHIFT
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- [LANGKAH 6] PASTIKAN FORMAT PENOMORAN `FMT-SHIFT` TERSEDIA
-- --------------------------------------------------------------------
INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`, `created_at`, `updated_at`)
VALUES ('FMT-SHIFT', 'trx_cashier_shift', 'SFT', 4, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `is_active` = 1;

-- --------------------------------------------------------------------
-- [LANGKAH 7] TUTUP (AUTO-CLOSE) SHIFT GANTUNG LAMA YANG MASIH OPEN
-- Menutup shift gantung terdahulu (seperti SFT-B001 dari seeder lama)
-- agar kasir dapat langsung membuka sesi kerja baru secara bersih.
-- --------------------------------------------------------------------
UPDATE `trx_cashier_shift`
SET 
  `status` = 'closed',
  `closed_at` = COALESCE(`closed_at`, NOW()),
  `closing_cash` = COALESCE(`closing_cash`, `opening_cash`),
  `system_cash` = COALESCE(`system_cash`, `opening_cash`),
  `cash_difference` = 0.00,
  `catatan_handover` = 'Auto-closed oleh skrip maintenance untuk mereset sesi kerja'
WHERE `status` = 'open';

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------------------
-- [LANGKAH 8] VERIFIKASI KESIAPAN SISTEM SHIFT
-- --------------------------------------------------------------------
SELECT 
  'trx_cashier_shift' AS `tabel`,
  COUNT(*) AS `total_baris`,
  SUM(CASE WHEN `status` = 'open' THEN 1 ELSE 0 END) AS `shift_open`,
  SUM(CASE WHEN `status` = 'closed' THEN 1 ELSE 0 END) AS `shift_closed`
FROM `trx_cashier_shift`;
