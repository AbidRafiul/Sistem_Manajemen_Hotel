-- ==============================================================
-- DIAGNOSTIC HEALTH CHECK HOTEL PMS (RAILWAY PRODUCTION / LOCAL)
-- Script ini bersifat READ-ONLY (100% Aman dijalankan di Production)
-- Jalankan di: Railway MySQL Query Tool / DBeaver / Navicat
-- ==============================================================

-- --------------------------------------------------------------
-- 1. VERIFIKASI SKEMA & STRUKTUR TABEL KRITIS (PASS / FAIL)
-- --------------------------------------------------------------
SELECT 
  '1. Tabel log' AS komponen,
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG (FAIL)') AS status
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'log'
UNION ALL
SELECT 
  '2. Tabel log_perubahan',
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG (FAIL)')
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'log_perubahan'
UNION ALL
SELECT 
  '3. Kolom mst_user.org_node_id',
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG (FAIL)')
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'org_node_id'
UNION ALL
SELECT 
  '4. Kolom mst_user.can_switch_branch',
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG (FAIL)')
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'can_switch_branch'
UNION ALL
SELECT 
  '5. Kolom mst_cabang.company_id & org_node_id',
  IF(COUNT(*) = 2, '✅ TERPASANG (OK)', '❌ HILANG (FAIL)')
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_cabang' AND COLUMN_NAME IN ('company_id', 'org_node_id')
UNION ALL
SELECT 
  '6. Kolom mst_amenity.harga',
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG (FAIL)')
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_amenity' AND COLUMN_NAME = 'harga'
UNION ALL
SELECT 
  '7. Kolom mst_fasilitas.harga',
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG (FAIL)')
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_fasilitas' AND COLUMN_NAME = 'harga'
UNION ALL
SELECT 
  '8. Tabel mst_tipe_kamar_foto',
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG (FAIL)')
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_tipe_kamar_foto'
UNION ALL
SELECT 
  '9. Tabel mst_room_type_amenity & fasilitas',
  IF(COUNT(*) = 2, '✅ TERPASANG (OK)', '❌ HILANG (FAIL)')
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('mst_room_type_amenity', 'mst_room_type_fasilitas');


-- --------------------------------------------------------------
-- 2. RINGKASAN JUMLAH DATA MASTER & STATUS OPERASIONAL
-- --------------------------------------------------------------
SELECT 
  'Perusahaan (companies)' AS modul, 
  COUNT(*) AS total_data, 
  IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') AS status 
FROM `companies`
UNION ALL
SELECT 'Wilayah / Node (org_nodes)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `org_nodes`
UNION ALL
SELECT 'Cabang (mst_cabang)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_cabang`
UNION ALL
SELECT 'Gedung (mst_gedung)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_gedung`
UNION ALL
SELECT 'Lantai (mst_lantai)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_lantai`
UNION ALL
SELECT 'Bed Type (mst_bed_type)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_bed_type`
UNION ALL
SELECT 'Tipe Kamar (mst_tipe_kamar)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_tipe_kamar`
UNION ALL
SELECT 'Master Kamar (mst_kamar)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_kamar`
UNION ALL
SELECT 'Amenity Kamar (mst_amenity)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_amenity`
UNION ALL
SELECT 'Fasilitas Hotel (mst_fasilitas)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_fasilitas`
UNION ALL
SELECT 'Shift Kasir (mst_shift)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_shift`
UNION ALL
SELECT 'Cashier Counter (mst_cashier_counter)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_cashier_counter`
UNION ALL
SELECT 'Corporate / Agent (mst_corporate)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_corporate`
UNION ALL
SELECT 'Pajak & Service (mst_pajak)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_pajak`
UNION ALL
SELECT 'Rate Plan (mst_paket_harga)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_paket_harga`
UNION ALL
SELECT 'Navigasi Menu (mst_navigation)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_navigation`
UNION ALL
SELECT 'User Terdaftar (mst_user)', COUNT(*), IF(COUNT(*) > 0, '✅ Siap', '⚠️ Kosong') FROM `mst_user`;


-- --------------------------------------------------------------
-- 3. STATUS DETAIL USER & HIERARKI PERUSAHAAN
-- --------------------------------------------------------------
SELECT 
  u.id,
  u.username,
  u.role,
  u.user_code,
  c.name AS nama_perusahaan,
  b.name AS cabang_default,
  u.can_switch_branch AS multi_cabang,
  IF(u.is_active = 1, 'Aktif', 'Nonaktif') AS status_user
FROM `mst_user` u
LEFT JOIN `companies` c ON u.company_id = c.id
LEFT JOIN `mst_cabang` b ON u.default_branch_id = b.id
ORDER BY u.id ASC;


-- --------------------------------------------------------------
-- 4. DISTRIBUSI KAMAR & STATUS PER CABANG
-- --------------------------------------------------------------
SELECT 
  k.kode_cabang,
  c.name AS nama_cabang,
  g.nama_gedung,
  l.nama_lantai,
  COUNT(k.id) AS total_kamar,
  SUM(IF(k.occupancy_status = 'occupied', 1, 0)) AS terisi_occupied,
  SUM(IF(k.occupancy_status = 'vacant', 1, 0)) AS kosong_vacant,
  SUM(IF(k.housekeeping_status = 'clean', 1, 0)) AS bersih_clean,
  SUM(IF(k.housekeeping_status = 'dirty', 1, 0)) AS kotor_dirty,
  SUM(IF(k.housekeeping_status = 'inspection', 1, 0)) AS inspeksi
FROM `mst_kamar` k
LEFT JOIN `mst_cabang` c ON k.kode_cabang = c.kode_cabang
LEFT JOIN `mst_gedung` g ON k.kode_gedung = g.kode_gedung
LEFT JOIN `mst_lantai` l ON k.kode_lantai = l.kode_lantai
GROUP BY k.kode_cabang, c.name, g.nama_gedung, l.nama_lantai
ORDER BY k.kode_cabang, g.nama_gedung, l.nama_lantai;


-- --------------------------------------------------------------
-- 5. KELENGKAPAN NAVIGASI MENU PER ROLE
-- --------------------------------------------------------------
SELECT 
  n.role,
  LENGTH(n.menu) AS ukuran_json_bytes,
  n.updated_at,
  IF(n.menu LIKE '%/front_office%' AND n.menu LIKE '%/night_audit%', '✅ Lengkap (Fitur Baru)', '⚠️ Versi Lama') AS status_fitur
FROM `mst_navigation` n
ORDER BY n.role ASC;


-- --------------------------------------------------------------
-- 6. AUDIT 5 LOG ERROR TERAKHIR SISTEM (JIKA ADA ERROR TERCATAT)
-- --------------------------------------------------------------
SELECT 
  id,
  DateTime,
  Controller,
  Function,
  SUBSTRING(Request, 1, 80) AS potongan_request,
  SUBSTRING(Response, 1, 80) AS potongan_response,
  SUBSTRING(Stack, 1, 150) AS potongan_stack_error
FROM `log`
ORDER BY id DESC
LIMIT 5;
