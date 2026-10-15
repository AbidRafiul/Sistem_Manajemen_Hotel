'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Dropdown } from 'primereact/dropdown';
import { RadioButton } from 'primereact/radiobutton';
import { Tag } from 'primereact/tag';
import postData from '@/lib/axios/postData';
import { apiFasilitasAdd, apiFasilitasData, apiShiftCurrent } from './endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import PaymentMethodSelector from '@/app/components/payment/PaymentMethodSelector';
import { buildStandardReferenceNo } from '@/lib/tools/paymentTools';

const formatUnitLabel = (unit?: string) => {
    if (!unit) return '/ layanan';
    const clean = unit.trim().replace(/^\/+/, '').trim();
    return `/ ${clean}`;
};

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
        icon: 'pi pi-key',
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
        icon: 'pi pi-heart',
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
        icon: 'pi pi-star',
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
        icon: 'pi pi-gift',
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
        icon: 'pi pi-heart-fill',
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
        icon: 'pi pi-compass',
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
        icon: 'pi pi-bell',
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
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris' | 'transfer'>('cash');
    const [bankName, setBankName] = useState<string>('BCA');
    const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
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
                    const lowerName = (f.name || '').toLowerCase();
                    let icon = 'pi pi-building';
                    if (lowerName.includes('mobil') || lowerName.includes('parkir') || lowerName.includes('shuttle') || lowerName.includes('antar') || lowerName.includes('transport')) {
                        icon = 'pi pi-car';
                    } else if (lowerName.includes('bed') || lowerName.includes('kasur') || lowerName.includes('bantal') || lowerName.includes('linen')) {
                        icon = 'pi pi-box';
                    } else if (lowerName.includes('makan') || lowerName.includes('breakfast') || lowerName.includes('kopi') || lowerName.includes('snack') || lowerName.includes('resto') || lowerName.includes('sarapan')) {
                        icon = 'pi pi-coffee';
                    } else if (lowerName.includes('laundry') || lowerName.includes('cuci') || lowerName.includes('setrika')) {
                        icon = 'pi pi-sync';
                    } else if (lowerName.includes('meeting') || lowerName.includes('ruang') || lowerName.includes('rapat') || lowerName.includes('bisnis')) {
                        icon = 'pi pi-briefcase';
                    } else if (lowerName.includes('check') || lowerName.includes('jam') || lowerName.includes('waktu')) {
                        icon = 'pi pi-clock';
                    } else if (lowerName.includes('gift') || lowerName.includes('ulang tahun') || lowerName.includes('birthday') || lowerName.includes('surprise')) {
                        icon = 'pi pi-gift';
                    } else if (lowerName.includes('romantis') || lowerName.includes('honeymoon') || lowerName.includes('cinta')) {
                        icon = 'pi pi-heart-fill';
                    } else if (lowerName.includes('sepeda') || lowerName.includes('wisata') || lowerName.includes('tour')) {
                        icon = 'pi pi-compass';
                    } else if (lowerName.includes('bell') || lowerName.includes('room service') || lowerName.includes('layanan')) {
                        icon = 'pi pi-bell';
                    } else if (lowerName.includes('pet') || lowerName.includes('hewan')) {
                        icon = 'pi pi-heart';
                    } else if (isAmenity) {
                        icon = 'pi pi-sparkles';
                    }

                    return {
                        id: f.kode_fasilitas || f.name,
                        kode_fasilitas: f.kode_fasilitas || `FAS-0${21 + idx}`,
                        nama: f.name,
                        harga: parseFloat(f.harga || 0) || 50000,
                        charge_type: 'other',
                        category: isAmenity ? ('amenity' as const) : ('fasilitas' as const),
                        categoryLabel: f.kategori || (isAmenity ? 'Amenity Kamar' : 'Fasilitas Hotel'),
                        icon,
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
                kode_cashier_shift: shiftAktif?.kode_cashier_shift || undefined,
                is_paid_now: isPaidNow
            };

            if (isPaidNow) {
                payload.payment_method = paymentMethod;
                payload.bank_name = (paymentMethod === 'card' || paymentMethod === 'transfer') ? bankName : undefined;
                payload.card_type = paymentMethod === 'card' ? cardType : undefined;
                payload.kode_cashier_shift = shiftAktif?.kode_cashier_shift || undefined;
                payload.reference_no = buildStandardReferenceNo(paymentMethod, referenceNo, bankName, cardType) || undefined;
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
                    <div className="w-3rem h-3rem border-round-xl bg-primary-50 text-primary border-1 border-primary-200 shadow-1 flex align-items-center justify-content-center flex-shrink-0">
                        <i className="pi pi-plus-circle text-2xl" style={{ display: 'inline-flex' }}></i>
                    </div>
                    <div className="flex flex-column justify-content-center">
                        <span className="font-bold text-lg md:text-xl text-900 line-height-2">
                            Tambah Fasilitas / Layanan Kamar
                        </span>
                        <span className="text-xs text-500 font-normal mt-1">
                            Pilihan add-ons &amp; fasilitas tambahan untuk dibebankan ke kamar tamu
                        </span>
                    </div>
                </div>
            }
            style={{ width: '95vw', maxWidth: '1080px' }}
            contentStyle={{ overflowX: 'hidden', overflowY: 'auto', maxHeight: '82vh', padding: '1.25rem 1.5rem' }}
            modal
            footer={
                <div className="flex justify-content-between align-items-center flex-wrap gap-3 pt-3 border-top-1 surface-border">
                    <div className="flex align-items-baseline gap-2 flex-wrap">
                        <span className="text-xs text-color-secondary font-bold tracking-wider uppercase">
                            Total Biaya:
                        </span>
                        <span className="font-bold text-xl text-primary font-mono">
                            Rp {grandTotal.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-500 font-medium">
                            ({totalUnits} unit layanan dipilih)
                        </span>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <Button
                            type="button"
                            label="Batal"
                            icon="pi pi-times"
                            className="p-button-outlined p-button-secondary text-sm font-semibold px-3.5"
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
                <div className="surface-card border-round-xl border-1 surface-border p-3 shadow-sm">
                    <div className="grid align-items-center">
                        <div className="col-12 sm:col-7">
                            <span className="text-xs text-color-secondary uppercase font-bold tracking-wider block mb-1">
                                Tamu &amp; Kamar
                            </span>
                            <div className="font-bold text-base text-900 flex align-items-center gap-2 flex-wrap">
                                <span className="bg-primary-50 text-primary border-round-md px-2.5 py-1 font-bold text-sm border-1 border-primary-100">
                                    Kamar {roomData?.nomor_kamar || '-'}
                                </span>
                                <span className="text-900 font-semibold">{roomData?.guest_name || 'Tamu In-House'}</span>
                            </div>
                            <div className="text-xs text-700 flex align-items-center gap-1.5 mt-2">
                                <i className="pi pi-tag text-color-secondary text-xs" style={{ display: 'inline-flex', verticalAlign: 'middle' }}></i>
                                <span>Nomor Folio:</span>
                                <strong className="text-primary font-mono font-bold tracking-wide">
                                    {roomData?.kode_folio || roomData?.kode_reservation || '-'}
                                </strong>
                            </div>
                        </div>
                        <div className="col-12 sm:col-5 text-left sm:text-right mt-2 sm:mt-0 flex flex-column sm:align-items-end">
                            <span className="text-xs text-color-secondary uppercase font-bold tracking-wider block mb-1">
                                Status Tagihan
                            </span>
                            <div>
                                <Tag
                                    severity={roomData?.billing_status === 'settled' ? 'success' : 'warning'}
                                    value={roomData?.billing_status === 'settled' ? 'Lunas' : `Saldo: Rp ${(roomData?.balance || 0).toLocaleString('id-ID')}`}
                                    className="text-xs font-bold px-3 py-1.5 border-round-lg shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Subheader & Filter Row */}
                <div className="flex align-items-center justify-content-between flex-wrap gap-2 pt-1">
                    <div className="flex align-items-center gap-2.5">
                        <div className="w-2rem h-2rem border-round-lg bg-primary-50 text-primary flex align-items-center justify-content-center flex-shrink-0 border-1 border-primary-100">
                            <i className="pi pi-shopping-bag text-sm" style={{ display: 'inline-flex' }}></i>
                        </div>
                        <div className="flex align-items-baseline gap-2">
                            <span className="font-bold text-900 text-base">
                                Pilihan Add-ons &amp; Fasilitas
                            </span>
                            <span className="text-xs text-500 font-normal hidden sm:inline">
                                (Biaya masuk ke folio kamar tamu)
                            </span>
                        </div>
                    </div>

                    {/* Category Filter Buttons */}
                    <div className="flex align-items-center gap-2">
                        <Button
                            type="button"
                            icon="pi pi-th-large"
                            label={`Semua (${availableServices.length})`}
                            className={`p-button-sm px-3 py-2 text-xs border-round-lg font-semibold transition-all ${
                                filterCategory === 'all'
                                    ? 'p-button-primary shadow-1'
                                    : 'p-button-outlined p-button-secondary surface-0'
                            }`}
                            style={{ height: '34px' }}
                            onClick={() => setFilterCategory('all')}
                        />
                        <Button
                            type="button"
                            icon="pi pi-building"
                            label={`Fasilitas (${countFasilitas})`}
                            className={`p-button-sm px-3 py-2 text-xs border-round-lg font-semibold transition-all ${
                                filterCategory === 'fasilitas'
                                    ? 'p-button-primary shadow-1'
                                    : 'p-button-outlined p-button-secondary surface-0'
                            }`}
                            style={{ height: '34px' }}
                            onClick={() => setFilterCategory('fasilitas')}
                        />
                        <Button
                            type="button"
                            icon="pi pi-sparkles"
                            label={`Amenity (${countAmenity})`}
                            className={`p-button-sm px-3 py-2 text-xs border-round-lg font-semibold transition-all ${
                                filterCategory === 'amenity'
                                    ? 'p-button-primary shadow-1'
                                    : 'p-button-outlined p-button-secondary surface-0'
                            }`}
                            style={{ height: '34px' }}
                            onClick={() => setFilterCategory('amenity')}
                        />
                    </div>
                </div>

                {/* Search Bar Input */}
                <div className="relative w-full">
                    <IconField iconPosition="left" className="w-full">
                        <InputIcon className="pi pi-search text-400" />
                        <InputText
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama fasilitas, kode, atau kategori add-on..."
                            className="w-full text-sm border-round-lg pr-6"
                            style={{ height: '40px' }}
                        />
                    </IconField>
                    {searchQuery && (
                        <Button
                            type="button"
                            icon="pi pi-times"
                            className="p-button-rounded p-button-text p-button-secondary p-button-sm absolute"
                            style={{ right: '8px', top: '50%', transform: 'translateY(-50%)', width: '26px', height: '26px' }}
                            onClick={() => setSearchQuery('')}
                        />
                    )}
                </div>

                {/* 3. Grid Kartu Fasilitas 3 Kolom */}
                <div
                    className="overflow-y-auto pr-1"
                    style={{
                        maxHeight: '400px',
                        scrollbarWidth: 'thin'
                    }}
                >
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
                                                    ? 'border-primary shadow-2 bg-primary-50'
                                                    : 'surface-border hover:border-300 hover:shadow-1'
                                            }`}
                                        >
                                            <div>
                                                {/* Card Header: Category Badge & Code */}
                                                <div className="flex align-items-center justify-content-between gap-2 mb-2.5">
                                                    <Tag
                                                        severity={item.category === 'amenity' ? 'warning' : 'info'}
                                                        value={item.category === 'amenity' ? 'Amenity' : 'Fasilitas'}
                                                        className="text-xs px-2.5 py-0.5 border-round font-semibold"
                                                    />
                                                    <span className="text-xs text-color-secondary font-mono font-medium">
                                                        {item.kode_fasilitas}
                                                    </span>
                                                </div>

                                                {/* Card Body: Icon + Title & Category */}
                                                <div className="flex align-items-start gap-2.5 mb-2.5">
                                                    <div
                                                        className="flex align-items-center justify-content-center border-round-xl flex-shrink-0 mt-0.5"
                                                        style={{
                                                            width: '38px',
                                                            height: '38px',
                                                            background: isSelected ? 'var(--primary-100, #dcfce7)' : 'var(--surface-100)',
                                                            color: isSelected ? 'var(--primary-color)' : 'var(--text-color-secondary)',
                                                            transition: 'background 0.15s, color 0.15s'
                                                        }}
                                                    >
                                                        <i className={item.icon} style={{ fontSize: '1.15rem', display: 'inline-flex' }}></i>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div
                                                            className="font-bold text-sm text-900 line-height-2"
                                                            title={item.nama}
                                                            style={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                minHeight: '2.5rem'
                                                            }}
                                                        >
                                                            {item.nama}
                                                        </div>
                                                        <div className="text-xs text-500 mt-1 text-overflow-ellipsis overflow-hidden white-space-nowrap">
                                                            {item.categoryLabel || (item.category === 'amenity' ? 'Amenity Tambahan' : 'Layanan Hotel')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Pricing */}
                                                <div className="flex align-items-baseline gap-1.5 mb-2">
                                                    <span className="font-bold text-base text-primary font-mono">
                                                        Rp {item.harga.toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-xs text-color-secondary font-normal">
                                                        {formatUnitLabel(item.unit_label)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Controls & Subtotal Footer */}
                                            <div className="flex align-items-center justify-content-between pt-2.5 border-top-1 surface-border mt-2">
                                                <div className="text-xs">
                                                    {isSelected && subtotal > 0 ? (
                                                        <div className="flex flex-column">
                                                            <span className="text-color-secondary font-medium" style={{ fontSize: '10px' }}>
                                                                SUBTOTAL
                                                            </span>
                                                            <span className="text-primary font-bold font-mono text-sm">
                                                                Rp {subtotal.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-color-secondary font-medium">Pilih jumlah</span>
                                                    )}
                                                </div>

                                                {/* Stepper Button */}
                                                <div className="flex align-items-center gap-1 surface-50 border-1 surface-border border-round-lg p-1">
                                                    <Button
                                                        type="button"
                                                        icon="pi pi-minus"
                                                        className="p-button-text p-button-secondary p-button-sm p-button-icon-only flex align-items-center justify-content-center"
                                                        style={{ width: '26px', height: '26px', minWidth: '26px' }}
                                                        onClick={() => updateFacilityQty(item, qty - 1)}
                                                        disabled={qty <= 0}
                                                    />
                                                    <span
                                                        className="font-bold text-center text-900 text-sm font-mono"
                                                        style={{ minWidth: '24px' }}
                                                    >
                                                        {qty}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        icon="pi pi-plus"
                                                        className="p-button-text p-button-primary p-button-sm p-button-icon-only flex align-items-center justify-content-center"
                                                        style={{ width: '26px', height: '26px', minWidth: '26px' }}
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
                <div className="surface-card border-round-xl border-1 surface-border p-3.5 shadow-sm">
                    <label className="text-xs font-bold text-color-secondary uppercase tracking-wider block mb-2.5">
                        Opsi Penagihan Biaya:
                    </label>
                    <div className="flex flex-column gap-2">
                        <div
                            className={`flex align-items-center gap-3 cursor-pointer p-2.5 border-round-lg border-1 transition-colors ${
                                !isPaidNow
                                    ? 'bg-primary-50 border-primary-200'
                                    : 'surface-0 border-transparent hover:surface-50'
                            }`}
                            onClick={() => setIsPaidNow(false)}
                        >
                            <RadioButton
                                inputId="fasilitasChargeToRoom"
                                name="fasilitasPaymentOption"
                                checked={!isPaidNow}
                                onChange={() => setIsPaidNow(false)}
                            />
                            <label htmlFor="fasilitasChargeToRoom" className="cursor-pointer text-sm font-semibold text-900 flex-1 m-0">
                                Bebankan ke Tagihan Kamar (Charge to Room) —{' '}
                                <span className="text-color-secondary font-normal text-xs">
                                    Masuk ke folio tamu, dilunasi saat checkout
                                </span>
                            </label>
                        </div>

                        <div
                            className={`flex align-items-center gap-3 cursor-pointer p-2.5 border-round-lg border-1 transition-colors ${
                                isPaidNow
                                    ? 'bg-primary-50 border-primary-200'
                                    : 'surface-0 border-transparent hover:surface-50'
                            }`}
                            onClick={() => setIsPaidNow(true)}
                        >
                            <RadioButton
                                inputId="fasilitasPayNow"
                                name="fasilitasPaymentOption"
                                checked={isPaidNow}
                                onChange={() => setIsPaidNow(true)}
                            />
                            <label htmlFor="fasilitasPayNow" className="cursor-pointer text-sm font-semibold text-900 flex-1 m-0">
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
                            <PaymentMethodSelector
                                value={{
                                    method: paymentMethod,
                                    bank_name: bankName,
                                    card_type: cardType,
                                    reference_no: referenceNo
                                }}
                                onChange={(detail) => {
                                    setPaymentMethod(detail.method);
                                    if (detail.bank_name) setBankName(detail.bank_name);
                                    if (detail.card_type) setCardType(detail.card_type);
                                    setReferenceNo(detail.reference_no || '');
                                }}
                                totalAmount={grandTotal}
                                compact={true}
                            />

                            <div className="mt-2.5 pt-2 border-top-1 surface-border text-xs text-700 flex align-items-center gap-2">
                                <i className="pi pi-clock text-primary" style={{ display: 'inline-flex' }}></i>
                                <span>
                                    Shift Kasir Penerima:{' '}
                                    {shiftAktif ? (
                                        <strong className="text-green-600 font-semibold">
                                            {shiftAktif.kode_cashier_shift} ({shiftAktif.nama_shift || 'Shift Aktif'})
                                        </strong>
                                    ) : (
                                        <strong className="text-red-500 font-semibold">Belum Ada Shift Kasir Terbuka!</strong>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dialog>
    );
};

export default DialogTambahFasilitas;
