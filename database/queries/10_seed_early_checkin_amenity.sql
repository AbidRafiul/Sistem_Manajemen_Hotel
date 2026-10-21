-- ========================================================
-- Query 10: Seed Master Amenity untuk Early Check-In
-- Project: Manajemen PMS Hotel (Standard v2)
-- Description: Menambahkan AMN-009 Early Check-In Surcharge pada mst_amenity
-- ========================================================

INSERT INTO `mst_amenity` (`kode_amenity`, `name`, `icon`, `harga`, `is_active`, `created_at`, `updated_at`)
VALUES ('AMN-009', 'Early Check-In Surcharge', 'pi pi-clock', 150000.00, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `icon` = VALUES(`icon`),
  `harga` = VALUES(`harga`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = NOW();
