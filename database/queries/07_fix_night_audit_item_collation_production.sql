-- ===================================================================================
-- SKRIP PERBAIKAN PRODUKSI:
-- FIX DETAIL POSTING NIGHT AUDIT (Penyelarasan Collation Database agar Bebas Error Join)
-- 
-- Target Database : Railway MySQL / Produksi (pms_hotel)
-- Sifat Eksekusi  : 100% IDEMPOTEN & AMAN
-- File            : database/queries/07_fix_night_audit_item_collation_production.sql
-- ===================================================================================

-- 1. Selaraskan collation tabel trx_night_audit_item ke utf8mb4_0900_ai_ci (standar MySQL 8.0 Railway)
ALTER TABLE `trx_night_audit_item` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 2. Selaraskan collation tabel sys_business_date ke utf8mb4_0900_ai_ci
ALTER TABLE `sys_business_date` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 3. Verifikasi Collation Tabel Night Audit
SELECT 
  TABLE_NAME, 
  TABLE_COLLATION 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('trx_night_audit', 'trx_night_audit_item', 'sys_business_date', 'trx_reservation', 'mst_kamar', 'mst_guest');
