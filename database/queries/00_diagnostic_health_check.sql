-- ==============================================================
-- DIAGNOSTIC HEALTH CHECK HOTEL PMS (RAILWAY PRODUCTION / LOCAL)
-- Script ini bersifat 100% READ-ONLY & CRASH-PROOF
-- Tidak akan melempar Error 1146 jika ada tabel yang belum dibuat.
-- Jalankan di: Railway MySQL Query Tool / DBeaver / Navicat
-- ==============================================================

-- --------------------------------------------------------------
-- 1. CEK KEBERADAAN TABEL MASTER & OPERASIONAL (CRASH-PROOF)
-- --------------------------------------------------------------
SELECT 
  t.nama_tabel,
  t.kategori,
  IF(ist.TABLE_NAME IS NOT NULL, '✅ ADA (OK)', '❌ BELUM DIBUAT') AS status,
  COALESCE(ist.TABLE_ROWS, 0) AS estimasi_data
FROM (
  SELECT 'companies' AS nama_tabel, 'Perusahaan' AS kategori UNION ALL
  SELECT 'org_nodes', 'Hierarki Wilayah' UNION ALL
  SELECT 'user_scope_assignments', 'User Scope' UNION ALL
  SELECT 'mst_user', 'Akun Pengguna' UNION ALL
  SELECT 'mst_cabang', 'Cabang Hotel' UNION ALL
  SELECT 'mst_gedung', 'Gedung' UNION ALL
  SELECT 'mst_lantai', 'Lantai' UNION ALL
  SELECT 'mst_tipe_kamar', 'Tipe Kamar' UNION ALL
  SELECT 'mst_tipe_kamar_foto', 'Foto Tipe Kamar' UNION ALL
  SELECT 'mst_kamar', 'Kamar' UNION ALL
  SELECT 'mst_bed_type', 'Bed Type' UNION ALL
  SELECT 'mst_amenity', 'Amenity Kamar' UNION ALL
  SELECT 'mst_fasilitas', 'Fasilitas Hotel' UNION ALL
  SELECT 'mst_room_type_amenity', 'Relasi Amenity Kamar' UNION ALL
  SELECT 'mst_room_type_fasilitas', 'Relasi Fasilitas Kamar' UNION ALL
  SELECT 'mst_shift', 'Shift Kasir' UNION ALL
  SELECT 'mst_cashier_counter', 'Loket Kasir' UNION ALL
  SELECT 'mst_tax', 'Pajak & Service' UNION ALL
  SELECT 'mst_corporate_account', 'Corporate / Travel Agent' UNION ALL
  SELECT 'mst_guest', 'Data Tamu' UNION ALL
  SELECT 'mst_musim', 'Season / Musim' UNION ALL
  SELECT 'mst_paket_harga', 'Rate Plan' UNION ALL
  SELECT 'mst_rate_plan_price', 'Harga Kamar Rate Plan' UNION ALL
  SELECT 'mst_ruang_event', 'Ruang Event' UNION ALL
  SELECT 'mst_tipe_ruang_event', 'Tipe Ruang Event' UNION ALL
  SELECT 'mst_harga_ruang_event', 'Harga Ruang Event' UNION ALL
  SELECT 'mst_navigation', 'Menu Navigasi' UNION ALL
  SELECT 'trx_reservation', 'Transaksi Reservasi' UNION ALL
  SELECT 'trx_checkin', 'Transaksi Check-in' UNION ALL
  SELECT 'trx_folio', 'Folio Tamu' UNION ALL
  SELECT 'trx_cashier_shift', 'Sesi Kasir Shift' UNION ALL
  SELECT 'trx_night_audit', 'Night Audit' UNION ALL
  SELECT 'log', 'Log Error Sistem' UNION ALL
  SELECT 'log_perubahan', 'Audit Trail'
) t
LEFT JOIN INFORMATION_SCHEMA.TABLES ist 
  ON ist.TABLE_SCHEMA = DATABASE() AND ist.TABLE_NAME = t.nama_tabel
ORDER BY t.kategori, t.nama_tabel;


-- --------------------------------------------------------------
-- 2. VERIFIKASI KOLOM KRITIS (MENCEGAH ERROR 99 MAINTENANCE)
-- --------------------------------------------------------------
SELECT 
  'mst_amenity.harga' AS target_kolom,
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG (Penyebab Maintenance 99)') AS status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_amenity' AND COLUMN_NAME = 'harga'
UNION ALL
SELECT 
  'mst_fasilitas.harga',
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG (Penyebab Maintenance 99)')
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_fasilitas' AND COLUMN_NAME = 'harga'
UNION ALL
SELECT 
  'mst_user.org_node_id',
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG (Penyebab Maintenance 99)')
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'org_node_id'
UNION ALL
SELECT 
  'mst_user.can_switch_branch',
  IF(COUNT(*) > 0, '✅ TERPASANG (OK)', '❌ HILANG')
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'can_switch_branch'
UNION ALL
SELECT 
  'mst_cabang.company_id & org_node_id',
  IF(COUNT(*) = 2, '✅ TERPASANG (OK)', '❌ HILANG')
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_cabang' AND COLUMN_NAME IN ('company_id', 'org_node_id');


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
