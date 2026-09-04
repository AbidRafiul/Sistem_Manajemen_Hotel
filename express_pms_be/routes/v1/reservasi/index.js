/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file index.js
 * @description Modul Reservasi Router
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @version 1.0.0
 */
import express from "express";

import guestSearch from "./guest/guest_search.js";
import guestCreate from "./guest/guest_create.js";
import availability from "./kamar/availability.js";
import walkInSubmit from "./walk_in/walk_in_submit.js";
import checkoutSearch from "./checkout/checkout_search.js";
import checkoutSubmit from "./checkout/checkout_submit.js";

const router = express.Router();

router.use("/guest/guest-search", guestSearch);
router.use("/guest/guest-create", guestCreate);
router.use("/kamar/availability", availability);
router.use("/walk-in/walk-in-submit", walkInSubmit);
router.use("/checkout/checkout-search", checkoutSearch);
router.use("/checkout/checkout-submit", checkoutSubmit);

export default router;
