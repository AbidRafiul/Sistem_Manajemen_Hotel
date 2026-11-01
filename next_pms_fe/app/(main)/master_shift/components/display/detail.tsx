'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import postData from '@/lib/axios/postData';
import { formatDateSystem } from '@/lib/tools/dateTools';
import StatusIndicator from '@/app/components/status/StatusIndicator';
import { apiEndpointShiftHistory } from '../endpoints';
import { DetailProps } from '../interfaces';

export default function Detail({ state, setState, formik }: DetailProps) {
    const shift = state.selectedDetail;

    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState<boolean>(false);

    useEffect(() => {
        if (state.detail && (shift?.kode_shift || shift?.nama_shift)) {
            fetchRecentSessions(shift.kode_shift || '', shift.kode_cabang);
        } else {
            setRecentSessions([]);
        }
    }, [state.detail, shift?.kode_shift]);

    const fetchRecentSessions = async (kode_shift: string, kode_cabang?: string) => {
        setLoadingSessions(true);
        try {
            const res = await postData(apiEndpointShiftHistory, {
                sesi: kode_shift,
                kode_cabang: kode_cabang || undefined,
                perPage: 5
            });
            setRecentSessions(res?.data?.data || []);
        } catch (err) {
            console.error('Gagal mengambil riwayat sesi kasir terkait:', err);
            setRecentSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    if (!shift) return null;

    const formatCurrency = (val: number | null | undefined) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(val || 0));
    };

    const calculateDuration = (start: string, end: string) => {
        if (!start || !end) return '-';
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let diff = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
        if (diff <= 0) diff += 24 * 60; // melewati tengah malam
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        return `${hours} Jam${minutes > 0 ? ` ${minutes} Menit` : ''}`;
    };

    const handleOpenEdit = () => {
        if (formik) {
            formik.setValues({
                id: shift.id,
                kode_shift: shift.kode_shift,
                kode_cabang: shift.kode_cabang || '',
                nama_shift: shift.nama_shift || '',
                waktu_mulai: shift.waktu_mulai || '07:00:00',
                waktu_selesai: shift.waktu_selesai || '15:00:00',
                default_opening_cash: Number(shift.default_opening_cash || 1000000),
                is_night_audit: Number(shift.is_night_audit || 0),
                urutan: Number(shift.urutan || 1),
                is_active: shift.is_active !== undefined ? shift.is_active : 1
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
                <i className="pi pi-clock text-blue-600 text-xl" />
                <div>
                    <div className="text-lg font-bold text-900">
                        Detail Shift Kasir: {shift.nama_shift}
                    </div>
                    <div className="text-xs text-500">
                        Kode: <strong className="text-700">{shift.kode_shift || '-'}</strong> &bull; Cabang: {shift.cabang_name || shift.kode_cabang || '-'}
                    </div>
                </div>
            </div>
            <div>
                <Tag
                    value={shift.is_active === 1 ? 'Aktif' : 'Tidak Aktif'}
                    severity={shift.is_active === 1 ? 'success' : 'danger'}
                    rounded
                />
            </div>
        </div>
    );

    const dialogFooter = (
        <div className="flex justify-content-between align-items-center w-full">
            <div className="text-xs text-500">
                Shift: <strong className="text-700">{shift.nama_shift}</strong> ({shift.kode_shift || '-'})
            </div>
            <div className="flex gap-2">
                {formik && (
                    <Button
                        label="Edit Shift"
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

    const jamMulaiClean = shift.waktu_mulai ? shift.waktu_mulai.substring(0, 5) : '-';
    const jamSelesaiClean = shift.waktu_selesai ? shift.waktu_selesai.substring(0, 5) : '-';
    const durasiKerja = calculateDuration(shift.waktu_mulai, shift.waktu_selesai);

    return (
        <Dialog
            visible={state.detail}
            header={dialogHeader}
            style={{ width: '85vw', maxWidth: '900px' }}
            modal
            onHide={() => setState((p) => ({ ...p, detail: false, selectedDetail: null }))}
            footer={dialogFooter}
        >
            {/* Top Hero Banner */}
            <div className="flex flex-wrap align-items-center justify-content-between p-3 bg-blue-50 border-round mb-3 gap-3 border-1 border-blue-100">
                <div className="flex align-items-center gap-3">
                    <div className="w-3rem h-3rem md:w-4rem md:h-4rem border-circle bg-blue-600 text-white flex align-items-center justify-content-center text-xl md:text-2xl font-bold shadow-1 flex-shrink-0">
                        <i className="pi pi-clock text-xl md:text-2xl" />
                    </div>
                    <div>
                        <h4 className="m-0 text-xl font-bold text-900 flex align-items-center gap-2 flex-wrap">
                            {shift.nama_shift}
                            {shift.kode_shift && <Tag value={shift.kode_shift} severity="info" />}
                            {shift.is_night_audit === 1 ? (
                                <Tag severity="warning" value="Night Audit" icon="pi pi-moon" />
                            ) : (
                                <Tag severity="info" value="Shift Reguler" icon="pi pi-sun" />
                            )}
                        </h4>
                        <p className="m-0 mt-1 text-gray-600 text-sm">
                            Cabang: <strong>{shift.cabang_name || shift.kode_cabang || '-'}</strong> &bull; Jam: <strong>{jamMulaiClean} – {jamSelesaiClean}</strong> ({durasiKerja})
                        </p>
                    </div>
                </div>
                <div className="text-right ml-auto">
                    <span className="text-xs text-gray-500 uppercase font-semibold block">Modal Standar (Awal)</span>
                    <span className="text-2xl font-bold text-teal-600">
                        {formatCurrency(shift.default_opening_cash)}
                    </span>
                    <span className="text-xs text-gray-500 block">standar kas awal kasir</span>
                </div>
            </div>

            {/* 4 Quick Stat Summary Cards */}
            <div className="grid mb-3">
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Jam Operasional</span>
                            <i className="pi pi-clock text-blue-600 bg-blue-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-900">{jamMulaiClean} – {jamSelesaiClean}</div>
                            <div className="text-xs text-500 mt-1">Durasi kerja: {durasiKerja}</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Modal Standar</span>
                            <i className="pi pi-wallet text-teal-600 bg-teal-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-teal-700">{formatCurrency(shift.default_opening_cash)}</div>
                            <div className="text-xs text-500 mt-1">Kas modal awal kasir</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Kategori Sesi</span>
                            <i className={shift.is_night_audit === 1 ? 'pi pi-moon text-orange-600 bg-orange-50 p-2 border-circle' : 'pi pi-sun text-cyan-600 bg-cyan-50 p-2 border-circle'} />
                        </div>
                        <div>
                            <div className="text-base font-bold text-900">
                                {shift.is_night_audit === 1 ? 'Night Audit' : 'Reguler'}
                            </div>
                            <div className="text-xs text-500 mt-1">
                                {shift.is_night_audit === 1 ? 'Sesi tutup buku harian hotel' : 'Sesi shift operasional kasir'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Urutan Shift</span>
                            <i className="pi pi-sort-numeric-down text-purple-600 bg-purple-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-900">Shift Ke-{shift.urutan || 1}</div>
                            <div className="text-xs text-500 mt-1">Prioritas urutan kerja harian</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabbed Content */}
            <TabView>
                {/* Tab 1: Spesifikasi & Pengaturan Shift */}
                <TabPanel header="Spesifikasi & Pengaturan" leftIcon="pi pi-info-circle mr-2">
                    <div className="grid">
                        {/* Kolom Kiri: Spesifikasi Jadwal Shift */}
                        <div className="col-12 md:col-6">
                            <div className="surface-card p-3 border-round border-1 surface-border h-full shadow-1">
                                <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                                    <i className="pi pi-calendar-times text-blue-600" /> Jadwal & Jam Kerja
                                </h5>
                                <div className="flex flex-column gap-2 text-sm">
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Kode Shift</span>
                                        <span className="font-bold text-900">{shift.kode_shift || '-'}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Nama Shift</span>
                                        <span className="font-semibold text-900">{shift.nama_shift}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Cabang Properti</span>
                                        <span className="font-medium text-900">{shift.cabang_name || shift.kode_cabang || '-'}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Jam Mulai Kerja</span>
                                        <span className="font-bold text-blue-700">{jamMulaiClean} WIB</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Jam Selesai Kerja</span>
                                        <span className="font-bold text-blue-700">{jamSelesaiClean} WIB</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Total Durasi</span>
                                        <span className="font-medium text-900">{durasiKerja}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Urutan Shift</span>
                                        <span className="font-medium text-900">Shift #{shift.urutan || 1}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2">
                                        <span className="text-500">Status Operasional</span>
                                        <span>
                                            <Tag
                                                value={shift.is_active === 1 ? 'Aktif' : 'Tidak Aktif'}
                                                severity={shift.is_active === 1 ? 'success' : 'danger'}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Pengaturan Kas & Informasi Sistem */}
                        <div className="col-12 md:col-6">
                            <div className="flex flex-column gap-3 h-full">
                                {/* Card Kas & Audit */}
                                <div className="surface-card p-3 border-round border-1 surface-border shadow-1 flex-1">
                                    <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                                        <i className="pi pi-money-bill text-teal-600" /> Pengaturan Kas & Sesi Kasir
                                    </h5>

                                    <div className="mb-3">
                                        <span className="text-xs text-500 uppercase font-semibold block mb-1">
                                            Standar Kas Awal (Opening Float)
                                        </span>
                                        <div className="text-2xl font-bold text-teal-700">
                                            {formatCurrency(shift.default_opening_cash)}
                                        </div>
                                        <div className="text-xs text-500 mt-1">
                                            Nilai default uang modal fisik yang disiapkan di laci kasir saat shift dibuka.
                                        </div>
                                    </div>

                                    <div className="p-3 surface-50 border-round border-1 surface-border">
                                        <div className="flex justify-content-between align-items-center mb-1">
                                            <span className="font-semibold text-700">Penanda Sesi Audit</span>
                                            {shift.is_night_audit === 1 ? (
                                                <Tag severity="warning" value="Night Audit" icon="pi pi-moon" />
                                            ) : (
                                                <Tag severity="info" value="Reguler" icon="pi pi-sun" />
                                            )}
                                        </div>
                                        <div className="text-xs text-500 line-height-3">
                                            {shift.is_night_audit === 1
                                                ? 'Shift ini ditandai sebagai sesi Night Audit untuk proses penutupan hari (day closing) & posting transaksi otomatis hotel.'
                                                : 'Shift operasional harian standar untuk melayani check-in, check-out, dan transaksi kasir kasir.'}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Audit Trail */}
                                <div className="surface-card p-3 border-round border-1 surface-border shadow-1">
                                    <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                                        <i className="pi pi-clock text-orange-600" /> Informasi Riwayat Sistem
                                    </h5>
                                    <div className="flex flex-column gap-2 text-sm">
                                        <div className="flex justify-content-between py-1 border-bottom-1 surface-100">
                                            <span className="text-500">Waktu Dibuat</span>
                                            <span className="font-medium text-700">
                                                {shift.created_at ? formatDateSystem(shift.created_at) : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-content-between py-1">
                                            <span className="text-500">Terakhir Diperbarui</span>
                                            <span className="font-medium text-700">
                                                {shift.updated_at ? formatDateSystem(shift.updated_at) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                {/* Tab 2: Riwayat Sesi Kasir Terkait */}
                <TabPanel header={`Riwayat Sesi Kasir (${recentSessions.length})`} leftIcon="pi pi-history mr-2">
                    {loadingSessions ? (
                        <div className="flex justify-content-center align-items-center py-5">
                            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                        </div>
                    ) : (
                        <div>
                            <DataTable
                                value={recentSessions}
                                emptyMessage="Belum ada catatan pembukaan sesi kasir untuk shift ini"
                                size="small"
                                className="p-datatable-sm"
                            >
                                <Column
                                    field="kode_cashier_shift"
                                    header="Kode Sesi"
                                    body={(r) => (
                                        <span className="font-bold text-blue-600">
                                            {r.kode_cashier_shift || r.id}
                                        </span>
                                    )}
                                />
                                <Column
                                    field="tanggal_shift"
                                    header="Tanggal"
                                    body={(r) => r.tanggal_shift ? formatDateSystem(r.tanggal_shift) : (r.created_at ? formatDateSystem(r.created_at) : '-')}
                                />
                                <Column
                                    field="nama_lengkap"
                                    header="Petugas Kasir"
                                    body={(r) => r.nama_lengkap || r.user_name || r.username || '-'}
                                />
                                <Column
                                    field="modal_awal"
                                    header="Kas Awal"
                                    align="right"
                                    body={(r) => formatCurrency(r.modal_awal || r.opening_cash)}
                                />
                                <Column
                                    field="modal_akhir"
                                    header="Kas Akhir"
                                    align="right"
                                    body={(r) => r.modal_akhir !== undefined && r.modal_akhir !== null ? formatCurrency(r.modal_akhir) : '-'}
                                />
                                <Column
                                    field="status"
                                    header="Status Sesi"
                                    align="center"
                                    body={(r) => (
                                        <Tag
                                            value={r.status === 'closed' ? 'Tutup' : 'Buka'}
                                            severity={r.status === 'closed' ? 'info' : 'success'}
                                        />
                                    )}
                                />
                            </DataTable>
                        </div>
                    )}
                </TabPanel>
            </TabView>
        </Dialog>
    );
}
