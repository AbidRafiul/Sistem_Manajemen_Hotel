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
                // Auto-pilih shift pertama jika belum terpilih
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

    const isDepositActive = (formik.values.deposit_amount || 0) > 0;

    const applyDepositPreset = (val: number) => {
        formik.setFieldValue('deposit_amount', val);
        if (val > 0 && !formik.values.payment_method) {
            formik.setFieldValue('payment_method', 'cash');
        }
    };

    const isPresetActive = (val: number) => {
        return (formik.values.deposit_amount || 0) === val;
    };

    const selectedRooms = formik.values.selected_rooms || [];
    const hasMultiRooms = selectedRooms.length > 0;
    const activeExtraFacilities = (formik.values.extra_facilities || []).filter(f => f.qty > 0 || f.subtotal > 0);
    const totalFasilitas = activeExtraFacilities.reduce((sum, f) => sum + (f.subtotal || 0), 0);
    const totalKamar = hasMultiRooms
        ? selectedRooms.reduce((acc, r) => acc + (r.price_per_night * (r.nights || formik.values.nights)), 0)
        : (state.rateInfo?.price_per_night || 0) * formik.values.nights;
    const totalTagihan = totalKamar + totalFasilitas;

    return (
        <div className="flex flex-column gap-3">
            {/* 1. Hero Summary Card: Tagihan Folio & Konsep Uang Jaminan */}
            <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-1">
                <div className="grid align-items-center">
                    {/* Sisi Kiri: Rincian Tagihan Kamar & Layanan */}
                    <div className="col-12 md:col-7 pr-0 md:pr-4 border-none md:border-right-1 surface-border">
                        <div className="flex align-items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs uppercase font-bold text-color-secondary tracking-wider flex align-items-center gap-1">
                                <i className="pi pi-receipt text-primary"></i> Total Tagihan Folio
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
                                    <span>Fasilitas Tambahan: <strong className="text-blue-600">+ Rp {totalFasilitas.toLocaleString('id-ID')}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sisi Kanan: Status Uang Jaminan & Prinsip SOP */}
                    <div className="col-12 md:col-5 pl-0 md:pl-4 mt-3 md:mt-0">
                        <div className="flex align-items-center justify-content-between mb-2">
                            <span className="font-bold text-sm text-900 flex align-items-center gap-2">
                                <i className="pi pi-shield text-green-600 text-lg"></i> Uang Jaminan (Deposit)
                            </span>
                            <Tag 
                                severity={isDepositActive ? "success" : "secondary"} 
                                value={isDepositActive ? `Diterima (Rp ${formik.values.deposit_amount.toLocaleString('id-ID')})` : "Opsional (Rp 0)"} 
                                className="text-xs font-semibold" 
                            />
                        </div>
                        <p className="text-xs text-color-secondary m-0 line-height-3">
                            Deposit berfungsi sebagai garansi insidentil/kunci dan <strong>tidak memotong total tagihan</strong>. Uang jaminan dapat dikembalikan utuh (*refund*) saat check-out.
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Pilihan Cepat Nominal Deposit (Horizontal Interactive Cards) */}
            <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-1">
                <div className="flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div className="font-bold text-900 text-base flex align-items-center gap-2">
                        <i className="pi pi-wallet text-primary text-lg"></i>
                        Penerimaan Deposit / Uang Jaminan
                    </div>
                    <span className="text-xs text-color-secondary">
                        Pilih nominal cepat atau sesuaikan langsung pada input di bawah
                    </span>
                </div>

                <div className="grid mb-3">
                    {/* Preset 0: Pelunasan Penuh 100% */}
                    <div className="col-12 sm:col-6 md:col-4 lg:col mb-2">
                        <div
                            className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                isPresetActive(totalTagihan) && totalTagihan > 0
                                    ? 'border-primary surface-0 shadow-2 bg-primary-50'
                                    : 'border-200 surface-0 hover:surface-100 hover:border-300'
                            }`}
                            onClick={() => applyDepositPreset(totalTagihan)}
                        >
                            <i className={`pi pi-check-circle text-2xl mb-2 ${isPresetActive(totalTagihan) && totalTagihan > 0 ? 'text-primary font-bold' : 'text-primary-400'}`}></i>
                            <span className={`text-sm font-bold block ${isPresetActive(totalTagihan) && totalTagihan > 0 ? 'text-primary-700' : 'text-900'}`}>Lunas di Awal (100%)</span>
                            <span className="text-xs text-color-secondary mt-1">Rp {totalTagihan.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Preset 1: Tanpa Deposit */}
                    <div className="col-12 sm:col-6 md:col-4 lg:col mb-2">
                        <div
                            className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                isPresetActive(0)
                                    ? 'border-blue-600 surface-0 shadow-2 bg-blue-50'
                                    : 'border-200 surface-0 hover:surface-100 hover:border-300'
                            }`}
                            onClick={() => applyDepositPreset(0)}
                        >
                            <i className={`pi pi-times-circle text-2xl mb-2 ${isPresetActive(0) ? 'text-blue-600 font-bold' : 'text-400'}`}></i>
                            <span className={`text-sm font-bold block ${isPresetActive(0) ? 'text-blue-700' : 'text-900'}`}>Tanpa Deposit</span>
                            <span className="text-xs text-color-secondary mt-1">Rp 0 (Lewati)</span>
                        </div>
                    </div>

                    {/* Preset 2: Rp 100.000 */}
                    <div className="col-12 sm:col-6 md:col-4 lg:col mb-2">
                        <div
                            className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                isPresetActive(100000)
                                    ? 'border-green-600 surface-0 shadow-2 bg-green-50'
                                    : 'border-200 surface-0 hover:surface-100 hover:border-300'
                            }`}
                            onClick={() => applyDepositPreset(100000)}
                        >
                            <i className={`pi pi-wallet text-2xl mb-2 ${isPresetActive(100000) ? 'text-green-600 font-bold' : 'text-400'}`}></i>
                            <span className={`text-sm font-bold block ${isPresetActive(100000) ? 'text-green-700' : 'text-900'}`}>Rp 100.000</span>
                            <span className="text-xs text-color-secondary mt-1">Jaminan Standar</span>
                        </div>
                    </div>

                    {/* Preset 3: Rp 200.000 */}
                    <div className="col-12 sm:col-6 md:col-3 mb-2">
                        <div
                            className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                isPresetActive(200000)
                                    ? 'border-green-600 surface-0 shadow-2 bg-green-50'
                                    : 'border-200 surface-0 hover:surface-100 hover:border-300'
                            }`}
                            onClick={() => applyDepositPreset(200000)}
                        >
                            <i className={`pi pi-shield text-2xl mb-2 ${isPresetActive(200000) ? 'text-green-600 font-bold' : 'text-400'}`}></i>
                            <span className={`text-sm font-bold block ${isPresetActive(200000) ? 'text-green-700' : 'text-900'}`}>Rp 200.000</span>
                            <span className="text-xs text-color-secondary mt-1">Rekomendasi</span>
                        </div>
                    </div>

                    {/* Preset 4: Rp 500.000 */}
                    <div className="col-12 sm:col-6 md:col-3 mb-2">
                        <div
                            className={`p-3 border-round-xl border-2 cursor-pointer transition-all transition-duration-200 text-center h-full flex flex-column justify-content-center align-items-center select-none ${
                                isPresetActive(500000)
                                    ? 'border-green-600 surface-0 shadow-2 bg-green-50'
                                    : 'border-200 surface-0 hover:surface-100 hover:border-300'
                            }`}
                            onClick={() => applyDepositPreset(500000)}
                        >
                            <i className={`pi pi-star text-2xl mb-2 ${isPresetActive(500000) ? 'text-green-600 font-bold' : 'text-400'}`}></i>
                            <span className={`text-sm font-bold block ${isPresetActive(500000) ? 'text-green-700' : 'text-900'}`}>Rp 500.000</span>
                            <span className="text-xs text-color-secondary mt-1">Suite / VIP</span>
                        </div>
                    </div>
                </div>

                {/* 3. Form Input & Metode Pembayaran (Langsung Ditampilkan) */}
                <div className="p-3 border-round-xl surface-50 border-1 surface-border">
                    <div className="font-semibold text-xs text-color-secondary uppercase tracking-wider mb-2">
                        Pilih Metode Pembayaran Deposit:
                    </div>

                    {/* Payment Method Visual Selector */}
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
                                Nominal Uang Jaminan (Rp)
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
                            <small className="text-color-secondary">Pilih preset di atas atau ketik nominal secara manual (isi 0 jika tanpa deposit).</small>
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

                    {/* Live Confirmation Banner */}
                    {isDepositActive ? (
                        <div className="mt-3 p-3 border-round-lg bg-green-100 border-1 border-green-300 flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-check-circle text-green-700 text-lg"></i>
                                <div>
                                    <span className="text-sm font-bold text-green-950">
                                        Deposit Tercatat: Rp {formik.values.deposit_amount.toLocaleString('id-ID')} via {(formik.values.payment_method || 'cash').toUpperCase()}
                                    </span>
                                    <span className="text-xs text-green-800 block mt-1">
                                        Disimpan terpisah di kasir sebagai jaminan • Tidak memotong total tagihan akomodasi ({totalTagihan > 0 ? `Rp ${totalTagihan.toLocaleString('id-ID')}` : 'berjalan'})
                                    </span>
                                </div>
                            </div>
                            <Tag severity="success" value="Jaminan Terpisah" icon="pi pi-shield" className="text-xs font-semibold px-2 py-1" />
                        </div>
                    ) : (
                        <div className="mt-3 p-3 border-round-lg bg-blue-50 border-1 border-blue-200 flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-info-circle text-blue-600 text-lg"></i>
                                <div>
                                    <span className="text-sm font-bold text-blue-950">
                                        Tanpa Deposit Awal (Rp 0)
                                    </span>
                                    <span className="text-xs text-blue-800 block mt-1">
                                        Tamu tidak menitipkan deposit • Seluruh tagihan akan diselesaikan saat proses check-in atau check-out
                                    </span>
                                </div>
                            </div>
                            <Tag severity="info" value="Tanpa Deposit" icon="pi pi-check" className="text-xs font-semibold px-2 py-1" />
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Bottom Navigation (Sleek Horizontal Alignment) */}
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
