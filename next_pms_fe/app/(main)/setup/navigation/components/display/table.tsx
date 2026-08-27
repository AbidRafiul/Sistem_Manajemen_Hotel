'use client';

/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file table.tsx
 * @description Komponen tabel daftar master navigasi sidebar per role
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

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { TableData, TableProps } from '../interfaces';
import Form from './form';

const ROLE_SEVERITY: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    superadmin: 'danger',
    admin: 'warning',
    master: 'info',
};

const ROLE_LABEL: Record<string, string> = {
    superadmin: 'Superadmin',
    admin: 'Admin',
    master: 'Master',
};

const Table = ({ state, setState, formik, toast, getData }: TableProps) => {

    const countMenuItems = (menuJson: string): number => {
        try {
            const menu = JSON.parse(menuJson);
            if (!Array.isArray(menu)) return 0;
            return menu.reduce((acc: number, group: any) => {
                return acc + (Array.isArray(group.items) ? group.items.length : 0);
            }, 0);
        } catch {
            return 0;
        }
    };

    const countGroups = (menuJson: string): number => {
        try {
            const menu = JSON.parse(menuJson);
            return Array.isArray(menu) ? menu.length : 0;
        } catch {
            return 0;
        }
    };

    const roleBadgeTemplate = (rowData: TableData) => (
        <Tag
            value={ROLE_LABEL[rowData.role] || rowData.role}
            severity={ROLE_SEVERITY[rowData.role] || 'info'}
        />
    );

    const menuSummaryTemplate = (rowData: TableData) => {
        const groups = countGroups(rowData.menu);
        const items = countMenuItems(rowData.menu);
        return (
            <span className="text-sm">
                <strong>{groups}</strong> grup &bull; <strong>{items}</strong> item
            </span>
        );
    };

    const actionBodyTemplate = (rowData: TableData) => (
        <div className="flex justify-content-center gap-2">
            <Button
                icon="pi pi-pencil"
                outlined
                className="p-button-sm"
                tooltip="Edit Navigasi"
                onClick={() => {
                    let parsedMenu = [];
                    try { parsedMenu = JSON.parse(rowData.menu); } catch { parsedMenu = []; }
                    formik.setValues({
                        id: rowData.id,
                        role: rowData.role,
                        menu: parsedMenu,
                        tz: rowData.tz,
                    });
                    setState((p) => ({ ...p, add: false, edit: true, delete: false, selectedData: rowData }));
                }}
            />
            <Button
                icon="pi pi-trash"
                outlined
                severity="danger"
                className="p-button-sm"
                tooltip="Hapus Navigasi"
                onClick={() => setState((p) => ({ ...p, delete: true, selectedData: rowData }))}
            />
        </div>
    );

    return (
        <>
            <div className="card">
                <div className="flex justify-content-between align-items-start mb-4">
                    <div className="flex flex-column">
                        <h3 className="text-2xl font-semibold flex align-items-center gap-2 m-0">
                            <i className="pi pi-sitemap text-blue-600 text-3xl" />
                            Master Navigasi Sidebar
                        </h3>
                        <p className="text-color-secondary mt-1 mb-0">
                            Kelola template menu sidebar untuk setiap role pengguna.
                        </p>
                    </div>
                </div>

                <div className="flex flex-row flex-wrap align-items-center gap-2 mb-4">
                    <Button
                        size="small"
                        label="Tambah Baru"
                        icon="pi pi-plus"
                        outlined
                        severity="success"
                        onClick={() => {
                            formik.resetForm();
                            formik.setValues({ role: '', menu: [], tz: '' });
                            setState((p) => ({ ...p, selectedData: null, add: true, edit: false }));
                        }}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={getData}
                        loading={state.load}
                    />
                </div>

                <DataTable
                    value={state.data}
                    loading={state.load}
                    dataKey="id"
                    emptyMessage="Tidak ada data navigasi"
                    scrollable
                >
                    <Column field="id" header="ID" align="center" style={{ minWidth: '4rem', width: '4rem' }} />
                    <Column
                        field="role"
                        header="Role"
                        body={roleBadgeTemplate}
                        align="center"
                        style={{ minWidth: '8rem' }}
                    />
                    <Column
                        header="Ringkasan Menu"
                        body={menuSummaryTemplate}
                        style={{ minWidth: '12rem' }}
                    />
                    <Column
                        field="updated_at"
                        header="Terakhir Diperbarui"
                        body={(rowData) => formatDateSystem(rowData.updated_at)}
                        align="center"
                        style={{ minWidth: '12rem' }}
                    />
                    <Column
                        header="Aksi"
                        body={actionBodyTemplate}
                        align="center"
                        frozen
                        alignFrozen="right"
                        style={{ minWidth: '8rem' }}
                    />
                </DataTable>
            </div>

            <Form
                state={state}
                setState={setState}
                formik={formik}
                toast={toast}
                getData={getData}
            />
        </>
    );
};

export default Table;
