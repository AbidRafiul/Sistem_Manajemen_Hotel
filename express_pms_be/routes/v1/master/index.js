/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file index.js
 * @description File index untuk routing Master
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-12
 * @lastModified Fadil (2026-08-13)
 */

import express from "express";
const router = express.Router();

// Imports
import cabangData from "./cabang/cabang_data.js";
import cabangCreate from "./cabang/cabang_create.js";
import cabangUpdate from "./cabang/cabang_update.js";
import cabangDelete from "./cabang/cabang_delete.js";

import cashierShiftDropdown from "./cashier_shift/cashier_shift_dropdown.js";

import cashierCounterData from "./cashier_counter/cashier_counter_data.js";
import cashierCounterCreate from "./cashier_counter/cashier_counter_create.js";
import cashierCounterUpdate from "./cashier_counter/cashier_counter_update.js";
import cashierCounterDelete from "./cashier_counter/cashier_counter_delete.js";

import bedTypeData from "./bed_type/bed_type_data.js";
import bedTypeCreate from "./bed_type/bed_type_create.js";
import bedTypeUpdate from "./bed_type/bed_type_update.js";
import bedTypeDelete from "./bed_type/bed_type_delete.js";

import amenityData from "./amenity/amenity_data.js";
import amenityCreate from "./amenity/amenity_create.js";
import amenityUpdate from "./amenity/amenity_update.js";
import amenityDelete from "./amenity/amenity_delete.js";

import pajakData from "./pajak/pajak_data.js";
import pajakCreate from "./pajak/pajak_create.js";
import pajakUpdate from "./pajak/pajak_update.js";
import pajakDelete from "./pajak/pajak_delete.js";

import fasilitasData from "./fasilitas/fasilitas_data.js";
import fasilitasCreate from "./fasilitas/fasilitas_create.js";
import fasilitasUpdate from "./fasilitas/fasilitas_update.js";
import fasilitasDelete from "./fasilitas/fasilitas_delete.js";

import corporateData from "./corporate/corporate_data.js";
import corporateCreate from "./corporate/corporate_create.js";
import corporateUpdate from "./corporate/corporate_update.js";
import corporateDelete from "./corporate/corporate_delete.js";

import gedungData from "./gedung/gedung_data.js";
import gedungCreate from "./gedung/gedung_create.js";
import gedungUpdate from "./gedung/gedung_update.js";
import gedungDelete from "./gedung/gedung_delete.js";

import tipeKamarData from "./tipe_kamar/tipe_kamar_data.js";
import tipeKamarCreate from "./tipe_kamar/tipe_kamar_create.js";
import tipeKamarUpdate from "./tipe_kamar/tipe_kamar_update.js";
import tipeKamarDelete from "./tipe_kamar/tipe_kamar_delete.js";

import ratePlanData from "./rate_plan/rate_plan_data.js";
import ratePlanCreate from "./rate_plan/rate_plan_create.js";
import ratePlanUpdate from "./rate_plan/rate_plan_update.js";
import ratePlanDelete from "./rate_plan/rate_plan_delete.js";

import ratePlanPriceData from "./rate_plan_price/rate_plan_price_data.js";
import ratePlanPriceCreate from "./rate_plan_price/rate_plan_price_create.js";
import ratePlanPriceUpdate from "./rate_plan_price/rate_plan_price_update.js";
import ratePlanPriceDelete from "./rate_plan_price/rate_plan_price_delete.js";
import ratePlanPriceHitung from "./rate_plan_price/rate_plan_price_hitung.js";

import seasonData from "./season/season_data.js";
import seasonCreate from "./season/season_create.js";
import seasonUpdate from "./season/season_update.js";
import seasonDelete from "./season/season_delete.js";

import lantaiData from "./lantai/lantai_data.js";
import lantaiCreate from "./lantai/lantai_create.js";
import lantaiUpdate from "./lantai/lantai_update.js";
import lantaiDelete from "./lantai/lantai_delete.js";

