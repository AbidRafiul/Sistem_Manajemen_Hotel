import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";

export async function seed(knex) {
  const menuData = [
    {
      label: "Utama",
      items: [
        { label: "Dashboard", icon: "pi pi-fw pi-home", to: "/dashboard" }
      ]
    },
    {
      label: "Master & Setup Hotel",
      icon: "pi pi-fw pi-cog",
      items: [
        { label: "Master Hotel", icon: "pi pi-fw pi-building", to: "/master_hotel" },
        { label: "Master Gedung", icon: "pi pi-fw pi-th-large", to: "/master_gedung" },
        { label: "Master Lantai", icon: "pi pi-fw pi-bars", to: "/master_lantai" },
        { label: "Tipe Kamar", icon: "pi pi-fw pi-tag", to: "/master_tipe_kamar" },
        { label: "Master Kamar", icon: "pi pi-fw pi-home", to: "/master_kamar" },
        { label: "Bed Type", icon: "pi pi-fw pi-inbox", to: "/master_bed_type" },
        { label: "Fasilitas & Amenity", icon: "pi pi-fw pi-star", to: "/master_amenity" },
        { label: "Rate Plan (Paket Harga)", icon: "pi pi-fw pi-dollar", to: "/master_rate_plan" },
        { label: "Season & Pricing", icon: "pi pi-fw pi-calendar", to: "/master_season" },
        { label: "Pajak & Service Charge", icon: "pi pi-fw pi-percentage", to: "/master_pajak" },
        { label: "Corporate / Travel Agent", icon: "pi pi-fw pi-briefcase", to: "/master_corporate" },
        { label: "User & Role Management", icon: "pi pi-fw pi-users", to: "/setup/users" },
        { label: "Konfigurasi Perusahaan", icon: "pi pi-fw pi-sliders-h", to: "/setup/config" }
      ]
    },
    {
      label: "Contoh & Template",
      icon: "pi pi-fw pi-bookmark",
      items: [
        { label: "Contoh Form Upload", icon: "pi pi-fw pi-upload", to: "/contoh_form_upload" },
        { label: "Contoh Laporan", icon: "pi pi-fw pi-file", to: "/contoh_laporan" },
        { label: "Contoh Popup", icon: "pi pi-fw pi-window-maximize", to: "/contoh_popup" },
        { label: "Contoh Tabview", icon: "pi pi-fw pi-folder", to: "/contoh_tabview" },
        { label: "Contoh Trx Cetak Nota", icon: "pi pi-fw pi-print", to: "/contoh_trx_cetak_nota" }
      ]
    }
  ];

  const menuString = JSON.stringify(menuData);
  const now = formatDateSystem();

  // 1. Seed ke mst_navigation untuk role superadmin dan master
  for (const roleName of ["superadmin", "admin", "master"]) {
    const existingMst = await knex("mst_navigation").where("role", roleName).first();
    if (existingMst) {
      await knex("mst_navigation").where("role", roleName).update({
        menu: menuString,
        updated_at: now
      });
    } else {
      await knex("mst_navigation").insert({
        role: roleName,
        menu: menuString,
        created_at: now,
        updated_at: now
      });
    }
  }

  // 2. Seed ke user_navigation untuk user_code USR000000 (superadmin default)
  const existingUserNav = await knex("user_navigation").where("user_code", "USR000000").first();
  if (existingUserNav) {
    await knex("user_navigation").where("user_code", "USR000000").update({
      menu: menuString,
      updated_at: now
    });
  } else {
    await knex("user_navigation").insert({
      user_code: "USR000000",
      menu: menuString,
      created_at: now,
      updated_at: now
    });
  }
}
