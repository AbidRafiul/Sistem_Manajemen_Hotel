import React, { useState, useEffect } from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputNumber } from 'primereact/inputnumber';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { apiWalkInSubmit } from './endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import DialogInvoice from '@/app/components/dialogComponents/dialog_invoice';
import PaymentMethodSelector from '@/app/components/payment/PaymentMethodSelector';
import CashierPicCard from '@/app/components/payment/CashierPicCard';
import { buildStandardReferenceNo } from '@/lib/tools/paymentTools';

interface StepConfirmationProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepConfirmation: React.FC<StepConfirmationProps> = ({ state, setState, formik, toast }) => {
    const { data: session } = useSession();
    const [showInvoice, setShowInvoice] = useState(false);
    const [activeShift, setActiveShift] = useState<any>(null);

    useEffect(() => {
        const fetchShift = async () => {
            try {
                const res = await postData('/api/v1/kasir/shift-current', {});
                if (res?.data?.data) {
                    setActiveShift(res.data.data);
                    if (!formik.values.kode_cashier_shift) {
                        formik.setFieldValue('kode_cashier_shift', res.data.data.kode_cashier_shift);
                    }
                }
            } catch (err) {}
        };
        fetchShift();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                check_out_date: formik.values.check_out_date ? formatDateSystem(formik.values.check_out_date, 'yyyy-MM-dd') : null,
                reference_no: buildStandardReferenceNo(
                    formik.values.payment_method || 'cash',
                    formik.values.reference_no,
                    formik.values.bank_name,
                    formik.values.card_type
                )
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
        const totalPaid = Number(state.submittedData.total_paid || 0);
        const depAmount = Number(state.submittedData.deposit_amount || 0);
        const totalUangDiterima = Number(state.submittedData.total_collected ?? (totalPaid + depAmount));

        return (
            <div className="text-center p-5">
                <i className={`pi ${isSettled ? 'pi-check-circle text-green-500' : 'pi-info-circle text-blue-500'}`} style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">
                    Check-in Walk-in Berhasil Diproses
                </h4>
                <div className="mb-3">
                    <Tag 
                        severity={isSettled ? "success" : "warning"} 
                        value={isSettled ? "STATUS SEWA: LUNAS" : `SISA TAGIHAN SEWA: Rp ${Number(state.submittedData.balance || 0).toLocaleString('id-ID')}`} 
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
                    <p className="mb-1"><strong>Grand Total Sewa:</strong> Rp {Number(state.submittedData.grand_total || totalTagihan).toLocaleString('id-ID')}</p>
                    <p className="mb-1"><strong>Pembayaran Sewa:</strong> <span className="text-green-700 font-bold">Rp {totalPaid.toLocaleString('id-ID')}</span></p>
                    {depAmount > 0 && (
                        <p className="mb-1"><strong>Uang Jaminan (Deposit Refundable):</strong> <span className="text-blue-700 font-bold">Rp {depAmount.toLocaleString('id-ID')}</span></p>
                    )}
                    <div className="mt-2 pt-2 border-top-1 surface-border flex justify-content-between">
                        <strong>Total Uang Diterima Kasir:</strong>
                        <strong className="text-primary">Rp {totalUangDiterima.toLocaleString('id-ID')}</strong>
                    </div>
                </div>

                <div className="flex justify-content-center gap-2 mt-4 flex-wrap">
                    <Button 
                        label={isSettled ? "Cetak Struk Thermal (Lunas)" : "Cetak Struk Nota (Thermal)"} 
                        icon="pi pi-print" 
                        severity="success"
                        className="font-bold shadow-2" 
                        onClick={() => setShowInvoice(true)} 
                    />
                    <Button 
                        label="Buat Reservasi Baru" 
                        icon="pi pi-plus" 
                        outlined
                        severity="secondary"
                        onClick={() => window.location.reload()} 
                    />
                </div>

                <DialogInvoice
                    visible={showInvoice}
                    onHide={() => setShowInvoice(false)}
                    kode_folio={state.submittedData.kode_folio}
                    kode_reservation={state.submittedData.kode_reservasi}
                    autoPrint={isSettled}
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
                        <p className="m-0 text-secondary">ID Tamu: <strong>{formik.values.kode_guest || '-'}</strong></p>
                        <p className="m-0 text-secondary">Nama: <strong>{formik.values.full_name || state.foundGuest?.full_name || '-'}</strong></p>
                        <p className="m-0 text-secondary">Phone: <strong>{formik.values.phone || state.foundGuest?.phone || '-'}</strong></p>
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

                {/* Rincian Keuangan */}
                <div className="col-12">
                    <div className="p-3 border-1 surface-border border-round bg-blue-50">
                        <div className="flex align-items-center justify-content-between mb-2">
                            <h6 className="m-0 font-bold text-blue-900">Ringkasan Keuangan Folio</h6>
                            <span className="text-xs text-blue-700">Folio Transaksi</span>
                        </div>
                        <div className="flex justify-content-between mb-1 text-sm">
                            <span className="text-700">Sewa Kamar ({hasMultiRooms ? selectedRooms.length : 1} Kamar)</span>
                            <strong>Rp {totalKamar.toLocaleString('id-ID')}</strong>
                        </div>
                        {totalFasilitas > 0 && (
                            <div className="flex justify-content-between mb-1 text-sm">
                                <span className="text-700">Fasilitas & Layanan Tambahan</span>
                                <strong className="text-purple-600">+ Rp {totalFasilitas.toLocaleString('id-ID')}</strong>
                            </div>
                        )}
                        <div className="flex justify-content-between mb-1 pt-2 border-top-1 border-blue-200">
                            <span className="font-bold text-base text-900">Total Tagihan Sewa Walk-In</span>
                            <strong className="text-primary text-xl">Rp {totalTagihan.toLocaleString('id-ID')}</strong>
                        </div>

                        {/* Status Pembayaran Sewa & Uang Jaminan */}
                        {(() => {
                            const paymentAmount = Number(formik.values.payment_amount || 0);
                            const depositAmount = Number(formik.values.deposit_amount || 0);
                            const sisaTagihan = Math.max(0, totalTagihan - paymentAmount);
                            const isLunas = paymentAmount >= totalTagihan && totalTagihan > 0;
                            const isPartial = paymentAmount > 0 && paymentAmount < totalTagihan;
                            const totalUangMasuk = paymentAmount + depositAmount;

                            return (
                                <div className="mt-3 pt-2 border-top-1 border-blue-200 flex flex-column gap-2">
                                    <div className="grid">
                                        <div className="col-12 sm:col-6">
                                            <div className="p-3 border-round surface-0 border-1 border-blue-200 h-full">
                                                <span className="text-xs text-color-secondary block mb-1">1. Pembayaran Sewa Kamar:</span>
                                                <div className="flex justify-content-between align-items-center">
                                                    <strong className={`text-base ${isLunas ? 'text-green-700' : isPartial ? 'text-orange-700' : 'text-700'}`}>
                                                        Rp {paymentAmount.toLocaleString('id-ID')}
                                                    </strong>
                                                    <Tag 
                                                        severity={isLunas ? "success" : isPartial ? "warning" : "info"} 
                                                        value={isLunas ? "LUNAS" : isPartial ? `SISA: Rp ${sisaTagihan.toLocaleString('id-ID')}` : "BAYAR DI CHECKOUT"} 
                                                        className="text-xs font-bold" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 sm:col-6">
                                            <div className="p-3 border-round surface-0 border-1 border-blue-200 h-full">
                                                <span className="text-xs text-color-secondary block mb-1">2. Uang Jaminan (Deposit):</span>
                                                <div className="flex justify-content-between align-items-center">
                                                    <strong className="text-base text-blue-700">
                                                        Rp {depositAmount.toLocaleString('id-ID')}
                                                    </strong>
                                                    <Tag severity="info" value={depositAmount > 0 ? "REFUNDABLE" : "TANPA DEPOSIT"} className="text-xs font-bold" />
                                                </div>
                                                <small className="text-500 block mt-1" style={{ fontSize: '11px' }}>
                                                    *Titipan jaminan, dikembalikan saat checkout
                                                </small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Diterima Kasir Banner */}
                                    <div className="p-2 border-round bg-primary-50 border-1 border-primary-200 flex justify-content-between align-items-center flex-wrap gap-2 text-xs">
                                        <span className="text-primary-900 font-bold flex align-items-center gap-1">
                                            <i className="pi pi-money-bill text-primary"></i>
                                            Total Uang Fisik Diterima Kasir:
                                        </span>
                                        <strong className="text-primary text-base">
                                            Rp {totalUangMasuk.toLocaleString('id-ID')}
                                        </strong>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Metode Pembayaran & Kasir Section */}
                <div className="col-12">
                    <div className="p-3 border-1 surface-border border-round surface-card">
                        {(() => {
                            const paymentAmount = Number(formik.values.payment_amount || 0);
                            const depositAmount = Number(formik.values.deposit_amount || 0);
                            const isLunas = paymentAmount >= totalTagihan && totalTagihan > 0;
                            const isPartial = paymentAmount > 0 && paymentAmount < totalTagihan;
                            const totalUangMasuk = paymentAmount + depositAmount;

                            return (
                                <>
                                    <div className="flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                                        <div>
                                            <h6 className="m-0 font-bold text-900 flex align-items-center gap-2">
                                                <i className="pi pi-credit-card text-primary"></i>
                                                Penyelesaian Pembayaran & Shift Kasir
                                            </h6>
                                            <p className="text-xs text-color-secondary m-0 mt-1">
                                                Pastikan rincian sewa kamar dan deposit uang jaminan sudah sesuai sebelum proses walk-in.
                                            </p>
                                        </div>
                                        <Tag 
                                            severity={isLunas ? "success" : isPartial ? "warning" : "info"} 
                                            value={isLunas ? "SEWA LUNAS" : isPartial ? `Sewa Dibayar: Rp ${paymentAmount.toLocaleString('id-ID')}` : "Sewa Bayar di Checkout"} 
                                            icon={isLunas ? "pi pi-check-circle" : isPartial ? "pi pi-shield" : "pi pi-clock"}
                                            className="text-xs font-bold"
                                        />
                                    </div>

                                    {/* 2 Kolom Pengaturan: Pembayaran Sewa vs Uang Jaminan */}
                                    <div className="grid mb-3">
                                        {/* Kolom 1: Pembayaran Sewa Kamar */}
                                        <div className="col-12 md:col-6">
                                            <div className="p-3 border-round-lg surface-50 border-1 surface-border h-full">
                                                <div className="flex justify-content-between align-items-center mb-1">
                                                    <label className="text-xs font-bold text-900 uppercase tracking-wider m-0">
                                                        1. Pembayaran Sewa Kamar (Rp):
                                                    </label>
                                                    <span className="text-xs text-green-700 font-semibold">Mengurangi Tagihan</span>
                                                </div>
                                                <div className="flex gap-1 mb-2">
                                                    <Button
                                                        type="button"
                                                        label="Lunas 100%"
                                                        size="small"
                                                        severity={isLunas ? 'success' : 'secondary'}
                                                        outlined={!isLunas}
                                                        className="text-xs py-1 px-2 font-bold"
                                                        onClick={() => {
                                                            formik.setFieldValue('payment_amount', totalTagihan);
                                                            if (!formik.values.payment_method) formik.setFieldValue('payment_method', 'cash');
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        label="DP 50%"
                                                        size="small"
                                                        severity="warning"
                                                        outlined={paymentAmount !== Math.round(totalTagihan * 0.5)}
                                                        className="text-xs py-1 px-2 font-semibold"
                                                        onClick={() => {
                                                            formik.setFieldValue('payment_amount', Math.round(totalTagihan * 0.5));
                                                            if (!formik.values.payment_method) formik.setFieldValue('payment_method', 'cash');
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        label="Rp 0"
                                                        size="small"
                                                        severity="secondary"
                                                        outlined={paymentAmount !== 0}
                                                        className="text-xs py-1 px-2"
                                                        onClick={() => formik.setFieldValue('payment_amount', 0)}
                                                    />
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

                                        {/* Kolom 2: Uang Jaminan (Deposit) */}
                                        <div className="col-12 md:col-6">
                                            <div className="p-3 border-round-lg surface-50 border-1 surface-border h-full">
                                                <div className="flex justify-content-between align-items-center mb-1">
                                                    <label className="text-xs font-bold text-900 uppercase tracking-wider m-0">
                                                        2. Uang Jaminan / Deposit (Rp):
                                                    </label>
                                                    <span className="text-xs text-blue-700 font-semibold">Refundable</span>
                                                </div>
                                                <div className="flex gap-1 mb-2">
                                                    <Button
                                                        type="button"
                                                        label="Tanpa Deposit"
                                                        size="small"
                                                        severity="secondary"
                                                        outlined={depositAmount !== 0}
                                                        className="text-xs py-1 px-2"
                                                        onClick={() => formik.setFieldValue('deposit_amount', 0)}
                                                    />
                                                    <Button
                                                        type="button"
                                                        label="100k"
                                                        size="small"
                                                        severity="info"
                                                        outlined={depositAmount !== 100000}
                                                        className="text-xs py-1 px-2 font-semibold"
                                                        onClick={() => {
                                                            formik.setFieldValue('deposit_amount', 100000);
                                                            if (!formik.values.payment_method) formik.setFieldValue('payment_method', 'cash');
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        label="200k"
                                                        size="small"
                                                        severity="info"
                                                        outlined={depositAmount !== 200000}
                                                        className="text-xs py-1 px-2 font-semibold"
                                                        onClick={() => {
                                                            formik.setFieldValue('deposit_amount', 200000);
                                                            if (!formik.values.payment_method) formik.setFieldValue('payment_method', 'cash');
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        label="500k"
                                                        size="small"
                                                        severity="info"
                                                        outlined={depositAmount !== 500000}
                                                        className="text-xs py-1 px-2 font-semibold"
                                                        onClick={() => {
                                                            formik.setFieldValue('deposit_amount', 500000);
                                                            if (!formik.values.payment_method) formik.setFieldValue('payment_method', 'cash');
                                                        }}
                                                    />
                                                </div>
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
                                            </div>
                                        </div>
                                    </div>

                                    {/* PIC Kasir Front Desk & Selektor Metode Pembayaran */}
                                    <div className="grid mt-2">
                                        <div className="col-12 lg:col-5">
                                            <CashierPicCard
                                                sessionUser={session?.user}
                                                activeShift={activeShift}
                                                kodeCabang={formik.values.kode_cabang}
                                                onShiftUpdated={(s) => {
                                                    setActiveShift(s);
                                                    if (s?.kode_cashier_shift) {
                                                        formik.setFieldValue('kode_cashier_shift', s.kode_cashier_shift);
                                                    }
                                                }}
                                                toast={toast}
                                            />
                                        </div>
                                        <div className="col-12 lg:col-7">
                                            <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1">
                                                <PaymentMethodSelector
                                                    value={{
                                                        method: (formik.values.payment_method as any) || 'cash',
                                                        bank_name: formik.values.bank_name,
                                                        card_type: formik.values.card_type,
                                                        reference_no: formik.values.reference_no
                                                    }}
                                                    onChange={(detail) => {
                                                        formik.setFieldValue('payment_method', detail.method);
                                                        formik.setFieldValue('bank_name', detail.bank_name || '');
                                                        formik.setFieldValue('card_type', detail.card_type || 'debit');
                                                        formik.setFieldValue('reference_no', detail.reference_no || '');
                                                    }}
                                                    totalAmount={totalUangMasuk}
                                                    compact={true}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <div className="col-12 flex justify-content-between align-items-center flex-wrap gap-3 mt-4 pt-3 border-top-1 surface-border">
                <Button 
                    type="button" 
                    label="Kembali ke Data Tamu" 
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
