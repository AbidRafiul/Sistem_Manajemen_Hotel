'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radiobutton';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import postData from '@/lib/axios/postData';
import { apiHousekeepingRequest, apiHousekeepingStaff } from './endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface DialogRequestHousekeepingProps {
    visible: boolean;
    onHide: () => void;
    onSuccess: () => void;
    roomData: any;
    toast: any;
}

export const DialogRequestHousekeeping: React.FC<DialogRequestHousekeepingProps> = ({
    visible,
    onHide,
    onSuccess,
    roomData,
    toast
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(false);

    // Form states
    const [taskType, setTaskType] = useState<string>('cleaning');
    const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
    const [autoAssign, setAutoAssign] = useState<boolean>(true);
    const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
    const [notes, setNotes] = useState<string>('');
    const [selectedChecklist, setSelectedChecklist] = useState<string[]>([
        'Ganti sprei & sarung bantal',
        'Ganti handuk & bath mat',
        'Bersihkan kamar mandi & amenities'
    ]);

    // Staff list & recommendation
    const [staffList, setStaffList] = useState<any[]>([]);
    const [recommendedStaff, setRecommendedStaff] = useState<any | null>(null);

    // Selected room in case of multi-room folio
    const [targetKodeKamar, setTargetKodeKamar] = useState<string>('');

    useEffect(() => {
        if (visible && roomData) {
            // Default target room
            const firstRoom = roomData.rooms?.[0] || roomData;
            setTargetKodeKamar(firstRoom.kode_kamar || roomData.kode_kamar || '');

            // Reset form
            setTaskType('cleaning');
            setPriority('normal');
            setAutoAssign(true);
            setNotes('');
            setSelectedChecklist([
                'Ganti sprei & sarung bantal',
                'Ganti handuk & bath mat',
                'Bersihkan kamar mandi & amenities'
            ]);
            setSelectedStaff(null);

            // Fetch staff data
            fetchStaff();
        }
    }, [visible, roomData]);

    const fetchStaff = async () => {
        setLoadingStaff(true);
        try {
            const cabang = roomData?.kode_cabang || '';
            const res = await postData(apiHousekeepingStaff, { cabang });
            const list = res?.data?.data || [];
            const rec = res?.data?.recommended || null;
            setStaffList(list);
            setRecommendedStaff(rec);
            if (rec) {
                setSelectedStaff(rec.id);
            } else if (list.length > 0) {
                setSelectedStaff(list[0].id);
            }
        } catch (error) {
            console.error('Failed to load housekeeping staff', error);
        } finally {
            setLoadingStaff(false);
        }
    };

    // Find active room object
    const activeRoomObj = roomData?.rooms?.find((r: any) => r.kode_kamar === targetKodeKamar) || roomData;
    const hasActiveTask = activeRoomObj?.task_status && ['assigned', 'in_progress', 'finished'].includes(activeRoomObj.task_status);

    const handleQuickNote = (snippet: string) => {
        setNotes((prev) => {
            if (!prev.trim()) return snippet;
            if (prev.includes(snippet)) return prev;
            return `${prev}, ${snippet}`;
        });
    };

    const handleSubmit = async () => {
        if (!targetKodeKamar) {
            showError(toast, 'Pilih kamar yang akan dibersihkan.');
            return;
        }

        if (!autoAssign && !selectedStaff) {
            showError(toast, 'Pilih petugas housekeeping yang ditugaskan.');
            return;
        }

        setSubmitting(true);
        try {
            // Gabungkan template checklist dan catatan tambahan
            const finalChecklist = selectedChecklist.map((task, idx) => ({
                id: idx + 1,
                task,
                checked: false
            }));

            if (notes.trim()) {
                finalChecklist.push({
                    id: finalChecklist.length + 1,
                    task: notes.trim(),
                    checked: false
                });
            }

            const payload = {
                kode_kamar: targetKodeKamar,
                kode_cabang: roomData?.kode_cabang,
                kode_reservasi_room: activeRoomObj?.kode_reservasi_room || roomData?.kode_reservasi_room,
                task_type: taskType,
                priority: priority,
                notes: notes.trim() || selectedChecklist.join(', '),
                checklist: finalChecklist,
                auto_assign: autoAssign,
                assigned_to: autoAssign ? null : selectedStaff,
                request_source: 'guest_request'
            };

            const res = await postData(apiHousekeepingRequest, payload);
            showSuccess(toast, res?.data?.message || 'Permintaan pembersihan berhasil dikirim');
            onSuccess();
            onHide();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal mengirim permintaan pembersihan');
        } finally {
            setSubmitting(false);
        }
    };

    const staffItemTemplate = (option: any) => {
        const isIdle = (option.active_tasks || 0) === 0;
        return (
            <div className="flex justify-content-between align-items-center w-full py-1">
                <div className="flex flex-column">
                    <span className="font-semibold text-sm">{option.fullname}</span>
                    <small className="text-secondary">{option.username}</small>
                </div>
                <Tag
                    value={isIdle ? 'Senggang (0 Tugas)' : `${option.active_tasks} Tugas Aktif`}
                    severity={isIdle ? 'success' : 'warning'}
                    className="text-xs"
                />
            </div>
        );
    };

    const staffValueTemplate = (option: any, props: any) => {
        if (option) {
            const isIdle = (option.active_tasks || 0) === 0;
            return (
                <div className="flex justify-content-between align-items-center w-full">
                    <span className="font-medium">{option.fullname}</span>
                    <Tag
                        value={isIdle ? 'Senggang' : `${option.active_tasks} tugas`}
                        severity={isIdle ? 'success' : 'warning'}
                        className="text-xs ml-2"
                    />
                </div>
            );
        }
        return <span>{props.placeholder}</span>;
    };

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-sparkles text-primary text-xl"></i>
                    <div>
                        <span className="font-bold text-lg text-900 block">Permintaan Pembersihan Kamar (Make Up Room)</span>
                        <small className="text-color-secondary">Layanan kebersihan harian untuk tamu menginap (Stayover Guest)</small>
                    </div>
                </div>
            }
            visible={visible}
            style={{ width: '580px' }}
            modal
            onHide={onHide}
            footer={
                <div className="flex justify-content-between align-items-center">
                    <Button label="Batal" icon="pi pi-times" className="p-button-text p-button-sm" onClick={onHide} disabled={submitting} />
                    <Button
                        label="Kirim Permintaan Pembersihan"
                        icon="pi pi-check"
                        className="p-button-sm p-button-primary"
                        onClick={handleSubmit}
                        loading={submitting}
                        disabled={hasActiveTask || submitting}
                    />
                </div>
            }
        >
            <div className="flex flex-column gap-3 mt-2">
                {/* 1. Card Info Kamar & Tamu */}
                <div className="p-3 border-round-xl surface-ground border-1 surface-border">
                    <div className="flex justify-content-between align-items-start mb-2">
                        <div>
                            <span className="text-xs font-bold text-color-secondary uppercase tracking-wider block">Kamar & Tamu</span>
                            <span className="text-lg font-bold text-900 block mt-1">
                                Kamar {activeRoomObj?.nomor_kamar || roomData?.nomor_kamar} — {roomData?.guest_name || 'Tamu Hotel'}
                            </span>
                            <span className="text-xs text-500 block">
                                {activeRoomObj?.nama_tipe_kamar || roomData?.nama_tipe_kamar || 'Tipe Kamar'}
                            </span>
                        </div>
                        <div className="text-right">
                            <Tag
                                severity={
                                    activeRoomObj?.housekeeping_status === 'clean'
                                        ? 'success'
                                        : activeRoomObj?.housekeeping_status === 'dirty'
                                        ? 'danger'
                                        : 'warning'
                                }
                                value={`Kondisi: ${(activeRoomObj?.housekeeping_status || 'Clean').toUpperCase()}`}
                                className="text-xs font-bold"
                            />
                        </div>
                    </div>

                    <div className="flex align-items-center gap-3 text-xs text-700 mt-2 pt-2 border-top-1 surface-border">
                        <div>
                            <i className="pi pi-calendar mr-1 text-primary"></i>
                            In: <strong>{roomData?.check_in_date ? formatDateSystem(roomData.check_in_date, 'dd MMM yyyy') : '-'}</strong>
                        </div>
                        <div>
                            <i className="pi pi-calendar-times mr-1 text-primary"></i>
                            Out: <strong>{roomData?.check_out_date ? formatDateSystem(roomData.check_out_date, 'dd MMM yyyy') : '-'}</strong>
                        </div>
                        <div>
                            <i className="pi pi-moon mr-1 text-primary"></i>
                            <strong>{roomData?.nights || 1} Malam</strong>
                        </div>
                    </div>
                </div>

                {/* Multi-room selector jika reservasi memiliki lebih dari 1 kamar */}
                {roomData?.rooms && roomData.rooms.length > 1 && (
                    <div>
                        <label className="text-xs font-bold text-700 uppercase block mb-1">Pilih Kamar yang Diminta Dibersihkan</label>
                        <Dropdown
                            value={targetKodeKamar}
                            options={roomData.rooms.map((r: any) => ({
                                label: `Kamar ${r.nomor_kamar} (${r.nama_tipe_kamar || 'Kamar'}) - Status: ${(r.housekeeping_status || 'Clean').toUpperCase()}`,
                                value: r.kode_kamar
                            }))}
                            onChange={(e) => setTargetKodeKamar(e.value)}
                            className="w-full text-sm"
                        />
                    </div>
                )}

                {/* 2. Banner Pengecekan Idempotensi (Jika sudah ada task aktif) */}
                {hasActiveTask && (
                    <div className="p-3 border-round bg-yellow-50 border-1 border-yellow-300">
                        <div className="flex align-items-start gap-2">
                            <i className="pi pi-exclamation-triangle text-yellow-700 text-xl mt-1"></i>
                            <div>
                                <div className="font-bold text-sm text-yellow-900">Tugas Pembersihan Sedang Berjalan!</div>
                                <div className="text-xs text-yellow-800 mt-1">
                                    Kamar ini sudah memiliki tugas pembersihan aktif:{' '}
                                    <strong>{activeRoomObj.kode_housekeeping_task}</strong>.
                                    <br />
                                    Status tugas:{' '}
                                    <Tag
                                        value={(activeRoomObj.task_status || '').toUpperCase()}
                                        severity={activeRoomObj.task_status === 'in_progress' ? 'warning' : 'info'}
                                        className="text-xs ml-1"
                                    />
                                    {activeRoomObj.task_pic_name && (
                                        <span className="ml-1">
                                            (Petugas: <strong>{activeRoomObj.task_pic_name}</strong>)
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-yellow-700 mt-2 font-medium">
                                    *Tidak dapat membuat permintaan baru sampai tugas pembersihan yang sedang berjalan diselesaikan oleh petugas.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!hasActiveTask && (
                    <>
                        {/* 3. Prioritas Pembersihan */}
                        <div>
                            <label className="text-xs font-bold text-700 uppercase block mb-2">Prioritas Pembersihan</label>
                            <div className="grid">
                                <div className="col-6">
                                    <div
                                        className={`p-3 border-round-lg border-1 cursor-pointer transition-colors flex align-items-center gap-2 ${
                                            priority === 'normal' ? 'surface-card border-primary bg-primary-reverse' : 'surface-ground surface-border'
                                        }`}
                                        onClick={() => setPriority('normal')}
                                    >
                                        <RadioButton inputId="pri_normal" name="priority" value="normal" checked={priority === 'normal'} onChange={() => setPriority('normal')} />
                                        <div>
                                            <span className="font-bold text-sm block">Normal / Rutin</span>
                                            <small className="text-color-secondary text-xs">Pembersihan terjadwal biasa</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div
                                        className={`p-3 border-round-lg border-1 cursor-pointer transition-colors flex align-items-center gap-2 ${
                                            priority === 'urgent' ? 'surface-card border-red-500 bg-red-50' : 'surface-ground surface-border'
                                        }`}
                                        onClick={() => setPriority('urgent')}
                                    >
                                        <RadioButton inputId="pri_urgent" name="priority" value="urgent" checked={priority === 'urgent'} onChange={() => setPriority('urgent')} />
                                        <div>
                                            <span className="font-bold text-sm text-red-600 block">Mendesak / Urgent</span>
                                            <small className="text-red-400 text-xs">Tamu sedang menunggu di lobi / VIP</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Penugasan Petugas (Housekeeper) */}
                        <div>
                            <div className="flex justify-content-between align-items-center mb-2">
                                <label className="text-xs font-bold text-700 uppercase block">Penugasan Petugas Housekeeping</label>
                                <div className="flex align-items-center gap-2">
                                    <span className="text-xs text-color-secondary">Metode:</span>
                                    <Button
                                        label={autoAssign ? 'Otomatis (Auto-Assign)' : 'Pilih Manual'}
                                        icon={autoAssign ? 'pi pi-bolt' : 'pi pi-user'}
                                        size="small"
                                        text
                                        severity={autoAssign ? 'help' : undefined}
                                        onClick={() => setAutoAssign(!autoAssign)}
                                        className="text-xs p-1"
                                    />
                                </div>
                            </div>

                            {autoAssign ? (
                                <div className="p-3 border-round-lg bg-blue-50 border-1 border-blue-200">
                                    <div className="flex justify-content-between align-items-center">
                                        <div>
                                            <div className="text-xs font-bold text-blue-700 flex align-items-center gap-1">
                                                <i className="pi pi-sparkles text-yellow-600"></i> REKOMENDASI AUTO-ASSIGN
                                            </div>
                                            {recommendedStaff ? (
                                                <div className="mt-1">
                                                    <span className="font-bold text-sm text-blue-900">{recommendedStaff.fullname}</span>
                                                    <span className="text-xs text-blue-600 ml-2">
                                                        ({recommendedStaff.active_tasks === 0 ? 'Bebas Tugas - Paling Senggang' : `${recommendedStaff.active_tasks} tugas aktif`})
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-blue-700 mt-1">Sistem akan otomatis memilih petugas yang paling senggang saat dikirim.</div>
                                            )}
                                        </div>
                                        <Tag value="Adil & Merata" severity="info" className="text-xs" />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <Dropdown
                                        value={selectedStaff}
                                        options={staffList}
                                        onChange={(e) => setSelectedStaff(e.value)}
                                        optionLabel="fullname"
                                        optionValue="id"
                                        placeholder="Pilih Petugas Housekeeping"
                                        filter
                                        loading={loadingStaff}
                                        itemTemplate={staffItemTemplate}
                                        valueTemplate={staffValueTemplate}
                                        className="w-full text-sm"
                                        emptyMessage="Tidak ada staf housekeeping tersedia"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 5. Checklist Instruksi & Catatan Khusus */}
                        <div>
                            <label className="text-xs font-bold text-700 uppercase block mb-2">
                                <i className="pi pi-check-square mr-1 text-primary"></i>
                                Checklist Instruksi Khusus FO (Wajib Diceklis oleh Housekeeping)
                            </label>

                            <div className="surface-50 p-3 border-round-xl border-1 surface-border flex flex-column gap-2 mb-3">
                                {[
                                    'Ganti sprei & sarung bantal',
                                    'Ganti handuk & bath mat',
                                    'Bersihkan kamar mandi & amenities',
                                    'Isi ulang air mineral & tea/coffee',
                                    'Buang sampah & sapu/pel lantai'
                                ].map((itemText, idx) => {
                                    const isSelected = selectedChecklist.includes(itemText);
                                    return (
                                        <div key={idx} className="flex align-items-center gap-2">
                                            <Checkbox
                                                inputId={`chk_req_${idx}`}
                                                checked={isSelected}
                                                onChange={() => {
                                                    if (isSelected) {
                                                        setSelectedChecklist(selectedChecklist.filter((t) => t !== itemText));
                                                    } else {
                                                        setSelectedChecklist([...selectedChecklist, itemText]);
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor={`chk_req_${idx}`}
                                                className={`text-sm cursor-pointer ${isSelected ? 'font-semibold text-900' : 'text-600'}`}
                                            >
                                                {itemText}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>

                            <label className="text-xs font-bold text-700 uppercase block mb-1">
                                Catatan Bebas Tambahan (Opsional)
                            </label>
                            <InputTextarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="w-full text-sm"
                                placeholder="Contoh: Tamu minta tolong bersihkan sebelum jam 14:00 saat tamu keluar."
                            />
                        </div>
                    </>
                )}
            </div>
        </Dialog>
    );
};
