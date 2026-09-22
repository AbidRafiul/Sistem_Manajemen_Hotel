/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file scope_helper.js
 * @description Helper untuk resolusi hierarki enterprise, scope user, dan otorisasi branch.
 * @author Antigravity
 * @created 2026-09-22
 * @version 1.0.0
 */

import DB from "../../../../core/config/knex.js";

/**
 * Mengambil seluruh detail scope organisasi user berdasarkan assignment di database.
 * @param {number|string} userId 
 * @returns {Promise<Object>}
 */
export const getUserScopeDetails = async (userId) => {
  const user = await DB("mst_user as u")
    .leftJoin("companies as c", "u.company_id", "c.id")
    .where("u.id", userId)
    .select(
      "u.id",
      "u.username",
      "u.role",
      "u.company_id",
      "c.name as company_name",
      "c.code as company_code",
      "u.default_branch_id",
      "u.can_switch_branch"
    )
    .first();

  if (!user) {
    throw new Error(`User dengan ID ${userId} tidak ditemukan.`);
  }

  const roleLower = (user.role || "").toLowerCase();
  const isSuperadmin = roleLower === "superadmin" || roleLower === "master";

  // Ambil assignments
  const assignments = await DB("user_scope_assignments")
    .where("user_id", userId)
    .select("*");

  let allowedBranches = [];

  if (isSuperadmin || assignments.some((a) => a.scope_type === "company")) {
    // Akses seluruh cabang di company user (atau seluruh cabang jika company_id null)
    allowedBranches = await DB("mst_cabang as b")
      .where("b.is_active", 1)
      .whereNull("b.deleted_at")
      .modify((qb) => {
        if (user.company_id) {
          qb.where("b.company_id", user.company_id);
        }
      })
      .select(
        "b.id",
        "b.kode_cabang",
        "b.nama_hotel",
        "b.alamat",
        "b.zona_waktu as timezone",
        "b.is_active"
      )
      .orderBy("b.id", "asc");
  } else {
    // Kumpulkan cabang berdasarkan org_node dan branch assignment
    const branchIds = new Set();

    for (const a of assignments) {
      if (a.scope_type === "branch") {
        branchIds.add(Number(a.scope_id));
      } else if (a.scope_type === "org_node" || a.scope_type === "node") {
        // Ambil cabang turunan org node
        const nodeBranches = await DB("mst_cabang")
          .where("org_node_id", a.scope_id)
          .where("is_active", 1)
          .whereNull("deleted_at")
          .select("id");
        nodeBranches.forEach((nb) => branchIds.add(Number(nb.id)));
      }
    }

    // Jika user punya default_branch_id, pastikan minimal default_branch masuk jika set kosong
    if (branchIds.size === 0 && user.default_branch_id) {
      branchIds.add(Number(user.default_branch_id));
    }

    if (branchIds.size > 0) {
      allowedBranches = await DB("mst_cabang as b")
        .whereIn("b.id", Array.from(branchIds))
        .where("b.is_active", 1)
        .whereNull("deleted_at")
        .select(
          "b.id",
          "b.kode_cabang",
          "b.nama_hotel",
          "b.alamat",
          "b.zona_waktu as timezone",
          "b.is_active"
        )
        .orderBy("b.id", "asc");
    }
  }

  // Fallback pengaman: jika masih kosong, ambil cabang pertama di DB
  if (allowedBranches.length === 0) {
    const fallbackBranch = await DB("mst_cabang")
      .where("is_active", 1)
      .whereNull("deleted_at")
      .select(
        "id",
        "kode_cabang",
        "nama_hotel",
        "alamat",
        "zona_waktu as timezone",
        "is_active"
      )
      .orderBy("id", "asc")
      .first();
    if (fallbackBranch) allowedBranches.push(fallbackBranch);
  }

  // Tentukan default branch
  let defaultBranch = allowedBranches.find((b) => Number(b.id) === Number(user.default_branch_id));
  if (!defaultBranch) {
    defaultBranch = allowedBranches[0];
  }

  const allowedBranchIds = allowedBranches.map((b) => Number(b.id));
  const allowedKodeCabang = allowedBranches.map((b) => b.kode_cabang);
  const canSwitch = Boolean(user.can_switch_branch) && allowedBranches.length > 1;

  return {
    company_id: user.company_id || 1,
    company_name: user.company_name || "Grand Marstech Hotel & Resort",
    company_code: user.company_code || "CMP001",
    default_branch_id: defaultBranch ? defaultBranch.id : null,
    default_kode_cabang: defaultBranch ? defaultBranch.kode_cabang : "",
    default_branch_name: defaultBranch ? defaultBranch.nama_hotel : "",
    active_branch_id: defaultBranch ? defaultBranch.id : null,
    active_kode_cabang: defaultBranch ? defaultBranch.kode_cabang : "",
    active_branch_name: defaultBranch ? defaultBranch.nama_hotel : "",
    allowed_branches: allowedBranches,
    allowed_branch_ids: allowedBranchIds,
    allowed_kode_cabang: allowedKodeCabang,
    can_switch_branch: canSwitch,
  };
};

