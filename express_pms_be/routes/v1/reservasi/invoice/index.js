/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file index.js
 * @description Router modul Dokumen Invoice
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.0
 */

import express from "express";
import invoiceDetail from "./invoice_detail.js";

const router = express.Router();

router.use("/invoice-detail", invoiceDetail);

export default router;
