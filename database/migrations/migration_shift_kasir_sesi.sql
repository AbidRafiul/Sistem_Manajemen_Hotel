-- ====================================================================
-- PEMBARUAN DATABASE: SISTEM SHIFT KASIR TERINTEGRASI (SESI & OPERASIONAL)
-- File: migration_shift_kasir_sesi.sql
-- Sifat: 100% IDEMPOTENT (Aman dijalankan berulang kali)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tambah kolom `sesi` dan `catatan_handover` pada `trx_cashier_shift`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_cashier_shift' AND COLUMN_NAME = 'sesi');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_cashier_shift` ADD COLUMN `sesi` VARCHAR(50) NOT NULL DEFAULT \'pagi\' AFTER `kode_cashier_counter`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_cashier_shift' AND COLUMN_NAME = 'catatan_handover');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_cashier_shift` ADD COLUMN `catatan_handover` TEXT NULL AFTER `cash_difference`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;


-- 2. Tambah kolom `kode_cashier_shift` dan `guest_count` pada `trx_checkin`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkin' AND COLUMN_NAME = 'kode_cashier_shift');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkin` ADD COLUMN `kode_cashier_shift` VARCHAR(50) NULL AFTER `early_checkin`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkin' AND COLUMN_NAME = 'guest_count');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkin` ADD COLUMN `guest_count` INT NOT NULL DEFAULT 1 AFTER `kode_cashier_shift`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;


-- 3. Tambah kolom `kode_cashier_shift` dan `guest_count` pada `trx_checkout`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND COLUMN_NAME = 'kode_cashier_shift');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkout` ADD COLUMN `kode_cashier_shift` VARCHAR(50) NULL AFTER `grand_total`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND COLUMN_NAME = 'guest_count');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkout` ADD COLUMN `guest_count` INT NOT NULL DEFAULT 1 AFTER `kode_cashier_shift`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;


-- 4. Tambah kolom `kode_cashier_shift` pada `trx_folio_charge`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'kode_cashier_shift');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_folio_charge` ADD COLUMN `kode_cashier_shift` VARCHAR(50) NULL AFTER `kode_ref_source`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 5. Tambahkan Indeks untuk Performa Query Shift (Idempoten via Dynamic SQL)
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkin' AND INDEX_NAME = 'idx_checkin_shift');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_checkin` ADD INDEX `idx_checkin_shift` (`kode_cashier_shift`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND INDEX_NAME = 'idx_checkout_shift');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_checkout` ADD INDEX `idx_checkout_shift` (`kode_cashier_shift`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND INDEX_NAME = 'idx_folio_charge_shift');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_folio_charge` ADD INDEX `idx_folio_charge_shift` (`kode_cashier_shift`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_payment' AND INDEX_NAME = 'idx_payment_shift');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_payment` ADD INDEX `idx_payment_shift` (`kode_cashier_shift`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET FOREIGN_KEY_CHECKS = 1;
