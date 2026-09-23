'use client';

import React, { useState } from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';
import postData from '@/lib/axios/postData';
import { apiSubmitBooking } from './endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import DialogInvoice from '@/app/components/dialogComponents/dialog_invoice';

interface StepConfirmationProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepConfirmation: React.FC<StepConfirmationProps> = ({ state, setState, formik, toast }) => {
    const router = useRouter();
    const [showInvoice, setShowInvoice] = useState(false);

    const submitBooking = async () => {
        const errors = await formik.validateForm();
        if (Object.keys(errors).length > 0) {
            formik.setTouched(
                Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
            );
            showError(toast, "Terdapat isian yang belum lengkap. Silakan periksa kembali tab yang bertanda peringatan.");
            return;
        }
        setState(p => ({ ...p, submitLoad: true }));
        try {
            const selectedRooms = formik.values.selected_rooms || [];
            const hasMultiRooms = selectedRooms.length > 0;
            const activeExtraFacilities = (formik.values.extra_facilities || []).filter(f => f.qty > 0 || f.subtotal > 0);
            const payload: any = {
                kode_cabang: formik.values.kode_cabang,
                kode_guest: formik.values.kode_guest,
                check_in_date: formatDateSystem(formik.values.check_in_date || new Date(), "yyyy-MM-dd"),
                check_out_date: formatDateSystem(formik.values.check_out_date || new Date(), "yyyy-MM-dd"),
                nights: formik.values.nights,
                deposit_amount: formik.values.deposit_amount,
                payment_method: formik.values.payment_method || null,
                kode_cashier_shift: formik.values.kode_cashier_shift || null,
                extra_facilities: activeExtraFacilities,
                special_request: formik.values.special_request || ""
            };

            if (hasMultiRooms) {
                payload.rooms = selectedRooms.map(r => ({
                    kode_tipe_kamar: r.kode_tipe_kamar,
                    kode_kamar: r.kode_kamar,
                    kode_rate_plan: r.kode_rate_plan
                }));
                payload.kode_tipe_kamar = selectedRooms[0].kode_tipe_kamar;
                payload.kode_rate_plan = selectedRooms[0].kode_rate_plan;
            } else {
                payload.kode_tipe_kamar = formik.values.kode_tipe_kamar;
                payload.kode_rate_plan = formik.values.kode_rate_plan;
            }

            const res = await postData(apiSubmitBooking, payload);

            if (res.data.status === '00') {
                setState(p => ({ ...p, submittedData: res.data.data }));
                showSuccess(toast, "Reservasi booking berhasil dibuat!");
            } else {
                showError(toast, res.data.message || "Gagal membuat reservasi");
            }
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Terjadi kesalahan saat memproses reservasi");
        } finally {
            setState(p => ({ ...p, submitLoad: false }));
        }
    };

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

