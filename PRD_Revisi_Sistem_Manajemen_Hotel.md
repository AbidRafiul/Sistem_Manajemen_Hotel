PRD Revisi Sistem Manajemen Hotel
Cakupan: dashboard reservasi, pembayaran dan invoice, serta konsistensi halaman checkout.
Repositori: AbidRafiul/Sistem_Manajemen_Hotel — cabang main.

1. Hasil analisis awal proyek
Repositori kamu memisahkan aplikasi menjadi folder express_pms_be dan next_pms_fe. Di direktori utama juga tersedia essential.sql dan koleksi Postman API STANDART.postman_collection.json. Penamaan folder mengindikasikan backend Express dan frontend Next.js, tetapi versi, dependensi, dan pola implementasinya masih perlu diperiksa melalui kode.

Riwayat perubahan yang terlihat memuat pengembangan reservasi banyak kamar, reservasi grup, serta fasilitas tambahan pada proses pengajuan reservasi. Ada pula perubahan housekeeping berupa penugasan otomatis, pembagian beban kerja, riwayat pembersihan, dan penghubung proses checkout dengan penugasan housekeeping.

Implikasinya, revisi ini perlu mempertahankan dua hal:

Perhitungan ketersediaan dan pembayaran harus mendukung satu reservasi dengan beberapa kamar.
Perubahan checkout tidak boleh memutus proses housekeeping yang sudah ada.
Batas analisis: yang berhasil diperiksa adalah struktur utama dan pesan perubahan yang ditampilkan GitHub, belum isi komponen, endpoint, skema SQL, atau perilaku aplikasi saat dijalankan. Karena itu, dokumen ini merupakan PRD implementasi berdasarkan kebutuhanmu dan struktur yang teramati, bukan audit kode menyeluruh. Nama entitas dan endpoint di bawah adalah usulan kontrak logis, bukan klaim bahwa semuanya sudah ada.

2. Tujuan produk
Menyediakan alur operasional yang konsisten dari pencarian kamar, reservasi, check-in, pembayaran, hingga checkout.

Hasil yang diharapkan:

Resepsionis dapat mengetahui ketersediaan kamar berdasarkan tanggal dan tipe tanpa membuka banyak halaman.
Transaksi yang sudah lunas selalu menampilkan status dan tindakan yang benar.
Invoice yang dibuka dari reservasi, walk-in, dan checkout memiliki angka serta identitas yang sama.
Checkout menggunakan struktur halaman yang konsisten dengan modul lain.
Reservasi grup, fasilitas tambahan, dan housekeeping tetap berfungsi setelah perubahan.
Interpretasi “seperti Traveloka”: pencarian berdasarkan tanggal, pengelompokan tipe kamar, informasi ketersediaan, harga, dan tindakan reservasi yang jelas. Lingkupnya adalah dashboard operasional internal hotel; integrasi langsung dengan Traveloka tidak termasuk.

3. Pengguna dan kewenangan



Pengguna	Kebutuhan utama	Akses yang diusulkan
Resepsionis	Memantau kamar, reservasi, check-in dan checkout	Sesuai izin operasional yang sudah tersedia
Kasir/petugas pembayaran	Mencatat pembayaran dan mencetak invoice	Izin transaksi pembayaran
Manajer/admin	Melihat ringkasan, audit, dan koreksi	Sesuai izin pengawasan yang sudah tersedia
Housekeeping	Melihat tugas pembersihan setelah checkout	Tidak memperoleh akses ke rincian keuangan tamu
Nama peran harus mengikuti implementasi autentikasi proyek. Jangan membuat sistem peran baru jika izin yang dibutuhkan sudah tersedia.

4. Ruang lingkup dan prioritas



