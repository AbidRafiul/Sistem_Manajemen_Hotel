/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file index.js
 * @description Router modul Housekeeping
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-08
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-08)
 * @version 1.0.1
 */
import express from "express";
import roomStatusBoard from "./room_status_board.js";
import getTasks from "./tasks_get.js";
import assignTask from "./task_assign.js";
import startTask from "./task_start.js";
import completeTask from "./task_complete.js";
import verifyTask from "./task_verify.js";
import cancelTask from "./task_cancel.js";
import staffGet from "./staff_get.js";
import historyGet from "./history_get.js";

const router = express.Router();

// Route: Room Status Board
router.use("/room-status-board", [], roomStatusBoard);

// Route: Housekeeping Staff & Workload
router.use("/staff", [], staffGet);

// Route: Housekeeping Activity History & Audit Trail
router.use("/history", [], historyGet);

// Route: Housekeeping Tasks
router.use("/tasks", [], getTasks);
router.use("/tasks", [], assignTask);
router.use("/tasks", [], startTask);
router.use("/tasks", [], completeTask);
router.use("/tasks", [], verifyTask);
router.use("/tasks", [], cancelTask);

export default router;
