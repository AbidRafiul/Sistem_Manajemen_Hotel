'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { RoomStatusData } from '../interfaces';
import postData from '@/lib/axios/postData';
import {
    apiEndpointUpdateChecklist,
    apiEndpointStartTask,
    apiEndpointCompleteTask,
    apiEndpointVerifyTask
} from '../endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import DialogSubmitInspection from './dialog_submit_inspection';

interface DialogDetailTaskProps {
    visible: boolean;
    onHide: () => void;
    room: RoomStatusData | null;
    toast: React.RefObject<Toast>;
    onSuccess: () => Promise<void>;
}

interface ChecklistItem {
    id: number | string;
    task: string;
    checked: boolean;
    checked_at?: string | null;
    checked_by?: string | null;
}

export const DialogDetailTask = ({
    visible,
    onHide,
    room,
    toast,
    onSuccess
}: DialogDetailTaskProps) => {
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [newItemText, setNewItemText] = useState('');
    const [savingChecklist, setSavingChecklist] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [inspectionDialogVisible, setInspectionDialogVisible] = useState(false);

    useEffect(() => {
        if (visible && room) {
            let items: ChecklistItem[] = [];

            if (Array.isArray(room.checklist) && room.checklist.length > 0) {
                items = room.checklist.map((c, idx) => ({
                    id: c.id || idx + 1,
                    task: c.task,
                    checked: !!c.checked,
                    checked_at: c.checked_at || null,
                    checked_by: c.checked_by || null
                }));
            } else if (room.notes) {
                // Auto-parse baris notes menjadi item checklist jika belum ada checklist tersimpan
                const lines = room.notes
                    .split(/\r?\n|•|-|\*/)
                    .map((l) => l.trim())
                    .filter(Boolean);

                if (lines.length > 0) {
                    items = lines.map((line, idx) => ({
                        id: idx + 1,
                        task: line,
                        checked: false,
                        checked_at: null,
                        checked_by: null
                    }));
                }
            }

            // Fallback default checklist jika task_type inspection checkout
            if (items.length === 0 && room.task_type === 'inspection') {
                items = [
                    { id: 1, task: 'Cek kulkas minibar (minuman & snack)', checked: false },
                    { id: 2, task: 'Cek kondisi & kelengkapan linen / handuk mandi', checked: false },
                    { id: 3, task: 'Cek fasilitas kamar & perlengkapan (remote, gelas, teko)', checked: false },
                    { id: 4, task: 'Cek brankas, lemari, & laci (barang tamu tertinggal / L&F)', checked: false }
                ];
            }

            setChecklist(items);
        }
    }, [visible, room]);

    const handleToggleChecklist = async (index: number) => {
        if (!room?.kode_housekeeping_task) return;

        const updated = [...checklist];
        const current = updated[index];
        const nextState = !current.checked;
        const tNow = formatDateSystem();

        updated[index] = {
            ...current,
            checked: nextState,
            checked_at: nextState ? tNow : null,
            checked_by: nextState ? (room.assigned_to_name || 'Petugas HK') : null
        };

        setChecklist(updated);
        setSavingChecklist(true);

        try {
            await postData(apiEndpointUpdateChecklist(room.kode_housekeeping_task), {
                checklist: updated
            });
            showSuccess(
                toast,
                nextState
                    ? `Catatan "${current.task}" dicentang selesai.`
                    : `Centang catatan "${current.task}" dibatalkan.`
            );
            await onSuccess();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memperbarui checklist');
            // Revert state on failure
            setChecklist(checklist);
        } finally {
            setSavingChecklist(false);
        }
    };

    const handleAddChecklistItem = async () => {
        if (!newItemText.trim() || !room?.kode_housekeeping_task) return;

        const newItem: ChecklistItem = {
            id: Date.now(),
            task: newItemText.trim(),
            checked: false
        };

        const updated = [...checklist, newItem];
        setChecklist(updated);
        setNewItemText('');
        setSavingChecklist(true);

        try {
            await postData(apiEndpointUpdateChecklist(room.kode_housekeeping_task), {
                checklist: updated
            });
            showSuccess(toast, 'Item catatan baru ditambahkan ke checklist.');
            await onSuccess();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menambahkan catatan');
            setChecklist(checklist);
        } finally {
            setSavingChecklist(false);
        }
    };

    const handleStartTask = async () => {
        if (!room?.kode_housekeeping_task) return;
        setActionLoading(true);
        try {
            const res = await postData(apiEndpointStartTask(room.kode_housekeeping_task), {}, { 'X-Level': '1' });
            showSuccess(toast, res?.data?.message || 'Tugas dimulai');
            await onSuccess();
            onHide();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memulai tugas');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteTask = async () => {
        if (!room?.kode_housekeeping_task) return;

        // Jika task_type inspection, arahkan ke dialog submit inspection
        if (room.task_type === 'inspection') {
            setInspectionDialogVisible(true);
            return;
        }

        setActionLoading(true);
        try {
            const res = await postData(apiEndpointCompleteTask(room.kode_housekeeping_task), {}, { 'X-Level': '1' });
            showSuccess(toast, res?.data?.message || 'Tugas selesai (menunggu inspeksi supervisor)');
            await onSuccess();
            onHide();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menyelesaikan tugas');
        } finally {
            setActionLoading(false);
        }
    };

    const completedCount = checklist.filter((c) => c.checked).length;
    const totalCount = checklist.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <>
            <Dialog
                visible={visible}
                onHide={onHide}
                header={
                    <div className="flex align-items-center justify-content-between w-full pr-3">
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-list-check text-primary text-xl"></i>
                            <div>
                                <div className="font-bold text-lg">
                                    Detail Kamar & Catatan Tugas
                                </div>
                                <div className="text-xs text-500 font-normal">
                                    Kamar {room?.nomor_kamar} &bull; {room?.nama_tipe_kamar || 'Tipe Kamar'}
                                </div>
                            </div>
                        </div>
                        <div className="flex align-items-center gap-2">
                            {room?.priority === 'urgent' && (
                                <Tag severity="danger" value="URGENT" icon="pi pi-bolt" />
                            )}
                            <Tag
                                severity={
                                    room?.occupancy_status === 'occupied'
                                        ? 'danger'
                                        : room?.occupancy_status === 'vacant'
                                        ? 'success'
                                        : 'warning'
                                }
                                value={room?.occupancy_status?.toUpperCase()}
                            />
                        </div>
                    </div>
                }
                style={{ width: '92vw', maxWidth: '720px' }}
                modal
                closable
                footer={
                    <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                        <Button
                            label="Tutup"
                            icon="pi pi-times"
                            className="p-button-outlined p-button-sm"
                            onClick={onHide}
                        />
                        <div className="flex gap-2">
                            {room?.task_status === 'assigned' && (
                                <Button
                                    label="Mulai Tugas"
                                    icon="pi pi-play"
                                    severity="info"
                                    className="p-button-sm"
                                    onClick={handleStartTask}
                                    loading={actionLoading}
                                />
                            )}
                            {room?.task_type === 'inspection' && room?.task_status !== 'finished' && (
                                <Button
                                    label="Input Hasil Cek Kamar"
                                    icon="pi pi-search-plus"
                                    severity="warning"
                                    className="p-button-sm font-semibold"
                                    onClick={() => setInspectionDialogVisible(true)}
                                />
                            )}
                            {room?.task_status === 'in_progress' && room?.task_type !== 'inspection' && (
                                <Button
                                    label="Selesaikan Tugas"
                                    icon="pi pi-check"
                                    severity="success"
                                    className="p-button-sm font-semibold"
                                    onClick={handleCompleteTask}
                                    loading={actionLoading}
                                />
                            )}
                        </div>
                    </div>
                }
            >
                {room && (
                    <div className="flex flex-column gap-3 pt-2">
                        {/* Task Information Card */}
                        <div className="surface-50 p-3 border-round-xl border-1 surface-border">
                            <div className="grid grid-nogutter">
                                <div className="col-12 sm:col-6 mb-2 sm:mb-0">
                                    <span className="text-xs text-500 block">Kode Tugas:</span>
                                    <span className="font-bold text-sm text-900">
                                        {room.kode_housekeeping_task || 'Belum dibuat'}
                                    </span>
                                </div>
                                <div className="col-12 sm:col-6 mb-2 sm:mb-0">
                                    <span className="text-xs text-500 block">Petugas PIC:</span>
                                    <span className="font-bold text-sm text-primary">
                                        {room.assigned_to_name || 'Belum ditugaskan'}
                                    </span>
                                </div>
                                <div className="col-12 sm:col-6 mt-2">
                                    <span className="text-xs text-500 block">Tipe Tugas:</span>
                                    <Tag
                                        value={
                                            room.task_type === 'inspection'
                                                ? 'Cek Kamar Checkout (Inspection)'
                                                : room.task_type === 'cleaning'
                                                ? 'Pembersihan Kamar'
                                                : room.task_type || 'Pembersihan'
                                        }
                                        severity={room.task_type === 'inspection' ? 'warning' : 'info'}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="col-12 sm:col-6 mt-2">
                                    <span className="text-xs text-500 block">Sumber Permintaan:</span>
                                    <span className="text-xs font-semibold text-700 capitalize">
                                        {room.request_source === 'checkout'
                                            ? 'Front Desk (Saat Checkout)'
                                            : room.request_source === 'front_office'
                                            ? 'Front Desk'
                                            : room.request_source === 'guest_request'
                                            ? 'Permintaan Tamu Menginap'
                                            : room.request_source || 'Housekeeping'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Notes Checklist */}
                        <div className="border-1 surface-border border-round-xl p-3 bg-white shadow-1">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-check-square text-primary font-bold"></i>
                                    <span className="font-bold text-sm text-900">
                                        Catatan & Instruksi Khusus FO (Checklist Interaktif)
                                    </span>
                                </div>
                                <span className="text-xs font-semibold text-primary">
                                    {completedCount}/{totalCount} Selesai ({progressPercent}%)
                                </span>
                            </div>

                            <ProgressBar
                                value={progressPercent}
                                showValue={false}
                                style={{ height: '6px' }}
                                className="mb-3"
                                color={progressPercent === 100 ? '#22c55e' : undefined}
                            />

                            <div className="flex flex-column gap-2 max-h-16rem overflow-y-auto pr-1">
                                {checklist.length === 0 ? (
                                    <div className="text-center text-500 text-xs py-3 italic">
                                        Belum ada catatan khusus untuk tugas ini.
                                    </div>
                                ) : (
                                    checklist.map((item, idx) => (
                                        <div
                                            key={item.id || idx}
                                            className={`flex align-items-center justify-content-between p-2 border-round transition-colors border-1 ${
                                                item.checked
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'surface-50 surface-border hover:surface-100'
                                            }`}
                                        >
                                            <div className="flex align-items-center gap-2 flex-1">
                                                <Checkbox
                                                    inputId={`chk-${idx}`}
                                                    checked={item.checked}
                                                    onChange={() => handleToggleChecklist(idx)}
                                                    disabled={savingChecklist}
                                                />
                                                <label
                                                    htmlFor={`chk-${idx}`}
                                                    className={`cursor-pointer text-sm ${
                                                        item.checked
                                                            ? 'line-through text-green-900 font-medium'
                                                            : 'text-900 font-semibold'
                                                    }`}
                                                >
                                                    {item.task}
                                                </label>
                                            </div>

                                            {item.checked && (
                                                <div className="flex align-items-center gap-1 text-xs text-green-700">
                                                    <i className="pi pi-check text-xs font-bold"></i>
                                                    <span className="text-xs">
                                                        {item.checked_at
                                                            ? formatDateSystem(item.checked_at, 'HH:mm')
                                                            : 'Selesai'}
                                                        {item.checked_by ? ` (${item.checked_by})` : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Custom Note Item Input */}
                            <div className="flex gap-2 mt-3 pt-2 border-top-1 surface-border">
                                <InputText
                                    placeholder="Tambah instruksi catatan baru..."
                                    value={newItemText}
                                    onChange={(e) => setNewItemText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddChecklistItem();
                                    }}
                                    className="p-inputtext-sm flex-1 text-xs"
                                />
                                <Button
                                    icon="pi pi-plus"
                                    size="small"
                                    label="Tambah"
                                    className="p-button-sm text-xs font-semibold"
                                    onClick={handleAddChecklistItem}
                                    disabled={!newItemText.trim() || savingChecklist}
                                />
                            </div>
                        </div>

                        {/* General Notes Banner if provided */}
                        {room.notes && (
                            <div className="p-3 border-round-xl bg-blue-50 border-1 border-blue-200 text-blue-900 text-xs flex align-items-start gap-2">
                                <i className="pi pi-info-circle text-blue-600 text-base mt-1 flex-shrink-0"></i>
                                <div>
                                    <span className="font-bold block mb-1">Catatan Asli FO:</span>
                                    <span className="font-normal">{room.notes}</span>
                                </div>
                            </div>
                        )}

                        {/* Inspection Result Card (If already submitted) */}
                        {room.inspection_details && (
                            <div className="p-3 border-round-xl bg-orange-50 border-1 border-orange-200 text-orange-900 text-xs">
                                <div className="font-bold flex align-items-center gap-1 mb-2 text-sm">
                                    <i className="pi pi-info-circle"></i> Hasil Cek Kamar Checkout:
                                </div>
                                {room.inspection_details.minibar_items?.length > 0 && (
                                    <div className="mb-1">
                                        <strong>Konsumsi Minibar:</strong>{' '}
                                        {room.inspection_details.minibar_items
                                            .map((m: any) => `${m.item_name} (x${m.qty})`)
                                            .join(', ')}
                                    </div>
                                )}
                                {room.inspection_details.damaged_items?.length > 0 && (
                                    <div className="mb-1">
                                        <strong>Denda Kerusakan:</strong>{' '}
                                        {room.inspection_details.damaged_items
                                            .map((d: any) => d.item_name)
                                            .join(', ')}
                                    </div>
                                )}
                                {room.inspection_details.lost_and_found && (
                                    <div className="text-red-700 font-bold">
                                        ⚠️ Barang Tertinggal:{' '}
                                        {room.inspection_details.lost_and_found.item_description}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Dialog>

            {/* Dialog Input Cek Kamar */}
            <DialogSubmitInspection
                visible={inspectionDialogVisible}
                onHide={() => setInspectionDialogVisible(false)}
                room={room}
                toast={toast}
                onSuccess={async () => {
                    await onSuccess();
                    onHide();
                }}
            />
        </>
    );
};

export default DialogDetailTask;
