'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import postData from '@/lib/axios/postData';
import { apiCancelSubmit } from './endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import PaymentMethodSelector from '@/app/components/payment/PaymentMethodSelector';
import CashierPicCard from '@/app/components/payment/CashierPicCard';

interface DialogCancelRefundProps {
    visible: boolean;
    onHide: () => void;
    reservation: any;
    toast: React.RefObject<Toast>;
    onSuccess: () => void;
    shiftAktif: any;
    sessionUser: any;
    kodeCabang: string;
    onShiftUpdated?: (shift: any) => void;
}

const CANCELLATION_REASONS = [
    { label: 'Permintaan Tamu (Guest Request)', value: 'Permintaan Tamu' },
    { label: 'Perubahan Jadwal / Rencana', value: 'Perubahan Jadwal' },
    { label: 'Tamu Sakit / Keadaan Darurat', value: 'Tamu Sakit / Darurat' },
    { label: 'Force Majeure (Bencana / Cuaca Buruk)', value: 'Force Majeure' },
    { label: 'Kesalahan Pemesanan (Double Booking)', value: 'Kesalahan Pemesanan' },
    { label: 'Lainnya', value: 'Lainnya' }
];

export const DialogCancelRefund: React.FC<DialogCancelRefundProps> = ({
    visible,
    onHide,
    reservation,
    toast,
    onSuccess,
    shiftAktif,
    sessionUser,
    kodeCabang,
    onShiftUpdated
}) => {
    const [reason, setReason] = useState<string>('Permintaan Tamu');
    const [notes, setNotes] = useState<string>('');
    const [refundType, setRefundType] = useState<'refund_deposit' | 'non_refundable'>('refund_deposit');
    const [penaltyAmount, setPenaltyAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'qris'>('cash');
    const [bankName, setBankName] = useState<string>('BCA');
    const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
    const [referenceNo, setReferenceNo] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    const depositAmount = parseFloat(reservation?.deposit_amount || 0);
    const hasDeposit = depositAmount > 0;
    const refundAmount = Math.max(0, depositAmount - penaltyAmount);

    useEffect(() => {
        if (visible && reservation) {
            setReason('Permintaan Tamu');
            setNotes('');
            setPenaltyAmount(0);
            setRefundType(depositAmount > 0 ? 'refund_deposit' : 'non_refundable');
            setPaymentMethod('cash');
            setBankName('BCA');
            setCardType('debit');
            setReferenceNo('');
        }
    }, [visible, reservation, depositAmount]);

    const handleConfirmCancel = async () => {
        if (!reservation) return;

        if (!reason) {
            showError(toast, 'Harap pilih alasan pembatalan');
            return;
        }

        // Jika ada refund uang tunai, pastikan kasir shift aktif
        if (hasDeposit && refundType === 'refund_deposit' && refundAmount > 0) {
            if (paymentMethod === 'cash' && !shiftAktif?.kode_cashier_shift) {
                showError(toast, 'Shift kasir aktif belum dibuka. Buka shift kasir terlebih dahulu untuk mencatat pengeluaran refund tunai.');
                return;
            }
        }

        setSubmitting(true);
        try {
            const payload: any = {
                kode_reservasi: reservation.kode_reservasi,
                cancellation_reason: reason,
                notes: notes.trim(),
                refund_type: hasDeposit ? refundType : 'non_refundable',
                penalty_amount: hasDeposit && refundType === 'refund_deposit' ? penaltyAmount : 0,
                payment_method: hasDeposit && refundType === 'refund_deposit' && refundAmount > 0 ? paymentMethod : null,
                bank_name: hasDeposit && refundType === 'refund_deposit' && refundAmount > 0 ? bankName : null,
                reference_no: hasDeposit && refundType === 'refund_deposit' && refundAmount > 0 ? referenceNo : null,
                kode_cashier_shift: shiftAktif?.kode_cashier_shift || null
            };

            const res = await postData(apiCancelSubmit, payload);

            if (res.data?.status === '00') {
                showSuccess(toast, res.data.message || 'Reservasi berhasil dibatalkan');
                onSuccess();
                onHide();
            } else {
                showError(toast, res.data?.message || 'Gagal membatalkan reservasi');
            }
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || 'Terjadi kesalahan sistem saat memproses pembatalan');
        } finally {
            setSubmitting(false);
        }
    };

    if (!reservation) return null;

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-exclamation-triangle text-xl text-red-600 font-bold"></i>
                    <span className="font-bold text-lg text-900">Batalkan Reservasi & Kebijakan Refund</span>
                </div>
            }
            visible={visible}
            style={{ width: '640px', maxWidth: '95vw' }}
            breakpoints={{ '960px': '85vw', '641px': '95vw' }}
            onHide={onHide}
            modal
            footer={
                <div className="flex justify-content-end align-items-center gap-2 pt-2">
                    <Button
                        label="Kembali"
                        icon="pi pi-times"
                        onClick={onHide}
                        className="p-button-text p-button-secondary"
                        disabled={submitting}
                    />
                    <Button
                        label="Konfirmasi Pembatalan"
                        icon="pi pi-check"
                        onClick={handleConfirmCancel}
                        loading={submitting}
                        severity="danger"
                        className="font-semibold"
                    />
                </div>
            }
        >
            <div className="p-fluid">
                {/* Info Card Tamu & Reservasi */}
                <div className="p-3 border-round bg-red-50 border-1 border-red-200 mb-3">
                    <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                        <div>
                            <span className="font-bold text-900 block text-base">{reservation.guest_name}</span>
                            <span className="text-xs text-600">
                                No. Reservasi: <strong>{reservation.kode_reservasi}</strong> • Kamar: {reservation.tipe_kamar_name}
                            </span>
                        </div>
                        <Tag severity="danger" value="BATALKAN RESERVASI" className="text-xs px-2 py-1" />
                    </div>
                    <div className="text-xs text-700 flex flex-wrap gap-3 pt-1 border-top-1 surface-border">
                        <span>Check-In: <strong>{reservation.check_in_date ? reservation.check_in_date.substring(0, 10) : '-'}</strong></span>
                        <span>Check-Out: <strong>{reservation.check_out_date ? reservation.check_out_date.substring(0, 10) : '-'}</strong></span>
                        <span>Durasi: <strong>{reservation.nights || 1} Malam</strong></span>
                    </div>
                </div>

                {/* Status Deposit Awal */}
                {hasDeposit ? (
                    <div className="p-3 border-round bg-green-50 border-1 border-green-300 mb-3">
                        <div className="flex justify-content-between align-items-center">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-wallet text-green-700 text-xl font-bold"></i>
                                <div>
                                    <span className="font-bold text-green-900 block text-sm">Deposit Tercatat di Reservasi:</span>
                                    <span className="text-xs text-green-700">Tamu telah menyetor dana jaminan/DP saat booking.</span>
                                </div>
                            </div>
                            <span className="font-bold text-lg text-green-800">
                                Rp {depositAmount.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="p-2 border-round surface-100 border-1 surface-border mb-3 flex align-items-center gap-2 text-xs text-600">
                        <i className="pi pi-info-circle text-blue-500 text-lg"></i>
                        <span>Reservasi ini tidak memiliki uang deposit awal (Rp 0). Pembatalan tidak melibatkan pengembalian dana.</span>
                    </div>
                )}

                {/* Form Alasan Pembatalan */}
                <div className="field mb-3">
                    <label className="font-semibold text-sm mb-1 block text-700">Alasan Pembatalan <span className="text-red-500">*</span></label>
                    <Dropdown
                        value={reason}
                        options={CANCELLATION_REASONS}
                        onChange={(e) => setReason(e.value)}
                        placeholder="Pilih Alasan Pembatalan"
                        className="w-full text-sm"
                    />
                </div>

                <div className="field mb-3">
                    <label className="font-semibold text-sm mb-1 block text-700">Catatan / Detail Alasan (Opsional)</label>
                    <InputTextarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Masukkan catatan pendukung pembatalan..."
                        className="w-full text-sm"
                    />
                </div>

                {/* Kebijakan Refund (Hanya jika ada deposit) */}
                {hasDeposit && (
                    <div className="mb-3">
                        <label className="font-semibold text-sm mb-2 block text-900">
                            Pilih Skema Pengembalian Dana (Refund Policy) <span className="text-red-500">*</span>
                        </label>
                        <div className="grid">
                            {/* Opsi 1: Refund Uang Deposit */}
                            <div className="col-12 sm:col-6">
                                <div
                                    className={`p-3 border-round border-2 cursor-pointer transition-all h-full ${refundType === 'refund_deposit'
                                        ? 'border-green-600 bg-green-50 shadow-1'
                                        : 'border-200 surface-50 hover:surface-100'
                                        }`}
                                    onClick={() => setRefundType('refund_deposit')}
                                >
                                    <div className="flex align-items-center gap-2 mb-1">
                                        <i className={`pi pi-check-circle text-lg ${refundType === 'refund_deposit' ? 'text-green-700' : 'text-400'}`}></i>
                                        <span className="font-bold text-sm text-900">Kembalikan Dana</span>
                                    </div>
                                    <p className="text-xs text-600 m-0">
                                        Uang deposit dikembalikan ke tamu (bisa dipotong biaya denda/admin).
                                    </p>
                                </div>
                            </div>

                            {/* Opsi 2: Non-Refundable / Deposit Hangus */}
                            <div className="col-12 sm:col-6">
                                <div
                                    className={`p-3 border-round border-2 cursor-pointer transition-all h-full ${refundType === 'non_refundable'
                                        ? 'border-red-600 bg-red-50 shadow-1'
                                        : 'border-200 surface-50 hover:surface-100'
                                        }`}
                                    onClick={() => setRefundType('non_refundable')}
                                >
                                    <div className="flex align-items-center gap-2 mb-1">
                                        <i className={`pi pi-times-circle text-lg ${refundType === 'non_refundable' ? 'text-red-700' : 'text-400'}`}></i>
                                        <span className="font-bold text-sm text-900">Non-Refundable (Hangus)</span>
                                    </div>
                                    <p className="text-xs text-600 m-0">
                                        Deposit tidak dikembalikan sama sekali dan dibukukan sebagai denda hotel.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rincian Finansial Berdasarkan Pilihan Refund */}
                        {refundType === 'refund_deposit' ? (
                            <div className="p-3 border-round surface-50 border-1 surface-border mt-3 animation-duration-200 fadein">
                                <div className="grid align-items-center mb-2">
                                    <div className="col-12 sm:col-6 field mb-0">
                                        <label className="font-semibold text-xs text-700 block mb-1">Potongan Biaya Denda / Admin (Rp)</label>
                                        <InputNumber
                                            value={penaltyAmount}
                                            onValueChange={(e) => setPenaltyAmount(Math.min(depositAmount, Math.max(0, e.value ?? 0)))}
                                            mode="currency"
                                            currency="IDR"
                                            locale="id-ID"
                                            min={0}
                                            max={depositAmount}
                                            placeholder="Rp 0"
                                            className="w-full text-sm"
                                        />
                                        <small className="text-500 block mt-1">Kosongkan (Rp 0) untuk Full Refund 100%.</small>
                                    </div>
                                    <div className="col-12 sm:col-6">
                                        <div className="p-2 border-round bg-blue-50 border-1 border-blue-200 text-center">
                                            <span className="text-xs text-blue-700 block font-semibold">Total Dana Dikembalikan ke Tamu:</span>
                                            <span className="text-xl font-bold text-blue-900">
                                                Rp {refundAmount.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {refundAmount > 0 && (
                                    <>
                                        <div className="mb-3 pt-2 border-top-1 surface-border">
                                            <PaymentMethodSelector
                                                value={{
                                                    method: paymentMethod,
                                                    bank_name: bankName,
                                                    card_type: cardType,
                                                    reference_no: referenceNo
                                                }}
                                                onChange={(detail) => {
                                                    setPaymentMethod(detail.method as any);
                                                    if (detail.bank_name) setBankName(detail.bank_name);
                                                    if (detail.card_type) setCardType(detail.card_type);
                                                    setReferenceNo(detail.reference_no || '');
                                                }}
                                                totalAmount={refundAmount}
                                                compact={true}
                                            />
                                        </div>

                                        {/* Integrasi Kasir Shift yang bertugas */}
                                        <div className="mb-1">
                                            <CashierPicCard
                                                sessionUser={sessionUser}
                                                activeShift={shiftAktif}
                                                kodeCabang={kodeCabang}
                                                onShiftUpdated={onShiftUpdated}
                                                toast={toast}
                                                compact={true}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="p-3 border-round bg-orange-50 border-1 border-orange-300 mt-3 animation-duration-200 fadein">
                                <div className="flex align-items-start gap-2">
                                    <i className="pi pi-exclamation-circle text-orange-700 text-lg mt-1"></i>
                                    <div className="text-xs text-orange-900">
                                        <span className="font-bold block mb-1">Ketentuan Non-Refundable:</span>
                                        Dana deposit sebesar <strong>Rp {depositAmount.toLocaleString('id-ID')}</strong> akan disita dan dialihkan sebagai tagihan <em>Cancellation Fee</em> pada folio hotel. Kasir tidak mengeluarkan uang kas fisik.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default DialogCancelRefund;
