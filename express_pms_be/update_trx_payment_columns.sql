-- ==============================================================================
-- SQL MIGRATION SCRIPT: Add bank_name & card_type to trx_payment
-- Digunakan untuk memastikan kolom bank_name dan card_type tersedia di tabel trx_payment
-- PT Marstech Global - Sistem Manajemen Hotel (PMS)
-- ==============================================================================

SET @dbname = DATABASE();
SET @tablename = 'trx_payment';

-- 1. Tambah kolom bank_name jika belum ada
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'bank_name'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `trx_payment` ADD COLUMN `bank_name` VARCHAR(50) NULL AFTER `payment_method`;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Tambah kolom card_type jika belum ada
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'card_type'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `trx_payment` ADD COLUMN `card_type` VARCHAR(20) NULL AFTER `bank_name`;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Tambah kolom updated_at pada trx_folio_charge jika belum ada
SET @tablename_fc = 'trx_folio_charge';
SET @preparedStatement_fc = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename_fc
      AND COLUMN_NAME = 'updated_at'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `trx_folio_charge` ADD COLUMN `updated_at` DATETIME NULL AFTER `is_active`;'
));
PREPARE alterIfNotExists_fc FROM @preparedStatement_fc;
EXECUTE alterIfNotExists_fc;
DEALLOCATE PREPARE alterIfNotExists_fc;

