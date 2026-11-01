'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { DetailProps, TIPE_PAKET_OPTIONS } from '../interfaces';

export default function Detail({ state, setState, formik }: DetailProps) {
    const plan = state.selectedDetail;

    if (!plan) return null;

    const formatCurrency = (val: number | null | undefined) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(val || 0));
    };

    const getTipePaketLabel = (val: string) => {
        const found = TIPE_PAKET_OPTIONS.find((opt) => opt.value === val);
        return found ? found.label : val;
    };

    const handleOpenEdit = () => {
        if (formik) {
            formik.setValues({
                kode_paket_harga: plan.kode_paket_harga || '',
                kode_cabang: plan.kode_cabang || '',
                name: plan.name || '',
                tipe_paket: plan.tipe_paket || 'RO',
                tipe_markup: plan.tipe_markup || 'nominal',
                nilai_markup: plan.nilai_markup || 0,
                bisa_refund: plan.bisa_refund || 0,
                termasuk_sarapan: plan.termasuk_sarapan || 0,
                minimal_malam: plan.minimal_malam || 1,
                maksimal_malam: plan.maksimal_malam || null,
                is_active: plan.is_active !== undefined ? plan.is_active : 1
            });
        }
        setState((p) => ({
            ...p,
            detail: false,
            selectedDetail: null,
            add: false,
            delete: false,
            edit: true
        }));
    };

    const dialogHeader = (
        <div className="flex align-items-center justify-content-between w-full pr-3">
            <div className="flex align-items-center gap-2">
                <i className="pi pi-tags text-blue-600 text-xl" />
                <div>
                    <div className="text-lg font-bold text-900">
                        Detail Paket Harga: {plan.name}
                    </div>
                    <div className="text-xs text-500">
                        Kode: <strong className="text-700">{plan.kode_paket_harga}</strong> &bull; Tipe: <strong className="text-700">{getTipePaketLabel(plan.tipe_paket)}</strong>
                    </div>
                </div>
            </div>
            <div>
                <Tag
                    value={plan.is_active === 1 ? 'Aktif' : 'Tidak Aktif'}
                    severity={plan.is_active === 1 ? 'success' : 'danger'}
                    rounded
                />
            </div>
        </div>
    );

    const dialogFooter = (
        <div className="flex justify-content-between align-items-center w-full">
            <div className="text-xs text-500">
                Paket Harga: <strong className="text-700">{plan.name}</strong> ({plan.kode_paket_harga})
            </div>
            <div className="flex gap-2">
                {formik && (
                    <Button
                        label="Edit Rate Plan"
                        icon="pi pi-pencil"
                        outlined
                        className="p-button-sm"
                        onClick={handleOpenEdit}
                    />
                )}
                <Button
                    label="Tutup"
                    icon="pi pi-times"
                    className="p-button-sm"
                    severity="secondary"
                    onClick={() => setState((p) => ({ ...p, detail: false, selectedDetail: null }))}
                />
            </div>
        </div>
    );

    const markupFormatted =
        plan.tipe_markup === 'nominal'
            ? formatCurrency(plan.nilai_markup)
            : `${plan.nilai_markup || 0}%`;

    return (
        <Dialog
            visible={state.detail}
            header={dialogHeader}
            style={{ width: '85vw', maxWidth: '850px' }}
            modal
            onHide={() => setState((p) => ({ ...p, detail: false, selectedDetail: null }))}
            footer={dialogFooter}
        >
            {/* Top Hero Banner */}
            <div className="flex flex-wrap align-items-center justify-content-between p-3 bg-blue-50 border-round mb-3 gap-3 border-1 border-blue-100">
                <div className="flex align-items-center gap-3">
                    <div className="w-3rem h-3rem md:w-4rem md:h-4rem border-circle bg-blue-600 text-white flex align-items-center justify-content-center text-xl md:text-2xl font-bold shadow-1 flex-shrink-0">
                        <i className="pi pi-tags text-xl md:text-2xl" />
                    </div>
                    <div>
                        <h4 className="m-0 text-xl font-bold text-900 flex align-items-center gap-2 flex-wrap">
                            {plan.name}
                            <Tag value={plan.kode_paket_harga} severity="info" />
                        </h4>
                        <p className="m-0 mt-1 text-gray-600 text-sm">
                            Tipe Paket: <strong>{getTipePaketLabel(plan.tipe_paket)}</strong> &bull; Skema: <strong>{plan.tipe_markup === 'nominal' ? 'Nominal Tetap' : 'Persentase'}</strong>
                        </p>
                    </div>
                </div>
                <div className="text-right ml-auto">
                    <span className="text-xs text-gray-500 uppercase font-semibold block">Nilai Markup</span>
                    <span className="text-2xl font-bold text-teal-600">
                        {markupFormatted}
                    </span>
                    <span className="text-xs text-gray-500 block">
                        {plan.tipe_markup === 'nominal' ? '/ malam' : 'dari harga dasar'}
                    </span>
                </div>
            </div>

            {/* 4 Quick Stat Summary Cards */}
            <div className="grid mb-3">
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Skema Markup</span>
                            <i className="pi pi-percentage text-teal-600 bg-teal-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-teal-700">{markupFormatted}</div>
                            <div className="text-xs text-500 mt-1">
                                {plan.tipe_markup === 'nominal' ? 'Penyesuaian nominal' : 'Penyesuaian margin %'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Tipe Paket</span>
                            <i className="pi pi-box text-blue-600 bg-blue-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-900">{plan.tipe_paket}</div>
                            <div className="text-xs text-500 mt-1 truncate" title={getTipePaketLabel(plan.tipe_paket)}>
                                {getTipePaketLabel(plan.tipe_paket)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Durasi Menginap</span>
                            <i className="pi pi-calendar text-orange-600 bg-orange-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-900">Min. {plan.minimal_malam} Malam</div>
                            <div className="text-xs text-500 mt-1">
                                {plan.maksimal_malam ? `Maks. ${plan.maksimal_malam} Malam` : 'Maks: Tanpa Batas'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Benefit & Syarat</span>
                            <i className="pi pi-shield text-purple-600 bg-purple-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-900 flex align-items-center gap-1">
                                <span className={plan.bisa_refund === 1 ? 'text-teal-600' : 'text-orange-600'}>
                                    {plan.bisa_refund === 1 ? 'Refundable' : 'Non-Refund'}
                                </span>
                                <span>&bull;</span>
                                <span className={plan.termasuk_sarapan === 1 ? 'text-blue-600' : 'text-500'}>
                                    {plan.termasuk_sarapan === 1 ? 'Sarapan' : 'No Sarapan'}
                                </span>
                            </div>
                            <div className="text-xs text-500 mt-1">Kebijakan pembatalan & konsumsi</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Content Grid */}
            <div className="grid">
                {/* Kolom Kiri: Spesifikasi & Konfigurasi Paket */}
                <div className="col-12 md:col-6">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full shadow-1">
                        <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                            <i className="pi pi-sliders-h text-blue-600" /> Spesifikasi & Konfigurasi
                        </h5>
                        <div className="flex flex-column gap-2 text-sm">
                            <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                <span className="text-500">Kode Rate Plan</span>
                                <span className="font-bold text-900">{plan.kode_paket_harga}</span>
                            </div>
                            <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                <span className="text-500">Nama Rate Plan</span>
                                <span className="font-semibold text-900">{plan.name}</span>
                            </div>
                            <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                <span className="text-500">Tipe Paket</span>
                                <span className="font-medium text-900">{getTipePaketLabel(plan.tipe_paket)}</span>
                            </div>
                            <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                <span className="text-500">Skema Markup</span>
                                <span className="font-medium text-900">
                                    {plan.tipe_markup === 'nominal' ? 'Nominal (Rp)' : 'Persentase (%)'}
                                </span>
                            </div>
                            <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                <span className="text-500">Nilai Penyesuaian (Markup)</span>
                                <span className="font-bold text-teal-700">{markupFormatted}</span>
                            </div>
                            <div className="flex justify-content-between py-2">
                                <span className="text-500">Status Operasional</span>
                                <span>
                                    <Tag
                                        value={plan.is_active === 1 ? 'Aktif' : 'Tidak Aktif'}
                                        severity={plan.is_active === 1 ? 'success' : 'danger'}
                                    />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Kebijakan, Benefit, dan Riwayat */}
                <div className="col-12 md:col-6">
                    <div className="flex flex-column gap-3 h-full">
                        {/* Card Ketentuan & Kebijakan */}
                        <div className="surface-card p-3 border-round border-1 surface-border shadow-1 flex-1">
                            <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                                <i className="pi pi-check-square text-teal-600" /> Ketentuan & Benefit Paket
                            </h5>

                            <div className="flex flex-column gap-3 text-sm">
                                {/* Refund Policy */}
                                <div className="p-2 border-round surface-50 border-1 surface-border">
                                    <div className="flex justify-content-between align-items-center mb-1">
                                        <span className="font-semibold text-700">Kebijakan Pembatalan</span>
                                        <Tag
                                            value={plan.bisa_refund === 1 ? 'Dapat Di-refund' : 'Non-Refundable'}
                                            severity={plan.bisa_refund === 1 ? 'info' : 'warning'}
                                            icon={plan.bisa_refund === 1 ? 'pi pi-check' : 'pi pi-times'}
                                        />
                                    </div>
                                    <div className="text-xs text-500">
                                        {plan.bisa_refund === 1
                                            ? 'Pemesanan dengan paket ini dapat dibatalkan atau direfund sesuai ketentuan hotel.'
                                            : 'Pemesanan bersifat pasti dan tidak dapat dikembalikan dananya jika dibatalkan.'}
                                    </div>
                                </div>

                                {/* Breakfast Included */}
                                <div className="p-2 border-round surface-50 border-1 surface-border">
                                    <div className="flex justify-content-between align-items-center mb-1">
                                        <span className="font-semibold text-700">Fasilitas Sarapan</span>
                                        <Tag
                                            value={plan.termasuk_sarapan === 1 ? 'Termasuk Sarapan' : 'Tanpa Sarapan'}
                                            severity={plan.termasuk_sarapan === 1 ? 'info' : 'warning'}
                                            icon={plan.termasuk_sarapan === 1 ? 'pi pi-check' : 'pi pi-minus'}
                                        />
                                    </div>
                                    <div className="text-xs text-500">
                                        {plan.termasuk_sarapan === 1
                                            ? 'Paket harga ini sudah mencakup sarapan harian untuk tamu menginap.'
                                            : 'Paket harga ini hanya untuk kamar saja (Room Only), sarapan belum termasuk.'}
                                    </div>
                                </div>

                                {/* Stay Duration Limits */}
                                <div className="p-2 border-round surface-50 border-1 surface-border">
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="font-semibold text-700">Batas Durasi Menginap</span>
                                        <div className="text-right">
                                            <span className="font-bold text-900">
                                                Min. {plan.minimal_malam} Malam
                                            </span>
                                            {plan.maksimal_malam && (
                                                <span className="text-500 text-xs ml-1">
                                                    (Maks. {plan.maksimal_malam} Malam)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Informasi Waktu & Audit */}
                        <div className="surface-card p-3 border-round border-1 surface-border shadow-1">
                            <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                                <i className="pi pi-clock text-orange-600" /> Informasi Waktu & Riwayat
                            </h5>
                            <div className="flex flex-column gap-2 text-sm">
                                <div className="flex justify-content-between py-1 border-bottom-1 surface-100">
                                    <span className="text-500">Waktu Dibuat</span>
                                    <span className="font-medium text-700">
                                        {plan.created_at ? formatDateSystem(plan.created_at) : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-content-between py-1">
                                    <span className="text-500">Terakhir Diperbarui</span>
                                    <span className="font-medium text-700">
                                        {plan.updated_at ? formatDateSystem(plan.updated_at) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
