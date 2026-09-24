/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file seed_hotel_enterprise_users.js
 * @description Seeder pengguna hotel enterprise & role permission navigasi standar enterprise.
 * @author Antigravity
 * @created 2026-09-22
 * @version 1.0.0
 */

import "dotenv/config";
import DB from "../core/config/knex.js";
import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";
import { hmac } from "../routes/v1/components/tools/encrypt_tools.js";

export async function seedHotelEnterpriseUsers() {
  console.log("===============================================================");
  console.log(" SEEDING ENTERPRISE HOTEL ROLES, PERMISSIONS & USERS");
  console.log("===============================================================");

  const trx = await DB.transaction();

  try {
    // -------------------------------------------------------------
    // 1. Pastikan Perusahaan & Org Node Terhubung ke Cabang
    // -------------------------------------------------------------
    console.log("▶ [1/4] Menghubungkan cabang ke Regional Jawa Timur (org_node_id = 1)...");
    await trx("mst_cabang")
      .whereIn("kode_cabang", ["CAB0001", "CAB0002"])
      .update({
        company_id: 1,
        org_node_id: 1,
        updated_at: formatDateSystem(),
      });

    // -------------------------------------------------------------
    // 2. Definisi Menu Navigasi Sesuai Role & Wewenang Standar Enterprise
    // -------------------------------------------------------------
    console.log("▶ [2/4] Menyusun role permissions di tabel `mst_navigation`...");

    // Menu Sub-Templates
    const menuDashboard = {
      label: "Utama",
      items: [{ label: "Dashboard", icon: "pi pi-fw pi-home", to: "/dashboard" }],
    };

    const menuReservasiFull = {
      label: "Reservasi",
      icon: "pi pi-fw pi-calendar-plus",
      items: [
        { label: "Dashboard Reservasi", icon: "pi pi-fw pi-th-large", to: "/reservasi_dashboard" },
        { label: "Walk-In Check-in", icon: "pi pi-fw pi-user-plus", to: "/reservasi_baru" },
        { label: "Booking Reservasi", icon: "pi pi-fw pi-calendar", to: "/reservasi_booking" },
        { label: "Kedatangan (Arrivals)", icon: "pi pi-fw pi-sign-in", to: "/reservasi_checkin" },
        { label: "Tamu Menginap", icon: "pi pi-fw pi-users", to: "/tamu_menginap" },
        { label: "Checkout", icon: "pi pi-fw pi-sign-out", to: "/checkout" },
      ],
    };

    const menuReservasiFO = {
      label: "Reservasi",
      icon: "pi pi-fw pi-calendar-plus",
      items: [
        { label: "Dashboard Reservasi", icon: "pi pi-fw pi-th-large", to: "/reservasi_dashboard" },
        { label: "Walk-In Check-in", icon: "pi pi-fw pi-user-plus", to: "/reservasi_baru" },
        { label: "Booking Reservasi", icon: "pi pi-fw pi-calendar", to: "/reservasi_booking" },
        { label: "Kedatangan (Arrivals)", icon: "pi pi-fw pi-sign-in", to: "/reservasi_checkin" },
        { label: "Tamu Menginap", icon: "pi pi-fw pi-users", to: "/tamu_menginap" },
      ],
    };

    const menuReservasiStaff = {
      label: "Reservasi",
      icon: "pi pi-fw pi-calendar-plus",
      items: [
        { label: "Walk-In Check-in", icon: "pi pi-fw pi-user-plus", to: "/reservasi_baru" },
        { label: "Booking Reservasi", icon: "pi pi-fw pi-calendar", to: "/reservasi_booking" },
        { label: "Kedatangan (Arrivals)", icon: "pi pi-fw pi-sign-in", to: "/reservasi_checkin" },
        { label: "Tamu Menginap", icon: "pi pi-fw pi-users", to: "/tamu_menginap" },
      ],
    };

    const menuKasirShift = {
      label: "Kasir",
      icon: "pi pi-fw pi-wallet",
      items: [{ label: "Shift Kasir", icon: "pi pi-fw pi-clock", to: "/kasir_shift" }],
    };

    const menuHousekeeping = {
      label: "Housekeeping",
      icon: "pi pi-fw pi-refresh",
      items: [
        { label: "Room Status Board", icon: "pi pi-fw pi-th-large", to: "/housekeeping/room_status_board" },
      ],
    };

    const menuMasterTamuFull = {
      label: "Master Tamu",
      icon: "pi pi-fw pi-users",
      items: [
        { label: "Data Tamu", icon: "pi pi-fw pi-user", to: "/master_tamu" },
        { label: "Dashboard Tamu", icon: "pi pi-fw pi-chart-bar", to: "/master_tamu/dashboard" },
      ],
    };

    const menuMasterTamuDataOnly = {
      label: "Master Tamu",
      icon: "pi pi-fw pi-users",
      items: [
        { label: "Data Tamu", icon: "pi pi-fw pi-user", to: "/master_tamu" },
      ],
    };

    // Struktur Menu Per Role
    const roleNavigations = [
      {
        role: "superadmin",
        menu: [
          menuDashboard,
          {
            label: "MASTER & SETUP CABANG",
            icon: "pi pi-fw pi-cog",
            items: [
              {
                label: "Data Master Hotel",
                icon: "pi pi-fw pi-building",
                items: [
                  { label: "Master Wilayah", icon: "pi pi-fw pi-map", to: "/master_wilayah" },
                  { label: "Master Cabang", icon: "pi pi-fw pi-building", to: "/master_cabang" },
                  { label: "Master Gedung", icon: "pi pi-fw pi-th-large", to: "/master_gedung" },
                  { label: "Master Lantai", icon: "pi pi-fw pi-bars", to: "/master_lantai" },
                  { label: "Corporate / Travel Agent", icon: "pi pi-fw pi-briefcase", to: "/master_corporate" },
                  { label: "Pajak & Service Charge", icon: "pi pi-fw pi-percentage", to: "/master_pajak" },
                  { label: "Master Cashier Counter", icon: "pi pi-fw pi-desktop", to: "/master_cashier_counter" },
                ],
              },
              {
                label: "Kamar & Fasilitas",
                icon: "pi pi-fw pi-home",
                items: [
                  { label: "Tipe Kamar", icon: "pi pi-fw pi-tag", to: "/master_tipe_kamar" },
                  { label: "Master Kamar", icon: "pi pi-fw pi-home", to: "/master_kamar" },
                  { label: "Bed Type", icon: "pi pi-fw pi-inbox", to: "/master_bed_type" },
                  { label: "Fasilitas & Amenity", icon: "pi pi-fw pi-star", to: "/master_amenity" },
                  { label: "Master Fasilitas", icon: "pi pi-fw pi-verified", to: "/master_fasilitas" },
                ],
              },
              {
                label: "Harga & Season",
                icon: "pi pi-fw pi-dollar",
                items: [
                  { label: "Rate Plan (Paket Harga)", icon: "pi pi-fw pi-dollar", to: "/master_rate_plan" },
                  { label: "Master Harga Kamar", icon: "pi pi-fw pi-money-bill", to: "/master_rate_plan_price" },
                  { label: "Season & Pricing", icon: "pi pi-fw pi-calendar", to: "/master_season" },
                ],
              },
              menuMasterTamuFull,
              {
                label: "Konfigurasi Sistem",
                icon: "pi pi-fw pi-sliders-h",
                items: [
                  { label: "User & Role Management", icon: "pi pi-fw pi-users", to: "/setup/users" },
                  { label: "Master Navigasi", icon: "pi pi-fw pi-sitemap", to: "/setup/navigation" },
                  { label: "Konfigurasi Perusahaan", icon: "pi pi-fw pi-sliders-h", to: "/setup/config" },
                ],
              },
            ],
          },
          menuKasirShift,
          menuReservasiFull,
          menuHousekeeping,
        ],
      },
      {
        role: "corporate_manager",
        menu: [
          menuDashboard,
          {
            label: "Operasional Group",
            icon: "pi pi-fw pi-globe",
            items: [
              { label: "Dashboard Reservasi", icon: "pi pi-fw pi-th-large", to: "/reservasi_dashboard" },
              { label: "Tamu Menginap (In-House)", icon: "pi pi-fw pi-users", to: "/tamu_menginap" },
              { label: "Room Status Board", icon: "pi pi-fw pi-refresh", to: "/housekeeping/room_status_board" },
            ],
          },
          menuMasterTamuFull,
          {
            label: "Master Data Hotel",
            icon: "pi pi-fw pi-building",
            items: [
              { label: "Master Wilayah", icon: "pi pi-fw pi-map", to: "/master_wilayah" },
              { label: "Master Cabang", icon: "pi pi-fw pi-building", to: "/master_cabang" },
              { label: "Master Gedung", icon: "pi pi-fw pi-th-large", to: "/master_gedung" },
              { label: "Master Kamar", icon: "pi pi-fw pi-home", to: "/master_kamar" },
              { label: "Rate Plan", icon: "pi pi-fw pi-dollar", to: "/master_rate_plan" },
              { label: "Season & Pricing", icon: "pi pi-fw pi-calendar", to: "/master_season" },
            ],
          },
        ],
      },
      {
        role: "regional_manager",
        menu: [
          menuDashboard,
          {
            label: "Monitoring Wilayah",
            icon: "pi pi-fw pi-map",
            items: [
              { label: "Dashboard Reservasi", icon: "pi pi-fw pi-th-large", to: "/reservasi_dashboard" },
              { label: "Tamu Menginap (In-House)", icon: "pi pi-fw pi-users", to: "/tamu_menginap" },
              { label: "Room Status Board", icon: "pi pi-fw pi-refresh", to: "/housekeeping/room_status_board" },
            ],
          },
          menuMasterTamuFull,
          {
            label: "Informasi Properti",
            icon: "pi pi-fw pi-building",
            items: [
              { label: "Master Wilayah", icon: "pi pi-fw pi-map", to: "/master_wilayah" },
              { label: "Master Gedung", icon: "pi pi-fw pi-th-large", to: "/master_gedung" },
              { label: "Master Kamar", icon: "pi pi-fw pi-home", to: "/master_kamar" },
            ],
          },
        ],
      },
      {
        role: "branch_manager",
        menu: [
          menuDashboard,
          menuReservasiFull,
          menuKasirShift,
          menuHousekeeping,
          menuMasterTamuFull,
          {
            label: "Setup & Master Cabang",
            icon: "pi pi-fw pi-cog",
            items: [
              { label: "Master Gedung", icon: "pi pi-fw pi-th-large", to: "/master_gedung" },
              { label: "Master Lantai", icon: "pi pi-fw pi-bars", to: "/master_lantai" },
              { label: "Tipe Kamar", icon: "pi pi-fw pi-tag", to: "/master_tipe_kamar" },
              { label: "Master Kamar", icon: "pi pi-fw pi-home", to: "/master_kamar" },
              { label: "Fasilitas Hotel", icon: "pi pi-fw pi-verified", to: "/master_fasilitas" },
              { label: "Rate Plan", icon: "pi pi-fw pi-dollar", to: "/master_rate_plan" },
              { label: "Season & Pricing", icon: "pi pi-fw pi-calendar", to: "/master_season" },
              { label: "Cashier Counter", icon: "pi pi-fw pi-desktop", to: "/master_cashier_counter" },
              { label: "Corporate / OTA", icon: "pi pi-fw pi-briefcase", to: "/master_corporate" },
            ],
          },
        ],
      },
      {
        role: "frontdesk",
        menu: [
          menuDashboard,
          menuReservasiFO,
          menuHousekeeping,
          menuMasterTamuFull,
        ],
      },
      {
        role: "receptionist",
        menu: [
          menuReservasiStaff,
          menuHousekeeping,
          menuMasterTamuDataOnly,
        ],
      },
      {
        role: "kasir",
        menu: [
          menuKasirShift,
          {
            label: "Operasional Kasir",
            icon: "pi pi-fw pi-money-bill",
            items: [
              { label: "Tamu Menginap (Folio)", icon: "pi pi-fw pi-users", to: "/tamu_menginap" },
              { label: "Checkout & Tagihan", icon: "pi pi-fw pi-sign-out", to: "/checkout" },
            ],
          },
        ],
      },
      {
        role: "housekeeping",
        menu: [
          menuHousekeeping,
          {
            label: "Kamar",
            icon: "pi pi-fw pi-home",
            items: [
              { label: "Daftar Kamar", icon: "pi pi-fw pi-home", to: "/master_kamar" },
            ],
          },
        ],
      },
      {
        role: "auditor",
        menu: [
          menuDashboard,
          {
            label: "Audit Transaksi",
            icon: "pi pi-fw pi-check-circle",
            items: [
              { label: "Dashboard Reservasi", icon: "pi pi-fw pi-th-large", to: "/reservasi_dashboard" },
              { label: "Tamu Menginap", icon: "pi pi-fw pi-users", to: "/tamu_menginap" },
              { label: "Histori Checkout", icon: "pi pi-fw pi-sign-out", to: "/checkout" },
              { label: "Log Shift Kasir", icon: "pi pi-fw pi-clock", to: "/kasir_shift" },
            ],
          },
          {
            label: "Analisis CRM",
            icon: "pi pi-fw pi-chart-line",
            items: [
              { label: "Dashboard Tamu", icon: "pi pi-fw pi-chart-bar", to: "/master_tamu/dashboard" },
            ],
          },
        ],
      },
    ];

    for (const r of roleNavigations) {
      const existingRole = await trx("mst_navigation")
        .whereRaw("LOWER(role) = LOWER(?)", [r.role])
        .first();

      const menuJson = JSON.stringify(r.menu);

      if (existingRole) {
        await trx("mst_navigation")
          .where("id", existingRole.id)
          .update({
            menu: menuJson,
            updated_at: formatDateSystem(),
          });
      } else {
        await trx("mst_navigation").insert({
          role: r.role,
          menu: menuJson,
          created_at: formatDateSystem(),
          updated_at: formatDateSystem(),
        });
      }
      console.log(`  ✔ Role navigasi '${r.role}' disinkronkan (${r.menu.length} kelompok menu).`);
    }

    // -------------------------------------------------------------
    // 3. Seeding User Enterprise Sesuai Struktur Hotel
    // -------------------------------------------------------------
    console.log("▶ [3/4] Mendaftarkan user hotel enterprise & penugasan hierarki...");

    const userSecret = process.env.USER_SECRET || "hotel_secret_2026";
    const userKey = process.env.USER_KEY || "hotel_key_";

    // Daftar user representatif seluruh tingkatan & cabang hotel
    const enterpriseUsers = [
      // 1. Corporate Executive
      {
        user_code: "USR-CORP01",
        fullname: "Bambang Soediro, M.M.",
        username: "bambang.corp@marstech.com",
        telp: "081100000001",
        role: "corporate_manager",
        passwordRaw: "HotelCorp2026!",
        company_id: 1,
        default_branch_id: 28, // Default ke Surabaya, bisa switch ke Batu
        can_switch_branch: 1,
        scope_type: "company",
        scope_id: 1,
        access_mode: "manage",
      },
      // 2. Regional Manager (Wilayah Jawa Timur)
      {
        user_code: "USR-REG01",
        fullname: "Raden Arya Kusuma",
        username: "arya.regional@marstech.com",
        telp: "081100000002",
        role: "regional_manager",
        passwordRaw: "HotelReg2026!",
        company_id: 1,
        default_branch_id: 28, // Default Magetan/Surabaya, bisa switch ke Batu
        can_switch_branch: 1,
        scope_type: "org_node",
        scope_id: 1, // Wilayah Jawa Timur (id 1)
        access_mode: "manage",
      },
      // 3. Hotel General Manager Cabang 1 (Magetan / Surabaya)
      {
        user_code: "USR-GMC1",
        fullname: "Ir. Budi Santoso",
        username: "gm.magetan@marstech.com",
        telp: "081100000003",
        role: "branch_manager",
        passwordRaw: "GmMgt2026!",
        company_id: 1,
        default_branch_id: 28,
        can_switch_branch: 0,
        scope_type: "branch",
        scope_id: 28,
        access_mode: "manage",
      },
      // 4. Hotel General Manager Cabang 2 (Grand Marstech Resort & Spa Batu)
      {
        user_code: "USR-GMC2",
        fullname: "Dr. Rahmat Hidayat",
        username: "gm.batu@marstech.com",
        telp: "081100000004",
        role: "branch_manager",
        passwordRaw: "GmBatu2026!",
        company_id: 1,
        default_branch_id: 29,
        can_switch_branch: 0,
        scope_type: "branch",
        scope_id: 29,
        access_mode: "manage",
      },
      // 5. Front Office Supervisor Cabang 1
      {
        user_code: "USR-FOC1",
        fullname: "Anita Wijaya",
        username: "anita.fo@marstech.com",
        telp: "081100000005",
        role: "frontdesk",
        passwordRaw: "FoMgt2026!",
        company_id: 1,
        default_branch_id: 28,
        can_switch_branch: 0,
        scope_type: "branch",
        scope_id: 28,
        access_mode: "operate",
      },
      // 6. Front Office Supervisor Cabang 2 (Batu)
      {
        user_code: "USR-FOC2",
        fullname: "Citra Kirana",
        username: "citra.fo@marstech.com",
        telp: "081100000006",
        role: "frontdesk",
        passwordRaw: "FoBatu2026!",
        company_id: 1,
        default_branch_id: 29,
        can_switch_branch: 0,
        scope_type: "branch",
        scope_id: 29,
        access_mode: "operate",
      },
      // 7. Receptionist Cabang 1
      {
        user_code: "USR-RECC1",
        fullname: "Dimas Prasetyo",
        username: "dimas.rec@marstech.com",
        telp: "081100000007",
        role: "receptionist",
        passwordRaw: "RecMgt2026!",
        company_id: 1,
        default_branch_id: 28,
        can_switch_branch: 0,
        scope_type: "branch",
        scope_id: 28,
        access_mode: "operate",
      },
      // 8. Receptionist Cabang 2 (Batu)
      {
        user_code: "USR-RECC2",
        fullname: "Farhan Maulana",
        username: "farhan.rec@marstech.com",
        telp: "081100000008",
        role: "receptionist",
        passwordRaw: "RecBatu2026!",
        company_id: 1,
        default_branch_id: 29,
        can_switch_branch: 0,
        scope_type: "branch",
        scope_id: 29,
        access_mode: "operate",
      },
      // 9. Kasir Front Office Cabang 1
      {
        user_code: "USR-KSRC1",
        fullname: "Eko Saputro",
        username: "eko.kasir@marstech.com",
        telp: "081100000009",
        role: "kasir",
        passwordRaw: "KasirMgt2026!",
        company_id: 1,
        default_branch_id: 28,
        can_switch_branch: 0,
        scope_type: "branch",
        scope_id: 28,
        access_mode: "operate",
      },
      // 10. Kasir Front Office Cabang 2 (Batu)
      {
        user_code: "USR-KSRC2",
        fullname: "Giska Melinda",
        username: "giska.kasir@marstech.com",
        telp: "081100000010",
        role: "kasir",
        passwordRaw: "KasirBatu2026!",
        company_id: 1,
        default_branch_id: 29,
        can_switch_branch: 0,
        scope_type: "branch",
        scope_id: 29,
        access_mode: "operate",
      },
      // 11. Housekeeping Staff Cabang 1
      {
        user_code: "USR-HKC1",
        fullname: "Syifa Nuraini",
        username: "syifa.hk@marstech.com",
        telp: "081100000011",
        role: "housekeeping",
        passwordRaw: "HkMgt2026!",
        company_id: 1,
        default_branch_id: 28,
        can_switch_branch: 0,
        scope_type: "branch",
        scope_id: 28,
        access_mode: "operate",
      },
      // 12. Housekeeping Staff Cabang 2 (Batu)
      {
        user_code: "USR-HKC2",
        fullname: "Joko Susilo",
        username: "joko.hk@marstech.com",
        telp: "081100000012",
        role: "housekeeping",
        passwordRaw: "HkBatu2026!",
        company_id: 1,
        default_branch_id: 29,
        can_switch_branch: 0,
        scope_type: "branch",
        scope_id: 29,
        access_mode: "operate",
      },
      // 13. Night Auditor / Financial Controller
      {
        user_code: "USR-AUD01",
        fullname: "Hendro Wicaksono, Ak.",
        username: "hendro.audit@marstech.com",
        telp: "081100000013",
        role: "auditor",
        passwordRaw: "Audit2026!",
        company_id: 1,
        default_branch_id: 28, // Auditor can inspect both branches
        can_switch_branch: 1,
        scope_type: "company",
        scope_id: 1,
        access_mode: "view",
      },
    ];

    for (const u of enterpriseUsers) {
      const cPassword = userKey + u.user_code + u.passwordRaw;
      const hashedPassword = hmac(cPassword, userSecret, "sha512");

      let existingUser = await trx("mst_user")
        .where("username", u.username)
        .orWhere("user_code", u.user_code)
        .first();

      let userId = existingUser ? existingUser.id : null;

      if (existingUser) {
        await trx("mst_user")
          .where("id", existingUser.id)
          .update({
            fullname: u.fullname,
            role: u.role,
            password: hashedPassword,
            status: "1",
            company_id: u.company_id,
            default_branch_id: u.default_branch_id,
            can_switch_branch: u.can_switch_branch,
            updated_at: formatDateSystem(),
          });
      } else {
        const [newId] = await trx("mst_user").insert({
          user_code: u.user_code,
          username: u.username,
          fullname: u.fullname,
          telp: u.telp,
          role: u.role,
          password: hashedPassword,
          status: "1",
          tz: "Asia/Jakarta",
          company_id: u.company_id,
          default_branch_id: u.default_branch_id,
          can_switch_branch: u.can_switch_branch,
          created_at: formatDateSystem(),
          updated_at: formatDateSystem(),
        });
        userId = newId;
      }

      // Pastikan assignment di user_scope_assignments
      await trx("user_scope_assignments")
        .where("user_id", userId)
        .delete();

      await trx("user_scope_assignments").insert({
        user_id: userId,
        scope_type: u.scope_type,
        scope_id: u.scope_id,
        access_mode: u.access_mode,
        is_default: 1,
        created_at: formatDateSystem(),
      });

      console.log(`  ✔ User '${u.username}' (${u.role}) -> Scope: [${u.scope_type}:${u.scope_id}], Switch: ${u.can_switch_branch ? "YES" : "NO"}`);
    }

    await trx.commit();
    console.log("===============================================================");
    console.log("🎉 SEEDING ENTERPRISE HOTEL ROLES & USERS COMPLETED SUCCESSFULLY!");
    console.log("===============================================================");
  } catch (error) {
    await trx.rollback();
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

export async function seed(knex) {
  return seedHotelEnterpriseUsers();
}

// Run direct execution if called as a script
if (process.argv[1]?.includes("seed_hotel_enterprise_users")) {
  seedHotelEnterpriseUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
