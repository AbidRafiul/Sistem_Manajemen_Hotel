/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file migration_batch3_seeder.js
 * @description Seeder migrasi Batch 3 — Revisi Reservasi & Master Data Baru.
 *              Menjalankan perubahan skema (ALTER TABLE, CREATE TABLE) dan
 *              insert data pendukung secara IDEMPOTENT (aman dijalankan berulang).
 *
 *              Jalankan di production (Railway) SEBELUM deploy kode baru:
 *              npx knex seed:run --specific=migration_batch3_seeder.js
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-17
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-17)
 * @version 1.0.0
 */

import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";

export async function seed(knex) {
  const dDatetimeIso = formatDateSystem();

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  Migration Batch 3 — Revisi Reservasi & Master Baru    ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  // ═══════════════════════════════════════════════════════════════════════
  // 1. ALTER TABLE mst_amenity — Tambah kolom `harga`
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n[1/5] Memeriksa kolom `harga` pada mst_amenity...");
  const amenityColumns = await knex.raw(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_amenity' AND COLUMN_NAME = 'harga'"
  );
  if (amenityColumns[0].length === 0) {
    await knex.raw(
      "ALTER TABLE `mst_amenity` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `icon`"
    );
    console.log("  ✅ Kolom `harga` berhasil ditambahkan ke mst_amenity");
  } else {
    console.log("  ⏭️  Kolom `harga` sudah ada di mst_amenity — dilewati");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. ALTER TABLE mst_fasilitas — Tambah kolom `harga`
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n[2/5] Memeriksa kolom `harga` pada mst_fasilitas...");
  const fasilitasColumns = await knex.raw(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_fasilitas' AND COLUMN_NAME = 'harga'"
  );
  if (fasilitasColumns[0].length === 0) {
    await knex.raw(
      "ALTER TABLE `mst_fasilitas` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `name`"
    );
    console.log("  ✅ Kolom `harga` berhasil ditambahkan ke mst_fasilitas");
  } else {
    console.log("  ⏭️  Kolom `harga` sudah ada di mst_fasilitas — dilewati");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. CREATE TABLE mst_tipe_kamar_foto
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n[3/5] Memeriksa tabel `mst_tipe_kamar_foto`...");
  const tableExists = await knex.raw(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_tipe_kamar_foto'"
  );
  if (tableExists[0].length === 0) {
    await knex.raw(`
      CREATE TABLE mst_tipe_kamar_foto (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("  ✅ Tabel `mst_tipe_kamar_foto` berhasil dibuat");
  } else {
    console.log("  ⏭️  Tabel `mst_tipe_kamar_foto` sudah ada — dilewati");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Insert FMT Penomoran yang belum ada
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n[4/5] Memeriksa format penomoran baru...");

  const requiredFormats = [
    { kode_format: "FMT-FASILITAS",   nama_tabel: "mst_fasilitas",         prefix: "FAS", panjang_digit: 4, nomor_terakhir: 0 },
    { kode_format: "FMT-RESERVASI",   nama_tabel: "trx_reservation",       prefix: "RSV", panjang_digit: 4, nomor_terakhir: 0 },
    { kode_format: "FMT-RESROOM",     nama_tabel: "trx_reservation_room",  prefix: "RRO", panjang_digit: 4, nomor_terakhir: 0 },
    { kode_format: "FMT-CHECKIN",     nama_tabel: "trx_checkin",           prefix: "CHK", panjang_digit: 4, nomor_terakhir: 0 },
    { kode_format: "FMT-FOLIO",       nama_tabel: "trx_folio",             prefix: "FOL", panjang_digit: 4, nomor_terakhir: 0 },
    { kode_format: "FMT-FOLIOCHARGE", nama_tabel: "trx_folio_charge",      prefix: "FCH", panjang_digit: 4, nomor_terakhir: 0 },
    { kode_format: "FMT-PAYMENT",     nama_tabel: "trx_payment",           prefix: "PAY", panjang_digit: 4, nomor_terakhir: 0 },
  ];

  for (const fmt of requiredFormats) {
    const exists = await knex("sys_format_penomoran")
      .where("kode_format", fmt.kode_format)
      .first();
    if (!exists) {
      await knex("sys_format_penomoran").insert({
        ...fmt,
        is_active: 1,
        created_at: dDatetimeIso,
        updated_at: dDatetimeIso,
      });
      console.log(`  ✅ ${fmt.kode_format} ditambahkan`);
    } else {
      console.log(`  ⏭️  ${fmt.kode_format} sudah ada — dilewati`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Update navigasi — Merge menu "Tamu Menginap" ke role yang ada
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n[5/5] Memperbarui navigasi menu...");

  const targetRoles = ["superadmin", "admin", "master"];
  for (const roleName of targetRoles) {
    const navRow = await knex("mst_navigation").where("role", roleName).first();
    if (!navRow) {
      console.log(`  ⚠️  Role "${roleName}" tidak ditemukan di mst_navigation — dilewati`);
      continue;
    }

    let menuData;
    try {
      menuData = JSON.parse(navRow.menu);
    } catch (e) {
      console.log(`  ⚠️  Menu JSON untuk role "${roleName}" tidak valid — dilewati`);
      continue;
    }

    // Cari section "Reservasi"
    const reservasiSection = menuData.find(
      (section) => section.label && section.label.toLowerCase().includes("reservasi")
    );

    if (reservasiSection && reservasiSection.items) {
      const hasTamuMenuginap = reservasiSection.items.some(
        (item) => item.to === "/tamu_menginap"
      );
      if (!hasTamuMenuginap) {
        // Cari posisi setelah "Kedatangan (Arrivals)" atau di akhir
        const arrivalsIdx = reservasiSection.items.findIndex(
          (item) => item.to === "/reservasi_checkin"
        );
        const insertAt = arrivalsIdx >= 0 ? arrivalsIdx + 1 : reservasiSection.items.length;
        reservasiSection.items.splice(insertAt, 0, {
          label: "Tamu Menginap",
          icon: "pi pi-fw pi-users",
          to: "/tamu_menginap",
        });

        await knex("mst_navigation")
          .where("role", roleName)
          .update({
            menu: JSON.stringify(menuData),
            updated_at: dDatetimeIso,
          });
        console.log(`  ✅ Menu "Tamu Menginap" ditambahkan untuk role "${roleName}"`);
      } else {
        console.log(`  ⏭️  Menu "Tamu Menginap" sudah ada untuk role "${roleName}" — dilewati`);
      }
    } else {
      console.log(`  ⚠️  Section "Reservasi" tidak ditemukan untuk role "${roleName}" — dilewati`);
    }
  }

  // Update user_navigation juga
  const userNavTable = await knex.raw(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_navigation'"
  );
  if (userNavTable[0].length === 0) {
    await knex.raw(`
      CREATE TABLE user_navigation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_code VARCHAR(50) NOT NULL,
        menu LONGTEXT,
        tz VARCHAR(50) NOT NULL DEFAULT 'UTC',
        created_at DATETIME DEFAULT NULL,
        updated_at DATETIME DEFAULT NULL,
        UNIQUE KEY uq_user_navigation_uniqueid (user_code) USING BTREE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("  ✅ Tabel `user_navigation` dibuat");
  }

  const allUserNavs = await knex("user_navigation").select("*");
  let userNavUpdated = 0;
  for (const userNav of allUserNavs) {
    let userMenu;
    try {
      userMenu = JSON.parse(userNav.menu);
    } catch (e) {
      continue;
    }

    const reservasiSection = userMenu.find(
      (section) => section.label && section.label.toLowerCase().includes("reservasi")
    );

    if (reservasiSection && reservasiSection.items) {
      const hasTamuMenuginap = reservasiSection.items.some(
        (item) => item.to === "/tamu_menginap"
      );
      if (!hasTamuMenuginap) {
        const arrivalsIdx = reservasiSection.items.findIndex(
          (item) => item.to === "/reservasi_checkin"
        );
        const insertAt = arrivalsIdx >= 0 ? arrivalsIdx + 1 : reservasiSection.items.length;
        reservasiSection.items.splice(insertAt, 0, {
          label: "Tamu Menginap",
          icon: "pi pi-fw pi-users",
          to: "/tamu_menginap",
        });

        await knex("user_navigation")
          .where("id", userNav.id)
          .update({
            menu: JSON.stringify(userMenu),
            updated_at: dDatetimeIso,
          });
        userNavUpdated++;
      }
    }
  }
  if (userNavUpdated > 0) {
    console.log(`  ✅ Menu "Tamu Menginap" ditambahkan ke ${userNavUpdated} user navigation`);
  } else {
    console.log(`  ⏭️  Semua user navigation sudah up-to-date`);
  }

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Migration Batch 3 selesai!                         ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
}
