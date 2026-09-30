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

const StepPayment: React.FC<StepPaymentProps> = ({ state, setState, formik, toast }) => {
    const selectedRooms = formik.values.selected_rooms || [];
    const hasMultiRooms = selectedRooms.length > 0;
    const activeExtraFacilities = (formik.values.extra_facilities || []).filter(f => f.qty > 0 || f.subtotal > 0);
    const totalFasilitas = activeExtraFacilities.reduce((sum, f) => sum + (f.subtotal || 0), 0);
    const totalKamar = hasMultiRooms
        ? selectedRooms.reduce((acc, r) => acc + (r.price_per_night * (r.nights || formik.values.nights)), 0)
        : (state.rateInfo?.price_per_night || 0) * formik.values.nights;
    const totalTagihan = totalKamar + totalFasilitas;

    const paymentAmount = formik.values.deposit_amount || 0;
    const sisaTagihan = Math.max(0, totalTagihan - paymentAmount);
    const isLunas = paymentAmount >= totalTagihan && totalTagihan > 0;
    const isPartial = paymentAmount > 0 && paymentAmount < totalTagihan;
    const isDepositActive = paymentAmount > 0;

    const applyDepositPreset = (val: number) => {
        formik.setFieldValue('deposit_amount', val);
        if (val > 0 && !formik.values.payment_method) {
            formik.setFieldValue('payment_method', 'cash');
        }
    };

    const isPresetActive = (val: number) => {
        return paymentAmount === val;
    };

    return (
        <div className="flex flex-column gap-3">
            {/* 1. Hero Summary Card: Total Tagihan Booking & Status Uang Jaminan */}
            <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-1">
                <div className="grid align-items-center">
                    {/* Sisi Kiri: Rincian Tagihan */}
                    <div className="col-12 md:col-7 pr-0 md:pr-4 border-none md:border-right-1 surface-border">
                        <div className="flex align-items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs uppercase font-bold text-color-secondary tracking-wider flex align-items-center gap-1">
                                <i className="pi pi-receipt text-primary"></i> Total Tagihan Reservasi Booking
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
                                    <i className="pi pi-sparkles text-blue-500"></i>
                                    <span>Fasilitas: <strong className="text-blue-600">+ Rp {totalFasilitas.toLocaleString('id-ID')}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sisi Kanan: Status Deposit & Uang Jaminan */}
                    <div className="col-12 md:col-5 pl-0 md:pl-4 mt-3 md:mt-0">
                        <div className="flex align-items-center justify-content-between mb-2">
                            <span className="font-bold text-sm text-900 flex align-items-center gap-2">
                                <i className="pi pi-shield text-green-600 text-lg"></i> Uang Jaminan (Deposit)
                            </span>
                            <Tag 
                                severity={isLunas ? "success" : isPartial ? "warning" : "info"} 
                                value={isLunas ? "LUNAS (100%)" : isPartial ? "DEPOSIT / DP" : "OPSIONAL (RP 0)"} 
                                icon={isLunas ? "pi pi-check-circle" : isPartial ? "pi pi-shield" : "pi pi-info-circle"}
                                className="text-xs font-bold" 
                            />
                        </div>
                        <p className="text-xs text-color-secondary m-0 line-height-3">
                            {isLunas ? (
                                <span className="text-green-700 font-medium">
                                    Tamu membayar lunas seluruh tagihan booking di muka. Status invoice reservasi terbit <strong>LUNAS</strong>.
                                </span>
                            ) : isPartial ? (
                                <span className="text-orange-700 font-medium">
                                    Deposit / DP tercatat sebesar <strong>Rp {paymentAmount.toLocaleString('id-ID')}</strong>. Sisa <strong>Rp {sisaTagihan.toLocaleString('id-ID')}</strong> diselesaikan saat check-in.
                                </span>
                            ) : (
                                <span className="text-500">
                                    Deposit berfungsi sebagai jaminan pemesanan kamar (opsional). Seluruh tagihan <strong>Rp {totalTagihan.toLocaleString('id-ID')}</strong> dapat dilunasi saat tamu check-in.
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Pilihan Cepat Preset Deposit & Input Manual */}
            <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-1">
                <div className="flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div className="font-bold text-900 text-base flex align-items-center gap-2">
                        <i className="pi pi-shield text-green-600 text-lg"></i>
                        Penetapan Uang Jaminan (Deposit)
                    </div>
                    <span className="text-xs text-color-secondary">
                        Pilih nominal preset cepat atau masukkan manual di bawah
                    </span>
                </div>

                {/* Section A: Preset Uang Jaminan Standar (SOP Hotel) */}
                <div className="mb-4">
                    <div className="text-xs font-bold text-color-secondary uppercase tracking-wider mb-2 flex align-items-center gap-1">
                        <i className="pi pi-bolt text-amber-500"></i> Pilihan Cepat Uang Jaminan (Deposit):
                    </div>
                    <div className="grid">
                        {/* Preset Tanpa Deposit (Rp 0) */}
                        <div className="col-12 sm:col-3 mb-2">
                            <div
                                className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                    isPresetActive(0)
                                        ? 'border-blue-600 surface-0 shadow-2 bg-blue-50'
                                        : 'border-200 surface-0 hover:surface-100 hover:border-300'
                                }`}
                                onClick={() => applyDepositPreset(0)}
                            >
                                <i className={`pi pi-clock text-2xl mb-2 ${isPresetActive(0) ? 'text-blue-600 font-bold' : 'text-400'}`}></i>
                                <span className={`text-sm font-bold block ${isPresetActive(0) ? 'text-blue-700' : 'text-900'}`}>Rp 0 (Opsional)</span>
                                <span className="text-xs text-color-secondary mt-1">Tanpa Deposit di Muka</span>
                            </div>
                        </div>

                        {/* Preset Rp 100.000 */}
                        <div className="col-12 sm:col-3 mb-2">
                            <div
                                className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                    isPresetActive(100000)
                                        ? 'border-green-600 surface-0 shadow-2 bg-green-50'
                                        : 'border-200 surface-0 hover:surface-100 hover:border-300'
                                }`}
                                onClick={() => applyDepositPreset(100000)}
                            >
                                <i className={`pi pi-shield text-2xl mb-2 ${isPresetActive(100000) ? 'text-green-600 font-bold' : 'text-400'}`}></i>
                                <span className={`text-sm font-bold block ${isPresetActive(100000) ? 'text-green-800' : 'text-900'}`}>Rp 100.000</span>
                                <span className="text-xs text-color-secondary mt-1">Deposit Standar</span>
                            </div>
                        </div>

                        {/* Preset Rp 200.000 */}
                        <div className="col-12 sm:col-3 mb-2">
                            <div
                                className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                    isPresetActive(200000)
                                        ? 'border-green-600 surface-0 shadow-2 bg-green-50'
                                        : 'border-200 surface-0 hover:surface-100 hover:border-300'
                                }`}
                                onClick={() => applyDepositPreset(200000)}
                            >
                                <i className={`pi pi-shield text-2xl mb-2 ${isPresetActive(200000) ? 'text-green-600 font-bold' : 'text-400'}`}></i>
                                <span className={`text-sm font-bold block ${isPresetActive(200000) ? 'text-green-800' : 'text-900'}`}>Rp 200.000</span>
                                <span className="text-xs text-color-secondary mt-1">Deposit Deluxe / Family</span>
                            </div>
                        </div>

                        {/* Preset Rp 500.000 */}
                        <div className="col-12 sm:col-3 mb-2">
                            <div
                                className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                    isPresetActive(500000)
                                        ? 'border-green-600 surface-0 shadow-2 bg-green-50'
                                        : 'border-200 surface-0 hover:surface-100 hover:border-300'
                                }`}
                                onClick={() => applyDepositPreset(500000)}
                            >
                                <i className={`pi pi-star text-2xl mb-2 ${isPresetActive(500000) ? 'text-green-600 font-bold' : 'text-400'}`}></i>
                                <span className={`text-sm font-bold block ${isPresetActive(500000) ? 'text-green-800' : 'text-900'}`}>Rp 500.000</span>
                                <span className="text-xs text-color-secondary mt-1">Suite / VIP Room</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section B: Skema Pembayaran Seluruh Tagihan / DP jika tamu ingin langsung bayar */}
                <div className="mb-4">
                    <div className="text-xs font-bold text-color-secondary uppercase tracking-wider mb-2 flex align-items-center gap-1">
                        <i className="pi pi-credit-card text-blue-600"></i> Skema Pelunasan Tagihan Folio:
                    </div>
                    <div className="grid">
                        {/* Preset Bayar Lunas 100% */}
                        <div className="col-12 sm:col-6 mb-2">
                            <div
                                className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                    isPresetActive(totalTagihan) && totalTagihan > 0
                                        ? 'border-green-600 surface-0 shadow-2 bg-green-50'
                                        : 'border-200 surface-0 hover:surface-100 hover:border-300'
                                }`}
                                onClick={() => applyDepositPreset(totalTagihan)}
                            >
                                <i className={`pi pi-check-circle text-2xl mb-2 ${isPresetActive(totalTagihan) && totalTagihan > 0 ? 'text-green-600 font-bold' : 'text-400'}`}></i>
                                <span className={`text-sm font-bold block ${isPresetActive(totalTagihan) && totalTagihan > 0 ? 'text-green-800' : 'text-900'}`}>Bayar Lunas Langsung (100%)</span>
                                <span className="text-xs text-color-secondary mt-1">Rp {totalTagihan.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        {/* Preset Uang Muka 50% */}
                        <div className="col-12 sm:col-6 mb-2">
                            <div
                                className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                    isPresetActive(Math.round(totalTagihan * 0.5)) && totalTagihan > 0
                                        ? 'border-orange-500 surface-0 shadow-2 bg-orange-50'
                                        : 'border-200 surface-0 hover:surface-100 hover:border-300'
                                }`}
                                onClick={() => applyDepositPreset(Math.round(totalTagihan * 0.5))}
                            >
                                <i className={`pi pi-percentage text-2xl mb-2 ${isPresetActive(Math.round(totalTagihan * 0.5)) && totalTagihan > 0 ? 'text-orange-600 font-bold' : 'text-400'}`}></i>
                                <span className={`text-sm font-bold block ${isPresetActive(Math.round(totalTagihan * 0.5)) && totalTagihan > 0 ? 'text-orange-800' : 'text-900'}`}>Uang Muka (DP 50%)</span>
                                <span className="text-xs text-color-secondary mt-1">Rp {Math.round(totalTagihan * 0.5).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section C: Input Manual Nominal Deposit */}
                <div className="p-3 border-round-xl surface-50 border-1 surface-border">
                    <label className="font-semibold text-sm block mb-1 text-900">
                        Input Manual Nominal Uang Jaminan / Deposit (Rp)
                    </label>
                    <InputNumber
                        value={formik.values.deposit_amount}
                        onValueChange={(e) => {
                            const val = e.value ?? 0;
                            formik.setFieldValue('deposit_amount', val);
                            if (val > 0 && !formik.values.payment_method) {
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
                        Pilih tombol preset di atas atau ketik langsung nominal khusus sesuai kesepakatan tamu (isi 0 jika tanpa deposit).
                    </small>

                    {/* Live Deposit Status Banner */}
                    {isDepositActive ? (
                        <div className="mt-3 p-3 border-round-lg bg-green-50 border-1 border-green-200 flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-shield text-green-700 text-xl"></i>
                                <div>
                                    <span className="text-sm font-bold text-green-950">
                                        Deposit Disiapkan: Rp {paymentAmount.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-xs text-green-800 block mt-1">
                                        Uang jaminan ini akan dicatat pada kasir & folio. <em>Metode pembayaran akan dipilih pada Tab Konfirmasi & Pembayaran.</em>
                                    </span>
                                </div>
                            </div>
                            <Tag severity="success" value="Deposit Aktif" icon="pi pi-shield" className="text-xs font-semibold px-2 py-1" />
                        </div>
                    ) : (
                        <div className="mt-3 p-3 border-round-lg bg-blue-50 border-1 border-blue-200 flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-info-circle text-blue-600 text-lg"></i>
                                <div>
                                    <span className="text-sm font-bold text-blue-950">
                                        Tanpa Uang Jaminan Awal (Rp 0)
                                    </span>
                                    <span className="text-xs text-blue-800 block mt-1">
                                        Tamu tidak menitipkan deposit di muka. Seluruh pembayaran tagihan diselesaikan saat check-in.
                                    </span>
                                </div>
                            </div>
                            <Tag severity="info" value="Tanpa Deposit" icon="pi pi-check" className="text-xs font-semibold px-2 py-1" />
                        </div>
                    )}

                    {/* Rekonsiliasi Saldo Real-Time */}
                    <div className="mt-3 p-3 border-round-lg surface-card border-1 surface-border">
                        <div className="grid text-center">
                            <div className="col-4 border-right-1 surface-border">
                                <span className="text-xs text-500 block">Total Tagihan</span>
                                <span className="text-base font-bold text-900 block mt-1">
                                    Rp {totalTagihan.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="col-4 border-right-1 surface-border">
                                <span className="text-xs text-500 block">Uang Jaminan (Deposit)</span>
                                <span className="text-base font-bold text-green-600 block mt-1">
                                    Rp {paymentAmount.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="col-4">
                                <span className="text-xs text-500 block">Estimasi Sisa Tagihan saat Check-In</span>
                                <span className={`text-base font-bold block mt-1 ${sisaTagihan === 0 ? 'text-green-700' : 'text-orange-600'}`}>
                                    Rp {sisaTagihan.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Bottom Navigation */}
            <div className="flex justify-content-between align-items-center flex-wrap gap-3 mt-3 pt-3 border-top-1 surface-border">
                <Button
                    type="button"
                    label="Kembali ke Fasilitas Tambahan"
                    icon="pi pi-arrow-left"
                    outlined
                    severity="secondary"
                    className="px-4 py-2 font-medium border-round-lg"
                    onClick={() => setState(p => ({ ...p, activeStep: 1 }))}
                />
                <Button
                    type="button"
                    label="Lanjut ke Data Tamu"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    severity="success"
                    className="px-4 py-2 font-bold shadow-2 border-round-lg"
                    onClick={() => setState(p => ({ ...p, activeStep: 3 }))}
                />
            </div>
        </div>
    );
};

export default StepPayment;