Prioritas	Pekerjaan
P0	Menyatukan perhitungan tagihan, pembayaran, saldo, dan status pelunasan
P0	Memperbaiki walk-in yang langsung lunas serta validasi checkout
P0	Mencegah pembayaran ganda dan pemesanan kamar yang bertabrakan
P1	Menambahkan dashboard reservasi berdasarkan tanggal, tipe, dan kamar
P1	Menyatukan invoice di semua titik akses
P1	Menyamakan header dan struktur halaman checkout
P1	Menjaga alur reservasi banyak kamar dan housekeeping
Di luar lingkup	Integrasi OTA, payment gateway baru, harga dinamis, akuntansi lengkap, dan perubahan desain seluruh aplikasi
5. Aturan bisnis utama
5.1 Pisahkan status menginap, pembayaran, dan kondisi kamar
Satu label “selesai” tidak cukup untuk menjelaskan kondisi transaksi.




Dimensi	Contoh status konseptual
Reservasi/menginap	Dipesan, check-in, checkout, dibatalkan, tidak datang
Pembayaran	Belum dibayar, dibayar sebagian, lunas
Kondisi kamar	Bersih/siap, kotor, sedang dibersihkan, perawatan
Dokumen invoice	Terbit, dibatalkan/digantikan jika koreksi didukung
Contoh tampilan:

Status menginap: Check-in · Pembayaran: Lunas · Kamar: 203

Tamu yang sudah melunasi pembayaran saat check-in tetap berstatus check-in, bukan checkout.

Kondisi “ditempati” sebaiknya dihitung dari alokasi menginap aktif atau diselaraskan dengan model yang sudah ada, agar tidak menjadi sumber status kedua yang bertentangan.

5.2 Satu sumber perhitungan tagihan
Gunakan perhitungan backend yang sama untuk detail reservasi, pembayaran, checkout, dan invoice.

text


Total tagihan =
  biaya kamar
  + fasilitas/layanan tambahan
  + pajak dan biaya layanan yang berlaku
  - diskon

Pembayaran bersih =
  pembayaran berhasil
  - pembayaran yang dibatalkan atau dikembalikan secara sah

Sisa tagihan = total tagihan - pembayaran bersih
Ketentuan:

Pembayaran gagal atau masih menunggu tidak dihitung sebagai pelunasan.
Sisa > 0 dan belum ada pembayaran: belum dibayar.
Sisa > 0 dan sudah ada pembayaran: dibayar sebagian.
Sisa = 0: lunas, termasuk tagihan nol yang sah.
Sisa < 0: tampilkan kredit/kelebihan pembayaran secara eksplisit; jangan menyembunyikannya menjadi nol.
Perubahan tagihan setelah pembayaran dapat membuat transaksi kembali memiliki sisa.
Deposit jaminan tidak otomatis mengurangi tagihan, kecuali ada proses penerapan deposit yang tercatat.
Gunakan tipe desimal tetap atau satuan nominal terkecil sesuai mata uang, bukan perhitungan pecahan biner biasa.
Pajak, diskon, pembulatan, dan biaya layanan mengikuti aturan proyek yang sudah berlaku.
5.3 Aturan ketersediaan kamar
Rentang menginap menggunakan:

text


[tanggal check-in, tanggal checkout)
Artinya, checkout tanggal 12 tidak menghalangi reservasi berikutnya mulai tanggal 12, selama ketentuan jam operasional dan kesiapan kamar terpenuhi.

Benturan terjadi ketika:

text


check-in lama < checkout baru
DAN
checkout lama > check-in baru
Ketentuan tambahan:

Reservasi dibatalkan tidak mengurangi ketersediaan.
Status reservasi yang menahan inventori harus dipetakan dari sistem aktual.
Reservasi sementara harus memiliki aturan kedaluwarsa jika fitur tersebut ada.
Kamar dalam perawatan tidak tersedia pada periode perawatannya.
Kamar kotor dapat memiliki ketersediaan untuk masa mendatang, tetapi tidak boleh dianggap siap check-in saat ini.
Kamar spesifik harus tersedia sepanjang periode, bukan hanya pada hari pertama.
Jika reservasi boleh dibuat hanya berdasarkan tipe, stok tipe yang belum memiliki nomor kamar juga harus diperhitungkan.
Backend memvalidasi ulang saat penyimpanan dengan mekanisme transaksi/penguncian yang sesuai untuk mencegah dua petugas mengambil stok terakhir bersamaan.
6. Fitur A — Dashboard reservasi dan monitoring kamar
6.1 Penempatan menu
Tambahkan Dashboard Reservasi dalam kelompok menu Reservasi, menggunakan navigasi dan izin yang sudah ada.

