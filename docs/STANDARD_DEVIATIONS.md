# Standar vs Realitas Implementasi (Standard Deviations)
**Project:** Sistem Manajemen Hotel (Grand Marstech Hotel & Resort Enterprise PMS)  
**Dokumen:** Analisis Deviasi Standar Template Perusahaan (PT Marstech Global)  
**Tanggal:** 2026-10-15  
**Status:** Menunggu tanggapan / klarifikasi pemilik template

Dokumen ini mencatat secara formal kesenjangan (gap) antara spesifikasi arsitektur standar perusahaan (`express_pms_be/README.md`, `API STANDART.postman_collection.json`) dengan kenyataan teknis yang diimplementasikan di repositori backend (`express_pms_be`) dan frontend (`next_pms_fe`). Dokumen ini disusun untuk mempertahankan integritas template asli tanpa mengubah file README standar secara sepihak.

---

## Ringkasan 7 Deviasi Standar

| No | Komponen / Spesifikasi | Standar Template Perusahaan | Kenyataan di Kode | Tingkat Risiko | Status Tindakan Saat Ini |
|:---|:---|:---|:---|:---|:---|
| 1 | **`validateSignature`** | Wajib di semua route non-auth (`/setup`, `/function`, dll), diekspor dari `validate_header.js`. | Tidak pernah diekspor/dibuat di `validate_header.js`. Router `v1/index.js` hanya memasang `[validateAccessToken, contextMiddleware]`. | **Sedang** (Integritas payload mengandalkan TLS/HTTPS; dead specification). | **Ditahan (No-op)**. Tidak diimplementasikan tanpa spesifikasi algoritma resmi. |
| 2 | **`validateBaseToken`** | Middleware autentikasi khusus untuk rute `/auth/token`, diekspor dari `validate_header.js`. | Tidak ada fungsi maupun ekspor `validateBaseToken` di seluruh repositori. | **Rendah** (Fitur hantu / tidak aktif). | **Ditahan (No-op)**. Tidak dibuat karena tidak ada alur *client credentials*. |
| 3 | **Endpoint `/auth/token`** | Endpoint untuk memperoleh access token awal (`token_get.js`). | File `routes/v1/auth/token_get.js` tidak ada. Route `/auth/token` tidak terdaftar. Autentikasi FE langsung ke `/auth/login`. | **Rendah** (Phantom endpoint). | **Ditahan (No-op)**. Rute yang aktif adalah `/auth/login`, `/auth/refresh-token`, `/auth/me`, `/auth/switch-branch`. |
| 4 | **Kunci RSA di `core/key`** | Folder `/core/key` memuat `public.pem` dan `private.pem` (min. 2048-bit). Public key disamakan dengan FE. | Folder `/core/key` dan file `.pem` tidak ada. JWT menggunakan simetris HMAC-SHA256 (`HS256`) via library `jose` dengan `USER_SECRET`. Kode sisa di `servertool.js` mereferensikan `../core/key/brick_public.pem`. | **Tinggi** (Misleading architecture). Potensi runtime error jika fungsi sisa Brick dipanggil. | **Catat sebagai Dead Code**. Jangan mengarang pasangan kunci RSA tanpa rilis resmi perusahaan. |
| 5 | **`X-Signature` di FE Interceptor** | Terdaftar di CORS `allowedHeaders` backend dan disebutkan di README. | BFF Interceptor FE (`app/api/interceptor*`) tidak pernah menghasilkan atau mengirimkan `X-Signature`. Di Postman, pre-request script hanya mengeset `X-Timestamp`. | **Rendah** (Header hiasan). | **Dipertahankan di CORS** demi kompatibilitas template, tidak diwajibkan di FE. |
| 6 | **Sisa Kode `X-Credential` & `decryptXCredential`** | Header enkripsi credential diizinkan di CORS `app.js` dan didefinisikan di interface FE. | Fungsi `decryptXCredential` di `encrypt_tools.js` rusak (`OpenSSLDecrypt` dan `jwtVerify` tidak terdefinisi). Diimpor di `user_create.js` dan `user_update.js` tapi tidak pernah dipanggil. | **Sedang** (Broken dead code). | **Dipertahankan sebagai Dead Code**. Tidak dihapus sekarang sesuai arahan, diisolasi agar tidak dieksekusi. |
| 7 | **`USER_PAS_KEY` Tak Terpakai** | Wajib diisi random di `.env` (README BE & FE). | Tidak pernah dibaca oleh satu baris kode pun di BE maupun FE. Hashing password hanya menggunakan `USER_KEY` dan `USER_SECRET`. | **Rendah** (Phantom configuration). | **Dipertahankan di `.env.example`** (divalidasi keberadaannya/tidak kosong, bukan panjang minimal 32 karakter). |

---

## Rincian Teknis Per Komponen

### 1. `validateSignature`
- **Spesifikasi Standar (`README.md` baris 161-166, 175, 191-214):**
  README menyatakan bahwa `validateSignature` adalah salah satu dari 3 middleware utama yang WAJIB dipasang pada seluruh route non-auth:
  ```javascript
  router.use("/setup", [validateAccessToken, validateSignature, contextMiddleware], Setup);
  ```
