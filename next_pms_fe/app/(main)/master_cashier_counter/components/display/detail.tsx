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
import { apiEndpointShiftHistory } from '../endpoints';
import { DetailProps } from '../interfaces';

export default function Detail({ state, setState, formik }: DetailProps) {
    const counter = state.selectedDetail;

    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState<boolean>(false);

    useEffect(() => {
        if (state.detail && (counter?.kode_counter || counter?.name)) {
            fetchRecentSessions(counter.name, counter.kode_cabang);
        } else {
            setRecentSessions([]);
        }
    }, [state.detail, counter?.kode_counter, counter?.name]);

    const fetchRecentSessions = async (counterName: string, kode_cabang?: string) => {
        setLoadingSessions(true);
        try {
            const res = await postData(apiEndpointShiftHistory, {
                search: counterName,
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

    if (!counter) return null;

    const formatCurrency = (val: number | null | undefined) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(val || 0));
    };

    const handleOpenEdit = () => {
        if (formik) {
            formik.setValues({
                id: counter.id,
                kode_counter: counter.kode_counter || '',
                kode_cashier_counter: counter.kode_counter || '',
                kode_cabang: counter.kode_cabang || '',
                name: counter.name || '',
                is_active: counter.is_active !== undefined ? counter.is_active : 1
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
                <i className="pi pi-desktop text-blue-600 text-xl" />
                <div>
                    <div className="text-lg font-bold text-900">
                        Detail Cashier Counter: {counter.name}
                    </div>
                    <div className="text-xs text-500">
                        Kode: <strong className="text-700">{counter.kode_counter || '-'}</strong> &bull; Cabang: {counter.cabang_name || counter.kode_cabang || '-'}
                    </div>
                </div>
            </div>
            <div>
                <Tag
                    value={counter.is_active === 1 ? 'Aktif' : 'Tidak Aktif'}
                    severity={counter.is_active === 1 ? 'success' : 'danger'}
                    rounded
                />
            </div>
        </div>
    );

    const dialogFooter = (
        <div className="flex justify-content-between align-items-center w-full">
            <div className="text-xs text-500">
                Counter: <strong className="text-700">{counter.name}</strong> ({counter.kode_counter || '-'})
            </div>
            <div className="flex gap-2">
                {formik && (
                    <Button
                        label="Edit Counter"
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
                        <i className="pi pi-desktop text-xl md:text-2xl" />
                    </div>
                    <div>
                        <h4 className="m-0 text-xl font-bold text-900 flex align-items-center gap-2 flex-wrap">
                            {counter.name}
                            {counter.kode_counter && <Tag value={counter.kode_counter} severity="info" />}
                            {counter.is_in_use ? (
                                <Tag severity="warning" value="Sedang Digunakan" icon="pi pi-lock" />
                            ) : (
                                <Tag severity="success" value="Tersedia (Ready)" icon="pi pi-check-circle" />
                            )}
                        </h4>
                        <p className="m-0 mt-1 text-gray-600 text-sm">
                            Cabang: <strong>{counter.cabang_name || counter.kode_cabang || '-'}</strong>
                            {counter.is_in_use && counter.active_user && (
                                <span> &bull; Kasir Aktif: <strong className="text-orange-600">{counter.active_user}</strong></span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="text-right ml-auto">
                    <span className="text-xs text-gray-500 uppercase font-semibold block">Status Terminal</span>
                    <span className={`text-xl font-bold ${counter.is_in_use ? 'text-orange-600' : 'text-teal-600'}`}>
                        {counter.is_in_use ? 'Shift Terbuka' : 'Siap Buka Shift'}
                    </span>
                    <span className="text-xs text-gray-500 block">
                        {counter.is_in_use ? (counter.active_shift_code || 'Sesi Kasir Aktif') : 'Counter Standby'}
                    </span>
                </div>
            </div>

            {/* 4 Quick Stat Summary Cards */}
            <div className="grid mb-3">
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Ketersediaan</span>
                            <i className={counter.is_in_use ? 'pi pi-lock text-orange-600 bg-orange-50 p-2 border-circle' : 'pi pi-check text-teal-600 bg-teal-50 p-2 border-circle'} />
                        </div>
                        <div>
                            <div className={`text-base font-bold ${counter.is_in_use ? 'text-orange-600' : 'text-teal-600'}`}>
                                {counter.is_in_use ? 'In Use' : 'Tersedia'}
                            </div>
                            <div className="text-xs text-500 mt-1 truncate">
                                {counter.is_in_use ? `Petugas: ${counter.active_user || '-'}` : 'Siap untuk shift baru'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Kode Terminal</span>
                            <i className="pi pi-desktop text-blue-600 bg-blue-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-900">{counter.kode_counter || '-'}</div>
                            <div className="text-xs text-500 mt-1">Identitas terminal fisik</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Lokasi Properti</span>
                            <i className="pi pi-building text-purple-600 bg-purple-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-900 truncate" title={counter.cabang_name || counter.kode_cabang || '-'}>
                                {counter.cabang_name || counter.kode_cabang || '-'}
                            </div>
                            <div className="text-xs text-500 mt-1">Cabang operasional</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Status Konfigurasi</span>
                            <i className="pi pi-power-off text-indigo-600 bg-indigo-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-900">
                                {counter.is_active === 1 ? 'Aktif' : 'Non-Aktif'}
                            </div>
                            <div className="text-xs text-500 mt-1">Status sistem master</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabbed Content */}
            <TabView>
                {/* Tab 1: Spesifikasi & Status Counter */}
                <TabPanel header="Spesifikasi & Status" leftIcon="pi pi-info-circle mr-2">
                    <div className="grid">
                        {/* Kolom Kiri: Spesifikasi Counter */}
                        <div className="col-12 md:col-6">
                            <div className="surface-card p-3 border-round border-1 surface-border h-full shadow-1">
                                <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                                    <i className="pi pi-desktop text-blue-600" /> Identitas Terminal Kasir
                                </h5>
                                <div className="flex flex-column gap-2 text-sm">
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Kode Counter</span>
                                        <span className="font-bold text-900">{counter.kode_counter || '-'}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Nama Counter</span>
                                        <span className="font-semibold text-900">{counter.name}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Cabang Properti</span>
                                        <span className="font-medium text-900">{counter.cabang_name || counter.kode_cabang || '-'}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Status Master</span>
                                        <span>
                                            <Tag
                                                value={counter.is_active === 1 ? 'Aktif' : 'Tidak Aktif'}
                                                severity={counter.is_active === 1 ? 'success' : 'danger'}
                                            />
                                        </span>
                                    </div>
                                    <div className="flex justify-content-between py-2">
                                        <span className="text-500">Kondisi Penggunaan</span>
                                        <span>
                                            <Tag
                                                value={counter.is_in_use ? 'Sedang Digunakan' : 'Tersedia (Ready)'}
                                                severity={counter.is_in_use ? 'warning' : 'success'}
                                                icon={counter.is_in_use ? 'pi pi-lock' : 'pi pi-check'}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Sesi Operasional & Audit Trail */}
                        <div className="col-12 md:col-6">
                            <div className="flex flex-column gap-3 h-full">
                                {/* Card Sesi Aktif */}
                                <div className="surface-card p-3 border-round border-1 surface-border shadow-1 flex-1">
                                    <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                                        <i className="pi pi-user-check text-teal-600" /> Sesi Operasional Kasir
                                    </h5>

                                    {counter.is_in_use ? (
                                        <div className="p-3 bg-yellow-50 border-round border-1 border-yellow-200 text-sm">
                                            <div className="font-bold text-yellow-900 mb-2 flex align-items-center gap-2">
                                                <i className="pi pi-exclamation-circle text-yellow-600" />
                                                Terminal Sedang Memiliki Shift Aktif
                                            </div>
                                            <div className="flex flex-column gap-1 text-700">
                                                <div><strong>Kode Shift:</strong> {counter.active_shift_code || '-'}</div>
                                                <div><strong>Petugas:</strong> {counter.active_fullname || counter.active_username || counter.active_user || '-'}</div>
                                                <div><strong>Waktu Buka:</strong> {counter.active_opened_at ? formatDateSystem(counter.active_opened_at) : '-'}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-green-50 border-round border-1 border-green-200 text-sm text-center">
                                            <i className="pi pi-check-circle text-green-600 text-2xl mb-1 block" />
                                            <div className="font-bold text-green-900">Terminal Tersedia</div>
                                            <div className="text-green-700 text-xs mt-1">
                                                Tidak ada shift kasir yang sedang aktif di counter ini. Counter siap dipilih saat kasir membuka shift baru.
                                            </div>
                                        </div>
                                    )}
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
                                                {counter.created_at ? formatDateSystem(counter.created_at) : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-content-between py-1">
                                            <span className="text-500">Terakhir Diperbarui</span>
                                            <span className="font-medium text-700">
                                                {counter.updated_at ? formatDateSystem(counter.updated_at) : '-'}
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
                                emptyMessage="Belum ada riwayat sesi kasir yang tercatat untuk counter ini"
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
                                    header="Status"
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
