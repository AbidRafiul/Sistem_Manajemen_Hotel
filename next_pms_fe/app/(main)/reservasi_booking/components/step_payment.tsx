'use client';

import React, { useEffect } from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import postData from '@/lib/axios/postData';
import { showError } from '@/lib/tools/generalTools';
import { apiCashierShiftDropdown } from './endpoints';

interface StepPaymentProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepPayment: React.FC<StepPaymentProps> = ({ state, setState, formik, toast }) => {

    useEffect(() => {
        const getCashierShift = async () => {
            setState(p => ({ ...p, cashierShiftLoad: true }));
            try {
                const res = await postData(apiCashierShiftDropdown, {
                    kode_cabang: formik.values.kode_cabang
                });
                const shifts = res.data.data || [];
                setState(p => ({ ...p, cashierShiftOptions: shifts }));
                if (shifts.length > 0 && !formik.values.kode_cashier_shift) {
                    formik.setFieldValue('kode_cashier_shift', shifts[0].kode_cashier_shift);
                }
            } catch (e: any) {
                showError(toast, "Gagal memuat data shift kasir: " + (e?.response?.data?.message || e.message));
            } finally {
                setState(p => ({ ...p, cashierShiftLoad: false }));
            }
        };
        getCashierShift();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.kode_cabang]);

    const paymentMethods = [
        { label: 'Tunai (Cash)', value: 'cash', icon: 'pi pi-money-bill' },
        { label: 'Kartu (Card)', value: 'card', icon: 'pi pi-credit-card' },
        { label: 'Transfer Bank', value: 'transfer', icon: 'pi pi-arrow-right-arrow-left' },
        { label: 'Mesin EDC', value: 'edc', icon: 'pi pi-calculator' }
    ];

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

    const applyPaymentPreset = (val: number) => {
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
            {/* 1. Hero Summary Card: Tagihan Booking & Status Pelunasan */}
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

                    {/* Sisi Kanan: Status Pelunasan */}
                    <div className="col-12 md:col-5 pl-0 md:pl-4 mt-3 md:mt-0">
                        <div className="flex align-items-center justify-content-between mb-2">
                            <span className="font-bold text-sm text-900 flex align-items-center gap-2">
                                <i className="pi pi-credit-card text-primary text-lg"></i> Skema Pelunasan
                            </span>
                            <Tag 
                                severity={isLunas ? "success" : isPartial ? "warning" : "info"} 
                                value={isLunas ? "LUNAS DI AWAL" : isPartial ? "UANG MUKA (DP)" : "BAYAR SAAT CHECK-IN"} 
                                className="text-xs font-bold" 
                            />
                        </div>
                        <p className="text-xs text-color-secondary m-0 line-height-3">
                            {isLunas ? (
                                <span className="text-green-700 font-medium">
                                    Tamu membayar lunas reservasi di muka. Reservasi berstatus <strong>Terkonfirmasi (Lunas)</strong> dan invoice resmi langsung diterbitkan.
                                </span>
                            ) : isPartial ? (
                                <span className="text-orange-700 font-medium">
                                    Tamu menitipkan DP sebesar Rp {paymentAmount.toLocaleString('id-ID')}. Sisa tagihan <strong>Rp {sisaTagihan.toLocaleString('id-ID')}</strong> akan dilunasi saat check-in atau checkout.
                                </span>
                            ) : (
                                <span className="text-500">
                                    Reservasi dibuat tanpa pembayaran di muka. Seluruh tagihan <strong>Rp {totalTagihan.toLocaleString('id-ID')}</strong> akan diselesaikan saat tamu tiba.
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Pilihan Cepat Nominal DP / Pelunasan */}
            <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-1">
                <div className="flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div className="font-bold text-900 text-base flex align-items-center gap-2">
                        <i className="pi pi-wallet text-primary text-lg"></i>
                        Pilihan Skema Pembayaran Booking
                    </div>
                    <span className="text-xs text-color-secondary">
                        Pilih nominal cepat atau sesuaikan langsung pada kolom input
                    </span>
                </div>

                <div className="grid mb-3">
                    {/* Preset 1: Bayar Lunas 100% */}
                    <div className="col-12 sm:col-4 mb-2">
                        <div
                            className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                isPresetActive(totalTagihan) && totalTagihan > 0
                                    ? 'border-green-600 surface-0 shadow-2 bg-green-50'
                                    : 'border-200 surface-0 hover:surface-100 hover:border-300'
                            }`}
                            onClick={() => applyPaymentPreset(totalTagihan)}
                        >
                            <i className={`pi pi-check-circle text-2xl mb-2 ${isPresetActive(totalTagihan) && totalTagihan > 0 ? 'text-green-600 font-bold' : 'text-400'}`}></i>
                            <span className={`text-sm font-bold block ${isPresetActive(totalTagihan) && totalTagihan > 0 ? 'text-green-800' : 'text-900'}`}>Bayar Lunas (100%)</span>
                            <span className="text-xs text-color-secondary mt-1">Rp {totalTagihan.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Preset 2: Uang Muka 50% */}
                    <div className="col-12 sm:col-4 mb-2">
                        <div
                            className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                isPresetActive(Math.round(totalTagihan * 0.5)) && totalTagihan > 0
                                    ? 'border-orange-500 surface-0 shadow-2 bg-orange-50'
                                    : 'border-200 surface-0 hover:surface-100 hover:border-300'
                            }`}
                            onClick={() => applyPaymentPreset(Math.round(totalTagihan * 0.5))}
                        >
                            <i className={`pi pi-percentage text-2xl mb-2 ${isPresetActive(Math.round(totalTagihan * 0.5)) && totalTagihan > 0 ? 'text-orange-600 font-bold' : 'text-400'}`}></i>
                            <span className={`text-sm font-bold block ${isPresetActive(Math.round(totalTagihan * 0.5)) && totalTagihan > 0 ? 'text-orange-800' : 'text-900'}`}>Uang Muka (DP 50%)</span>
                            <span className="text-xs text-color-secondary mt-1">Rp {Math.round(totalTagihan * 0.5).toLocaleString('id-ID')} (Rekomendasi)</span>
                        </div>
                    </div>

