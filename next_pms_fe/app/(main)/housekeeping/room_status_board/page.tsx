'use client';

import React, { useEffect, useRef, useState, useContext } from 'react';
import { Toast } from 'primereact/toast';
import { State, RoomStatusData } from './components/interfaces';
import Table from './components/display/table';
import ActionDialog from './components/display/action_dialog';
import { apiEndpointGetRoomStatus } from './components/endpoints';
import postData from '@/lib/axios/postData';
import { FilterMatchMode } from 'primereact/api';
import CancelDialog from './components/display/cancel_dialog';
import HistoryDialog from './components/display/history_dialog';

const RoomStatusBoard = () => {
    const toast = useRef<Toast>(null);
    const [state, setState] = useState<State>({
        load: false,
        data: [],
        searchVal: '',
        filters: {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            ready_to_sell: { value: null, matchMode: FilterMatchMode.EQUALS }
        },
        kode_cabang: '',
        actionDialogVisible: false,
        cancelDialogVisible: false,
        historyDialogVisible: false,
        historyRoom: null,
        selectedRoom: null
    });

    useEffect(() => {
        getData();
    }, [state.kode_cabang]);

    const getData = async () => {
        try {
            setState((p) => ({ ...p, load: true }));
            const res = await postData(apiEndpointGetRoomStatus, { cabang: state.kode_cabang });
            
            // Transform data: add custom 'ready_to_sell' boolean flag for filtering
            const rawData = res?.data?.data || [];
            const mappedData: RoomStatusData[] = rawData.map((room: any) => {
                const isReady = room.occupancy_status === 'vacant' 
                             && room.housekeeping_status === 'clean' 
                             && (!room.task_status || room.task_status === 'finished');
                return {
                    ...room,
                    ready_to_sell: isReady
                };
            });

            setState((p) => ({ ...p, data: mappedData, load: false }));
        } catch (error) {
            console.error('Failed to get room status', error);
            setState((p) => ({ ...p, load: false }));
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal memuat data kamar' });
        }
    };

    const renderCounters = () => {
        const total = state.data.length;
        const clean = state.data.filter(r => r.housekeeping_status === 'clean').length;
        const dirty = state.data.filter(r => r.housekeeping_status === 'dirty').length;
        const inspection = state.data.filter(r => r.housekeeping_status === 'inspection').length;
        const inProgress = state.data.filter(r => r.task_status === 'in_progress').length;

        return (
            <div className="grid mb-4">
                <div className="col-12 md:col-2">
                    <div className="card mb-0 p-3 shadow-1">
                        <span className="block text-500 font-medium mb-1">Total Kamar</span>
                        <div className="text-900 font-bold text-xl">{total}</div>
                    </div>
                </div>
                <div className="col-12 md:col-2">
                    <div className="card mb-0 p-3 shadow-1">
                        <span className="block text-green-500 font-medium mb-1">Clean</span>
                        <div className="text-900 font-bold text-xl">{clean}</div>
                    </div>
                </div>
                <div className="col-12 md:col-2">
                    <div className="card mb-0 p-3 shadow-1">
                        <span className="block text-red-500 font-medium mb-1">Dirty</span>
                        <div className="text-900 font-bold text-xl">{dirty}</div>
                    </div>
                </div>
                <div className="col-12 md:col-3">
                    <div className="card mb-0 p-3 shadow-1">
                        <span className="block text-orange-500 font-medium mb-1">Perlu Inspeksi</span>
                        <div className="text-900 font-bold text-xl">{inspection}</div>
                    </div>
                </div>
                <div className="col-12 md:col-3">
                    <div className="card mb-0 p-3 shadow-1">
                        <span className="block text-blue-500 font-medium mb-1">Task In Progress</span>
                        <div className="text-900 font-bold text-xl">{inProgress}</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="card">
                    <h4>Room Status Board</h4>
                    <p className="text-gray-600 mb-4">
                        Monitor status kamar secara real-time. Terdapat filter untuk mempermudah operasional Housekeeping.
                    </p>
                    
                    {renderCounters()}

                    <Table state={state} setState={setState} toast={toast} getData={getData} />
                    <ActionDialog state={state} setState={setState} toast={toast} getData={getData} />
                    <CancelDialog state={state} setState={setState} toast={toast} getData={getData} />
                    <HistoryDialog 
                        visible={!!state.historyDialogVisible} 
                        onHide={() => setState((p) => ({ ...p, historyDialogVisible: false }))} 
                        kodeCabang={state.kode_cabang} 
                        selectedRoom={state.historyRoom} 
                    />
                </div>
            </div>
        </div>
    );
};

export default RoomStatusBoard;
