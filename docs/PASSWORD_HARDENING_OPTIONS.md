# Dokumen Analisis Strategi Penguatan Password (T3)
**Project:** Sistem Manajemen Hotel (Grand Marstech Hotel & Resort Enterprise PMS)  
**Dokumen:** Opsi Arsitektur Password Hashing: Standar HMAC-SHA512 vs Argon2id  
**Tanggal:** 2026-10-15  
**Penulis:** Security Engineer (PT Marstech Global)  
**Status:** **DITAHAN — MENUNGGU KEPUTUSAN MANAJEMEN / PEMILIK TEMPLATE**

---

## 1. Latar Belakang & Masalah Keamanan

Saat ini, mekanisme penyimpanan password pada template standar "Standard" PT Marstech Global menggunakan algoritma:
$$\text{Hash} = \text{HMAC-SHA512}(\text{USER\_KEY} + \text{user\_code} + \text{password}, \text{USER\_SECRET})$$

Terdapat dua masalah fundamental pada mekanisme ini:
1. **Dual-Use `USER_SECRET` (Ketergantungan Kritis):**
   Variabel `USER_SECRET` digunakan sekaligus untuk menandatangani JWT Access Token (`HS256`) dan sebagai *salt/secret* HMAC password. Jika secret JWT bocor atau dirotasi berkala (kebutuhan wajib compliance PCI-DSS / ISO 27001), maka **seluruh password pengguna yang ada di database seketika rusak/batal** dan tidak ada pengguna yang dapat login.
2. **Ketiadaan *Cost Factor* (Work Factor):**
   HMAC-SHA512 dirancang untuk kecepatan tinggi (*high throughput message authentication*), bukan untuk perlindungan password (*password hashing*). Bila database dan secret server terekspos, serangan offline brute-force / dictionary attack menggunakan GPU/ASIC dapat menguji miliaran kombinasi per detik.

---

## 2. Analisis Perbandingan Opsi

### Opsi A: Tetap HMAC-SHA512 Standar dengan Secret Baru (Rekomendasi Bertahan)
Mempertahankan algoritma HMAC-SHA512 sesuai template standar PT Marstech Global, namun memperkuat nilai secret (`USER_KEY` dan `USER_SECRET` minimal 32 karakter acak) dan merencanakan prosedur reset massal.

- **Kelebihan:**
  - **100% Patuh Standar Boilerplate:** Tidak mengubah pola arsitektur template magang/intern PT Marstech Global.
  - **Zero Dependency:** Menggunakan modul native Node.js `crypto` bawaan runtime tanpa instalasi package baru.
  - **Performa Tinggi:** Waktu verifikasi mikro-detik, beban CPU sangat minim.
- **Kekurangan:**
  - **Semua Hash Lama Batal (Reset Massal):** Mengganti `USER_SECRET` atau `USER_KEY` menyebabkan semua hash lama di database `mst_user` dan dump `essential.sql` tidak dapat diverifikasi lagi.
  - **Dual-Use Tetap Ada:** Rotasi secret JWT di masa depan tetap akan mematikan login pengguna kecuali `PASSWORD_SECRET` dipisahkan.
- **Mitigasi Operasional yang Dibutuhkan:**
  - Penyediaan skrip CLI *operational password reset* untuk admin / devops.
  - Re-seeding user awal via `knex seed:run`.

---

### Opsi B: Argon2id sebagai Usulan Perubahan Standar Perusahaan
Mengusulkan migrasi standar perusahaan ke **Argon2id** (pemenang Password Hashing Competition / RFC 9106), standar emas industri yang direkomendasikan OWASP dan NIST SP 800-63B.

- **Kelebihan:**
  - **Ketahanan Kriptografi Maksimal:** Kebal terhadap serangan GPU, ASIC, dan FPGA berkat sifat *memory-hard*.
  - **Per-User Salt Otomatis:** Setiap hash memiliki salt acak unik kriptografis yang tersimpan langsung di dalam string hash (format modular crypt `$argon2id$v=19$m=...`).
  - **Memutus Dual-Use Secret:** Tidak bergantung pada `USER_SECRET` server. Rotasi secret JWT sama sekali tidak memengaruhi akun pengguna.
  - **Dapat Dilakukan Lazy Migration:** User lama dengan format 128-char hex (HMAC) otomatis di-upgrade ke Argon2id saat login sukses pertama kali tanpa perlu reset massal.
- **Kekurangan & Risiko Teknis:**
  - **Menambah Dependency Eksternal:** Memerlukan library seperti `argon2` (yang membutuhkan kompilasi native node-gyp C++) atau library alternatif berbasis WebAssembly.
  - **Menyimpang dari Template Standar:** Perlu persetujuan resmi dari pemilik template (Lead Architect PT Marstech Global) sebelum diadopsi di seluruh proyek magang.
  - **Konsumsi Memori Server:** Setiap verifikasi login membutuhkan alokasi memori (mis. 19-64 MB RAM per verifikasi) yang perlu diperhitungkan untuk server dengan resource terbatas.

---

## 3. Matriks Evaluasi Komparatif

