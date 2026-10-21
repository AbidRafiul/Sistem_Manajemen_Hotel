'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { showSuccess, showError } from '@/lib/tools/generalTools';
import { EventTable } from './components/display/table';
import { EventFormDialog } from './components/display/form';
import { BeoModal } from './components/display/beo_modal';
import { EventBooking, FormikEventValues } from './components/interfaces';
import {
    apiEventList,
    apiEventDetail,
    apiEventCreate,
    apiEventUpdate,
    apiEventStatusUpdate,
    apiEventBeoData,
    apiMasterRuangEvent,
    apiMasterGuest,
    apiMasterCorporate,
    apiMasterCabang,
    apiMasterHargaRuangEvent,
} from './components/endpoints';

const EventBookingPage = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    // Data State
    const [events, setEvents] = useState<EventBooking[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedCabang, setSelectedCabang] = useState<string>('');
    const [cabangOptions, setCabangOptions] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchKeyword, setSearchKeyword] = useState<string>('');

    // Master Dropdown Options
    const [ruangOptions, setRuangOptions] = useState<any[]>([]);
    const [guestOptions, setGuestOptions] = useState<any[]>([]);
    const [corporateOptions, setCorporateOptions] = useState<any[]>([]);
    const [hargaOptions, setHargaOptions] = useState<any[]>([]);

    // Form Modal State
    const [formVisible, setFormVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // BEO Sheet Preview Modal State
    const [beoVisible, setBeoVisible] = useState(false);
    const [beoData, setBeoData] = useState<any>(null);

    // Status Change Dialog State
    const [statusDialogVisible, setStatusDialogVisible] = useState(false);
    const [statusTargetEvent, setStatusTargetEvent] = useState<EventBooking | null>(null);
    const [targetNewStatus, setTargetNewStatus] = useState<string>('');
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [cancelReason, setCancelReason] = useState<string>('');
    const [statusSubmitting, setStatusSubmitting] = useState(false);

    // 1. Initial Load: Branches & Master Data
    useEffect(() => {
        loadBranches();
        loadMasterData();
    }, []);

    // 2. Load events when active branch or filters change
    useEffect(() => {
        if (selectedCabang || session?.user?.active_kode_cabang) {
            fetchEvents();
        }
    }, [selectedCabang, statusFilter]);

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

    const loadMasterData = async () => {
        try {
            const [resRuang, resGuest, resCorp, resHarga] = await Promise.all([
                postData(apiMasterRuangEvent, {}).catch(() => ({ data: { data: [] } })),
                postData(apiMasterGuest, {}).catch(() => ({ data: { data: [] } })),
                postData(apiMasterCorporate, {}).catch(() => ({ data: { data: [] } })),
                postData(apiMasterHargaRuangEvent, {}).catch(() => ({ data: { data: [] } })),
            ]);

            if (resRuang?.data?.data) {
                setRuangOptions(
                    resRuang.data.data.map((r: any) => ({
                        label: `${r.nama_ruang} (Kapasitas: ${r.kapasitas_orang || '-'} Pax)`,
                        value: r.kode_ruang_event,
                        kapasitas: r.kapasitas_orang,
                        luas: r.luas_sqm,
                    }))
                );
            }

            if (resGuest?.data?.data) {
                setGuestOptions(
                    resGuest.data.data.map((g: any) => ({
                        label: `${g.full_name || 'Tamu'} - ${g.phone || '-'}`,
                        value: g.kode_tamu,
                        phone: g.phone,
                        email: g.email,
                    }))
                );
            }

            if (resCorp?.data?.data) {
                setCorporateOptions(
                    resCorp.data.data.map((c: any) => ({
                        label: c.name || c.corporate_name || c.kode_corporate,
                        value: c.kode_corporate,
                    }))
                );
            }

            if (resHarga?.data?.data) {
                setHargaOptions(resHarga.data.data);
            }
        } catch (error) {
            console.error('Failed to load master data for event booking', error);
        }
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await postData(apiEventList, {
                kode_cabang: selectedCabang || undefined,
                status_event: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchKeyword || undefined,
            });

            if (res?.data?.data?.events) {
                setEvents(res.data.data.events);
            } else {
                setEvents([]);
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat daftar pemesanan ruang event');
        } finally {
            setLoading(false);
        }
    };

    // Actions
    const handleOpenCreate = () => {
        setIsEdit(false);
        setSelectedEvent(null);
        setFormVisible(true);
    };

    const handleOpenEdit = async (event: EventBooking) => {
        try {
            const res = await postData(apiEventDetail, {
                kode_reservasi_event: event.kode_reservasi_event,
            });

            if (res?.data?.data) {
                setSelectedEvent(res.data.data);
                setIsEdit(true);
                setFormVisible(true);
            }
        } catch (error: any) {
            showError(toast, 'Gagal memuat detail pemesanan');
        }
    };

    const handleViewBeo = async (event: EventBooking) => {
        try {
            const res = await postData(apiEventBeoData, {
                kode_reservasi_event: event.kode_reservasi_event,
            });

            if (res?.data?.data) {
                setBeoData(res.data.data);
                setBeoVisible(true);
            }
        } catch (error: any) {
            showError(toast, 'Gagal memuat lembar BEO');
        }
    };

    const handleFormSubmit = async (values: FormikEventValues) => {
        setSubmitting(true);
        try {
            const endpoint = isEdit ? apiEventUpdate : apiEventCreate;
            const res = await postData(endpoint, {
                ...values,
                kode_cabang: selectedCabang || values.kode_cabang,
            });

            if (res?.data?.status === '00') {
                showSuccess(toast, res.data.message || 'Pemesanan event berhasil disimpan');
                setFormVisible(false);
                fetchEvents();
            } else {
                showError(toast, res?.data?.message || 'Gagal menyimpan pemesanan event');
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Terjadi kesalahan saat memproses pemesanan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenStatusDialog = (event: EventBooking) => {
        setStatusTargetEvent(event);
        setTargetNewStatus(event.status_event === 'tentative' ? 'confirmed' : 'completed');
        setDepositAmount(0);
        setCancelReason('');
        setStatusDialogVisible(true);
    };

    const handleConfirmStatusChange = async () => {
        if (!statusTargetEvent || !targetNewStatus) return;

        setStatusSubmitting(true);
        try {
            const res = await postData(apiEventStatusUpdate, {
                kode_reservasi_event: statusTargetEvent.kode_reservasi_event,
                new_status: targetNewStatus,
                deposit_amount: depositAmount > 0 ? depositAmount : undefined,
                catatan_batal: targetNewStatus === 'cancelled' ? cancelReason : undefined,
            });

            if (res?.data?.status === '00') {
                showSuccess(toast, res.data.message || 'Status event berhasil diperbarui');
                setStatusDialogVisible(false);
                fetchEvents();
            } else {
                showError(toast, res?.data?.message || 'Gagal memperbarui status');
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal mengubah status');
        } finally {
            setStatusSubmitting(false);
        }
    };

    const statusFilterOptions = [
        { label: 'Semua Status', value: 'all' },
        { label: 'Tentative (Hold Ruang)', value: 'tentative' },
        { label: 'Confirmed (Terjadwal)', value: 'confirmed' },
        { label: 'In Progress (Hari H)', value: 'in_progress' },
        { label: 'Completed (Selesai)', value: 'completed' },
        { label: 'Cancelled (Dibatalkan)', value: 'cancelled' },
    ];

    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                <div className="card shadow-1 p-4 border-round surface-0">
                    {/* Header */}
                    <div className="flex flex-column md:flex-row justify-content-between md:align-items-center mb-4 gap-3">
                        <div>
                            <h3 className="m-0 font-bold text-900 flex align-items-center gap-2">
                                <i className="pi pi-ticket text-primary text-2xl"></i>
                                Pemesanan Ruang Event (Banquet Event Order)
                            </h3>
                            <p className="m-0 text-500 text-sm mt-1">
                                Kelola reservasi function room, ballroom, susunan meja/kursi, catering BEO, dan status operasional.
                            </p>
                        </div>
                        <div className="flex align-items-center gap-2">
                            <Button
                                label="Pemesanan Baru (BEO)"
                                icon="pi pi-plus"
                                className="p-button-primary font-bold"
                                onClick={handleOpenCreate}
                            />
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="grid formgrid p-fluid mb-3">
                        <div className="field col-12 md:col-3">
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
                            <label className="text-xs font-semibold text-600">Filter Status Event</label>
                            <Dropdown
                                value={statusFilter}
                                options={statusFilterOptions}
                                onChange={(e) => setStatusFilter(e.value)}
                                className="p-inputtext-sm"
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="text-xs font-semibold text-600">Cari Acara / Penyelenggara</label>
                            <div className="p-inputgroup">
                                <InputText
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchEvents()}
                                    placeholder="Nama acara, kode BEO, PIC..."
                                    className="p-inputtext-sm"
                                />
                                <Button icon="pi pi-search" className="p-button-sm p-button-primary" onClick={fetchEvents} />
                            </div>
                        </div>
                        <div className="field col-12 md:col-2 flex align-items-end">
                            <Button
                                icon="pi pi-refresh"
                                label="Refresh"
                                className="p-button-sm p-button-outlined p-button-secondary w-full"
                                onClick={fetchEvents}
                                loading={loading}
                            />
                        </div>
                    </div>

                    {/* Event Table */}
                    <EventTable
                        data={events}
                        loading={loading}
                        onViewBeo={handleViewBeo}
                        onEdit={handleOpenEdit}
                        onChangeStatus={handleOpenStatusDialog}
                    />
                </div>
            </div>

            {/* Create & Edit Modal Dialog */}
            <EventFormDialog
                visible={formVisible}
                isEdit={isEdit}
                initialData={selectedEvent}
                ruangOptions={ruangOptions}
                guestOptions={guestOptions}
                corporateOptions={corporateOptions}
                hargaOptions={hargaOptions}
                onHide={() => setFormVisible(false)}
                onSubmit={handleFormSubmit}
                submitting={submitting}
            />

            {/* BEO Preview & Print Modal */}
            <BeoModal
                visible={beoVisible}
                data={beoData}
                onHide={() => setBeoVisible(false)}
            />

            {/* Status Change Dialog */}
            <Dialog
                header="Kelola Status & Pembayaran Event"
                visible={statusDialogVisible}
                style={{ width: '90vw', maxWidth: '500px' }}
                modal
                onHide={() => setStatusDialogVisible(false)}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Batal" className="p-button-text" onClick={() => setStatusDialogVisible(false)} />
                        <Button
                            label="Perbarui Status"
                            icon="pi pi-check"
                            className="p-button-primary"
                            onClick={handleConfirmStatusChange}
                            loading={statusSubmitting}
                            disabled={targetNewStatus === 'cancelled' && !cancelReason.trim()}
                        />
                    </div>
                }
            >
                {statusTargetEvent && (
                    <div className="p-fluid">
                        <div className="mb-3 p-3 surface-100 border-round">
                            <div className="font-bold text-sm text-900">{statusTargetEvent.nama_event}</div>
                            <div className="text-xs text-500 font-mono">{statusTargetEvent.kode_reservasi_event}</div>
                            <div className="text-xs text-600 mt-1">Status Sekarang: <b>{statusTargetEvent.status_event.toUpperCase()}</b></div>
                        </div>

                        <div className="field mb-3">
                            <label className="font-semibold text-xs">Pilih Status Baru <span className="text-red-500">*</span></label>
                            <Dropdown
                                value={targetNewStatus}
                                options={[
                                    { label: 'Tentative (Hold Ruangan)', value: 'tentative' },
                                    { label: 'Confirmed (DP Diterima & Terjadwal)', value: 'confirmed' },
                                    { label: 'In Progress (Sedang Berlangsung Hari H)', value: 'in_progress' },
                                    { label: 'Completed (Acara Selesai & Tutup Buku)', value: 'completed' },
                                    { label: 'Cancelled (Batalkan Event)', value: 'cancelled' },
                                ]}
                                onChange={(e) => setTargetNewStatus(e.value)}
                            />
                        </div>

                        {targetNewStatus === 'confirmed' && (
                            <div className="field mb-3">
                                <label className="font-semibold text-xs">Catat Pembayaran DP / Uang Muka Tambahan (Rp)</label>
                                <InputNumber
                                    value={depositAmount}
                                    onValueChange={(e) => setDepositAmount(e.value || 0)}
                                    mode="currency"
                                    currency="IDR"
                                    locale="id-ID"
                                    placeholder="Masukkan nominal jika ada penerimaan kasir"
                                />
                                <span className="text-xs text-500">Saldo saat ini: DP Rp {statusTargetEvent.deposit_paid?.toLocaleString('id-ID')} / Sisa Rp {statusTargetEvent.sisa_tagihan?.toLocaleString('id-ID')}</span>
                            </div>
                        )}

                        {targetNewStatus === 'cancelled' && (
                            <div className="field mb-3">
                                <label className="font-semibold text-xs">Alasan Pembatalan <span className="text-red-500">*</span></label>
                                <InputTextarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    rows={3}
                                    placeholder="Wajib dicantumkan: alasan pembatalan oleh klien/hotel"
                                    required
                                />
                            </div>
                        )}
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default EventBookingPage;