                    {/* Preset 3: Tanpa Pembayaran di Muka (Rp 0) */}
                    <div className="col-12 sm:col-4 mb-2">
                        <div
                            className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                isPresetActive(0)
                                    ? 'border-blue-600 surface-0 shadow-2 bg-blue-50'
                                    : 'border-200 surface-0 hover:surface-100 hover:border-300'
                            }`}
                            onClick={() => applyPaymentPreset(0)}
                        >
                            <i className={`pi pi-clock text-2xl mb-2 ${isPresetActive(0) ? 'text-blue-600 font-bold' : 'text-400'}`}></i>
                            <span className={`text-sm font-bold block ${isPresetActive(0) ? 'text-blue-700' : 'text-900'}`}>Tanpa Pembayaran (Rp 0)</span>
                            <span className="text-xs text-color-secondary mt-1">Bayar saat Check-In</span>
                        </div>
                    </div>
                </div>

                {/* 3. Metode Pembayaran & Input Nominal */}
                <div className="p-3 border-round-xl surface-50 border-1 surface-border">
                    <div className="font-semibold text-xs text-color-secondary uppercase tracking-wider mb-2">
                        Pilih Metode Pembayaran:
                    </div>

                    {/* Payment Method Selector */}
                    <div className="grid mb-3">
                        {paymentMethods.map(m => {
                            const isSelected = (formik.values.payment_method || 'cash') === m.value;
                            return (
                                <div key={m.value} className="col-6 sm:col-3">
                                    <div
                                        className={`p-3 border-round-lg border-1 cursor-pointer text-center transition-all transition-duration-150 select-none flex align-items-center justify-content-center gap-2 ${
                                            isSelected
                                                ? 'border-green-600 bg-green-600 text-white font-bold shadow-1'
                                                : 'border-300 surface-0 hover:surface-100 text-700 font-medium'
                                        }`}
                                        onClick={() => formik.setFieldValue('payment_method', m.value)}
                                    >
                                        <i className={`${m.icon} text-base`}></i>
                                        <span className="text-xs">{m.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Fields Grid */}
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <label className="font-semibold text-sm block mb-1">
                                Nominal Pembayaran / DP (Rp)
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
                            <small className="text-color-secondary">Gunakan tombol preset di atas atau ketik nominal khusus.</small>
                        </div>

                        <div className="col-12 md:col-6">
                            <label className="font-semibold text-sm block mb-1">
                                Shift Kasir Penerima
                            </label>
                            <Dropdown
                                value={formik.values.kode_cashier_shift}
                                options={state.cashierShiftOptions}
                                onChange={(e) => formik.setFieldValue('kode_cashier_shift', e.value)}
                                optionLabel="nama_shift"
                                optionValue="kode_cashier_shift"
                                placeholder="Pilih Shift Kasir"
                                disabled={state.cashierShiftLoad}
                                className={`w-full ${formik.errors.kode_cashier_shift && formik.touched.kode_cashier_shift ? 'p-invalid' : ''}`}
                            />
                            {formik.errors.kode_cashier_shift && formik.touched.kode_cashier_shift && (
                                <small className="p-error">{formik.errors.kode_cashier_shift}</small>
                            )}
                        </div>
                    </div>

                    {/* Rekonsiliasi Saldo Real-Time */}
                    <div className="mt-3 p-3 border-round-lg surface-card border-1 surface-border">
                        <div className="grid text-center">
                            <div className="col-4 border-right-1 surface-border">
                                <span className="text-xs text-500 block">Total Tagihan Booking</span>
                                <span className="text-base font-bold text-900 block mt-1">
                                    Rp {totalTagihan.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="col-4 border-right-1 surface-border">
                                <span className="text-xs text-500 block">Pembayaran Diterima</span>
                                <span className="text-base font-bold text-green-600 block mt-1">
                                    Rp {paymentAmount.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="col-4">
                                <span className="text-xs text-500 block">Sisa Tagihan (Saldo)</span>
                                <span className={`text-base font-bold block mt-1 ${sisaTagihan === 0 ? 'text-green-700' : 'text-orange-600'}`}>
                                    Rp {sisaTagihan.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Bottom Navigation */}
            <div className="flex justify-content-between align-items-center flex-wrap gap-3 mt-3 pt-3 border-top-1 surface-border">
                <Button
                    type="button"
                    label="Kembali ke Fasilitas Tambahan"
                    icon="pi pi-arrow-left"
                    outlined
                    severity="secondary"
                    className="px-4 py-2 font-medium border-round-lg"
                    onClick={() => setState(p => ({ ...p, activeStep: 2 }))}
                />
                <Button
                    type="button"
                    label="Lanjut ke Konfirmasi"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    severity="success"
                    className="px-4 py-2 font-bold shadow-2 border-round-lg"
                    onClick={() => setState(p => ({ ...p, activeStep: 4 }))}
                />
            </div>
        </div>
    );
};

export default StepPayment;
