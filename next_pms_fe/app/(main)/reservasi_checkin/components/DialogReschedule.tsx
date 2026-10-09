'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import postData from '@/lib/axios/postData';
import { apiRescheduleCheck, apiRescheduleSubmit } from './endpoints';
import { formatCurrency, showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface DialogRescheduleProps {
    visible: boolean;
    onHide: () => void;
    reservation: any;
    toast: React.RefObject<Toast>;
    onSuccess: () => void;
}

export const DialogReschedule: React.FC<DialogRescheduleProps> = ({
    visible,
    onHide,
    reservation,
    toast,
    onSuccess
}) => {
    const [checkInDate, setCheckInDate] = useState<Date | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
    const [notes, setNotes] = useState('');
    const [checking, setChecking] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [simulationResult, setSimulationResult] = useState<any>(null);
    const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>({});

    useEffect(() => {
        if (reservation && visible) {
            const curCin = reservation.check_in_date ? new Date(reservation.check_in_date) : new Date();
            const curCout = reservation.check_out_date ? new Date(reservation.check_out_date) : new Date(new Date().setDate(new Date().getDate() + 1));
            setCheckInDate(curCin);
            setCheckOutDate(curCout);
            setNotes('');
            setSimulationResult(null);
            setRoomAssignments({});
            // Jalankan cek ketersediaan awal
            runCheck(reservation.kode_reservasi, curCin, curCout);
        }
    }, [reservation, visible]);

    const runCheck = async (kodeRes: string, cin: Date, cout: Date) => {
        if (!kodeRes || !cin || !cout) return;
        if (cin >= cout) {
            setSimulationResult(null);
            return;
        }

        setChecking(true);
        try {
            const res = await postData(apiRescheduleCheck, {
                kode_reservasi: kodeRes,
                new_check_in_date: formatDateSystem(cin, 'yyyy-MM-dd'),
                new_check_out_date: formatDateSystem(cout, 'yyyy-MM-dd')
            });

            if (res.data?.status === '00') {
                const simData = res.data.data;
                setSimulationResult(simData);

                // Inisialisasi penetapan kamar jika kamar bentrok
                const initialAssignments: Record<string, string> = {};
                (simData.rooms || []).forEach((rm: any) => {
                    if (rm.is_room_conflict) {
                        // Jika kamar lama bentrok, pilih kamar pertama yang tersedia atau kosongkan
                        if (rm.available_rooms && rm.available_rooms.length > 0) {
                            initialAssignments[rm.kode_reservasi_room] = rm.available_rooms[0].kode_kamar;
                        } else {
                            initialAssignments[rm.kode_reservasi_room] = '';
                        }
                    } else {
                        initialAssignments[rm.kode_reservasi_room] = rm.kode_kamar || '';
                    }
                });
                setRoomAssignments(initialAssignments);
            } else {
                setSimulationResult(null);
                showError(toast, res.data?.message || 'Gagal memeriksa ketersediaan tanggal baru');
            }
        } catch (e: any) {
            setSimulationResult(null);
            showError(toast, e?.response?.data?.message || 'Gagal simulasi perubahan tanggal');
        } finally {
            setChecking(false);
        }
    };

    const handleDateChange = (newCin: Date | null, newCout: Date | null) => {
        setCheckInDate(newCin);
        setCheckOutDate(newCout);
        if (newCin && newCout && newCin < newCout && reservation?.kode_reservasi) {
            runCheck(reservation.kode_reservasi, newCin, newCout);
        } else {
            setSimulationResult(null);
        }
    };

    const handleSubmit = async () => {
        if (!checkInDate || !checkOutDate) {
            showError(toast, 'Harap tentukan tanggal check-in dan check-out baru');
            return;
        }
        if (checkInDate >= checkOutDate) {
            showError(toast, 'Tanggal check-out harus lebih besar dari tanggal check-in');
            return;
        }
        if (simulationResult && !simulationResult.is_available) {
            showError(toast, 'Kamar tidak tersedia pada rentang tanggal yang dipilih');
            return;
        }

        setSubmitting(true);
        try {
            const payloadAssignments = Object.entries(roomAssignments).map(([kode_reservasi_room, kode_kamar]) => ({
                kode_reservasi_room,
                kode_kamar: kode_kamar || null
            }));

            const res = await postData(apiRescheduleSubmit, {
                kode_reservasi: reservation.kode_reservasi,
                new_check_in_date: formatDateSystem(checkInDate, 'yyyy-MM-dd'),
                new_check_out_date: formatDateSystem(checkOutDate, 'yyyy-MM-dd'),
                notes: notes.trim(),
                room_assignments: payloadAssignments
            });

            if (res.data?.status === '00') {
                showSuccess(toast, res.data.message || 'Perubahan tanggal reservasi berhasil disimpan');
                onSuccess();
                onHide();
            } else {
                showError(toast, res.data?.message || 'Gagal mengubah tanggal reservasi');
            }
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || 'Terjadi kesalahan sistem saat menyimpan perubahan');
        } finally {
            setSubmitting(false);
        }
    };

    if (!reservation) return null;

    const isAvailable = simulationResult?.is_available === true;
    const diffStatus = simulationResult?.status_diff;
    const diffAmount = simulationResult?.diff_amount || 0;
    const hasConflict = simulationResult?.rooms?.some((rm: any) => rm.is_room_conflict);

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-calendar-plus text-xl text-primary font-bold"></i>
                    <span className="font-bold text-lg text-900">Ubah Tanggal Reservasi (Reschedule)</span>
                </div>
            }
            visible={visible}
            style={{ width: '680px', maxWidth: '95vw' }}
            breakpoints={{ '960px': '85vw', '641px': '95vw' }}
            onHide={onHide}
            modal
            footer={
                <div className="flex justify-content-end align-items-center gap-2 pt-2">
                    <Button
                        label="Batal"
                        icon="pi pi-times"
                        onClick={onHide}
                        className="p-button-text p-button-secondary"
                        disabled={submitting}
                    />
                    <Button
                        label="Simpan Perubahan"
                        icon="pi pi-check"
                        onClick={handleSubmit}
                        loading={submitting}
                        disabled={checking || !isAvailable}
                        className="p-button-primary font-semibold"
                    />
                </div>
            }
        >
            <div className="p-fluid">
                {/* Info Card Tamu & Reservasi Eksisting */}
                <div className="p-3 border-round bg-blue-50 border-1 border-blue-200 mb-3">
                    <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                        <div>
                            <span className="font-bold text-900 block text-base">{reservation.guest_name}</span>
                            <span className="text-xs text-600">
                                No. Reservasi: <strong>{reservation.kode_reservasi}</strong> • Tipe: {reservation.tipe_kamar_name}
                                {reservation.nomor_kamar ? ` • Kamar: ${reservation.nomor_kamar}` : ' • Kamar: (Belum Di-assign)'}
                            </span>
                        </div>
                        <Tag severity="info" value={`${reservation.nights || 1} Malam Saat Ini`} className="text-xs px-2 py-1" />
                    </div>
                    <div className="text-xs text-700 flex flex-wrap gap-3 pt-1 border-top-1 surface-border">
                        <span>Check-In Saat Ini: <strong>{reservation.check_in_date ? formatDateSystem(reservation.check_in_date, 'dd/MM/yyyy') : '-'}</strong></span>
                        <span>Check-Out Saat Ini: <strong>{reservation.check_out_date ? formatDateSystem(reservation.check_out_date, 'dd/MM/yyyy') : '-'}</strong></span>
                    </div>
                </div>

                {/* Date Input Pickers */}
                <div className="grid mb-2">
                    <div className="col-12 sm:col-6 field mb-2">
                        <label className="font-semibold text-sm mb-1 block text-700">Tanggal Check-In Baru <span className="text-red-500">*</span></label>
                        <Calendar
                            value={checkInDate}
                            onChange={(e) => handleDateChange(e.value as Date, checkOutDate)}
                            dateFormat="dd/mm/yy"
                            showIcon
                            minDate={new Date()}
                            placeholder="Pilih check-in"
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 sm:col-6 field mb-2">
                        <label className="font-semibold text-sm mb-1 block text-700">Tanggal Check-Out Baru <span className="text-red-500">*</span></label>
                        <Calendar
                            value={checkOutDate}
                            onChange={(e) => handleDateChange(checkInDate, e.value as Date)}
                            dateFormat="dd/mm/yy"
                            showIcon
                            minDate={checkInDate ? new Date(new Date(checkInDate).getTime() + 86400000) : new Date()}
                            placeholder="Pilih check-out"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Real-time Status Card & Pengecekan Ketersediaan */}
                {checking ? (
                    <div className="p-3 border-round surface-100 border-1 surface-border mb-3 text-center">
                        <i className="pi pi-spin pi-spinner text-primary text-xl mr-2" />
                        <span className="text-xs text-600 font-semibold">Memeriksa ketersediaan kuota kamar & kalkulasi tarif dinamis...</span>
                    </div>
                ) : simulationResult ? (
                    <div>
                        {/* KONDISI A: Tipe Kamar Penuh Total (Zero Availability) */}
                        {!isAvailable ? (
                            <div className="p-3 border-round border-1 mb-3 bg-red-50 border-red-300">
                                <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-1">
                                    <div className="flex align-items-center gap-2">
                                        <i className="pi pi-times-circle text-red-600 text-lg"></i>
                                        <span className="font-bold text-sm text-red-900">
                                            Kamar Penuh / Tidak Tersedia
                                        </span>
                                    </div>
                                    <Tag severity="danger" value={`${simulationResult.new_nights} Malam`} className="text-xs" />
                                </div>
                                <div className="text-xs text-red-800 mt-1">
                                    Seluruh kuota tipe kamar <strong>{reservation.tipe_kamar_name || simulationResult.rooms?.[0]?.tipe_kamar_name}</strong> sudah habis terisi pada rentang tanggal tersebut.
                                </div>

                                {/* Rekomendasi Tipe Kamar Lain yang Tersedia (No Dead-End UX) */}
                                {simulationResult.alternative_types && simulationResult.alternative_types.length > 0 ? (
                                    <div className="mt-3 pt-2 border-top-1 border-red-200">
                                        <div className="flex align-items-center gap-2 mb-2 font-semibold text-xs text-900">
                                            <i className="pi pi-lightbulb text-yellow-600"></i>
                                            <span>Rekomendasi Tipe Kamar Lain yang Masih Tersedia:</span>
                                        </div>
                                        <div className="flex flex-column gap-2">
                                            {simulationResult.alternative_types.map((alt: any) => (
                                                <div
                                                    key={alt.kode_tipe_kamar}
                                                    className="p-2 border-round bg-white border-1 border-red-200 flex flex-wrap justify-content-between align-items-center gap-2"
                                                >
                                                    <div>
                                                        <span className="font-bold text-xs text-900 block">{alt.nama_tipe}</span>
                                                        <span className="text-xs text-500">
                                                            Tarif Baru: <strong>{formatCurrency(alt.rate_per_night)}</strong>/malam
                                                        </span>
                                                    </div>
                                                    <div className="flex align-items-center gap-2">
                                                        <Tag severity="info" value={`Tersedia ${alt.available_quota} Kamar`} className="text-xs" />
                                                        {alt.diff_per_night !== 0 && (
                                                            <Tag
                                                                severity={alt.diff_per_night > 0 ? 'warning' : 'success'}
                                                                value={`${alt.diff_per_night > 0 ? '+' : ''}${formatCurrency(alt.diff_per_night)}/mlm`}
                                                                className="text-xs font-semibold"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-xs text-600 mt-2">
                                            <i className="pi pi-info-circle mr-1"></i>
                                            Sarankan tamu untuk menggeser tanggal kedatangan atau mengajukan upgrade kamar ke salah satu tipe di atas.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-2 pt-2 border-top-1 border-red-200 text-xs text-red-700">
                                        <i className="pi pi-info-circle mr-1"></i>
                                        Seluruh tipe kamar di hotel sudah terisi penuh pada rentang tanggal tersebut. Sarankan tanggal alternatif lain kepada tamu.
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* KONDISI B: Kuota Tipe Tersedia (Bisa ada kamar fisik bentrok atau aman) */
                            <div className={`p-3 border-round border-1 mb-3 ${hasConflict ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300'}`}>
                                <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                                    <div className="flex align-items-center gap-2">
                                        <i className={`pi ${hasConflict ? 'pi-exclamation-triangle text-orange-600' : 'pi-check-circle text-green-600'} text-lg`}></i>
                                        <span className={`font-bold text-sm ${hasConflict ? 'text-orange-900' : 'text-green-900'}`}>
                                            {hasConflict ? 'Kamar Fisik Bentrok di Tanggal Baru' : 'Kamar Tersedia untuk Tanggal Tersebut'}
                                        </span>
                                    </div>
                                    <Tag
                                        severity={hasConflict ? 'warning' : 'success'}
                                        value={`${simulationResult.new_nights} Malam`}
                                        className="text-xs"
                                    />
                                </div>

                                {/* Detail Kamar Fisik & Pemilih Kamar Pengganti jika Bentrok */}
                                {hasConflict ? (
                                    <div className="text-xs text-orange-900">
                                        {simulationResult.rooms?.map((rm: any) => {
                                            if (!rm.is_room_conflict) return null;
                                            const roomOptions = [
                                                { label: '— Tetapkan Otomatis Saat Check-In (Unassigned) —', value: '' },
                                                ...(rm.available_rooms || []).map((k: any) => ({
                                                    label: `Kamar ${k.nomor_kamar} (Siap / Tersedia)`,
                                                    value: k.kode_kamar
                                                }))
                                            ];

                                            return (
                                                <div key={rm.kode_reservasi_room} className="pt-2 border-top-1 border-orange-200 mt-2">
                                                    <div className="mb-2">
                                                        Kamar fisik <strong>{rm.nomor_kamar || 'sebelumnya'}</strong> sedang terisi oleh tamu lain pada tanggal baru. Kuota tipe <strong>{rm.tipe_kamar_name}</strong> masih memiliki <strong>{rm.available_quota}</strong> kamar kosong.
                                                    </div>
                                                    <label className="font-semibold text-xs block text-800 mb-1">
                                                        Pilih Nomor Kamar Pengganti:
                                                    </label>
                                                    <Dropdown
                                                        value={roomAssignments[rm.kode_reservasi_room] ?? ''}
                                                        options={roomOptions}
                                                        onChange={(e) => setRoomAssignments(prev => ({
                                                            ...prev,
                                                            [rm.kode_reservasi_room]: e.value
                                                        }))}
                                                        placeholder="Pilih nomor kamar pengganti"
                                                        className="w-full text-xs"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-xs text-green-800">
                                        {simulationResult.rooms?.[0]?.nomor_kamar ? (
                                            <span>
                                                <i className="pi pi-home mr-1"></i>
                                                Nomor Kamar: <strong>{simulationResult.rooms[0].nomor_kamar}</strong> tetap aman dan tidak bentrok pada rentang tanggal baru.
                                            </span>
                                        ) : (
                                            <span>
                                                <i className="pi pi-info-circle mr-1"></i>
                                                Kamar fisik belum ditentukan (akan dialokasikan secara otomatis saat tamu check-in).
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Rincian Selisih Finansial */}
                                <div className="grid text-xs text-800 pt-2 border-top-1 surface-border mt-3">
                                    <div className="col-12 sm:col-6">
                                        <span className="text-500 block">Total Sewa Baru:</span>
                                        <span className="font-bold text-sm text-900">
                                            {formatCurrency(simulationResult.new_total_room_charge)}
                                        </span>
                                    </div>
                                    <div className="col-12 sm:col-6">
                                        <span className="text-500 block">Penyesuaian Biaya:</span>
                                        {diffStatus === 'additional_charge' && (
                                            <span className="font-bold text-sm text-orange-700">
                                                + {formatCurrency(diffAmount)} (Kurang Bayar)
                                            </span>
                                        )}
                                        {diffStatus === 'refund_credit' && (
                                            <span className="font-bold text-sm text-blue-700">
                                                - {formatCurrency(diffAmount)} (Lebih Bayar)
                                            </span>
                                        )}
                                        {diffStatus === 'no_change' && (
                                            <span className="font-bold text-sm text-green-700">Tarif Sama (Rp 0)</span>
                                        )}
                                    </div>
                                </div>

                                {diffStatus === 'additional_charge' && (
                                    <div className="text-xs text-orange-800 mt-2 bg-orange-100 p-2 border-round">
                                        <i className="pi pi-info-circle mr-1"></i>
                                        Terdapat kenaikan tarif karena durasi bertambah atau perbedaan harga paket/musim. Selisih biaya akan tercatat pada folio dan ditagihkan saat check-in.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Catatan / Alasan Perubahan */}
                <div className="field mb-1">
                    <label className="font-semibold text-sm mb-1 block text-700">Catatan Perubahan (Opsional)</label>
                    <InputTextarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Contoh: Tamu meminta penundaan kedatangan via telepon karena keperluan mendadak."
                        className="w-full text-sm"
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default DialogReschedule;
