'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Calendar } from 'primereact/calendar';
import { formatCurrency } from '@/lib/tools/generalTools';
import { EventItem, FormikEventValues } from '../interfaces';
import postData from '@/lib/axios/postData';
import { apiEventConflictCheck } from '../endpoints';

interface EventFormDialogProps {
    visible: boolean;
    isEdit: boolean;
    initialData?: any;
    ruangOptions: any[];
    guestOptions: any[];
    corporateOptions: any[];
    hargaOptions: any[];
    onHide: () => void;
    onSubmit: (values: FormikEventValues) => void;
    submitting: boolean;
}

export const EventFormDialog: React.FC<EventFormDialogProps> = ({
    visible,
    isEdit,
    initialData,
    ruangOptions,
    guestOptions,
    corporateOptions,
    hargaOptions,
    onHide,
    onSubmit,
    submitting,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    // Form fields
    const [namaEvent, setNamaEvent] = useState('');
    const [kodeRuangEvent, setKodeRuangEvent] = useState('');
    const [kodeTamu, setKodeTamu] = useState('');
    const [kodeCorporate, setKodeCorporate] = useState('');
    const [tglMulai, setTglMulai] = useState<Date | null>(new Date());
    const [tglSelesai, setTglSelesai] = useState<Date | null>(new Date());
    const [jamMulai, setJamMulai] = useState('09:00');
    const [jamSelesai, setJamSelesai] = useState('13:00');
    const [jumlahTamu, setJumlahTamu] = useState<number>(30);
    const [layoutSetup, setLayoutSetup] = useState('theater');
    const [tipeSewa, setTipeSewa] = useState('half_day');
    const [durasiJam, setDurasiJam] = useState<number>(4);
    const [tarifSewa, setTarifSewa] = useState<number>(0);
    const [diskon, setDiskon] = useState<number>(0);
    const [pajakPersen, setPajakPersen] = useState<number>(10);
    const [serviceChargePersen, setServiceChargePersen] = useState<number>(0);
    const [depositPaid, setDepositPaid] = useState<number>(0);
    const [contactPerson, setContactPerson] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [setupBuffer, setSetupBuffer] = useState<number>(30);
    const [teardownBuffer, setTeardownBuffer] = useState<number>(30);
    const [catatanKhusus, setCatatanKhusus] = useState('');

    // Dynamic Items (F&B / Equipment)
    const [items, setItems] = useState<EventItem[]>([]);

    // Conflict Check State
    const [checkingConflict, setCheckingConflict] = useState(false);
    const [conflictResult, setConflictResult] = useState<{ checked: boolean; available: boolean; message: string } | null>(null);

    // 30-minute time slot options for clean scheduling
    const timeOptions = useMemo(() => {
        const slots: { label: string; value: string }[] = [];
        for (let h = 6; h <= 23; h++) {
            const hh = h < 10 ? `0${h}` : `${h}`;
            slots.push({ label: `${hh}:00`, value: `${hh}:00` });
            slots.push({ label: `${hh}:30`, value: `${hh}:30` });
        }
        return slots;
    }, []);

    // Layout Setup Options
    const layoutOptions = [
        { label: 'Theater Style (Kapasitas Maksimal)', value: 'theater' },
        { label: 'Classroom Style (Meja Pelatihan)', value: 'classroom' },
        { label: 'U-Shape Style (Bentuk U)', value: 'u_shape' },
        { label: 'Boardroom Style (Rapat Direksi)', value: 'boardroom' },
        { label: 'Banquet / Round Table (Meja Bundar)', value: 'banquet' },
        { label: 'Standing / Cocktail Party', value: 'standing' },
        { label: 'Hollow Square', value: 'hollow_square' },
        { label: 'Custom Layout', value: 'custom' },
    ];

    const tipeSewaOptions = [
        { label: 'Half Day (4 Jam Operasional)', value: 'half_day' },
        { label: 'Full Day (8 Jam Operasional)', value: 'full_day' },
        { label: 'Per Jam (Hourly)', value: 'per_jam' },
        { label: 'Paket Kustom (Custom Package)', value: 'custom_package' },
    ];

    // Populate when opening
    useEffect(() => {
        if (visible) {
            setSubmitted(false);
            if (isEdit && initialData) {
                setNamaEvent(initialData.nama_event || '');
                setKodeRuangEvent(initialData.kode_ruang_event || '');
                setKodeTamu(initialData.kode_tamu || '');
                setKodeCorporate(initialData.kode_corporate || '');
                setTglMulai(initialData.tgl_mulai ? new Date(initialData.tgl_mulai) : new Date());
                setTglSelesai(initialData.tgl_selesai ? new Date(initialData.tgl_selesai) : new Date());
                setJamMulai(initialData.jam_mulai ? initialData.jam_mulai.slice(0, 5) : '09:00');
                setJamSelesai(initialData.jam_selesai ? initialData.jam_selesai.slice(0, 5) : '13:00');
                setJumlahTamu(initialData.jumlah_tamu || 30);
                setLayoutSetup(initialData.layout_setup || 'theater');
                setTipeSewa(initialData.tipe_sewa || 'half_day');
                setDurasiJam(initialData.durasi_jam || 4);
                setTarifSewa(initialData.tarif_sewa || 0);
                setDiskon(initialData.diskon || 0);
                setPajakPersen(initialData.pajak_persen !== undefined ? initialData.pajak_persen : 10);
                setServiceChargePersen(initialData.service_charge_persen || 0);
                setDepositPaid(initialData.deposit_paid || 0);
                setContactPerson(initialData.contact_person || '');
                setContactPhone(initialData.contact_phone || '');
                setContactEmail(initialData.contact_email || '');
                setSetupBuffer(initialData.setup_buffer_minutes || 30);
                setTeardownBuffer(initialData.teardown_buffer_minutes || 30);
                setCatatanKhusus(initialData.catatan_khusus || '');
                setItems(initialData.items || []);
            } else {
                setNamaEvent('');
                setKodeRuangEvent(ruangOptions[0]?.value || '');
                setKodeTamu(guestOptions[0]?.value || '');
                setKodeCorporate('');
                setTglMulai(new Date());
                setTglSelesai(new Date());
                setJamMulai('09:00');
                setJamSelesai('13:00');
                setJumlahTamu(30);
                setLayoutSetup('theater');
                setTipeSewa('half_day');
                setDurasiJam(4);
                setTarifSewa(2500000);
                setDiskon(0);
                setPajakPersen(10);
                setServiceChargePersen(0);
                setDepositPaid(0);
                setContactPerson('');
                setContactPhone('');
                setContactEmail('');
                setSetupBuffer(30);
                setTeardownBuffer(30);
                setCatatanKhusus('');
                setItems([
                    {
                        item_type: 'fnb',
                        item_name: 'Coffee Break Standard (Snack + Kopi/Teh)',
                        qty: 30,
                        unit: 'pax',
                        harga_satuan: 25000,
                        subtotal: 750000,
                        catatan: 'Disajikan jam 10:00 WIB',
                    },
                ]);
            }
            setConflictResult(null);
            setActiveIndex(0);
        }
    }, [visible, isEdit, initialData, ruangOptions, guestOptions]);

    // Auto-update tarif sewa when choosing room or rental type
    useEffect(() => {
        if (!isEdit && kodeRuangEvent && hargaOptions.length > 0) {
            const matchedHarga = hargaOptions.find(
                (h) => h.kode_ruang_event === kodeRuangEvent && h.tipe_sewa === tipeSewa
            );
            if (matchedHarga && matchedHarga.harga) {
                setTarifSewa(parseFloat(matchedHarga.harga));
            }
        }
    }, [kodeRuangEvent, tipeSewa, hargaOptions, isEdit]);

    // Auto-fill PIC name from guest
    useEffect(() => {
        if (kodeTamu && !contactPerson) {
            const matchedGuest = guestOptions.find((g) => g.value === kodeTamu);
            if (matchedGuest) {
                setContactPerson(matchedGuest.label ? matchedGuest.label.split(' - ')[0] : '');
                if (matchedGuest.phone) setContactPhone(matchedGuest.phone);
                if (matchedGuest.email) setContactEmail(matchedGuest.email);
            }
        }
    }, [kodeTamu]);

    // Active room info
    const selectedRoomMeta = useMemo(() => {
        return ruangOptions.find((r) => r.value === kodeRuangEvent);
    }, [ruangOptions, kodeRuangEvent]);

    // Financial Calculation
    const totalBiayaTambahan = items.reduce((acc, curr) => acc + (parseFloat(curr.subtotal as any) || 0), 0);
    const baseAmount = Math.max(0, tarifSewa + totalBiayaTambahan - diskon);
    const nominalService = Math.round(baseAmount * (serviceChargePersen / 100));
    const nominalPajak = Math.round((baseAmount + nominalService) * (pajakPersen / 100));
    const grandTotal = baseAmount + nominalService + nominalPajak;
    const sisaTagihan = Math.max(0, grandTotal - depositPaid);

    // Conflict Check Handler
    const handleCheckConflict = async () => {
        if (!kodeRuangEvent || !tglMulai || !jamMulai || !jamSelesai) {
            setConflictResult({
                checked: true,
                available: false,
                message: 'Silakan pilih ruang event, tanggal, dan jam terlebih dahulu',
            });
            return;
        }

        setCheckingConflict(true);
        try {
            const startDateStr = tglMulai.toISOString().slice(0, 10);
            const endDateStr = tglSelesai ? tglSelesai.toISOString().slice(0, 10) : startDateStr;

            const res = await postData(apiEventConflictCheck, {
                kode_ruang_event: kodeRuangEvent,
                tgl_mulai: startDateStr,
                tgl_selesai: endDateStr,
                jam_mulai: jamMulai,
                jam_selesai: jamSelesai,
                setup_buffer_minutes: setupBuffer,
                teardown_buffer_minutes: teardownBuffer,
                exclude_kode_reservasi_event: isEdit ? initialData?.kode_reservasi_event : null,
            });

            if (res?.data?.data) {
                const data = res.data.data;
                setConflictResult({
                    checked: true,
                    available: data.is_available,
                    message: data.is_available
                        ? 'Ruangan TERSEDIA & BEBAS BENTROK untuk jadwal ini!'
                        : `Bentrok dengan ${data.total_conflicts} acara lain (${data.conflicting_events?.[0]?.nama_event || 'Event lain'}).`,
                });
            }
        } catch (error: any) {
            setConflictResult({
                checked: true,
                available: false,
                message: 'Gagal memeriksa ketersediaan ruangan',
            });
        } finally {
            setCheckingConflict(false);
        }
    };

    // Item management
    const handleAddItem = (preset?: Partial<EventItem>) => {
        setItems([
            ...items,
            {
                item_type: preset?.item_type || 'fnb',
                item_name: preset?.item_name || '',
                qty: preset?.qty || jumlahTamu || 1,
                unit: preset?.unit || 'pax',
                harga_satuan: preset?.harga_satuan || 0,
                subtotal: (preset?.qty || jumlahTamu || 1) * (preset?.harga_satuan || 0),
                catatan: preset?.catatan || '',
            },
        ]);
    };

    const handleUpdateItem = (index: number, field: keyof EventItem, value: any) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: value };

        if (field === 'qty' || field === 'harga_satuan') {
            const q = field === 'qty' ? parseInt(value, 10) || 0 : next[index].qty;
            const h = field === 'harga_satuan' ? parseFloat(value) || 0 : next[index].harga_satuan;
            next[index].subtotal = q * h;
        }

        setItems(next);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Submit handler
    const handleSubmit = () => {
        setSubmitted(true);

        if (!namaEvent.trim() || !kodeRuangEvent || !tglMulai) {
            setActiveIndex(0);
            return;
        }

        if (!kodeTamu) {
            setActiveIndex(1);
            return;
        }

        if (conflictResult?.available === false) {
            setActiveIndex(0);
            return;
        }

        const startDateStr = tglMulai.toISOString().slice(0, 10);
        const endDateStr = tglSelesai ? tglSelesai.toISOString().slice(0, 10) : startDateStr;

        const payload: FormikEventValues = {
            kode_reservasi_event: isEdit ? initialData?.kode_reservasi_event : undefined,
            nama_event: namaEvent,
            kode_ruang_event: kodeRuangEvent,
            kode_cabang: initialData?.kode_cabang || '',
            kode_tamu: kodeTamu,
            kode_corporate: kodeCorporate || '',
            tgl_mulai: startDateStr,
            tgl_selesai: endDateStr,
            jam_mulai: jamMulai,
            jam_selesai: jamSelesai,
            jumlah_tamu: jumlahTamu,
            layout_setup: layoutSetup,
            tipe_sewa: tipeSewa,
            durasi_jam: durasiJam,
            tarif_sewa: tarifSewa,
            diskon: diskon,
            pajak_persen: pajakPersen,
            service_charge_persen: serviceChargePersen,
            deposit_paid: depositPaid,
            contact_person: contactPerson,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            setup_buffer_minutes: setupBuffer,
            teardown_buffer_minutes: teardownBuffer,
            catatan_khusus: catatanKhusus,
            items: items.filter((it) => it.item_name.trim().length > 0),
        };

        onSubmit(payload);
    };

    // Custom Dialog Header
    const dialogHeader = (
        <div className="flex align-items-center gap-3 py-1">
            <div className="p-2 border-round bg-primary-50 text-primary flex align-items-center justify-content-center">
                <i className="pi pi-ticket text-xl"></i>
            </div>
            <div>
                <div className="font-bold text-lg text-900">
                    {isEdit ? `Edit Pemesanan Ruang Event: ${initialData?.kode_reservasi_event}` : 'Pemesanan Ruang Event Baru (BEO)'}
                </div>
                <div className="text-xs text-500">
                    Banquet Event Order: Jadwal operasional, konfigurasi ruangan, katering & keuangan
                </div>
            </div>
        </div>
    );

    // Custom Dialog Footer
    const dialogFooter = (
        <div className="flex flex-wrap justify-content-between align-items-center gap-2 pt-2 border-top-1 border-200">
            <div className="flex align-items-center gap-3">
                <div>
                    <span className="text-xs text-500 block">Total Estimasi Biaya</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
                </div>
                {conflictResult && (
                    <Tag
                        value={conflictResult.available ? 'Bebas Bentrok' : 'Jadwal Bentrok'}
                        severity={conflictResult.available ? 'success' : 'danger'}
                        icon={conflictResult.available ? 'pi pi-check' : 'pi pi-exclamation-triangle'}
                    />
                )}
            </div>
            <div className="flex align-items-center gap-2">
                <Button label="Batal" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={onHide} disabled={submitting} />
                <Button
                    label={isEdit ? 'Simpan Perubahan' : 'Buat Pemesanan (BEO)'}
                    icon="pi pi-check"
                    className="p-button-primary"
                    onClick={handleSubmit}
                    loading={submitting}
                />
            </div>
        </div>
    );

    return (
        <Dialog
            header={dialogHeader}
            visible={visible}
            style={{ width: '92vw', maxWidth: '1050px' }}
            modal
            className="p-fluid"
            onHide={onHide}
            footer={dialogFooter}
        >
            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                {/* ======================================================== */}
                {/* TAB 1: ACARA & JADWAL */}
                {/* ======================================================== */}
                <TabPanel header="1. Acara & Jadwal" leftIcon="pi pi-calendar mr-2">
                    {/* Kartu 1: Detail Acara & Ruangan */}
                    <div className="surface-card p-3 border-round border-1 border-200 mb-3 shadow-1">
                        <div className="text-sm font-bold text-700 mb-3 flex align-items-center gap-2">
                            <i className="pi pi-bookmark text-primary"></i>
                            <span>Detail Acara & Ruang Pertemuan</span>
                        </div>
                        <div className="grid formgrid p-fluid">
                            <div className="field col-12 md:col-7 mb-3">
                                <label className="font-semibold text-sm mb-1 block">
                                    Nama / Judul Acara <span className="text-red-500">*</span>
                                </label>
                                <span className="p-input-icon-left w-full">
                                    <i className="pi pi-pencil" />
                                    <InputText
                                        value={namaEvent}
                                        onChange={(e) => setNamaEvent(e.target.value)}
                                        placeholder="Contoh: Rapat Kerja Tahunan 2026, Wedding Reception, Seminar AI"
                                        className={submitted && !namaEvent.trim() ? 'p-invalid' : ''}
                                    />
                                </span>
                                {submitted && !namaEvent.trim() && (
                                    <small className="p-error block mt-1">Nama acara wajib diisi</small>
                                )}
                            </div>

                            <div className="field col-12 md:col-5 mb-3">
                                <label className="font-semibold text-sm mb-1 block">
                                    Pilihan Ruang Event <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    value={kodeRuangEvent}
                                    options={ruangOptions}
                                    onChange={(e) => {
                                        setKodeRuangEvent(e.value);
                                        setConflictResult(null);
                                    }}
                                    placeholder="Pilih Ruang Event"
                                    filter
                                    className={submitted && !kodeRuangEvent ? 'p-invalid' : ''}
                                />
                                {selectedRoomMeta && (
                                    <small className="text-500 block mt-1">
                                        Kapasitas: <span className="font-semibold">{selectedRoomMeta.kapasitas || '-'} Pax</span>
                                        {selectedRoomMeta.luas ? ` | Luas: ${selectedRoomMeta.luas} m²` : ''}
                                    </small>
                                )}
                            </div>

                            <div className="field col-12 md:col-4 mb-2">
                                <label className="font-semibold text-sm mb-1 block">Tata Letak (Layout Setup)</label>
                                <Dropdown
                                    value={layoutSetup}
                                    options={layoutOptions}
                                    onChange={(e) => setLayoutSetup(e.value)}
                                />
                            </div>

                            <div className="field col-12 md:col-4 mb-2">
                                <label className="font-semibold text-sm mb-1 block">
                                    Jumlah Tamu (Pax) <span className="text-red-500">*</span>
                                </label>
                                <InputNumber
                                    value={jumlahTamu}
                                    onValueChange={(e) => setJumlahTamu(e.value || 1)}
                                    min={1}
                                    suffix=" Pax / Tamu"
                                    showButtons
                                />
                            </div>

                            <div className="field col-12 md:col-4 mb-2">
                                <label className="font-semibold text-sm mb-1 block">Skema Sewa Ruangan</label>
                                <Dropdown
                                    value={tipeSewa}
                                    options={tipeSewaOptions}
                                    onChange={(e) => setTipeSewa(e.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kartu 2: Jadwal Pelaksanaan & Waktu Operasional */}
                    <div className="surface-card p-3 border-round border-1 border-200 mb-3 shadow-1">
                        <div className="text-sm font-bold text-700 mb-3 flex align-items-center gap-2">
                            <i className="pi pi-clock text-primary"></i>
                            <span>Jadwal Pelaksanaan & Jam Operasional</span>
                        </div>
                        <div className="grid formgrid p-fluid">
                            <div className="field col-12 md:col-3 mb-3">
                                <label className="font-semibold text-sm mb-1 block">
                                    Tanggal Mulai <span className="text-red-500">*</span>
                                </label>
                                <Calendar
                                    value={tglMulai}
                                    onChange={(e) => {
                                        const d = e.value as Date;
                                        setTglMulai(d);
                                        if (!tglSelesai || (d && d > tglSelesai)) setTglSelesai(d);
                                        setConflictResult(null);
                                    }}
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                />
                            </div>

                            <div className="field col-12 md:col-3 mb-3">
                                <label className="font-semibold text-sm mb-1 block">
                                    Jam Mulai Acara <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    value={jamMulai}
                                    options={timeOptions}
                                    onChange={(e) => {
                                        setJamMulai(e.value);
                                        setConflictResult(null);
                                    }}
                                    filter
                                    placeholder="09:00"
                                />
                            </div>

                            <div className="field col-12 md:col-3 mb-3">
                                <label className="font-semibold text-sm mb-1 block">
                                    Tanggal Selesai <span className="text-red-500">*</span>
                                </label>
                                <Calendar
                                    value={tglSelesai}
                                    onChange={(e) => {
                                        setTglSelesai(e.value as Date);
                                        setConflictResult(null);
                                    }}
                                    dateFormat="yy-mm-dd"
                                    minDate={tglMulai || undefined}
                                    showIcon
                                />
                            </div>

                            <div className="field col-12 md:col-3 mb-3">
                                <label className="font-semibold text-sm mb-1 block">
                                    Jam Selesai Acara <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    value={jamSelesai}
                                    options={timeOptions}
                                    onChange={(e) => {
                                        setJamSelesai(e.value);
                                        setConflictResult(null);
                                    }}
                                    filter
                                    placeholder="13:00"
                                />
                            </div>

                            <div className="field col-12 md:col-3 mb-2">
                                <label className="font-semibold text-sm mb-1 block">Buffer Setup (Persiapan)</label>
                                <InputNumber
                                    value={setupBuffer}
                                    onValueChange={(e) => {
                                        setSetupBuffer(e.value || 0);
                                        setConflictResult(null);
                                    }}
                                    min={0}
                                    suffix=" Menit"
                                />
                                <small className="text-500">Waktu tim menata ruangan</small>
                            </div>

                            <div className="field col-12 md:col-3 mb-2">
                                <label className="font-semibold text-sm mb-1 block">Buffer Teardown (Pembersihan)</label>
                                <InputNumber
                                    value={teardownBuffer}
                                    onValueChange={(e) => {
                                        setTeardownBuffer(e.value || 0);
                                        setConflictResult(null);
                                    }}
                                    min={0}
                                    suffix=" Menit"
                                />
                                <small className="text-500">Waktu tim merapikan ruangan</small>
                            </div>

                            <div className="field col-12 md:col-6 mb-2">
                                <label className="font-semibold text-sm mb-1 block text-700">Verifikasi Bebas Bentrok</label>
                                <Button
                                    type="button"
                                    label="Cek Ketersediaan & Bentrok Jadwal"
                                    icon="pi pi-shield"
                                    className="p-button-outlined p-button-info"
                                    onClick={handleCheckConflict}
                                    loading={checkingConflict}
                                />
                            </div>

                            {conflictResult && (
                                <div className="col-12 mt-2">
                                    <div
                                        className={`p-3 border-round text-sm font-semibold flex align-items-center gap-2 ${
                                            conflictResult.available
                                                ? 'bg-green-50 text-green-700 border-1 border-green-200'
                                                : 'bg-red-50 text-red-700 border-1 border-red-200'
                                        }`}
                                    >
                                        <i className={`pi ${conflictResult.available ? 'pi-check-circle text-green-600' : 'pi-times-circle text-red-600'} text-lg`}></i>
                                        <span>{conflictResult.message}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-content-end mt-3">
                        <Button
                            type="button"
                            label="Lanjut: Penyelenggara & PIC →"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            className="p-button-sm p-button-outlined"
                            onClick={() => setActiveIndex(1)}
                        />
                    </div>
                </TabPanel>

                {/* ======================================================== */}
                {/* TAB 2: PENYELENGGARA & PIC */}
                {/* ======================================================== */}
                <TabPanel header="2. Penyelenggara & PIC" leftIcon="pi pi-user mr-2">
                    <div className="surface-card p-3 border-round border-1 border-200 mb-3 shadow-1">
                        <div className="text-sm font-bold text-700 mb-3 flex align-items-center gap-2">
                            <i className="pi pi-id-card text-primary"></i>
                            <span>Profil Pemesan & Instansi</span>
                        </div>
                        <div className="grid formgrid p-fluid">
                            <div className="field col-12 md:col-6 mb-3">
                                <label className="font-semibold text-sm mb-1 block">
                                    Tamu / Pemesan (Buku Tamu) <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    value={kodeTamu}
                                    options={guestOptions}
                                    onChange={(e) => setKodeTamu(e.value)}
                                    placeholder="Cari nama pemesan..."
                                    filter
                                    className={submitted && !kodeTamu ? 'p-invalid' : ''}
                                />
                                {submitted && !kodeTamu && (
                                    <small className="p-error block mt-1">Pemesan tamu wajib dipilih</small>
                                )}
                            </div>

                            <div className="field col-12 md:col-6 mb-3">
                                <label className="font-semibold text-sm mb-1 block">
                                    Mitra Corporate / Instansi (Opsional)
                                </label>
                                <Dropdown
                                    value={kodeCorporate}
                                    options={corporateOptions}
                                    onChange={(e) => setKodeCorporate(e.value)}
                                    placeholder="Pilih jika booking atas nama instansi / PT"
                                    filter
                                    showClear
                                />
                            </div>
                        </div>
                    </div>

                    <div className="surface-card p-3 border-round border-1 border-200 mb-3 shadow-1">
                        <div className="text-sm font-bold text-700 mb-3 flex align-items-center gap-2">
                            <i className="pi pi-phone text-primary"></i>
                            <span>Kontak Person (PIC Lapangan Hari-H)</span>
                        </div>
                        <div className="grid formgrid p-fluid">
                            <div className="field col-12 md:col-4 mb-3">
                                <label className="font-semibold text-sm mb-1 block">Nama PIC Lapangan</label>
                                <span className="p-input-icon-left w-full">
                                    <i className="pi pi-user" />
                                    <InputText
                                        value={contactPerson}
                                        onChange={(e) => setContactPerson(e.target.value)}
                                        placeholder="Nama penanggung jawab di lokasi"
                                    />
                                </span>
                            </div>

                            <div className="field col-12 md:col-4 mb-3">
                                <label className="font-semibold text-sm mb-1 block">No. HP / WhatsApp PIC</label>
                                <span className="p-input-icon-left w-full">
                                    <i className="pi pi-whatsapp" />
                                    <InputText
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        placeholder="0812xxxxxxxx"
                                    />
                                </span>
                            </div>

                            <div className="field col-12 md:col-4 mb-3">
                                <label className="font-semibold text-sm mb-1 block">Email PIC / Koresponden</label>
                                <span className="p-input-icon-left w-full">
                                    <i className="pi pi-envelope" />
                                    <InputText
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        placeholder="pic@instansi.com"
                                    />
                                </span>
                            </div>

                            <div className="field col-12 mb-1">
                                <label className="font-semibold text-sm mb-1 block">
                                    Instruksi Khusus BEO (Catatan Operasional Lintas Divisi)
                                </label>
                                <InputTextarea
                                    value={catatanKhusus}
                                    onChange={(e) => setCatatanKhusus(e.target.value)}
                                    rows={4}
                                    placeholder="Tuliskan instruksi untuk tim Banquet, Dapur F&B, dan Audio-Visual (misal: panggung ukuran 4x2m, mic wireless 4 unit, coffee break jam 10:00, suhu AC 21°C)."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-content-between mt-3">
                        <Button
                            type="button"
                            label="← Kembali ke Jadwal"
                            icon="pi pi-arrow-left"
                            className="p-button-sm p-button-text p-button-secondary"
                            onClick={() => setActiveIndex(0)}
                        />
                        <Button
                            type="button"
                            label="Lanjut: F&B & Perlengkapan →"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            className="p-button-sm p-button-outlined"
                            onClick={() => setActiveIndex(2)}
                        />
                    </div>
                </TabPanel>

                {/* ======================================================== */}
                {/* TAB 3: F&B & PERLENGKAPAN TAMBAHAN */}
                {/* ======================================================== */}
                <TabPanel header="3. F&B & Perlengkapan" leftIcon="pi pi-box mr-2">
                    <div className="surface-card p-3 border-round border-1 border-200 mb-3 shadow-1">
                        <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <div>
                                <span className="font-bold text-sm text-800 block">Rincian Paket F&B, Alat & Fasilitas BEO</span>
                                <span className="text-xs text-500">Tambahkan kebutuhan catering, sound system, proyektor, atau perlengkapan lainnya.</span>
                            </div>
                            <Button
                                type="button"
                                label="Tambah Item Kustom"
                                icon="pi pi-plus"
                                className="p-button-sm p-button-outlined"
                                onClick={() => handleAddItem()}
                            />
                        </div>

                        {/* Quick Presets */}
                        <div className="surface-50 p-2 border-round border-1 border-200 mb-3 flex flex-wrap align-items-center gap-2">
                            <span className="text-xs font-semibold text-600 mr-1">Preset Cepat:</span>
                            <Button
                                type="button"
                                label="+ Coffee Break (25rb/pax)"
                                className="p-button-xs p-button-outlined p-button-secondary py-1 px-2 text-xs"
                                onClick={() =>
                                    handleAddItem({
                                        item_type: 'fnb',
                                        item_name: 'Coffee Break Standard',
                                        qty: jumlahTamu || 1,
                                        unit: 'pax',
                                        harga_satuan: 25000,
                                        catatan: 'Kopi, teh, dan 2 macam snack',
                                    })
                                }
                            />
                            <Button
                                type="button"
                                label="+ Lunch Buffet (75rb/pax)"
                                className="p-button-xs p-button-outlined p-button-secondary py-1 px-2 text-xs"
                                onClick={() =>
                                    handleAddItem({
                                        item_type: 'fnb',
                                        item_name: 'Prasmanan Makan Siang (Lunch Buffet)',
                                        qty: jumlahTamu || 1,
                                        unit: 'pax',
                                        harga_satuan: 75000,
                                        catatan: 'Menu standar hotel 4 lauk utama',
                                    })
                                }
                            />
                            <Button
                                type="button"
                                label="+ Projector & Screen (350rb)"
                                className="p-button-xs p-button-outlined p-button-secondary py-1 px-2 text-xs"
                                onClick={() =>
                                    handleAddItem({
                                        item_type: 'equipment',
                                        item_name: 'LCD Projector 4000 Lumens + Tripod Screen',
                                        qty: 1,
                                        unit: 'set',
                                        harga_satuan: 350000,
                                        catatan: 'Termasuk kabel HDMI & pointer',
                                    })
                                }
                            />
                            <Button
                                type="button"
                                label="+ Sound & Wireless Mic (500rb)"
                                className="p-button-xs p-button-outlined p-button-secondary py-1 px-2 text-xs"
                                onClick={() =>
                                    handleAddItem({
                                        item_type: 'equipment',
                                        item_name: 'Sound System + 2 Wireless Mic',
                                        qty: 1,
                                        unit: 'paket',
                                        harga_satuan: 500000,
                                        catatan: 'Didampingi 1 operator audio',
                                    })
                                }
                            />
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center p-4 surface-100 border-round text-500 text-sm">
                                <i className="pi pi-inbox text-3xl mb-2 text-400 block"></i>
                                Belum ada item tambahan. Gunakan tombol <b>Preset Cepat</b> atau klik <b>Tambah Item Kustom</b>.
                            </div>
                        ) : (
                            <div className="flex flex-column gap-2">
                                {items.map((it, idx) => (
                                    <div
                                        key={idx}
                                        className="grid formgrid p-fluid align-items-center surface-50 p-2 border-round border-1 border-200"
                                    >
                                        <div className="col-12 md:col-2 mb-1 md:mb-0">
                                            <label className="text-xs text-500 mb-1 block">Kategori</label>
                                            <Dropdown
                                                value={it.item_type}
                                                options={[
                                                    { label: 'F&B (Catering)', value: 'fnb' },
                                                    { label: 'Equipment (Alat)', value: 'equipment' },
                                                    { label: 'Facility (Fasilitas)', value: 'facility' },
                                                    { label: 'Lainnya', value: 'other' },
                                                ]}
                                                onChange={(e) => handleUpdateItem(idx, 'item_type', e.value)}
                                                className="p-inputtext-sm"
                                            />
                                        </div>
                                        <div className="col-12 md:col-4 mb-1 md:mb-0">
                                            <label className="text-xs text-500 mb-1 block">Nama Item / Paket</label>
                                            <InputText
                                                value={it.item_name}
                                                onChange={(e) => handleUpdateItem(idx, 'item_name', e.target.value)}
                                                placeholder="Nama menu atau peralatan"
                                                className="p-inputtext-sm"
                                            />
                                        </div>
                                        <div className="col-4 md:col-1 mb-1 md:mb-0">
                                            <label className="text-xs text-500 mb-1 block">Qty</label>
                                            <InputNumber
                                                value={it.qty}
                                                onValueChange={(e) => handleUpdateItem(idx, 'qty', e.value || 1)}
                                                className="p-inputtext-sm"
                                                min={1}
                                            />
                                        </div>
                                        <div className="col-4 md:col-1 mb-1 md:mb-0">
                                            <label className="text-xs text-500 mb-1 block">Satuan</label>
                                            <InputText
                                                value={it.unit}
                                                onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                                                placeholder="pax/set"
                                                className="p-inputtext-sm"
                                            />
                                        </div>
                                        <div className="col-4 md:col-2 mb-1 md:mb-0">
                                            <label className="text-xs text-500 mb-1 block">Harga Satuan</label>
                                            <InputNumber
                                                value={it.harga_satuan}
                                                onValueChange={(e) => handleUpdateItem(idx, 'harga_satuan', e.value || 0)}
                                                className="p-inputtext-sm"
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                            />
                                        </div>
                                        <div className="col-10 md:col-1 text-right mb-1 md:mb-0">
                                            <label className="text-xs text-500 mb-1 block">Subtotal</label>
                                            <div className="font-bold text-xs mt-1 text-900">{formatCurrency(it.subtotal || 0)}</div>
                                        </div>
                                        <div className="col-2 md:col-1 text-center">
                                            <label className="text-xs text-500 mb-1 block invisible md:visible">Aksi</label>
                                            <Button
                                                type="button"
                                                icon="pi pi-trash"
                                                className="p-button-sm p-button-danger p-button-text p-1"
                                                onClick={() => handleRemoveItem(idx)}
                                                tooltip="Hapus Baris"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-content-end align-items-center gap-2 mt-3 pt-2 border-top-1 border-200">
                            <span className="text-sm text-600">Total Biaya Tambahan (F&B + Peralatan):</span>
                            <span className="text-base font-bold text-900">{formatCurrency(totalBiayaTambahan)}</span>
                        </div>
                    </div>

                    <div className="flex justify-content-between mt-3">
                        <Button
                            type="button"
                            label="← Kembali ke PIC"
                            icon="pi pi-arrow-left"
                            className="p-button-sm p-button-text p-button-secondary"
                            onClick={() => setActiveIndex(1)}
                        />
                        <Button
                            type="button"
                            label="Lanjut: Biaya & Pembayaran →"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            className="p-button-sm p-button-outlined"
                            onClick={() => setActiveIndex(3)}
                        />
                    </div>
                </TabPanel>

                {/* ======================================================== */}
                {/* TAB 4: BIAYA & PEMBAYARAN */}
                {/* ======================================================== */}
                <TabPanel header="4. Biaya & Pembayaran" leftIcon="pi pi-money-bill mr-2">
                    <div className="grid">
                        {/* Kolom Kiri: Pengaturan Tarif & Diskon */}
                        <div className="col-12 lg:col-6">
                            <div className="surface-card p-3 border-round border-1 border-200 shadow-1 h-full">
                                <div className="text-sm font-bold text-700 mb-3 flex align-items-center gap-2">
                                    <i className="pi pi-sliders-h text-primary"></i>
                                    <span>Komponen Tarif & Pajak</span>
                                </div>
                                <div className="grid formgrid p-fluid">
                                    <div className="field col-12 mb-3">
                                        <label className="font-semibold text-sm mb-1 block">Tarif Dasar Sewa Ruangan</label>
                                        <InputNumber
                                            value={tarifSewa}
                                            onValueChange={(e) => setTarifSewa(e.value || 0)}
                                            mode="currency"
                                            currency="IDR"
                                            locale="id-ID"
                                        />
                                    </div>

                                    <div className="field col-12 mb-3">
                                        <label className="font-semibold text-sm mb-1 block">Total Item Tambahan (F&B / Alat)</label>
                                        <InputNumber value={totalBiayaTambahan} disabled mode="currency" currency="IDR" locale="id-ID" />
                                        <small className="text-500">Dihitung otomatis dari tab F&B & Perlengkapan</small>
                                    </div>

                                    <div className="field col-12 mb-3">
                                        <label className="font-semibold text-sm mb-1 block">Potongan / Diskon Khusus</label>
                                        <InputNumber
                                            value={diskon}
                                            onValueChange={(e) => setDiskon(e.value || 0)}
                                            mode="currency"
                                            currency="IDR"
                                            locale="id-ID"
                                        />
                                    </div>

                                    <div className="field col-6 mb-2">
                                        <label className="font-semibold text-sm mb-1 block">Service Charge (%)</label>
                                        <InputNumber
                                            value={serviceChargePersen}
                                            onValueChange={(e) => setServiceChargePersen(e.value || 0)}
                                            min={0}
                                            max={100}
                                            suffix=" %"
                                        />
                                    </div>

                                    <div className="field col-6 mb-2">
                                        <label className="font-semibold text-sm mb-1 block">Pajak Daerah (PB1) (%)</label>
                                        <InputNumber
                                            value={pajakPersen}
                                            onValueChange={(e) => setPajakPersen(e.value || 0)}
                                            min={0}
                                            max={100}
                                            suffix=" %"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Summary Invoice & Deposit */}
                        <div className="col-12 lg:col-6">
                            <div className="surface-card p-3 border-round border-1 border-200 shadow-1 h-full flex flex-column justify-content-between">
                                <div>
                                    <div className="text-sm font-bold text-700 mb-3 flex align-items-center gap-2">
                                        <i className="pi pi-receipt text-primary"></i>
                                        <span>Ringkasan BEO & Pembayaran</span>
                                    </div>

                                    <div className="surface-100 p-3 border-round mb-3">
                                        <div className="flex justify-content-between mb-2">
                                            <span className="text-sm text-600">Dasar Pengenaan Pajak (DPP):</span>
                                            <span className="font-semibold text-sm text-900">{formatCurrency(baseAmount)}</span>
                                        </div>
                                        <div className="flex justify-content-between mb-2">
                                            <span className="text-sm text-600">Service Charge ({serviceChargePersen}%):</span>
                                            <span className="font-semibold text-sm text-900">{formatCurrency(nominalService)}</span>
                                        </div>
                                        <div className="flex justify-content-between mb-2">
                                            <span className="text-sm text-600">Pajak Restoran/PB1 ({pajakPersen}%):</span>
                                            <span className="font-semibold text-sm text-900">{formatCurrency(nominalPajak)}</span>
                                        </div>
                                        <div className="flex justify-content-between border-top-1 border-300 pt-2">
                                            <span className="text-base font-bold text-900">Grand Total Tagihan:</span>
                                            <span className="text-xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
                                        </div>
                                    </div>

                                    <div className="grid formgrid p-fluid">
                                        <div className="field col-12 mb-3">
                                            <label className="font-semibold text-sm mb-1 block">
                                                Uang Muka / Deposit Diterima
                                            </label>
                                            <InputNumber
                                                value={depositPaid}
                                                onValueChange={(e) => setDepositPaid(e.value || 0)}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                            />
                                        </div>

                                        <div className="field col-12 mb-2">
                                            <label className="font-semibold text-sm mb-1 block">Sisa Tagihan Pelunasan</label>
                                            <div
                                                className={`p-3 border-round text-base font-bold flex justify-content-between align-items-center ${
                                                    sisaTagihan === 0
                                                        ? 'bg-green-50 text-green-700 border-1 border-green-200'
                                                        : 'bg-orange-50 text-orange-700 border-1 border-orange-200'
                                                }`}
                                            >
                                                <span>{formatCurrency(sisaTagihan)}</span>
                                                <Tag
                                                    value={sisaTagihan === 0 ? 'LUNAS' : depositPaid > 0 ? 'DEPOSIT PARSIAL' : 'BELUM DIBAYAR'}
                                                    severity={sisaTagihan === 0 ? 'success' : depositPaid > 0 ? 'warning' : 'danger'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-content-between mt-3">
                        <Button
                            type="button"
                            label="← Kembali ke Perlengkapan"
                            icon="pi pi-arrow-left"
                            className="p-button-sm p-button-text p-button-secondary"
                            onClick={() => setActiveIndex(2)}
                        />
                        <Button
                            type="button"
                            label={isEdit ? 'Simpan Perubahan (BEO)' : 'Selesai: Buat Pemesanan (BEO)'}
                            icon="pi pi-check"
                            className="p-button-sm p-button-primary"
                            onClick={handleSubmit}
                            loading={submitting}
                        />
                    </div>
                </TabPanel>
            </TabView>
        </Dialog>
    );
};