| Kriteria Evaluasi | Opsi A (HMAC-SHA512 Baru) | Opsi B (Argon2id Perubahan Standar) |
|:---|:---|:---|
| **Kepatuhan Template Marstech** | **100% Sesuai** | Membutuhkan amandemen standar |
| **Dependency Tambahan** | **Tidak Ada** (Native `crypto`) | Ada (`argon2` / native binary) |
| **Resistansi Brute-Force (GPU)** | Rendah (Fast Hash) | **Sangat Tinggi (Memory-Hard)** |
| **Per-User Salt Acak** | Tidak (Salt statis `user_code` + secret) | **Ya (CSPRNG Salt per record)** |
| **Dampak Rotasi Secret JWT** | **FATAL** (Semua password invalid) | **AMAN** (Terisolasi total) |
| **Dampak ke Akun Lama** | Wajib Reset Massal / Re-seed | Bisa Lazy Migration bertahap |
| **Beban Server (CPU & RAM)** | Sangat Ringan | Terukur (Dapat dikonfigurasi) |

---

## 4. Analisis Dampak Menyeluruh ke Komponen Sistem

### 1. Dampak ke Seeders (`seeds/superadmin.js`, `seeds/seed_hotel_enterprise_users.js`)
- **Pada Opsi A:**
  Seeder tetap berjalan normal. Begitu `USER_KEY` dan `USER_SECRET` baru dipasang di `.env`, menjalankan `npx knex seed:run` akan langsung memperbarui password superadmin dan enterprise staff dengan hash HMAC-SHA512 baru yang valid.
- **Pada Opsi B:**
  Fungsi seeder harus diubah menjadi asynchronous (`await hashPassword(passwordRaw)`) sebelum melakukan `insert` ke tabel `mst_user`.

### 2. Dampak ke Database Dump (`essential.sql`)
- **Fakta Temuan:**
  Di file `essential.sql` baris tabel `mst_user`, terdapat data statis pengguna:
  - `superadmin@admin.com` (hash hex: `5e7bd870d5...`)
  - `abidrafiul9@gmail.com` (hash hex: `94d7065b7b...`)
- **Pada Opsi A:**
  Kedua hash statis ini dibuat menggunakan secret lama. Jika sistem dijalankan dengan secret baru, user hasil import `essential.sql` ini **tidak akan bisa login** hingga password direset atau ditimpa oleh seeder `seeds/superadmin.js`.
- **Pada Opsi B:**
  Hash statis di `essential.sql` harus diperbarui ke format hash baru, atau dokumentasi instalasi wajib mewajibkan eksekusi seeder setelah import dump SQL.

### 3. Dampak ke Login Endpoint (`routes/v1/auth/login.js`)
- **Pada Opsi A:**
  Tidak ada perubahan algoritma. Tetap menggunakan:
  ```javascript
  const cPassword = process.env.USER_KEY + oUser.user_code + oPayload.password;
  if (!hashEquals(hmac(cPassword, secret, "sha512"), oUser.password)) { ... }
  ```
- **Pada Opsi B:**
  Memerlukan logika verifikasi ganda (Lazy Migration):
  ```javascript
  if (oUser.password.startsWith('$argon2id$')) {
    isValid = await argon2.verify(oUser.password, oPayload.password);
  } else {
    // Verifikasi fallback HMAC lama, lalu migrasi otomatis jika benar
    isValid = hashEquals(hmac(cPassword, secret, "sha512"), oUser.password);
    if (isValid) {
      const newHash = await argon2.hash(oPayload.password);
      await DB("mst_user").where("id", oUser.id).update({ password: newHash });
    }
  }
  ```

### 4. Dampak ke User Create & Update (`user_create.js` & `user_update.js`)
- **Pada Opsi A:**
  Tidak ada perubahan kode. Tetap menghasilkan string 128 karakter hex HMAC-SHA512.
- **Pada Opsi B:**
  Pembuatan dan pembaruan password beralih memanggil `await argon2.hash(password)`. Kolom database `password` (varchar 255) sudah cukup menampung format hash Argon2id (sekitar 96-100 karakter).

### 5. Dampak ke Frontend (`next_pms_fe/lib/tools/encryptTools.ts`)
- **Fakta Temuan:**
  Frontend mengirimkan password dalam bentuk *cleartext* melalui saluran terenkripsi TLS/HTTPS ke BFF Interceptor (`POST /api/v1/auth/login`).
- `encryptTools.ts` di frontend **tidak pernah digunakan untuk hashing password pengguna**.
- Namun demikian, `encryptTools.ts` saat ini menggunakan sintaks `const crypto = require('crypto')` di dalam file TypeScript Next.js. Ini merupakan *minor lint issue* yang dapat dirapikan ke `import crypto from 'crypto'` tanpa memengaruhi alur password.

---

## 5. Rekomendasi Langkah Kerja

1. **Jangka Pendek (Menyelesaikan Hardening Saat Ini):**
   - **Terapkan OPSI A (Sesuai Arahan):** Pertahankan algoritma HMAC-SHA512 standar perusahaan agar tidak melanggar aturan template dan tidak menambah dependensi eksternal tanpa izin.
   - Siapkan skrip reset password operasional aman bagi user yang terkunci akibat rotasi secret.
   - Jalankan seeder ulang untuk akun testing/operasional (`superadmin@admin.com`).
2. **Jangka Panjang (Usulan ke Komite Template PT Marstech Global):**
   - Ajukan dokumen ini ke pemilik template untuk mempertimbangkan migrasi resmi standar boiler plate ke Argon2id pada rilis template berikutnya (v2.0).
