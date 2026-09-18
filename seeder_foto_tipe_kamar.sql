-- =============================================================================
-- SEEDER FOTO TIPE KAMAR UNTUK DATABASE PRODUCTION (RAILWAY / MYSQL)
-- Script ini menyelaraskan tabel mst_tipe_kamar_foto ke file foto fisik 
-- yang sudah ter-commit dan tersedia permanen di repository backend.
-- =============================================================================

-- Hapus referensi foto lama/rusak untuk 4 tipe kamar standar
DELETE FROM `mst_tipe_kamar_foto` WHERE `kode_tipe_kamar` IN ('TIP0001', 'TIP0002', 'TIP0003', 'TIP0004');

-- Insert galeri foto default berkualitas tinggi
INSERT INTO `mst_tipe_kamar_foto` (`kode_tipe_kamar`, `foto_url`, `urutan`, `is_cover`, `is_active`, `created_at`) VALUES
-- TIP0001: Superior Room
('TIP0001', 'foto_TIP0001_interior.jpg', 1, 1, 1, NOW()),
('TIP0001', 'foto_TIP0001_bathroom.jpg', 2, 0, 1, NOW()),
('TIP0001', 'foto_TIP0001_balcony.jpg', 3, 0, 1, NOW()),

-- TIP0002: Deluxe Room
('TIP0002', 'foto_TIP0002_interior.jpg', 1, 1, 1, NOW()),
('TIP0002', 'foto_TIP0001_bathroom.jpg', 2, 0, 1, NOW()),

-- TIP0003: Executive Suite
('TIP0003', 'foto_TIP0003_interior.jpg', 1, 1, 1, NOW()),
('TIP0003', 'foto_TIP0001_balcony.jpg', 2, 0, 1, NOW()),

-- TIP0004: Presidential Suite
('TIP0004', 'foto_TIP0004_interior.jpg', 1, 1, 1, NOW()),
('TIP0004', 'foto_TIP0001_bathroom.jpg', 2, 0, 1, NOW());
