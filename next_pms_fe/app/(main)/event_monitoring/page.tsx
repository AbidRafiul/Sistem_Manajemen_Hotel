'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { showError } from '@/lib/tools/generalTools';
import { QuickStatusCards } from './components/QuickStatusCards';
import { TimelineMatrix } from './components/TimelineMatrix';
import { CalendarBoard } from './components/CalendarBoard';
import { BeoModal } from '../event_booking/components/display/beo_modal';
import { apiEventMonitoring, apiEventBeoData, apiMasterCabang } from './components/endpoints';

const EventMonitoringPage = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    // Data State
    const [loading, setLoading] = useState(false);
    const [selectedCabang, setSelectedCabang] = useState<string>('');
    const [cabangOptions, setCabangOptions] = useState<any[]>([]);
    const [targetDate, setTargetDate] = useState<Date | null>(new Date());

    // Monitoring Data
    const [summaryCards, setSummaryCards] = useState({
        total_rooms: 0,
        in_use_now: 0,
        available_now: 0,
        today_events_count: 0,
        expected_guests_today: 0,
    });
    const [todayEvents, setTodayEvents] = useState<any[]>([]);
    const [timelineMatrix, setTimelineMatrix] = useState<any[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [businessDate, setBusinessDate] = useState<string>('');

    // BEO Sheet Preview Modal State
    const [beoVisible, setBeoVisible] = useState(false);
    const [beoData, setBeoData] = useState<any>(null);

    // Initial load: Branches
    useEffect(() => {
        loadBranches();
    }, []);

    // Load monitoring data on branch or date change
    useEffect(() => {
        if (selectedCabang || session?.user?.active_kode_cabang) {
            fetchMonitoringData();
        }
    }, [selectedCabang, targetDate]);

    const loadBranches = async () => {
        try {
            const res = await postData(apiMasterCabang, {});
            if (res?.data?.data) {
                const options = res.data.data.map((c: any) => ({
                    label: c.nama_hotel || c.nama_cabang || c.kode_cabang,
                    value: c.kode_cabang,
                }));
                setCabangOptions(options);

                const activeCabang = session?.user?.active_kode_cabang || options[0]?.value || '';
                setSelectedCabang(activeCabang);
            }
        } catch (error) {
            console.error('Failed to load branches', error);
        }
    };

    const fetchMonitoringData = async () => {
        setLoading(true);
        try {
            const targetDateStr = targetDate ? targetDate.toISOString().slice(0, 10) : undefined;
            const res = await postData(apiEventMonitoring, {
                kode_cabang: selectedCabang || undefined,
                target_date: targetDateStr,
            });

            if (res?.data?.data) {
                const d = res.data.data;
                setSummaryCards(d.summary_cards || {});
                setTodayEvents(d.today_events || []);
                setTimelineMatrix(d.timeline_matrix || []);
                setCalendarEvents(d.calendar_events || []);
                setBusinessDate(d.business_date || '');
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat monitoring ruang event');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEvent = async (eventCode: string) => {
        try {
            const res = await postData(apiEventBeoData, {
                kode_reservasi_event: eventCode,
            });

            if (res?.data?.data) {
                setBeoData(res.data.data);
                setBeoVisible(true);
            }
        } catch (error) {
            showError(toast, 'Gagal memuat lembar BEO');
        }
    };

    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                <div className="card shadow-1 p-4 border-round surface-0">
                    {/* Header */}
                    <div className="flex flex-column md:flex-row justify-content-between md:align-items-center mb-4 gap-3">
                        <div>
                            <h3 className="m-0 font-bold text-900 flex align-items-center gap-2">
                                <i className="pi pi-desktop text-primary text-2xl"></i>
                                Monitoring & Kalender Jadwal Ruang Event
                            </h3>
                            <p className="m-0 text-500 text-sm mt-1">
                                Pemantauan real-time status ruang meeting & ballroom, matriks utilisasi jam operasional, dan pencegahan bentrok.
                            </p>
                        </div>
                        <div className="flex align-items-center gap-2">
                            <Button
                                icon="pi pi-refresh"
                                label="Segarkan Data"
                                className="p-button-outlined p-button-secondary"
                                onClick={fetchMonitoringData}
                                loading={loading}
                            />
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="grid formgrid p-fluid mb-3">
                        <div className="field col-12 md:col-4">
                            <label className="text-xs font-semibold text-600">Cabang Hotel / Properti</label>
                            <Dropdown
                                value={selectedCabang}
                                options={cabangOptions}
                                onChange={(e) => setSelectedCabang(e.value)}
                                placeholder="Pilih Cabang"
                                className="p-inputtext-sm"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label className="text-xs font-semibold text-600">Pilih Tanggal Pengamatan</label>
                            <Calendar
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.value as Date)}
                                dateFormat="yy-mm-dd"
                                showIcon
                                className="p-inputtext-sm"
                            />
                        </div>
                    </div>

                    {/* Quick Status KPI Cards */}
                    <QuickStatusCards summary={summaryCards} businessDate={targetDate?.toISOString().slice(0, 10) || businessDate} />

                    {/* Tabs: Timeline Matrix, Calendar Agenda, Today List */}
                    <TabView className="mt-3">
                        {/* Tab 1: Matriks Timeline Jam-per-Jam */}
                        <TabPanel header="Matriks Timeline Harian" leftIcon="pi pi-clock mr-2">
                            <TimelineMatrix
                                rooms={timelineMatrix}
                                targetDate={targetDate?.toISOString().slice(0, 10) || businessDate}
                                onSelectEvent={handleSelectEvent}
                            />
                        </TabPanel>

                        {/* Tab 2: Kalender Agenda 30 Hari */}
                        <TabPanel header="Kalender Agenda (30 Hari)" leftIcon="pi pi-calendar mr-2">
                            <CalendarBoard
                                events={calendarEvents}
                                onSelectEvent={handleSelectEvent}
                            />
                        </TabPanel>

                        {/* Tab 3: Daftar Acara Hari Ini */}
                        <TabPanel header={`Daftar Acara Tanggal Ini (${todayEvents.length})`} leftIcon="pi pi-list mr-2">
                            <DataTable
                                value={todayEvents}
                                dataKey="id"
                                emptyMessage="Tidak ada agenda acara pada tanggal ini."
                                className="p-datatable-sm"
                                stripedRows
                            >
                                <Column field="kode_reservasi_event" header="Kode BEO" sortable className="font-mono font-bold text-primary" style={{ width: '8rem' }} />
                                <Column field="nama_event" header="Nama Acara" sortable style={{ minWidth: '12rem' }} />
                                <Column field="nama_ruang" header="Ruang Event" sortable style={{ minWidth: '10rem' }} />
                                <Column field="organizer" header="Penyelenggara" sortable style={{ minWidth: '12rem' }} />
                                <Column header="Waktu Pelaksanaan" body={(r) => `${r.jam_mulai} - ${r.jam_selesai}`} style={{ minWidth: '9rem' }} />
                                <Column field="jumlah_tamu" header="Pax" align="center" style={{ width: '5rem' }} />
                                <Column
                                    header="Status"
                                    align="center"
                                    body={(r) => {
                                        let severity: 'warning' | 'info' | 'success' | 'danger' | null = 'info';
                                        if (r.status_event === 'tentative') severity = 'warning';
                                        if (r.status_event === 'in_progress' || r.status_event === 'completed') severity = 'success';
                                        return <Tag value={r.status_event?.toUpperCase()} severity={severity} className="text-xs" />;
                                    }}
                                    style={{ width: '8rem' }}
                                />
                                <Column
                                    header="Aksi"
                                    align="center"
                                    body={(r) => (
                                        <Button
                                            icon="pi pi-file-pdf"
                                            className="p-button-sm p-button-outlined p-button-info p-1"
                                            tooltip="Lihat Lembar BEO"
                                            onClick={() => handleSelectEvent(r.kode_reservasi_event)}
                                        />
                                    )}
                                    style={{ width: '6rem' }}
                                />
                            </DataTable>
                        </TabPanel>
                    </TabView>
                </div>
            </div>

            {/* BEO Preview & Print Modal */}
            <BeoModal
                visible={beoVisible}
                data={beoData}
                onHide={() => setBeoVisible(false)}
            />
        </div>
    );
};

export default EventMonitoringPage;
