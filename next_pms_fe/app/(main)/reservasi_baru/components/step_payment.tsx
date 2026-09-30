'use client';

import React from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';

interface StepPaymentProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepPayment: React.FC<StepPaymentProps> = ({ state, setState, formik }) => {
    const selectedRooms = formik.values.selected_rooms || [];
    const hasMultiRooms = selectedRooms.length > 0;
    const activeExtraFacilities = (formik.values.extra_facilities || []).filter(f => f.qty > 0 || f.subtotal > 0);
    const totalFasilitas = activeExtraFacilities.reduce((sum, f) => sum + (f.subtotal || 0), 0);
    const totalKamar = hasMultiRooms
        ? selectedRooms.reduce((acc, r) => acc + (Number(r.price_per_night || 0) * (r.nights || formik.values.nights)), 0)
        : (Number(state.rateInfo?.price_per_night || 0)) * formik.values.nights;
    const totalTagihan = totalKamar + totalFasilitas;

    // 1. Pembayaran Sewa Kamar (Mengurangi tagihan folio, pendapatan hotel)
    const paymentAmount = Number(formik.values.payment_amount || 0);
    const sisaTagihan = Math.max(0, totalTagihan - paymentAmount);
    const isLunas = paymentAmount >= totalTagihan && totalTagihan > 0;
    const isPartial = paymentAmount > 0 && paymentAmount < totalTagihan;
    const isPayZero = paymentAmount === 0;

    // 2. Uang Jaminan / Security Deposit (Titipan kasir, TIDAK memotong tagihan, dikembalikan saat checkout)
    const depositAmount = Number(formik.values.deposit_amount || 0);

    // 3. Total Uang Fisik Diterima di Meja Kasir saat Walk-in
    const totalUangKasir = paymentAmount + depositAmount;

    // Presets untuk Pembayaran Sewa Kamar
    const applyPaymentPreset = (val: number) => {
        formik.setFieldValue('payment_amount', val);
        if ((val > 0 || depositAmount > 0) && !formik.values.payment_method) {
            formik.setFieldValue('payment_method', 'cash');
        }
    };

    // Presets untuk Uang Jaminan (Deposit)
    const applyDepositPreset = (val: number) => {
        formik.setFieldValue('deposit_amount', val);
        if ((val > 0 || paymentAmount > 0) && !formik.values.payment_method) {
            formik.setFieldValue('payment_method', 'cash');
        }
    };

