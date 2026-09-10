'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { ActionDialogProps } from '../interfaces';
import postData from '@/lib/axios/postData';
import { apiEndpointGetUsers, apiEndpointAssignTask } from '../endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';

const ActionDialog = ({ state, setState, toast, getData }: ActionDialogProps) => {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (state.actionDialogVisible) {
            fetchUsers();
            setSelectedUser(null);
        }
    }, [state.actionDialogVisible]);

    const fetchUsers = async () => {
        try {
            const res = await postData(apiEndpointGetUsers, { perPage: 100 });
            setUsers(res?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch users', error);
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

    const footer = (
        <div>
            <Button 
                label="Batal" 
                icon="pi pi-times" 
                onClick={() => setState((p) => ({ ...p, actionDialogVisible: false }))} 
                className="p-button-text" 
            />
            <Button 
                label="Simpan" 
                icon="pi pi-check" 
                onClick={handleAssign} 
                autoFocus 
                loading={loading}
                disabled={!selectedUser}
            />
        </div>
    );

    return (
        <Dialog 
            header={`Assign Task - Kamar ${state.selectedRoom?.nomor_kamar || ''}`} 
            visible={state.actionDialogVisible} 
            style={{ width: '400px' }} 
            onHide={() => setState((p) => ({ ...p, actionDialogVisible: false }))}
            footer={footer}
        >
            <div className="flex flex-column gap-2 mt-2">
                <label htmlFor="assigned_to" className="font-semibold text-sm">
                    Pilih Petugas <span className="text-red-500">*</span>
                </label>
                <Dropdown
                    id="assigned_to"
                    value={selectedUser}
                    options={users}
                    onChange={(e) => setSelectedUser(e.value)}
                    optionLabel="fullname"
                    optionValue="id"
                    placeholder="Pilih Pegawai"
                    filter
                    className="w-full"
                />
            </div>
        </Dialog>
    );
};

export default ActionDialog;
