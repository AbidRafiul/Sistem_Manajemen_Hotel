/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file seed_master_wilayah.js
 * @description Seeder inisialisasi data Master Wilayah / Regional
 */

import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";

export async function seed(knex) {
  const dNow = formatDateSystem();
  console.log("📍 Seeding Master Wilayah (Regions)...");

  const regions = [
    {
      id: 1,
      company_id: 1,
      parent_id: null,
      node_type: "region",
      code: "REG-JATIM",
      name: "Wilayah Jawa Timur",
      status: "active",
      created_at: dNow,
      updated_at: dNow,
    },
    {
      id: 2,
      company_id: 1,
      parent_id: null,
      node_type: "region",
      code: "REG-JATENG",
      name: "Wilayah Jawa Tengah & D.I. Yogyakarta",
      status: "active",
      created_at: dNow,
      updated_at: dNow,
    },
    {
      id: 3,
      company_id: 1,
      parent_id: null,
      node_type: "region",
      code: "REG-BALI",
      name: "Wilayah Bali & Nusa Tenggara",
      status: "active",
      created_at: dNow,
      updated_at: dNow,
    },
    {
      id: 4,
      company_id: 1,
      parent_id: null,
      node_type: "region",
      code: "REG-JABAR",
      name: "Wilayah Jawa Barat & Banten",
      status: "active",
      created_at: dNow,
      updated_at: dNow,
    },
    {
      id: 5,
      company_id: 1,
      parent_id: null,
      node_type: "region",
      code: "REG-DKI",
      name: "Wilayah DKI Jakarta & Sekitarnya",
      status: "active",
      created_at: dNow,
      updated_at: dNow,
    },
  ];

  for (const reg of regions) {
    const existing = await knex("org_nodes")
      .where("company_id", reg.company_id)
      .where("code", reg.code)
      .first();

    if (!existing) {
      await knex("org_nodes").insert(reg);
      console.log(`  ✔ Wilayah '${reg.code} - ${reg.name}' berhasil ditambahkan.`);
    } else {
      await knex("org_nodes").where("id", existing.id).update({
        name: reg.name,
        status: "active",
        updated_at: dNow,
      });
      console.log(`  ⏭ Wilayah '${reg.code}' sudah ada, data diperbarui.`);
    }
  }

  // Pastikan cabang eksisting (CAB0001 & CAB0002) terhubung ke REG-JATIM (id: 1)
  await knex("mst_cabang")
    .whereNull("org_node_id")
    .orWhere("org_node_id", 0)
    .update({ org_node_id: 1, updated_at: dNow });

  // Pastikan kolom org_node_id di mst_user tersedia
  const hasUserOrgCol = await knex.schema.hasColumn("mst_user", "org_node_id");
  if (!hasUserOrgCol) {
    await knex.schema.alterTable("mst_user", (t) => {
      t.bigInteger("org_node_id").unsigned().nullable().after("default_branch_id");
    });
  }

  // Sinkronkan org_node_id user berdasarkan default_branch_id jika masih kosong
  await knex.raw(`
    UPDATE mst_user u
    JOIN mst_cabang c ON u.default_branch_id = c.id
    SET u.org_node_id = c.org_node_id
    WHERE (u.org_node_id IS NULL OR u.org_node_id = 0) AND c.org_node_id IS NOT NULL
  `);

  console.log("  ✅ Seeding Master Wilayah selesai!");
}
