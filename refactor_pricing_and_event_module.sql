-- 1. REFACTOR TIPE KAMAR & BED TYPE
ALTER TABLE mst_kamar DROP COLUMN kode_bed_type;

ALTER TABLE mst_tipe_kamar ADD COLUMN kode_bed_type VARCHAR(255) NULL;

-- Asumsikan mst_bed_type menggunakan kolom kode sebagai unik
ALTER TABLE mst_tipe_kamar ADD CONSTRAINT fk_tipe_kamar_bed 
FOREIGN KEY (kode_bed_type) REFERENCES mst_bed_type(kode_bed_type) ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. MAPPING FASILITAS KE TIPE KAMAR
CREATE TABLE mst_room_type_fasilitas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kode_tipe_kamar VARCHAR(255) NOT NULL,
    kode_fasilitas VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    created_by VARCHAR(255),
    CONSTRAINT fk_rtf_tipe_kamar FOREIGN KEY (kode_tipe_kamar) REFERENCES mst_tipe_kamar(kode_tipe_kamar) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rtf_fasilitas FOREIGN KEY (kode_fasilitas) REFERENCES mst_fasilitas(kode_fasilitas) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. PEMBUATAN MODUL "FUNCTION SPACE" (RUANG EVENT)

-- 3.1 Tipe Ruang Event
CREATE TABLE mst_tipe_ruang_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(255) UNIQUE NOT NULL,
    nama_tipe VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    created_by VARCHAR(255),
    updated_at DATETIME NOT NULL,
    updated_by VARCHAR(255),
    deleted_at DATETIME NULL,
    deleted_by VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1
);

-- 3.2 Ruang Event
CREATE TABLE mst_ruang_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(255) UNIQUE NOT NULL,
    kode_cabang VARCHAR(255) NOT NULL,
    kode_tipe_ruang_event VARCHAR(255) NOT NULL,
    nama_ruang VARCHAR(255) NOT NULL,
    kapasitas_orang INT,
    luas_sqm INT,
    layout_support TEXT,
    created_at DATETIME NOT NULL,
    created_by VARCHAR(255),
    updated_at DATETIME NOT NULL,
    updated_by VARCHAR(255),
    deleted_at DATETIME NULL,
    deleted_by VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    CONSTRAINT fk_re_cabang FOREIGN KEY (kode_cabang) REFERENCES mst_cabang(kode_cabang) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_re_tipe FOREIGN KEY (kode_tipe_ruang_event) REFERENCES mst_tipe_ruang_event(kode) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3.3 Fasilitas Ruang Event (Pivot)
CREATE TABLE mst_ruang_event_fasilitas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kode_ruang_event VARCHAR(255) NOT NULL,
    kode_fasilitas VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    created_by VARCHAR(255),
    CONSTRAINT fk_ref_ruang FOREIGN KEY (kode_ruang_event) REFERENCES mst_ruang_event(kode) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ref_fasilitas FOREIGN KEY (kode_fasilitas) REFERENCES mst_fasilitas(kode_fasilitas) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3.4 Harga Ruang Event
CREATE TABLE mst_harga_ruang_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(255) UNIQUE NOT NULL,
    kode_ruang_event VARCHAR(255) NOT NULL,
    tipe_sewa ENUM('per_jam', 'half_day', 'full_day') NOT NULL,
    kode_musim VARCHAR(255) NULL,
    harga DECIMAL(18, 2) NOT NULL,
    created_at DATETIME NOT NULL,
    created_by VARCHAR(255),
    updated_at DATETIME NOT NULL,
    updated_by VARCHAR(255),
    deleted_at DATETIME NULL,
    deleted_by VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    CONSTRAINT fk_hre_ruang FOREIGN KEY (kode_ruang_event) REFERENCES mst_ruang_event(kode) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3.5 Transaksi Reservasi Event
CREATE TABLE trx_reservasi_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(255) UNIQUE NOT NULL,
    kode_ruang_event VARCHAR(255) NOT NULL,
    kode_cabang VARCHAR(255) NOT NULL,
    kode_tamu VARCHAR(255) NOT NULL,
    kode_corporate VARCHAR(255) NULL,
    kode_reservasi_kamar VARCHAR(255) NULL,
    tgl_mulai DATE NOT NULL,
    tgl_selesai DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    jumlah_tamu INT NOT NULL,
    status_event VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    created_by VARCHAR(255),
    updated_at DATETIME NOT NULL,
    updated_by VARCHAR(255),
    deleted_at DATETIME NULL,
    deleted_by VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    CONSTRAINT fk_tre_ruang FOREIGN KEY (kode_ruang_event) REFERENCES mst_ruang_event(kode) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tre_cabang FOREIGN KEY (kode_cabang) REFERENCES mst_cabang(kode_cabang) ON DELETE RESTRICT ON UPDATE CASCADE
    -- constraints for tamu, corporate, and reservasi_kamar can be added if those tables strictly use `kode`
);