import kamarData from "./kamar/kamar_data.js";
import kamarCreate from "./kamar/kamar_create.js";
import kamarUpdate from "./kamar/kamar_update.js";
import kamarDelete from "./kamar/kamar_delete.js";

import roomTypeFasilitasAssign from "./room_type_fasilitas/room_type_fasilitas_assign.js";
import roomTypeFasilitasData from "./room_type_fasilitas/room_type_fasilitas_data.js";

import roomTypeAmenityAssign from "./room_type_amenity/room_type_amenity_assign.js";
import roomTypeAmenityData from "./room_type_amenity/room_type_amenity_data.js";

import tipeRuangEventData from "./tipe_ruang_event/tipe_ruang_event_data.js";
import tipeRuangEventCreate from "./tipe_ruang_event/tipe_ruang_event_create.js";
import tipeRuangEventUpdate from "./tipe_ruang_event/tipe_ruang_event_update.js";
import tipeRuangEventDelete from "./tipe_ruang_event/tipe_ruang_event_delete.js";

import ruangEventData from "./ruang_event/ruang_event_data.js";
import ruangEventCreate from "./ruang_event/ruang_event_create.js";
import ruangEventUpdate from "./ruang_event/ruang_event_update.js";
import ruangEventDelete from "./ruang_event/ruang_event_delete.js";

import ruangEventFasilitasAssign from "./ruang_event_fasilitas/ruang_event_fasilitas_assign.js";
import ruangEventFasilitasData from "./ruang_event_fasilitas/ruang_event_fasilitas_data.js";

import hargaRuangEventData from "./harga_ruang_event/harga_ruang_event_data.js";
import hargaRuangEventCreate from "./harga_ruang_event/harga_ruang_event_create.js";
import hargaRuangEventUpdate from "./harga_ruang_event/harga_ruang_event_update.js";
import hargaRuangEventDelete from "./harga_ruang_event/harga_ruang_event_delete.js";

// Routes
// Master Cabang
router.use("/cabang/cabang-data", cabangData);
router.use("/cabang/cabang-create", cabangCreate);
router.use("/cabang/cabang-update", cabangUpdate);
router.use("/cabang/cabang-delete", cabangDelete);

// Master Bed Type
router.use("/bed-type/bed-type-data", bedTypeData);
router.use("/bed-type/bed-type-create", bedTypeCreate);
router.use("/bed-type/bed-type-update", bedTypeUpdate);
router.use("/bed-type/bed-type-delete", bedTypeDelete);

// Master Amenity
router.use("/amenity/amenity-data", amenityData);
router.use("/amenity/amenity-create", amenityCreate);
router.use("/amenity/amenity-update", amenityUpdate);
router.use("/amenity/amenity-delete", amenityDelete);

// Master Pajak
router.use("/pajak/pajak-data", pajakData);
router.use("/pajak/pajak-create", pajakCreate);
router.use("/pajak/pajak-update", pajakUpdate);
router.use("/pajak/pajak-delete", pajakDelete);

// Master Fasilitas
router.use("/fasilitas/fasilitas-data", fasilitasData);
router.use("/fasilitas/fasilitas-create", fasilitasCreate);
router.use("/fasilitas/fasilitas-update", fasilitasUpdate);
router.use("/fasilitas/fasilitas-delete", fasilitasDelete);

// Master Corporate
router.use("/corporate/corporate-data", corporateData);
router.use("/corporate/corporate-create", corporateCreate);
router.use("/corporate/corporate-update", corporateUpdate);
router.use("/corporate/corporate-delete", corporateDelete);

// Master Gedung
router.use("/gedung/gedung-data", gedungData);
router.use("/gedung/gedung-create", gedungCreate);
router.use("/gedung/gedung-update", gedungUpdate);
router.use("/gedung/gedung-delete", gedungDelete);

// Master Tipe Kamar
router.use("/tipe-kamar/tipe-kamar-data", tipeKamarData);
router.use("/tipe-kamar/tipe-kamar-create", tipeKamarCreate);
router.use("/tipe-kamar/tipe-kamar-update", tipeKamarUpdate);
router.use("/tipe-kamar/tipe-kamar-delete", tipeKamarDelete);

