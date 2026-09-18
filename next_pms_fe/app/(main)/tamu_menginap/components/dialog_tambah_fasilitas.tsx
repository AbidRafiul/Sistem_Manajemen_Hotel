'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import postData from '@/lib/axios/postData';
import { apiFasilitasAdd, apiFasilitasData, apiShiftCurrent } from './endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';

interface DialogTambahFasilitasProps {
    visible: boolean;
    onHide: () => void;
    onSuccess: () => void;
    roomData: any;
    toast: any;
}

interface ServicePreset {
    id: string;
    nama: string;
    harga: number;
    charge_type: string;
    icon: string;
    categoryLabel: string;
    bgColor: string;
    iconColor: string;
}

const DEFAULT_PRESETS: ServicePreset[] = [
    {
        id: 'extra_bed',
        nama: 'Extra Bed (Kasur Tambahan)',
        harga: 150000,
        charge_type: 'extra_bed',
        icon: 'pi pi-inbox',
        categoryLabel: 'Kasur Tambahan',
        bgColor: '#f3e8ff',
        iconColor: '#9333ea'
    },
    {
        id: 'breakfast',
        nama: 'Sarapan Tambahan (Buffet)',
        harga: 75000,
        charge_type: 'restaurant',
        icon: 'pi pi-coffee',
        categoryLabel: 'Restoran & F&B',
        bgColor: '#fef3c7',
        iconColor: '#d97706'
    },
    {
        id: 'laundry',
        nama: 'Laundry Regular (Express)',
        harga: 50000,
        charge_type: 'laundry',
        icon: 'pi pi-sync',
        categoryLabel: 'Laundry & Binatu',
        bgColor: '#cffafe',
        iconColor: '#0891b2'
    },
    {
        id: 'minibar',
        nama: 'Minibar & Snack Kamar',
        harga: 35000,
        charge_type: 'restaurant',
        icon: 'pi pi-shopping-bag',
        categoryLabel: 'Minibar / F&B',
        bgColor: '#ffedd5',
        iconColor: '#ea580c'
    },
    {
        id: 'airport_shuttle',
        nama: 'Antar Jemput Bandara / Transport',
        harga: 200000,
        charge_type: 'other',
        icon: 'pi pi-car',
        categoryLabel: 'Transportasi',
        bgColor: '#dbeafe',
        iconColor: '#2563eb'
    },
    {
        id: 'room_spa',
        nama: 'Room Spa & Massage (60 Min)',
        harga: 180000,
        charge_type: 'other',
        icon: 'pi pi-heart',
        categoryLabel: 'Relaksasi / Spa',
        bgColor: '#fce7f3',
        iconColor: '#db2777'
    }
];

