/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file index.js
 * @description Router utama modul Pemesanan & Monitoring Ruang Event (Banquet Event Order)
 * @author Antigravity
 * @created 2026-10-19
 * @version 1.0.0
 */

import express from "express";
import eventList from "./event_list.js";
import eventDetail from "./event_detail.js";
import eventConflictCheck from "./event_conflict_check.js";
import eventCreate from "./event_create.js";
import eventUpdate from "./event_update.js";
import eventStatusUpdate from "./event_status_update.js";
import eventMonitoring from "./event_monitoring.js";
import eventBeoData from "./event_beo_data.js";

const router = express.Router();

router.use("/list", eventList);
router.use("/detail", eventDetail);
router.use("/conflict-check", eventConflictCheck);
router.use("/create", eventCreate);
router.use("/update", eventUpdate);
router.use("/status-update", eventStatusUpdate);
router.use("/monitoring", eventMonitoring);
router.use("/beo-data", eventBeoData);

export default router;