/**
 * Memvalidasi apakah targetKodeCabang atau targetBranchId berada dalam scope kewenangan user.
 * Melempar error dengan statusCode 403 bila di luar scope.
 * @param {Object} req - Request object Express
 * @param {string|number} targetBranch - Kode cabang (e.g. 'CAB0001') atau ID cabang
 */
export const assertBranchScope = (req, targetBranch) => {
  if (!targetBranch) return;

  // Mode debugging
  if (process.env.APP_DEBUG === "true" && req?.headers?.["x-uniqueid"]) {
    return;
  }

  const allowedCodes = req?.auth?.allowed_kode_cabang || [];
  const allowedIds = req?.auth?.allowed_branch_ids || [];

  const isAllowedCode = allowedCodes.includes(String(targetBranch));
  const isAllowedId = allowedIds.includes(Number(targetBranch));

  if (!isAllowedCode && !isAllowedId) {
    const err = new Error(`Akses ditolak: Cabang '${targetBranch}' berada di luar scope kewenangan Anda.`);
    err.status = 403;
    err.statusCode = 403;
    throw err;
  }
};

/**
 * Menyelesaikan cabang efektif yang digunakan untuk request saat ini.
 * @param {Object} req - Request Express
 * @param {string} requestedBranch - Kode cabang dari payload atau query parameter
 * @returns {Object} { branchId, kodeCabang, namaHotel }
 */
export const resolveEffectiveBranch = (req, requestedBranch = null) => {
  const branchFromHeader = req.headers["x-branch-code"] || null;
  const branchCandidate = requestedBranch || branchFromHeader || req?.auth?.active_kode_cabang;

  if (branchCandidate) {
    assertBranchScope(req, branchCandidate);
    const branchObj = (req?.auth?.allowed_branches || []).find(
      (b) => b.kode_cabang === branchCandidate || Number(b.id) === Number(branchCandidate)
    );
    if (branchObj) {
      return {
        branchId: branchObj.id,
        kodeCabang: branchObj.kode_cabang,
        namaHotel: branchObj.nama_hotel,
      };
    }
  }

  // Fallback ke active kode cabang
  return {
    branchId: req?.auth?.active_branch_id || null,
    kodeCabang: req?.auth?.active_kode_cabang || "",
    namaHotel: req?.auth?.active_branch_name || "",
  };
};

/**
 * Helper untuk menyaring Query Knex dengan batasan branch scope secara aman.
 * @param {Object} query - Knex query builder
 * @param {Object} req - Request Express
 * @param {string} column - Nama kolom cabang (default: 'kode_cabang')
 * @param {string} requestedBranch - Pilihan cabang spesifik dari filter UI
 */
export const applyBranchFilter = (query, req, column = "kode_cabang", requestedBranch = null) => {
  const allowedCodes = req?.auth?.allowed_kode_cabang || [];

  if (requestedBranch) {
    assertBranchScope(req, requestedBranch);
    query.where(column, requestedBranch);
  } else if (!req?.auth?.can_switch_branch || allowedCodes.length <= 1) {
    // Staff cabang tunggal: hanya boleh melihat cabangnya sendiri
    const staffBranch = req?.auth?.active_kode_cabang || (allowedCodes.length > 0 ? allowedCodes[0] : null);
    if (staffBranch) {
      query.where(column, staffBranch);
    } else {
      query.whereRaw("1 = 0"); // Fail-closed jika tidak punya cabang valid
    }
  } else {
    // Manager multi-branch tanpa filter spesifik: tampilkan semua cabang dalam scope
    if (allowedCodes.length > 0) {
      query.whereIn(column, allowedCodes);
    } else {
      query.whereRaw("1 = 0"); // Fail-closed
    }
  }
};
