-- Sengaja VARCHAR, bukan ENUM, dan bukan FK ke tabel master. 
-- Konsep "tipe paket sebagai master data" masih dalam tahap 
-- pertimbangan (belum matang keputusan desainnya — lihat catatan 
-- di bawah), jadi kolom ini dibuat generik dulu supaya nanti kalau 
-- keputusan sudah diambil, upgrade ke FK tinggal ADD CONSTRAINT 
-- tanpa perlu ubah tipe kolom lagi.
ALTER TABLE mst_paket_harga 
    MODIFY COLUMN tipe_paket VARCHAR(50) NOT NULL DEFAULT 'RO';

-- Tambahkan kolom markup
ALTER TABLE mst_paket_harga
    ADD COLUMN tipe_markup ENUM('nominal','persen') NOT NULL DEFAULT 'nominal',
    ADD COLUMN nilai_markup DECIMAL(15,2) NOT NULL DEFAULT 0;
