'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ActionDialogProps } from '../interfaces';
import postData from '@/lib/axios/postData';
import { apiEndpointGetHousekeepingStaff, apiEndpointGetUsers, apiEndpointAssignTask } from '../endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';

const ActionDialog = ({ state, setState, toast, getData }: ActionDialogProps) => {
    const [users, setUsers] = useState<any[]>([]);
    const [recommendedUser, setRecommendedUser] = useState<any | null>(null);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);

    useEffect(() => {
        if (state.actionDialogVisible) {
            fetchStaff();
        }
    }, [state.actionDialogVisible]);

    const fetchStaff = async () => {
        setFetchLoading(true);
        try {
            const res = await postData(apiEndpointGetHousekeepingStaff, { cabang: state.kode_cabang });
            const staffList = res?.data?.data || [];
            const rec = res?.data?.recommended || null;
            setUsers(staffList);
            setRecommendedUser(rec);

            // Auto-select rekomendasi jika belum ada yang terpilih
            if (rec) {
                setSelectedUser(rec.id);
            } else if (staffList.length > 0) {
                setSelectedUser(staffList[0].id);
            } else {
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Failed to fetch housekeeping staff', error);
            // Fallback ke general users jika endpoint belum termuat
            try {
                const resFallback = await postData(apiEndpointGetUsers, { perPage: 100, role: 'housekeeping' });
                const fallbackList = resFallback?.data?.data || [];
                setUsers(fallbackList);
                if (fallbackList.length > 0) setSelectedUser(fallbackList[0].id);
            } catch (e) {
                console.error(e);
            }
        } finally {
            setFetchLoading(false);
        }
    };

    const handleAutoSelect = () => {
        if (recommendedUser) {
            setSelectedUser(recommendedUser.id);
            showSuccess(toast, `Otomatis memilih ${recommendedUser.fullname} (${recommendedUser.active_tasks} tugas aktif).`);
        } else if (users.length > 0) {
            const sorted = [...users].sort((a, b) => (a.active_tasks || 0) - (b.active_tasks || 0));
            setSelectedUser(sorted[0].id);
            showSuccess(toast, `Otomatis memilih ${sorted[0].fullname}.`);
        } else {
            showError(toast, 'Belum ada data petugas housekeeping.');
        }
    };

    const handleAssign = async () => {
        if (!selectedUser || !state.selectedRoom?.kode_housekeeping_task) {
            showError(toast, 'Pilih petugas terlebih dahulu.');
            return;
        }

        setLoading(true);
        try {
            const res = await postData(
                apiEndpointAssignTask(state.selectedRoom.kode_housekeeping_task),
                { assigned_to: selectedUser },
                { 'X-Level': '1' }
            );
            showSuccess(toast, res?.data?.message || 'Berhasil menugaskan task.');
            setState((p) => ({ ...p, actionDialogVisible: false, selectedRoom: null }));
            await getData();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menugaskan task');
        } finally {
            setLoading(false);
        }
    };

    const itemTemplate = (option: any) => {
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

    const valueTemplate = (option: any, props: any) => {
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

    const footer = (
        <div className="flex justify-content-between align-items-center">
            <Button 
                label="Auto-Assign" 
                icon="pi pi-bolt" 
                size="small"
                severity="help"
                outlined
                onClick={handleAutoSelect}
                tooltip="Pilih otomatis petugas yang paling senggang"
                tooltipOptions={{ position: 'top' }}
                disabled={users.length === 0}
            />
            <div className="flex gap-2">
                <Button 
                    label="Batal" 
                    icon="pi pi-times" 
                    onClick={() => setState((p) => ({ ...p, actionDialogVisible: false }))} 
                    className="p-button-text" 
                    size="small"
                />
                <Button 
                    label="Tugaskan" 
                    icon="pi pi-check" 
                    onClick={handleAssign} 
                    loading={loading}
                    disabled={!selectedUser}
                    size="small"
                />
            </div>
        </div>
    );

    return (
        <Dialog 
            header={`Penugasan Kamar ${state.selectedRoom?.nomor_kamar || ''}`} 
            visible={state.actionDialogVisible} 
            style={{ width: '460px' }} 
            onHide={() => setState((p) => ({ ...p, actionDialogVisible: false }))}
            footer={footer}
        >
            <div className="flex flex-column gap-3 mt-2">
                {/* Banner Rekomendasi Auto-Assign */}
                {recommendedUser && (
                    <div className="p-3 border-round bg-blue-50 border-1 border-blue-200 flex align-items-center justify-content-between">
                        <div>
                            <div className="text-xs font-semibold text-blue-700 flex align-items-center gap-1">
                                <i className="pi pi-sparkles text-yellow-600"></i> REKOMENDASI AUTO-ASSIGN
                            </div>
                            <div className="text-sm font-bold text-blue-900 mt-1">
                                {recommendedUser.fullname}
                            </div>
                            <div className="text-xs text-blue-600">
                                {recommendedUser.active_tasks === 0 
                                    ? 'Saat ini bebas tugas (Senggang)' 
                                    : `Memiliki ${recommendedUser.active_tasks} tugas aktif (Beban terendah)`}
                            </div>
                        </div>
                        <Button 
                            icon="pi pi-check" 
                            label="Gunakan" 
                            size="small" 
                            className="p-button-sm p-button-info"
                            onClick={handleAutoSelect}
                        />
                    </div>
                )}

                <div>
                    <label htmlFor="assigned_to" className="font-semibold text-sm block mb-2">
                        Pilih Petugas (Role Housekeeping) <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="assigned_to"
                        value={selectedUser}
                        options={users}
                        onChange={(e) => setSelectedUser(e.value)}
                        optionLabel="fullname"
                        optionValue="id"
                        placeholder="Pilih Petugas Housekeeping"
                        filter
                        loading={fetchLoading}
                        itemTemplate={itemTemplate}
                        valueTemplate={valueTemplate}
                        className="w-full"
                        emptyMessage="Tidak ada staf dengan role housekeeping"
                    />
                    <small className="text-secondary block mt-1">
                        *Daftar hanya menampilkan user dengan role <strong>housekeeping</strong> dan beban tugas terkini.
                    </small>
                </div>
            </div>
        </Dialog>
    );
};

export default ActionDialog;

