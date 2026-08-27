/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file interfaces.ts
 * @description File daftar interface untuk page master navigasi sidebar
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-27
 *
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 *
 * @lastModified Fadil (2026-08-27)
 * @version 1.0.1
 */

import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';

export type NavRole = string;

/** Struktur satu item menu (leaf = punya `to`, group = punya `items`) */
export interface NavMenuItem {
    label: string;
    icon?: string;
    to?: string;
    items?: NavMenuItem[];
}

/** Baris tabel mst_navigation */
export interface TableData {
    id: number;
    role: NavRole;
    menu: string; // JSON string dari DB
    tz: string;
    created_at: string;
    updated_at: string;
}

/** Nilai awal formik untuk create/edit */
export interface initValue {
    id?: number;
    role: NavRole | '';
    menu: NavMenuItem[];
    tz: string;
}

export interface State {
    load: boolean;
    data: TableData[];
    add: boolean;
    edit: boolean;
    delete: boolean;
    selectedData: TableData | null;
    submittedData?: initValue | null;
}

export interface TableProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    formik: FormikProps<initValue>;
    toast: RefObject<Toast>;
    getData: () => Promise<void>;
}

export interface FormProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    formik: FormikProps<initValue>;
    toast: RefObject<Toast>;
    getData: () => Promise<void>;
}

export interface MenuBuilderProps {
    menu: NavMenuItem[];
    onChange: (updated: NavMenuItem[]) => void;
}

export interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
}
