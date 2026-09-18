-- ============================================================================
-- SEEDER DATA FASILITAS & AMENITY HOTEL
-- ============================================================================
-- Database  : hotel_pms (MySQL 8.x)
-- Collation : utf8mb4_unicode_ci
-- Tanggal   : 2026-09-18
-- Catatan   : Script ini IDEMPOTEN — aman dijalankan berulang kali.
--             Menggunakan INSERT IGNORE agar tidak error jika data sudah ada.
-- ============================================================================

SET @NOW = NOW();

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 1. MASTER FASILITAS HOTEL (mst_fasilitas)
--    Fasilitas = layanan umum hotel yang bisa dikenakan tarif tambahan
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

INSERT IGNORE INTO `mst_fasilitas`
  (`kode_fasilitas`, `kode_cabang`, `name`, `harga`, `is_active`, `created_at`, `updated_at`)
VALUES
  -- Fasilitas Gratis (sudah termasuk dalam tarif kamar)
  ('FAS-001', 'CAB0001', 'Kolam Renang Infinity (Pool)',            0.00, 1, @NOW, @NOW),
  ('FAS-002', 'CAB0001', 'Fitness Center & Gym',                    0.00, 1, @NOW, @NOW),
  ('FAS-004', 'CAB0001', 'Restoran Kayu Manis & Coffee Bar',        0.00, 1, @NOW, @NOW),

  -- Fasilitas Berbayar (tarif terpisah, bisa ditambahkan saat reservasi/in-house)
  ('FAS-003', 'CAB0001', 'Spa & Traditional Massage',          175000.00, 1, @NOW, @NOW),
  ('FAS-005', 'CAB0001', 'Antar-Jemput Bandara / Stasiun',     150000.00, 1, @NOW, @NOW),
  ('FAS-006', 'CAB0001', 'Express Laundry & Dry Clean',         45000.00, 1, @NOW, @NOW),

  -- Fasilitas Tambahan (baru)
  ('FAS-007', 'CAB0001', 'Room Service 24 Jam',                  35000.00, 1, @NOW, @NOW),
  ('FAS-008', 'CAB0001', 'Sarapan Pagi (Breakfast Buffet)',      85000.00, 1, @NOW, @NOW),
  ('FAS-009', 'CAB0001', 'Extra Bed / Tempat Tidur Tambahan',  125000.00, 1, @NOW, @NOW),
  ('FAS-010', 'CAB0001', 'Late Checkout (s.d. 18:00)',          200000.00, 1, @NOW, @NOW),
  ('FAS-011', 'CAB0001', 'Early Check-In (mulai 06:00)',        150000.00, 1, @NOW, @NOW),
  ('FAS-012', 'CAB0001', 'Sewa Sepeda (per hari)',               50000.00, 1, @NOW, @NOW),
  ('FAS-013', 'CAB0001', 'Paket Romantic Honeymoon Setup',      350000.00, 1, @NOW, @NOW),
  ('FAS-014', 'CAB0001', 'Paket Birthday Surprise Setup',       250000.00, 1, @NOW, @NOW),
  ('FAS-015', 'CAB0001', 'Kids Playground & Activity',               0.00, 1, @NOW, @NOW),
  ('FAS-016', 'CAB0001', 'Business Center & Meeting Room',      500000.00, 1, @NOW, @NOW),
  ('FAS-017', 'CAB0001', 'Valet Parking',                        25000.00, 1, @NOW, @NOW),
  ('FAS-018', 'CAB0001', 'Concierge & Tour Arrangement',             0.00, 1, @NOW, @NOW),
  ('FAS-019', 'CAB0001', 'Baby Crib / Box Bayi',                 75000.00, 1, @NOW, @NOW),
  ('FAS-020', 'CAB0001', 'Pet-Friendly Room Surcharge',         100000.00, 1, @NOW, @NOW);


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 2. MASTER AMENITY KAMAR (mst_amenity)
--    Amenity = kelengkapan/perlengkapan di dalam kamar
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

INSERT IGNORE INTO `mst_amenity`
  (`kode_amenity`, `name`, `icon`, `harga`, `is_active`, `created_at`, `updated_at`)