    if (state.submittedData) {
        const sub = state.submittedData;
        const isSettled = sub.is_settled ?? ((sub.balance ?? 1) <= 0);
        const totalPaid = Number(sub.total_paid || 0);

        return (
            <div className="col-12 mt-4 text-center">
                <i className="pi pi-check-circle text-green-500" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3 font-bold text-900">Reservasi Booking Berhasil Dibuat!</h4>
                <p className="text-secondary text-sm">Data reservasi dan dokumen invoice resmi telah terbit di sistem.</p>
                
                {/* Status Badges: Reservasi & Pembayaran */}
                <div className="flex justify-content-center align-items-center gap-2 mb-4 flex-wrap">
                    <Tag 
                        severity={sub.status === 'confirmed' ? 'success' : 'info'} 
                        value={`STATUS RESERVASI: ${(sub.status || 'RESERVED').toUpperCase()}`}
                        icon={sub.status === 'confirmed' ? 'pi pi-check' : 'pi pi-calendar'}
                        className="text-xs px-3 py-1 font-bold"
                    />
                    <Tag 
                        severity={isSettled ? 'success' : totalPaid > 0 ? 'warning' : 'danger'} 
                        value={isSettled ? 'PEMBAYARAN: LUNAS' : totalPaid > 0 ? `DIBAYAR SEBAGIAN (DP Rp ${totalPaid.toLocaleString('id-ID')})` : 'PEMBAYARAN: BELUM DIBAYAR'}
                        icon={isSettled ? 'pi pi-check-circle' : 'pi pi-wallet'}
                        className="text-xs px-3 py-1 font-bold"
                    />
                </div>

                {/* Structured Financial & Booking Summary Card */}
                <div className="surface-card p-4 border-round-xl border-1 surface-border max-w-lg mx-auto text-left shadow-1 mb-4">
                    <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 surface-border">
                        <span className="text-xs text-500">Nomor Reservasi:</span>
                        <span className="font-bold text-primary text-base font-mono">{sub.kode_reservasi}</span>
                    </div>

                    {sub.invoice_number && (
                        <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 surface-border">
                            <span className="text-xs text-500">Nomor Invoice Resmi:</span>
                            <span className="font-bold text-900 text-sm font-mono">{sub.invoice_number}</span>
                        </div>
                    )}

                    <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 surface-border">
                        <span className="text-xs text-500">Tipe Booking:</span>
                        <span className="font-semibold text-700 uppercase text-xs">{sub.booking_type || (hasMultiRooms ? 'Group' : 'Individual')}</span>
                    </div>

                    <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 surface-border">
                        <span className="text-xs text-500">Kamar Dipesan:</span>
                        <span className="font-semibold text-900 text-xs">{sub.rooms?.length || selectedRooms.length || 1} Kamar</span>
                    </div>

                    <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 surface-border">
                        <span className="text-xs text-500">Total Tagihan Booking:</span>
                        <span className="font-bold text-900 text-sm">Rp {Number(sub.grand_total || totalTagihan).toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 surface-border">
                        <span className="text-xs text-500">Pembayaran Diterima (DP/Lunas):</span>
                        <span className="font-bold text-green-600 text-sm">Rp {totalPaid.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-content-between align-items-center pt-1">
                        <span className="text-xs font-bold text-700">Sisa Tagihan saat Check-In:</span>
                        <span className={`font-bold text-base ${isSettled ? 'text-green-700' : 'text-orange-600'}`}>
                            Rp {Number(sub.balance ?? sisaTagihan).toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-content-center align-items-center gap-2 flex-wrap">
                    <Button 
                        label={isSettled ? "Cetak Struk Thermal (Lunas)" : totalPaid > 0 ? "Cetak Bukti DP (Thermal)" : "Cetak Dokumen Reservasi"} 
                        icon="pi pi-print" 
                        severity="success"
                        className="font-bold shadow-2"
                        onClick={() => setShowInvoice(true)} 
                    />
                    <Button 
                        label="Dashboard Reservasi" 
                        icon="pi pi-th-large" 
                        outlined 
                        className="p-button-secondary font-semibold"
                        onClick={() => router.push('/reservasi_dashboard')} 
                    />
                    <Button 
                        label="Buat Booking Baru" 
                        icon="pi pi-plus" 
                        outlined 
                        className="p-button-success"
                        onClick={() => window.location.reload()} 
                    />
                </div>

                {/* Dialog Invoice Resmi */}
                <DialogInvoice
                    visible={showInvoice}
                    onHide={() => setShowInvoice(false)}
                    kode_folio={sub.kode_folio}
                    kode_reservation={sub.kode_reservasi}
                    autoPrint={isSettled}
                />
            </div>
        );
    }

    return (
        <div className="p-fluid">
            <h5>Ringkasan Reservasi Di Muka (Booking)</h5>
            <div className="grid">
                <div className="col-12 md:col-6">
                    <div className="p-3 border-1 surface-border border-round h-full">
                        <h6>Data Tamu</h6>
                        <p className="m-0 text-secondary">ID Tamu: <strong>{formik.values.kode_guest}</strong></p>
                        <p className="m-0 text-secondary">Nama: <strong>{formik.values.full_name || state.foundGuest?.full_name}</strong></p>
                        <p className="m-0 text-secondary">Phone: <strong>{formik.values.phone || state.foundGuest?.phone}</strong></p>
                    </div>
                </div>
                <div className="col-12 md:col-6">
                    <div className="p-3 border-1 surface-border border-round h-full">
                        <h6>Kamar & Waktu ({hasMultiRooms ? selectedRooms.length : 1} Kamar)</h6>
                        <p className="m-0 text-secondary">
                            Check In: <strong>{formik.values.check_in_date ? formatDateSystem(formik.values.check_in_date, 'dd-MM-yyyy') : '-'}</strong>
                        </p>
                        <p className="m-0 text-secondary">
                            Check Out: <strong>{formik.values.check_out_date ? formatDateSystem(formik.values.check_out_date, 'dd-MM-yyyy') : '-'}</strong>
                        </p>
                        <p className="m-0 text-secondary">Durasi: <strong>{formik.values.nights} Malam</strong></p>

                        <div className="mt-2 pt-2 border-top-1 surface-border">
                            <div className="text-xs font-semibold text-color-secondary mb-1">DAFTAR KAMAR DIPILIH:</div>
                            {hasMultiRooms ? (
                                <div className="flex flex-column gap-1">
                                    {selectedRooms.map((rm, idx) => (
                                        <div key={idx} className="flex justify-content-between text-sm py-1 border-bottom-1 surface-border">
                                            <div>
                                                <span className="font-bold text-primary mr-2">No. {rm.nomor_kamar}</span>
                                                <span className="text-color-secondary">({rm.nama_tipe} - {rm.nama_rate_plan})</span>
                                            </div>
                                            <span className="font-semibold">Rp {(rm.price_per_night * (rm.nights || formik.values.nights)).toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="m-0 text-secondary">Tipe: <strong>{state.rateInfo?.nama_tipe || '-'}</strong> ({state.rateInfo?.nama_rate_plan || '-'})</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Fasilitas Tambahan & Catatan Section */}
                {(activeExtraFacilities.length > 0 || formik.values.special_request) && (
                    <div className="col-12">
                        <div className="p-3 border-1 surface-border border-round">
                            <h6>Fasilitas Tambahan & Catatan</h6>
                            {activeExtraFacilities.length > 0 && (
                                <div className="flex flex-column gap-1 mb-2">
                                    {activeExtraFacilities.map((ef, idx) => (
                                        <div key={idx} className="flex justify-content-between text-sm py-1 border-bottom-1 surface-border">
                                            <span>{ef.nama} {ef.qty > 1 ? `(${ef.qty}x)` : ''}</span>
                                            <span className="font-semibold text-900">
                                                {ef.subtotal > 0 ? `Rp ${ef.subtotal.toLocaleString('id-ID')}` : 'Termasuk (Gratis)'}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-content-between text-sm font-bold pt-1">
                                        <span>Total Fasilitas Tambahan</span>
                                        <span className="text-blue-600">Rp {totalFasilitas.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            )}
                            {formik.values.special_request && (
                                <div className="mt-2 text-sm text-700 bg-gray-50 p-2 border-round">
                                    <strong>Catatan Khusus:</strong> &ldquo;{formik.values.special_request}&rdquo;
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Ringkasan Tagihan & Skema Pembayaran */}
                <div className="col-12">
                    <div className="p-3 border-1 surface-border border-round bg-blue-50">
                        <div className="flex align-items-center justify-content-between mb-2">
                            <h6 className="m-0 font-bold text-blue-900">Ringkasan Tagihan & Skema Pembayaran</h6>
                            <span className="text-xs text-blue-700">Estimasi Booking Folio</span>
                        </div>
                        <div className="flex justify-content-between mb-1 text-sm">
                            <span className="text-700">Sewa Kamar ({hasMultiRooms ? selectedRooms.length : 1} Kamar)</span>
                            <strong>Rp {totalKamar.toLocaleString('id-ID')}</strong>
                        </div>
                        {totalFasilitas > 0 && (
                            <div className="flex justify-content-between mb-1 text-sm">
                                <span className="text-700">Fasilitas & Layanan Tambahan</span>
                                <strong className="text-blue-600">+ Rp {totalFasilitas.toLocaleString('id-ID')}</strong>
                            </div>
                        )}
                        <div className="flex justify-content-between mb-1 pt-2 border-top-1 border-blue-200">
                            <span className="font-bold text-base text-900">Total Tagihan</span>
                            <strong className="text-primary text-xl">Rp {totalTagihan.toLocaleString('id-ID')}</strong>
                        </div>

                        {paymentAmount > 0 ? (
                            <div className="mt-3 pt-2 border-top-1 border-blue-200">
                                <div className="p-2 border-round surface-0 border-1 border-green-300">
                                    <div className="flex justify-content-between align-items-center">
                                        <div>
                                            <span className="font-semibold text-green-800 text-sm flex align-items-center gap-1">
                                                <i className="pi pi-check-circle text-green-600"></i> Pembayaran di Muka (DP / Lunas)
                                            </span>
                                            <span className="text-xs text-color-secondary block mt-1">
                                                Metode: <strong className="uppercase">{formik.values.payment_method || 'CASH'}</strong> • Sisa tagihan saat check-in: <strong>Rp {sisaTagihan.toLocaleString('id-ID')}</strong>
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <strong className="text-green-700 text-base">
                                                Rp {paymentAmount.toLocaleString('id-ID')}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 text-xs text-color-secondary">
                                <i className="pi pi-info-circle mr-1"></i> Tidak ada pembayaran di muka. Seluruh tagihan diselesaikan saat tamu check-in atau checkout.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="col-12 flex justify-content-between align-items-center flex-wrap gap-3 mt-4 pt-3 border-top-1 surface-border">
                <Button 
                    type="button" 
                    label="Kembali ke Pembayaran" 
                    icon="pi pi-arrow-left" 
                    outlined 
                    severity="secondary" 
                    className="p-button-sm font-medium px-3 py-2" 
                    onClick={() => setState(p => ({ ...p, activeStep: 3 }))} 
                />
                <Button 
                    label="Konfirmasi & Buat Booking" 
                    icon="pi pi-check" 
                    iconPos="right" 
                    severity="success" 
                    className="p-button-sm font-bold px-4 py-2" 
                    onClick={submitBooking} 
                    loading={state.submitLoad} 
                />
            </div>
        </div>
    );
};

export default StepConfirmation;
