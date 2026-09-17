'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
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

const PRESET_ITEMS = [
    { nama: 'Extra Bed (Kasur Tambahan)', harga: 150000, charge_type: 'other' },
    { nama: 'Sarapan Tambahan (Breakfast)', harga: 75000, charge_type: 'restaurant' },
    { nama: 'Laundry Regular (Express)', harga: 50000, charge_type: 'laundry' },
    { nama: 'Minibar / Snack Kamar', harga: 35000, charge_type: 'other' },
    { nama: 'Antar Jemput Bandara / Transport', harga: 200000, charge_type: 'other' }
];

export const DialogTambahFasilitas: React.FC<DialogTambahFasilitasProps> = ({
    visible,
    onHide,
    onSuccess,
    roomData,
    toast
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [masterFacilities, setMasterFacilities] = useState<any[]>([]);
    
    // Form State
    const [selectedPreset, setSelectedPreset] = useState<any>(null);
    const [namaItem, setNamaItem] = useState('');
    const [chargeType, setChargeType] = useState('other');
    const [qty, setQty] = useState<number>(1);
    const [harga, setHarga] = useState<number>(150000);
    
    // Payment State
    const [isPaidNow, setIsPaidNow] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [referenceNo, setReferenceNo] = useState('');
    const [shiftAktif, setShiftAktif] = useState<any>(null);

    const subtotal = (qty || 1) * (harga || 0);

    const loadMasterFacilities = async () => {
        try {
            const res = await postData(apiFasilitasData, { perPage: 100 });
            if (res?.data?.data) {
                const list = res.data.data.map((f: any) => ({
                    nama: f.name,
                    harga: parseFloat(f.harga || 0) || 50000,
                    charge_type: 'other',
                    kode_fasilitas: f.kode_fasilitas
                }));
                setMasterFacilities(list);
            }
        } catch (e) {
            console.error("Gagal memuat master fasilitas", e);
        }
    };

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
        if (visible) {
            loadMasterFacilities();
            loadShift();
            // Default select first preset
            handleSelectPreset(PRESET_ITEMS[0]);
            setIsPaidNow(false);
            setPaymentMethod('cash');
            setReferenceNo('');
        }
    }, [visible]);

    const handleSelectPreset = (item: any) => {
        setSelectedPreset(item);
        setNamaItem(item.nama);
        setHarga(item.harga);
        setChargeType(item.charge_type || 'other');
        setQty(1);
    };

    const handleSubmit = async () => {
        if (!roomData?.kode_reservasi_room) return;
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
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-plus-circle text-primary text-xl"></i>
                    <span className="font-bold text-lg">Tambah Fasilitas / Layanan Kamar In-House</span>
                </div>
            }
            style={{ width: '90vw', maxWidth: '650px' }}
            modal
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button label="Batal" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={submitting} />
                    <Button
                        label={isPaidNow ? "Bayar & Tambahkan" : "Bebankan ke Kamar"}
                        icon="pi pi-check"
                        className={isPaidNow ? "p-button-success" : "p-button-primary"}
                        onClick={handleSubmit}
                        loading={submitting}
                    />
                </div>
            }
        >
            <div className="flex flex-column gap-3">
                {/* Banner Info Kamar */}
                <div className="surface-card border-round-xl border-1 surface-border p-3 flex justify-content-between align-items-center">
                    <div>
                        <span className="text-xs text-color-secondary uppercase font-bold block">Tamu & Kamar</span>
                        <span className="font-bold text-base text-900">
                            Kamar {roomData?.nomor_kamar || '-'} — {roomData?.guest_name || '-'}
                        </span>
                    </div>
                    <Tag
                        severity={roomData?.billing_status === 'settled' ? 'success' : 'warning'}
                        value={roomData?.billing_status === 'settled' ? 'Folio: Lunas' : `Tagihan: Rp ${(roomData?.balance || 0).toLocaleString('id-ID')}`}
                    />
                </div>

                {/* Quick Presets */}
                <div>
                    <label className="text-xs font-bold text-color-secondary uppercase block mb-2">
                        Pilihan Layanan Cepat (Preset):
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PRESET_ITEMS.map((item, idx) => {
                            const isSelected = selectedPreset?.nama === item.nama;
                            return (
                                <Button
                                    key={idx}
                                    type="button"
                                    label={`${item.nama} (Rp ${item.harga.toLocaleString('id-ID')})`}
                                    className={`p-button-sm ${isSelected ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                                    onClick={() => handleSelectPreset(item)}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Detail Input */}
                <div className="grid">
                    <div className="col-12 md:col-8">
                        <label className="text-xs font-bold text-700 block mb-1">Nama Layanan / Fasilitas</label>
                        <InputText
                            value={namaItem}
                            onChange={(e) => setNamaItem(e.target.value)}
                            placeholder="Contoh: Extra Bed, Laundry Express, dll"
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-4">
                        <label className="text-xs font-bold text-700 block mb-1">Kategori Charge</label>
                        <Dropdown
                            value={chargeType}
                            options={[
                                { label: 'Lainnya / Umum', value: 'other' },
                                { label: 'Kasur Tambahan (Extra Bed)', value: 'extra_bed' },
                                { label: 'Restoran / Makanan', value: 'restaurant' },
                                { label: 'Laundry & Binatu', value: 'laundry' },
                                { label: 'Sewa Kamar Tambahan', value: 'room' }
                            ]}
                            onChange={(e) => setChargeType(e.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-4">
                        <label className="text-xs font-bold text-700 block mb-1">Jumlah (Qty)</label>
                        <InputNumber
                            value={qty}
                            onValueChange={(e) => setQty(e.value || 1)}
                            min={1}
                            showButtons
                            buttonLayout="horizontal"
                            decrementButtonClassName="p-button-secondary"
                            incrementButtonClassName="p-button-secondary"
                            incrementButtonIcon="pi pi-plus"
                            decrementButtonIcon="pi pi-minus"
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-8">
                        <label className="text-xs font-bold text-700 block mb-1">Harga Satuan (Rp)</label>
                        <InputNumber
                            value={harga}
                            onValueChange={(e) => setHarga(e.value || 0)}
                            mode="currency"
                            currency="IDR"
                            locale="id-ID"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Subtotal Banner */}
                <div className="surface-100 border-round-xl p-3 flex justify-content-between align-items-center">
                    <span className="font-bold text-sm text-700">Subtotal Biaya Fasilitas:</span>
                    <span className="font-bold text-xl text-primary">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>

                {/* Opsi Metode Penagihan */}
                <div className="surface-card border-round-xl border-1 surface-border p-3">
                    <label className="text-xs font-bold text-color-secondary uppercase block mb-2">
                        Opsi Penagihan Biaya:
                    </label>
                    <div className="flex flex-column gap-2">
                        <div className="flex align-items-center gap-2 cursor-pointer" onClick={() => setIsPaidNow(false)}>
                            <RadioButton
                                inputId="chargeToRoom"
                                name="billingOption"
                                checked={!isPaidNow}
                                onChange={() => setIsPaidNow(false)}
                            />
                            <label htmlFor="chargeToRoom" className="cursor-pointer text-sm font-semibold text-900">
                                Bebankan ke Tagihan Kamar (Charge to Room) — <span className="text-color-secondary font-normal text-xs">Dibayar tamu saat Checkout</span>
                            </label>
                        </div>

                        <div className="flex align-items-center gap-2 cursor-pointer" onClick={() => setIsPaidNow(true)}>
                            <RadioButton
                                inputId="payNow"
                                name="billingOption"
                                checked={isPaidNow}
                                onChange={() => setIsPaidNow(true)}
                            />
                            <label htmlFor="payNow" className="cursor-pointer text-sm font-semibold text-900">
                                Bayar Langsung Sekarang (Pay on the Spot) — <span className="text-green-600 font-normal text-xs">Lunas seketika</span>
                            </label>
                        </div>
                    </div>

                    {/* Jika Bayar Langsung, Munculkan Pilihan Pembayaran */}
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
            </div>
        </Dialog>
    );
};
export default DialogTambahFasilitas;