VALUES
  -- Amenity Standar (gratis, sudah termasuk di kamar)
  ('AMN-001', 'Free High-Speed WiFi',              'pi pi-wifi',       0.00, 1, @NOW, @NOW),
  ('AMN-002', 'Air Conditioning (AC)',              'pi pi-box',        0.00, 1, @NOW, @NOW),
  ('AMN-003', 'Smart LED TV 43 Inch',              'pi pi-desktop',    0.00, 1, @NOW, @NOW),
  ('AMN-004', 'Coffee & Tea Maker',                'pi pi-coffee',     0.00, 1, @NOW, @NOW),
  ('AMN-005', 'Safe Deposit Box',                  'pi pi-lock',       0.00, 1, @NOW, @NOW),
  ('AMN-008', 'Hair Dryer',                        'pi pi-bolt',       0.00, 1, @NOW, @NOW),

  -- Amenity Berbayar (charged extra)
  ('AMN-006', 'Minibar Stocked',                   'pi pi-wallet',  50000.00, 1, @NOW, @NOW),
  ('AMN-007', 'Bathrobe & Slippers Premium',       'pi pi-heart',   25000.00, 1, @NOW, @NOW),

  -- Amenity Tambahan (baru)
  ('AMN-009', 'Iron & Ironing Board',              'pi pi-wrench',     0.00, 1, @NOW, @NOW),
  ('AMN-010', 'Rain Shower & Bathtub',             'pi pi-sun',        0.00, 1, @NOW, @NOW),
  ('AMN-011', 'Balcony / Teras Privat',            'pi pi-home',       0.00, 1, @NOW, @NOW),
  ('AMN-012', 'Nespresso Coffee Machine',          'pi pi-star',    35000.00, 1, @NOW, @NOW),
  ('AMN-013', 'Bluetooth Speaker JBL',             'pi pi-volume-up',  0.00, 1, @NOW, @NOW),
  ('AMN-014', 'Toiletries Premium (L''Occitane)',   'pi pi-gift',       0.00, 1, @NOW, @NOW),
  ('AMN-015', 'Working Desk & Ergonomic Chair',    'pi pi-briefcase',  0.00, 1, @NOW, @NOW),
  ('AMN-016', 'Pillow Menu (6 Jenis)',             'pi pi-th-large',   0.00, 1, @NOW, @NOW),
  ('AMN-017', 'Blackout Curtain',                  'pi pi-eye-slash',  0.00, 1, @NOW, @NOW),
  ('AMN-018', 'USB Charging Ports (Bedside)',      'pi pi-bolt',       0.00, 1, @NOW, @NOW),
  ('AMN-019', 'Kimono / Yukata Bathrobe',          'pi pi-user',    15000.00, 1, @NOW, @NOW),
  ('AMN-020', 'Welcome Fruit Basket',              'pi pi-apple-alt',  0.00, 1, @NOW, @NOW);


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 3. ASOSIASI TIPE KAMAR - FASILITAS (mst_room_type_fasilitas)
--    Menentukan fasilitas mana yang tersedia untuk setiap tipe kamar
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- TIP0001: Superior Room — Fasilitas dasar
INSERT IGNORE INTO `mst_room_type_fasilitas`
  (`kode_tipe_kamar`, `kode_fasilitas`, `created_at`)
VALUES
  ('TIP0001', 'FAS-001', @NOW),  -- Kolam Renang
  ('TIP0001', 'FAS-002', @NOW),  -- Fitness Center
  ('TIP0001', 'FAS-015', @NOW),  -- Kids Playground
  ('TIP0001', 'FAS-018', @NOW);  -- Concierge

-- TIP0002: Deluxe Room — Fasilitas menengah
INSERT IGNORE INTO `mst_room_type_fasilitas`
  (`kode_tipe_kamar`, `kode_fasilitas`, `created_at`)
VALUES
  ('TIP0002', 'FAS-001', @NOW),  -- Kolam Renang
  ('TIP0002', 'FAS-002', @NOW),  -- Fitness Center
  ('TIP0002', 'FAS-004', @NOW),  -- Restoran
  ('TIP0002', 'FAS-008', @NOW),  -- Sarapan Pagi
  ('TIP0002', 'FAS-015', @NOW),  -- Kids Playground
  ('TIP0002', 'FAS-017', @NOW),  -- Valet Parking
  ('TIP0002', 'FAS-018', @NOW);  -- Concierge

-- TIP0003: Executive Suite — Fasilitas lengkap
INSERT IGNORE INTO `mst_room_type_fasilitas`
  (`kode_tipe_kamar`, `kode_fasilitas`, `created_at`)