Halaman ini menjadi titik awal untuk menjawab:

Tipe kamar apa yang tersedia pada periode tertentu?
Berapa unit yang dapat dipesan?
Kamar mana yang sedang ditempati atau perlu dibersihkan?
Reservasi mana yang akan check-in atau checkout?
6.2 Susunan halaman
Header

Breadcrumb.
Judul “Dashboard Reservasi”.
Deskripsi singkat.
Tombol utama “Buat Reservasi”.
Tombol “Walk-in” jika pengguna berwenang.
Panel pencarian

Tanggal check-in dan checkout.
Jumlah kamar.
Jumlah tamu.
Tipe kamar.
Tombol terapkan dan reset.
Tanggal checkout wajib lebih besar dari check-in. Kapasitas tamu harus mempertimbangkan aturan tipe kamar dan fasilitas tempat tidur tambahan yang memang didukung.

Ringkasan

Pisahkan dua kelompok agar angka tidak membingungkan:




Kelompok	Isi
Ketersediaan periode terpilih	Unit tersedia, unit teralokasi, unit terblokir/perawatan
Operasional hari ini	Kamar ditempati, siap digunakan, kotor/dibersihkan, kedatangan, keberangkatan
Jika menampilkan okupansi:

text


Okupansi periode =
  malam-kamar teralokasi
  / malam-kamar yang dapat dijual
  × 100%
Definisikan status reservasi yang masuk pembilang. Periode mengikuti zona waktu hotel, dan kamar perawatan dikeluarkan dari penyebut sesuai tanggal blokir.

Daftar tipe kamar

Setiap tipe menampilkan:

Nama tipe dan kapasitas.
Fasilitas utama.
Foto jika tersedia; gunakan tampilan pengganti jika tidak ada.
Jumlah unit tersedia untuk seluruh periode.
Harga per malam atau rentang harga jika berbeda per tanggal.
Total estimasi untuk periode terpilih dan keterangan pajak.
Tombol “Lihat Kamar” dan “Reservasikan”.
Harga harus berasal dari mekanisme tarif sistem. Jangan mengasumsikan tarif selalu sama setiap malam.

Monitoring kamar

Tampilan matriks kamar per tanggal:

Baris: kamar, dikelompokkan berdasarkan tipe.
Kolom: tanggal.
Blok reservasi menunjukkan periode pemakaian.
Status memiliki teks/ikon selain warna.
Klik blok membuka detail sesuai izin.
Klik kamar membuka nomor, tipe, kondisi, dan tindakan yang relevan.
Untuk layar kecil, sediakan daftar ringkas; matriks boleh digulir horizontal tanpa membuat seluruh halaman melebar.

6.3 Alur dashboard
text


Buka dashboard
→ Pilih periode, jumlah kamar, dan tamu
→ Sistem menghitung ketersediaan
→ Pilih tipe atau kamar
→ Buka formulir reservasi dengan pilihan terisi
→ Backend validasi ulang stok
→ Simpan reservasi
→ Perbarui dashboard dan daftar reservasi
Jika stok berubah sebelum disimpan, pertahankan isian tamu dan tampilkan alternatif kamar.

6.4 Kriteria penerimaan
Perubahan tanggal memperbarui ketersediaan dan estimasi harga.
Kamar yang berbenturan tidak bisa dikonfirmasi.
Reservasi banyak kamar mengurangi inventori dengan jumlah yang tepat.
Reservasi tanpa alokasi nomor kamar tidak menyebabkan stok tipe terjual berlebih.
Data kosong, proses memuat, gagal mengambil data, dan akses ditolak memiliki tampilan khusus.
Setelah transaksi berhasil, data terkait diperbarui tanpa muat ulang seluruh aplikasi.
Reservasi baru tidak dapat dibuat hanya dengan mengandalkan hasil pencarian lama.
7. Fitur B — Pembayaran, status akhir, dan invoice
7.1 Komponen ringkasan pembayaran bersama
Gunakan satu pola tampilan pada walk-in, reservasi, dan checkout:




