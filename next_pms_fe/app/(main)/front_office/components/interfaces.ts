/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file interfaces.ts
 * @description Type definitions and interfaces for Front Office Desk
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-10-15
 * @contributors - Fadil
 * @lastModified Fadil (2026-10-15)
 * @version 1.0.0
 */

import React from 'react';

export interface NavTabItem {
    key: string;
    route: string;
    label: string;
    icon: string;
    badgeIndex: number;
    component: React.ComponentType<any>;
}

export interface TabColorTheme {
    inactiveBg: string;
    inactiveBorder: string;
    inactiveText: string;
    inactiveIcon: string;
    inactiveBadgeBg: string;
    inactiveBadgeText: string;
    inactiveBadgeBorder: string;
    hoverBg: string;
    activeBg: string;
    activeBorder: string;
    activeBadgeText: string;
}

export interface CashierShiftCurrent {
    id?: number;
    kode_cashier_shift?: string;
    kode_cabang?: string;
    kode_cashier_counter?: string;
    nama_counter?: string;
    sesi?: string;
    nama_shift?: string;
    is_night_audit?: number;
    status?: string;
    waktu_buka?: string;
    waktu_tutup?: string | null;
    user_code?: string;
    user_name?: string;
    [key: string]: any;
}
