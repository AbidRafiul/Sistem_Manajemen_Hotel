/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file index.js
 * @description File index untuk modul kasir
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-03)
 * @version 1.0.1
 */

import express from "express";

import shiftOpen from "./shift_open.js";
import shiftClose from "./shift_close.js";
import shiftCurrent from "./shift_current.js";

const router = express.Router();

router.use("/shift-open", shiftOpen);
router.use("/shift-close", shiftClose);
router.use("/shift-current", shiftCurrent);

export default router;