VALUES
  ('TIP0003', 'FAS-001', @NOW),  -- Kolam Renang
  ('TIP0003', 'FAS-002', @NOW),  -- Fitness Center
  ('TIP0003', 'FAS-003', @NOW),  -- Spa & Massage
  ('TIP0003', 'FAS-004', @NOW),  -- Restoran
  ('TIP0003', 'FAS-005', @NOW),  -- Antar-Jemput
  ('TIP0003', 'FAS-008', @NOW),  -- Sarapan Pagi
  ('TIP0003', 'FAS-015', @NOW),  -- Kids Playground
  ('TIP0003', 'FAS-016', @NOW),  -- Business Center
  ('TIP0003', 'FAS-017', @NOW),  -- Valet Parking
  ('TIP0003', 'FAS-018', @NOW);  -- Concierge

-- TIP0004: Presidential Suite — Semua fasilitas premium
INSERT IGNORE INTO `mst_room_type_fasilitas`
  (`kode_tipe_kamar`, `kode_fasilitas`, `created_at`)
VALUES
  ('TIP0004', 'FAS-001', @NOW),  -- Kolam Renang
  ('TIP0004', 'FAS-002', @NOW),  -- Fitness Center
  ('TIP0004', 'FAS-003', @NOW),  -- Spa & Massage
  ('TIP0004', 'FAS-004', @NOW),  -- Restoran
  ('TIP0004', 'FAS-005', @NOW),  -- Antar-Jemput
  ('TIP0004', 'FAS-008', @NOW),  -- Sarapan Pagi
  ('TIP0004', 'FAS-010', @NOW),  -- Late Checkout
  ('TIP0004', 'FAS-011', @NOW),  -- Early Checkin
  ('TIP0004', 'FAS-013', @NOW),  -- Romantic Setup
  ('TIP0004', 'FAS-015', @NOW),  -- Kids Playground
  ('TIP0004', 'FAS-016', @NOW),  -- Business Center
  ('TIP0004', 'FAS-017', @NOW),  -- Valet Parking
  ('TIP0004', 'FAS-018', @NOW);  -- Concierge


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 4. ASOSIASI TIPE KAMAR - AMENITY (mst_room_type_amenity)
--    Menentukan amenity kamar mana yang tersedia per tipe
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- TIP0001: Superior Room — Amenity standar
INSERT IGNORE INTO `mst_room_type_amenity`
  (`kode_rta`, `kode_tipe_kamar`, `kode_amenity`)
VALUES
  ('RTA0001', 'TIP0001', 'AMN-001'),  -- WiFi
  ('RTA0002', 'TIP0001', 'AMN-002'),  -- AC
  ('RTA0003', 'TIP0001', 'AMN-003'),  -- LED TV
  ('RTA0004', 'TIP0001', 'AMN-004'),  -- Coffee Maker
  ('RTA0016', 'TIP0001', 'AMN-008'),  -- Hair Dryer
  ('RTA0017', 'TIP0001', 'AMN-018');  -- USB Charging

-- TIP0002: Deluxe Room — Amenity menengah
INSERT IGNORE INTO `mst_room_type_amenity`
  (`kode_rta`, `kode_tipe_kamar`, `kode_amenity`)
VALUES
  ('RTA0005', 'TIP0002', 'AMN-001'),  -- WiFi
  ('RTA0006', 'TIP0002', 'AMN-002'),  -- AC
  ('RTA0007', 'TIP0002', 'AMN-003'),  -- LED TV
  ('RTA0008', 'TIP0002', 'AMN-004'),  -- Coffee Maker
  ('RTA0009', 'TIP0002', 'AMN-005'),  -- Safe Box
  ('RTA0010', 'TIP0002', 'AMN-006'),  -- Minibar
  ('RTA0018', 'TIP0002', 'AMN-008'),  -- Hair Dryer
  ('RTA0019', 'TIP0002', 'AMN-009'),  -- Iron
  ('RTA0020', 'TIP0002', 'AMN-015'),  -- Working Desk
  ('RTA0021', 'TIP0002', 'AMN-017'),  -- Blackout Curtain
  ('RTA0022', 'TIP0002', 'AMN-018');  -- USB Charging

-- TIP0003: Executive Suite — Amenity premium
INSERT IGNORE INTO `mst_room_type_amenity`
  (`kode_rta`, `kode_tipe_kamar`, `kode_amenity`)
