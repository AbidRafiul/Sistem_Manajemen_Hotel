/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file index.js
 * @description Main router untuk modul Night Audit (/api/v1/night-audit)
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import express from "express";
import Status from "./status.js";
import PreCheck from "./pre_check.js";
import Start from "./start.js";
import Runs from "./runs.js";
import RetryFailed from "./retry_failed.js";
import Reopen from "./reopen.js";
import Reports from "./reports.js";
import NoShow from "./no_show.js";
import Scheduler from "./scheduler.js";

const router = express.Router();

router.use("/status", Status);
router.use("/pre-check", PreCheck);
router.use("/scheduler", Scheduler);
router.use("/start", Start);
router.use("/no-show", NoShow);
router.use("/runs/:id/retry-failed", RetryFailed);
router.use("/runs/:id/reopen", Reopen);
router.use("/runs/:id/reports", Reports);
router.use("/runs", Runs);

export default router;
