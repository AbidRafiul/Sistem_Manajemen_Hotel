-- ==============================================================================
-- SQL UPDATE SCRIPT: Master Data Tamu (mst_guest)
-- Digunakan untuk update struktur database pada Railway (MySQL / MariaDB)
-- PT Marstech Global - Sistem Manajemen Hotel
-- ==============================================================================

-- 1. Tambah Kolom-Kolom Master Tamu pada tabel mst_guest
ALTER TABLE `mst_guest`
  ADD COLUMN IF NOT EXISTS `title` VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS `first_name` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `last_name` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `birth_date` DATE NULL,
  ADD COLUMN IF NOT EXISTS `gender` ENUM('L','P') NULL,
  ADD COLUMN IF NOT EXISTS `identity_file_path` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `passport_no` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `passport_issuing_country` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `passport_expiry` DATE NULL,
  ADD COLUMN IF NOT EXISTS `visa_type` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `visa_no` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `arrival_date_indonesia` DATE NULL,
  ADD COLUMN IF NOT EXISTS `purpose_of_visit` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `guest_type` ENUM('individual','corporate','travel_agent','group') NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS `vip_level` ENUM('none','vip','vvip','owner') NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS `blacklist_by` BIGINT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `blacklist_at` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `company_id` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `loyalty_tier` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `preferences` JSON NULL,
  ADD COLUMN IF NOT EXISTS `internal_notes` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `consent_marketing` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `consent_at` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `total_night` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `avg_adr` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS `last_stay_date` DATE NULL,
  ADD COLUMN IF NOT EXISTS `source` ENUM('front_office','manual_input','ota_import') NOT NULL DEFAULT 'manual_input',
  ADD COLUMN IF NOT EXISTS `completeness_score` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `is_merged` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `merged_into_guest_id` VARCHAR(50) NULL;

-- 2. Tambah Index untuk Optimasi Pencarian & Query Performance (Abaikan error jika index sudah ada)
ALTER TABLE `mst_guest` ADD INDEX `idx_guest_phone` (`phone`);
ALTER TABLE `mst_guest` ADD INDEX `idx_guest_email` (`email`);
ALTER TABLE `mst_guest` ADD INDEX `idx_guest_id_number` (`id_number`);
ALTER TABLE `mst_guest` ADD INDEX `idx_guest_full_name` (`full_name`);
ALTER TABLE `mst_guest` ADD INDEX `idx_guest_nationality` (`nationality`);
ALTER TABLE `mst_guest` ADD INDEX `idx_guest_is_blacklist` (`is_blacklisted`);
ALTER TABLE `mst_guest` ADD INDEX `idx_guest_last_stay_date` (`last_stay_date`);
