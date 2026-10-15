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

-- 4. ALTER TABLE: Menambahkan Kolom Hierarchy pada mst_cabang & mst_user (Idempoten via Dynamic SQL)
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

-- Kolom mst_user.can_switch_branch
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'can_switch_branch');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `can_switch_branch` TINYINT NOT NULL DEFAULT 0 AFTER `default_branch_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET FOREIGN_KEY_CHECKS = 1;
-- ====================================================================
-- SELESAI BAGIAN 1: STRUKTUR TABEL BERHASIL DISIAPKAN
-- ====================================================================