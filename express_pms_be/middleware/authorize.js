/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file authorize.js
 * @description Middleware otorisasi berbasis Role-Based Access Control (RBAC)
 * 
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-10-15
 * 
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 * 
 * @lastModified Fadil (2026-10-15)
 * @version 1.0.1
 */

import { status } from "../routes/v1/components/tools/general.js";
import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";

/**
 * Middleware untuk memvalidasi apakah role pengguna memiliki izin
 * untuk mengakses endpoint tertentu berdasarkan RBAC matrix.
 *
 * @param  {...string|string[]} allowedRoles - Daftar role yang diizinkan
 */
export const authorize = (...allowedRoles) => {
  const flattened = allowedRoles.flat().map((r) => String(r).toLowerCase().trim());
  const allowedSet = new Set(flattened);

  return (req, res, next) => {
    const userRole = String(req?.auth?.role || "").toLowerCase().trim();

    // 1. Jika tidak ada konteks autentikasi role
    if (!userRole) {
      return res.status(401).json({
        status: status.BAD_REQUEST,
        message: "Akses ditolak: Informasi role pengguna tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // 2. Superadmin selalu memiliki akses penuh ke seluruh modul sistem
    if (userRole === "superadmin") {
      return next();
    }

    // 3. Bypass untuk environment non-production jika APP_DEBUG=true dan role adalah DEV
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.APP_DEBUG === "true" &&
      userRole === "dev"
    ) {
      return next();
    }

    // 4. Jika allowedSet kosong atau mengandung wildcard "*", izinkan semua pengguna terotentikasi
    if (allowedSet.size === 0 || allowedSet.has("*")) {
      return next();
    }

    // 5. Cek apakah role pengguna terdaftar dalam daftar role yang diizinkan
    if (allowedSet.has(userRole)) {
      return next();
    }

    // 6. Tolak akses jika tidak memenuhi wewenang (HTTP 403 Forbidden)
    return res.status(403).json({
      status: status.GAGAL,
      message: "Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini",
      datetime: formatDateSystem(),
    });
  };
};

export default authorize;
