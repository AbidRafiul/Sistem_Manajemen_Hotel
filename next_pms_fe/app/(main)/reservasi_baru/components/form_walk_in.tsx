'use client';
import React, { useEffect, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import StepGuest from './step_guest';
import StepAvailability from './step_availability';
import StepExtraFacilities from './step_extra_facilities';
import StepPayment from './step_payment';
import DialogKonfirmasiWalkin from './dialog_konfirmasi_walkin';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import postData from '@/lib/axios/postData';
import { apiCashierShiftDropdown, apiShiftCurrent } from './endpoints';
import { showError } from '@/lib/tools/generalTools';

interface FormWalkInProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const FormWalkIn: React.FC<FormWalkInProps> = ({ state, setState, formik, toast }) => {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const selectedRooms = formik.values.selected_rooms || [];
    const hasGuest = !!(formik.values.kode_guest || (state.foundGuest && !state.isGuestNew) || formik.values.full_name);
    const hasRoom = selectedRooms.length > 0 || !!(formik.values.kode_tipe_kamar && formik.values.kode_rate_plan && formik.values.kode_kamar);
    const totalMoneyCollected = Number(formik.values.payment_amount || 0) + Number(formik.values.deposit_amount || 0);
    const hasPaymentSetup = totalMoneyCollected === 0 || !!(totalMoneyCollected > 0 && formik.values.payment_method);

    const activeExtraFacilities = (formik.values.extra_facilities || []).filter(f => f.qty > 0 || f.subtotal > 0);
    const totalFasilitas = activeExtraFacilities.reduce((sum, f) => sum + (f.subtotal || 0), 0);
    const totalKamar = selectedRooms.length > 0
        ? selectedRooms.reduce((sum, r) => sum + (r.total_price || 0), 0)
        : (state.rateInfo?.price_per_night || 0) * formik.values.nights;
    const totalTagihan = totalKamar + totalFasilitas;
    const guestName = state.foundGuest?.full_name || formik.values.full_name || null;

    useEffect(() => {
        const getCashierShift = async () => {
            if (!formik.values.kode_cabang) return;
            setState(p => ({ ...p, cashierShiftLoad: true }));
            try {
                try {
                    const currentShiftRes = await postData(apiShiftCurrent, {});
                    if (currentShiftRes?.data?.data?.kode_cashier_shift) {
                        formik.setFieldValue('kode_cashier_shift', currentShiftRes.data.data.kode_cashier_shift);
                    }
                } catch (err) { }

                const res = await postData(apiCashierShiftDropdown, {
                    kode_cabang: formik.values.kode_cabang
                });
                const shifts = res.data.data || [];
                setState(p => ({ ...p, cashierShiftOptions: shifts }));
                if (shifts.length > 0 && !formik.values.kode_cashier_shift) {
                    formik.setFieldValue('kode_cashier_shift', shifts[0].kode_cashier_shift);
                }
            } catch (e: any) {
                console.error("Gagal memuat data shift kasir:", e);
            } finally {
                setState(p => ({ ...p, cashierShiftLoad: false }));
            }
        };
        getCashierShift();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.kode_cabang]);

    const hasTabErrors = (tabIndex: number): boolean => {
        if (!formik || formik.submitCount === 0) return false;
        if (!formik?.errors) return false;
        const errorFields = Object.keys(formik.errors);
        return errorFields.some((field) => getTabForField(field) === tabIndex);
    };

    const getTabForField = (fieldName: string): number => {
        // Tab 0: Kamar & Tarif
        if (['check_in_date', 'check_out_date', 'kode_tipe_kamar', 'kode_rate_plan', 'kode_kamar', 'nights', 'rooms', 'kode_season'].includes(fieldName)) return 0;
        // Tab 1: Fasilitas Tambahan
        if (['extra_facilities'].includes(fieldName)) return 1;
        // Tab 2: Pembayaran & Uang Jaminan (Deposit)
        if (['payment_amount', 'deposit_amount'].includes(fieldName)) return 2;
        // Tab 3: Data Tamu
        if (['kode_cabang', 'keyword_guest', 'full_name', 'id_number', 'phone', 'email', 'address', 'nationality', 'kode_guest'].includes(fieldName)) return 3;
        return 0;
    };

    const handleNextStep = () => {
        if (state.activeStep === 0) {
            if (!hasRoom) {
                showError(toast, "Silakan pilih minimal 1 kamar fisik yang tersedia.");
                return;
            }
            setState(p => ({ ...p, activeStep: 1 }));
        } else if (state.activeStep === 1) {
            setState(p => ({ ...p, activeStep: 2 }));
        } else if (state.activeStep === 2) {
            setState(p => ({ ...p, activeStep: 3 }));
        } else if (state.activeStep === 3) {
            handleOpenConfirmModal();
        }
    };

    const handleOpenConfirmModal = () => {
        if (!hasRoom) {
            showError(toast, "Silakan pilih kamar terlebih dahulu di Tab Kamar & Tarif.");
            setState(p => ({ ...p, activeStep: 0 }));
            return;
        }
        if (!hasGuest) {
            showError(toast, "Silakan cari atau masukkan data identitas tamu terlebih dahulu.");
            setState(p => ({ ...p, activeStep: 3 }));
            return;
        }
        setShowConfirmDialog(true);
    };

    return (
        <div className="grid m-0 gap-0">
            <div className="col-12 lg:col-8 pr-0 lg:pr-3">
                <div className="card">
                    <div className="flex justify-content-between align-items-start mb-4 ">
                        <div className="flex flex-column">
                            <h3 className="text-2xl font-semibold flex align-items-center gap-2">
                                <i className="pi pi-users text-blue-600 text-3xl"></i>
                                Reservasi Baru (Walk-In)
                            </h3>
                            <p className="text-gray-500">
                                Pilih kamar & tarif di bawah untuk memulai reservasi tamu walk-in.
                            </p>
                        </div>
                    </div>

                    <div className="py-2">
                        <TabView className="browser-style-tabs" scrollable activeIndex={state.activeStep} onTabChange={(e) => setState((p) => ({ ...p, activeStep: e.index }))}>
                            {/* Tab 0: Kamar & Tarif (Landing Page Front Office) */}
                            <TabPanel
                                header={
                                    <div className={`flex align-items-center gap-2 ${hasTabErrors(0) ? 'text-red-500' : ''}`}>
                                        <i className="pi pi-home"></i>
                                        <span>Kamar & Tarif {selectedRooms.length > 0 ? `(${selectedRooms.length})` : ''}</span>
                                        {hasTabErrors(0) && <i className="pi pi-exclamation-circle text-red-500 animation-duration-300 fadein" style={{ fontSize: '0.95rem' }}></i>}
                                    </div>
                                }
                            >
                                <div className="pt-4 animation-duration-300 fadein">
                                    <StepAvailability state={state} setState={setState} formik={formik} toast={toast} />
                                </div>
                            </TabPanel>

                            {/* Tab 1: Fasilitas Tambahan */}
                            <TabPanel
                                header={
                                    <div className={`flex align-items-center gap-2 ${hasTabErrors(1) ? 'text-red-500' : ''}`}>
                                        <i className="pi pi-sparkles"></i>
                                        <span>Fasilitas Tambahan {activeExtraFacilities.length > 0 ? `(${activeExtraFacilities.length})` : ''}</span>
                                        {hasTabErrors(1) && <i className="pi pi-exclamation-circle text-red-500 animation-duration-300 fadein" style={{ fontSize: '0.95rem' }}></i>}
                                    </div>
                                }
                            >
                                <div className="pt-4 animation-duration-300 fadein">
                                    <StepExtraFacilities state={state} setState={setState} formik={formik} toast={toast} />
                                </div>
                            </TabPanel>

                            {/* Tab 2: Pembayaran & Uang Jaminan (Deposit) */}
                            <TabPanel
                                header={
                                    <div className={`flex align-items-center gap-2 ${hasTabErrors(2) ? 'text-red-500' : ''}`}>
                                        <i className="pi pi-credit-card"></i>
                                        <span>Pembayaran & Uang Jaminan</span>
                                        {hasTabErrors(2) && <i className="pi pi-exclamation-circle text-red-500 animation-duration-300 fadein" style={{ fontSize: '0.95rem' }}></i>}
                                    </div>
                                }
                            >
                                <div className="pt-4 animation-duration-300 fadein">
                                    <StepPayment state={state} setState={setState} formik={formik} toast={toast} />
                                </div>
                            </TabPanel>

                            {/* Tab 3: Data Tamu */}
                            <TabPanel
                                header={
                                    <div className={`flex align-items-center gap-2 ${hasTabErrors(3) ? 'text-red-500' : ''}`}>
                                        <i className="pi pi-user"></i>
                                        <span>Data Tamu</span>
                                        {hasTabErrors(3) && <i className="pi pi-exclamation-circle text-red-500 animation-duration-300 fadein" style={{ fontSize: '0.95rem' }}></i>}
                                    </div>
                                }
                            >
                                <div className="pt-4 animation-duration-300 fadein">
                                    <StepGuest state={state} setState={setState} formik={formik} toast={toast} />
                                </div>
                            </TabPanel>
                        </TabView>
                    </div>
                </div>
            </div>

            {/* Order Summary Sidebar (Pusat Navigasi & Aksi Kasir - Fixed / Sticky Viewport) */}
            <div className="col-12 lg:col-4 mt-4 lg:mt-0" style={{ position: 'relative' }}>
                <div
                    className="card shadow-2 border-round-xl border-1 surface-border p-3 lg:p-4 sticky-summary-sidebar"
                >
                    <div className="flex align-items-center justify-content-between mb-3 pb-2 border-bottom-1 surface-border">
                        <span className="font-bold text-lg text-900">Ringkasan Folio</span>
                        <Tag
                            value="Walk-In"
                            severity="info"
                        />
                    </div>

                    {/* Guest Info Widget */}
                    <div className="mb-3 p-2 border-round surface-50 flex align-items-center gap-2">
                        <i
                            className="pi pi-user text-primary"
                            style={{ fontSize: '1.2rem' }}
                        />
                        <div className="overflow-hidden">
                            <span className="text-xs text-color-secondary block">Tamu Menginap</span>
                            <span className="font-bold text-sm text-900 block white-space-nowrap overflow-hidden text-overflow-ellipsis">
                                {guestName ? guestName : <em className="text-400 font-normal">Belum diisi (di Tab Data Tamu)</em>}
                            </span>
                        </div>
                    </div>

                    {/* Room & Stay Details */}
                    <div className="text-sm">
                        <div className="flex justify-content-between py-1 border-top-1 surface-border">
                            <span className="text-color-secondary">Durasi Menginap</span>
                            <span className="font-medium text-900">{formik.values.nights} Malam</span>
                        </div>
                        <div className="flex justify-content-between py-1 border-top-1 surface-border">
                            <span className="text-color-secondary">Jumlah Kamar</span>
                            <span className="font-medium text-900">{selectedRooms.length > 0 ? selectedRooms.length : 1} Kamar</span>
                        </div>

                        {/* List selected rooms with quick removal */}
                        {selectedRooms.length > 0 && (
                            <div className="my-2 p-2 border-round bg-blue-50 border-1 border-blue-100">
                                <div className="text-xs font-bold text-blue-900 mb-1 flex justify-content-between align-items-center">
                                    <span>Kamar Dipilih ({selectedRooms.length}):</span>
                                    <span className="text-500 font-normal" style={{ fontSize: '10px' }}>Klik ✕ untuk hapus</span>
                                </div>
                                {selectedRooms.map((rm, idx) => (
                                    <div
                                        key={idx}
                                        className="flex justify-content-between align-items-center text-xs py-1 text-blue-800 border-bottom-1 border-blue-100 last:border-bottom-none"
                                    >
                                        <div className="flex align-items-center gap-1 overflow-hidden pr-2">
                                            <i
                                                className="pi pi-times-circle text-red-500 cursor-pointer hover:text-red-700 flex-shrink-0"
                                                style={{ fontSize: '0.9rem' }}
                                                title="Hapus kamar ini"
                                                onClick={() => {
                                                    const updated = (formik.values.selected_rooms || []).filter((s: any) => s.kode_kamar !== rm.kode_kamar);
                                                    formik.setFieldValue('selected_rooms', updated);
                                                    if (updated.length > 0) {
                                                        formik.setFieldValue('kode_kamar', updated[0].kode_kamar);
                                                        formik.setFieldValue('kode_tipe_kamar', updated[0].kode_tipe_kamar);
                                                    } else {
                                                        formik.setFieldValue('kode_kamar', '');
                                                        formik.setFieldValue('kode_tipe_kamar', '');
                                                    }
                                                }}
                                            />
                                            <span className="white-space-nowrap overflow-hidden text-overflow-ellipsis font-medium">
                                                No. {rm.nomor_kamar} ({rm.nama_tipe})
                                            </span>
                                        </div>
                                        <span className="font-semibold flex-shrink-0">
                                            Rp {(rm.price_per_night * (rm.nights || formik.values.nights)).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-content-between py-1 border-top-1 surface-border">
                            <span className="text-color-secondary">Biaya Kamar</span>
                            <span className="font-medium text-900">Rp {totalKamar.toLocaleString('id-ID')}</span>
                        </div>

                        {/* Extra Facilities in Summary */}
                        {activeExtraFacilities.length > 0 && (
                            <div className="my-2 p-2 border-round bg-purple-50 border-1 border-purple-100">
                                <div className="text-xs font-bold text-purple-900 mb-1 flex justify-content-between">
                                    <span>Fasilitas Tambahan ({activeExtraFacilities.length}):</span>
                                    <span className="text-purple-700 font-bold">+ Rp {totalFasilitas.toLocaleString('id-ID')}</span>
                                </div>
                                {activeExtraFacilities.map((f, idx) => (
                                    <div
                                        key={idx}
                                        className="flex justify-content-between text-xs py-1 text-purple-800"
                                    >
                                        <span>
                                            {f.nama} {f.qty > 1 ? `(${f.qty}x)` : ''}
                                        </span>
                                        <span>{f.subtotal > 0 ? `Rp ${f.subtotal.toLocaleString('id-ID')}` : 'Gratis'}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div
                            className="flex justify-content-between py-2 border-top-2 surface-border mt-2"
                            style={{ borderColor: 'var(--surface-border)' }}
                        >
                            <span className="font-bold">Total Tagihan Sewa</span>
                            <span className="font-bold text-primary text-lg">
                                Rp {totalTagihan.toLocaleString('id-ID')}
                            </span>
                        </div>

                        {/* Pembayaran & Uang Jaminan Widget */}
                        {(() => {
                            const payVal = Number(formik.values.payment_amount || 0);
                            const depVal = Number(formik.values.deposit_amount || 0);
                            const totalUangFisik = payVal + depVal;
                            const isLunas = payVal >= totalTagihan && totalTagihan > 0;
                            const isPartial = payVal > 0 && payVal < totalTagihan;
                            const sisa = Math.max(0, totalTagihan - payVal);

                            return (
                                <div className="mt-3 flex flex-column gap-2">
                                    {/* Sewa Kamar Status */}
                                    {isLunas ? (
                                        <div className="p-2 border-round bg-green-50 border-1 border-green-300">
                                            <div className="flex justify-content-between text-xs mb-1">
                                                <span className="font-semibold text-green-900 flex align-items-center gap-1">
                                                    <i className="pi pi-check-circle text-green-600" /> Sewa Dibayar Lunas
                                                </span>
                                                <span className="font-bold text-green-700">Rp {payVal.toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="text-green-800 font-semibold" style={{ fontSize: '11px' }}>
                                                ✓ Tagihan sewa lunas (Sisa: Rp 0)
                                            </div>
                                        </div>
                                    ) : isPartial ? (
                                        <div className="p-2 border-round bg-orange-50 border-1 border-orange-300">
                                            <div className="flex justify-content-between text-xs mb-1">
                                                <span className="font-semibold text-orange-900 flex align-items-center gap-1">
                                                    <i className="pi pi-percentage text-orange-600" /> Uang Muka Sewa (DP)
                                                </span>
                                                <span className="font-bold text-orange-800">Rp {payVal.toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="text-orange-800" style={{ fontSize: '11px', lineHeight: 1.3 }}>
                                                Sisa tagihan saat checkout: <strong>Rp {sisa.toLocaleString('id-ID')}</strong>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-2 border-round surface-50 border-1 surface-border">
                                            <div className="flex justify-content-between text-xs">
                                                <span className="text-600 flex align-items-center gap-1">
                                                    <i className="pi pi-clock text-400" /> Pembayaran Sewa
                                                </span>
                                                <span className="text-500 font-medium">Bayar di Checkout (Rp 0)</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Uang Jaminan (Deposit) jika ada */}
                                    {depVal > 0 && (
                                        <div className="p-2 border-round bg-blue-50 border-1 border-blue-200">
                                            <div className="flex justify-content-between text-xs">
                                                <span className="text-blue-900 font-semibold flex align-items-center gap-1">
                                                    <i className="pi pi-shield text-blue-600" /> Titipan Jaminan (Deposit)
                                                </span>
                                                <span className="font-bold text-blue-700">Rp {depVal.toLocaleString('id-ID')}</span>
                                            </div>
                                            <span className="text-blue-700 block mt-1" style={{ fontSize: '11px' }}>
                                                *Dikembalikan saat tamu check-out
                                            </span>
                                        </div>
                                    )}

                                    {/* Total Diterima Kasir */}
                                    {totalUangFisik > 0 && (
                                        <div className="p-2 border-round bg-primary-50 border-1 border-primary-200 flex justify-content-between align-items-center text-xs">
                                            <span className="text-primary-900 font-bold">Total Diterima Kasir:</span>
                                            <span className="text-primary font-bold text-sm">Rp {totalUangFisik.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Progress Checklist 4 Langkah */}
                    <div
                        className="mt-3 p-2 border-round"
                        style={{ background: 'var(--surface-ground)' }}
                    >
                        <div className="text-xs font-medium text-color-secondary mb-2">Progres Pengisian</div>
                        {[
                            { label: '1. Kamar & Tarif', done: hasRoom },
                            { label: '2. Fasilitas Tambahan', done: true },
                            { label: '3. Pembayaran & Deposit', done: hasPaymentSetup },
                            { label: '4. Data Tamu', done: hasGuest },
                        ].map((item, i) => (
                            <div key={i} className="flex align-items-center gap-2 mb-1">
                                <i
                                    className={`pi ${item.done ? 'pi-check-circle text-green-500' : 'pi-circle text-surface-400'}`}
                                    style={{ fontSize: 13 }}
                                />
                                <span className="text-xs" style={{ color: item.done ? 'var(--green-600)' : 'var(--text-color-secondary)' }}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* ACTION NAVIGATION HUB (Berada di Ringkasan Folio Sesuai Best Practice) */}
                    <div className="mt-3 pt-3 border-top-1 surface-border">
                        <div className="flex gap-2">
                            {state.activeStep > 0 && (
                                <Button
                                    type="button"
                                    label="Kembali"
                                    icon="pi pi-arrow-left"
                                    outlined
                                    severity="secondary"
                                    className="p-button-sm text-xs font-medium py-2 px-3"
                                    onClick={() => setState(p => ({ ...p, activeStep: Math.max(0, p.activeStep - 1) }))}
                                />
                            )}
                            {state.activeStep < 3 ? (
                                <Button
                                    type="button"
                                    label={
                                        state.activeStep === 0 ? "Lanjut ke Fasilitas ➔" :
                                            state.activeStep === 1 ? "Lanjut ke Pembayaran ➔" :
                                                "Lanjut ke Data Tamu ➔"
                                    }
                                    iconPos="right"
                                    severity="success"
                                    className="p-button-sm text-xs font-bold flex-1 shadow-2 py-2"
                                    onClick={handleNextStep}
                                />
                            ) : (
                                <Button
                                    type="button"
                                    label="Konfirmasi & Pembayaran"
                                    icon="pi pi-check-circle"
                                    iconPos="right"
                                    severity="success"
                                    className="p-button-sm text-xs font-bold flex-1 shadow-2 py-2"
                                    onClick={handleOpenConfirmModal}
                                />
                            )}
                        </div>

                        {/* Quick Shortcut Pop-Up jika kamar & tamu sudah siap */}
                        {hasRoom && hasGuest && state.activeStep < 3 && (
                            <Button
                                type="button"
                                label="⚡ Buka Pop-Up Konfirmasi Sekarang"
                                text
                                className="w-full text-xs font-semibold p-1 mt-2 text-center text-primary"
                                onClick={handleOpenConfirmModal}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Pop-up Konfirmasi & Pembayaran Walk-In */}
            <DialogKonfirmasiWalkin
                visible={showConfirmDialog}
                onHide={() => setShowConfirmDialog(false)}
                state={state}
                setState={setState}
                formik={formik}
                toast={toast}
            />
        </div>
    );
};

export default FormWalkIn;