- **Kenyataan Kode:**
  Di `express_pms_be/middleware/validate_header.js`, fungsi ini tidak pernah ditulis maupun diekspor. Rute pada `express_pms_be/routes/v1/index.js` hanya memuat `[validateAccessToken, contextMiddleware]`. Tidak ada formula signature (HMAC payload, sorting parameter, atau hashing body) yang terdokumentasi.
- **Rekomendasi:** Pertahankan arsitektur saat ini tanpa mengarang skema signature sendiri. Pertanyaan mengenai standarisasi signature diajukan ke pemilik template.

### 2. `validateBaseToken` & Endpoint `/auth/token`
- **Spesifikasi Standar (`README.md` baris 156, 164, 169):**
  README mencontohkan import `AccessToken` dari `./auth/token_get.js` dan registrasi route:
  ```javascript
  router.use("/auth/token", [validateBaseToken], AccessToken);
  ```
- **Kenyataan Kode:**
  File `token_get.js` tidak pernah dibuat. Autentikasi frontend menggunakan alur Session JWT via NextAuth v5 yang memanggil langsung `POST /api/v1/auth/login` (kredensial username + password).
- **Rekomendasi:** Alur `/auth/token` merupakan peninggalan template machine-to-machine (M2M) yang tidak digunakan dalam aplikasi PMS ini. Tidak perlu dibuatkan file mock.

### 3. Kunci RSA di `core/key`
- **Spesifikasi Standar (`README.md` baris 77-92):**
  Kebijakan RSA Key Policy mewajibkan penyimpanan RSA key di `/core/key` yang terdiri dari `public.pem` dan `private.pem` minimal 2048-bit.
- **Kenyataan Kode:**
  Folder `express_pms_be/core/key/` tidak ada. Seluruh token JWT ditandatangani menggunakan algoritma simetris `HS256` dengan `process.env.USER_SECRET`. Fungsi `getSignature` dan `encodePayload` di `servertool.js` mencoba membaca `../core/key/brick_public.pem`, namun fungsi-fungsi tersebut merupakan sisa integrasi pihak ketiga (Brick) dan tidak pernah dipanggil oleh alur PMS.
- **Rekomendasi:** Ditandai sebagai dead code. Kunci RSA tidak akan digenerate secara lokal untuk menghindari desinkronisasi antara environment dev dan prod tanpa instruksi pemilik template.

### 4. `X-Signature` di Interceptor Frontend
- **Spesifikasi Standar:**
  Tercantum dalam daftar header yang diizinkan CORS di `app.js` line 47.
- **Kenyataan Kode:**
  File `next_pms_fe/app/api/interceptor/route.ts`, `interceptor_formdata/route.ts`, dan `interceptor_download/route.ts` hanya menyuntikkan header:
  - `Content-Type`
  - `X-Timestamp`
  - `Authorization: Bearer <token>`
  - `X-Branch-Code`
  - `...customHeader` (dari request browser)
- **Rekomendasi:** Tetap izinkan `X-Signature` di CORS BE agar tidak memicu breaking change bila di masa depan ada klien yang mengirimkannya.

### 5. Sisa Kode `X-Credential` & `decryptXCredential`
- **Spesifikasi Standar & Jejak Kode:**
  Muncul di `express_pms_be/routes/v1/components/tools/encrypt_tools.js` baris 50-84 dan diimpor di `user_create.js` dan `user_update.js`.
- **Kenyataan Kode:**
  Fungsi ini mengandung cacat sintaks fatal (memanggil `OpenSSLDecrypt` tanpa definisi, serta `jwtVerify` dan `Logging` tanpa import). Namun, fungsi ini tidak pernah dipanggil di mana pun dalam logika pembuatan atau pembaruan pengguna.
- **Rekomendasi:** Jangan dihapus sekarang agar tidak mengubah struktur modul `encrypt_tools.js`. Diberi catatan sebagai **Dead Code** yang tidak boleh dieksekusi.

### 6. Variabel `USER_PAS_KEY`
- **Spesifikasi Standar:**
  Disebutkan di `express_pms_be/README.md` (baris 62) dan `next_pms_fe/README_FE.md` (baris 38) sebagai variabel yang harus sama antara FE dan BE.
- **Kenyataan Kode:**
  Tidak ada kode di BE maupun FE yang memproses variabel ini. Algoritma hashing password eksisting:
  $$\text{hash} = \text{HMAC-SHA512}(\text{USER\_KEY} + \text{user\_code} + \text{password}, \text{USER\_SECRET})$$
- **Rekomendasi:** Sesuai keputusan, `USER_PAS_KEY` tetap dipertahankan di `.env.example`. Pengecekan startup (`env_check.js`) hanya memvalidasi bahwa variabel ini ada dan tidak kosong (tidak memberlakukan syarat ambang 32 karakter).

### 7. Dual-Use Kriptografi pada `USER_SECRET`
- **Kondisi:**
  Variabel `USER_SECRET` digunakan ganda:
  1. Secret key penandatanganan JWT Access Token (`HS256`).
  2. Kunci rahasia HMAC-SHA512 untuk password pengguna.
- **Risiko Keamanan:**
  Rotasi secret JWT akan membatalkan seluruh hash password pengguna di database, sehingga tidak ada pengguna yang dapat login setelah rotasi secret JWT.
- **Status:**
  Ditahan pada T3 (Rencana: Opsi A - mitigasi terencana / reset terkoordinasi jika secret dirotasi).
