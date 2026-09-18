/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file index.js
 * @description Router modul Dashboard Reservasi
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.0
 */

import express from "express";
import summary from "./summary.js";
import monitoring from "./monitoring.js";

const router = express.Router();

router.use("/summary", summary);
router.use("/monitoring", monitoring);

export default router;
