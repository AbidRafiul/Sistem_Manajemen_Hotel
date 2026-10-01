'use client';

import React, { useState } from 'react';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';

export interface CashierPicCardProps {
    sessionUser?: any;
    activeShift?: any;
    kodeCabang?: string;
    onShiftUpdated?: (shiftData: any) => void;
    toast?: React.RefObject<any>;
    compact?: boolean;
}

export const CashierPicCard: React.FC<CashierPicCardProps> = ({
    sessionUser,
    activeShift,
    kodeCabang,
    onShiftUpdated,
    toast,
    compact = false
}) => {
    const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
    const [openingCash, setOpeningCash] = useState<number>(0);
    const [sesiShift, setSesiShift] = useState<string>('pagi');
    const [loading, setLoading] = useState(false);

    // Ambil nama & role PIC
    const picName = sessionUser?.nama_lengkap || sessionUser?.name || sessionUser?.username || 'Front Desk Officer';
    const picRole = sessionUser?.role_name || sessionUser?.role || 'Front Office Kasir';
    
    // Inisial avatar
    const getInitials = (name: string) => {
        const parts = (name || '').trim().split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return (name || 'FO').substring(0, 2).toUpperCase();
    };

    const isShiftActive = !!activeShift?.kode_cashier_shift;

    const handleQuickOpenShift = async () => {
        if (!kodeCabang && !sessionUser?.active_kode_cabang) {
            if (toast) showError(toast, 'Kode cabang tidak ditemukan.');
            return;
        }

        setLoading(true);
        try {
            const branch = kodeCabang || sessionUser?.active_kode_cabang;
            const res = await postData('/api/v1/kasir/shift-open', {
                kode_cabang: branch,
                kode_cashier_counter: 'CTR-001',
                opening_cash: openingCash || 0,
                sesi: sesiShift === 'pagi' ? 'Sesi A (Pagi 07:00 - 15:00)' : 'Sesi B (Sore 15:00 - 23:00)'
            });

            if (res?.data?.status === '00') {
                if (toast) showSuccess(toast, 'Shift kasir berhasil dibuka!');
                setShowOpenShiftModal(false);
                if (onShiftUpdated) {
                    onShiftUpdated(res.data.data);
                }
            } else {
                if (toast) showError(toast, res?.data?.message || 'Gagal membuka shift kasir');
            }
        } catch (e: any) {
            if (toast) showError(toast, e?.response?.data?.message || 'Terjadi kesalahan saat membuka shift');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="surface-card p-3 border-round-xl border-1 surface-border">
            <div className="flex align-items-center justify-content-between mb-2.5">
                <span className="text-xs font-bold text-color-secondary uppercase tracking-wider flex align-items-center gap-2">
                    <i className="pi pi-id-card text-primary text-sm"></i>
                    PIC Kasir &amp; Sesi Front Desk
                </span>
                {isShiftActive ? (
                    <Tag
                        severity="success"
                        value="Sesi Kasir Terhubung"
                        icon="pi pi-check-circle"
                        className="text-xs font-bold"
                    />
                ) : (
                    <Tag
                        severity="warning"
                        value="Shift Belum Dibuka"
                        icon="pi pi-exclamation-triangle"
                        className="text-xs"
                    />
                )}
            </div>

            <div className="flex align-items-center justify-content-between flex-wrap gap-2 py-1">
                {/* Info PIC Kasir */}
                <div className="flex align-items-center gap-3">
                    <div
                        className="flex align-items-center justify-content-center border-round-circle text-white font-bold shadow-1"
                        style={{
                            width: compact ? '36px' : '44px',
                            height: compact ? '36px' : '44px',
                            background: isShiftActive
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            fontSize: compact ? '13px' : '15px'
                        }}
                    >
                        {getInitials(picName)}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-900 line-height-2">{picName}</div>
                        <div className="text-xs text-500 flex align-items-center gap-2 mt-0.5">
                            <span>{picRole}</span>
                            <span>•</span>
                            <span className="text-primary font-medium">Front Desk Reception</span>
                        </div>
                    </div>
                </div>

                {/* Sesi Kasir Status */}
                <div className="text-right">
                    {isShiftActive ? (
                        <div>
                            <div className="text-xs font-semibold text-green-700 flex align-items-center justify-content-end gap-1">
                                <i className="pi pi-desktop text-xs"></i>
                                {activeShift?.nama_shift || activeShift?.kode_cashier_counter || 'Counter Kasir Utama'}
                            </div>
                            <div className="text-xs text-500 font-monospace">
                                #{activeShift?.kode_cashier_shift}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-column align-items-end gap-1">
                            <span className="text-xs text-500">Mode: PIC Kasir Front Office</span>
                            <Button
                                type="button"
                                label="Buka Shift"
                                icon="pi pi-key"
                                size="small"
                                severity="info"
                                outlined
                                className="text-xs py-1 px-2 border-round-lg"
                                onClick={() => setShowOpenShiftModal(true)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Helper Keterangan Status */}
            <div className="mt-2.5 pt-2 border-top-1 surface-border flex align-items-center justify-content-between text-xs text-600">
                <span className="flex align-items-center gap-1">
                    <i className="pi pi-info-circle text-primary text-xs"></i>
                    {isShiftActive ? (
                        <span>Penerimaan pembayaran otomatis tercatat pada laci sesi kasir ini.</span>
                    ) : (
                        <span>Pembayaran tercatat atas nama PIC Anda (transaksi aman & ter-audit).</span>
                    )}
                </span>
                <span className="text-500 font-monospace">
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </span>
            </div>

            {/* Dialog Cepat Pembukaan Shift Kasir */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2 text-900 font-bold">
                        <i className="pi pi-key text-primary text-lg"></i>
                        <span>Buka Shift Kasir Front Desk</span>
                    </div>
                }
                visible={showOpenShiftModal}
                onHide={() => setShowOpenShiftModal(false)}
                style={{ width: '90vw', maxWidth: '420px' }}
                modal
                footer={
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button
                            type="button"
                            label="Batal"
                            icon="pi pi-times"
                            severity="secondary"
                            outlined
                            size="small"
                            onClick={() => setShowOpenShiftModal(false)}
                            disabled={loading}
                        />
                        <Button
                            type="button"
                            label="Mulai Buka Shift"
                            icon="pi pi-check"
                            severity="success"
                            size="small"
                            onClick={handleQuickOpenShift}
                            loading={loading}
                        />
                    </div>
                }
            >
                <div className="py-2 flex flex-column gap-3 text-sm">
                    <div className="p-2 border-round-lg bg-blue-50 border-1 border-blue-200 text-blue-900 text-xs">
                        Buka shift kasir untuk mengaktifkan sesi pencatatan penerimaan uang fisik dan transaksi non-tunai pada laci kasir Anda.
                    </div>

                    <div className="field mb-0">
                        <label className="font-semibold text-xs text-700 block mb-1">
                            Pilih Sesi Kerja Shift:
                        </label>
                        <Dropdown
                            value={sesiShift}
                            options={[
                                { label: 'Sesi A — Pagi (07:00 - 15:00)', value: 'pagi' },
                                { label: 'Sesi B — Sore (15:00 - 23:00)', value: 'sore' }
                            ]}
                            onChange={(e) => setSesiShift(e.value)}
                            className="w-full text-sm"
                        />
                    </div>

                    <div className="field mb-0">
                        <label className="font-semibold text-xs text-700 block mb-1">
                            Modal Awal Kasir / Kas Laci (Opening Cash):
                        </label>
                        <InputNumber
                            value={openingCash}
                            onValueChange={(e) => setOpeningCash(e.value ?? 0)}
                            mode="currency"
                            currency="IDR"
                            locale="id-ID"
                            placeholder="Rp 0"
                            className="w-full text-sm"
                            min={0}
                        />
                        <small className="text-500 text-xs">Uang fisik modal awal yang disiapkan di laci kasir.</small>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default CashierPicCard;