Bagian	Informasi
Identitas	Kode reservasi, nama tamu, kamar, periode menginap
Rincian tagihan	Kamar, fasilitas, tambahan, pajak, diskon
Ringkasan	Total tagihan, sudah dibayar, sisa
Status	Belum dibayar, dibayar sebagian, lunas
Riwayat	Waktu, nominal, metode, referensi, petugas, status
Tindakan	Bayar/lunasi jika ada sisa; lihat/cetak invoice
Istilah “Bayar” digunakan saat belum ada pembayaran. “Lunasi” digunakan saat sudah dibayar sebagian.

Saat lunas:

Sisa ditampilkan IDR 0.
Tombol bayar/lunasi tidak aktif atau tidak ditampilkan.
Invoice tetap dapat diakses.
Status menginap tetap tampil terpisah.
7.2 Alur walk-in langsung lunas
text


Pilih kamar yang siap
→ Isi tamu dan periode
→ Tinjau tagihan
→ Pilih pembayaran penuh
→ Kirim satu tindakan konfirmasi
→ Backend memvalidasi kamar, tagihan, dan pembayaran
→ Simpan reservasi, check-in, serta pembayaran secara konsisten
→ Tampilkan “Check-in berhasil · Lunas”
→ Sediakan invoice
Jika pembayaran hanya dicatat secara internal, gunakan transaksi database sesuai kemampuan skema. Jika menggunakan penyedia pembayaran eksternal, jangan menganggap pembayaran eksternal dan database dapat diselesaikan dalam satu transaksi; pertahankan mekanisme rekonsiliasi yang digunakan proyek.

Jika cetak atau unduh invoice gagal setelah transaksi tersimpan, transaksi tidak diulang. Pengguna dapat mencoba membuka invoice kembali.

7.3 Alur reservasi booking
text


Buat reservasi
→ Tentukan tanpa pembayaran / pembayaran sebagian / pembayaran penuh
→ Simpan
→ Tampilkan status pembayaran yang sesuai
→ Buka kembali untuk pembayaran lanjutan
→ Catat pembayaran baru
→ Hitung ulang saldo
→ Check-in sesuai kebijakan hotel
→ Tambahan biaya, jika ada, masuk ke tagihan yang sama
PRD ini tidak mewajibkan pelunasan sebelum check-in. Kebijakan tersebut mengikuti ketentuan hotel yang sudah berlaku.

Untuk reservasi grup, gunakan satu ringkasan transaksi dengan rincian per kamar. Jika sistem mendukung pembayaran per kamar, tampilkan alokasinya tanpa menghitung nominal yang sama dua kali.

7.4 Alur checkout dan pelunasan
text


Pilih tamu/reservasi aktif
→ Tinjau kamar dan tagihan terbaru
→ Tambahkan biaya yang berwenang
→ Backend menghitung saldo final
→ Jika ada sisa: catat pelunasan
→ Validasi saldo dan status menginap
→ Konfirmasi checkout
→ Lepaskan alokasi menginap
→ Ubah kondisi kamar sesuai alur housekeeping
→ Picu penugasan housekeeping yang sudah tersedia
→ Tampilkan “Checkout selesai” dan invoice
Usulan kebijakan awal: checkout diblokir selama masih ada sisa tagihan. Jika proyek sudah mendukung tagihan perusahaan atau piutang, pertahankan sebagai pengecualian berizin dengan alasan dan jejak audit.

Pembayaran yang sudah berhasil tidak boleh hilang jika langkah checkout berikutnya gagal.

7.5 Invoice dan bukti pembayaran
Pisahkan fungsi dokumen:

Invoice: rincian kewajiban/tagihan, pembayaran, dan saldo.
Bukti pembayaran: bukti satu penerimaan pembayaran tertentu.
Invoice minimal memuat:

