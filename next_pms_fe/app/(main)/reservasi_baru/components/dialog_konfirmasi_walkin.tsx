'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { FormikProps } from 'formik';
import { useSession } from 'next-auth/react';
import { ReservasiBaruState, initValue } from './interfaces';
import postData from '@/lib/axios/postData';
import { apiWalkInSubmit } from './endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import DialogInvoice from '@/app/components/dialogComponents/dialog_invoice';
import PaymentMethodSelector from '@/app/components/payment/PaymentMethodSelector';
import CashierPicCard from '@/app/components/payment/CashierPicCard';
import { buildStandardReferenceNo } from '@/lib/tools/paymentTools';

interface DialogKonfirmasiWalkinProps {
    visible: boolean;
    onHide: () => void;
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const DialogKonfirmasiWalkin: React.FC<DialogKonfirmasiWalkinProps> = ({
    visible,
    onHide,
    state,
    setState,
    formik,
    toast
}) => {
    const { data: session } = useSession();
    const [showInvoice, setShowInvoice] = useState(false);
    const [activeShift, setActiveShift] = useState<any>(null);
    const [cashTendered, setCashTendered] = useState<number>(0);

    const selectedRooms = formik.values.selected_rooms || [];
    const hasMultiRooms = selectedRooms.length > 0;
    const activeExtraFacilities = (formik.values.extra_facilities || []).filter(f => f.qty > 0 || f.subtotal > 0);
    const totalFasilitas = activeExtraFacilities.reduce((sum, f) => sum + (f.subtotal || 0), 0);
    const totalKamar = hasMultiRooms
        ? selectedRooms.reduce((acc, r) => acc + (Number(r.price_per_night || 0) * (r.nights || formik.values.nights)), 0)
        : (Number(state.rateInfo?.price_per_night || 0)) * formik.values.nights;
    const totalTagihan = totalKamar + totalFasilitas;

    const paymentAmount = Number(formik.values.payment_amount || 0);
    const depositAmount = Number(formik.values.deposit_amount || 0);
    const sisaTagihan = Math.max(0, totalTagihan - paymentAmount);
    const totalUangDiterima = paymentAmount + depositAmount;

    const isLunas = paymentAmount >= totalTagihan && totalTagihan > 0;
    const isPartial = paymentAmount > 0 && paymentAmount < totalTagihan;

    const selectedRoom = state.rateInfo?.available_rooms?.find((r: any) => r.kode_kamar === formik.values.kode_kamar);
    const guestName = formik.values.full_name || state.foundGuest?.full_name || 'Tamu Belum Terdata';

    // Fetch shift kasir aktif saat modal dibuka
    const fetchActiveShift = async () => {
        try {
            const res = await postData('/kasir/shift-current', {});
            if (res?.data?.data) {
                const shiftData = res.data.data;
                setActiveShift(shiftData);
                if (shiftData.kode_cashier_shift) {
                    formik.setFieldValue('kode_cashier_shift', shiftData.kode_cashier_shift);
                }
            } else {
                setActiveShift(null);
            }
        } catch (err) {
            setActiveShift(null);
        }
    };

    useEffect(() => {
        if (visible) {
            if ((!formik.values.payment_amount || Number(formik.values.payment_amount) === 0) && totalTagihan > 0) {
                formik.setFieldValue('payment_amount', totalTagihan);
                setCashTendered(totalTagihan + Number(formik.values.deposit_amount || 0));
            } else {
                setCashTendered(totalUangDiterima > 0 ? totalUangDiterima : totalTagihan);
            }
            fetchActiveShift();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, totalTagihan]);

    const submitWalkIn = async () => {
        // Validasi kelengkapan form
        const errors = await formik.validateForm();
        if (Object.keys(errors).length > 0) {
            formik.setTouched(
                Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
            );
            showError(toast, "Terdapat isian yang belum lengkap. Silakan periksa kembali data kamar atau tamu.");
            return;
        }

        setState(p => ({ ...p, submitLoad: true }));
        try {
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
                payload.kode_tipe_kamar = selectedRooms[0].kode_tipe_kamar;
                payload.kode_kamar = selectedRooms[0].kode_kamar;
                payload.kode_rate_plan = selectedRooms[0].kode_rate_plan;
            }

            const res = await postData(apiWalkInSubmit, payload);
            showSuccess(toast, "Proses Walk-in dan Check-in berhasil!");
            setState(p => ({ ...p, submittedData: res.data.data }));
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Terjadi kesalahan saat memproses walk-in");
        } finally {
            setState(p => ({ ...p, submitLoad: false }));
        }
    };

    // Render jika sudah berhasil submit (Layar Sukses & Print Struk)
    if (state.submittedData) {
        const isSettled = state.submittedData.is_settled ?? ((state.submittedData.balance ?? 1) <= 0);
        const resPaid = Number(state.submittedData.total_paid || 0);
        const resDep = Number(state.submittedData.deposit_amount || 0);
        const resCollected = Number(state.submittedData.total_collected ?? (resPaid + resDep));

        return (
            <Dialog
                header={
                    <div className="flex align-items-center gap-2 text-green-700">
                        <i className="pi pi-check-circle text-2xl"></i>
                        <span className="font-bold text-lg">Walk-In &amp; Check-In Berhasil!</span>
                    </div>
                }
                visible={visible}
                onHide={onHide}
                style={{ width: '92vw', maxWidth: '580px' }}
                modal
                closable={false}
            >
                <div className="text-center py-3">
                    <div className="surface-100 border-circle w-4rem h-4rem flex align-items-center justify-content-center mx-auto mb-3">
                        <i className="pi pi-check text-green-600 text-3xl font-bold"></i>
                    </div>
                    <h3 className="text-900 font-bold mb-1 text-xl">Tamu Telah Berhasil Check-In!</h3>
                    <p className="text-600 text-sm mb-4">
                        Kamar telah dialokasikan dan transaksi folio hotel telah tercatat secara otomatis.
                    </p>

                    <div className="surface-card p-3 border-round-xl border-1 surface-border text-left mb-4 text-sm flex flex-column gap-2 shadow-1">
                        <div className="flex justify-content-between py-1 border-bottom-1 surface-border">
                            <span className="text-600">Kode Reservasi:</span>
                            <span className="text-primary font-bold">{state.submittedData.kode_reservasi}</span>
                        </div>
                        {state.submittedData.invoice_number && (
                            <div className="flex justify-content-between py-1 border-bottom-1 surface-border">
                                <span className="text-600">No. Invoice:</span>
                                <span className="text-primary font-bold font-mono">{state.submittedData.invoice_number}</span>
                            </div>
                        )}
                        <div className="flex justify-content-between py-1 border-bottom-1 surface-border">
                            <span className="text-600">Kode Folio:</span>
                            <span className="font-semibold text-900">{state.submittedData.kode_folio}</span>
                        </div>
                        <div className="flex justify-content-between py-1 border-bottom-1 surface-border">
                            <span className="text-600">Total Tagihan Sewa:</span>
                            <span className="font-bold text-900">Rp {Number(state.submittedData.grand_total || totalTagihan).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-content-between py-1 border-bottom-1 surface-border">
                            <span className="text-green-700 font-semibold">Pembayaran Sewa:</span>
                            <span className="font-bold text-green-700">Rp {resPaid.toLocaleString('id-ID')}</span>
                        </div>
                        {resDep > 0 && (
                            <div className="flex justify-content-between py-1 border-bottom-1 surface-border">
                                <span className="text-blue-700 font-semibold">Uang Jaminan (Refundable):</span>
                                <span className="font-bold text-blue-700">Rp {resDep.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-content-between pt-2">
                            <span className="font-bold text-900">Total Uang Diterima Kasir:</span>
                            <span className="font-bold text-primary text-base">Rp {resCollected.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="flex justify-content-center gap-2 flex-wrap">
                        <Button
                            label={isSettled ? "Cetak Struk Thermal (Lunas)" : "Cetak Struk Nota (Thermal)"}
                            icon="pi pi-print"
                            severity="success"
                            className="font-bold shadow-2 px-4 py-2"
                            onClick={() => setShowInvoice(true)}
                        />
                        <Button
                            label="Buat Reservasi Baru"
                            icon="pi pi-plus"
                            outlined
                            severity="secondary"
                            className="px-4 py-2"
                            onClick={() => {
                                onHide();
                                window.location.reload();
                            }}
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
            </Dialog>
        );
    }

    return (
        <Dialog
            header={
                <div className="flex align-items-center justify-content-between w-full pr-3">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-check-circle text-primary text-xl"></i>
                        <span className="font-bold text-lg text-900">Konfirmasi &amp; Pembayaran Walk-In</span>
                    </div>
                    <Tag severity="info" value="Front Office • Kasir Walk-In" className="text-xs font-semibold" />
                </div>
            }
            visible={visible}
            onHide={onHide}
            style={{ width: '95vw', maxWidth: '1020px' }}
            modal
            className="p-fluid"
            footer={
                <div className="flex justify-content-between align-items-center gap-2 pt-2 border-top-1 surface-border">
                    <Button
                        type="button"
                        label="Periksa Kembali"
                        icon="pi pi-arrow-left"
                        outlined
                        severity="secondary"
                        className="text-xs px-3 py-2 font-medium"
                        onClick={onHide}
                        disabled={state.submitLoad}
                    />
                    <div className="flex align-items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <span className="text-xs text-500 block">Total Diterima Kasir:</span>
                            <span className="font-bold text-primary text-lg">
                                Rp {totalUangDiterima.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <Button
                            type="button"
                            label="Proses Walk-in &amp; Check-in Sekarang"
                            icon="pi pi-check-circle"
                            iconPos="right"
                            severity="success"
                            className="font-bold px-4 py-2 shadow-2"
                            onClick={submitWalkIn}
                            loading={state.submitLoad}
                        />
                    </div>
                </div>
            }
        >
            <div className="py-2">
                <div className="grid">
                    {/* ════════════ KOLOM KIRI: DATA RESERVASI & FOLIO ════════════ */}
                    <div className="col-12 lg:col-6 flex flex-column gap-3">
                        {/* 1. Kartu Tamu & Kamar */}
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1">
                            <span className="text-xs font-bold text-color-secondary uppercase tracking-wider block mb-2.5 flex align-items-center gap-1.5">
                                <i className="pi pi-user text-primary text-sm"></i>
                                Data Tamu &amp; Kamar Menginap
                            </span>
                            
                            <div className="bg-surface-50 p-2.5 border-round-lg mb-2.5">
                                <div className="text-sm font-bold text-900">{guestName}</div>
                                <div className="text-xs text-600 mt-1.5 flex flex-wrap gap-2">
                                    <span>
                                        <i className="pi pi-phone mr-1 text-xs text-400"></i>
                                        {formik.values.phone || state.foundGuest?.phone || '-'}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        <i className="pi pi-id-card mr-1 text-xs text-400"></i>
                                        {formik.values.id_type?.toUpperCase() || 'KTP'}: {formik.values.id_number || state.foundGuest?.id_number || '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="text-xs text-700 flex flex-column gap-2.5">
                                <div className="flex justify-content-between align-items-center py-0.5">
                                    <span className="text-500">Kamar Terpilih:</span>
                                    <span className="font-bold text-primary bg-primary-50 px-2 py-0.5 border-round">
                                        {hasMultiRooms
                                            ? selectedRooms.map(r => `No.${r.nomor_kamar}`).join(', ')
                                            : (selectedRoom ? `No.${selectedRoom.nomor_kamar}` : formik.values.kode_kamar || '-')}
                                    </span>
                                </div>
                                <div className="flex justify-content-between align-items-center py-0.5">
                                    <span className="text-500">Durasi Inap:</span>
                                    <strong>{formik.values.nights} Malam ({hasMultiRooms ? selectedRooms.length : 1} Kamar)</strong>
                                </div>
                                <div className="flex justify-content-between align-items-center py-0.5">
                                    <span className="text-500">Check In - Out:</span>
                                    <span>
                                        {formik.values.check_in_date ? formatDateSystem(formik.values.check_in_date, 'dd/MM/yyyy') : '-'} s/d {formik.values.check_out_date ? formatDateSystem(formik.values.check_out_date, 'dd/MM/yyyy') : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Rincian Folio & Billing */}
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1">
                            <div className="flex justify-content-between align-items-center mb-2.5">
                                <span className="font-bold text-xs text-color-secondary uppercase tracking-wider flex align-items-center gap-1.5">
                                    <i className="pi pi-receipt text-primary text-sm"></i>
                                    Rincian Folio Tagihan
                                </span>
                                <Tag
                                    severity={isLunas ? "success" : isPartial ? "warning" : "info"}
                                    value={isLunas ? "SEWA: LUNAS" : isPartial ? `SISA: Rp ${sisaTagihan.toLocaleString('id-ID')}` : "BAYAR SAAT CHECKOUT"}
                                    className="text-xs font-bold"
                                />
                            </div>

                            <div className="text-xs flex flex-column gap-1">
                                <div className="flex justify-content-between py-1.5 border-bottom-1 surface-border">
                                    <span className="text-600">Sewa Kamar ({formik.values.nights} Malam):</span>
                                    <span className="font-semibold text-900">Rp {totalKamar.toLocaleString('id-ID')}</span>
                                </div>
                                {totalFasilitas > 0 && (
                                    <div className="flex justify-content-between py-1.5 border-bottom-1 surface-border">
                                        <span className="text-600">Layanan &amp; Fasilitas Tambahan:</span>
                                        <span className="font-semibold text-purple-600">+ Rp {totalFasilitas.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="flex justify-content-between py-1.5 text-xs font-bold text-900 bg-surface-50 p-2 border-round-lg my-1">
                                    <span>Total Tagihan Sewa:</span>
                                    <span className="text-primary text-sm font-bold">Rp {totalTagihan.toLocaleString('id-ID')}</span>
                                </div>

                                <div className="flex justify-content-between py-1.5 border-bottom-1 surface-border">
                                    <span className="text-green-700 font-semibold flex align-items-center gap-1">
                                        <i className="pi pi-check text-xs"></i> 1. Pembayaran Sewa Kamar:
                                    </span>
                                    <strong className="text-green-700">Rp {paymentAmount.toLocaleString('id-ID')}</strong>
                                </div>
                                <div className="flex justify-content-between py-1.5 border-bottom-1 surface-border">
                                    <span className="text-blue-700 font-semibold flex align-items-center gap-1">
                                        <i className="pi pi-shield text-xs"></i> 2. Uang Jaminan (Deposit Refundable):
                                    </span>
                                    <strong className="text-blue-700">Rp {depositAmount.toLocaleString('id-ID')}</strong>
                                </div>
                                <div className="flex justify-content-between py-1.5">
                                    <span className="text-500">Sisa Tagihan Pelunasan Checkout:</span>
                                    <strong className={sisaTagihan === 0 ? "text-green-700" : "text-red-600"}>
                                        Rp {sisaTagihan.toLocaleString('id-ID')}
                                    </strong>
                                </div>
                            </div>

                            {/* Banner Besar Total Uang Fisik Yang Diserahkan Tamu */}
                            <div className="mt-2.5 p-2.5 border-round-xl bg-primary-50 border-1 border-primary-200 flex justify-content-between align-items-center">
                                <div>
                                    <span className="text-xs text-primary-900 font-bold block uppercase mb-0.5">
                                        Total Uang Fisik Diterima Kasir:
                                    </span>
                                    <small className="text-500 text-xs block">(Pembayaran Sewa + Titipan Deposit)</small>
                                </div>
                                <div className="text-right">
                                    <span className="text-primary text-xl font-bold font-mono">
                                        Rp {totalUangDiterima.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ════════════ KOLOM KANAN: KASIR & PEMBAYARAN ════════════ */}
                    <div className="col-12 lg:col-6 flex flex-column gap-3">
                        {/* 1. Kartu PIC Kasir (Gantikan Dropdown Lama) */}
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

                        {/* 2. Selektor Metode Pembayaran */}
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1">
                            <span className="text-xs font-bold text-color-secondary uppercase tracking-wider block mb-2 flex align-items-center gap-1.5">
                                <i className="pi pi-credit-card text-primary text-sm"></i>
                                Metode Penyelesaian Pembayaran
                            </span>

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
                                totalAmount={totalUangDiterima > 0 ? totalUangDiterima : totalTagihan}
                                cashTendered={cashTendered}
                                onCashTenderedChange={setCashTendered}
                                compact={false}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default DialogKonfirmasiWalkin;
