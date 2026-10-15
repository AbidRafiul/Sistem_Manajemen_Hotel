/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file index.js
 * @description Router utama modul Dashboard Eksekutif / Manajemen Hotel v1
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

import express from "express";
import kpi from "./kpi.js";
import today from "./today.js";
import alerts from "./alerts.js";
import trend from "./trend.js";
import revenueBreakdown from "./revenue_breakdown.js";
import segment from "./segment.js";
import forecast from "./forecast.js";
import upcomingEvents from "./upcoming_events.js";

const router = express.Router();

router.use("/kpi", kpi);
router.use("/today", today);
router.use("/alerts", alerts);
router.use("/trend", trend);
router.use("/revenue-breakdown", revenueBreakdown);
router.use("/segment", segment);
router.use("/forecast", forecast);
router.use("/upcoming-events", upcomingEvents);

export default router;
