'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tooltip } from 'primereact/tooltip';
import { useRouter } from 'next/navigation';
import postData from '@/lib/axios/postData';
import { showError } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import {
    apiDashboardSummary,
    apiDashboardMonitoring,
    apiCabangDropdown,
    apiTipeKamarDropdown
} from './components/endpoints';

const ReservasiDashboardPage = () => {
    const toast = useRef<Toast>(null);
    const router = useRouter();

    // Filters state
    const [cabangOptions, setCabangOptions] = useState<any[]>([]);
    const [selectedCabang, setSelectedCabang] = useState<string>('');

    const [tipeKamarOptions, setTipeKamarOptions] = useState<any[]>([]);
    const [selectedTipeKamar, setSelectedTipeKamar] = useState<string>('');

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [checkInDate, setCheckInDate] = useState<Date>(today);
    const [checkOutDate, setCheckOutDate] = useState<Date>(tomorrow);
    const [totalKamar, setTotalKamar] = useState<number>(1);
    const [totalTamu, setTotalTamu] = useState<number>(1);

    // Summary data
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryData, setSummaryData] = useState<any>(null);

    // Monitoring matrix data
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [matrixData, setMatrixData] = useState<any>(null);
    const [matrixDays, setMatrixDays] = useState<number>(7);

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

            const resTipe = await postData(apiTipeKamarDropdown, {});
            const rawTipe = resTipe?.data?.data || [];
            const tipeList = rawTipe.map((t: any) => ({
                kode_tipe_kamar: t.kode_tipe_kamar,
                nama_tipe: t.name || t.nama_tipe || t.kode_tipe_kamar
            }));
            setTipeKamarOptions([
                { kode_tipe_kamar: '', nama_tipe: 'Semua Tipe Kamar' },
                ...tipeList
            ]);

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
            const inDateStr = formatDateSystem(checkInDate, 'yyyy-MM-dd');
            const outDateStr = formatDateSystem(checkOutDate, 'yyyy-MM-dd');

            const res = await postData(apiDashboardSummary, {
                kode_cabang: cabang || undefined,
                check_in_date: inDateStr,
                check_out_date: outDateStr,
                total_kamar: totalKamar,
                total_tamu: totalTamu,
                kode_tipe_kamar: selectedTipeKamar || undefined
            });

            if (res?.data?.data) {
                setSummaryData(res.data.data);
                if (!selectedCabang && res.data.data?.filter?.kode_cabang) {
                    setSelectedCabang(res.data.data.filter.kode_cabang);
                }
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat ringkasan reservasi');
        } finally {
            setSummaryLoading(false);
        }
    };

    const fetchMonitoring = async (cabang = selectedCabang, days = matrixDays) => {
        setMatrixLoading(true);
        try {
            const inDateStr = formatDateSystem(checkInDate, 'yyyy-MM-dd');
            const res = await postData(apiDashboardMonitoring, {
                kode_cabang: cabang || undefined,
                start_date: inDateStr,
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

    const handleSearch = () => {
        if (checkInDate >= checkOutDate) {
            showError(toast, 'Tanggal check-out harus lebih besar dari tanggal check-in');
            return;
        }
        fetchSummary(selectedCabang);
        fetchMonitoring(selectedCabang, matrixDays);
    };

    const formatCurrency = (val: number | string | undefined | null) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
            Number(val || 0)
        );
    };

    const kpiPeriod = summaryData?.kpi_period || {};
    const kpiToday = summaryData?.kpi_today || {};
    const catalog = summaryData?.catalog || [];

    const handleBookingDirect = (item: any, type: 'walkin' | 'booking') => {
        const inStr = formatDateSystem(checkInDate, 'yyyy-MM-dd');
        const outStr = formatDateSystem(checkOutDate, 'yyyy-MM-dd');
        const target = type === 'walkin' ? '/reservasi_baru' : '/reservasi_booking';
        const branchParam = selectedCabang ? `&cabang=${selectedCabang}` : '';
        router.push(`${target}?tipe=${item.kode_tipe_kamar}${branchParam}&in=${inStr}&out=${outStr}&rooms=${totalKamar}&guests=${totalTamu}`);
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <Tooltip target=".matrix-cell-occupied" position="top" />
            <Tooltip target=".matrix-cell-booked" position="top" />

            {/* Header Title Card (Consistent with PMS Standard) */}
            <div className="col-12">
                <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border mb-3">
                    <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
                        <div>
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-th-large text-primary text-2xl"></i>
                                <span className="text-2xl font-bold text-900">Dashboard Reservasi & Monitoring Kamar</span>
                            </div>
                            <span className="text-sm text-color-secondary mt-1 block">
                                Periksa ketersediaan periode menginap, kalkulasi tarif kamar & estimasi pajak resmi, serta pantau matriks okupansi kamar hotel.
                            </span>
                        </div>
                        <div className="flex align-items-center gap-2 flex-wrap">
                            <Button
                                label="Walk-In Baru"
                                icon="pi pi-plus"
                                className="p-button-sm p-button-success"
                                onClick={() => router.push(selectedCabang ? `/reservasi_baru?cabang=${selectedCabang}` : '/reservasi_baru')}
                            />
                            <Button
                                label="Booking Reservasi"
                                icon="pi pi-calendar-plus"
                                className="p-button-sm p-button-primary"
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

                {/* Filter Bar */}
                <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border mb-3">
                    <div className="grid align-items-end">
                        <div className="col-12 sm:col-6 lg:col-2">
                            <label className="text-xs font-bold text-700 block mb-1">Check-In</label>
                            <Calendar
                                value={checkInDate}
                                onChange={(e) => setCheckInDate(e.value as Date)}
                                dateFormat="dd/mm/yy"
                                showIcon
                                minDate={today}
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="col-12 sm:col-6 lg:col-2">
                            <label className="text-xs font-bold text-700 block mb-1">Check-Out</label>
                            <Calendar
                                value={checkOutDate}
                                onChange={(e) => setCheckOutDate(e.value as Date)}
                                dateFormat="dd/mm/yy"
                                showIcon
                                minDate={checkInDate || today}
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="col-6 sm:col-3 lg:col-1">
                            <label className="text-xs font-bold text-700 block mb-1">Kamar</label>
                            <InputNumber
                                value={totalKamar}
                                onValueChange={(e) => setTotalKamar(e.value || 1)}
                                min={1}
                                max={20}
                                showButtons
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="col-6 sm:col-3 lg:col-1">
                            <label className="text-xs font-bold text-700 block mb-1">Tamu</label>
                            <InputNumber
                                value={totalTamu}
                                onValueChange={(e) => setTotalTamu(e.value || 1)}
                                min={1}
                                max={50}
                                showButtons
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="col-12 sm:col-6 lg:col-2">
                            <label className="text-xs font-bold text-700 block mb-1">Tipe Kamar</label>
                            <Dropdown
                                value={selectedTipeKamar}
                                options={tipeKamarOptions}
                                optionLabel="nama_tipe"
                                optionValue="kode_tipe_kamar"
                                onChange={(e) => setSelectedTipeKamar(e.value)}
                                placeholder="Semua Tipe"
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="col-12 sm:col-6 lg:col-2">
                            <label className="text-xs font-bold text-700 block mb-1">Cabang Hotel</label>
                            <Dropdown
                                value={selectedCabang}
                                options={cabangOptions}
                                optionLabel="nama_cabang"
                                optionValue="kode_cabang"
                                onChange={(e) => setSelectedCabang(e.value)}
                                placeholder="Pilih Cabang"
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="col-12 lg:col-2">
                            <Button
                                label="Cari Ketersediaan"
                                icon="pi pi-search"
                                className="w-full p-button-primary font-semibold"
                                onClick={handleSearch}
                                loading={summaryLoading}
                            />
                        </div>
                    </div>
                </div>

                {/* KPI Metrics: Two Group Panels (Period vs Operations) */}
                <div className="grid mb-3">
                    {/* Period Overview Card */}
                    <div className="col-12 lg:col-6">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 h-full">
                            <div className="flex justify-content-between align-items-center mb-3">
                                <div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                        Ketersediaan Periode Terpilih ({summaryData?.filter?.nights || 1} Malam)
                                    </span>
                                    <div className="text-xs text-500">
                                        {summaryData?.filter?.check_in_date || formatDateSystem(checkInDate, 'dd/MM/yyyy')} s.d.{' '}
                                        {summaryData?.filter?.check_out_date || formatDateSystem(checkOutDate, 'dd/MM/yyyy')}
                                    </div>
                                </div>
                                <Tag severity="info" value={`${summaryData?.filter?.nights || 1} Malam`} />
                            </div>

                            <div className="grid text-center">
                                <div className="col-4 border-right-1 surface-border">
                                    <span className="text-xs text-color-secondary block">Kamar Tersedia</span>
                                    <span className="text-2xl font-bold text-green-600 block mt-1">
                                        {kpiPeriod.available_rooms ?? '-'}
                                    </span>
                                    <span className="text-xs text-500">dari {kpiPeriod.total_rooms ?? '-'} total</span>
                                </div>
                                <div className="col-4 border-right-1 surface-border">
                                    <span className="text-xs text-color-secondary block">Alokasi / Terisi</span>
                                    <span className="text-2xl font-bold text-blue-600 block mt-1">
                                        {kpiPeriod.allocated_rooms ?? '-'}
                                    </span>
                                    <span className="text-xs text-500">{kpiPeriod.total_reservations_period ?? 0} reservasi</span>
                                </div>
                                <div className="col-4">
                                    <span className="text-xs text-color-secondary block">Okupansi Periode</span>
                                    <span className="text-2xl font-bold text-orange-600 block mt-1">
                                        {kpiPeriod.occupancy_rate_period ?? 0}%
                                    </span>
                                    <span className="text-xs text-500">rasio terisi</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Today's Operational Overview Card */}
                    <div className="col-12 lg:col-6">
                        <div className="surface-card p-3 border-round-xl border-1 surface-border shadow-1 h-full">
                            <div className="flex justify-content-between align-items-center mb-3">
                                <div>
                                    <span className="text-xs font-bold text-color-secondary uppercase tracking-wider">
                                        Operasional Kamar Hari Ini ({formatDateSystem(new Date(), 'dd MMMM yyyy')})
                                    </span>
                                    <div className="text-xs text-500">Kondisi fisik & rotasi tamu hari ini</div>
                                </div>
                                <div className="flex gap-1">
                                    <Tag severity="success" value={`In: ${kpiToday.arrivals_today ?? 0}`} icon="pi pi-arrow-down" />
                                    <Tag severity="danger" value={`Out: ${kpiToday.departures_today ?? 0}`} icon="pi pi-arrow-up" />
                                </div>
                            </div>

                            <div className="grid text-center">
                                <div className="col-4 border-right-1 surface-border">
                                    <span className="text-xs text-color-secondary block">In-House</span>
                                    <span className="text-2xl font-bold text-900 block mt-1">
                                        {kpiToday.occupied_rooms ?? '-'}
                                    </span>
                                    <span className="text-xs text-500">kamar aktif</span>
                                </div>
                                <div className="col-4 border-right-1 surface-border">
                                    <span className="text-xs text-color-secondary block">Siap Huni (Clean)</span>
                                    <span className="text-2xl font-bold text-green-600 block mt-1">
                                        {kpiToday.ready_rooms ?? '-'}
                                    </span>
                                    <span className="text-xs text-500">siap check-in</span>
                                </div>
                                <div className="col-4">
                                    <span className="text-xs text-color-secondary block">Pembersihan (Dirty)</span>
                                    <span className="text-2xl font-bold text-red-600 block mt-1">
                                        {kpiToday.dirty_rooms ?? '-'}
                                    </span>
                                    <span className="text-xs text-500">tugas housekeeping</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main TabView: Catalog vs Matrix */}
                <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border">
                    <TabView>
                        {/* TAB 1: Catalog & Room Availability */}
                        <TabPanel header="Katalog & Ketersediaan Tipe Kamar" leftIcon="pi pi-th-large mr-2">
                            <div className="flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h6 className="m-0 font-bold text-900">
                                        Pilihan Tipe Kamar ({catalog.length} tipe ditemukan)
                                    </h6>
                                    <span className="text-xs text-500">
                                        Harga tercantum adalah estimasi total untuk {summaryData?.filter?.nights || 1} malam &bull; Termasuk simulasi pajak & service
                                    </span>
                                </div>
                            </div>

                            {summaryLoading ? (
                                <div className="p-5 text-center text-500">
                                    <i className="pi pi-spin pi-spinner text-3xl mb-2"></i>
                                    <div>Memuat data ketersediaan kamar...</div>
                                </div>
                            ) : catalog.length === 0 ? (
                                <div className="p-5 text-center text-500 border-dashed border-round surface-border">
                                    <i className="pi pi-inbox text-4xl mb-2"></i>
                                    <div>Tidak ada tipe kamar yang cocok dengan kriteria pencarian.</div>
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
                                                        <div
                                                            className="relative w-full h-10rem bg-cover bg-center flex flex-column justify-content-between p-3"
                                                            style={{
                                                                backgroundImage: item.foto_url
                                                                    ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${item.foto_url})`
                                                                    : 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                                                            }}
                                                        >
                                                            <div className="flex justify-content-between align-items-start">
                                                                <Tag
                                                                    severity={isAvail ? 'success' : 'danger'}
                                                                    value={isAvail ? `Tersedia: ${item.available_units} Unit` : 'Penuh'}
                                                                    icon={isAvail ? 'pi pi-check-circle' : 'pi pi-times-circle'}
                                                                />
                                                                <span className="bg-black-alpha-60 text-white text-xs px-2 py-1 border-round">
                                                                    Total: {item.total_units} Kamar
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h5 className="m-0 font-bold text-white text-shadow-1">
                                                                    {item.nama_tipe}
                                                                </h5>
                                                                <span className="text-xs text-white-alpha-80">
                                                                    Kapasitas: {item.kapasitas_dewasa} Dewasa, {item.kapasitas_anak} Anak
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Body details */}
                                                        <div className="p-3">
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

                                                            {/* Pricing breakdown */}
                                                            <div className="surface-50 border-1 surface-border p-2 border-round-lg text-xs">
                                                                <div className="flex justify-content-between mb-1">
                                                                    <span className="text-500">Tarif / Malam:</span>
                                                                    <span className="font-semibold text-900">
                                                                        {formatCurrency(item.rate_per_night)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-content-between mb-1">
                                                                    <span className="text-500">Estimasi Pajak & Layanan:</span>
                                                                    <span className="text-700">
                                                                        + {formatCurrency(item.tax_estimated)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-content-between align-items-center pt-1 border-top-1 surface-border">
                                                                    <span className="font-bold text-900">Estimasi Total:</span>
                                                                    <span className="text-base font-bold text-primary">
                                                                        {formatCurrency(item.grand_total_estimated)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="p-3 pt-0 flex gap-2">
                                                        <Button
                                                            label="Pesan Walk-In"
                                                            icon="pi pi-check"
                                                            className="p-button-sm p-button-success flex-1"
                                                            disabled={!isAvail}
                                                            onClick={() => handleBookingDirect(item, 'walkin')}
                                                        />
                                                        <Button
                                                            label="Booking"
                                                            icon="pi pi-calendar-plus"
                                                            className="p-button-sm p-button-outlined flex-1"
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

                        {/* TAB 2: Room Occupancy & Timeline Matrix */}
                        <TabPanel header="Matriks Monitoring Okupansi Kamar" leftIcon="pi pi-calendar mr-2">
                            <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-2 mb-3">
                                <div>
                                    <h6 className="m-0 font-bold text-900">Timeline Ketersediaan Kamar per Tanggal</h6>
                                    <span className="text-xs text-500">
                                        Mulai tanggal {formatDateSystem(checkInDate, 'dd MMMM yyyy')} &bull; Status okupansi kamar fisik
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

                            {/* Legend */}
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
                                                    {/* Sticky Room info */}
                                                    <td className="p-2 sticky left-0 bg-white surface-border font-semibold z-1">
                                                        <div className="flex align-items-center gap-1">
                                                            <span className="text-sm font-bold text-primary">{rm.nomor_kamar}</span>
                                                            <span className="text-xs text-500 font-normal">({rm.nama_tipe})</span>
                                                        </div>
                                                        <div className="text-xxs text-400">Lt. {rm.lantai || 1} &bull; {rm.status_kondisi}</div>
                                                    </td>

                                                    {/* Date columns */}
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
                    </TabView>
                </div>
            </div>
        </div>
    );
};

export default ReservasiDashboardPage;
