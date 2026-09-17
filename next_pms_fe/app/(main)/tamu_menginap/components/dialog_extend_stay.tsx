'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import postData from '@/lib/axios/postData';
import { apiExtendCheck, apiExtendSubmit, apiShiftCurrent } from './endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface DialogExtendStayProps {
    visible: boolean;
    onHide: () => void;
    onSuccess: () => void;
    roomData: any;
    toast: any;
}

export const DialogExtendStay: React.FC<DialogExtendStayProps> = ({
    visible,
    onHide,
    onSuccess,
    roomData,
    toast
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [checking, setChecking] = useState(false);
    
    const [newCheckoutDate, setNewCheckoutDate] = useState<Date | null>(null);
    const [simData, setSimData] = useState<any>(null);
    const [minDate, setMinDate] = useState<Date>(new Date());
    
    // Payment State
    const [isPaidNow, setIsPaidNow] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [referenceNo, setReferenceNo] = useState('');
    const [shiftAktif, setShiftAktif] = useState<any>(null);

    const loadShift = async () => {
        try {
            const res = await postData(apiShiftCurrent, {});
            if (res?.data?.data) {
                setShiftAktif(res.data.data);
            }
        } catch (e) {
            console.error("Gagal memuat shift", e);
        }
    };

    useEffect(() => {
        if (visible && roomData?.check_out_date) {
            loadShift();
            const currentCheckout = new Date(roomData.check_out_date);
            // Default extend +1 night
            const nextDay = new Date(currentCheckout);
            nextDay.setDate(nextDay.getDate() + 1);
            
            setMinDate(nextDay);
            setNewCheckoutDate(nextDay);
            setIsPaidNow(false);
            setPaymentMethod('cash');
            setReferenceNo('');
            
            checkAvailabilityAndRate(nextDay);
        } else {
            setSimData(null);
            setNewCheckoutDate(null);
        }
    }, [visible, roomData]);

    const checkAvailabilityAndRate = async (date: Date) => {
        if (!roomData?.kode_reservasi_room || !date) return;
        setChecking(true);
        try {
            const res = await postData(apiExtendCheck, {
                kode_reservasi_room: roomData.kode_reservasi_room,
                new_check_out_date: formatDateSystem(date, 'yyyy-MM-dd')
            });

            if (res?.data?.data) {
                setSimData(res.data.data);
            }
        } catch (error: any) {
            setSimData(null);
            showError(toast, error?.response?.data?.message || 'Gagal mengecek perpanjangan kamar');
        } finally {
            setChecking(false);
        }
    };

    const handleDateChange = (e: any) => {
        const val = e.value;
        setNewCheckoutDate(val);
        if (val) {
            checkAvailabilityAndRate(val);
        }
    };

    const handleSubmit = async () => {
        if (!roomData?.kode_reservasi_room || !newCheckoutDate) return;
        if (!simData?.can_extend_same_room) {
            showError(toast, 'Kamar tidak dapat diperpanjang di kamar yang sama karena bentrok dengan reservasi lain.');
            return;
        }
        if (isPaidNow && paymentMethod === 'cash' && !shiftAktif) {
            showError(toast, 'Shift kasir belum dibuka. Buka shift kasir terlebih dahulu untuk pembayaran langsung tunai.');
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                kode_reservasi_room: roomData.kode_reservasi_room,
                new_check_out_date: formatDateSystem(newCheckoutDate, 'yyyy-MM-dd'),
                is_paid_now: isPaidNow
            };

            if (isPaidNow) {
                payload.payment_method = paymentMethod;
                payload.kode_cashier_shift = paymentMethod === 'cash' ? shiftAktif?.kode_cashier_shift : undefined;
                payload.reference_no = referenceNo || undefined;
            }

            const res = await postData(apiExtendSubmit, payload);
            if (res.data.status === '00') {
                showSuccess(toast, res.data.message || 'Perpanjangan kamar berhasil diproses!');
                onSuccess();
                onHide();
            } else {
                showError(toast, res.data.message || 'Gagal memperpanjang masa menginap');
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Terjadi kesalahan sistem saat memperpanjang kamar.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-calendar-plus text-warning text-xl"></i>
                    <span className="font-bold text-lg">Perpanjang Masa Menginap (Extend Stay)</span>
                </div>
            }
            style={{ width: '90vw', maxWidth: '650px' }}
            modal
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button label="Batal" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={submitting} />
                    <Button
                        label={isPaidNow ? "Bayar & Extend Kamar" : "Konfirmasi Extend (Tagih Nanti)"}
                        icon="pi pi-check"
                        className={isPaidNow ? "p-button-success" : "p-button-warning"}
                        onClick={handleSubmit}
                        loading={submitting}
                        disabled={checking || !simData?.can_extend_same_room}
                    />
                </div>
            }
        >
            <div className="flex flex-column gap-3">
                {/* Banner Info Kamar & Tamu */}
                <div className="surface-card border-round-xl border-1 surface-border p-3">
                    <div className="grid">
                        <div className="col-12 sm:col-6">
                            <span className="text-xs text-color-secondary uppercase font-bold block">Tamu & Kamar</span>
                            <span className="font-bold text-base text-900 block mt-1">
                                Kamar {roomData?.nomor_kamar || '-'} — {roomData?.nama_tipe_kamar || 'Tipe Kamar'}
                            </span>
                            <span className="text-xs text-700 block mt-1">
                                <i className="pi pi-user mr-1 text-color-secondary"></i>
                                {roomData?.guest_name || '-'}
                            </span>
                        </div>
                        <div className="col-12 sm:col-6 text-left sm:text-right">
                            <span className="text-xs text-color-secondary uppercase font-bold block">Jadwal Check-out Saat Ini</span>
                            <span className="font-bold text-base text-primary block mt-1">
                                {roomData?.check_out_date ? formatDateSystem(roomData.check_out_date, 'EEEE, dd MMM yyyy') : '-'}
                            </span>
                            <span className="text-xs text-color-secondary block mt-1">
                                Durasi Saat Ini: {roomData?.nights || 1} malam
                            </span>
                        </div>
                    </div>
                </div>

                {/* Pemilihan Tanggal Check-out Baru */}
                <div className="surface-card border-round-xl border-1 surface-border p-3">
                    <label className="text-xs font-bold text-700 block mb-2">
                        Pilih Tanggal Check-out Baru (Perpanjangan):
                    </label>
                    <Calendar
                        value={newCheckoutDate}
                        onChange={handleDateChange}
                        minDate={minDate}
                        dateFormat="dd MM yy"
                        showIcon
                        className="w-full"
                        placeholder="Pilih tanggal perpanjangan"
                    />
                </div>

                {checking && <ProgressBar mode="indeterminate" style={{ height: '4px' }} />}

                {/* Hasil Pengecekan Ketersediaan & Simulasi Harga */}
                {simData && (
                    <div className="surface-card border-round-xl border-1 surface-border p-3">
                        <div className="flex align-items-center justify-content-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-color-secondary">
                                Hasil Pengecekan Sistem
                            </span>
                            <Tag
                                severity={simData.can_extend_same_room ? 'success' : 'danger'}
                                value={simData.can_extend_same_room ? 'Kamar Tersedia' : 'Bentrok Reservasi Lain'}
                                className="text-xs font-bold"
                            />
                        </div>

                        <p className={`text-sm m-0 mb-3 ${simData.can_extend_same_room ? 'text-green-700' : 'text-red-600'}`}>
                            <i className={`pi mr-1 ${simData.can_extend_same_room ? 'pi-check-circle' : 'pi-exclamation-triangle'}`}></i>
                            {simData.info_message}
                        </p>

                        <div className="grid p-3 surface-100 border-round-lg">
                            <div className="col-4 text-center border-right-1 surface-border">
                                <span className="text-xs text-color-secondary block">Tambahan Malam</span>
                                <span className="text-lg font-bold text-900 block mt-1">
                                    +{simData.additional_nights} Malam
                                </span>
                            </div>
                            <div className="col-4 text-center border-right-1 surface-border">
                                <span className="text-xs text-color-secondary block">Tarif per Malam</span>
                                <span className="text-sm font-bold text-900 block mt-1">
                                    Rp {Number(simData.rate_per_night || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="col-4 text-center">
                                <span className="text-xs text-color-secondary block">Total Biaya Tambahan</span>
                                <span className="text-lg font-bold text-primary block mt-1">
                                    Rp {Number(simData.total_additional_charge || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Opsi Pembayaran Extend */}
                {simData?.can_extend_same_room && (
                    <div className="surface-card border-round-xl border-1 surface-border p-3">
                        <label className="text-xs font-bold text-color-secondary uppercase block mb-2">
                            Opsi Pembayaran Sewa Tambahan:
                        </label>
                        <div className="flex flex-column gap-2">
                            <div className="flex align-items-center gap-2 cursor-pointer" onClick={() => setIsPaidNow(false)}>
                                <RadioButton
                                    inputId="extendChargeToRoom"
                                    name="extendPaymentOption"
                                    checked={!isPaidNow}
                                    onChange={() => setIsPaidNow(false)}
                                />
                                <label htmlFor="extendChargeToRoom" className="cursor-pointer text-sm font-semibold text-900">
                                    Bebankan ke Tagihan Kamar — <span className="text-color-secondary font-normal text-xs">Dilunasi saat Checkout</span>
                                </label>
                            </div>

                            <div className="flex align-items-center gap-2 cursor-pointer" onClick={() => setIsPaidNow(true)}>
                                <RadioButton
                                    inputId="extendPayNow"
                                    name="extendPaymentOption"
                                    checked={isPaidNow}
                                    onChange={() => setIsPaidNow(true)}
                                />
                                <label htmlFor="extendPayNow" className="cursor-pointer text-sm font-semibold text-900">
                                    Bayar Lunas Sekarang (Pay Now) — <span className="text-green-600 font-normal text-xs">Kuitansi langsung tercetak</span>
                                </label>
                            </div>
                        </div>

                        {/* Jika Bayar Langsung */}
                        {isPaidNow && (
                            <div className="surface-50 border-round-lg p-3 mt-3 border-1 surface-border">
                                <div className="grid">
                                    <div className="col-12 md:col-6">
                                        <label className="text-xs font-bold text-700 block mb-1">Metode Pembayaran</label>
                                        <Dropdown
                                            value={paymentMethod}
                                            options={[
                                                { label: 'Tunai (Cash)', value: 'cash' },
                                                { label: 'QRIS', value: 'qris' },
                                                { label: 'Kartu Debit (EDC)', value: 'debit_card' },
                                                { label: 'Kartu Kredit (EDC)', value: 'credit_card' },
                                                { label: 'Transfer Bank', value: 'bank_transfer' }
                                            ]}
                                            onChange={(e) => setPaymentMethod(e.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <label className="text-xs font-bold text-700 block mb-1">Nomor Referensi (Opsional)</label>
                                        <InputText
                                            value={referenceNo}
                                            onChange={(e) => setReferenceNo(e.target.value)}
                                            placeholder="No Ref / Trace / Transaksi"
                                            className="w-full"
                                        />
                                    </div>
                                    {paymentMethod === 'cash' && (
                                        <div className="col-12">
                                            <div className="text-xs text-700 flex align-items-center gap-1">
                                                <i className="pi pi-clock text-primary"></i>
                                                <span>
                                                    Shift Kasir Aktif:{' '}
                                                    {shiftAktif ? (
                                                        <strong className="text-green-600 font-semibold">{shiftAktif.kode_cashier_shift} ({shiftAktif.nama_shift || 'Shift Aktif'})</strong>
                                                    ) : (
                                                        <strong className="text-red-500">Belum Ada Shift Terbuka!</strong>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Dialog>
    );
};
export default DialogExtendStay;