Identitas hotel.
Nomor invoice unik.
Kode reservasi.
Identitas tamu atau penagih.
Tanggal penerbitan dan periode menginap.
Rincian seluruh kamar.
Layanan dan fasilitas tambahan.
Pajak, biaya layanan, serta diskon.
Total, pembayaran bersih, dan sisa.
Label status pembayaran.
Referensi pembayaran yang relevan.
Ketentuan:

Invoice dapat dibuka sebelum checkout.
Invoice booking yang belum lunas tidak boleh berlabel lunas.
Walk-in lunas langsung mendapatkan akses invoice.
Cetak ulang tidak membuat nomor invoice baru.
Semua halaman mengarah ke identitas dokumen yang sama.
Jika belum ada mekanisme dokumen, gunakan satu invoice aktif per reservasi dengan koreksi/revisi yang terlacak.
Tagihan yang sudah difinalisasi tidak boleh berubah diam-diam ketika tarif master diubah.
Koreksi invoice final memerlukan mekanisme pembatalan/pengganti atau revisi sesuai kebijakan, bukan menimpa sejarah.
Tampilan cetak tidak memuat sidebar, navigasi, maupun tombol aplikasi.
7.6 Perlindungan transaksi
Backend menentukan nominal sah dan saldo terkini.
Klik ganda atau pengiriman ulang permintaan yang sama tidak menambah pembayaran kedua.
Dua permintaan pembayaran bersamaan divalidasi terhadap saldo terbaru.
Nomor invoice dilindungi keunikan di database.
Checkout berulang tidak membuat tugas housekeeping ganda.
Hak akses diperiksa backend, bukan hanya dengan menyembunyikan tombol.
8. Fitur C — Konsistensi UI checkout
8.1 Acuan desain
Pilih halaman operasional yang sudah paling konsisten di proyek sebagai acuan, misalnya daftar reservasi atau check-in setelah kode diperiksa.

Samakan:

Pembungkus halaman dan lebar konten.
Breadcrumb.
Ukuran judul dan deskripsi.
Posisi tombol header.
Margin, padding, kartu, dan tabel.
Badge status.
Dialog konfirmasi.
Tampilan memuat, kosong, dan gagal.
Jangan mendesain ulang seluruh aplikasi. Perubahan difokuskan pada checkout dan komponen bersama yang memang diperlukan.

8.2 Susunan halaman checkout
text


Breadcrumb
Judul “Checkout” + deskripsi + tombol kembali

Informasi tamu dan reservasi
Daftar kamar yang akan checkout
Rincian tagihan
Riwayat pembayaran
Ringkasan saldo

Tindakan: Kembali / Lunasi / Konfirmasi Checkout
Perilaku tombol:




Kondisi	Tindakan utama
Masih ada sisa	Lunasi Pembayaran
Saldo nol dan masih menginap	Konfirmasi Checkout
Checkout sudah selesai	Lihat/Cetak Invoice
Permintaan sedang diproses	Nonaktif sementara dengan indikator proses
Dialog konfirmasi menampilkan nama tamu, kamar yang diproses, saldo, dan dampak terhadap housekeeping.

Jika checkout sebagian per kamar sudah didukung, pertahankan. Jika belum, jangan menambahkannya secara implisit; tampilkan jelas bahwa checkout berlaku untuk seluruh reservasi.

9. Kebutuhan data dan kontrak backend
9.1 Pemetaan data yang diperlukan
Ini adalah kebutuhan logis; perluasan tabel hanya dilakukan jika data tersebut belum tersedia.




Area	Data yang diperlukan
Reservasi	Identitas, tamu, periode, status menginap
Alokasi kamar	Reservasi, kamar/tipe, jumlah, periode, status
Item tagihan	Sumber biaya, jumlah, tarif, diskon, pajak
Pembayaran	Nominal, metode, status, waktu, referensi, kunci deduplikasi
Invoice	Nomor, reservasi, waktu terbit, status, versi atau snapshot
Kondisi kamar	Kondisi operasional dan periode blokir
Audit	Pelaku, tindakan, waktu, perubahan, alasan
9.2 Kontrak layanan yang dibutuhkan
Nama URL mengikuti pola proyek setelah audit.




