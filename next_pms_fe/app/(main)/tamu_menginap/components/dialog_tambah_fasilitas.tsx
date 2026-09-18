'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { RadioButton } from 'primereact/radiobutton';
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
    kode_fasilitas: string;
    nama: string;
    harga: number;
    charge_type: string;
    category: 'fasilitas' | 'amenity';
    categoryLabel: string;
    icon: string;
    unit_label?: string;
}

interface CartItem {
    id: string;
    kode_fasilitas: string;
    nama: string;
    harga: number;
    charge_type: string;
    qty: number;
}

const DEFAULT_PRESETS: ServicePreset[] = [
    {
        id: 'early_checkin',
        kode_fasilitas: 'FAS-011',
        nama: 'Early Check-In (mulai 06:00)',
        harga: 150000,
        charge_type: 'room',
        category: 'fasilitas',
        categoryLabel: 'Layanan Kamar',
        icon: 'pi pi-building',
        unit_label: '/ layanan'
    },
    {
        id: 'pet_friendly',
        kode_fasilitas: 'FAS-020',
        nama: 'Pet-Friendly Room Surcharge',
        harga: 100000,
        charge_type: 'room',
        category: 'fasilitas',
        categoryLabel: 'Layanan Kamar',
        icon: 'pi pi-building',
        unit_label: '/ layanan'
    },
    {
        id: 'baby_crib',
        kode_fasilitas: 'FAS-019',
        nama: 'Baby Crib / Box Bayi',
        harga: 75000,
        charge_type: 'room',
        category: 'amenity',
        categoryLabel: 'Perlengkapan Bayi',
        icon: 'pi pi-building',
        unit_label: '/ layanan'
    },
    {
        id: 'valet_parking',
        kode_fasilitas: 'FAS-017',
        nama: 'Valet Parking',
        harga: 25000,
        charge_type: 'other',
        category: 'fasilitas',
        categoryLabel: 'Parkir & Kendaraan',
        icon: 'pi pi-car',
        unit_label: '/ layanan'
    },
    {
        id: 'meeting_room',
        kode_fasilitas: 'FAS-016',
        nama: 'Business Center & Meeting Room',
        harga: 500000,
        charge_type: 'other',
        category: 'fasilitas',
        categoryLabel: 'Fasilitas Bisnis',
        icon: 'pi pi-briefcase',
        unit_label: '/ layanan'
    },
    {
        id: 'birthday_setup',
        kode_fasilitas: 'FAS-014',
        nama: 'Paket Birthday Surprise Setup',
        harga: 250000,
        charge_type: 'other',
        category: 'fasilitas',
        categoryLabel: 'Dekorasi & Event',
        icon: 'pi pi-building',
        unit_label: '/ layanan'
    },
    {
        id: 'honeymoon_setup',
        kode_fasilitas: 'FAS-013',
        nama: 'Paket Romantic Honeymoon Setup',
        harga: 350000,
        charge_type: 'other',
        category: 'fasilitas',
        categoryLabel: 'Dekorasi & Event',
        icon: 'pi pi-building',
        unit_label: '/ layanan'
    },
    {
        id: 'sewa_sepeda',
        kode_fasilitas: 'FAS-012',
        nama: 'Sewa Sepeda (per hari)',
        harga: 50000,
        charge_type: 'other',
        category: 'fasilitas',
        categoryLabel: 'Rekreasi',
        icon: 'pi pi-building',
        unit_label: '/ layanan'
    },
    {
        id: 'late_checkout',
        kode_fasilitas: 'FAS-010',
        nama: 'Late Checkout (s.d. 18:00)',
        harga: 200000,
        charge_type: 'room',
        category: 'fasilitas',
        categoryLabel: 'Layanan Kamar',
        icon: 'pi pi-clock',
        unit_label: '/ reservasi'
    },
    {
        id: 'extra_bed',
        kode_fasilitas: 'FAS-009',
        nama: 'Extra Bed / Tempat Tidur Tambahan',
        harga: 125000,
        charge_type: 'room',
        category: 'fasilitas',
        categoryLabel: 'Kamar & Kasur',
        icon: 'pi pi-box',
        unit_label: '/ unit'
    },
    {
        id: 'breakfast',
        kode_fasilitas: 'FAS-008',
        nama: 'Sarapan Pagi (Breakfast Buffet)',
        harga: 85000,
        charge_type: 'restaurant',
        category: 'fasilitas',
        categoryLabel: 'Restoran & F&B',
        icon: 'pi pi-coffee',
        unit_label: '/ orang'
    },
    {
        id: 'room_service_24',
        kode_fasilitas: 'FAS-007',
        nama: 'Room Service 24 Jam',
        harga: 35000,
        charge_type: 'restaurant',
        category: 'fasilitas',
        categoryLabel: 'Restoran & F&B',
        icon: 'pi pi-building',
        unit_label: '/ layanan'
    },
    {
        id: 'laundry_express',
        kode_fasilitas: 'FAS-006',
        nama: 'Laundry Regular (Express)',
        harga: 50000,
        charge_type: 'laundry',
        category: 'fasilitas',
        categoryLabel: 'Laundry & Binatu',
        icon: 'pi pi-sync',
        unit_label: '/ layanan'
    },
    {
        id: 'minibar_snack',
        kode_fasilitas: 'FAS-005',
        nama: 'Minibar & Snack Kamar',
        harga: 35000,
        charge_type: 'restaurant',
        category: 'amenity',
        categoryLabel: 'Minibar & Snack',
        icon: 'pi pi-shopping-bag',
        unit_label: '/ unit'
    },
    {
        id: 'shuttle_airport',
        kode_fasilitas: 'FAS-004',
        nama: 'Antar Jemput Bandara / Transport',
        harga: 200000,
        charge_type: 'other',
        category: 'fasilitas',
        categoryLabel: 'Transportasi',
        icon: 'pi pi-car',
        unit_label: '/ trip'
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
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<'all' | 'fasilitas' | 'amenity'>('all');

    // Cart Items State (Multi-item supported by backend items array)
    const [cartItems, setCartItems] = useState<CartItem[]>([
        {
            id: DEFAULT_PRESETS[0].id,
            kode_fasilitas: DEFAULT_PRESETS[0].kode_fasilitas,
            nama: DEFAULT_PRESETS[0].nama,
            harga: DEFAULT_PRESETS[0].harga,
            charge_type: DEFAULT_PRESETS[0].charge_type,
            qty: 1
        }
    ]);

    // Payment State
    const [isPaidNow, setIsPaidNow] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [referenceNo, setReferenceNo] = useState('');
    const [shiftAktif, setShiftAktif] = useState<any>(null);

    // Calculate totals
    const grandTotal = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.qty || 1) * (item.harga || 0), 0);
    }, [cartItems]);

    const totalUnits = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);
    }, [cartItems]);

    const countFasilitas = useMemo(() => {
        return availableServices.filter((s) => s.category === 'fasilitas').length;
    }, [availableServices]);

    const countAmenity = useMemo(() => {
        return availableServices.filter((s) => s.category === 'amenity').length;
    }, [availableServices]);

    const loadMasterFacilities = async () => {
        try {
            const res = await postData(apiFasilitasData, { perPage: 100 });
            if (res?.data?.data && Array.isArray(res.data.data)) {
                const masterItems: ServicePreset[] = res.data.data.map((f: any, idx: number) => {
                    const isAmenity =
                        (f.kategori || f.tipe || '').toLowerCase().includes('amenit') ||
                        (f.name || '').toLowerCase().includes('amenit');
                    return {
                        id: f.kode_fasilitas || f.name,
                        kode_fasilitas: f.kode_fasilitas || `FAS-0${21 + idx}`,
                        nama: f.name,
                        harga: parseFloat(f.harga || 0) || 50000,
                        charge_type: 'other',
                        category: isAmenity ? ('amenity' as const) : ('fasilitas' as const),
                        categoryLabel: f.kategori || 'Fasilitas Hotel',
                        icon: 'pi pi-building',
                        unit_label: '/ layanan'
                    };
                });

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
            setSearchQuery('');
            setFilterCategory('all');
            setCartItems([
                {
                    id: DEFAULT_PRESETS[0].id,
                    kode_fasilitas: DEFAULT_PRESETS[0].kode_fasilitas,
                    nama: DEFAULT_PRESETS[0].nama,
                    harga: DEFAULT_PRESETS[0].harga,
                    charge_type: DEFAULT_PRESETS[0].charge_type,
                    qty: 1
                }
            ]);
            setIsPaidNow(false);
            setPaymentMethod('cash');
            setReferenceNo('');
        }
    }, [visible]);

    const updateFacilityQty = (item: ServicePreset, newQty: number) => {
        const qty = Math.max(0, newQty);
        setCartItems((prev) => {
            const exists = prev.find((c) => c.id === item.id);
            if (qty === 0) {
                return prev.filter((c) => c.id !== item.id);
            }
            if (exists) {
                return prev.map((c) => (c.id === item.id ? { ...c, qty } : c));
            } else {
                return [
                    ...prev,
                    {
                        id: item.id,
                        kode_fasilitas: item.kode_fasilitas,
                        nama: item.nama,
                        harga: item.harga,
                        charge_type: item.charge_type,
                        qty
                    }
                ];
            }
        });
    };

    const filteredItems = useMemo(() => {
        return availableServices.filter((item) => {
            const matchCategory = filterCategory === 'all' || item.category === filterCategory;
            const matchSearch =
                !searchQuery.trim() ||
                item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.kode_fasilitas.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCategory && matchSearch;
        });
    }, [availableServices, filterCategory, searchQuery]);

    const handleSubmit = async () => {
        if (!roomData?.kode_reservasi_room) {
            showError(toast, 'Data kamar reservasi tidak valid.');
            return;
        }
        if (cartItems.length === 0) {
            showError(toast, 'Silakan pilih minimal satu fasilitas atau layanan kamar.');
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
                items: cartItems.map((item) => ({
                    kode_fasilitas: item.id,
                    nama: item.nama,
                    qty: item.qty,
                    harga: item.harga,
                    charge_type: item.charge_type || 'other'
                })),
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
                <div className="flex align-items-center gap-2.5">
                    <i className="pi pi-plus-circle text-primary text-xl"></i>
                    <div>
                        <span className="font-bold text-lg text-900 block line-height-2">
                            Tambah Fasilitas / Layanan Kamar
                        </span>
                        <span className="text-xs text-500 font-normal">
                            Pilihan add-ons &amp; fasilitas tambahan untuk dibebankan ke kamar tamu
                        </span>
                    </div>
                </div>
            }
            style={{ width: '95vw', maxWidth: '1080px' }}
            contentStyle={{ overflowX: 'hidden', padding: '1.25rem 1.5rem' }}
            modal
            footer={
                <div className="flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top-1 surface-border">
                    <div className="flex align-items-center gap-2">
                        <span className="text-xs text-color-secondary uppercase font-bold">Total Biaya:</span>
                        <span className="font-bold text-xl text-primary font-mono">
                            Rp {grandTotal.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-500 font-medium">
                            ({totalUnits} unit layanan dipilih)
                        </span>
                    </div>
                    <div className="flex justify-content-end gap-2">
                        <Button
                            type="button"
                            label="Batal"
                            icon="pi pi-times"
                            className="p-button-outlined p-button-secondary text-sm font-semibold px-3"
                            style={{ height: '40px' }}
                            onClick={onHide}
                            disabled={submitting}
                        />
                        <Button
                            type="button"
                            label={
                                isPaidNow
                                    ? `Bayar Langsung (Rp ${grandTotal.toLocaleString('id-ID')})`
                                    : `Bebankan ke Kamar (Rp ${grandTotal.toLocaleString('id-ID')})`
                            }
                            icon={isPaidNow ? 'pi pi-check' : 'pi pi-file-edit'}
                            className={`text-sm font-semibold px-4 ${isPaidNow ? 'p-button-success' : 'p-button-primary'}`}
                            style={{ height: '40px' }}
                            onClick={handleSubmit}
                            loading={submitting}
                            disabled={cartItems.length === 0}
                        />
                    </div>
                </div>
            }
        >
            <div className="flex flex-column gap-3">
                {/* 1. Context Banner: Tamu & Kamar */}
                <div className="surface-card border-round-xl border-1 surface-border p-3">
                    <div className="grid align-items-center">
                        <div className="col-12 sm:col-7">
                            <span className="text-xs text-color-secondary uppercase font-bold block">Tamu &amp; Kamar</span>
                            <div className="font-bold text-base text-900 mt-1 flex align-items-center gap-2 flex-wrap">
                                <span className="bg-primary-50 text-primary border-round px-2 py-0.5 font-bold text-sm">
                                    Kamar {roomData?.nomor_kamar || '-'}
                                </span>
                                <span>{roomData?.guest_name || 'Tamu In-House'}</span>
                            </div>
                            <span className="text-xs text-700 block mt-1">
                                <i className="pi pi-tag mr-1 text-color-secondary"></i>
                                Nomor Folio: <strong className="text-primary font-mono">{roomData?.kode_folio || roomData?.kode_reservation || '-'}</strong>
                            </span>
                        </div>
                        <div className="col-12 sm:col-5 text-left sm:text-right mt-2 sm:mt-0">
                            <span className="text-xs text-color-secondary uppercase font-bold block">Status Tagihan</span>
                            <div className="mt-1">
                                <Tag
                                    severity={roomData?.billing_status === 'settled' ? 'success' : 'warning'}
                                    value={roomData?.billing_status === 'settled' ? 'Lunas' : `Saldo: Rp ${(roomData?.balance || 0).toLocaleString('id-ID')}`}
                                    className="text-xs font-bold px-2.5 py-1"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Subheader & Filter Row (Sesuai Referensi Foto) */}
                <div className="flex align-items-center justify-content-between flex-wrap gap-2 pt-1">
                    <div className="flex align-items-center gap-2">
                        <span className="font-bold text-900 text-base flex align-items-center gap-2">
                            <i className="pi pi-shopping-bag text-primary text-lg"></i>
                            Pilihan Add-ons &amp; Fasilitas
                        </span>
                        <span className="text-xs text-color-secondary hidden md:inline">
                            (Biaya masuk ke folio tamu)
                        </span>
                    </div>

                    {/* Category Filter Buttons */}
                    <div className="flex align-items-center gap-2">
                        <Button
                            type="button"
                            label={`Semua (${availableServices.length})`}
                            className={`p-button-sm px-3 py-1.5 text-xs border-round-lg font-semibold ${
                                filterCategory === 'all'
                                    ? 'p-button-primary shadow-1'
                                    : 'p-button-outlined p-button-secondary surface-0'
                            }`}
                            onClick={() => setFilterCategory('all')}
                        />
                        <Button
                            type="button"
                            icon="pi pi-building"
                            label={`Fasilitas (${countFasilitas})`}
                            className={`p-button-sm px-3 py-1.5 text-xs border-round-lg font-semibold ${
                                filterCategory === 'fasilitas'
                                    ? 'p-button-primary shadow-1'
                                    : 'p-button-outlined p-button-secondary surface-0'
                            }`}
                            onClick={() => setFilterCategory('fasilitas')}
                        />
                        <Button
                            type="button"
                            icon="pi pi-sparkles"
                            label={`Amenity (${countAmenity})`}
                            className={`p-button-sm px-3 py-1.5 text-xs border-round-lg font-semibold ${
                                filterCategory === 'amenity'
                                    ? 'p-button-primary shadow-1'
                                    : 'p-button-outlined p-button-secondary surface-0'
                            }`}
                            onClick={() => setFilterCategory('amenity')}
                        />
                    </div>
                </div>

                {/* Search Bar Input */}
                <div className="relative">
                    <span className="p-input-icon-left w-full">
                        <i className="pi pi-search text-400" />
                        <InputText
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama fasilitas, kode, atau kategori add-on..."
                            className="w-full text-sm p-inputtext-sm border-round-lg"
                            style={{ height: '38px', paddingLeft: '2.5rem' }}
                        />
                    </span>
                    {searchQuery && (
                        <Button
                            icon="pi pi-times"
                            className="p-button-rounded p-button-text p-button-secondary p-button-sm absolute"
                            style={{ right: '6px', top: '6px', width: '26px', height: '26px' }}
                            onClick={() => setSearchQuery('')}
                        />
                    )}
                </div>

                {/* 3. Grid Kartu Fasilitas 3 Kolom (Sesuai Persis dengan Foto Referensi) */}
                <div className="overflow-y-auto pr-1" style={{ maxHeight: '390px' }}>
                    {filteredItems.length === 0 ? (
                        <div className="p-4 border-round-xl surface-100 text-color-secondary text-center flex flex-column align-items-center justify-content-center gap-2">
                            <i className="pi pi-box text-color-secondary text-2xl"></i>
                            <span className="font-medium text-sm">
                                Tidak ada layanan add-on berbayar yang cocok dengan kriteria pencarian.
                            </span>
                        </div>
                    ) : (
                        <div className="grid">
                            {filteredItems.map((item) => {
                                const cartItem = cartItems.find((c) => c.id === item.id);
                                const qty = cartItem?.qty || 0;
                                const isSelected = qty > 0;
                                const subtotal = qty * item.harga;

                                return (
                                    <div key={item.id} className="col-12 sm:col-6 lg:col-4 p-2">
                                        <div
                                            className={`surface-card border-round-xl border-1 p-3 flex flex-column justify-content-between transition-all transition-duration-150 h-full ${
                                                isSelected
                                                    ? 'border-primary shadow-2 bg-blue-50'
                                                    : 'surface-border hover:border-300 hover:shadow-1'
                                            }`}
                                        >
                                            <div>
                                                {/* Header: Icon, Category Badge, Code, Title, Price */}
                                                <div className="flex align-items-start gap-3 mb-2">
                                                    <div
                                                        className="flex align-items-center justify-content-center border-circle flex-shrink-0"
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            background: isSelected ? 'var(--blue-100)' : 'var(--surface-100)',
                                                            color: isSelected ? 'var(--primary-color)' : 'var(--text-color-secondary)',
                                                            transition: 'background 0.15s, color 0.15s'
                                                        }}
                                                    >
                                                        <i className={item.icon} style={{ fontSize: '1.2rem' }}></i>
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="flex align-items-center justify-content-between gap-1 mb-1">
                                                            <Tag
                                                                severity={item.category === 'amenity' ? 'warning' : 'info'}
                                                                value={item.category === 'amenity' ? 'Amenity' : 'Fasilitas'}
                                                                className="text-xs px-2 py-0"
                                                            />
                                                            <span className="text-xs text-color-secondary font-mono">
                                                                {item.kode_fasilitas}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="font-bold text-sm text-overflow-ellipsis overflow-hidden white-space-nowrap"
                                                            title={item.nama}
                                                            style={{ color: isSelected ? 'var(--primary-900)' : 'var(--text-900)' }}
                                                        >
                                                            {item.nama}
                                                        </div>
                                                        <div className="text-xs text-primary font-bold mt-1">
                                                            Rp {item.harga.toLocaleString('id-ID')}{item.unit_label || ' / layanan'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <div className="text-xs text-color-secondary mb-3 line-height-2">
                                                    Layanan fasilitas hotel cabang ({item.kode_fasilitas})
                                                </div>
                                            </div>

                                            {/* Controls & Subtotal Footer */}
                                            <div className="flex align-items-center justify-content-between pt-2 border-top-1 surface-border">
                                                <div className="text-xs">
                                                    {isSelected && subtotal > 0 ? (
                                                        <span className="text-green-700 font-bold">
                                                            Subtotal: Rp {subtotal.toLocaleString('id-ID')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-color-secondary">Pilih jumlah</span>
                                                    )}
                                                </div>

                                                {/* Stepper Button Sesuai Referensi Foto */}
                                                <div
                                                    className="flex align-items-center gap-2"
                                                    style={{
                                                        border: '1px solid var(--surface-border)',
                                                        borderRadius: '8px',
                                                        padding: '2px 6px',
                                                        background: 'var(--surface-0)'
                                                    }}
                                                >
                                                    <Button
                                                        type="button"
                                                        icon="pi pi-minus"
                                                        className="p-button-text p-button-secondary p-button-sm p-0 flex align-items-center justify-content-center"
                                                        style={{ width: '26px', height: '26px' }}
                                                        onClick={() => updateFacilityQty(item, qty - 1)}
                                                        disabled={qty <= 0}
                                                    />
                                                    <span
                                                        className="font-bold text-center text-900 text-sm"
                                                        style={{ minWidth: '24px' }}
                                                    >
                                                        {qty}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        icon="pi pi-plus"
                                                        className="p-button-text p-button-primary p-button-sm p-0 flex align-items-center justify-content-center"
                                                        style={{ width: '26px', height: '26px' }}
                                                        onClick={() => updateFacilityQty(item, qty + 1)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 4. Opsi Pembayaran / Penagihan (Konsisten dengan Dialog Extend Stay) */}
                <div className="surface-card border-round-xl border-1 surface-border p-3">
                    <label className="text-xs font-bold text-color-secondary uppercase block mb-2">
                        Opsi Penagihan Biaya:
                    </label>
                    <div className="flex flex-column gap-2">
                        <div
                            className="flex align-items-center gap-2.5 cursor-pointer p-1.5 border-round-lg hover:surface-50"
                            onClick={() => setIsPaidNow(false)}
                        >
                            <RadioButton
                                inputId="fasilitasChargeToRoom"
                                name="fasilitasPaymentOption"
                                checked={!isPaidNow}
                                onChange={() => setIsPaidNow(false)}
                            />
                            <label htmlFor="fasilitasChargeToRoom" className="cursor-pointer text-sm font-semibold text-900 flex-1">
                                Bebankan ke Tagihan Kamar (Charge to Room) —{' '}
                                <span className="text-color-secondary font-normal text-xs">
                                    Masuk ke folio tamu, dilunasi saat checkout
                                </span>
                            </label>
                        </div>

                        <div
                            className="flex align-items-center gap-2.5 cursor-pointer p-1.5 border-round-lg hover:surface-50"
                            onClick={() => setIsPaidNow(true)}
                        >
                            <RadioButton
                                inputId="fasilitasPayNow"
                                name="fasilitasPaymentOption"
                                checked={isPaidNow}
                                onChange={() => setIsPaidNow(true)}
                            />
                            <label htmlFor="fasilitasPayNow" className="cursor-pointer text-sm font-semibold text-900 flex-1">
                                Bayar Lunas Sekarang (Pay on the Spot) —{' '}
                                <span className="text-green-600 font-normal text-xs">
                                    Lunas saat serah terima layanan
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Jika Bayar Langsung */}
                    {isPaidNow && (
                        <div className="surface-50 border-round-lg p-3 mt-3 border-1 surface-border">
                            <div className="grid">
                                <div className="col-12 sm:col-6">
                                    <label className="text-xs font-bold text-700 block mb-1">
                                        Metode Pembayaran <span className="text-red-500">*</span>
                                    </label>
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
                                        className="w-full text-sm"
                                    />
                                </div>
                                <div className="col-12 sm:col-6">
                                    <label className="text-xs font-bold text-700 block mb-1">
                                        Nomor Referensi (Opsional)
                                    </label>
                                    <InputText
                                        value={referenceNo}
                                        onChange={(e) => setReferenceNo(e.target.value)}
                                        placeholder="No Trace / Ref EDC / Bukti Bayar"
                                        className="w-full text-sm"
                                    />
                                </div>
                                {paymentMethod === 'cash' && (
                                    <div className="col-12">
                                        <div className="text-xs text-700 flex align-items-center gap-1.5 pt-1">
                                            <i className="pi pi-clock text-primary"></i>
                                            <span>
                                                Shift Kasir Aktif:{' '}
                                                {shiftAktif ? (
                                                    <strong className="text-green-600 font-semibold">
                                                        {shiftAktif.kode_cashier_shift} ({shiftAktif.nama_shift || 'Shift Aktif'})
                                                    </strong>
                                                ) : (
                                                    <strong className="text-red-500">Belum Ada Shift Kasir Terbuka!</strong>
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