VALUES
  ('RTA0011', 'TIP0003', 'AMN-001'),  -- WiFi
  ('RTA0012', 'TIP0003', 'AMN-002'),  -- AC
  ('RTA0013', 'TIP0003', 'AMN-005'),  -- Safe Box
  ('RTA0014', 'TIP0003', 'AMN-006'),  -- Minibar
  ('RTA0015', 'TIP0003', 'AMN-007'),  -- Bathrobe
  ('RTA0023', 'TIP0003', 'AMN-003'),  -- LED TV
  ('RTA0024', 'TIP0003', 'AMN-004'),  -- Coffee Maker
  ('RTA0025', 'TIP0003', 'AMN-008'),  -- Hair Dryer
  ('RTA0026', 'TIP0003', 'AMN-010'),  -- Rain Shower & Bathtub
  ('RTA0027', 'TIP0003', 'AMN-011'),  -- Balcony
  ('RTA0028', 'TIP0003', 'AMN-012'),  -- Nespresso
  ('RTA0029', 'TIP0003', 'AMN-014'),  -- Toiletries Premium
  ('RTA0030', 'TIP0003', 'AMN-015'),  -- Working Desk
  ('RTA0031', 'TIP0003', 'AMN-016'),  -- Pillow Menu
  ('RTA0032', 'TIP0003', 'AMN-017'),  -- Blackout Curtain
  ('RTA0033', 'TIP0003', 'AMN-018');  -- USB Charging

-- TIP0004: Presidential Suite — Semua amenity terlengkap
INSERT IGNORE INTO `mst_room_type_amenity`
  (`kode_rta`, `kode_tipe_kamar`, `kode_amenity`)
VALUES
  ('RTA0034', 'TIP0004', 'AMN-001'),  -- WiFi
  ('RTA0035', 'TIP0004', 'AMN-002'),  -- AC
  ('RTA0036', 'TIP0004', 'AMN-003'),  -- LED TV
  ('RTA0037', 'TIP0004', 'AMN-004'),  -- Coffee Maker
  ('RTA0038', 'TIP0004', 'AMN-005'),  -- Safe Box
  ('RTA0039', 'TIP0004', 'AMN-006'),  -- Minibar
  ('RTA0040', 'TIP0004', 'AMN-007'),  -- Bathrobe & Slippers
  ('RTA0041', 'TIP0004', 'AMN-008'),  -- Hair Dryer
  ('RTA0042', 'TIP0004', 'AMN-009'),  -- Iron
  ('RTA0043', 'TIP0004', 'AMN-010'),  -- Rain Shower & Bathtub
  ('RTA0044', 'TIP0004', 'AMN-011'),  -- Balcony
  ('RTA0045', 'TIP0004', 'AMN-012'),  -- Nespresso
  ('RTA0046', 'TIP0004', 'AMN-013'),  -- Bluetooth Speaker
  ('RTA0047', 'TIP0004', 'AMN-014'),  -- Toiletries Premium
  ('RTA0048', 'TIP0004', 'AMN-015'),  -- Working Desk
  ('RTA0049', 'TIP0004', 'AMN-016'),  -- Pillow Menu
  ('RTA0050', 'TIP0004', 'AMN-017'),  -- Blackout Curtain
  ('RTA0051', 'TIP0004', 'AMN-018'),  -- USB Charging
  ('RTA0052', 'TIP0004', 'AMN-019'),  -- Kimono Yukata
  ('RTA0053', 'TIP0004', 'AMN-020');  -- Welcome Fruit Basket


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 5. UPDATE SEQUENCE GENERATOR (sys_format_penomoran)
--    Agar kode otomatis berikutnya tidak bentrok dengan data yang baru di-seed
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

UPDATE `sys_format_penomoran`
SET `nomor_terakhir` = 20, `updated_at` = @NOW
WHERE `kode_format` = 'FMT-FASILITAS';

UPDATE `sys_format_penomoran`
SET `nomor_terakhir` = 20, `updated_at` = @NOW
WHERE `kode_format` = 'FMT-AMENITY';

UPDATE `sys_format_penomoran`
SET `nomor_terakhir` = 53, `updated_at` = @NOW
WHERE `kode_format` = 'FMT-RTA';


-- ============================================================================
-- VERIFIKASI (opsional — jalankan untuk mengecek hasil)
-- ============================================================================

-- SELECT COUNT(*) AS total_fasilitas FROM mst_fasilitas WHERE is_active = 1;
-- SELECT COUNT(*) AS total_amenity FROM mst_amenity WHERE is_active = 1;
-- SELECT kode_tipe_kamar, COUNT(*) AS jumlah_fasilitas FROM mst_room_type_fasilitas GROUP BY kode_tipe_kamar;
-- SELECT kode_tipe_kamar, COUNT(*) AS jumlah_amenity FROM mst_room_type_amenity GROUP BY kode_tipe_kamar;
-- SELECT * FROM sys_format_penomoran WHERE kode_format IN ('FMT-FASILITAS','FMT-AMENITY','FMT-RTA');
