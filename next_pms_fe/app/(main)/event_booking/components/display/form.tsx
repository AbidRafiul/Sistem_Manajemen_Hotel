'use client';

import React, { useState, useEffect } from 'react';
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

    // Populate when opening
    useEffect(() => {
        if (visible) {
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
                setContactPerson(matchedGuest.label || '');
                if (matchedGuest.phone) setContactPhone(matchedGuest.phone);
                if (matchedGuest.email) setContactEmail(matchedGuest.email);
            }
        }
    }, [kodeTamu]);

    // Financial Calculation
    const totalBiayaTambahan = items.reduce((acc, curr) => acc + (parseFloat(curr.subtotal as any) || 0), 0);
    const baseAmount = Math.max(0, tarifSewa + totalBiayaTambahan - diskon);
    const nominalService = Math.round(baseAmount * (serviceChargePersen / 100));
    const nominalPajak = Math.round((baseAmount + nominalService) * (pajakPersen / 100));
    const grandTotal = baseAmount + nominalService + nominalPajak;
    const sisaTagihan = Math.max(0, grandTotal - depositPaid);

    // Conflict Check Handler
    const handleCheckConflict = async () => {
        if (!kodeRuangEvent || !tglMulai || !jamMulai || !jamSelesai) return;

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
                        ? '✅ Ruangan tersedia dan siap dipesan!'
                        : `❌ Bentrok dengan ${data.total_conflicts} reservasi lain (${data.conflicting_events?.[0]?.nama_event || 'Event lain'}).`,
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
    const handleAddItem = () => {
        setItems([
            ...items,
            {
                item_type: 'fnb',
                item_name: '',
                qty: jumlahTamu || 1,
                unit: 'pax',
                harga_satuan: 0,
                subtotal: 0,
                catatan: '',
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
        if (!namaEvent.trim() || !kodeRuangEvent || !kodeTamu || !tglMulai) {
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

    const layoutOptions = [
        { label: 'Theater Style (Maksimal Kapasitas)', value: 'theater' },
        { label: 'Classroom Style (Meja Pelatihan)', value: 'classroom' },
        { label: 'U-Shape Style (Bentuk U)', value: 'u_shape' },
        { label: 'Boardroom Style (Rapat Direksi)', value: 'boardroom' },
        { label: 'Banquet / Round Table (Meja Bundar)', value: 'banquet' },
        { label: 'Standing / Cocktail Reception', value: 'standing' },
        { label: 'Hollow Square', value: 'hollow_square' },
        { label: 'Custom Layout', value: 'custom' },
    ];

    const tipeSewaOptions = [
        { label: 'Half Day (4 Jam)', value: 'half_day' },
        { label: 'Full Day (8 Jam)', value: 'full_day' },
        { label: 'Per Jam (Hourly)', value: 'per_jam' },
        { label: 'Paket Kustom (Custom Package)', value: 'custom_package' },
    ];

    return (
        <Dialog
            header={isEdit ? `Edit Pemesanan Event: ${initialData?.kode_reservasi_event}` : 'Pemesanan Ruang Event Baru (BEO)'}
            visible={visible}
            style={{ width: '90vw', maxWidth: '1000px' }}
            modal
            className="p-fluid"
            onHide={onHide}
            footer={
                <div className="flex justify-content-between align-items-center w-full">
                    <div className="flex align-items-center gap-2">
                        <span className="text-xs text-500">Total Biaya:</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button label="Batal" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={submitting} />
                        <Button
                            label={isEdit ? 'Simpan Perubahan' : 'Buat Pemesanan (BEO)'}
                            icon="pi pi-check"
                            className="p-button-primary"
                            onClick={handleSubmit}
                            loading={submitting}
                            disabled={!namaEvent || !kodeRuangEvent || !kodeTamu || (conflictResult?.available === false)}
                        />
                    </div>
                </div>
            }
        >
            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                {/* TAB 1: INFORMASI ACARA & JADWAL */}
                <TabPanel header="1. Acara & Jadwal" leftIcon="pi pi-calendar mr-2">
                    <div className="grid formgrid p-fluid mt-2">
                        <div className="field col-12 md:col-8">
                            <label className="font-semibold text-sm">Nama / Judul Acara <span className="text-red-500">*</span></label>
                            <InputText
                                value={namaEvent}
                                onChange={(e) => setNamaEvent(e.target.value)}
                                placeholder="Contoh: Rapat Kerja Tahunan 2026, Wedding Reception, Seminar AI"
                                required
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="font-semibold text-sm">Ruang Event <span className="text-red-500">*</span></label>
                            <Dropdown
                                value={kodeRuangEvent}
                                options={ruangOptions}
                                onChange={(e) => {
                                    setKodeRuangEvent(e.value);
                                    setConflictResult(null);
                                }}
                                placeholder="Pilih Ruang Event"
                            />
                        </div>

                        <div className="field col-12 md:col-3">
                            <label className="font-semibold text-sm">Tanggal Mulai <span className="text-red-500">*</span></label>
                            <Calendar
                                value={tglMulai}
                                onChange={(e) => {
                                    setTglMulai(e.value as Date);
                                    if (!tglSelesai || (e.value as Date) > tglSelesai) setTglSelesai(e.value as Date);
                                    setConflictResult(null);
                                }}
                                dateFormat="yy-mm-dd"
                                showIcon
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label className="font-semibold text-sm">Tanggal Selesai <span className="text-red-500">*</span></label>
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
                        <div className="field col-6 md:col-3">
                            <label className="font-semibold text-sm">Jam Mulai <span className="text-red-500">*</span></label>
                            <InputText
                                value={jamMulai}
                                onChange={(e) => {
                                    setJamMulai(e.target.value);
                                    setConflictResult(null);
                                }}
                                placeholder="09:00"
                            />
                        </div>
                        <div className="field col-6 md:col-3">
                            <label className="font-semibold text-sm">Jam Selesai <span className="text-red-500">*</span></label>
                            <InputText
                                value={jamSelesai}
                                onChange={(e) => {
                                    setJamSelesai(e.target.value);
                                    setConflictResult(null);
                                }}
                                placeholder="13:00"
                            />
                        </div>

                        <div className="field col-12 md:col-4">
                            <label className="font-semibold text-sm">Jumlah Tamu / Pax <span className="text-red-500">*</span></label>
                            <InputNumber
                                value={jumlahTamu}
                                onValueChange={(e) => setJumlahTamu(e.value || 1)}
                                min={1}
                                showButtons
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="font-semibold text-sm">Tata Letak (Layout Setup)</label>
                            <Dropdown
                                value={layoutSetup}
                                options={layoutOptions}
                                onChange={(e) => setLayoutSetup(e.value)}
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="font-semibold text-sm">Skema Sewa Ruangan</label>
                            <Dropdown
                                value={tipeSewa}
                                options={tipeSewaOptions}
                                onChange={(e) => setTipeSewa(e.value)}
                            />
                        </div>

                        <div className="field col-6 md:col-3">
                            <label className="font-semibold text-sm">Buffer Setup (Menit)</label>
                            <InputNumber value={setupBuffer} onValueChange={(e) => setSetupBuffer(e.value || 0)} min={0} suffix=" Menit" />
                        </div>
                        <div className="field col-6 md:col-3">
                            <label className="font-semibold text-sm">Buffer Teardown (Menit)</label>
                            <InputNumber value={teardownBuffer} onValueChange={(e) => setTeardownBuffer(e.value || 0)} min={0} suffix=" Menit" />
                        </div>
                        <div className="field col-12 md:col-6 flex align-items-end">
                            <Button
                                label="Periksa Ketersediaan & Bentrok Jadwal"
                                icon="pi pi-shield"
                                className="p-button-outlined p-button-info w-full"
                                onClick={handleCheckConflict}
                                loading={checkingConflict}
                            />
                        </div>

                        {conflictResult && (
                            <div className="col-12 mt-2">
                                <div className={`p-3 border-round text-sm font-semibold ${conflictResult.available ? 'bg-green-50 text-green-700 border-1 border-green-200' : 'bg-red-50 text-red-700 border-1 border-red-200'}`}>
                                    {conflictResult.message}
                                </div>
                            </div>
                        )}
                    </div>
                </TabPanel>

                {/* TAB 2: PROFIL PENYELENGGARA & PIC */}
                <TabPanel header="2. Penyelenggara & PIC" leftIcon="pi pi-user mr-2">
                    <div className="grid formgrid p-fluid mt-2">
                        <div className="field col-12 md:col-6">
                            <label className="font-semibold text-sm">Tamu / Pemesan (Buku Tamu) <span className="text-red-500">*</span></label>
                            <Dropdown
                                value={kodeTamu}
                                options={guestOptions}
                                onChange={(e) => setKodeTamu(e.value)}
                                placeholder="Cari nama tamu..."
                                filter
                            />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="font-semibold text-sm">Mitra Corporate / Instansi (Opsional)</label>
                            <Dropdown
                                value={kodeCorporate}
                                options={corporateOptions}
                                onChange={(e) => setKodeCorporate(e.value)}
                                placeholder="Pilih mitra jika booking atas nama PT/Instansi"
                                filter
                                showClear
                            />
                        </div>

                        <div className="field col-12 md:col-4">
                            <label className="font-semibold text-sm">PIC Lapangan (Hari H)</label>
                            <InputText value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Nama PIC di lokasi" />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="font-semibold text-sm">No. HP / WhatsApp PIC</label>
                            <InputText value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="0812xxxxxxx" />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="font-semibold text-sm">Email PIC / Penyelenggara</label>
                            <InputText value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="pic@perusahaan.com" />
                        </div>

                        <div className="field col-12">
                            <label className="font-semibold text-sm">Instruksi Khusus BEO (Catatan Operasional)</label>
                            <InputTextarea
                                value={catatanKhusus}
                                onChange={(e) => setCatatanKhusus(e.target.value)}
                                rows={4}
                                placeholder="Tuliskan instruksi teknis untuk tim Banquet, Dapur F&B, dan Audio-Visual (misal: panggung ukuran 4x2m, mic wireless 4 unit, coffee break disajikan jam 10:00)."
                            />
                        </div>
                    </div>
                </TabPanel>

                {/* TAB 3: F&B & PERLENGKAPAN TAMBAHAN */}
                <TabPanel header="3. F&B & Perlengkapan" leftIcon="pi pi-box mr-2">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <span className="font-semibold text-sm text-700">Rincian Paket F&B, Audio-Visual, & Fasilitas Tambahan:</span>
                        <Button label="Tambah Item" icon="pi pi-plus" className="p-button-sm p-button-outlined" onClick={handleAddItem} />
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center p-4 surface-100 border-round text-500 text-sm">
                            Belum ada item tambahan. Klik tombol <b>Tambah Item</b> untuk memasukkan paket F&B atau sewa peralatan.
                        </div>
                    ) : (
                        <div className="flex flex-column gap-2">
                            {items.map((it, idx) => (
                                <div key={idx} className="grid formgrid p-fluid align-items-center surface-50 p-2 border-round border-1 border-200">
                                    <div className="col-12 md:col-2">
                                        <label className="text-xs text-500">Tipe</label>
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
                                    <div className="col-12 md:col-4">
                                        <label className="text-xs text-500">Nama Item / Paket</label>
                                        <InputText
                                            value={it.item_name}
                                            onChange={(e) => handleUpdateItem(idx, 'item_name', e.target.value)}
                                            placeholder="Nama menu/alat"
                                            className="p-inputtext-sm"
                                        />
                                    </div>
                                    <div className="col-4 md:col-1">
                                        <label className="text-xs text-500">Qty</label>
                                        <InputNumber
                                            value={it.qty}
                                            onValueChange={(e) => handleUpdateItem(idx, 'qty', e.value || 1)}
                                            className="p-inputtext-sm"
                                            min={1}
                                        />
                                    </div>
                                    <div className="col-4 md:col-1">
                                        <label className="text-xs text-500">Satuan</label>
                                        <InputText
                                            value={it.unit}
                                            onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                                            className="p-inputtext-sm"
                                        />
                                    </div>
                                    <div className="col-4 md:col-2">
                                        <label className="text-xs text-500">Harga Satuan</label>
                                        <InputNumber
                                            value={it.harga_satuan}
                                            onValueChange={(e) => handleUpdateItem(idx, 'harga_satuan', e.value || 0)}
                                            className="p-inputtext-sm"
                                            mode="currency"
                                            currency="IDR"
                                            locale="id-ID"
                                        />
                                    </div>
                                    <div className="col-10 md:col-1 text-right">
                                        <label className="text-xs text-500">Subtotal</label>
                                        <div className="font-semibold text-xs mt-1">{formatCurrency(it.subtotal || 0)}</div>
                                    </div>
                                    <div className="col-2 md:col-1 text-center">
                                        <Button
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
                </TabPanel>

                {/* TAB 4: PERHITUNGAN BIAYA & DEPOSIT */}
                <TabPanel header="4. Biaya & Pembayaran" leftIcon="pi pi-money-bill mr-2">
                    <div className="grid formgrid p-fluid mt-2">
                        <div className="field col-12 md:col-6">
                            <label className="font-semibold text-sm">Tarif Dasar Sewa Ruang (Rp)</label>
                            <InputNumber
                                value={tarifSewa}
                                onValueChange={(e) => setTarifSewa(e.value || 0)}
                                mode="currency"
                                currency="IDR"
                                locale="id-ID"
                            />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="font-semibold text-sm">Total Item F&B / Peralatan (Otomatis)</label>
                            <InputNumber value={totalBiayaTambahan} disabled mode="currency" currency="IDR" locale="id-ID" />
                        </div>

                        <div className="field col-12 md:col-4">
                            <label className="font-semibold text-sm">Diskon Khusus (Rp)</label>
                            <InputNumber
                                value={diskon}
                                onValueChange={(e) => setDiskon(e.value || 0)}
                                mode="currency"
                                currency="IDR"
                                locale="id-ID"
                            />
                        </div>
                        <div className="field col-6 md:col-4">
                            <label className="font-semibold text-sm">Service Charge (%)</label>
                            <InputNumber value={serviceChargePersen} onValueChange={(e) => setServiceChargePersen(e.value || 0)} min={0} max={100} suffix=" %" />
                        </div>
                        <div className="field col-6 md:col-4">
                            <label className="font-semibold text-sm">Pajak Daerah / PB1 (%)</label>
                            <InputNumber value={pajakPersen} onValueChange={(e) => setPajakPersen(e.value || 0)} min={0} max={100} suffix=" %" />
                        </div>

                        <div className="col-12 mt-3 p-3 surface-100 border-round">
                            <div className="flex justify-content-between mb-2">
                                <span className="text-sm text-600">Dasar Pengenaan Pajak (DPP):</span>
                                <span className="font-semibold text-sm">{formatCurrency(baseAmount)}</span>
                            </div>
                            <div className="flex justify-content-between mb-2">
                                <span className="text-sm text-600">Nominal Service Charge ({serviceChargePersen}%):</span>
                                <span className="font-semibold text-sm">{formatCurrency(nominalService)}</span>
                            </div>
                            <div className="flex justify-content-between mb-2">
                                <span className="text-sm text-600">Nominal Pajak PB1 ({pajakPersen}%):</span>
                                <span className="font-semibold text-sm">{formatCurrency(nominalPajak)}</span>
                            </div>
                            <div className="flex justify-content-between border-top-1 border-300 pt-2 mb-3">
                                <span className="text-base font-bold text-900">Grand Total Tagihan:</span>
                                <span className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span>
                            </div>

                            <div className="grid formgrid p-fluid">
                                <div className="field col-12 md:col-6">
                                    <label className="font-semibold text-sm">Uang Muka / Deposit Diterima (Rp)</label>
                                    <InputNumber
                                        value={depositPaid}
                                        onValueChange={(e) => setDepositPaid(e.value || 0)}
                                        mode="currency"
                                        currency="IDR"
                                        locale="id-ID"
                                    />
                                </div>
                                <div className="field col-12 md:col-6">
                                    <label className="font-semibold text-sm">Sisa Tagihan (Pelunasan di Kasir)</label>
                                    <InputNumber value={sisaTagihan} disabled mode="currency" currency="IDR" locale="id-ID" />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </Dialog>
    );
};
