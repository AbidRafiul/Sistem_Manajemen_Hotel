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
        nama: 'Sarapan Tambahan (Breakfast Buffet)',
        harga: 75000,
        charge_type: 'restaurant',
        icon: 'pi pi-coffee',
        categoryLabel: 'Restoran & F&B',
        bgColor: '#fef3c7',
        iconColor: '#d97706'
    },
    {
        id: 'laundry',
        nama: 'Laundry Regular (Express Wash)',
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
        nama: 'Room Spa & Massage (60 Menit)',
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
    const [selectedServiceId, setSelectedServiceId] = useState<string>('extra_bed');
    const [isCustomMode, setIsCustomMode] = useState(false);

    // Form State
    const [namaItem, setNamaItem] = useState('Extra Bed (Kasur Tambahan)');
    const [chargeType, setChargeType] = useState('extra_bed');
    const [qty, setQty] = useState<number>(1);
    const [harga, setHarga] = useState<number>(150000);

    // Payment State
    const [isPaidNow, setIsPaidNow] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [referenceNo, setReferenceNo] = useState('');
    const [shiftAktif, setShiftAktif] = useState<any>(null);

    const subtotal = Math.max(0, (qty || 1) * (harga || 0));

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
                    categoryLabel: 'Fasilitas Hotel',
                    bgColor: '#e0f2fe',
                    iconColor: '#0284c7'
                }));

                // Gabungkan default presets dengan master fasilitas tanpa duplikasi nama
                const existingNames = new Set(DEFAULT_PRESETS.map((p) => p.nama.toLowerCase()));
                const additional = masterItems.filter((m) => !existingNames.has(m.nama.toLowerCase()));
                setAvailableServices([...DEFAULT_PRESETS, ...additional]);
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
            // Reset ke preset pertama
            handleSelectPreset(DEFAULT_PRESETS[0]);
            setIsPaidNow(false);
            setPaymentMethod('cash');
            setReferenceNo('');
            setIsCustomMode(false);
        }
    }, [visible]);

    const handleSelectPreset = (item: ServicePreset) => {
        setSelectedServiceId(item.id);
        setIsCustomMode(false);
        setNamaItem(item.nama);
        setHarga(item.harga);
        setChargeType(item.charge_type || 'other');
        setQty(1);
    };

    const handleEnableCustomMode = () => {
        setIsCustomMode(true);
        setSelectedServiceId('custom');
        setNamaItem('');
        setHarga(0);
        setChargeType('other');
        setQty(1);
    };

    const handleSubmit = async () => {
        if (!roomData?.kode_reservasi_room) {
            showError(toast, 'Kamar reservasi tidak valid.');
            return;
        }
        if (!namaItem.trim()) {
            showError(toast, 'Nama layanan/fasilitas tidak boleh kosong.');
            return;
        }
        if (!qty || qty < 1) {
            showError(toast, 'Jumlah (Qty) minimal 1.');
            return;
        }
        if (harga < 0) {
            showError(toast, 'Harga tidak boleh negatif.');
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
                        nama: namaItem,
                        qty: qty,
                        harga: harga,
                        charge_type: chargeType
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
                <div className="flex align-items-center gap-3">
                    <div className="w-2.5rem h-2.5rem border-round-xl bg-teal-50 text-teal-600 flex align-items-center justify-content-center flex-shrink-0 border-1 border-teal-200">
                        <i className="pi pi-plus-circle text-xl"></i>
                    </div>
                    <div>
                        <span className="font-bold text-lg text-900 block line-height-2">
                            Tambah Fasilitas & Layanan Kamar In-House
                        </span>
                        <span className="text-xs text-500 font-normal">
                            Pilih katalog layanan atau masukkan layanan kustom untuk dibebankan ke folio tamu
                        </span>
                    </div>
                </div>
            }
            style={{ width: '800px', maxWidth: '95vw' }}
            breakpoints={{ '960px': '85vw', '641px': '95vw' }}
            contentStyle={{ overflowX: 'hidden', padding: '1.25rem' }}
            modal
            footer={
                <div className="flex flex-column sm:flex-row justify-content-between align-items-stretch sm:align-items-center gap-2 pt-2 border-top-1 surface-border">
                    <div className="flex align-items-center gap-2">
                        <span className="text-xs text-500 uppercase font-semibold">Subtotal:</span>
                        <span className="font-bold text-xl text-primary">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-content-end gap-2">
                        <Button
                            type="button"
                            label="Batal"
                            icon="pi pi-times"
                            className="p-button-outlined p-button-secondary p-button-sm"
                            onClick={onHide}
                            disabled={submitting}
                        />
                        <Button
                            type="button"
                            label={isPaidNow ? `Bayar & Tambah (Rp ${subtotal.toLocaleString('id-ID')})` : `Bebankan ke Kamar (Rp ${subtotal.toLocaleString('id-ID')})`}
                            icon={isPaidNow ? 'pi pi-check-circle' : 'pi pi-file-edit'}
                            className={`p-button-sm ${isPaidNow ? 'p-button-success' : 'p-button-primary'}`}
                            onClick={handleSubmit}
                            loading={submitting}
                        />
                    </div>
                </div>
            }
        >
            <div className="flex flex-column gap-3">
                {/* 1. Context Banner: Data Tamu & Kamar */}
                <div className="surface-50 border-round-xl border-1 surface-border p-3 flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-2">
                    <div className="flex align-items-center gap-3">
                        <div className="w-2.5rem h-2.5rem border-round-lg bg-primary-100 text-primary flex align-items-center justify-content-center font-bold text-base flex-shrink-0">
                            <i className="pi pi-building"></i>
                        </div>
                        <div>
                            <div className="flex align-items-center gap-2">
                                <span className="font-bold text-base text-900">
                                    Kamar {roomData?.nomor_kamar || '-'}
                                </span>
                                <span className="text-500 text-xs">|</span>
                                <span className="font-semibold text-sm text-700">
                                    {roomData?.guest_name || 'Tamu Menginap'}
                                </span>
                            </div>
                            <span className="text-xs text-500 block mt-1">
                                Kode Reservasi: <strong className="text-700">{roomData?.kode_reservation || roomData?.kode_reservasi_room || '-'}</strong>
                            </span>
                        </div>
                    </div>
                    <div className="flex align-items-center gap-2 self-end sm:self-center">
                        <Tag
                            severity={roomData?.billing_status === 'settled' ? 'success' : 'warning'}
                            value={roomData?.billing_status === 'settled' ? 'Tagihan: Lunas' : `Saldo: Rp ${(roomData?.balance || 0).toLocaleString('id-ID')}`}
                            icon={roomData?.billing_status === 'settled' ? 'pi pi-check' : 'pi pi-exclamation-circle'}
                            className="text-xs px-2 py-1"
                        />
                    </div>
                </div>

                {/* 2. Interactive Catalog Cards (Pilihan Layanan Cepat) */}
                <div>
                    <div className="flex justify-content-between align-items-center mb-2">
                        <label className="text-xs font-bold text-700 uppercase tracking-wider block">
                            Katalog Layanan & Fasilitas Populer:
                        </label>
                        <Button
                            type="button"
                            label="Input Kustom / Manual"
                            icon="pi pi-pencil"
                            size="small"
                            outlined={!isCustomMode}
                            severity={isCustomMode ? undefined : 'secondary'}
                            onClick={handleEnableCustomMode}
                            className="text-xs py-1 px-2"
                        />
                    </div>

                    <div className="grid">
                        {availableServices.map((item) => {
                            const isSelected = !isCustomMode && selectedServiceId === item.id;
                            return (
                                <div key={item.id} className="col-12 sm:col-6 md:col-4">
                                    <div
                                        onClick={() => handleSelectPreset(item)}
                                        className={`cursor-pointer p-2 sm:p-3 border-round-xl border-2 transition-all transition-duration-150 h-full flex flex-column justify-content-between ${
                                            isSelected
                                                ? 'shadow-2 surface-0'
                                                : 'surface-card border-surface hover:surface-100'
                                        }`}
                                        style={{
                                            borderColor: isSelected ? 'var(--primary-color, #10b981)' : '#e2e8f0',
                                            backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.06)' : undefined
                                        }}
                                    >
                                        <div className="flex align-items-start gap-2 mb-2">
                                            <div
                                                className="w-2rem h-2rem border-round-lg flex align-items-center justify-content-center flex-shrink-0"
                                                style={{ backgroundColor: item.bgColor, color: item.iconColor }}
                                            >
                                                <i className={`${item.icon} text-sm`}></i>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="font-bold text-xs sm:text-sm text-900 line-clamp-1" title={item.nama}>
                                                    {item.nama}
                                                </div>
                                                <span className="text-xs text-500 font-medium block">
                                                    {item.categoryLabel}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-content-between align-items-center pt-2 mt-auto border-top-1 surface-border">
                                            <span className="font-bold text-xs sm:text-sm text-primary">
                                                Rp {item.harga.toLocaleString('id-ID')}
                                            </span>
                                            {isSelected ? (
                                                <span className="bg-primary text-white border-circle w-1rem h-1rem flex align-items-center justify-content-center text-xs">
                                                    ✓
                                                </span>
                                            ) : (
                                                <i className="pi pi-chevron-right text-xs text-400"></i>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Form Input Rincian & Kuantitas */}
                <div className="surface-card border-round-xl border-1 surface-border p-3">
                    <span className="text-xs font-bold text-700 uppercase tracking-wider block mb-2">
                        {isCustomMode ? '📝 Masukkan Layanan Kustom / Manual:' : '⚙️ Rincian & Penyesuaian Harga:'}
                    </span>

                    <div className="grid">
                        {/* Nama Layanan */}
                        <div className="col-12 md:col-8">
                            <label className="text-xs font-semibold text-700 block mb-1">
                                Nama Layanan / Fasilitas <span className="text-red-500">*</span>
                            </label>
                            <span className="p-input-icon-left w-full">
                                <i className="pi pi-tag text-500" />
                                <InputText
                                    value={namaItem}
                                    onChange={(e) => setNamaItem(e.target.value)}
                                    placeholder="Contoh: Extra Bed, Laundry Kilat, Airport Taxi..."
                                    className="w-full text-sm font-medium pl-5"
                                />
                            </span>
                        </div>

                        {/* Kategori Charge */}
                        <div className="col-12 md:col-4">
                            <label className="text-xs font-semibold text-700 block mb-1">
                                Kategori Charge
                            </label>
                            <Dropdown
                                value={chargeType}
                                options={[
                                    { label: 'Lainnya / Umum', value: 'other' },
                                    { label: 'Kasur Tambahan (Extra Bed)', value: 'extra_bed' },
                                    { label: 'Restoran & Makanan (F&B)', value: 'restaurant' },
                                    { label: 'Laundry & Binatu', value: 'laundry' },
                                    { label: 'Sewa Kamar Tambahan', value: 'room' }
                                ]}
                                onChange={(e) => setChargeType(e.value)}
                                className="w-full text-sm"
                            />
                        </div>

                        {/* Jumlah (Qty) dengan Stepper InputGroup yang Rapih & Tidak Tumpang Tindih */}
                        <div className="col-12 sm:col-5 md:col-4">
                            <label className="text-xs font-semibold text-700 block mb-1">
                                Jumlah (Qty) <span className="text-red-500">*</span>
                            </label>
                            <div className="p-inputgroup w-full">
                                <Button
                                    type="button"
                                    icon="pi pi-minus"
                                    className="p-button-outlined p-button-secondary p-button-sm"
                                    onClick={() => setQty(Math.max(1, (qty || 1) - 1))}
                                    disabled={qty <= 1}
                                    style={{ width: '2.5rem' }}
                                />
                                <InputNumber
                                    value={qty}
                                    onValueChange={(e) => setQty(Math.max(1, e.value || 1))}
                                    min={1}
                                    max={99}
                                    inputClassName="text-center font-bold text-sm w-full"
                                />
                                <Button
                                    type="button"
                                    icon="pi pi-plus"
                                    className="p-button-outlined p-button-secondary p-button-sm"
                                    onClick={() => setQty((qty || 1) + 1)}
                                    style={{ width: '2.5rem' }}
                                />
                            </div>
                        </div>

                        {/* Harga Satuan */}
                        <div className="col-12 sm:col-7 md:col-8">
                            <label className="text-xs font-semibold text-700 block mb-1">
                                Harga Satuan (Rp) <span className="text-red-500">*</span>
                            </label>
                            <InputNumber
                                value={harga}
                                onValueChange={(e) => setHarga(e.value || 0)}
                                mode="currency"
                                currency="IDR"
                                locale="id-ID"
                                className="w-full"
                                placeholder="Rp 0"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Opsi Penagihan Biaya (Modern Executive Selectable Cards) */}
                <div>
                    <label className="text-xs font-bold text-700 uppercase tracking-wider block mb-2">
                        Metode Penagihan Biaya:
                    </label>

                    <div className="grid">
                        {/* Option 1: Bebankan ke Kamar */}
                        <div className="col-12 sm:col-6">
                            <div
                                onClick={() => setIsPaidNow(false)}
                                className={`cursor-pointer p-3 border-round-xl border-2 transition-all transition-duration-150 h-full flex align-items-start gap-3 ${
                                    !isPaidNow
                                        ? 'shadow-2 surface-0'
                                        : 'surface-card border-surface hover:surface-100'
                                }`}
                                style={{
                                    borderColor: !isPaidNow ? 'var(--primary-color, #10b981)' : '#e2e8f0',
                                    backgroundColor: !isPaidNow ? 'rgba(16, 185, 129, 0.06)' : undefined
                                }}
                            >
                                <div
                                    className={`w-2.5rem h-2.5rem border-round-lg flex align-items-center justify-content-center flex-shrink-0 ${
                                        !isPaidNow ? 'bg-primary text-white' : 'surface-200 text-600'
                                    }`}
                                >
                                    <i className="pi pi-file-edit text-base"></i>
                                </div>
                                <div className="flex-1">
                                    <div className="flex align-items-center justify-content-between">
                                        <span className="font-bold text-sm text-900">Bebankan ke Kamar</span>
                                        <span
                                            className={`w-1rem h-1rem border-circle border-2 flex align-items-center justify-content-center text-xs ${
                                                !isPaidNow ? 'border-primary bg-primary text-white' : 'border-400'
                                            }`}
                                        >
                                            {!isPaidNow && '✓'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-600 mt-1 mb-0 line-height-2">
                                        Dicatat pada folio tamu dan ditagihkan saat proses checkout.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Option 2: Bayar Langsung Sekarang */}
                        <div className="col-12 sm:col-6">
                            <div
                                onClick={() => setIsPaidNow(true)}
                                className={`cursor-pointer p-3 border-round-xl border-2 transition-all transition-duration-150 h-full flex align-items-start gap-3 ${
                                    isPaidNow
                                        ? 'shadow-2 surface-0'
                                        : 'surface-card border-surface hover:surface-100'
                                }`}
                                style={{
                                    borderColor: isPaidNow ? 'var(--primary-color, #10b981)' : '#e2e8f0',
                                    backgroundColor: isPaidNow ? 'rgba(16, 185, 129, 0.06)' : undefined
                                }}
                            >
                                <div
                                    className={`w-2.5rem h-2.5rem border-round-lg flex align-items-center justify-content-center flex-shrink-0 ${
                                        isPaidNow ? 'bg-primary text-white' : 'surface-200 text-600'
                                    }`}
                                >
                                    <i className="pi pi-wallet text-base"></i>
                                </div>
                                <div className="flex-1">
                                    <div className="flex align-items-center justify-content-between">
                                        <span className="font-bold text-sm text-900">Bayar Langsung (Lunas)</span>
                                        <span
                                            className={`w-1rem h-1rem border-circle border-2 flex align-items-center justify-content-center text-xs ${
                                                isPaidNow ? 'border-primary bg-primary text-white' : 'border-400'
                                            }`}
                                        >
                                            {isPaidNow && '✓'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-600 mt-1 mb-0 line-height-2">
                                        Tamu membayar lunas di muka saat menerima fasilitas/layanan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Jika Bayar Langsung, Tampilkan Panel Kasir & Metode Pembayaran */}
                    {isPaidNow && (
                        <div className="surface-50 border-round-xl p-3 mt-3 border-1 surface-border">
                            <div className="grid">
                                <div className="col-12 md:col-6">
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
                                        className="w-full text-sm"
                                    />
                                </div>
                                <div className="col-12 md:col-6">
                                    <label className="text-xs font-semibold text-700 block mb-1">
                                        Nomor Referensi Transaksi (Opsional)
                                    </label>
                                    <InputText
                                        value={referenceNo}
                                        onChange={(e) => setReferenceNo(e.target.value)}
                                        placeholder="No Trace / Ref / Struk EDC"
                                        className="w-full text-sm"
                                    />
                                </div>
                                {paymentMethod === 'cash' && (
                                    <div className="col-12">
                                        <div className="surface-0 p-2 border-round-lg border-1 surface-border text-xs flex align-items-center gap-2">
                                            <i className="pi pi-clock text-primary"></i>
                                            <span>
                                                Shift Kasir Kas Masuk:{' '}
                                                {shiftAktif ? (
                                                    <strong className="text-green-600">
                                                        {shiftAktif.kode_cashier_shift} ({shiftAktif.nama_shift || 'Shift Aktif'})
                                                    </strong>
                                                ) : (
                                                    <strong className="text-red-500 font-semibold">
                                                        ⚠️ Belum ada shift kasir dibuka! Wajib buka shift kasir terlebih dahulu.
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
            </div>
        </Dialog>
    );
};

export default DialogTambahFasilitas;
