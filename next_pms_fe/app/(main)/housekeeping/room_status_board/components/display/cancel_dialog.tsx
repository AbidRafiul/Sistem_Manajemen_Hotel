'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { ActionDialogProps } from '../interfaces';
import postData from '@/lib/axios/postData';
import { apiEndpointCancelTask } from '../endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';

const CancelDialog = ({ state, setState, toast, getData }: ActionDialogProps) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (state.cancelDialogVisible) {
            setReason('');
        }
    }, [state.cancelDialogVisible]);

    const handleCancel = async () => {
        if (!reason.trim()) {
            showError(toast, 'Alasan pembatalan wajib diisi.');
            return;
        }

        if (!state.selectedRoom?.kode_housekeeping_task) {
            showError(toast, 'Tidak ada task yang dipilih.');
            return;
        }

        setLoading(true);
        try {
            const res = await postData(
                apiEndpointCancelTask(state.selectedRoom.kode_housekeeping_task),
                { cancel_reason: reason },
                { 'X-Level': '1' }
            );
            showSuccess(toast, res?.data?.message || 'Task berhasil dibatalkan.');
            setState((p) => ({ ...p, cancelDialogVisible: false, selectedRoom: null }));
            await getData();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal membatalkan task');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div>
            <Button 
                label="Kembali" 
                icon="pi pi-times" 
                onClick={() => setState((p) => ({ ...p, cancelDialogVisible: false }))} 
                className="p-button-text" 
            />
            <Button 
                label="Batalkan Task" 
                icon="pi pi-trash" 
                severity="danger"
                onClick={handleCancel} 
                autoFocus 
                loading={loading}
                disabled={!reason.trim()}
            />
        </div>
    );

    return (
        <Dialog 
            header={`Batalkan Task - Kamar ${state.selectedRoom?.nomor_kamar || ''}`} 
            visible={state.cancelDialogVisible} 
            style={{ width: '450px' }} 
            onHide={() => setState((p) => ({ ...p, cancelDialogVisible: false }))}
            footer={footer}
        >
            <div className="flex flex-column gap-2 mt-2">
                <label htmlFor="reason" className="font-semibold text-sm">
                    Alasan Pembatalan <span className="text-red-500">*</span>
                </label>
                <InputTextarea 
                    id="reason"
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    rows={4} 
                    className="w-full"
                    placeholder="Contoh: Tamu extend, atau salah input task..."
                    autoFocus
                />
            </div>
        </Dialog>
    );
};

export default CancelDialog;
