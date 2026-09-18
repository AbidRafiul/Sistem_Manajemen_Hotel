import React, { useState } from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import postData from '@/lib/axios/postData';
import { apiWalkInSubmit } from './endpoints';
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
    const [showInvoice, setShowInvoice] = useState(false);

    const submitWalkIn = async () => {
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
            const payload: any = {
                ...formik.values,
                check_in_date: formik.values.check_in_date ? formatDateSystem(formik.values.check_in_date, 'yyyy-MM-dd') : null,
                check_out_date: formik.values.check_out_date ? formatDateSystem(formik.values.check_out_date, 'yyyy-MM-dd') : null
            };

            if (hasMultiRooms) {
                payload.rooms = selectedRooms.map(r => ({
                    kode_tipe_kamar: r.kode_tipe_kamar,
                    kode_kamar: r.kode_kamar,
                    kode_rate_plan: r.kode_rate_plan
                }));
                // Set primary room fields for backward compatibility
                payload.kode_tipe_kamar = selectedRooms[0].kode_tipe_kamar;
                payload.kode_kamar = selectedRooms[0].kode_kamar;
                payload.kode_rate_plan = selectedRooms[0].kode_rate_plan;
            }

            const res = await postData(apiWalkInSubmit, payload);
            showSuccess(toast, "Proses Walk-in berhasil!");
            setState(p => ({ ...p, submittedData: res.data.data }));
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Terjadi kesalahan saat memproses walk-in");
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

    const selectedRoom = state.rateInfo?.available_rooms?.find((r: any) => r.kode_kamar === formik.values.kode_kamar);

    if (state.submittedData) {
        const isSettled = state.submittedData.is_settled ?? ((state.submittedData.balance ?? 1) <= 0);

        return (
            <div className="text-center p-5">
                <i className={`pi ${isSettled ? 'pi-check-circle text-green-500' : 'pi-info-circle text-blue-500'}`} style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">
                    Check-in Walk-in Berhasil Diproses
                </h4>
                <div className="mb-3">
                    <Tag 
                        severity={isSettled ? "success" : "warning"} 
                        value={isSettled ? "PEMBAYARAN: LUNAS" : `SISA TAGIHAN: Rp ${Number(state.submittedData.balance || 0).toLocaleString('id-ID')}`} 
                        className="text-sm px-3 py-1 font-bold"
                    />
                </div>

                <div className="surface-100 p-4 border-round max-w-md mx-auto text-left shadow-1">
                    <p className="mb-2"><strong>Kode Reservasi:</strong> <span className="text-primary font-bold">{state.submittedData.kode_reservasi}</span></p>
                    {state.submittedData.invoice_number && (
                        <p className="mb-2"><strong>Nomor Invoice:</strong> <span className="text-primary font-bold font-mono">{state.submittedData.invoice_number}</span></p>
                    )}
                    {state.submittedData.rooms && state.submittedData.rooms.length > 0 ? (
                        <div className="mb-2">
                            <strong>Kamar Menginap ({state.submittedData.rooms.length} Kamar):</strong>
                            <ul className="pl-3 mt-1 mb-0">
                                {state.submittedData.rooms.map((rm: any, idx: number) => (
                                    <li key={idx} className="text-sm">
                                        Kamar {rm.kode_kamar}: <code>{rm.kode_checkin || rm.kode_reservasi_room}</code>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    <p className="mb-2"><strong>Kode Folio:</strong> {state.submittedData.kode_folio}</p>
                    <p className="mb-1"><strong>Grand Total:</strong> Rp {Number(state.submittedData.grand_total || totalTagihan).toLocaleString('id-ID')}</p>
                    <p className="mb-0"><strong>Sudah Dibayar:</strong> Rp {Number(state.submittedData.total_paid || 0).toLocaleString('id-ID')}</p>
                </div>

                <div className="flex justify-content-center gap-2 mt-4 flex-wrap">
                    <Button 
                        label="Lihat & Cetak Invoice" 
                        icon="pi pi-print" 
                        className="p-button-outlined p-button-success" 
                        onClick={() => setShowInvoice(true)} 
                    />
                    <Button 
                        label="Buat Reservasi Baru" 
                        icon="pi pi-plus" 
                        onClick={() => window.location.reload()} 
                    />
                </div>

                <DialogInvoice
                    visible={showInvoice}
                    onHide={() => setShowInvoice(false)}
                    kode_folio={state.submittedData.kode_folio}
                    kode_reservation={state.submittedData.kode_reservasi}
                />
            </div>
        );
    }

    return (
        <div className="p-fluid">
            <h5>Ringkasan Reservasi Walk-In</h5>
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
                                <p className="m-0 text-secondary">Kamar: <strong>{selectedRoom?.nomor_kamar || formik.values.kode_kamar}</strong></p>
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

                <div className="col-12">
                    <div className="p-3 border-1 surface-border border-round bg-blue-50">
                        <div className="flex align-items-center justify-content-between mb-2">
                            <h6 className="m-0 font-bold text-blue-900">Ringkasan Keuangan</h6>
                            <span className="text-xs text-blue-700">Folio Transaksi</span>
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

                        {formik.values.deposit_amount > 0 ? (
                            <div className="mt-3 pt-2 border-top-1 border-blue-200">
                                <div className="p-2 border-round surface-0 border-1 border-green-300">
                                    <div className="flex justify-content-between align-items-center">
                                        <div>
                                            <span className="font-semibold text-green-800 text-sm flex align-items-center gap-1">
                                                <i className="pi pi-shield text-green-600"></i> Uang Jaminan (Deposit Diterima)
                                            </span>
                                            <span className="text-xs text-color-secondary block mt-1">
                                                Metode: <strong className="uppercase">{formik.values.payment_method || 'CASH'}</strong> • Disimpan di kasir sebagai jaminan (tidak memotong total tagihan)
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <strong className="text-green-700 text-base">
                                                Rp {formik.values.deposit_amount.toLocaleString('id-ID')}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 text-xs text-color-secondary">
                                <i className="pi pi-info-circle mr-1"></i> Tidak ada pembayaran deposit awal. Seluruh tagihan diselesaikan saat check-in/check-out.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="col-12 flex justify-content-between align-items-center flex-wrap gap-3 mt-4 pt-3 border-top-1 surface-border">
                <Button 
                    type="button" 
                    label="Kembali ke Deposit" 
                    icon="pi pi-arrow-left" 
                    outlined 
                    severity="secondary" 
                    className="p-button-sm font-medium px-3 py-2" 
                    onClick={() => setState(p => ({ ...p, activeStep: 3 }))} 
                />
                <Button 
                    label="Proses Walk-in & Check-in" 
                    icon="pi pi-check" 
                    iconPos="right" 
                    severity="success" 
                    className="p-button-sm font-bold px-4 py-2" 
                    onClick={submitWalkIn} 
                    loading={state.submitLoad} 
                />
            </div>
        </div>
    );
};

export default StepConfirmation;
