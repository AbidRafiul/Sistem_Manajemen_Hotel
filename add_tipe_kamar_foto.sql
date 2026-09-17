-- =======================================================
-- Migration: Tabel Galeri Foto Tipe Kamar
-- Project: Sistem Manajemen Hotel (PMS)
-- =======================================================

CREATE TABLE IF NOT EXISTS mst_tipe_kamar_foto (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kode_tipe_kamar VARCHAR(50) NOT NULL,
  foto_url VARCHAR(255) NOT NULL,
  urutan INT NOT NULL DEFAULT 0,
  is_cover TINYINT(1) NOT NULL DEFAULT 0,
  created_by BIGINT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_by BIGINT DEFAULT NULL,
  deleted_at DATETIME DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_tkf_tipe_kamar FOREIGN KEY (kode_tipe_kamar) 
    REFERENCES mst_tipe_kamar(kode_tipe_kamar) ON DELETE CASCADE ON UPDATE CASCADE
);