    return (
        <div className="flex flex-column gap-3">
            {/* 1. Hero Summary Card: Total Tagihan Walk-In */}
            <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-1">
                <div className="grid align-items-center">
                    {/* Sisi Kiri: Rincian Tagihan */}
                    <div className="col-12 md:col-6 pr-0 md:pr-4 border-none md:border-right-1 surface-border">
                        <div className="flex align-items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs uppercase font-bold text-color-secondary tracking-wider flex align-items-center gap-1">
                                <i className="pi pi-receipt text-primary"></i> Total Tagihan Sewa Walk-In
                            </span>
                            <Tag severity="info" value={`${hasMultiRooms ? selectedRooms.length : 1} Kamar`} className="text-xs font-semibold" />
                            <Tag severity="secondary" value={`${formik.values.nights} Malam`} className="text-xs font-semibold" />
                        </div>
                        <div className="text-3xl font-bold text-900 mb-2">
                            Rp {totalTagihan.toLocaleString('id-ID')}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-700">
                            <div className="flex align-items-center gap-1">
                                <i className="pi pi-home text-color-secondary"></i>
                                <span>Sewa Kamar: <strong>Rp {totalKamar.toLocaleString('id-ID')}</strong></span>
                            </div>
                            {totalFasilitas > 0 && (
                                <div className="flex align-items-center gap-1">
                                    <i className="pi pi-sparkles text-purple-500"></i>
                                    <span>Fasilitas: <strong className="text-purple-600">+ Rp {totalFasilitas.toLocaleString('id-ID')}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sisi Kanan: Status Tagihan Kamar & Deposit */}
                    <div className="col-12 md:col-6 pl-0 md:pl-4 mt-3 md:mt-0">
                        <div className="flex align-items-center justify-content-between mb-2">
                            <span className="font-bold text-sm text-900 flex align-items-center gap-2">
                                <i className="pi pi-wallet text-green-600 text-lg"></i> Status Sewa Kamar
                            </span>
                            <Tag 
                                severity={isLunas ? "success" : isPartial ? "warning" : "info"} 
                                value={isLunas ? "BAYAR LUNAS (100%)" : isPartial ? "UANG MUKA (DP)" : "BAYAR DI CHECKOUT"} 
                                icon={isLunas ? "pi pi-check-circle" : isPartial ? "pi pi-shield" : "pi pi-clock"}
                                className="text-xs font-bold" 
                            />
                        </div>
                        <div className="text-xs text-color-secondary line-height-3">
                            {isLunas ? (
                                <span className="text-green-700 font-medium block">
                                    ✓ Tamu melunasi seluruh biaya sewa kamar & fasilitas di muka.
                                </span>
                            ) : isPartial ? (
                                <span className="text-orange-700 font-medium block">
                                    Tamu membayar uang muka sewa Rp {paymentAmount.toLocaleString('id-ID')}. Sisa tagihan Rp {sisaTagihan.toLocaleString('id-ID')} saat checkout.
                                </span>
                            ) : (
                                <span className="text-600 block">
                                    Tamu belum membayar sewa kamar di muka. Tagihan Rp {totalTagihan.toLocaleString('id-ID')} dibayar saat check-out.
                                </span>
                            )}
                            {depositAmount > 0 && (
                                <span className="text-blue-700 font-medium block mt-1">
                                    🛡️ Tamu juga menitipkan Uang Jaminan sebesar <strong>Rp {depositAmount.toLocaleString('id-ID')}</strong> (akan dikembalikan saat checkout).
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Dua Kartu Terpisah: Bagian A (Pembayaran Sewa) & Bagian B (Uang Jaminan) */}
            <div className="grid">
                {/* BAGIAN A: PEMBAYARAN SEWA KAMAR (MENGURANGI TOTAL TAGIHAN) */}
                <div className="col-12 lg:col-7">
                    <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-1 h-full flex flex-column justify-content-between">
                        <div>
                            <div className="flex align-items-center justify-content-between mb-2">
                                <div className="font-bold text-900 text-base flex align-items-center gap-2">
                                    <i className="pi pi-credit-card text-green-600 text-lg"></i>
                                    1. Pembayaran Tagihan Sewa Kamar
                                </div>
                                <Tag severity="success" value="MENGURANGI TAGIHAN" className="text-xs font-bold" />
                            </div>
                            <p className="text-xs text-color-secondary m-0 mb-3">
                                Pembayaran ini langsung mengurangi saldo tagihan sewa kamar & fasilitas tamu (pendapatan hotel, non-refundable).
                            </p>

                            {/* Preset Buttons Pembayaran Sewa */}
                            <div className="grid mb-3">
                                <div className="col-12 sm:col-4 mb-2">
                                    <div
                                        className={`p-3 border-round-xl border-2 cursor-pointer transition-all text-center h-full flex flex-column justify-content-between select-none ${
                                            isLunas && totalTagihan > 0
                                                ? 'border-green-600 surface-0 shadow-2 bg-green-50'
                                                : 'border-200 surface-0 hover:surface-100 hover:border-300'
                                        }`}
                                        onClick={() => applyPaymentPreset(totalTagihan)}
                                    >
                                        <div>
                                            <i className={`pi pi-check-circle text-2xl mb-1 ${isLunas && totalTagihan > 0 ? 'text-green-600' : 'text-400'}`}></i>
                                            <span className={`text-xs font-bold block ${isLunas && totalTagihan > 0 ? 'text-green-800' : 'text-900'}`}>
                                                Bayar Lunas (100%)
                                            </span>
                                            <span className="text-xs text-500 mt-1 block">
                                                Lunasi seluruh tagihan
                                            </span>
                                        </div>
                                        <div className="mt-2 pt-2 border-top-1 surface-border">
                                            <span className="text-xs font-bold text-green-700">
                                                Rp {totalTagihan.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 sm:col-4 mb-2">
                                    <div
                                        className={`p-3 border-round-xl border-2 cursor-pointer transition-all text-center h-full flex flex-column justify-content-between select-none ${
                                            paymentAmount === Math.round(totalTagihan * 0.5) && totalTagihan > 0
                                                ? 'border-orange-500 surface-0 shadow-2 bg-orange-50'
                                                : 'border-200 surface-0 hover:surface-100 hover:border-300'
                                        }`}
                                        onClick={() => applyPaymentPreset(Math.round(totalTagihan * 0.5))}
                                    >
                                        <div>
                                            <i className={`pi pi-percentage text-2xl mb-1 ${paymentAmount === Math.round(totalTagihan * 0.5) && totalTagihan > 0 ? 'text-orange-600' : 'text-400'}`}></i>
                                            <span className={`text-xs font-bold block ${paymentAmount === Math.round(totalTagihan * 0.5) && totalTagihan > 0 ? 'text-orange-800' : 'text-900'}`}>
                                                Uang Muka (DP 50%)
                                            </span>
                                            <span className="text-xs text-500 mt-1 block">
                                                Bayar separuh tagihan
                                            </span>
                                        </div>
                                        <div className="mt-2 pt-2 border-top-1 surface-border">
                                            <span className="text-xs font-bold text-orange-700">
                                                Rp {Math.round(totalTagihan * 0.5).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 sm:col-4 mb-2">
                                    <div
                                        className={`p-3 border-round-xl border-2 cursor-pointer transition-all text-center h-full flex flex-column justify-content-between select-none ${
                                            isPayZero
                                                ? 'border-blue-500 surface-0 shadow-2 bg-blue-50'
                                                : 'border-200 surface-0 hover:surface-100 hover:border-300'
                                        }`}
                                        onClick={() => applyPaymentPreset(0)}
                                    >
                                        <div>
                                            <i className={`pi pi-clock text-2xl mb-1 ${isPayZero ? 'text-blue-600' : 'text-400'}`}></i>
                                            <span className={`text-xs font-bold block ${isPayZero ? 'text-blue-800' : 'text-900'}`}>
                                                Bayar di Checkout
                                            </span>
                                            <span className="text-xs text-500 mt-1 block">
                                                Bayar nanti saat keluar
                                            </span>
                                        </div>
                                        <div className="mt-2 pt-2 border-top-1 surface-border">
                                            <span className="text-xs font-bold text-500">
                                                Rp 0
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Input Manual Payment Amount */}
                            <div className="p-3 border-round-lg bg-surface-50 border-1 surface-border mb-3">
                                <div className="flex justify-content-between align-items-center mb-1">
                                    <label className="font-semibold text-xs text-900 m-0">
                                        Nominal Pembayaran Sewa Kamar (Rp)
                                    </label>
                                    {totalTagihan > 0 && !isLunas && (
                                        <Button
                                            type="button"
                                            label="⚡ Set Lunas"
                                            text
                                            className="p-0 text-xs text-primary font-bold"
                                            onClick={() => applyPaymentPreset(totalTagihan)}
                                        />
                                    )}
                                </div>
                                <InputNumber
                                    value={formik.values.payment_amount}
                                    onValueChange={(e) => {
                                        const val = e.value ?? 0;
                                        formik.setFieldValue('payment_amount', val);
                                        if ((val > 0 || depositAmount > 0) && !formik.values.payment_method) {
                                            formik.setFieldValue('payment_method', 'cash');
                                        }
                                    }}
                                    mode="currency"
                                    currency="IDR"
                                    locale="id-ID"
                                    min={0}
                                    placeholder="Rp 0"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Status Box Sewa Kamar */}
                        <div className="p-2 border-round-lg bg-surface-100 flex justify-content-between align-items-center text-xs">
                            <span className="text-color-secondary">
                                Sisa Tagihan Sewa (saat Checkout):
                            </span>
                            <span className={`font-bold text-sm ${sisaTagihan === 0 ? 'text-green-700' : 'text-red-600'}`}>
                                Rp {sisaTagihan.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* BAGIAN B: UANG JAMINAN / DEPOSIT (TIDAK MENGURANGI TAGIHAN, REFUNDABLE) */}
                <div className="col-12 lg:col-5">
                    <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-1 h-full flex flex-column justify-content-between">
                        <div>
                            <div className="flex align-items-center justify-content-between mb-2">
                                <div className="font-bold text-900 text-base flex align-items-center gap-2">
                                    <i className="pi pi-shield text-blue-600 text-lg"></i>
                                    2. Uang Jaminan (Deposit)
                                </div>
                                <Tag severity="info" value="REFUNDABLE (KEMBALI)" className="text-xs font-bold" />
                            </div>
                            <p className="text-xs text-color-secondary m-0 mb-3">
                                Uang jaminan kunci / fasilitas. <strong>TIDAK mengurangi total tagihan</strong> kamar dan <strong>akan dikembalikan</strong> saat check-out jika tidak ada insiden.
                            </p>

                            {/* Preset Buttons Deposit */}
                            <div className="grid mb-3">
                                <div className="col-6 mb-2">
                                    <Button
                                        type="button"
                                        label="Tanpa Deposit (Rp 0)"
                                        size="small"
                                        outlined={depositAmount !== 0}
                                        severity="secondary"
                                        className="w-full text-xs py-2"
                                        onClick={() => applyDepositPreset(0)}
                                    />
                                </div>
                                <div className="col-6 mb-2">
                                    <Button
                                        type="button"
                                        label="Deposit Rp 100.000"
                                        size="small"
                                        outlined={depositAmount !== 100000}
                                        severity="info"
                                        className="w-full text-xs py-2 font-semibold"
                                        onClick={() => applyDepositPreset(100000)}
                                    />
                                </div>
                                <div className="col-6 mb-2">
                                    <Button
                                        type="button"
                                        label="Deposit Rp 200.000"
                                        size="small"
                                        outlined={depositAmount !== 200000}
                                        severity="info"
                                        className="w-full text-xs py-2 font-semibold"
                                        onClick={() => applyDepositPreset(200000)}
                                    />
                                </div>
                                <div className="col-6 mb-2">
                                    <Button
                                        type="button"
                                        label="Deposit Rp 500.000"
                                        size="small"
                                        outlined={depositAmount !== 500000}
                                        severity="info"
                                        className="w-full text-xs py-2 font-semibold"
                                        onClick={() => applyDepositPreset(500000)}
                                    />
                                </div>
                            </div>

                            {/* Input Manual Deposit Amount */}
                            <div className="p-3 border-round-lg bg-surface-50 border-1 surface-border mb-3">
                                <label className="font-semibold text-xs text-900 block mb-1">
                                    Nominal Uang Jaminan Kunci / Kerusakan (Rp)
                                </label>
                                <InputNumber
                                    value={formik.values.deposit_amount}
                                    onValueChange={(e) => {
                                        const val = e.value ?? 0;
                                        formik.setFieldValue('deposit_amount', val);
                                        if ((val > 0 || paymentAmount > 0) && !formik.values.payment_method) {
                                            formik.setFieldValue('payment_method', 'cash');
                                        }
                                    }}
                                    mode="currency"
                                    currency="IDR"
                                    locale="id-ID"
                                    min={0}
                                    placeholder="Rp 0"
                                    className="w-full"
                                />
                                <small className="text-color-secondary block mt-1">
                                    {depositAmount > 0 ? (
                                        <span className="text-blue-700">
                                            ✓ Dicatat sebagai titipan kasir Rp {depositAmount.toLocaleString('id-ID')} (dikembalikan ke tamu saat check-out).
                                        </span>
                                    ) : (
                                        <span>Tamu tidak menitipkan uang jaminan saat walk-in.</span>
                                    )}
                                </small>
                            </div>
                        </div>

                        {/* Status Box Deposit */}
                        <div className="p-2 border-round-lg bg-blue-50 border-1 border-blue-100 flex justify-content-between align-items-center text-xs">
                            <span className="text-blue-900 font-medium">
                                Status Uang Jaminan:
                            </span>
                            <span className="font-bold text-sm text-blue-700">
                                {depositAmount > 0 ? `Rp ${depositAmount.toLocaleString('id-ID')} (Titipan Kasir)` : 'Tanpa Uang Jaminan'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. REKONSILIASI KASIR REAL-TIME & TOTAL UANG DITERIMA */}
            <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-1">
                <div className="font-bold text-900 text-sm mb-3 flex align-items-center gap-2">
                    <i className="pi pi-calculator text-primary"></i>
                    Ringkasan Rekonsiliasi Kasir & Arus Kas Walk-In
                </div>

                <div className="grid text-center">
                    <div className="col-12 sm:col-3 border-none sm:border-right-1 surface-border mb-2 sm:mb-0">
                        <span className="text-xs text-500 block">Total Tagihan Walk-In</span>
                        <span className="text-base font-bold text-900 block mt-1">
                            Rp {totalTagihan.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-500">Sewa + Fasilitas</span>
                    </div>

                    <div className="col-12 sm:col-3 border-none sm:border-right-1 surface-border mb-2 sm:mb-0">
                        <span className="text-xs text-green-700 font-semibold block">Pembayaran Sewa (Income)</span>
                        <span className="text-base font-bold text-green-600 block mt-1">
                            Rp {paymentAmount.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-green-600">Mengurangi Tagihan</span>
                    </div>

                    <div className="col-12 sm:col-3 border-none sm:border-right-1 surface-border mb-2 sm:mb-0">
                        <span className="text-xs text-blue-700 font-semibold block">Uang Jaminan (Deposit)</span>
                        <span className="text-base font-bold text-blue-600 block mt-1">
                            Rp {depositAmount.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-blue-600">Dikembalikan saat Out</span>
                    </div>

                    <div className="col-12 sm:col-3">
                        <span className="text-xs text-red-600 font-semibold block">Sisa Tagihan Checkout</span>
                        <span className={`text-base font-bold block mt-1 ${sisaTagihan === 0 ? 'text-green-700' : 'text-red-600'}`}>
                            Rp {sisaTagihan.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-500">{sisaTagihan === 0 ? 'LUNAS' : 'Belum Lunas'}</span>
                    </div>
                </div>

                {/* Highlight Total Uang Fisik Yang Diterima Kasir */}
                <div className="mt-3 p-3 border-round-xl bg-primary-50 border-1 border-primary-200 flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-money-bill text-primary text-2xl"></i>
                        <div>
                            <span className="text-xs text-primary-900 font-bold block uppercase tracking-wider">
                                Total Uang Fisik Diterima Kasir Sekarang:
                            </span>
                            <span className="text-xs text-primary-800">
                                (Sewa Kamar Rp {paymentAmount.toLocaleString('id-ID')} + Uang Jaminan Rp {depositAmount.toLocaleString('id-ID')})
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-primary block">
                            Rp {totalUangKasir.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-color-secondary">
                            {totalUangKasir > 0 ? `Metode: ${(formik.values.payment_method || 'CASH').toUpperCase()}` : 'Belum ada uang diterima'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepPayment;

