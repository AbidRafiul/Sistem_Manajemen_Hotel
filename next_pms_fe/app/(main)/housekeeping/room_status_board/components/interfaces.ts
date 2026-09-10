import { FilterMatchMode } from 'primereact/api';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';
import { DataTableStateEvent } from 'primereact/datatable';

export interface RoomStatusData {
    kode_kamar: string;
    nomor_kamar: string;
    occupancy_status: string;
    housekeeping_status: string;
    kode_housekeeping_task: string | null;
    task_type: string | null;
    task_status: string | null;
    assigned_to_name: string | null;
    ready_to_sell?: boolean;
    cancel_reason?: string | null;
}

export interface State {
    load: boolean;
    data: RoomStatusData[];
    searchVal: string;
    filters: {
        global: { value: string | null; matchMode: FilterMatchMode };
        ready_to_sell: { value: boolean | null; matchMode: FilterMatchMode };
    };
    kode_cabang: string;
    actionDialogVisible: boolean;
    cancelDialogVisible: boolean;
    selectedRoom: RoomStatusData | null;
    historyDialogVisible?: boolean;
    historyRoom?: RoomStatusData | null;
}

export interface HousekeepingHistoryItem {
    id: number;
    kode_housekeeping_task: string;
    kode_cabang: string;
    kode_kamar: string;
    nomor_kamar: string;
    nama_tipe_kamar: string;
    task_type: string;
    assigned_to: number;
    assigned_to_name: string;
    priority: string;
    status: string;
    started_at: string | null;
    finished_at: string | null;
    approved_at: string | null;
    supervisor_id: number | null;
    supervisor_name: string | null;
    cancel_reason: string | null;
    created_at: string;
    updated_at: string;
    duration_minutes: number | null;
}

export interface TableProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    toast: RefObject<Toast>;
    getData: () => Promise<void>;
}

export interface ActionDialogProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    toast: RefObject<Toast>;
    getData: () => Promise<void>;
}

export interface HistoryDialogProps {
    visible: boolean;
    onHide: () => void;
    kodeCabang: string;
    selectedRoom?: RoomStatusData | null;
}