// Master Rate Plan
router.use("/rate-plan/rate-plan-data", ratePlanData);
router.use("/rate-plan/rate-plan-create", ratePlanCreate);
router.use("/rate-plan/rate-plan-update", ratePlanUpdate);
router.use("/rate-plan/rate-plan-delete", ratePlanDelete);

// Master Rate Plan Price (Harga Kamar)
router.use("/rate-plan-price/rate-plan-price-data", ratePlanPriceData);
router.use("/rate-plan-price/rate-plan-price-create", ratePlanPriceCreate);
router.use("/rate-plan-price/rate-plan-price-update", ratePlanPriceUpdate);
router.use("/rate-plan-price/rate-plan-price-delete", ratePlanPriceDelete);
router.use("/rate-plan-price/rate-plan-price-hitung", ratePlanPriceHitung);

// Master Season
router.use("/season/season-data", seasonData);
router.use("/season/season-create", seasonCreate);
router.use("/season/season-update", seasonUpdate);
router.use("/season/season-delete", seasonDelete);

// Master Lantai
router.use("/lantai/lantai-data", lantaiData);
router.use("/lantai/lantai-create", lantaiCreate);
router.use("/lantai/lantai-update", lantaiUpdate);
router.use("/lantai/lantai-delete", lantaiDelete);

// Master Kamar
router.use("/kamar/kamar-data", kamarData);
router.use("/kamar/kamar-create", kamarCreate);
router.use("/kamar/kamar-update", kamarUpdate);
router.use("/kamar/kamar-delete", kamarDelete);

// Master Room Type Fasilitas
router.use("/room-type-fasilitas/room-type-fasilitas-assign", roomTypeFasilitasAssign);
router.use("/room-type-fasilitas/room-type-fasilitas-data", roomTypeFasilitasData);

// Master Room Type Amenity
router.use("/room-type-amenity/room-type-amenity-assign", roomTypeAmenityAssign);
router.use("/room-type-amenity/room-type-amenity-data", roomTypeAmenityData);

// Master Tipe Ruang Event
router.use("/tipe-ruang-event/tipe-ruang-event-data", tipeRuangEventData);
router.use("/tipe-ruang-event/tipe-ruang-event-create", tipeRuangEventCreate);
router.use("/tipe-ruang-event/tipe-ruang-event-update", tipeRuangEventUpdate);
router.use("/tipe-ruang-event/tipe-ruang-event-delete", tipeRuangEventDelete);

// Master Ruang Event
router.use("/ruang-event/ruang-event-data", ruangEventData);
router.use("/ruang-event/ruang-event-create", ruangEventCreate);
router.use("/ruang-event/ruang-event-update", ruangEventUpdate);
router.use("/ruang-event/ruang-event-delete", ruangEventDelete);

// Master Ruang Event Fasilitas
router.use("/ruang-event-fasilitas/ruang-event-fasilitas-assign", ruangEventFasilitasAssign);
router.use("/ruang-event-fasilitas/ruang-event-fasilitas-data", ruangEventFasilitasData);

// Master Harga Ruang Event
router.use("/harga-ruang-event/harga-ruang-event-data", hargaRuangEventData);
router.use("/harga-ruang-event/harga-ruang-event-create", hargaRuangEventCreate);
router.use("/harga-ruang-event/harga-ruang-event-update", hargaRuangEventUpdate);
router.use("/harga-ruang-event/harga-ruang-event-delete", hargaRuangEventDelete);

// Master Cashier Counter
router.use("/cashier-counter/cashier-counter-data", cashierCounterData);
router.use("/cashier-counter/cashier-counter-create", cashierCounterCreate);
router.use("/cashier-counter/cashier-counter-update", cashierCounterUpdate);
router.use("/cashier-counter/cashier-counter-delete", cashierCounterDelete);

// Cashier Shift Dropdown (shift yang sedang open)
router.use("/cashier-shift/dropdown", cashierShiftDropdown);

export default router;