export const DialogTambahFasilitas: React.FC<DialogTambahFasilitasProps> = ({
    visible,
    onHide,
    onSuccess,
    roomData,
    toast
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [availableServices, setAvailableServices] = useState<ServicePreset[]>(DEFAULT_PRESETS);
    const [selectedService, setSelectedService] = useState<ServicePreset>(DEFAULT_PRESETS[0]);
    const [qty, setQty] = useState<number>(1);

    // Payment State
    const [isPaidNow, setIsPaidNow] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [referenceNo, setReferenceNo] = useState('');
    const [shiftAktif, setShiftAktif] = useState<any>(null);

    const subtotal = Math.max(0, (qty || 1) * (selectedService?.harga || 0));

    const loadMasterFacilities = async () => {
        try {
            const res = await postData(apiFasilitasData, { perPage: 100 });
            if (res?.data?.data && Array.isArray(res.data.data)) {
                const masterItems: ServicePreset[] = res.data.data.map((f: any) => ({
                    id: f.kode_fasilitas || f.name,
                    nama: f.name,
                    harga: parseFloat(f.harga || 0) || 50000,
                    charge_type: 'other',
                    icon: 'pi pi-star',
                    categoryLabel: 'Master Fasilitas',
                    bgColor: '#ecfdf5',
                    iconColor: '#059669'
                }));

                const existingNames = new Set(DEFAULT_PRESETS.map((p) => p.nama.toLowerCase()));
                const additional = masterItems.filter((m) => !existingNames.has(m.nama.toLowerCase()));
                const combined = [...DEFAULT_PRESETS, ...additional];
                setAvailableServices(combined);
            }
        } catch (e) {
            console.error('Gagal memuat master fasilitas', e);
        }
    };

    const loadShift = async () => {
        try {
            const res = await postData(apiShiftCurrent, {});
            if (res?.data?.data) {
                setShiftAktif(res.data.data);
            }
        } catch (e) {
            console.error('Gagal memuat shift', e);
        }
    };

    useEffect(() => {
        if (visible) {
            loadMasterFacilities();
            loadShift();
            setSelectedService(DEFAULT_PRESETS[0]);
            setQty(1);
            setIsPaidNow(false);
            setPaymentMethod('cash');
            setReferenceNo('');
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!roomData?.kode_reservasi_room) {
            showError(toast, 'Data kamar reservasi tidak valid.');
            return;
        }
        if (!selectedService?.nama) {
            showError(toast, 'Silakan pilih fasilitas atau layanan.');
            return;
        }
        if (qty < 1) {
            showError(toast, 'Jumlah kuantitas minimal 1.');
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
                items: [
                    {
                        kode_fasilitas: selectedService.id,
                        nama: selectedService.nama,
                        qty: qty,
                        harga: selectedService.harga,
                        charge_type: selectedService.charge_type || 'other'
                    }
                ],
                is_paid_now: isPaidNow
            };

            if (isPaidNow) {
                payload.payment_method = paymentMethod;
                payload.kode_cashier_shift = paymentMethod === 'cash' ? shiftAktif?.kode_cashier_shift : undefined;
                payload.reference_no = referenceNo || undefined;
            }

            const res = await postData(apiFasilitasAdd, payload);
            if (res.data.status === '00') {
                showSuccess(toast, res.data.message || 'Fasilitas berhasil ditambahkan');
                onSuccess();
                onHide();
            } else {
                showError(toast, res.data.message || 'Gagal menambahkan fasilitas');
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Terjadi kesalahan sistem saat memproses fasilitas.');
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
                    <div className="w-2rem h-2rem border-round-lg bg-teal-50 text-teal-600 flex align-items-center justify-content-center flex-shrink-0 border-1 border-teal-200">
                        <i className="pi pi-plus-circle text-sm"></i>
                    </div>
                    <div>
                        <span className="font-bold text-base text-900 block line-height-2">
                            Tambah Fasilitas / Layanan Kamar
                        </span>
                        <span className="text-xs text-500 font-normal">
                            Pilih layanan dari master fasilitas untuk dibebankan ke kamar
                        </span>
                    </div>
                </div>
            }
            style={{ width: '92vw', maxWidth: '480px' }}
            breakpoints={{ '641px': '95vw' }}
            contentStyle={{ overflowX: 'hidden', padding: '1rem' }}
            modal
            footer={
                <div className="flex flex-column sm:flex-row justify-content-between align-items-stretch sm:align-items-center gap-2 pt-2 border-top-1 surface-border">
                    <div className="flex align-items-center gap-2">
                        <span className="text-xs text-500 uppercase font-semibold">Total Biaya:</span>
                        <span className="font-bold text-base text-primary">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-content-end gap-2">
                        <Button
                            type="button"
                            label="Batal"
                            icon="pi pi-times"
                            size="small"
                            className="p-button-outlined p-button-secondary text-xs"
                            onClick={onHide}
                            disabled={submitting}
                        />
                        <Button
                            type="button"
                            size="small"
                            label={isPaidNow ? `Bayar & Tambah (Rp ${subtotal.toLocaleString('id-ID')})` : `Bebankan ke Kamar (Rp ${subtotal.toLocaleString('id-ID')})`}
                            icon={isPaidNow ? 'pi pi-check-circle' : 'pi pi-file-edit'}
                            className={`text-xs ${isPaidNow ? 'p-button-success' : 'p-button-primary'}`}
                            onClick={handleSubmit}
                            loading={submitting}
                        />
                    </div>
                </div>
            }
        >
            <div className="flex flex-column gap-2.5 text-xs">
                {/* 1. Context Banner: Tamu & Kamar Compact */}
                <div className="surface-50 border-round-xl border-1 surface-border p-2.5 flex justify-content-between align-items-center">
                    <div className="flex align-items-center gap-2">
                        <span className="w-1.75rem h-1.75rem border-round bg-primary text-white font-bold flex align-items-center justify-content-center text-xs">
                            {roomData?.nomor_kamar || '-'}
                        </span>
                        <div>
                            <span className="font-bold text-xs text-900">
                                Kamar {roomData?.nomor_kamar} — {roomData?.guest_name || 'Tamu Menginap'}
                            </span>
                            <span className="text-500 text-xs block">
                                Folio: <strong className="text-700 font-mono">{roomData?.kode_folio || roomData?.kode_reservation || '-'}</strong>
                            </span>
                        </div>
                    </div>
                    <Tag
                        severity={roomData?.billing_status === 'settled' ? 'success' : 'warning'}
                        value={roomData?.billing_status === 'settled' ? 'Lunas' : `Saldo: Rp ${(roomData?.balance || 0).toLocaleString('id-ID')}`}
                        className="text-xs py-0 px-2 font-bold"
                    />
                </div>

                {/* 2. Katalog Layanan dari Master (Compact Selectable Cards) */}
                <div>
                    <label className="text-xs font-bold text-700 uppercase tracking-wider block mb-1.5">
                        Pilih Fasilitas / Layanan (Sesuai Master):
                    </label>

                    <div className="grid">
                        {availableServices.map((item) => {
                            const isSelected = selectedService?.id === item.id;
                            return (
                                <div key={item.id} className="col-12 sm:col-6">
                                    <div
                                        onClick={() => setSelectedService(item)}
                                        className={`cursor-pointer p-2 border-round-xl border-2 transition-all transition-duration-150 flex align-items-center justify-content-between gap-2 h-full ${
                                            isSelected ? 'shadow-1 surface-0' : 'surface-card border-surface hover:surface-100'
                                        }`}
                                        style={{
                                            borderColor: isSelected ? 'var(--primary-color, #10b981)' : '#e2e8f0',
                                            backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.05)' : undefined
                                        }}
                                    >
                                        <div className="flex align-items-center gap-2 overflow-hidden flex-1">
                                            <div
                                                className="w-1.75rem h-1.75rem border-round-lg flex align-items-center justify-content-center flex-shrink-0 text-xs"
                                                style={{ backgroundColor: item.bgColor, color: item.iconColor }}
                                            >
                                                <i className={item.icon}></i>
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="font-bold text-xs text-900 text-overflow-ellipsis overflow-hidden white-space-nowrap" title={item.nama}>
                                                    {item.nama}
                                                </div>
                                                <div className="text-xs text-500 font-normal">{item.categoryLabel}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="font-bold text-xs text-primary">
                                                Rp {item.harga.toLocaleString('id-ID')}
                                            </div>
                                            {isSelected ? (
                                                <span className="text-green-600 font-bold text-xs">✓ Dipilih</span>
                                            ) : (
                                                <span className="text-400 text-xs">Pilih</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Panel Kuantitas (Jumlah Unit) */}
                <div className="surface-50 border-round-xl border-1 surface-border p-2.5 flex align-items-center justify-content-between">
                    <div>
                        <span className="text-xs text-500 block">Layanan Terpilih:</span>
                        <span className="text-xs font-bold text-900 block">
                            {selectedService?.nama}
                        </span>
                        <span className="text-xs text-primary font-semibold">
                            Tarif Master: Rp {selectedService?.harga?.toLocaleString('id-ID')} / unit
                        </span>
                    </div>

                    <div className="flex align-items-center gap-2">
                        <span className="text-xs font-semibold text-700">Jumlah (Qty):</span>
                        <div className="p-inputgroup" style={{ width: '105px' }}>
                            <Button
                                type="button"
                                icon="pi pi-minus"
                                className="p-button-outlined p-button-secondary p-button-sm p-1"
                                onClick={() => setQty(Math.max(1, (qty || 1) - 1))}
                                disabled={qty <= 1}
                                style={{ width: '2rem' }}
                            />
                            <InputNumber
                                value={qty}
                                onValueChange={(e) => setQty(Math.max(1, e.value || 1))}
                                min={1}
                                max={99}
                                inputClassName="text-center font-bold text-xs p-1"
                            />
                            <Button
                                type="button"
                                icon="pi pi-plus"
                                className="p-button-outlined p-button-secondary p-button-sm p-1"
                                onClick={() => setQty((qty || 1) + 1)}
                                style={{ width: '2rem' }}
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Opsi Penagihan Biaya Compact */}
                <div>
                    <label className="text-xs font-bold text-700 uppercase tracking-wider block mb-1.5">
                        Opsi Penagihan Biaya:
                    </label>

                    <div className="grid">
                        <div className="col-12 sm:col-6">
                            <div
                                onClick={() => setIsPaidNow(false)}
                                className={`cursor-pointer p-2.5 border-round-xl border-2 transition-all transition-duration-150 h-full flex align-items-center gap-2 ${
                                    !isPaidNow ? 'shadow-1 surface-0' : 'surface-card border-surface hover:surface-100'
                                }`}
                                style={{
                                    borderColor: !isPaidNow ? 'var(--primary-color, #10b981)' : '#e2e8f0',
                                    backgroundColor: !isPaidNow ? 'rgba(16, 185, 129, 0.05)' : undefined
                                }}
                            >
                                <div className={`w-1.75rem h-1.75rem border-round-lg flex align-items-center justify-content-center flex-shrink-0 text-xs ${!isPaidNow ? 'bg-primary text-white' : 'surface-200 text-600'}`}>
                                    <i className="pi pi-file-edit"></i>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-bold text-xs text-900">Bebankan ke Kamar</div>
                                    <div className="text-xs text-500">Bayar saat checkout</div>
                                </div>
                                <div className={`w-1rem h-1rem border-circle border-2 flex align-items-center justify-content-center text-xs ${!isPaidNow ? 'border-primary bg-primary text-white' : 'border-400'}`}>
                                    {!isPaidNow && '✓'}
                                </div>
                            </div>
                        </div>

                        <div className="col-12 sm:col-6">
                            <div
                                onClick={() => setIsPaidNow(true)}
                                className={`cursor-pointer p-2.5 border-round-xl border-2 transition-all transition-duration-150 h-full flex align-items-center gap-2 ${
                                    isPaidNow ? 'shadow-1 surface-0' : 'surface-card border-surface hover:surface-100'
                                }`}
                                style={{
                                    borderColor: isPaidNow ? 'var(--primary-color, #10b981)' : '#e2e8f0',
                                    backgroundColor: isPaidNow ? 'rgba(16, 185, 129, 0.05)' : undefined
                                }}
                            >
                                <div className={`w-1.75rem h-1.75rem border-round-lg flex align-items-center justify-content-center flex-shrink-0 text-xs ${isPaidNow ? 'bg-primary text-white' : 'surface-200 text-600'}`}>
                                    <i className="pi pi-wallet"></i>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-bold text-xs text-900">Bayar Langsung</div>
                                    <div className="text-xs text-500">Lunas saat serah terima</div>
                                </div>
                                <div className={`w-1rem h-1rem border-circle border-2 flex align-items-center justify-content-center text-xs ${isPaidNow ? 'border-primary bg-primary text-white' : 'border-400'}`}>
                                    {isPaidNow && '✓'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jika Bayar Langsung, Tampilkan Panel Kasir & Metode Pembayaran */}
                {isPaidNow && (
                    <div className="surface-50 border-round-xl p-2.5 border-1 surface-border">
                        <div className="grid">
                            <div className="col-12 sm:col-6">
                                <label className="text-xs font-semibold text-700 block mb-1">
                                    Metode Pembayaran <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    value={paymentMethod}
                                    options={[
                                        { label: '💵 Tunai (Cash)', value: 'cash' },
                                        { label: '📱 QRIS (Static / Dynamic)', value: 'qris' },
                                        { label: '💳 Kartu Debit (EDC)', value: 'debit_card' },
                                        { label: '💳 Kartu Kredit (EDC)', value: 'credit_card' },
                                        { label: '🏦 Transfer Bank', value: 'bank_transfer' }
                                    ]}
                                    onChange={(e) => setPaymentMethod(e.value)}
                                    className="w-full text-xs"
                                />
                            </div>
                            <div className="col-12 sm:col-6">
                                <label className="text-xs font-semibold text-700 block mb-1">
                                    No. Referensi (Opsional)
                                </label>
                                <InputText
                                    value={referenceNo}
                                    onChange={(e) => setReferenceNo(e.target.value)}
                                    placeholder="No Trace / Ref EDC"
                                    className="w-full text-xs"
                                />
                            </div>
                            {paymentMethod === 'cash' && (
                                <div className="col-12">
                                    <div className="surface-0 p-1.5 border-round-lg border-1 surface-border text-xs flex align-items-center gap-1.5">
                                        <i className="pi pi-clock text-primary text-xs"></i>
                                        <span>
                                            Shift Kasir:{' '}
                                            {shiftAktif ? (
                                                <strong className="text-green-600">
                                                    {shiftAktif.kode_cashier_shift} ({shiftAktif.nama_shift || 'Shift Aktif'})
                                                </strong>
                                            ) : (
                                                <strong className="text-red-500">
                                                    ⚠️ Belum ada shift kasir dibuka!
                                                </strong>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default DialogTambahFasilitas;
