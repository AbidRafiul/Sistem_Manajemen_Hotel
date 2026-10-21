-- ===================================================================================
-- SKRIP PERBAIKAN PRODUKSI:
-- FIX PEMBAYARAN WALK-IN / RESERVASI / CHECKOUT (Unknown column 'bank_name' in 'field list')
-- 
-- Target Database : Railway MySQL / Produksi (pms_hotel)
-- Sifat Eksekusi  : 100% IDEMPOTEN & AMAN (Bisa dijalankan berulang tanpa error)
-- File            : database/queries/06_fix_trx_payment_columns_production.sql
-- ===================================================================================

-- -----------------------------------------------------------------------------------
-- [BAGIAN 1] UPDATE TABEL `trx_payment`
-- Menambahkan kolom bank_name, card_type, dan memperluas ENUM payment_method (QRIS)
-- -----------------------------------------------------------------------------------

-- 1.1 Tambah kolom `bank_name` jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_payment' AND COLUMN_NAME = 'bank_name');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_payment` ADD COLUMN `bank_name` VARCHAR(50) NULL AFTER `payment_method`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 1.2 Tambah kolom `card_type` jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_payment' AND COLUMN_NAME = 'card_type');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_payment` ADD COLUMN `card_type` VARCHAR(20) NULL AFTER `bank_name`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 1.3 Perluas ENUM `payment_method` agar mendukung 'qris'
ALTER TABLE `trx_payment` 
MODIFY COLUMN `payment_method` ENUM('cash','card','transfer','edc','deposit','voucher','qris') NOT NULL DEFAULT 'cash';

-- -----------------------------------------------------------------------------------
-- [BAGIAN 2] UPDATE TABEL `trx_folio_charge`
-- Memastikan kolom `updated_at` tersedia
-- -----------------------------------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'updated_at');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_folio_charge` ADD COLUMN `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP AFTER `is_active`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- -----------------------------------------------------------------------------------
-- [BAGIAN 3] VERIFIKASI HASIL EKSEKUSI
-- -----------------------------------------------------------------------------------
SELECT 
  'trx_payment' AS table_name,
  SUM(CASE WHEN COLUMN_NAME = 'bank_name' THEN 1 ELSE 0 END) AS has_bank_name,
  SUM(CASE WHEN COLUMN_NAME = 'card_type' THEN 1 ELSE 0 END) AS has_card_type,
  SUM(CASE WHEN COLUMN_NAME = 'payment_method' THEN 1 ELSE 0 END) AS has_payment_method,
  1 AS has_updated_at
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_payment'

UNION ALL

SELECT 
  'trx_folio_charge' AS table_name,
  1 AS has_bank_name,
  1 AS has_card_type,
  1 AS has_payment_method,
  SUM(CASE WHEN COLUMN_NAME = 'updated_at' THEN 1 ELSE 0 END) AS has_updated_at
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge';
