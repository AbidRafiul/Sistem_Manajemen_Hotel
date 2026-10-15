'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { RoomStatusData } from '../interfaces';
import postData from '@/lib/axios/postData';
import { apiEndpointSubmitInspection } from '../endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';

interface DialogSubmitInspectionProps {
    visible: boolean;
    onHide: () => void;
    room: RoomStatusData | null;
    toast: React.RefObject<Toast>;
    onSuccess: () => Promise<void>;
}

interface MinibarItem {
    item_name: string;
    qty: number;
    unit_price: number;
}

interface DamagedItem {
    item_name: string;
    qty: number;
    charge_amount: number;
    notes: string;
}

export const DialogSubmitInspection = ({
    visible,
    onHide,
    room,
    toast,
    onSuccess
}: DialogSubmitInspectionProps) => {
    const [loading, setLoading] = useState(false);
    const [resultType, setResultType] = useState<'clear' | 'with_charges'>('clear');
    const [notes, setNotes] = useState('');

    // Minibar items
    const [minibarItems, setMinibarItems] = useState<MinibarItem[]>([]);
    const [newMinibarName, setNewMinibarName] = useState('');
    const [newMinibarQty, setNewMinibarQty] = useState<number>(1);
    const [newMinibarPrice, setNewMinibarPrice] = useState<number>(25000);

    // Damaged items
    const [damagedItems, setDamagedItems] = useState<DamagedItem[]>([]);
    const [newDamageName, setNewDamageName] = useState('');
    const [newDamageAmount, setNewDamageAmount] = useState<number>(50000);
    const [newDamageNotes, setNewDamageNotes] = useState('');

    // Lost and found
    const [hasLostFound, setHasLostFound] = useState(false);
    const [lfDescription, setLfDescription] = useState('');
    const [lfLocation, setLfLocation] = useState('');

    const handleAddMinibar = () => {
        if (!newMinibarName.trim()) {
            showError(toast, 'Nama item minibar wajib diisi.');
            return;
        }
        setMinibarItems([
            ...minibarItems,
            {
                item_name: newMinibarName.trim(),
                qty: newMinibarQty || 1,
                unit_price: newMinibarPrice || 0
            }
        ]);
        setNewMinibarName('');
        setNewMinibarQty(1);
        setNewMinibarPrice(25000);
        setResultType('with_charges');
    };

    const handleRemoveMinibar = (index: number) => {
        const next = minibarItems.filter((_, i) => i !== index);
        setMinibarItems(next);
        if (next.length === 0 && damagedItems.length === 0) {
            setResultType('clear');
        }
    };

    const handleAddDamage = () => {
        if (!newDamageName.trim()) {
            showError(toast, 'Nama fasilitas/barang rusak wajib diisi.');
            return;
        }
        setDamagedItems([
            ...damagedItems,
            {
                item_name: newDamageName.trim(),
                qty: 1,
                charge_amount: newDamageAmount || 0,
                notes: newDamageNotes.trim()
            }
        ]);
        setNewDamageName('');
        setNewDamageAmount(50000);
        setNewDamageNotes('');
        setResultType('with_charges');
    };

    const handleRemoveDamage = (index: number) => {
        const next = damagedItems.filter((_, i) => i !== index);
        setDamagedItems(next);
        if (next.length === 0 && minibarItems.length === 0) {
            setResultType('clear');
        }
    };

    const totalMinibar = minibarItems.reduce((acc, it) => acc + (it.qty * it.unit_price), 0);
    const totalDamage = damagedItems.reduce((acc, it) => acc + it.charge_amount, 0);
    const grandTotalCharges = totalMinibar + totalDamage;

    const handleSubmit = async () => {
        if (!room?.kode_housekeeping_task) {
            showError(toast, 'Kode task tidak valid.');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                result: (minibarItems.length > 0 || damagedItems.length > 0) ? 'with_charges' : 'clear',
                notes: notes.trim(),
                minibar_items: minibarItems,
                damaged_items: damagedItems,
                lost_and_found: hasLostFound && lfDescription.trim() ? {
                    item_description: lfDescription.trim(),
                    location: lfLocation.trim()
                } : null
            };

            const res = await postData(apiEndpointSubmitInspection(room.kode_housekeeping_task), payload);
            showSuccess(toast, res?.data?.message || 'Hasil inspeksi kamar berhasil dikirim ke Front Desk.');
            onHide();
            await onSuccess();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal mengirim hasil inspeksi');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-search-plus text-primary text-xl"></i>
                    <div>
                        <div className="font-bold text-lg">Input Hasil Cek Kamar Checkout</div>
                        <div className="text-xs text-500 font-normal">Kamar {room?.nomor_kamar} &bull; {room?.nama_tipe_kamar || 'Tipe Kamar'}</div>
                    </div>
                </div>
            }
            style={{ width: '92vw', maxWidth: '750px' }}
            modal
            closable
            footer={
                <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                    <Button
                        label="Batal"
                        icon="pi pi-times"
                        className="p-button-outlined p-button-sm"
                        onClick={onHide}
                        disabled={loading}
                    />
                    <Button
                        label={grandTotalCharges > 0 ? `Kirim Hasil (+ ${formatCurrency(grandTotalCharges)})` : 'Kirim Hasil (Kamar Clear)'}
                        icon="pi pi-send"
                        severity={grandTotalCharges > 0 ? 'warning' : 'success'}
                        className="p-button-sm font-semibold"
                        onClick={handleSubmit}
                        loading={loading}
                    />
                </div>
            }
        >
            <div className="flex flex-column gap-3 pt-2">
                {/* Result Type Selector */}
                <div className="grid grid-nogutter gap-2">
                    <div
                        className={`col p-3 border-round-xl cursor-pointer border-2 transition-colors ${
                            resultType === 'clear' && minibarItems.length === 0 && damagedItems.length === 0
                                ? 'bg-green-50 border-green-500 text-green-900 shadow-1'
                                : 'surface-50 border-transparent hover:surface-100'
                        }`}
                        onClick={() => {
                            setResultType('clear');
                            setMinibarItems([]);
                            setDamagedItems([]);
                        }}
                    >
                        <div className="flex align-items-center gap-2 mb-1">
                            <i className="pi pi-check-circle text-green-600 text-xl font-bold"></i>
                            <span className="font-bold text-sm">Kamar Clear & Aman</span>
                        </div>
                        <p className="text-xs text-600 m-0">
                            Tidak ada konsumsi minibar atau kerusakan linen/fasilitas. Kamar siap checkout tanpa biaya tambahan.
                        </p>
                    </div>

                    <div
                        className={`col p-3 border-round-xl cursor-pointer border-2 transition-colors ${
                            resultType === 'with_charges' || minibarItems.length > 0 || damagedItems.length > 0
                                ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-1'
                                : 'surface-50 border-transparent hover:surface-100'
                        }`}
                        onClick={() => setResultType('with_charges')}
                    >
                        <div className="flex align-items-center gap-2 mb-1">
                            <i className="pi pi-exclamation-triangle text-orange-600 text-xl font-bold"></i>
                            <span className="font-bold text-sm">Ada Biaya Tambahan</span>
                        </div>
                        <p className="text-xs text-600 m-0">
                            Terdapat konsumsi kulkas minibar atau denda kerusakan fasilitas kamar yang harus ditagihkan ke folio tamu.
                        </p>
                    </div>
                </div>

                {/* Section Minibar & Damages (if with_charges) */}
                {(resultType === 'with_charges' || minibarItems.length > 0 || damagedItems.length > 0) && (
                    <div className="flex flex-column gap-3 surface-50 p-3 border-round-xl border-1 surface-border">
                        {/* Minibar */}
                        <div>
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-bold uppercase text-700 flex align-items-center gap-1">
                                    <i className="pi pi-box text-primary"></i> Konsumsi Kulkas Minibar
                                </span>
                                {totalMinibar > 0 && (
                                    <Tag severity="info" value={`Subtotal: ${formatCurrency(totalMinibar)}`} />
                                )}
                            </div>

                            <div className="flex gap-2 flex-wrap mb-2">
                                <InputText
                                    placeholder="Nama Item (cth: Coca-Cola Can)"
                                    value={newMinibarName}
                                    onChange={(e) => setNewMinibarName(e.target.value)}
                                    className="p-inputtext-sm flex-1"
                                />
                                <InputNumber
                                    value={newMinibarQty}
                                    onValueChange={(e) => setNewMinibarQty(e.value || 1)}
                                    min={1}
                                    showButtons
                                    buttonLayout="horizontal"
                                    className="p-inputtext-sm"
                                    style={{ width: '7rem' }}
                                />
                                <InputNumber
                                    value={newMinibarPrice}
                                    onValueChange={(e) => setNewMinibarPrice(e.value || 0)}
                                    prefix="Rp "
                                    className="p-inputtext-sm"
                                    style={{ width: '9rem' }}
                                />
                                <Button
                                    icon="pi pi-plus"
                                    size="small"
                                    className="p-button-sm"
                                    onClick={handleAddMinibar}
                                    tooltip="Tambah Item Minibar"
                                />
                            </div>

                            {minibarItems.length > 0 && (
                                <div className="flex flex-column gap-1 bg-white p-2 border-round border-1 surface-border">
                                    {minibarItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-content-between align-items-center text-xs p-1 border-bottom-1 surface-border">
                                            <span><strong>{item.item_name}</strong> (x{item.qty} @ {formatCurrency(item.unit_price)})</span>
                                            <div className="flex align-items-center gap-2">
                                                <span className="font-bold text-primary">{formatCurrency(item.qty * item.unit_price)}</span>
                                                <Button
                                                    icon="pi pi-trash"
                                                    text
                                                    severity="danger"
                                                    size="small"
                                                    className="p-0"
                                                    onClick={() => handleRemoveMinibar(idx)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Divider className="my-1" />

                        {/* Kerusakan / Denda */}
                        <div>
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-bold uppercase text-700 flex align-items-center gap-1">
                                    <i className="pi pi-shield text-danger"></i> Denda Kerusakan / Kehilangan Fasilitas
                                </span>
                                {totalDamage > 0 && (
                                    <Tag severity="danger" value={`Subtotal: ${formatCurrency(totalDamage)}`} />
                                )}
                            </div>

                            <div className="flex gap-2 flex-wrap mb-2">
                                <InputText
                                    placeholder="Nama Barang Rusak (cth: Handuk Noda Permanen)"
                                    value={newDamageName}
                                    onChange={(e) => setNewDamageName(e.target.value)}
                                    className="p-inputtext-sm flex-1"
                                />
                                <InputNumber
                                    value={newDamageAmount}
                                    onValueChange={(e) => setNewDamageAmount(e.value || 0)}
                                    prefix="Rp "
                                    className="p-inputtext-sm"
                                    style={{ width: '9rem' }}
                                />
                                <InputText
                                    placeholder="Keterangan singkat"
                                    value={newDamageNotes}
                                    onChange={(e) => setNewDamageNotes(e.target.value)}
                                    className="p-inputtext-sm"
                                    style={{ width: '12rem' }}
                                />
                                <Button
                                    icon="pi pi-plus"
                                    size="small"
                                    severity="danger"
                                    className="p-button-sm"
                                    onClick={handleAddDamage}
                                    tooltip="Tambah Denda Kerusakan"
                                />
                            </div>

                            {damagedItems.length > 0 && (
                                <div className="flex flex-column gap-1 bg-white p-2 border-round border-1 surface-border">
                                    {damagedItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-content-between align-items-center text-xs p-1 border-bottom-1 surface-border">
                                            <span><strong>{item.item_name}</strong> {item.notes ? `(${item.notes})` : ''}</span>
                                            <div className="flex align-items-center gap-2">
                                                <span className="font-bold text-red-600">{formatCurrency(item.charge_amount)}</span>
                                                <Button
                                                    icon="pi pi-trash"
                                                    text
                                                    severity="danger"
                                                    size="small"
                                                    className="p-0"
                                                    onClick={() => handleRemoveDamage(idx)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Section Lost & Found */}
                <div className="surface-50 p-3 border-round-xl border-1 surface-border">
                    <div className="flex justify-content-between align-items-center mb-2">
                        <span className="text-xs font-bold uppercase text-700 flex align-items-center gap-1">
                            <i className="pi pi-map-marker text-blue-600"></i> Barang Tamu Tertinggal (Lost & Found)
                        </span>
                        <Button
                            label={hasLostFound ? 'Hapus Temuan' : '+ Ada Barang Tertinggal'}
                            text
                            size="small"
                            severity={hasLostFound ? 'danger' : 'info'}
                            className="p-0 text-xs font-semibold"
                            onClick={() => {
                                setHasLostFound(!hasLostFound);
                                if (hasLostFound) {
                                    setLfDescription('');
                                    setLfLocation('');
                                }
                            }}
                        />
                    </div>

                    {hasLostFound ? (
                        <div className="flex flex-column gap-2 bg-white p-2 border-round border-1 surface-border">
                            <InputText
                                placeholder="Deskripsi Barang (cth: Charger iPhone 20W putih, kacamata hitam)"
                                value={lfDescription}
                                onChange={(e) => setLfDescription(e.target.value)}
                                className="p-inputtext-sm w-full"
                            />
                            <InputText
                                placeholder="Lokasi ditemukan (cth: Di atas nakas sebelah kanan tempat tidur)"
                                value={lfLocation}
                                onChange={(e) => setLfLocation(e.target.value)}
                                className="p-inputtext-sm w-full"
                            />
                            <span className="text-xs text-orange-600 italic">
                                * Temuan barang ini akan langsung memicu notifikasi peringatan di layar kasir checkout sebelum tamu meninggalkan lobi.
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-500 font-normal">Tidak ada barang tamu yang tertinggal.</span>
                    )}
                </div>

                {/* Notes Input */}
                <div>
                    <label className="text-xs font-bold text-700 mb-1 block">Catatan Tambahan Housekeeper:</label>
                    <InputTextarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Tuliskan catatan kondisi kamar jika ada..."
                        className="w-full text-xs"
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default DialogSubmitInspection;