Operasi	Masukan utama	Keluaran utama
Ringkasan dashboard	Periode, filter tipe	Metrik dengan cakupan tanggal jelas
Ketersediaan	Periode, kamar, tamu	Stok tipe, kamar layak, estimasi tarif
Monitoring	Rentang tanggal, tipe	Alokasi kamar dan kondisi
Ringkasan tagihan	Identitas reservasi	Item, total, pembayaran, saldo, status
Pencatatan pembayaran	Reservasi, nominal, metode, kunci deduplikasi	Pembayaran tersimpan dan saldo terbaru
Konfirmasi checkout	Reservasi/kamar sesuai dukungan aktual	Status final dan hasil pemicu housekeeping
Dokumen invoice	Identitas dokumen/reservasi	Data invoice yang konsisten
Kesalahan harus dibedakan menjadi: validasi input, stok berubah, saldo berubah, akses ditolak, transaksi tidak ditemukan, dan kegagalan internal. Respons mengikuti format kesalahan aplikasi yang ada.

10. Kebutuhan nonfungsional
Konsistensi: perubahan pembayaran dan status terkait tidak boleh tersimpan sebagian tanpa status pemulihan yang jelas.
Keamanan: data tamu serta dokumen pembayaran hanya dapat diakses pengguna berizin.
Audit: pembayaran, koreksi, checkout, dan penerbitan/penggantian invoice dapat ditelusuri.
Kinerja: target awal respons dashboard persentil ke-95 maksimal dua detik pada dataset dan lingkungan uji yang disepakati.
Skalabilitas tampilan: batasi rentang awal matriks, misalnya tujuh hari; gunakan pemuatan bertahap untuk banyak kamar.
Aksesibilitas: status tidak bergantung warna, formulir memiliki label, dan dialog dapat digunakan dengan papan ketik.
Zona waktu: tanggal operasional menggunakan zona waktu hotel secara konsisten.
Kompatibilitas: perubahan kontrak tidak merusak alur lama atau koleksi pengujian yang masih dipakai.
11. Langkah pengerjaan
Tahap 1 — Audit kode dan baseline
Periksa backend dan frontend untuk menemukan:

Dependensi serta perintah menjalankan aplikasi.
Skema data dan cara migrasi.
Route/controller/service reservasi, walk-in, pembayaran, invoice, checkout.
Perhitungan tagihan dan status.
Alokasi banyak kamar serta reservasi grup.
Pemicu housekeeping.
Layout, header, tabel, badge, dan dialog bersama.
Autentikasi serta izin.
Pengujian yang tersedia.
Hasil wajib: peta berkas aktual, alur saat ini, akar masalah yang bisa direproduksi, dan daftar perubahan. Jangan mulai dengan mengganti arsitektur.

Tahap 2 — Tetapkan kontrak dan kebijakan
Petakan status lama ke status konseptual PRD.
Tentukan sumber tunggal perhitungan saldo.
Pastikan definisi inventori tipe dan kamar.
Tetapkan kebijakan checkout, invoice, dan koreksi.
Identifikasi kebutuhan migrasi minimal.
Selesai jika: backend dan frontend memiliki definisi yang sama untuk status, nominal, serta ketersediaan.

Tahap 3 — Perbaiki pembayaran dan invoice
Satukan perhitungan tagihan.
Tambahkan perlindungan pengiriman ulang.
Perbaiki walk-in langsung lunas.
Perbaiki pembayaran lanjutan booking.
Satukan ringkasan pembayaran dan akses invoice.
Tambahkan pengujian transaksi bersamaan dan kegagalan parsial.
Tahap 4 — Perbaiki checkout
Gunakan ringkasan tagihan yang sama.
Terapkan validasi saldo.
Pertahankan dukungan banyak kamar.
Pastikan housekeeping dipicu tepat satu kali.
Samakan header dan struktur halaman.
Uji transaksi yang sudah lunas sebelum checkout.
Tahap 5 — Bangun dashboard reservasi
Implementasikan layanan ketersediaan dan ringkasan.
Tambahkan filter dan daftar tipe.
Tambahkan monitoring kamar.
Hubungkan tindakan ke formulir reservasi yang sudah ada.
Tambahkan pembaruan data setelah mutasi.
Uji rentang tanggal, stok tipe, dan konkurensi.
Tahap 6 — Migrasi dan rekonsiliasi
Jika diperlukan perubahan data:

