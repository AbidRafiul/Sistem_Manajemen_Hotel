'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tooltip } from 'primereact/tooltip';
import { Dialog } from 'primereact/dialog';
import { useRouter } from 'next/navigation';
import postData from '@/lib/axios/postData';
import { showError } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import {
    apiDashboardSummary,
    apiDashboardMonitoring,
    apiCabangDropdown
} from './components/endpoints';

const ReservasiDashboardPage = () => {
    const toast = useRef<Toast>(null);
    const router = useRouter();

    // Branch selection
    const [cabangOptions, setCabangOptions] = useState<any[]>([]);
    const [selectedCabang, setSelectedCabang] = useState<string>('');

    // Summary data & loading
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryData, setSummaryData] = useState<any>(null);

    // Monitoring timeline matrix
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [matrixData, setMatrixData] = useState<any>(null);
    const [matrixDays, setMatrixDays] = useState<number>(7);

    // Front Desk Room Rack Filters & Search
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [floorFilter, setFloorFilter] = useState<string>('all');
    const [searchKeyword, setSearchKeyword] = useState<string>('');

    // Room detail modal state
    const [selectedRoomModal, setSelectedRoomModal] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    // Load initial dropdowns
    const loadDropdowns = async () => {
        try {
            const resCabang = await postData(apiCabangDropdown, {});
            const rawCabang = resCabang?.data?.data || [];
            const cabangList = rawCabang.map((c: any) => ({
                kode_cabang: c.kode_cabang,
                nama_cabang: c.name || c.nama_hotel || c.kode_cabang
            }));
            setCabangOptions(cabangList);
            const defaultCabang = cabangList.length > 0 ? cabangList[0].kode_cabang : '';
            if (defaultCabang) {
                setSelectedCabang(defaultCabang);
            }

            fetchSummary(defaultCabang);
            fetchMonitoring(defaultCabang, matrixDays);
        } catch (error) {
            console.error('Failed to load initial dropdowns', error);
            fetchSummary('');
            fetchMonitoring('', matrixDays);
        }
    };

    const fetchSummary = async (cabang = selectedCabang) => {
        setSummaryLoading(true);
        try {
            const res = await postData(apiDashboardSummary, {
                kode_cabang: cabang || undefined
            });

            if (res?.data?.data) {
                setSummaryData(res.data.data);
                if (!selectedCabang && res.data.data?.filter?.kode_cabang) {
                    setSelectedCabang(res.data.data.filter.kode_cabang);
                }
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat ringkasan operasional front office');
        } finally {
            setSummaryLoading(false);
        }
    };

    const fetchMonitoring = async (cabang = selectedCabang, days = matrixDays) => {
        setMatrixLoading(true);
        try {
            const res = await postData(apiDashboardMonitoring, {
                kode_cabang: cabang || undefined,
                days: days
            });

            if (res?.data?.data) {
                setMatrixData(res.data.data);
            }
        } catch (error: any) {
            console.error('Failed to load room monitoring', error);
        } finally {
            setMatrixLoading(false);
        }
    };

    useEffect(() => {
        loadDropdowns();
    }, []);

    useEffect(() => {
        if (selectedCabang) {
            fetchSummary(selectedCabang);
            fetchMonitoring(selectedCabang, matrixDays);
        }
    }, [selectedCabang]);

    const formatCurrency = (val: number | string | undefined | null) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
            Number(val || 0)
        );
    };

    const kpiToday = summaryData?.kpi_today || {};
    const kpiPeriod = summaryData?.kpi_period || {};
    const catalog = summaryData?.catalog || [];
    const roomRack: any[] = summaryData?.room_rack || [];

    // Distinct floor options for filter
    const floorOptions = useMemo(() => {
        const setFloors = new Set<string>();
        roomRack.forEach((r) => {
            if (r.lantai) setFloors.add(r.lantai);
        });
        const list = Array.from(setFloors).sort().map((f) => ({ label: f, value: f }));
        return [{ label: 'Semua Lantai', value: 'all' }, ...list];
    }, [roomRack]);

    // Counts for status filter pills
    const statusCounts = useMemo(() => {
        let ready = 0;
        let occupied = 0;
        let dirty = 0;
        let maintenance = 0;

        roomRack.forEach((r) => {
            if (r.display_status === 'ready') ready++;
            else if (r.display_status === 'occupied') occupied++;
            else if (r.display_status === 'dirty') dirty++;
            else if (r.display_status === 'maintenance') maintenance++;
        });

        return {
            all: roomRack.length,
            ready,
            occupied,
            dirty,
            maintenance
        };
    }, [roomRack]);

    // Filtered room rack list
    const filteredRoomRack = useMemo(() => {
        return roomRack.filter((rm) => {
            // Status filter
            if (statusFilter !== 'all' && rm.display_status !== statusFilter) {
                return false;
            }
            // Floor filter
            if (floorFilter !== 'all' && rm.lantai !== floorFilter) {
                return false;
            }
            // Search keyword (room number or guest name)
            if (searchKeyword.trim()) {
                const kw = searchKeyword.toLowerCase().trim();
                const matchRoom = rm.nomor_kamar?.toLowerCase().includes(kw);
                const matchType = rm.nama_tipe?.toLowerCase().includes(kw);
                const matchGuest = rm.active_stay?.guest_name?.toLowerCase().includes(kw);
                const matchFolio = rm.active_stay?.kode_folio?.toLowerCase().includes(kw);
                if (!matchRoom && !matchType && !matchGuest && !matchFolio) {
                    return false;
                }
            }
            return true;
        });
    }, [roomRack, statusFilter, floorFilter, searchKeyword]);

    const handleRoomClick = (room: any) => {
        setSelectedRoomModal(room);
        setModalVisible(true);
    };

    const handleBookingDirect = (item: any, type: 'walkin' | 'booking') => {
        const target = type === 'walkin' ? '/reservasi_baru' : '/reservasi_booking';
        const branchParam = selectedCabang ? `?cabang=${selectedCabang}&tipe=${item.kode_tipe_kamar}` : `?tipe=${item.kode_tipe_kamar}`;
        router.push(`${target}${branchParam}`);
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <Tooltip target=".matrix-cell-occupied" position="top" />
            <Tooltip target=".matrix-cell-booked" position="top" />

            {/* Front Office Header Toolbar */}
            <div className="col-12">
                <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border mb-3">
                    <div className="flex flex-column lg:flex-row justify-content-between align-items-start lg:align-items-center gap-3">
                        <div>
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-desktop text-primary text-2xl"></i>
                                <span className="text-2xl font-bold text-900">Dashboard Operasional Front Office</span>
                            </div>
                            <span className="text-sm text-color-secondary mt-1 block">
                                Monitoring kondisi fisik kamar, ketersediaan real-time, status hunian tamu, dan operasional meja resepsionis.
                            </span>
                        </div>

                        {/* Branch Selector, Refresh, and Quick Actions */}
                        <div className="flex align-items-center gap-2 flex-wrap w-full lg:w-auto justify-content-start lg:justify-content-end">
                            {/* Compact Cabang Hotel Dropdown */}
                            <div className="flex align-items-center gap-1">
                                <Dropdown
                                    value={selectedCabang}
                                    options={cabangOptions}
                                    optionLabel="nama_cabang"
                                    optionValue="kode_cabang"
                                    onChange={(e) => setSelectedCabang(e.value)}
                                    placeholder="Pilih Cabang"
                                    className="w-14rem sm:w-16rem text-sm"
                                />
                                <Button
                                    icon="pi pi-refresh"
                                    className="p-button-outlined p-button-sm"
                                    onClick={() => {
                                        fetchSummary(selectedCabang);
                                        fetchMonitoring(selectedCabang, matrixDays);
                                    }}
                                    tooltip="Muat Ulang Data Operasional"
                                    tooltipOptions={{ position: 'top' }}
                                    loading={summaryLoading || matrixLoading}
                                />
                            </div>

                            <div className="flex align-items-center gap-2 flex-wrap">
                                <Button
                                    label="Walk-In Baru"
                                    icon="pi pi-plus"
                                    className="p-button-sm p-button-success font-semibold"
                                    onClick={() => router.push(selectedCabang ? `/reservasi_baru?cabang=${selectedCabang}` : '/reservasi_baru')}
                                />
                                <Button
                                    label="Booking Reservasi"
                                    icon="pi pi-calendar-plus"
                                    className="p-button-sm p-button-primary font-semibold"
                                    onClick={() => router.push(selectedCabang ? `/reservasi_booking?cabang=${selectedCabang}` : '/reservasi_booking')}
                                />
                                <Button
                                    label="Tamu Menginap"
                                    icon="pi pi-users"
                                    className="p-button-outlined p-button-sm"
                                    onClick={() => router.push('/tamu_menginap')}
                                />
                                <Button
                                    label="Checkout"
                                    icon="pi pi-sign-out"
                                    className="p-button-outlined p-button-sm"
                                    onClick={() => router.push('/checkout')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6 Front Office Operational KPI Cards */}
                <div className="grid mb-3">
                    {/* 1. Total Kamar */}
                    <div className="col-6 sm:col-4 lg:col-2">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
                            <div className="flex justify-content-between align-items-start mb-2">
                                <span className="text-xs font-bold text-color-secondary uppercase tracking-wider">
                                    Total Kamar
                                </span>
                                <div className="w-2rem h-2rem border-round bg-gray-100 flex align-items-center justify-content-center">
                                    <i className="pi pi-building text-gray-700 text-sm"></i>
                                </div>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-900 block">
                                    {roomRack.length || kpiPeriod.total_rooms || 0}
                                </span>
                                <span className="text-xs text-500">Kapasitas Fisik Hotel</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Terisi (In-House) */}
                    <div className="col-6 sm:col-4 lg:col-2">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
                            <div className="flex justify-content-between align-items-start mb-2">
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                                    Terisi (In-House)
                                </span>
                                <div className="w-2rem h-2rem border-round bg-blue-100 flex align-items-center justify-content-center">
                                    <i className="pi pi-user text-blue-700 text-sm"></i>
                                </div>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-blue-700 block">
                                    {kpiToday.occupied_rooms ?? 0}
                                </span>
                                <span className="text-xs text-blue-600 font-semibold">
                                    {kpiPeriod.occupancy_rate_period ?? 0}% Okupansi
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Siap Huni (Clean) */}
                    <div className="col-6 sm:col-4 lg:col-2">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
                            <div className="flex justify-content-between align-items-start mb-2">
                                <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                                    Siap Huni (Clean)
                                </span>
                                <div className="w-2rem h-2rem border-round bg-green-100 flex align-items-center justify-content-center">
                                    <i className="pi pi-check-circle text-green-700 text-sm"></i>
                                </div>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-green-600 block">
                                    {kpiToday.ready_rooms ?? 0}
                                </span>
                                <span className="text-xs text-500">Siap Check-In / Walk-In</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Pembersihan (Dirty) */}
                    <div className="col-6 sm:col-4 lg:col-2">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
                            <div className="flex justify-content-between align-items-start mb-2">
                                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
                                    Pembersihan (Dirty)
                                </span>
                                <div className="w-2rem h-2rem border-round bg-red-100 flex align-items-center justify-content-center">
                                    <i className="pi pi-clock text-red-700 text-sm"></i>
                                </div>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-red-600 block">
                                    {kpiToday.dirty_rooms ?? 0}
                                </span>
                                <span className="text-xs text-500">Tugas Housekeeping</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. Kedatangan Hari Ini (Arrivals) */}
                    <div className="col-6 sm:col-4 lg:col-2">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
                            <div className="flex justify-content-between align-items-start mb-2">
                                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                                    Arrivals Hari Ini
                                </span>
                                <div className="w-2rem h-2rem border-round bg-teal-100 flex align-items-center justify-content-center">
                                    <i className="pi pi-arrow-down text-teal-700 text-sm"></i>
                                </div>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-teal-600 block">
                                    {kpiToday.arrivals_today ?? 0}
                                </span>
                                <span className="text-xs text-500">Jadwal Masuk (In)</span>
                            </div>
                        </div>
                    </div>

                    {/* 6. Keberangkatan Hari Ini (Departures) */}
                    <div className="col-6 sm:col-4 lg:col-2">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
                            <div className="flex justify-content-between align-items-start mb-2">
                                <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                                    Departures Hari Ini
                                </span>
                                <div className="w-2rem h-2rem border-round bg-orange-100 flex align-items-center justify-content-center">
                                    <i className="pi pi-arrow-up text-orange-700 text-sm"></i>
                                </div>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-orange-600 block">
                                    {kpiToday.departures_today ?? 0}
                                </span>
                                <span className="text-xs text-500">Jadwal Keluar (Out)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Front Office Workspace: TabView */}
                <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border">
                    <TabView>
                        {/* TAB 1: Visual Room Rack Grid (Rak Kamar Front Desk) */}
                        <TabPanel header="Rak Kamar Front Desk (Denah Real-Time)" leftIcon="pi pi-th-large mr-2">
                            {/* Toolbar & Filters for Room Rack */}
                            <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3 mb-4 pb-3 border-bottom-1 surface-border">
                                {/* Status Filter Pills */}
                                <div className="flex flex-wrap align-items-center gap-1">
                                    <Button
                                        label={`Semua (${statusCounts.all})`}
                                        size="small"
                                        className={statusFilter === 'all' ? 'p-button-primary' : 'p-button-outlined'}
                                        onClick={() => setStatusFilter('all')}
                                    />
                                    <Button
                                        label={`Siap Huni (${statusCounts.ready})`}
                                        size="small"
                                        className={statusFilter === 'ready' ? 'p-button-success' : 'p-button-outlined p-button-success'}
                                        onClick={() => setStatusFilter('ready')}
                                    />
                                    <Button
                                        label={`Terisi (${statusCounts.occupied})`}
                                        size="small"
                                        className={statusFilter === 'occupied' ? 'p-button-info' : 'p-button-outlined p-button-info'}
                                        onClick={() => setStatusFilter('occupied')}
                                    />
                                    <Button
                                        label={`Pembersihan (${statusCounts.dirty})`}
                                        size="small"
                                        className={statusFilter === 'dirty' ? 'p-button-danger' : 'p-button-outlined p-button-danger'}
                                        onClick={() => setStatusFilter('dirty')}
                                    />
                                    {statusCounts.maintenance > 0 && (
                                        <Button
                                            label={`Perawatan (${statusCounts.maintenance})`}
                                            size="small"
                                            className={statusFilter === 'maintenance' ? 'p-button-secondary' : 'p-button-outlined p-button-secondary'}
                                            onClick={() => setStatusFilter('maintenance')}
                                        />
                                    )}
                                </div>

                                {/* Floor Filter and Search Box */}
                                <div className="flex align-items-center gap-2 w-full md:w-auto">
                                    <Dropdown
                                        value={floorFilter}
                                        options={floorOptions}
                                        onChange={(e) => setFloorFilter(e.value)}
                                        className="text-sm w-12rem"
                                    />
                                    <IconField iconPosition="left" className="w-full md:w-16rem">
                                        <InputIcon className="pi pi-search text-500" />
                                        <InputText
                                            value={searchKeyword}
                                            onChange={(e) => setSearchKeyword(e.target.value)}
                                            placeholder="Cari no. kamar / tamu..."
                                            className="w-full text-sm"
                                        />
                                    </IconField>
                                </div>
                            </div>

                            {/* Room Rack Grid Content */}
                            {summaryLoading ? (
                                <div className="p-5 text-center text-500">
                                    <i className="pi pi-spin pi-spinner text-3xl mb-2"></i>
                                    <div>Memuat status rak kamar hotel...</div>
                                </div>
                            ) : filteredRoomRack.length === 0 ? (
                                <div className="p-5 text-center text-500 border-dashed border-round surface-border">
                                    <i className="pi pi-inbox text-4xl mb-2"></i>
                                    <div>Tidak ada kamar yang cocok dengan filter atau pencarian Anda.</div>
                                </div>
                            ) : (
                                <div className="grid">
                                    {filteredRoomRack.map((rm: any) => {
                                        const isReady = rm.display_status === 'ready';
                                        const isOccupied = rm.display_status === 'occupied';
                                        const isDirty = rm.display_status === 'dirty';
                                        const isMaint = rm.display_status === 'maintenance';

                                        // Color themes based on room status
                                        let borderClass = 'border-green-400';
                                        let bgClass = 'surface-card hover:surface-50';
                                        let tagSeverity: 'success' | 'info' | 'danger' | 'warning' = 'success';
                                        let statusText = 'Siap Huni';
                                        let statusIcon = 'pi-check-circle';

                                        if (isOccupied) {
                                            borderClass = 'border-blue-400';
                                            bgClass = 'surface-card hover:surface-50';
                                            tagSeverity = 'info';
                                            statusText = 'Terisi (In-House)';
                                            statusIcon = 'pi-user';
                                        } else if (isDirty) {
                                            borderClass = 'border-red-400';
                                            tagSeverity = 'danger';
                                            statusText = 'Pembersihan (Dirty)';
                                            statusIcon = 'pi-clock';
                                        } else if (isMaint) {
                                            borderClass = 'border-500';
                                            tagSeverity = 'warning';
                                            statusText = 'Perawatan';
                                            statusIcon = 'pi-exclamation-triangle';
                                        }

                                        return (
                                            <div key={rm.kode_kamar} className="col-12 sm:col-6 md:col-4 xl:col-3">
                                                <div
                                                    className={`border-round-xl border-1 shadow-1 p-3 h-full flex flex-column justify-content-between transition-all transition-duration-200 cursor-pointer ${borderClass} ${bgClass}`}
                                                    onClick={() => handleRoomClick(rm)}
                                                >
                                                    <div>
                                                        {/* Top Card: Room Number & Status Badge */}
                                                        <div className="flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                <div className="flex align-items-baseline gap-2">
                                                                    <span className="text-2xl font-bold text-900">
                                                                        {rm.nomor_kamar}
                                                                    </span>
                                                                    <span className="text-xs text-500 font-medium">
                                                                        {rm.lantai || 'Lantai 1'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs font-semibold text-primary block mt-1">
                                                                    {rm.nama_tipe}
                                                                </span>
                                                            </div>
                                                            <Tag
                                                                severity={tagSeverity}
                                                                value={statusText}
                                                                icon={`pi ${statusIcon}`}
                                                                className="text-xs"
                                                            />
                                                        </div>

                                                        {/* Middle Card: Detailed Status Information */}
                                                        <div className="mt-3">
                                                            {isOccupied && rm.active_stay ? (
                                                                <div className="surface-50 border-round-lg p-2 border-1 surface-border text-xs">
                                                                    <div className="flex align-items-center gap-1 font-bold text-900 mb-1">
                                                                        <i className="pi pi-user text-blue-600"></i>
                                                                        <span className="truncate">{rm.active_stay.guest_name}</span>
                                                                    </div>
                                                                    <div className="text-500 mb-1">
                                                                        <i className="pi pi-calendar mr-1 text-xs"></i>
                                                                        {rm.active_stay.check_in_date} &rarr; {rm.active_stay.check_out_date}
                                                                    </div>
                                                                    <div className="flex justify-content-between align-items-center mt-2 pt-1 border-top-1 surface-border">
                                                                        <span className="text-xxs text-600 font-mono">
                                                                            {rm.active_stay.kode_folio || rm.active_stay.kode_reservasi}
                                                                        </span>
                                                                        <Tag severity="info" value="In-House" className="text-xxs" />
                                                                    </div>
                                                                </div>
                                                            ) : isReady ? (
                                                                <div className="surface-50 border-round-lg p-2 border-1 surface-border text-xs">
                                                                    <div className="text-green-700 font-medium flex align-items-center gap-1 mb-1">
                                                                        <i className="pi pi-check text-green-600"></i>
                                                                        <span>Kamar Bersih & Siap Huni</span>
                                                                    </div>
                                                                    <span className="text-500 block text-xxs">
                                                                        Dapat langsung dialokasikan untuk tamu Walk-In atau reservasi hari ini.
                                                                    </span>
                                                                </div>
                                                            ) : isDirty ? (
                                                                <div className="surface-50 border-round-lg p-2 border-1 surface-border text-xs">
                                                                    <div className="text-red-700 font-medium flex align-items-center gap-1 mb-1">
                                                                        <i className="pi pi-clock text-red-600"></i>
                                                                        <span>Tugas Housekeeping (Dirty)</span>
                                                                    </div>
                                                                    <span className="text-500 block text-xxs">
                                                                        Menunggu giliran pembersihan oleh room boy / staf tata graha.
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="surface-50 border-round-lg p-2 border-1 surface-border text-xs">
                                                                    <span className="text-orange-700 font-medium block">
                                                                        Status: {rm.housekeeping_status}
                                                                    </span>
                                                                    <span className="text-500 text-xxs">
                                                                        Kamar dinonaktifkan sementara untuk perawatan/perbaikan.
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Bottom Card: Contextual Actions */}
                                                    <div className="mt-3 pt-2 border-top-1 surface-border flex gap-2">
                                                        {isReady ? (
                                                            <Button
                                                                label="Walk-In"
                                                                icon="pi pi-plus"
                                                                className="p-button-sm p-button-success w-full text-xs font-semibold"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const branchParam = selectedCabang ? `&cabang=${selectedCabang}` : '';
                                                                    router.push(`/reservasi_baru?kamar=${rm.nomor_kamar}&tipe=${rm.kode_tipe_kamar}${branchParam}`);
                                                                }}
                                                            />
                                                        ) : isOccupied ? (
                                                            <>
                                                                <Button
                                                                    label="Folio"
                                                                    icon="pi pi-file"
                                                                    className="p-button-sm p-button-outlined flex-1 text-xs"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        router.push('/tamu_menginap');
                                                                    }}
                                                                />
                                                                <Button
                                                                    label="Checkout"
                                                                    icon="pi pi-sign-out"
                                                                    className="p-button-sm p-button-danger p-button-outlined flex-1 text-xs"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        router.push(`/checkout?keyword=${rm.nomor_kamar}`);
                                                                    }}
                                                                />
                                                            </>
                                                        ) : (
                                                            <Button
                                                                label="Detail Kamar"
                                                                icon="pi pi-info-circle"
                                                                className="p-button-sm p-button-outlined p-button-secondary w-full text-xs"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRoomClick(rm);
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </TabPanel>

                        {/* TAB 2: Room Occupancy Timeline Matrix */}
                        <TabPanel header="Matriks Monitoring Okupansi (7 / 14 Hari)" leftIcon="pi pi-calendar mr-2">
                            <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-2 mb-3">
                                <div>
                                    <h6 className="m-0 font-bold text-900">Timeline Ketersediaan Kamar per Tanggal</h6>
                                    <span className="text-xs text-500">
                                        Mulai hari ini ({formatDateSystem(new Date(), 'dd MMMM yyyy')}) &bull; Status okupansi kamar fisik mendatang
                                    </span>
                                </div>
                                <div className="flex align-items-center gap-2">
                                    <span className="text-xs text-700 font-semibold">Rentang Tampil:</span>
                                    <Button
                                        label="7 Hari"
                                        size="small"
                                        className={matrixDays === 7 ? 'p-button-primary' : 'p-button-outlined'}
                                        onClick={() => {
                                            setMatrixDays(7);
                                            fetchMonitoring(selectedCabang, 7);
                                        }}
                                    />
                                    <Button
                                        label="14 Hari"
                                        size="small"
                                        className={matrixDays === 14 ? 'p-button-primary' : 'p-button-outlined'}
                                        onClick={() => {
                                            setMatrixDays(14);
                                            fetchMonitoring(selectedCabang, 14);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Matrix Legend */}
                            <div className="flex flex-wrap align-items-center gap-3 p-2 surface-50 border-round mb-3 text-xs">
                                <span className="font-bold text-700">Keterangan:</span>
                                <div className="flex align-items-center gap-1">
                                    <span className="w-1rem h-1rem border-round bg-green-100 border-1 border-green-400 inline-block"></span>
                                    <span>Tersedia (Ready)</span>
                                </div>
                                <div className="flex align-items-center gap-1">
                                    <span className="w-1rem h-1rem border-round bg-blue-100 border-1 border-blue-400 inline-block"></span>
                                    <span>Terisi (In-House)</span>
                                </div>
                                <div className="flex align-items-center gap-1">
                                    <span className="w-1rem h-1rem border-round bg-orange-100 border-1 border-orange-400 inline-block"></span>
                                    <span>Dipesan (Booked)</span>
                                </div>
                                <div className="flex align-items-center gap-1">
                                    <span className="w-1rem h-1rem border-round bg-red-100 border-1 border-red-400 inline-block"></span>
                                    <span>Pembersihan / Dirty</span>
                                </div>
                            </div>

                            {matrixLoading ? (
                                <div className="p-5 text-center text-500">
                                    <i className="pi pi-spin pi-spinner text-3xl mb-2"></i>
                                    <div>Memuat matriks ketersediaan kamar...</div>
                                </div>
                            ) : !matrixData || !matrixData.rooms || matrixData.rooms.length === 0 ? (
                                <div className="p-5 text-center text-500 border-dashed border-round surface-border">
                                    Tidak ada data kamar untuk cabang terpilih.
                                </div>
                            ) : (
                                <div className="overflow-x-auto border-1 surface-border border-round-xl">
                                    <table className="w-full border-collapse text-xs" style={{ minWidth: '750px' }}>
                                        <thead>
                                            <tr className="surface-100 border-bottom-1 surface-border">
                                                <th className="p-2 text-left sticky left-0 surface-100 font-bold z-1" style={{ width: '140px' }}>
                                                    Kamar & Tipe
                                                </th>
                                                {(matrixData.date_headers || []).map((dh: string, idx: number) => {
                                                    const dateObj = new Date(dh);
                                                    return (
                                                        <th key={idx} className="p-2 text-center border-left-1 surface-border font-bold">
                                                            <div>{formatDateSystem(dateObj, 'EEE')}</div>
                                                            <div className="text-500">{formatDateSystem(dateObj, 'dd/MM')}</div>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matrixData.rooms.map((rm: any, rIdx: number) => (
                                                <tr key={rIdx} className="border-bottom-1 surface-border hover:surface-50">
                                                    <td className="p-2 sticky left-0 bg-white surface-border font-semibold z-1">
                                                        <div className="flex align-items-center gap-1">
                                                            <span className="text-sm font-bold text-primary">{rm.nomor_kamar}</span>
                                                            <span className="text-xs text-500 font-normal">({rm.nama_tipe})</span>
                                                        </div>
                                                        <div className="text-xxs text-400">Lt. {rm.lantai || 1} &bull; {rm.status_kondisi}</div>
                                                    </td>

                                                    {(matrixData.date_headers || []).map((dh: string, cIdx: number) => {
                                                        const dateStatus = rm.dates?.[dh];
                                                        const isOccupied = dateStatus?.is_occupied;
                                                        const statusType = dateStatus?.status;
                                                        const resv = dateStatus?.reservation;

                                                        let bgClass = 'bg-green-50 text-green-700 hover:bg-green-100';
                                                        let label = 'Ready';
                                                        let icon = 'pi-check';
                                                        let tooltipText = `Kamar ${rm.nomor_kamar}: Siap Jual (${dh})`;

                                                        if (isOccupied && statusType === 'inhouse') {
                                                            bgClass = 'bg-blue-100 text-blue-800 hover:bg-blue-200 matrix-cell-occupied';
                                                            label = 'In-House';
                                                            icon = 'pi-user';
                                                            tooltipText = `Tamu: ${resv?.guest_name || 'In-House'} (${resv?.status_reservasi || 'checkin'})`;
                                                        } else if (isOccupied && statusType === 'booked') {
                                                            bgClass = 'bg-orange-100 text-orange-800 hover:bg-orange-200 matrix-cell-booked';
                                                            label = 'Booked';
                                                            icon = 'pi-calendar';
                                                            tooltipText = `Booking: ${resv?.guest_name || 'Reserved'} (${resv?.kode_reservasi || '-'})`;
                                                        } else if (rm.status_kondisi === 'dirty' && dh === formatDateSystem(new Date(), 'yyyy-MM-dd')) {
                                                            bgClass = 'bg-red-50 text-red-700';
                                                            label = 'Cleaning';
                                                            icon = 'pi-clock';
                                                            tooltipText = 'Kamar dalam proses pembersihan Housekeeping';
                                                        }

                                                        return (
                                                            <td
                                                                key={cIdx}
                                                                className={`p-2 text-center border-left-1 surface-border transition-colors transition-duration-150 ${bgClass}`}
                                                                data-pr-tooltip={tooltipText}
                                                            >
                                                                <div className="flex align-items-center justify-content-center gap-1 font-semibold">
                                                                    <i className={`pi ${icon} text-xs`}></i>
                                                                    <span>{label}</span>
                                                                </div>
                                                                {resv && (
                                                                    <div className="text-xxs text-600 truncate max-w-6rem mx-auto">
                                                                        {resv.guest_name}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </TabPanel>

                        {/* TAB 3: Room Type Catalog & Reference */}
                        <TabPanel header="Katalog Tipe Kamar & Tarif" leftIcon="pi pi-list mr-2">
                            <div className="flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h6 className="m-0 font-bold text-900">
                                        Daftar Tipe Kamar Hotel ({catalog.length} tipe terdaftar)
                                    </h6>
                                    <span className="text-xs text-500">
                                        Panduan tarif dasar resmi, kapasitas hunian, dan ketersediaan unit untuk resepsionis
                                    </span>
                                </div>
                            </div>

                            {summaryLoading ? (
                                <div className="p-5 text-center text-500">
                                    <i className="pi pi-spin pi-spinner text-3xl mb-2"></i>
                                    <div>Memuat katalog tipe kamar...</div>
                                </div>
                            ) : catalog.length === 0 ? (
                                <div className="p-5 text-center text-500 border-dashed border-round surface-border">
                                    <i className="pi pi-inbox text-4xl mb-2"></i>
                                    <div>Belum ada data tipe kamar pada cabang ini.</div>
                                </div>
                            ) : (
                                <div className="grid">
                                    {catalog.map((item: any) => {
                                        const isAvail = item.is_available;
                                        return (
                                            <div key={item.kode_tipe_kamar} className="col-12 md:col-6 xl:col-4">
                                                <div className="surface-border border-1 border-round-xl overflow-hidden shadow-1 h-full flex flex-column justify-content-between surface-card hover:shadow-2 transition-duration-200">
                                                    <div>
                                                        {/* Room Image / Visual Banner */}
                                                        <div className="relative w-full h-12rem bg-gray-100 overflow-hidden">
                                                            <img
                                                                src={item.foto_url || '/api/assets/uploads/tipe_kamar/foto_TIP0001_interior.jpg'}
                                                                alt={item.nama_tipe}
                                                                className="w-full h-full object-cover transition-transform transition-duration-300 hover:scale-105"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
                                                                }}
                                                            />
                                                            <div className="absolute top-0 left-0 right-0 p-3 flex justify-content-between align-items-start bg-gradient-to-b from-black-alpha-70 to-transparent">
                                                                <Tag
                                                                    severity={isAvail ? 'success' : 'danger'}
                                                                    value={isAvail ? `Tersedia: ${item.available_units} Unit` : 'Penuh'}
                                                                    icon={isAvail ? 'pi pi-check-circle' : 'pi pi-times-circle'}
                                                                />
                                                                <span className="bg-black-alpha-70 text-white text-xs px-2 py-1 border-round font-semibold">
                                                                    Total: {item.total_units} Kamar
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Body Details */}
                                                        <div className="p-3">
                                                            <div className="mb-2">
                                                                <h5 className="m-0 font-bold text-900 text-lg">
                                                                    {item.nama_tipe}
                                                                </h5>
                                                                <div className="flex align-items-center gap-2 text-xs text-600 mt-1">
                                                                    <span className="flex align-items-center gap-1 font-medium">
                                                                        <i className="pi pi-users text-primary text-xs"></i>
                                                                        {item.kapasitas_dewasa} Dewasa, {item.kapasitas_anak} Anak
                                                                    </span>
                                                                    <span>&bull;</span>
                                                                    <span className="flex align-items-center gap-1">
                                                                        <i className="pi pi-arrows-alt text-500 text-xs"></i>
                                                                        {item.luas_m2} m²
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <p className="text-xs text-600 m-0 line-clamp-2 mb-3">
                                                                {item.deskripsi || 'Kamar nyaman dengan standar pelayanan hotel berbintang.'}
                                                            </p>

                                                            {/* Facilities Chips */}
                                                            <div className="flex flex-wrap gap-1 mb-3">
                                                                {(item.fasilitas || ['Free WiFi', 'AC', 'TV']).map(
                                                                    (f: string, fIdx: number) => (
                                                                        <span
                                                                            key={fIdx}
                                                                            className="text-xs surface-100 text-700 px-2 py-1 border-round flex align-items-center gap-1"
                                                                        >
                                                                            <i className="pi pi-check text-green-600 text-xs"></i>
                                                                            {f}
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>

                                                            {/* Rate info */}
                                                            <div className="surface-50 border-1 surface-border p-2 border-round-lg text-xs">
                                                                <div className="flex justify-content-between align-items-center">
                                                                    <span className="text-500">Tarif Dasar / Malam:</span>
                                                                    <span className="text-base font-bold text-primary">
                                                                        {formatCurrency(item.rate_per_night)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Direct Booking Actions */}
                                                    <div className="p-3 pt-0 flex gap-2">
                                                        <Button
                                                            label="Pesan Walk-In"
                                                            icon="pi pi-check"
                                                            className="p-button-sm p-button-success flex-1 font-semibold"
                                                            disabled={!isAvail}
                                                            onClick={() => handleBookingDirect(item, 'walkin')}
                                                        />
                                                        <Button
                                                            label="Booking"
                                                            icon="pi pi-calendar-plus"
                                                            className="p-button-sm p-button-outlined flex-1 font-semibold"
                                                            disabled={!isAvail}
                                                            onClick={() => handleBookingDirect(item, 'booking')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </TabPanel>
                    </TabView>
                </div>
            </div>

            {/* Room Detail Modal Dialog */}
            <Dialog
                header={`Informasi Kamar ${selectedRoomModal?.nomor_kamar || ''}`}
                visible={modalVisible}
                style={{ width: '450px' }}
                onHide={() => setModalVisible(false)}
                footer={
                    <div className="flex justify-content-end gap-2">
                        {selectedRoomModal?.display_status === 'ready' && (
                            <Button
                                label="Walk-In Kamar Ini"
                                icon="pi pi-plus"
                                className="p-button-success p-button-sm font-semibold"
                                onClick={() => {
                                    setModalVisible(false);
                                    const branchParam = selectedCabang ? `&cabang=${selectedCabang}` : '';
                                    router.push(`/reservasi_baru?kamar=${selectedRoomModal.nomor_kamar}&tipe=${selectedRoomModal.kode_tipe_kamar}${branchParam}`);
                                }}
                            />
                        )}
                        {selectedRoomModal?.display_status === 'occupied' && (
                            <>
                                <Button
                                    label="Folio Tamu"
                                    icon="pi pi-file"
                                    className="p-button-outlined p-button-sm"
                                    onClick={() => {
                                        setModalVisible(false);
                                        router.push('/tamu_menginap');
                                    }}
                                />
                                <Button
                                    label="Checkout"
                                    icon="pi pi-sign-out"
                                    className="p-button-danger p-button-sm"
                                    onClick={() => {
                                        setModalVisible(false);
                                        router.push(`/checkout?keyword=${selectedRoomModal.nomor_kamar}`);
                                    }}
                                />
                            </>
                        )}
                        <Button
                            label="Tutup"
                            icon="pi pi-times"
                            className="p-button-text p-button-sm"
                            onClick={() => setModalVisible(false)}
                        />
                    </div>
                }
            >
                {selectedRoomModal && (
                    <div className="text-sm">
                        <div className="flex align-items-center justify-content-between mb-3 pb-2 border-bottom-1 surface-border">
                            <div>
                                <span className="text-xl font-bold text-900 block">Kamar {selectedRoomModal.nomor_kamar}</span>
                                <span className="text-xs text-500 font-medium">{selectedRoomModal.nama_tipe} &bull; {selectedRoomModal.lantai}</span>
                            </div>
                            <Tag
                                severity={
                                    selectedRoomModal.display_status === 'ready'
                                        ? 'success'
                                        : selectedRoomModal.display_status === 'occupied'
                                        ? 'info'
                                        : selectedRoomModal.display_status === 'dirty'
                                        ? 'danger'
                                        : 'warning'
                                }
                                value={selectedRoomModal.status_label || selectedRoomModal.display_status}
                            />
                        </div>

                        <div className="grid mb-3">
                            <div className="col-6">
                                <span className="text-xs text-500 block">Status Okupansi</span>
                                <span className="font-semibold text-900 capitalize">{selectedRoomModal.occupancy_status || '-'}</span>
                            </div>
                            <div className="col-6">
                                <span className="text-xs text-500 block">Status Housekeeping</span>
                                <span className="font-semibold text-900 capitalize">{selectedRoomModal.housekeeping_status || '-'}</span>
                            </div>
                            {selectedRoomModal.tipe_pemandangan && (
                                <div className="col-12">
                                    <span className="text-xs text-500 block">Pemandangan (View)</span>
                                    <span className="font-semibold text-900">{selectedRoomModal.tipe_pemandangan}</span>
                                </div>
                            )}
                        </div>

                        {/* If Occupied: Guest Stay Info */}
                        {selectedRoomModal.active_stay ? (
                            <div className="surface-50 border-round-xl p-3 border-1 surface-border">
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-2">
                                    Data Tamu Menginap (In-House)
                                </span>
                                <div className="mb-2">
                                    <span className="text-xs text-500 block">Nama Tamu</span>
                                    <span className="font-bold text-900 text-base">{selectedRoomModal.active_stay.guest_name}</span>
                                </div>
                                <div className="grid">
                                    <div className="col-6">
                                        <span className="text-xs text-500 block">No. Telepon</span>
                                        <span className="font-medium text-900">{selectedRoomModal.active_stay.phone}</span>
                                    </div>
                                    <div className="col-6">
                                        <span className="text-xs text-500 block">No. Folio</span>
                                        <span className="font-mono text-primary font-semibold">{selectedRoomModal.active_stay.kode_folio || '-'}</span>
                                    </div>
                                    <div className="col-6">
                                        <span className="text-xs text-500 block">Check-In</span>
                                        <span className="font-medium text-900">{selectedRoomModal.active_stay.check_in_date}</span>
                                    </div>
                                    <div className="col-6">
                                        <span className="text-xs text-500 block">Check-Out</span>
                                        <span className="font-medium text-900">{selectedRoomModal.active_stay.check_out_date}</span>
                                    </div>
                                </div>
                            </div>
                        ) : selectedRoomModal.display_status === 'ready' ? (
                            <div className="surface-50 border-round-xl p-3 border-1 surface-border text-center">
                                <i className="pi pi-check-circle text-green-600 text-3xl mb-2 block"></i>
                                <span className="font-bold text-green-700 block">Kamar Siap Digunakan</span>
                                <span className="text-xs text-600 block mt-1">
                                    Kamar telah dibersihkan dan lulus inspeksi. Anda dapat langsung mengalokasikan kamar ini kepada tamu baru.
                                </span>
                            </div>
                        ) : selectedRoomModal.display_status === 'dirty' ? (
                            <div className="surface-50 border-round-xl p-3 border-1 surface-border text-center">
                                <i className="pi pi-clock text-red-600 text-3xl mb-2 block"></i>
                                <span className="font-bold text-red-700 block">Dalam Antrean Housekeeping</span>
                                <span className="text-xs text-600 block mt-1">
                                    Kamar kotor setelah tamu checkout. Menunggu giliran pembersihan dan pergantian linen oleh staf Housekeeping.
                                </span>
                            </div>
                        ) : null}
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default ReservasiDashboardPage;
