/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file index.js
 * @description In-House Guests Router
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-16
 * @version 1.0.0
 */

import express from "express";
import inhouseList from "./inhouse_list.js";
import folioDetail from "./folio_detail.js";
import fasilitasAdd from "./fasilitas_add.js";
import extendCheck from "./extend_check.js";
import extendSubmit from "./extend_submit.js";

const router = express.Router();

router.use("/inhouse-list", inhouseList);
router.use("/folio-detail", folioDetail);
router.use("/fasilitas-add", fasilitasAdd);
router.use("/extend-check", extendCheck);
router.use("/extend-submit", extendSubmit);

export default router;
