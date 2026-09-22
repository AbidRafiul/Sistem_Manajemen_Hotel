'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { apiInhouseList } from './components/endpoints';
import { DialogFolioDetail } from './components/dialog_folio_detail';
import { DialogTambahFasilitas } from './components/dialog_tambah_fasilitas';
import { DialogExtendStay } from './components/dialog_extend_stay';
import { showError } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';

const TamuMenginapPage = () => {
    const toast = useRef<Toast>(null);
    const router = useRouter();
    const { data: session } = useSession();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    
    // Filters
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCabang, setSelectedCabang] = useState<string>('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Dialog States
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [showFolioDialog, setShowFolioDialog] = useState(false);
    const [showFasilitasDialog, setShowFasilitasDialog] = useState(false);
    const [showExtendDialog, setShowExtendDialog] = useState(false);

    useEffect(() => {
        if (session?.user?.active_kode_cabang) {
            setSelectedCabang(session.user.active_kode_cabang);
        }
    }, [session?.user?.active_kode_cabang]);

    const loadInhouseData = async (keyword: string = searchKeyword, cabang: string = selectedCabang) => {
        setLoading(true);
        try {
            const res = await postData(apiInhouseList, {
                keyword: keyword,
                kode_cabang: cabang
            });
            if (res?.data?.data) {
                setData(res.data.data);
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat data tamu menginap');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCabang) {
            loadInhouseData(searchKeyword, selectedCabang);
        }
    }, [selectedCabang]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchKeyword(val);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            loadInhouseData(val, selectedCabang);
        }, 400);
    };

    // Metrics Calculations
    const totalOccupied = data.length;
    const settledCount = data.filter((d) => d.billing_status === 'settled').length;
    const outstandingCount = data.filter((d) => d.billing_status === 'outstanding').length;
    const totalOutstandingSum = data.reduce((sum, d) => sum + (d.balance > 0 ? d.balance : 0), 0);

    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                {/* Header Title Card */}
                <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border mb-3">
                    <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
                        <div>
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-users text-primary text-2xl"></i>
                                <span className="text-2xl font-bold text-900">Tamu Menginap & Manajemen Folio</span>
                            </div>
                            <span className="text-sm text-color-secondary mt-1 block">
                                Pantau kamar terisi, lakukan penambahan fasilitas/layanan, perpanjang masa tinggal (extend), dan audit saldo tagihan secara langsung.
                            </span>
                        </div>
                        <div className="flex align-items-center gap-2 flex-wrap">
                            <div className="flex align-items-center gap-2 bg-white px-3 py-2 border-round-lg border-1 surface-border">
                                <i className="pi pi-building text-primary font-bold"></i>
                                <span className="text-sm font-bold text-900">
                                    {session?.user?.active_kode_cabang || selectedCabang || '-'} - {session?.user?.active_branch_name || 'Cabang Aktif'}
                                </span>
                            </div>
                            <Button
                                label="Segarkan Data"
                                icon="pi pi-refresh"
                                className="p-button-outlined p-button-sm"
                                onClick={() => loadInhouseData(searchKeyword, selectedCabang)}
                                loading={loading}
                            />
                            <Button
                                label="Dashboard Reservasi"
                                icon="pi pi-th-large"
                                className="p-button-outlined p-button-sm"
                                onClick={() => router.push('/reservasi_dashboard')}
                            />
                            <Button
                                label="Menu Checkout"
                                icon="pi pi-sign-out"
                                className="p-button-sm p-button-danger"
                                onClick={() => router.push('/checkout')}
                            />
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid mb-3">
                    <div className="col-12 sm:col-6 md:col-3">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 flex align-items-center justify-content-between">
                            <div>
                                <span className="text-xs font-bold text-color-secondary uppercase tracking-wider block">Kamar Terisi</span>
                                <span className="text-2xl font-bold text-900 block mt-1">{totalOccupied} Kamar</span>
                            </div>
                            <div className="w-3rem h-3rem border-round-xl bg-blue-100 flex align-items-center justify-content-center">
                                <i className="pi pi-home text-blue-600 text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 sm:col-6 md:col-3">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 flex align-items-center justify-content-between">
                            <div>
                                <span className="text-xs font-bold text-color-secondary uppercase tracking-wider block">Tagihan Lunas</span>
                                <span className="text-2xl font-bold text-green-600 block mt-1">{settledCount} Kamar</span>
                            </div>
                            <div className="w-3rem h-3rem border-round-xl bg-green-100 flex align-items-center justify-content-center">
                                <i className="pi pi-check-circle text-green-600 text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 sm:col-6 md:col-3">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 flex align-items-center justify-content-between">
                            <div>
                                <span className="text-xs font-bold text-color-secondary uppercase tracking-wider block">Ada Tagihan</span>
                                <span className="text-2xl font-bold text-red-600 block mt-1">{outstandingCount} Kamar</span>
                            </div>
                            <div className="w-3rem h-3rem border-round-xl bg-red-100 flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-circle text-red-600 text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 sm:col-6 md:col-3">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 flex align-items-center justify-content-between">
                            <div>
                                <span className="text-xs font-bold text-color-secondary uppercase tracking-wider block">Total Piutang In-House</span>
                                <span className="text-xl font-bold text-orange-600 block mt-1">
                                    Rp {totalOutstandingSum.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="w-3rem h-3rem border-round-xl bg-orange-100 flex align-items-center justify-content-center">
                                <i className="pi pi-wallet text-orange-600 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main DataTable Card */}
                <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border">
                    {/* Toolbar Filters */}
                    <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-2 mb-3">
                        <div className="flex align-items-center gap-2 w-full sm:w-auto">
                            <div className="inline-flex align-items-center gap-2 px-3 py-2 border-round-lg surface-ground border-1 surface-border">
                                <i className="pi pi-building text-primary font-bold"></i>
                                <span className="text-xs text-500 font-medium">Cabang Aktif:</span>
                                <span className="text-sm font-semibold text-900">
                                    {session?.user?.active_kode_cabang || '-'} {session?.user?.active_branch_name ? `(${session.user.active_branch_name})` : ''}
                                </span>
                            </div>
                        </div>
                        <div className="w-full sm:w-auto">
                            <IconField iconPosition="left" className="w-full sm:w-18rem">
                                <InputIcon className="pi pi-search" />
                                <InputText
                                    value={searchKeyword}
                                    onChange={handleSearchChange}
                                    placeholder="Cari kamar / tamu / no reservasi..."
                                    className="w-full"
                                />
                            </IconField>
                        </div>
                    </div>

                    <DataTable
                        value={data}
                        loading={loading}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        emptyMessage="Tidak ada tamu yang sedang menginap."
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        rowHover
                    >
                        {/* Kolom Kamar */}
                        <Column
                            header="Kamar"
                            body={(row) => {
                                const count = row.room_count || row.rooms?.length || 1;
                                return (
                                    <div>
                                        <div className="flex align-items-center gap-2 mb-1">
                                            <span className="font-bold text-base text-900">
                                                Kamar {row.nomor_kamar || row.kode_kamar}
                                            </span>
                                            {count > 1 && (
                                                <Tag severity="info" value={`${count} Kamar`} className="text-xs" />
                                            )}
                                        </div>
                                        <span className="text-xs text-color-secondary block">
                                            {row.nama_tipe_kamar || 'Tipe Kamar'}
                                        </span>
                                    </div>
                                );
                            }}
                            style={{ minWidth: '160px' }}
                        />

                        {/* Kolom Tamu */}
                        <Column
                            header="Tamu"
                            body={(row) => (
                                <div>
                                    <span className="font-bold text-sm text-900 block">{row.guest_name || '-'}</span>
                                    <span className="text-xs text-500 block">
                                        <i className="pi pi-phone mr-1"></i>
                                        {row.guest_phone || '-'}
                                    </span>
                                </div>
                            )}
                            style={{ minWidth: '160px' }}
                        />

                        {/* Kolom Periode Menginap */}
                        <Column
                            header="Periode Menginap"
                            body={(row) => (
                                <div className="text-xs">
                                    <div className="text-700">
                                        In: <strong>{row.check_in_date ? formatDateSystem(row.check_in_date, 'dd MMM yyyy') : '-'}</strong>
                                    </div>
                                    <div className="text-700">
                                        Out: <strong className="text-primary">{row.check_out_date ? formatDateSystem(row.check_out_date, 'dd MMM yyyy') : '-'}</strong>
                                    </div>
                                    <div className="text-color-secondary mt-1 font-semibold">
                                        {row.nights || 1} Malam
                                    </div>
                                </div>
                            )}
                            style={{ minWidth: '150px' }}
                        />

                        {/* Total Tagihan */}
                        <Column
                            header="Total Tagihan"
                            align="right"
                            alignHeader="right"
                            headerStyle={{ textAlign: 'right' }}
                            body={(row) => (
                                <span className="font-semibold text-sm text-900">
                                    Rp {Number(row.grand_total || 0).toLocaleString('id-ID')}
                                </span>
                            )}
                            style={{ minWidth: '120px' }}
                        />

                        {/* Sudah Dibayar */}
                        <Column
                            header="Sudah Dibayar"
                            align="right"
                            alignHeader="right"
                            headerStyle={{ textAlign: 'right' }}
                            body={(row) => (
                                <span className="font-semibold text-sm text-green-600">
                                    Rp {Number(row.total_paid || 0).toLocaleString('id-ID')}
                                </span>
                            )}
                            style={{ minWidth: '120px' }}
                        />

                        {/* Sisa Saldo (Balance) */}
                        <Column
                            header="Sisa Saldo"
                            align="right"
                            alignHeader="right"
                            headerStyle={{ textAlign: 'right' }}
                            body={(row) => {
                                const isSettled = (row.balance || 0) <= 0;
                                return (
                                    <span className={`font-bold text-sm ${isSettled ? 'text-green-700' : 'text-red-600'}`}>
                                        Rp {Number(row.balance || 0).toLocaleString('id-ID')}
                                    </span>
                                );
                            }}
                            style={{ minWidth: '120px' }}
                        />

                        {/* Status Tagihan */}
                        <Column
                            header="Status Tagihan"
                            align="center"
                            alignHeader="center"
                            headerStyle={{ textAlign: 'center' }}
                            body={(row) => {
                                const isSettled = (row.balance || 0) <= 0;
                                return (
                                    <Tag
                                        severity={isSettled ? 'success' : 'danger'}
                                        value={isSettled ? 'LUNAS' : 'ADA TAGIHAN'}
                                        className="text-xs font-bold"
                                    />
                                );
                            }}
                            style={{ minWidth: '120px' }}
                        />

                        {/* Aksi */}
                        <Column
                            header="Aksi"
                            align="center"
                            alignHeader="center"
                            headerStyle={{ textAlign: 'center' }}
                            body={(row) => (
                                <div className="flex align-items-center justify-content-center gap-1">
                                    <Button
                                        icon="pi pi-receipt"
                                        tooltip="Rincian Folio & Billing"
                                        tooltipOptions={{ position: 'top' }}
                                        className="p-button-rounded p-button-text p-button-secondary"
                                        onClick={() => {
                                             setSelectedRow(row);
                                             setShowFolioDialog(true);
                                        }}
                                    />
                                    <Button
                                        icon="pi pi-plus"
                                        tooltip="Tambah Fasilitas/Layanan"
                                        tooltipOptions={{ position: 'top' }}
                                        className="p-button-rounded p-button-text p-button-info"
                                        onClick={() => {
                                            setSelectedRow(row);
                                            setShowFasilitasDialog(true);
                                        }}
                                    />
                                    <Button
                                        icon="pi pi-calendar-plus"
                                        tooltip="Perpanjang Menginap (Extend)"
                                        tooltipOptions={{ position: 'top' }}
                                        className="p-button-rounded p-button-text p-button-warning"
                                        onClick={() => {
                                            setSelectedRow(row);
                                            setShowExtendDialog(true);
                                        }}
                                    />
                                    <Button
                                        icon="pi pi-sign-out"
                                        tooltip="Proses Checkout"
                                        tooltipOptions={{ position: 'top' }}
                                        className="p-button-rounded p-button-text p-button-danger"
                                        onClick={() => router.push('/checkout')}
                                    />
                                </div>
                            )}
                            style={{ minWidth: '160px' }}
                        />
                    </DataTable>
                </div>
            </div>

            {/* Dialog 1: Folio Detail */}
            <DialogFolioDetail
                visible={showFolioDialog}
                onHide={() => {
                    setShowFolioDialog(false);
                    setSelectedRow(null);
                }}
                roomData={selectedRow}
            />

            {/* Dialog 2: Tambah Fasilitas */}
            <DialogTambahFasilitas
                visible={showFasilitasDialog}
                onHide={() => {
                    setShowFasilitasDialog(false);
                    setSelectedRow(null);
                }}
                onSuccess={() => loadInhouseData(searchKeyword, selectedCabang)}
                roomData={selectedRow}
                toast={toast}
            />

            {/* Dialog 3: Extend Stay */}
            <DialogExtendStay
                visible={showExtendDialog}
                onHide={() => {
                    setShowExtendDialog(false);
                    setSelectedRow(null);
                }}
                onSuccess={() => loadInhouseData(searchKeyword, selectedCabang)}
                roomData={selectedRow}
                toast={toast}
            />
        </div>
    );
};

export default TamuMenginapPage;
