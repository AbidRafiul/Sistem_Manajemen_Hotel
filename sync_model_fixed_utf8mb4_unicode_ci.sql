-- MySQL Workbench Synchronization
-- Generated: 2026-08-20 09:44
-- Model: New Model
-- Version: 1.0
-- Project: Name of the project
-- Author: HP

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

ALTER TABLE `hotel_pms`.`mst_harga_kamar` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `hotel_pms`.`mst_hotel` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `hotel_pms`.`mst_perusahaan` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `hotel_pms`.`mst_role` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `hotel_pms`.`mst_tamu` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `hotel_pms`.`mst_tenant` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `hotel_pms`.`mst_user` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `hotel_pms`.`trx_reservasi` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `hotel_pms`.`trx_reservasi_kamar` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `hotel_pms`.`trx_tugas_kebersihan` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `hotel_pms`.`mst_amenity` 
COLLATE = utf8mb4_unicode_ci ,
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL DEFAULT NULL ;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_bed_type` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_bed_type` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_bed_type` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_cabang` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `nama_hotel` VARCHAR(150) NOT NULL,
  `logo_url` VARCHAR(255) NULL DEFAULT NULL,
  `alamat` TEXT NULL DEFAULT NULL,
  `telepon` VARCHAR(30) NULL DEFAULT NULL,
  `waktu_checkin` TIME NOT NULL DEFAULT '14:00:00',
  `waktu_checkout` TIME NOT NULL DEFAULT '12:00:00',
  `zona_waktu` VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',
  `is_pkp` TINYINT(1) NOT NULL DEFAULT '0',
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_cabang` ASC),
  UNIQUE INDEX `uq_hotel_tenant_code` (`kode_cabang` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_cashier_counter` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_counter` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_counter` ASC),
  UNIQUE INDEX `uq_counter` (`kode_cabang` ASC, `kode_counter` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_channel_rate_mapping` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_mapping` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_rate_plan` VARCHAR(50) NOT NULL,
  `channel` ENUM('booking_com', 'agoda', 'traveloka', 'expedia', 'airbnb') NOT NULL,
  `channel_rate_plan_id` VARCHAR(100) NOT NULL,
  `is_sync_enabled` TINYINT(1) NOT NULL DEFAULT '1',
  `last_synced_at` DATETIME NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_mapping` ASC),
  INDEX `fk_channel_map_hotel` (`kode_cabang` ASC),
  INDEX `fk_channel_map_rate_plan` (`kode_rate_plan` ASC),
  CONSTRAINT `fk_channel_map_rate_plan`
    FOREIGN KEY (`kode_rate_plan`)
    REFERENCES `hotel_pms`.`mst_paket_harga` (`kode_paket_harga`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_corporate_account` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_corporate` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `account_type` ENUM('corporate', 'travel_agent', 'ota') NOT NULL,
  `npwp` VARCHAR(30) NULL DEFAULT NULL,
  `billing_address` TEXT NULL DEFAULT NULL,
  `payment_term_days` INT(11) NOT NULL DEFAULT '30',
  `commission_pct` DECIMAL(5,2) NULL DEFAULT NULL,
  `contact_person` VARCHAR(100) NULL DEFAULT NULL,
  `contact_phone` VARCHAR(30) NULL DEFAULT NULL,
  `contact_email` VARCHAR(100) NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_corporate` ASC),
  UNIQUE INDEX `uq_corp_account` (`kode_cabang` ASC, `kode_corporate` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_currency_rate` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_currency_rate` VARCHAR(50) NOT NULL,
  `from_currency` VARCHAR(10) NOT NULL,
  `to_currency` VARCHAR(10) NOT NULL,
  `rate` DECIMAL(18,6) NOT NULL,
  `effective_date` DATE NOT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_currency_rate` (`from_currency` ASC, `to_currency` ASC, `effective_date` ASC),
  UNIQUE INDEX `uq_kode` (`kode_currency_rate` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_document_type` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_document_type` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_document_type` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_fasilitas` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_fasilitas` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_fasilitas` ASC),
  UNIQUE INDEX `uq_fasilitas` (`kode_cabang` ASC, `kode_fasilitas` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_fiscal_document_setup` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_fiscal_setup` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `doc_type` ENUM('invoice', 'receipt', 'tax_invoice', 'credit_note', 'debit_note') NOT NULL,
  `prefix` VARCHAR(20) NOT NULL,
  `running_number` BIGINT(19) UNSIGNED NOT NULL DEFAULT '0',
  `reset_period` ENUM('never', 'yearly', 'monthly') NOT NULL DEFAULT 'yearly',
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_fiscal_setup` ASC),
  UNIQUE INDEX `uq_fiscal_setup` (`kode_cabang` ASC, `doc_type` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_gedung` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_gedung` VARCHAR(50) NOT NULL,
  `nama_gedung` VARCHAR(100) NOT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_gedung` ASC),
  UNIQUE INDEX `uq_building` (`kode_cabang` ASC, `kode_gedung` ASC),
  CONSTRAINT `fk_building_hotel`
    FOREIGN KEY (`kode_cabang`)
    REFERENCES `hotel_pms`.`mst_cabang` (`kode_cabang`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_guest` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_tamu` VARCHAR(50) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `id_type` ENUM('ktp', 'passport', 'sim', 'other') NOT NULL DEFAULT 'ktp',
  `id_number` VARCHAR(50) NULL DEFAULT NULL,
  `nationality` VARCHAR(50) NULL DEFAULT NULL,
  `email` VARCHAR(100) NULL DEFAULT NULL,
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `is_vip` TINYINT(1) NOT NULL DEFAULT '0',
  `is_blacklisted` TINYINT(1) NOT NULL DEFAULT '0',
  `blacklist_reason` VARCHAR(255) NULL DEFAULT NULL,
  `total_stay` INT(11) NOT NULL DEFAULT '0',
  `total_spending` DECIMAL(16,2) NOT NULL DEFAULT '0.00',
  `kode_favorite_room_type` VARCHAR(50) NULL DEFAULT NULL,
  `ref_crm_customer_id` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_tamu` ASC),
  UNIQUE INDEX `uq_guest_hotel_code` (`kode_cabang` ASC, `kode_tamu` ASC),
  INDEX `idx_guest_tenant_lookup` (`id_number` ASC, `phone` ASC),
  INDEX `fk_guest_fav_room_type` (`kode_favorite_room_type` ASC),
  CONSTRAINT `fk_guest_fav_room_type`
    FOREIGN KEY (`kode_favorite_room_type`)
    REFERENCES `hotel_pms`.`mst_tipe_kamar` (`kode_tipe_kamar`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_holiday` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_holiday` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `holiday_date` DATE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `is_long_weekend` TINYINT(1) NOT NULL DEFAULT '0',
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_holiday` ASC),
  UNIQUE INDEX `uq_holiday` (`kode_cabang` ASC, `holiday_date` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_lantai` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_gedung` VARCHAR(50) NOT NULL,
  `kode_lantai` VARCHAR(50) NOT NULL,
  `nama_lantai` VARCHAR(100) NOT NULL,
  `nomor_lantai` INT(11) NOT NULL DEFAULT '1',
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_lantai` ASC),
  UNIQUE INDEX `uq_floor` (`kode_gedung` ASC, `kode_lantai` ASC),
  CONSTRAINT `fk_floor_building`
    FOREIGN KEY (`kode_gedung`)
    REFERENCES `hotel_pms`.`mst_gedung` (`kode_gedung`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

ALTER TABLE `hotel_pms`.`mst_navigation` 
ADD PRIMARY KEY USING BTREE (`id`);
;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_notification_setup` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_notif_setup` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `event_code` VARCHAR(50) NOT NULL,
  `channel` ENUM('email', 'whatsapp', 'push') NOT NULL,
  `template` TEXT NULL DEFAULT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT '1',
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_notif_setup` ASC),
  UNIQUE INDEX `uq_notif_setup` (`kode_cabang` ASC, `event_code` ASC, `channel` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_rate_plan_price` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_harga_price` VARCHAR(50) NOT NULL,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `kode_rate_plan` VARCHAR(50) NOT NULL,
  `kode_season` VARCHAR(50) NULL DEFAULT NULL,
  `price` DECIMAL(14,2) NOT NULL,
  `extra_bed_price` DECIMAL(14,2) NULL DEFAULT NULL,
  `valid_from` DATE NOT NULL,
  `valid_to` DATE NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_harga_price` ASC),
  INDEX `fk_rpp_rate_plan` (`kode_rate_plan` ASC),
  INDEX `fk_rpp_season` (`kode_season` ASC),
  INDEX `idx_rpp_lookup` (`kode_tipe_kamar` ASC, `kode_rate_plan` ASC, `valid_from` ASC, `valid_to` ASC),
  CONSTRAINT `fk_rpp_rate_plan`
    FOREIGN KEY (`kode_rate_plan`)
    REFERENCES `hotel_pms`.`mst_paket_harga` (`kode_paket_harga`),
  CONSTRAINT `fk_rpp_room_type`
    FOREIGN KEY (`kode_tipe_kamar`)
    REFERENCES `hotel_pms`.`mst_tipe_kamar` (`kode_tipe_kamar`),
  CONSTRAINT `fk_rpp_season`
    FOREIGN KEY (`kode_season`)
    REFERENCES `hotel_pms`.`mst_musim` (`kode_musim`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_rate_plan_template` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_harga_template` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `plan_type` ENUM('bar', 'promo', 'corporate', 'ota', 'travel_agent') NOT NULL DEFAULT 'bar',
  `dapat_di_refund` TINYINT(1) NOT NULL DEFAULT '1',
  `include_breakfast` TINYINT(1) NOT NULL DEFAULT '0',
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_harga_template` ASC),
  UNIQUE INDEX `uq_rate_template` (`kode_harga_template` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_room_block` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_room_block` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `block_code` VARCHAR(30) NOT NULL,
  `block_name` VARCHAR(150) NOT NULL,
  `kode_corporate_account` VARCHAR(50) NULL DEFAULT NULL,
  `block_date_from` DATE NOT NULL,
  `block_date_to` DATE NOT NULL,
  `total_rooms_blocked` INT(11) NOT NULL DEFAULT '0',
  `rooming_list_deadline` DATE NULL DEFAULT NULL,
  `status` ENUM('tentative', 'confirmed', 'released', 'cancelled') NOT NULL DEFAULT 'tentative',
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_room_block` ASC),
  UNIQUE INDEX `uq_room_block` (`kode_cabang` ASC, `block_code` ASC),
  INDEX `fk_room_block_corp` (`kode_corporate_account` ASC),
  CONSTRAINT `fk_room_block_corp`
    FOREIGN KEY (`kode_corporate_account`)
    REFERENCES `hotel_pms`.`mst_corporate_account` (`kode_corporate`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_room_type_amenity` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_rta` VARCHAR(50) NOT NULL,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `kode_amenity` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_rta` ASC),
  UNIQUE INDEX `uq_rt_amenity` (`kode_tipe_kamar` ASC, `kode_amenity` ASC),
  INDEX `fk_rta_amenity` (`kode_amenity` ASC),
  CONSTRAINT `fk_rta_amenity`
    FOREIGN KEY (`kode_amenity`)
    REFERENCES `hotel_pms`.`mst_amenity` (`kode_amenity`),
  CONSTRAINT `fk_rta_room_type`
    FOREIGN KEY (`kode_tipe_kamar`)
    REFERENCES `hotel_pms`.`mst_tipe_kamar` (`kode_tipe_kamar`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_tax` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_pajak` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `tax_type` ENUM('tax', 'service_charge') NOT NULL,
  `percentage` DECIMAL(5,2) NOT NULL,
  `is_compounding` TINYINT(1) NOT NULL DEFAULT '0',
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_pajak` ASC),
  UNIQUE INDEX `uq_tax` (`kode_cabang` ASC, `kode_pajak` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`mst_voucher` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_voucher` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL,
  `discount_value` DECIMAL(14,2) NOT NULL,
  `valid_from` DATE NOT NULL,
  `valid_to` DATE NOT NULL,
  `usage_limit` INT(11) NULL DEFAULT NULL,
  `used_count` INT(11) NOT NULL DEFAULT '0',
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_voucher` ASC),
  UNIQUE INDEX `uq_voucher` (`kode_cabang` ASC, `kode_voucher` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`sys_format_penomoran` (
  `kode_format` VARCHAR(50) NOT NULL,
  `nama_tabel` VARCHAR(100) NOT NULL,
  `prefix` VARCHAR(20) NOT NULL,
  `panjang_digit` INT(11) NOT NULL DEFAULT '4',
  `nomor_terakhir` BIGINT(20) NOT NULL DEFAULT '0',
  `is_active` TINYINT(1) NULL DEFAULT '1',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`kode_format`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_cashier_shift` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_cashier_shift` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_cashier_counter` VARCHAR(50) NOT NULL,
  `user_id` BIGINT(19) UNSIGNED NOT NULL,
  `opening_cash` DECIMAL(14,2) NOT NULL DEFAULT '0.00',
  `closing_cash` DECIMAL(14,2) NULL DEFAULT NULL,
  `system_cash` DECIMAL(14,2) NULL DEFAULT NULL,
  `cash_difference` DECIMAL(14,2) NULL DEFAULT NULL,
  `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  `opened_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` DATETIME NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_cashier_shift` ASC),
  INDEX `fk_shift_hotel` (`kode_cabang` ASC),
  INDEX `fk_shift_counter` (`kode_cashier_counter` ASC),
  INDEX `fk_shift_user` (`user_id` ASC),
  CONSTRAINT `fk_shift_counter`
    FOREIGN KEY (`kode_cashier_counter`)
    REFERENCES `hotel_pms`.`mst_cashier_counter` (`kode_counter`),
  CONSTRAINT `fk_shift_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `hotel_pms`.`mst_user` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_checkout` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_checkout` VARCHAR(50) NOT NULL,
  `kode_reservation_room` VARCHAR(50) NOT NULL,
  `late_checkout` TINYINT(1) NOT NULL DEFAULT '0',
  `grand_total` DECIMAL(16,2) NOT NULL DEFAULT '0.00',
  `checkout_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `checkout_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_checkout` ASC),
  INDEX `fk_checkout_res_room` (`kode_reservation_room` ASC),
  CONSTRAINT `fk_checkout_res_room`
    FOREIGN KEY (`kode_reservation_room`)
    REFERENCES `hotel_pms`.`trx_reservation_room` (`kode_reservasi_room`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_extend_stay` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_extend_stay` VARCHAR(50) NOT NULL,
  `kode_reservation_room` VARCHAR(50) NOT NULL,
  `additional_nights` INT(11) NOT NULL,
  `new_checkout_date` DATE NOT NULL,
  `requested_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_extend_stay` ASC),
  INDEX `fk_extend_res_room` (`kode_reservation_room` ASC),
  CONSTRAINT `fk_extend_res_room`
    FOREIGN KEY (`kode_reservation_room`)
    REFERENCES `hotel_pms`.`trx_reservation_room` (`kode_reservasi_room`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_fiscal_document` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_fiscal_document` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_folio` VARCHAR(50) NOT NULL,
  `doc_type` ENUM('invoice', 'receipt', 'tax_invoice', 'credit_note', 'debit_note') NOT NULL,
  `doc_number` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(16,2) NOT NULL,
  `issued_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `issued_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pdf_url` VARCHAR(255) NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_fiscal_document` ASC),
  UNIQUE INDEX `uq_fiscal_doc` (`kode_cabang` ASC, `doc_number` ASC),
  INDEX `fk_fiscal_doc_folio` (`kode_folio` ASC),
  CONSTRAINT `fk_fiscal_doc_folio`
    FOREIGN KEY (`kode_folio`)
    REFERENCES `hotel_pms`.`trx_folio` (`kode_folio`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_folio_charge` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_folio_charge` VARCHAR(50) NOT NULL,
  `kode_folio` VARCHAR(50) NOT NULL,
  `charge_type` ENUM('room', 'restaurant', 'room_service', 'laundry', 'minibar', 'spa', 'parking', 'penalty', 'deposit', 'other') NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `qty` DECIMAL(10,2) NOT NULL DEFAULT '1.00',
  `unit_price` DECIMAL(14,2) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `ref_source_type` VARCHAR(30) NULL DEFAULT NULL,
  `kode_ref_source` VARCHAR(50) NULL DEFAULT NULL,
  `posted_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `posted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_folio_charge` ASC),
  INDEX `fk_folio_charge_folio` (`kode_folio` ASC),
  INDEX `idx_folio_charge_type` (`charge_type` ASC),
  CONSTRAINT `fk_folio_charge_folio`
    FOREIGN KEY (`kode_folio`)
    REFERENCES `hotel_pms`.`trx_folio` (`kode_folio`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_folio_split` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_folio_split` VARCHAR(50) NOT NULL,
  `kode_parent_folio` VARCHAR(50) NOT NULL,
  `kode_split_folio` VARCHAR(50) NOT NULL,
  `split_type` ENUM('per_guest', 'per_company', 'per_travel_agent', 'other') NOT NULL,
  `note` VARCHAR(255) NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_folio_split` ASC),
  INDEX `fk_split_parent` (`kode_parent_folio` ASC),
  INDEX `fk_split_child` (`kode_split_folio` ASC),
  CONSTRAINT `fk_split_child`
    FOREIGN KEY (`kode_split_folio`)
    REFERENCES `hotel_pms`.`trx_folio` (`kode_folio`),
  CONSTRAINT `fk_split_parent`
    FOREIGN KEY (`kode_parent_folio`)
    REFERENCES `hotel_pms`.`trx_folio` (`kode_folio`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_guest_document` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_guest_document` VARCHAR(50) NOT NULL,
  `kode_guest` VARCHAR(50) NOT NULL,
  `kode_checkin` VARCHAR(50) NULL DEFAULT NULL,
  `kode_document_type` VARCHAR(50) NOT NULL,
  `doc_number` VARCHAR(50) NULL DEFAULT NULL,
  `scan_url` VARCHAR(255) NOT NULL,
  `uploaded_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_guest_document` ASC),
  INDEX `fk_guest_doc_guest` (`kode_guest` ASC),
  INDEX `fk_guest_doc_checkin` (`kode_checkin` ASC),
  INDEX `fk_guest_doc_type` (`kode_document_type` ASC),
  CONSTRAINT `fk_guest_doc_checkin`
    FOREIGN KEY (`kode_checkin`)
    REFERENCES `hotel_pms`.`trx_checkin` (`kode_checkin`),
  CONSTRAINT `fk_guest_doc_guest`
    FOREIGN KEY (`kode_guest`)
    REFERENCES `hotel_pms`.`mst_guest` (`kode_tamu`),
  CONSTRAINT `fk_guest_doc_type`
    FOREIGN KEY (`kode_document_type`)
    REFERENCES `hotel_pms`.`mst_document_type` (`kode_document_type`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_guest_feedback` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_guest_feedback` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_reservation` VARCHAR(50) NULL DEFAULT NULL,
  `kode_guest` VARCHAR(50) NULL DEFAULT NULL,
  `category` ENUM('room', 'service', 'food', 'cleanliness', 'facility', 'other') NOT NULL DEFAULT 'other',
  `rating` TINYINT(3) UNSIGNED NULL DEFAULT NULL,
  `comment` TEXT NULL DEFAULT NULL,
  `is_complaint` TINYINT(1) NOT NULL DEFAULT '0',
  `followup_status` ENUM('open', 'in_progress', 'resolved') NULL DEFAULT NULL,
  `followup_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_guest_feedback` ASC),
  INDEX `fk_feedback_hotel` (`kode_cabang` ASC),
  INDEX `fk_feedback_reservation` (`kode_reservation` ASC),
  INDEX `fk_feedback_guest` (`kode_guest` ASC),
  CONSTRAINT `fk_feedback_guest`
    FOREIGN KEY (`kode_guest`)
    REFERENCES `hotel_pms`.`mst_guest` (`kode_tamu`),
  CONSTRAINT `fk_feedback_reservation`
    FOREIGN KEY (`kode_reservation`)
    REFERENCES `hotel_pms`.`trx_reservation` (`kode_reservasi`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_housekeeping_task` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_housekeeping_task` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_kamar` VARCHAR(50) NOT NULL,
  `task_type` ENUM('cleaning', 'inspection', 'maintenance_check') NOT NULL DEFAULT 'cleaning',
  `assigned_to` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `priority` ENUM('normal', 'urgent') NOT NULL DEFAULT 'normal',
  `status` ENUM('assigned', 'in_progress', 'finished', 'supervisor_approved') NOT NULL DEFAULT 'assigned',
  `photo_url` VARCHAR(255) NULL DEFAULT NULL,
  `supervisor_id` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `approved_at` DATETIME NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_housekeeping_task` ASC),
  INDEX `fk_hk_task_hotel` (`kode_cabang` ASC),
  INDEX `fk_hk_task_room` (`kode_kamar` ASC),
  CONSTRAINT `fk_hk_task_room`
    FOREIGN KEY (`kode_kamar`)
    REFERENCES `hotel_pms`.`mst_kamar` (`kode_kamar`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_journal_reference` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_journal_reference` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `source_type` ENUM('checkin_deposit', 'checkout_revenue', 'tax', 'refund', 'ta_commission', 'city_ledger') NOT NULL,
  `source_id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_ref_journal` VARCHAR(50) NULL DEFAULT NULL,
  `amount` DECIMAL(16,2) NOT NULL,
  `posted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_journal_reference` ASC),
  INDEX `fk_journal_ref_hotel` (`kode_cabang` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_laundry_order` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_laundry_order` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_reservation_room` VARCHAR(50) NOT NULL,
  `item_description` TEXT NOT NULL,
  `status` ENUM('received', 'in_process', 'done', 'posted') NOT NULL DEFAULT 'received',
  `amount` DECIMAL(14,2) NOT NULL DEFAULT '0.00',
  `kode_folio_charge` VARCHAR(50) NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_laundry_order` ASC),
  INDEX `fk_laundry_hotel` (`kode_cabang` ASC),
  INDEX `fk_laundry_res_room` (`kode_reservation_room` ASC),
  INDEX `fk_laundry_folio_charge` (`kode_folio_charge` ASC),
  CONSTRAINT `fk_laundry_folio_charge`
    FOREIGN KEY (`kode_folio_charge`)
    REFERENCES `hotel_pms`.`trx_folio_charge` (`kode_folio_charge`),
  CONSTRAINT `fk_laundry_res_room`
    FOREIGN KEY (`kode_reservation_room`)
    REFERENCES `hotel_pms`.`trx_reservation_room` (`kode_reservasi_room`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_lost_and_found` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_lost_and_found` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_kamar` VARCHAR(50) NULL DEFAULT NULL,
  `item_description` VARCHAR(255) NOT NULL,
  `photo_url` VARCHAR(255) NULL DEFAULT NULL,
  `found_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `found_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('stored', 'claimed', 'disposed') NOT NULL DEFAULT 'stored',
  `kode_claimed_by_guest` VARCHAR(50) NULL DEFAULT NULL,
  `claimed_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_lost_and_found` ASC),
  INDEX `fk_lnf_hotel` (`kode_cabang` ASC),
  INDEX `fk_lnf_room` (`kode_kamar` ASC),
  INDEX `fk_lnf_guest` (`kode_claimed_by_guest` ASC),
  CONSTRAINT `fk_lnf_guest`
    FOREIGN KEY (`kode_claimed_by_guest`)
    REFERENCES `hotel_pms`.`mst_guest` (`kode_tamu`),
  CONSTRAINT `fk_lnf_room`
    FOREIGN KEY (`kode_kamar`)
    REFERENCES `hotel_pms`.`mst_kamar` (`kode_kamar`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_maintenance_ticket` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_maintenance_ticket` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_kamar` VARCHAR(50) NULL DEFAULT NULL,
  `issue_type` VARCHAR(50) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `status` ENUM('open', 'in_progress', 'done') NOT NULL DEFAULT 'open',
  `reported_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `assigned_to` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `resolved_at` DATETIME NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_maintenance_ticket` ASC),
  INDEX `fk_maintenance_hotel` (`kode_cabang` ASC),
  INDEX `fk_maintenance_room` (`kode_kamar` ASC),
  CONSTRAINT `fk_maintenance_room`
    FOREIGN KEY (`kode_kamar`)
    REFERENCES `hotel_pms`.`mst_kamar` (`kode_kamar`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_minibar_consumption` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_minibar_consumption` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_reservation_room` VARCHAR(50) NOT NULL,
  `kode_ref_inventory_item` VARCHAR(50) NULL DEFAULT NULL,
  `item_name` VARCHAR(100) NOT NULL,
  `qty` INT(11) NOT NULL DEFAULT '1',
  `unit_price` DECIMAL(14,2) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `recorded_at_checkout` TINYINT(1) NOT NULL DEFAULT '1',
  `kode_folio_charge` VARCHAR(50) NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_minibar_consumption` ASC),
  INDEX `fk_minibar_hotel` (`kode_cabang` ASC),
  INDEX `fk_minibar_res_room` (`kode_reservation_room` ASC),
  INDEX `fk_minibar_folio_charge` (`kode_folio_charge` ASC),
  CONSTRAINT `fk_minibar_folio_charge`
    FOREIGN KEY (`kode_folio_charge`)
    REFERENCES `hotel_pms`.`trx_folio_charge` (`kode_folio_charge`),
  CONSTRAINT `fk_minibar_res_room`
    FOREIGN KEY (`kode_reservation_room`)
    REFERENCES `hotel_pms`.`trx_reservation_room` (`kode_reservasi_room`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_night_audit` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_night_audit` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `business_date` DATE NOT NULL,
  `status` ENUM('running', 'completed', 'failed') NOT NULL DEFAULT 'running',
  `room_charge_posted` TINYINT(1) NOT NULL DEFAULT '0',
  `business_date_updated` TINYINT(1) NOT NULL DEFAULT '0',
  `daily_report_generated` TINYINT(1) NOT NULL DEFAULT '0',
  `transaction_locked` TINYINT(1) NOT NULL DEFAULT '0',
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` DATETIME NULL DEFAULT NULL,
  `run_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `note` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_night_audit` ASC),
  UNIQUE INDEX `uq_night_audit` (`kode_cabang` ASC, `business_date` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_notification_log` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_notification_log` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `event_code` VARCHAR(50) NOT NULL,
  `channel` ENUM('email', 'whatsapp', 'push') NOT NULL,
  `recipient` VARCHAR(150) NOT NULL,
  `ref_type` VARCHAR(30) NULL DEFAULT NULL,
  `kode_ref` VARCHAR(50) NULL DEFAULT NULL,
  `status` ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  `sent_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_notification_log` ASC),
  INDEX `fk_notif_log_hotel` (`kode_cabang` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_payment` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_payment` VARCHAR(50) NOT NULL,
  `kode_folio` VARCHAR(50) NOT NULL,
  `payment_method` ENUM('cash', 'card', 'transfer', 'edc', 'deposit', 'voucher') NOT NULL,
  `kode_voucher` VARCHAR(50) NULL DEFAULT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `reference_no` VARCHAR(100) NULL DEFAULT NULL,
  `kode_cashier_shift` VARCHAR(50) NULL DEFAULT NULL,
  `received_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `paid_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_payment` ASC),
  INDEX `fk_payment_folio` (`kode_folio` ASC),
  INDEX `fk_payment_voucher` (`kode_voucher` ASC),
  INDEX `fk_payment_shift` (`kode_cashier_shift` ASC),
  CONSTRAINT `fk_payment_folio`
    FOREIGN KEY (`kode_folio`)
    REFERENCES `hotel_pms`.`trx_folio` (`kode_folio`),
  CONSTRAINT `fk_payment_shift`
    FOREIGN KEY (`kode_cashier_shift`)
    REFERENCES `hotel_pms`.`trx_cashier_shift` (`kode_cashier_shift`),
  CONSTRAINT `fk_payment_voucher`
    FOREIGN KEY (`kode_voucher`)
    REFERENCES `hotel_pms`.`mst_voucher` (`kode_voucher`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_refund` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_refund` VARCHAR(50) NOT NULL,
  `kode_folio` VARCHAR(50) NOT NULL,
  `kode_payment` VARCHAR(50) NULL DEFAULT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `refund_method` ENUM('cash', 'transfer', 'card_reversal') NOT NULL,
  `status` ENUM('requested', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'requested',
  `requested_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `approved_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `refunded_at` DATETIME NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_refund` ASC),
  INDEX `fk_refund_folio` (`kode_folio` ASC),
  INDEX `fk_refund_payment` (`kode_payment` ASC),
  CONSTRAINT `fk_refund_folio`
    FOREIGN KEY (`kode_folio`)
    REFERENCES `hotel_pms`.`trx_folio` (`kode_folio`),
  CONSTRAINT `fk_refund_payment`
    FOREIGN KEY (`kode_payment`)
    REFERENCES `hotel_pms`.`trx_payment` (`kode_payment`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_reservation` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_reservasi` VARCHAR(50) NOT NULL,
  `booking_type` ENUM('individual', 'group', 'corporate', 'walk_in') NOT NULL DEFAULT 'individual',
  `kode_guest` VARCHAR(50) NULL DEFAULT NULL,
  `kode_corporate_account` VARCHAR(50) NULL DEFAULT NULL,
  `kode_room_block` VARCHAR(50) NULL DEFAULT NULL,
  `group_code` VARCHAR(30) NULL DEFAULT NULL,
  `check_in_date` DATE NOT NULL,
  `check_out_date` DATE NOT NULL,
  `guest_count` INT(11) NOT NULL DEFAULT '1',
  `deposit_amount` DECIMAL(14,2) NOT NULL DEFAULT '0.00',
  `special_request` TEXT NULL DEFAULT NULL,
  `status` ENUM('reserved', 'confirmed', 'waiting_list', 'cancelled', 'no_show', 'checked_in', 'checked_out') NOT NULL DEFAULT 'reserved',
  `source_channel` ENUM('direct', 'walk_in', 'booking_com', 'agoda', 'traveloka', 'expedia', 'airbnb', 'other') NOT NULL DEFAULT 'direct',
  `ref_channel_booking_id` VARCHAR(100) NULL DEFAULT NULL,
  `cancellation_reason` VARCHAR(255) NULL DEFAULT NULL,
  `cancellation_penalty` DECIMAL(14,2) NULL DEFAULT NULL,
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_reservasi` ASC),
  UNIQUE INDEX `uq_reservation` (`kode_cabang` ASC, `kode_reservasi` ASC),
  INDEX `fk_reservation_guest` (`kode_guest` ASC),
  INDEX `fk_reservation_corp` (`kode_corporate_account` ASC),
  INDEX `fk_reservation_room_block` (`kode_room_block` ASC),
  INDEX `idx_reservation_dates` (`kode_cabang` ASC, `check_in_date` ASC, `check_out_date` ASC),
  INDEX `idx_reservation_group` (`group_code` ASC),
  CONSTRAINT `fk_reservation_corp`
    FOREIGN KEY (`kode_corporate_account`)
    REFERENCES `hotel_pms`.`mst_corporate_account` (`kode_corporate`),
  CONSTRAINT `fk_reservation_guest`
    FOREIGN KEY (`kode_guest`)
    REFERENCES `hotel_pms`.`mst_guest` (`kode_tamu`),
  CONSTRAINT `fk_reservation_room_block`
    FOREIGN KEY (`kode_room_block`)
    REFERENCES `hotel_pms`.`mst_room_block` (`kode_room_block`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_reservation_room` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_reservasi_room` VARCHAR(50) NOT NULL,
  `kode_reservation` VARCHAR(50) NOT NULL,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `kode_rate_plan` VARCHAR(50) NOT NULL,
  `kode_kamar` VARCHAR(50) NULL DEFAULT NULL,
  `room_preference` VARCHAR(100) NULL DEFAULT NULL,
  `rate_per_night` DECIMAL(14,2) NOT NULL,
  `nights` INT(11) NOT NULL,
  `status` ENUM('booked', 'assigned', 'checked_in', 'checked_out', 'room_moved') NOT NULL DEFAULT 'booked',
  `created_by` BIGINT(20) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` BIGINT(20) NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` BIGINT(20) NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  `version` INT(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_reservasi_room` ASC),
  INDEX `fk_res_room_reservation` (`kode_reservation` ASC),
  INDEX `fk_res_room_room_type` (`kode_tipe_kamar` ASC),
  INDEX `fk_res_room_rate_plan` (`kode_rate_plan` ASC),
  INDEX `fk_res_room_kamar` (`kode_kamar` ASC),
  CONSTRAINT `fk_res_room_rate_plan`
    FOREIGN KEY (`kode_rate_plan`)
    REFERENCES `hotel_pms`.`mst_paket_harga` (`kode_paket_harga`),
  CONSTRAINT `fk_res_room_reservation`
    FOREIGN KEY (`kode_reservation`)
    REFERENCES `hotel_pms`.`trx_reservation` (`kode_reservasi`),
  CONSTRAINT `fk_res_room_room`
    FOREIGN KEY (`kode_kamar`)
    REFERENCES `hotel_pms`.`mst_kamar` (`kode_kamar`),
  CONSTRAINT `fk_res_room_room_type`
    FOREIGN KEY (`kode_tipe_kamar`)
    REFERENCES `hotel_pms`.`mst_tipe_kamar` (`kode_tipe_kamar`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_reservation_status_log` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_reservasi_log` VARCHAR(50) NOT NULL,
  `kode_reservation` VARCHAR(50) NOT NULL,
  `status_from` VARCHAR(30) NULL DEFAULT NULL,
  `status_to` VARCHAR(30) NOT NULL,
  `note` VARCHAR(255) NULL DEFAULT NULL,
  `changed_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_reservasi_log` ASC),
  INDEX `fk_res_status_log_reservation` (`kode_reservation` ASC),
  CONSTRAINT `fk_res_status_log_reservation`
    FOREIGN KEY (`kode_reservation`)
    REFERENCES `hotel_pms`.`trx_reservation` (`kode_reservasi`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_room_move` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_room_move` VARCHAR(50) NOT NULL,
  `kode_reservation_room` VARCHAR(50) NOT NULL,
  `kode_from_room` VARCHAR(50) NOT NULL,
  `kode_to_room` VARCHAR(50) NOT NULL,
  `reason` VARCHAR(255) NULL DEFAULT NULL,
  `moved_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `moved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_room_move` ASC),
  INDEX `fk_room_move_res_room` (`kode_reservation_room` ASC),
  INDEX `fk_room_move_from` (`kode_from_room` ASC),
  INDEX `fk_room_move_to` (`kode_to_room` ASC),
  CONSTRAINT `fk_room_move_from`
    FOREIGN KEY (`kode_from_room`)
    REFERENCES `hotel_pms`.`mst_kamar` (`kode_kamar`),
  CONSTRAINT `fk_room_move_res_room`
    FOREIGN KEY (`kode_reservation_room`)
    REFERENCES `hotel_pms`.`trx_reservation_room` (`kode_reservasi_room`),
  CONSTRAINT `fk_room_move_to`
    FOREIGN KEY (`kode_to_room`)
    REFERENCES `hotel_pms`.`mst_kamar` (`kode_kamar`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`trx_room_status_log` (
  `id` BIGINT(19) UNSIGNED NOT NULL,
  `kode_room_status_log` VARCHAR(50) NOT NULL,
  `kode_kamar` VARCHAR(50) NOT NULL,
  `status_from` VARCHAR(30) NULL DEFAULT NULL,
  `status_to` VARCHAR(30) NOT NULL,
  `changed_by` BIGINT(19) UNSIGNED NULL DEFAULT NULL,
  `changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `kode` (`kode_room_status_log` ASC),
  INDEX `fk_room_status_log_room` (`kode_kamar` ASC),
  CONSTRAINT `fk_room_status_log_room`
    FOREIGN KEY (`kode_kamar`)
    REFERENCES `hotel_pms`.`mst_kamar` (`kode_kamar`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`user_credential` (
  `id` BIGINT(20) NOT NULL,
  `user_code` VARCHAR(36) NOT NULL,
  `username` VARCHAR(50) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `fullname` VARCHAR(200) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `telp` VARCHAR(20) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `role` VARCHAR(10) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `password` TEXT CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `status` ENUM('0', '1') CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL DEFAULT '0',
  `tz` VARCHAR(50) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL DEFAULT 'UTC',
  `created_at` DATETIME NULL DEFAULT NULL,
  `created_by` VARCHAR(255) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `updated_by` VARCHAR(255) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY USING BTREE (`id`),
  UNIQUE INDEX `uq_user_code` (`user_code` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `hotel_pms`.`user_navigation` (
  `id` INT(11) NOT NULL,
  `user_code` VARCHAR(50) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `menu` LONGTEXT CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `tz` VARCHAR(50) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL DEFAULT 'UTC',
  `created_at` DATETIME NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY USING BTREE (`id`),
  UNIQUE INDEX `uq_user_navigation_uniqueid` USING BTREE (`user_code`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

