'use client';
import React from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import StepGuest from './step_guest';
import StepAvailability from './step_availability';
import StepPayment from './step_payment';
import StepConfirmation from './step_confirmation';
import { Button } from 'primereact/button';

import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface FormBookingProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const FormBooking: React.FC<FormBookingProps> = ({ state, setState, formik, toast }) => {
    const hasGuest = !!(formik.values.kode_guest || (state.foundGuest && !state.isGuestNew));
    const hasRoom = !!(formik.values.kode_tipe_kamar && formik.values.kode_rate_plan);
    const hasPaymentSetup = formik.values.deposit_amount === 0 || !!(formik.values.deposit_amount > 0 && formik.values.payment_method);

    const totalTagihan = (state.rateInfo?.price_per_night || 0) * formik.values.nights;
    const guestName = state.foundGuest?.full_name || formik.values.full_name || null;

    const hasTabErrors = (tabIndex: number): boolean => {
        if (!formik || formik.submitCount === 0) return false;
        if (!formik?.errors) return false;
        const errorFields = Object.keys(formik.errors);
        return errorFields.some((field) => getTabForField(field) === tabIndex);
    };

    const getTabForField = (fieldName: string): number => {
        if (['kode_cabang', 'keyword_guest', 'full_name', 'id_number', 'phone'].includes(fieldName)) return 0;
        if (['check_in_date', 'check_out_date', 'kode_tipe_kamar', 'kode_rate_plan'].includes(fieldName)) return 1;
        if (['payment_method', 'kode_cashier_shift'].includes(fieldName)) return 2;
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
                                Booking Reservasi
                            </h3>
                            <p className="text-gray-500">
                                Isi form di bawah ini untuk membuat reservasi tamu (booking).
                            </p>
                        </div>
                    </div>

                    <div className="py-2">
                        <TabView className="browser-style-tabs" activeIndex={state.activeStep} onTabChange={(e) => setState((p) => ({ ...p, activeStep: e.index }))}>
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
                                        <span>Kamar & Tarif</span>
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
                                    <div className={`flex align-items-center gap-2 ${hasTabErrors(2) ? 'text-red-500' : ''}`}>
                                        <i className="pi pi-wallet"></i>
                                        <span>Deposit (Opsional)</span>
                                        {hasTabErrors(2) && <i className="pi pi-exclamation-circle text-red-500 animation-duration-300 fadein" style={{ fontSize: '0.95rem' }}></i>}
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
                            <div className="font-bold text-base">Ringkasan Booking</div>
                            <div className="text-xs text-color-secondary">Reservasi Di Muka</div>
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
                        <div className="text-xs text-color-secondary font-medium uppercase mb-2 flex align-items-center gap-1">
                            <i className="pi pi-home" style={{ fontSize: 10 }} /> Kamar
                        </div>
                        {state.rateInfo ? (
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
                        <div className="flex justify-content-between text-sm mb-2">
                            <span className="text-color-secondary">
                                {state.rateInfo ? `${formik.values.nights}x Rp ${(state.rateInfo.price_per_night || 0).toLocaleString('id-ID')}` : 'Tagihan Kamar'}
                            </span>
                            <span className="font-medium">Rp {totalTagihan.toLocaleString('id-ID')}</span>
                        </div>
                        {formik.values.deposit_amount > 0 && (
                            <div className="flex justify-content-between text-sm mb-2">
                                <span className="text-color-secondary">Deposit Awal</span>
                                <span className="font-medium text-green-600">- Rp {formik.values.deposit_amount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div
                            className="flex justify-content-between mt-2 pt-2"
                            style={{ borderTop: '2px solid var(--primary-color)' }}
                        >
                            <span className="font-bold">{formik.values.deposit_amount > 0 ? 'Sisa Tagihan' : 'Total Tagihan'}</span>
                            <span className="font-bold text-primary text-lg">
                                Rp {Math.max(0, totalTagihan - (formik.values.deposit_amount || 0)).toLocaleString('id-ID')}
                            </span>
                        </div>
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

export default FormBooking;
