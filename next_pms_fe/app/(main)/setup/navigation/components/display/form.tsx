'use client';

/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file form.tsx
 * @description Dialog form tambah / edit master navigasi sidebar
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

import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { FormProps, NavRole, initValue } from '../interfaces';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointList, apiEndpointUpdate } from '../endpoints';
import MenuBuilder from './menuBuilder';
import MenuSelector from './menuSelector';
import { getTzUser } from '@/lib/tools/dateTools';

const ROLE_OPTIONS: { label: string; value: NavRole }[] = [
    { label: 'Superadmin', value: 'superadmin' },
    { label: 'Admin', value: 'admin' },
    { label: 'Master', value: 'master' },
];

const Form = ({ state, setState, formik, toast, getData }: FormProps) => {

    const [existingNavigations, setExistingNavigations] = useState<{ role: string; menu: any }[]>([]);

    useEffect(() => {
        const fetchNav = async () => {
            try {
                const vaData = await postData(apiEndpointList, {});
                const res = vaData.data?.data || [];
                setExistingNavigations(res.map((r: any) => ({ role: r.role, menu: r.menu })));
            } catch (error) {
                console.error("Gagal mengambil data navigasi", error);
            }
        };
        // Fetch existing navigations to get the superadmin master template
        if (state.add || state.edit) {
            fetchNav();
        }
    }, [state.add, state.edit]);

    const masterMenuData = existingNavigations.find(n => n.role === 'superadmin')?.menu || [];
    const isSuperAdmin = formik?.values.role === 'superadmin' || (state.edit && state.selectedData?.role === 'superadmin');

    const isFormFieldInvalid = (name: keyof initValue) =>
        !!(formik?.touched[name] && formik?.errors[name]);

    const getFormErrorMessage = (name: keyof initValue) =>
        isFormFieldInvalid(name)
            ? <small className="p-error">{formik?.errors[name] as string}</small>
            : <small className="p-error">&nbsp;</small>;

    const handleSave = async (input: initValue) => {
        setState((p) => ({ ...p, load: true }));

        try {
            const isEdit = Boolean(state.edit);
            const cEndPoint = isEdit ? apiEndpointUpdate : apiEndpointCreate;

            const oBody: Record<string, any> = {
                menu: JSON.stringify(input.menu),
                tz: getTzUser(),
            };

            if (isEdit) {
                oBody['id'] = input.id;
            } else {
                oBody['role'] = input.role;
            }

            const vaData = await postData(cEndPoint, oBody, { 'X-Level': '1' });
            showSuccess(toast, vaData.data?.message || 'Berhasil menyimpan data navigasi');
            formik.resetForm();
            setState((p) => ({ ...p, add: false, edit: false, delete: false }));
            await getData();
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi kesalahan saat menyimpan data');
        } finally {
            setState((p) => ({ ...p, load: false, submittedData: null }));
        }
    };

    const handleDelete = async () => {
        setState((p) => ({ ...p, load: true }));
        try {
            if (!state.selectedData) {
                showError(toast, 'Tidak ada data yang dipilih.');
                return;
            }

            const vaData = await postData(apiEndpointDelete, {
                id: state.selectedData.id,
                tz: getTzUser(),
            });
            showSuccess(toast, vaData.data?.message || 'Berhasil menghapus data navigasi.');
            setState((p) => ({ ...p, selectedData: null, add: false, edit: false, delete: false }));
            await getData();
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi kesalahan saat menghapus data.');
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    useEffect(() => {
        if (state.submittedData) {
            handleSave(state.submittedData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.submittedData]);

    const deleteFooterTemplate = (
        <div className="flex justify-content-center gap-2">
            <Button
                label="Batal"
                icon="pi pi-times"
                severity="secondary"
                outlined
                onClick={() => setState((p) => ({ ...p, add: false, edit: false, delete: false }))}
                disabled={state.load}
            />
            <Button
                label="Ya, Hapus"
                icon="pi pi-trash"
                severity="danger"
                onClick={handleDelete}
                loading={state.load}
            />
        </div>
    );

    return (
        <>
            {/* ─── Dialog Add / Edit ─── */}
            <Dialog
                visible={state.add || state.edit}
                header={state.edit ? `Edit Navigasi — ${state.selectedData?.role || ''}` : 'Tambah Navigasi Baru'}
                modal
                style={{ width: '100%', maxWidth: '640px' }}
                breakpoints={{ '769px': '95vw' }}
                onHide={() => {
                    setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                    formik?.resetForm();
                }}
            >
                <form onSubmit={formik?.handleSubmit} className="flex gap-3 flex-column pt-2">
                    <div className="flex gap-3 flex-column w-full">

                        {/* Role — hanya tampil saat add */}
                        {!state.edit && (
                            <>
                                <div className="flex flex-column gap-1 w-full">
                                    <label htmlFor="role" className="font-semibold text-sm">
                                        Role <span className="text-red-500">*</span>
                                    </label>
                                    <Dropdown
                                        id="role"
                                        name="role"
                                        editable
                                        options={ROLE_OPTIONS}
                                        value={formik?.values.role || ''}
                                        onChange={(e) => formik?.setFieldValue('role', e.target.value)}
                                        placeholder="Ketik role baru atau pilih yang ada"
                                        className={isFormFieldInvalid('role') ? 'p-invalid w-full' : 'w-full'}
                                    />
                                    {getFormErrorMessage('role')}
                                </div>
                            </>
                        )}

                        {/* Menu Builder / Selector */}
                        <div className="flex flex-column gap-2">
                            <label className="font-semibold text-sm">
                                {isSuperAdmin ? 'Struktur Menu Sidebar (Master)' : 'Akses Menu (Checklist)'}
                                {isSuperAdmin && (
                                    <span className="text-color-secondary font-normal text-xs ml-2">
                                        (drag <i className="pi pi-bars" style={{ fontSize: '0.75rem' }} /> untuk mengubah urutan)
                                    </span>
                                )}
                            </label>

                            {isSuperAdmin ? (
                                <MenuBuilder
                                    menu={formik?.values.menu || []}
                                    onChange={(updated) => formik?.setFieldValue('menu', updated)}
                                />
                            ) : (
                                <MenuSelector
                                    masterMenu={typeof masterMenuData === 'string' ? JSON.parse(masterMenuData) : masterMenuData}
                                    menu={formik?.values.menu || []}
                                    onChange={(updated) => formik?.setFieldValue('menu', updated)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex justify-content-end mt-3 border-top-1 border-300 pt-3 gap-2">
                        <Button
                            type="button"
                            label="Batal"
                            severity="secondary"
                            outlined
                            icon="pi pi-times"
                            onClick={() => {
                                setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                                formik?.resetForm();
                            }}
                        />
                        <Button
                            type="submit"
                            severity="success"
                            label="Simpan"
                            icon="pi pi-check"
                            loading={state?.load}
                        />
                    </div>
                </form>
            </Dialog>

            {/* ─── Dialog Konfirmasi Hapus ─── */}
            <Dialog
                header="Konfirmasi Hapus"
                visible={state.delete}
                onHide={() => setState((p) => ({ ...p, add: false, edit: false, delete: false }))}
                modal
                style={{ width: '25rem' }}
                footer={deleteFooterTemplate}
            >
                <div className="flex flex-column align-items-center text-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500 text-6xl" />
                    <div>
                        <h3 className="font-bold mb-2">Hapus navigasi ini?</h3>
                        <p className="text-color-secondary">
                            Anda akan menghapus template navigasi untuk role:
                            <br />
                            <strong>{state.selectedData?.role || ''}</strong>
                            <br /><br />
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default Form;
