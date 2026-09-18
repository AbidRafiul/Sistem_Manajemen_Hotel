'use client';
import React from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import StepGuest from './step_guest';
import StepAvailability from './step_availability';
import StepExtraFacilities from './step_extra_facilities';
import StepPayment from './step_payment';
import StepConfirmation from './step_confirmation';
import { Button } from 'primereact/button';

import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface FormWalkInProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const FormWalkIn: React.FC<FormWalkInProps> = ({ state, setState, formik, toast }) => {
    const selectedRooms = formik.values.selected_rooms || [];
    const hasGuest = !!(formik.values.kode_guest || (state.foundGuest && !state.isGuestNew));
    const hasRoom = selectedRooms.length > 0 || !!(formik.values.kode_tipe_kamar && formik.values.kode_rate_plan && formik.values.kode_kamar);
    const hasPaymentSetup = formik.values.deposit_amount === 0 || !!(formik.values.deposit_amount > 0 && formik.values.payment_method);

    const activeExtraFacilities = (formik.values.extra_facilities || []).filter(f => f.qty > 0 || f.subtotal > 0);
    const totalFasilitas = activeExtraFacilities.reduce((sum, f) => sum + (f.subtotal || 0), 0);
    const totalKamar = selectedRooms.length > 0
        ? selectedRooms.reduce((sum, r) => sum + (r.total_price || 0), 0)
        : (state.rateInfo?.price_per_night || 0) * formik.values.nights;
    const totalTagihan = totalKamar + totalFasilitas;
    const guestName = state.foundGuest?.full_name || formik.values.full_name || null;

    const hasTabErrors = (tabIndex: number): boolean => {
        if (!formik || formik.submitCount === 0) return false;
        if (!formik?.errors) return false;
        const errorFields = Object.keys(formik.errors);
        return errorFields.some((field) => getTabForField(field) === tabIndex);
    };

    const getTabForField = (fieldName: string): number => {
        if (['kode_cabang', 'keyword_guest', 'full_name', 'id_number', 'phone'].includes(fieldName)) return 0;
        if (['check_in_date', 'check_out_date', 'kode_tipe_kamar', 'kode_rate_plan', 'kode_kamar'].includes(fieldName)) return 1;
        if (['payment_method', 'kode_cashier_shift'].includes(fieldName)) return 3;
        return 0;
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
                                Isi form di bawah ini untuk membuat reservasi tamu walk-in.
                            </p>
                        </div>
                    </div>

                    <div className="py-2">
                        <TabView className="browser-style-tabs" scrollable activeIndex={state.activeStep} onTabChange={(e) => setState((p) => ({ ...p, activeStep: e.index }))}>
                            <TabPanel
                                header={
                                    <div className={`flex align-items-center gap-2 ${hasTabErrors(0) ? 'text-red-500' : ''}`}>
                                        <i className="pi pi-user"></i>
                                        <span>Data Tamu</span>
                                        {hasTabErrors(0) && <i className="pi pi-exclamation-circle text-red-500 animation-duration-300 fadein" style={{ fontSize: '0.95rem' }}></i>}
                                    </div>
                                }
                            >
                                <div className="pt-4 animation-duration-300 fadein">
                                    <StepGuest state={state} setState={setState} formik={formik} toast={toast} />
                                </div>
                            </TabPanel>
                            
                            <TabPanel
                                header={
                                    <div className={`flex align-items-center gap-2 ${hasTabErrors(1) ? 'text-red-500' : ''}`}>
                                        <i className="pi pi-home"></i>
                                        <span>Kamar & Tarif {selectedRooms.length > 0 ? `(${selectedRooms.length})` : ''}</span>
                                        {hasTabErrors(1) && <i className="pi pi-exclamation-circle text-red-500 animation-duration-300 fadein" style={{ fontSize: '0.95rem' }}></i>}
                                    </div>
                                }
                            >
                                <div className="pt-4 animation-duration-300 fadein">
                                    <StepAvailability state={state} setState={setState} formik={formik} toast={toast} />
                                </div>
                            </TabPanel>

                            <TabPanel
                                header={
                                    <div className={`flex align-items-center gap-2`}>
                                        <i className="pi pi-sparkles"></i>
                                        <span>Fasilitas Tambahan {activeExtraFacilities.length > 0 ? `(${activeExtraFacilities.length})` : ''}</span>
                                    </div>
                                }
                            >
                                <div className="pt-4 animation-duration-300 fadein">
                                    <StepExtraFacilities state={state} setState={setState} formik={formik} toast={toast} />
                                </div>
                            </TabPanel>

                            <TabPanel
                                header={
                                    <div className={`flex align-items-center gap-2 ${hasTabErrors(3) ? 'text-red-500' : ''}`}>
                                        <i className="pi pi-wallet"></i>
                                        <span>Pembayaran & Tagihan</span>
                                        {hasTabErrors(3) && <i className="pi pi-exclamation-circle text-red-500 animation-duration-300 fadein" style={{ fontSize: '0.95rem' }}></i>}
                                    </div>
                                }
                            >
                                <div className="pt-4 animation-duration-300 fadein">
                                    <StepPayment state={state} setState={setState} formik={formik} toast={toast} />
                                </div>
                            </TabPanel>

                            <TabPanel
                                header={
                                    <div className={`flex align-items-center gap-2`}>
                                        <i className="pi pi-check-circle"></i>
                                        <span>Konfirmasi</span>
                                    </div>
                                }
                            >
                                <div className="pt-4 animation-duration-300 fadein">
                                    <StepConfirmation state={state} setState={setState} formik={formik} toast={toast} />
                                </div>
                            </TabPanel>
                        </TabView>
                    </div>
                </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="col-12 lg:col-4 mt-4 lg:mt-0">
                <div
                    className="card shadow-2 p-4"
                    style={{ position: 'sticky', top: '1.5rem' }}
                >
                    {/* Header */}
                    <div className="flex align-items-center gap-2 mb-3">
                        <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <i className="pi pi-receipt" style={{ color: '#fff', fontSize: 16 }} />
                        </div>
                        <div>
                            <div className="font-bold text-base">Ringkasan Walk-in</div>
                            <div className="text-xs text-color-secondary">Reservasi Langsung</div>
                        </div>
                    </div>

                    <Divider className="my-2" />

                    {/* Guest Info */}
                    <div className="mb-3">
                        <div className="text-xs text-color-secondary font-medium uppercase mb-2 flex align-items-center gap-1">
                            <i className="pi pi-user" style={{ fontSize: 10 }} /> Data Tamu
                        </div>
                        {guestName ? (
                            <div>
                                <div className="font-bold text-sm">{guestName}</div>
                                {(formik.values.phone || state.foundGuest?.phone) && (
                                    <div className="text-xs text-color-secondary mt-1">
                                        <i className="pi pi-phone mr-1" style={{ fontSize: 10 }} />
                                        {formik.values.phone || state.foundGuest?.phone}
                                    </div>
                                )}
                                {state.foundGuest?.is_blacklisted === 1 && (
                                    <Tag severity="danger" value="BLACKLIST" className="mt-1" />
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-color-secondary flex align-items-center gap-1">
                                <i className="pi pi-exclamation-triangle text-orange-400" style={{ fontSize: 11 }} />
                                Belum dipilih
                            </div>
                        )}
                    </div>

                    <Divider className="my-2" />

                    {/* Room Info */}
                    <div className="mb-3">
                        <div className="text-xs text-color-secondary font-medium uppercase mb-2 flex align-items-center justify-content-between">
                            <span className="flex align-items-center gap-1">
                                <i className="pi pi-home" style={{ fontSize: 10 }} /> Kamar Terpilih
                            </span>
                            {selectedRooms.length > 0 && (
                                <span className="text-xs text-primary font-bold">{selectedRooms.length} Kamar</span>
                            )}
                        </div>
                        {selectedRooms.length > 0 ? (
                            <div className="flex flex-column gap-2">
                                {selectedRooms.map((rm, idx) => (
                                    <div key={idx} className="p-2 border-round surface-50 text-xs border-1 surface-border">
                                        <div className="font-bold text-900 flex justify-content-between">
                                            <span>Kamar {rm.nomor_kamar}</span>
                                            <span className="text-primary font-bold">Rp {rm.total_price.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="text-secondary mt-1 flex justify-content-between">
                                            <span>{rm.nama_tipe}</span>
                                            <span>{rm.nama_rate_plan}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : state.rateInfo ? (
                            <div>
                                <div className="font-bold text-sm">{state.rateInfo.nama_tipe}</div>
                                <div className="text-xs text-color-secondary mt-1">{state.rateInfo.nama_rate_plan}</div>
                            </div>
                        ) : (
                            <div className="text-sm text-color-secondary flex align-items-center gap-1">
                                <i className="pi pi-exclamation-triangle text-orange-400" style={{ fontSize: 11 }} />
                                Belum dipilih
                            </div>
                        )}
                    </div>

                    {/* Extra Facilities Info */}
                    {activeExtraFacilities.length > 0 && (
                        <>
                            <Divider className="my-2" />
                            <div className="mb-3">
                                <div className="text-xs text-color-secondary font-medium uppercase mb-2 flex align-items-center justify-content-between">
                                    <span className="flex align-items-center gap-1">
                                        <i className="pi pi-sparkles" style={{ fontSize: 10 }} /> Fasilitas Tambahan
                                    </span>
                                    <span className="text-xs text-blue-600 font-bold">{activeExtraFacilities.length} Item</span>
                                </div>
                                <div className="flex flex-column gap-1">
                                    {activeExtraFacilities.map((fac, idx) => (
                                        <div key={idx} className="flex justify-content-between text-xs py-1">
                                            <span className="text-700">
                                                {fac.nama} {fac.qty > 1 ? `(${fac.qty}x)` : ''}
                                            </span>
                                            <span className="font-semibold text-900">
                                                {fac.subtotal > 0 ? `Rp ${fac.subtotal.toLocaleString('id-ID')}` : 'Termasuk (Gratis)'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Special Request Note */}
                    {formik.values.special_request && (
                        <>
                            <Divider className="my-2" />
                            <div className="mb-3">
                                <div className="text-xs text-color-secondary font-medium uppercase mb-1 flex align-items-center gap-1">
                                    <i className="pi pi-comment" style={{ fontSize: 10 }} /> Catatan Khusus
                                </div>
                                <div className="text-xs text-700 surface-50 p-2 border-round border-1 surface-border font-italic">
                                    &ldquo;{formik.values.special_request}&rdquo;
                                </div>
                            </div>
                        </>
                    )}

                    {/* Date Info */}
                    {formik.values.check_in_date && (
                        <>
                            <Divider className="my-2" />
                            <div className="mb-3">
                                <div className="text-xs text-color-secondary font-medium uppercase mb-2 flex align-items-center gap-1">
                                    <i className="pi pi-calendar" style={{ fontSize: 10 }} /> Tanggal Menginap
                                </div>
                                <div className="flex justify-content-between text-sm">
                                    <span className="text-color-secondary">Check-in</span>
                                    <span className="font-medium">{formatDateSystem(formik.values.check_in_date, 'dd MMM yyyy')}</span>
                                </div>
                                {formik.values.check_out_date && (
                                    <div className="flex justify-content-between text-sm mt-1">
                                        <span className="text-color-secondary">Check-out</span>
                                        <span className="font-medium">{formatDateSystem(formik.values.check_out_date, 'dd MMM yyyy')}</span>
                                    </div>
                                )}
                                <div className="flex justify-content-between text-sm mt-1">
                                    <span className="text-color-secondary">Durasi</span>
                                    <span className="font-bold">{formik.values.nights} malam</span>
                                </div>
                            </div>
                        </>
                    )}

                    <Divider className="my-2" />

                    {/* Billing Summary */}
                    <div>
                        <div className="text-xs text-color-secondary font-medium uppercase mb-2 flex align-items-center gap-1">
                            <i className="pi pi-credit-card" style={{ fontSize: 10 }} /> Ringkasan Estimasi Tagihan
                        </div>
                        <div className="flex justify-content-between text-sm mb-1">
                            <span className="text-color-secondary">Sewa Kamar</span>
                            <span className="font-medium">Rp {totalKamar.toLocaleString('id-ID')}</span>
                        </div>
                        {totalFasilitas > 0 && (
                            <div className="flex justify-content-between text-sm mb-1">
                                <span className="text-color-secondary">Fasilitas Tambahan</span>
                                <span className="font-medium text-blue-600">+ Rp {totalFasilitas.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div
                            className="flex justify-content-between mt-2 pt-2"
                            style={{ borderTop: '2px solid var(--primary-color)' }}
                        >
                            <span className="font-bold">Total Tagihan</span>
                            <span className="font-bold text-primary text-lg">
                                Rp {totalTagihan.toLocaleString('id-ID')}
                            </span>
                        </div>

                        {/* Deposit / Uang Jaminan (Terpisah dari total tagihan) */}
                        {formik.values.deposit_amount > 0 && (
                            <div className="mt-3 p-2 border-round surface-50 border-1 border-green-300">
                                <div className="flex justify-content-between text-xs mb-1">
                                    <span className="font-semibold text-green-800 flex align-items-center gap-1">
                                        <i className="pi pi-shield text-green-600" /> Uang Jaminan (Deposit)
                                    </span>
                                    <span className="font-bold text-green-700">Rp {formik.values.deposit_amount.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="text-color-secondary" style={{ fontSize: '11px', lineHeight: 1.3 }}>
                                    Deposit dipegang kasir sebagai jaminan dan tidak mengurangi total tagihan (dapat di-refund saat checkout).
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Checklist */}
                    <div
                        className="mt-3 p-2 border-round"
                        style={{ background: 'var(--surface-ground)' }}
                    >
                        <div className="text-xs font-medium text-color-secondary mb-2">Progres Pengisian</div>
                        {[
                            { label: 'Data Tamu', done: hasGuest },
                            { label: 'Pilih Kamar', done: hasRoom },
                            { label: 'Info Deposit', done: hasPaymentSetup },
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
                </div>
            </div>
        </div>
    );
};

export default FormWalkIn;