Cadangkan database.
Uji migrasi pada salinan data.
Identifikasi transaksi lama dengan saldo/status tidak konsisten.
Buat laporan anomali sebelum memperbaikinya.
Jangan mengarang riwayat pembayaran dari label “lunas” saja.
Jangan mengganti nomor invoice lama tanpa prosedur.
Siapkan pemulihan aplikasi dan data jika rilis gagal.
Tahap 7 — Uji penerimaan dan rilis
Jalankan pengujian otomatis yang tersedia.
Jalankan build, pemeriksaan tipe, dan lint jika tersedia.
Lakukan pengujian operasional bersama pengguna.
Rilis bertahap, lalu pantau pembayaran ganda, saldo tidak cocok, benturan kamar, serta housekeeping yang gagal terbentuk.
Urutan dependensi: audit → kontrak → pembayaran/invoice → checkout → dashboard → rekonsiliasi dan pengujian akhir → rilis.

12. Matriks pengujian penerimaan



Skenario	Hasil yang harus terjadi
Walk-in dibayar penuh	Check-in aktif, pembayaran lunas, invoice tersedia
Klik konfirmasi pembayaran dua kali	Hanya satu pembayaran tercatat
Dua petugas membayar saldo terakhir bersamaan	Tidak terjadi pembayaran berlebih tanpa penanganan eksplisit
Booking tanpa pembayaran	Belum dibayar dan saldo sesuai total
Booking dibayar sebagian	Pembayaran sebagian dan saldo tepat
Booking dilunasi sebelum datang	Lunas, status menginap tetap dipesan
Tambah biaya setelah lunas	Saldo dan status dihitung ulang
Checkout dengan saldo nol	Berhasil tanpa meminta pembayaran ulang
Checkout dengan sisa	Diblokir atau mengikuti pengecualian berizin
Checkout dikirim ulang	Tidak membuat tugas housekeeping kedua
Pembayaran berhasil, checkout gagal	Pembayaran tetap tercatat dan checkout dapat dilanjutkan
Cetak invoice gagal	Pembayaran tidak diulang
Invoice dibuka dari tiga modul	Identitas dan angka konsisten
Reservasi tiga kamar	Ketiganya terhitung dalam stok dan tagihan
Reservasi tipe tanpa nomor kamar	Tetap mengurangi stok tipe
Reservasi dibatalkan	Stok dilepas sesuai kebijakan
Checkout tanggal 12, booking baru tanggal 12	Tidak dianggap benturan tanggal
Kamar kotor	Tidak bisa walk-in/check-in sampai siap sesuai kebijakan
Kamar dalam perawatan	Tidak dapat dijual pada periode blokir
Dua petugas memesan stok terakhir	Hanya satu reservasi berhasil
Layar ponsel	Header, ringkasan, dan tombol tetap dapat digunakan
Pengguna tanpa izin pembayaran	Ditolak oleh backend
Data lama tidak konsisten	Dilaporkan untuk rekonsiliasi, tidak diperbaiki dengan asumsi
13. Definisi selesai
Pekerjaan dianggap selesai ketika:

Ketiga permintaan revisi terpenuhi.
Seluruh skenario kritis di atas lulus.
Perhitungan invoice dan halaman transaksi berasal dari sumber yang sama.
Tidak ada regresi reservasi banyak kamar, grup, fasilitas tambahan, maupun housekeeping.
Tidak ada migrasi destruktif tanpa persetujuan dan cadangan.
Dokumentasi kontrak, hasil pengujian, dan catatan rilis diperbarui.
Pengujian yang belum dapat dijalankan dilaporkan dengan jelas.