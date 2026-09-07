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
import guestList from "./guest/guest_list.js";
import availability from "./kamar/availability.js";
import walkInSubmit from "./walk_in/walk_in_submit.js";
import checkoutSearch from "./checkout/checkout_search.js";
import checkoutSubmit from "./checkout/checkout_submit.js";

import availabilityRange from "./kamar/availability_range.js";
import roomPackages from "./kamar/room_packages.js";
import reservationCreate from "./booking/reservation_create.js";
import reservationData from "./booking/reservation_data.js";
import checkinSubmit from "./checkin/checkin_submit.js";

const router = express.Router();

router.use("/guest/guest-search", guestSearch);
router.use("/guest/guest-create", guestCreate);
router.use("/guest/guest-list", guestList);
router.use("/kamar/availability", availability);
router.use("/walk-in/walk-in-submit", walkInSubmit);
router.use("/checkout/checkout-search", checkoutSearch);
router.use("/checkout/checkout-submit", checkoutSubmit);

router.use("/kamar/availability-range", availabilityRange);
router.use("/kamar/room-packages", roomPackages);
router.use("/booking/reservation-create", reservationCreate);
router.use("/booking/reservation-data", reservationData);
router.use("/checkin/checkin-submit", checkinSubmit);

export default router;
