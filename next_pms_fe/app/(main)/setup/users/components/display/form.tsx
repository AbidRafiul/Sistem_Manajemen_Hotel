/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file page.tsx
 * @description File form untuk menampilkan form tambah/edit data user
 * 
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-07-14
 * 
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 * 
 * @lastModified Fadil (2026-08-03)
 * @version 1.0.1
 */


'use client'

import { Dialog } from "primereact/dialog";
import { FormProps, initValue } from "../interfaces"
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { apiEndpointCreate, apiEndpointDelete, apiEndpointGet, apiEndpointUpdate } from "../endpoints";
import postData from "@/lib/axios/postData";
import { showError, showSuccess } from "@/lib/tools/generalTools";
import { useEffect, useState } from "react";
import { getTzUser } from "@/lib/tools/dateTools";
import { useSession } from "next-auth/react";

const DEFAULT_ROLES = [
    { label: "FRONTDESK", value: "frontdesk" },
    { label: "RECEPTIONIST", value: "receptionist" },
    { label: "KASIR", value: "kasir" },
    { label: "HOUSEKEEPING", value: "housekeeping" },
    { label: "BRANCH MANAGER", value: "branch_manager" },
    { label: "REGIONAL MANAGER", value: "regional_manager" },
    { label: "CORPORATE MANAGER", value: "corporate_manager" },
    { label: "AUDITOR", value: "auditor" },
    { label: "ADMIN", value: "admin" },
    { label: "SUPERADMIN", value: "superadmin" },
];

const Form = ({
    state,
    setState,
    formik,
    toast,
    getData
}: FormProps) => {
    const { data: session } = useSession();
    const [roles, setRoles] = useState<{ label: string, value: string }[]>(DEFAULT_ROLES);
    const [branches, setBranches] = useState<{
        label: string;
        value: number;
        org_node_id: number | null;
        nama_wilayah?: string;
        kode_cabang?: string;
        nama_hotel?: string;
    }[]>([]);
    const [regions, setRegions] = useState<{ label: string, value: number, name?: string }[]>([]);

    const currentUserRole = String(session?.user?.role || '').toLowerCase();
    const canMutate = ['superadmin', 'admin', 'corporate_manager', 'regional_manager'].includes(currentUserRole);

    const activeBranchId = Number(session?.user?.active_branch_id || session?.user?.default_branch_id) || (branches.length > 0 ? branches[0].value : 28);
    const activeBranchObj = branches.find(b => b.value === activeBranchId);
    const activeBranchName = activeBranchObj?.label || session?.user?.active_branch_name || 'Grand Marstech Hotel & Resort Magetan (CAB0001)';
    const activeRegionId = activeBranchObj?.org_node_id || 1;
    const activeRegionObj = regions.find(r => r.value === activeRegionId);
    const activeRegionName = activeBranchObj?.nama_wilayah || activeRegionObj?.label || 'Wilayah Jawa Timur';

    // Cabang & Wilayah saat edit / mutasi
    const selectedBranchId = formik?.values?.default_branch_id ? Number(formik?.values?.default_branch_id) : activeBranchId;
    const selectedBranchObj = branches.find(b => b.value === selectedBranchId);
    const selectedRegionId = selectedBranchObj?.org_node_id || formik?.values?.org_node_id || 1;
    const selectedRegionObj = regions.find(r => r.value === selectedRegionId);
    const selectedRegionName = selectedBranchObj?.nama_wilayah || selectedRegionObj?.label || 'Wilayah Jawa Timur';

    const fetchComponentData = async () => {
        // 1. Fetch roles dari navigasi
        try {
            const roleRes = await postData("/setup/nav/mst-list", {});
            const resRoles = roleRes?.data?.data;
            if (Array.isArray(resRoles) && resRoles.length > 0) {
                setRoles(resRoles.map((r: any) => ({
                    label: String(r.role).replace(/_/g, ' ').toUpperCase(),
                    value: r.role
                })));
            }
        } catch (err) {
            console.error("Gagal mengambil data role:", err);
        }

        // 2. Fetch cabang
        try {
            const branchRes = await postData("/master/cabang/cabang-data", { perPage: 100 });
            const resBranches = branchRes?.data?.data || branchRes?.data;
            if (Array.isArray(resBranches)) {
                setBranches(resBranches.map((b: any) => ({
                    label: `${b.name || b.nama_hotel} (${b.kode_cabang})`,
                    value: Number(b.id),
                    org_node_id: b.org_node_id ? Number(b.org_node_id) : null,
                    nama_wilayah: b.nama_wilayah || 'Wilayah Jawa Timur',
                    kode_cabang: b.kode_cabang,
                    nama_hotel: b.name || b.nama_hotel
                })));
            }
        } catch (err) {
            console.error("Gagal mengambil data cabang:", err);
        }

        // 3. Fetch wilayah
        try {
            const regionRes = await postData("/master/wilayah/wilayah-dropdown", {});
            const resRegions = regionRes?.data?.data || regionRes?.data;
            if (Array.isArray(resRegions)) {
                setRegions(resRegions.map((r: any) => ({
                    label: r.label || r.nama || `${r.code} - ${r.name}`,
                    value: Number(r.value || r.kode || r.id),
                    name: r.name || r.nama || 'Wilayah Jawa Timur'
                })));
            }
        } catch (err) {
            console.error("Gagal mengambil data wilayah:", err);
        }
    };

    // Auto-assignment branch & wilayah saat form tambah dibuka (otomatis terkunci ke active branch)
    useEffect(() => {
        if (state.add) {
            formik.setFieldValue('default_branch_id', activeBranchId);
            formik.setFieldValue('org_node_id', activeRegionId);
        }
    }, [state.add, activeBranchId, activeRegionId]);

    const handleSave = async (input: initValue) => {
        if (!input.role || !String(input.role).trim()) {
            showError(toast, 'Harap pilih Role untuk user ini.');
            return;
        }

        setState((p) => ({ ...p, load: true }));

        try {
            const isEdit = Boolean(state.edit);
            const cEndPoint = isEdit ? apiEndpointUpdate : apiEndpointCreate;

            // Enforce branch & region logic
            const assignedBranchId = !isEdit
                ? activeBranchId
                : (canMutate ? (input.default_branch_id || activeBranchId) : (formik.values.default_branch_id || activeBranchId));
            
            const branchObj = branches.find(b => b.value === assignedBranchId);
            const assignedOrgNodeId = branchObj?.org_node_id || (!isEdit ? activeRegionId : (input.org_node_id || 1));

            const oHeaders: Record<string, string> = {
                "X-Level": "1",
                "X-Credential": JSON.stringify({
                    username: input.username,
                    password: input.password,
                }),
            };

            const oBody: Record<string, any> = {
                fullname: input.fullname,
                username: input.username,
                password: input.password,
                telp: input.telp,
                status: input.status,
                role: input.role,
                default_branch_id: assignedBranchId,
                org_node_id: assignedOrgNodeId,
                tz: getTzUser()
            };

            if (isEdit) {
                oBody["user_code"] = input.user_code;
            }

            const vaData = await postData(cEndPoint, oBody, oHeaders);
            const res = vaData.data;

            showSuccess(toast, res.data?.message || "Berhasil Menyimpan Data");
            formik.resetForm();
            setState((p) => ({ ...p, add: false, edit: false, delete: false }));
            await getData(apiEndpointGet)
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || "Terjadi Kesalahan");
        } finally {
            setState((p) => ({ ...p, load: false, submittedData: null }));
        }
    };
    const handleDelete = async () => {
        setState((p) => ({ ...p, load: true }));

        try {

            if (state.selectedData.length < 1) {
                showError(toast, 'Tidak Ada User yang Dipilih')
                return
            }

            const vauser_code = state.selectedData.map(v => v.user_code)

            const vaData = await postData(apiEndpointDelete, { user_code: vauser_code });
            const res = vaData.data;

            showSuccess(toast, res.data?.message || "Berhasil Menghapus Data");
            setState((p) => ({ ...p, selectedData: [], add: false, edit: false, delete: false }));
            await getData(apiEndpointGet)
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || "Terjadi Kesalahan");
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };


    const deleteFooterTemplate = (
        <div className="flex justify-content-center gap-2">
            <Button
                label="Batal"
                icon="pi pi-times"
                severity="secondary"
                outlined
                onClick={
                    () => {
                        setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                    }
                }
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

    const isFormFieldInvalid = (name: keyof initValue) => !!((formik?.touched[name] || (formik?.submitCount && formik?.submitCount > 0)) && formik?.errors[name]);

    const getFormErrorMessage = (name: keyof initValue) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik?.errors[name]}</small> : "";
    };

    useEffect(() => {
        if (state.submittedData) {
            handleSave(state.submittedData)
        }
    }, [state.submittedData])

    useEffect(() => {
        fetchComponentData()
    }, [])

    return <>
        <Dialog
            visible={state.add || state.edit}
            header={state.edit ? 'Edit Data User' : 'Tambah Data User'}
            modal
            style={{ width: '750px', maxWidth: '95vw' }}
            breakpoints={{ '960px': '85vw', '641px': '95vw' }}
            contentStyle={{ overflowX: 'hidden' }}
            onHide={() => {
                setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                formik?.resetForm();
            }}
        >
            <form onSubmit={formik?.handleSubmit} className="flex gap-2 flex-column">

                <div className="flex md:flex-row flex-column gap-2 w-full">
                    <div className="flex flex-column gap-2 w-full">
                        <label htmlFor="name">Name</label>
                        <div className="p-inputgroup">
                            <InputText
                                id="name"
                                name="name"
                                value={formik?.values.fullname}
                                style={{ padding: '1rem' }}
                                placeholder="fullname"
                                onChange={(e) => {
                                    formik?.setFieldValue('fullname', e.target.value);
                                }}
                                className={isFormFieldInvalid('fullname') ? 'p-invalid' : ''}
                            />
                        </div>
                        {isFormFieldInvalid('fullname') ? getFormErrorMessage('fullname') : ''}
                    </div>
                    <div className="flex flex-column gap-2 w-full">
                        <label htmlFor="username">Username</label>
                        <div className="p-inputgroup">
                            <InputText
                                id="username"
                                name="username"
                                value={formik?.values.username}
                                style={{ padding: '1rem' }}
                                placeholder="username"
                                onChange={(e) => {
                                    formik?.setFieldValue('username', e.target.value);
                                }}
                                className={isFormFieldInvalid('username') ? 'p-invalid' : ''}
                            />
                        </div>
                        {isFormFieldInvalid('username') ? getFormErrorMessage('username') : ''}
                    </div>
                </div>

                <div className="flex md:flex-row flex-column gap-2 w-full">

                    <div className="flex flex-column gap-2 w-full">
                        <label htmlFor="telp">Telp</label>
                        <div className="p-inputgroup">
                            <InputText
                                id="telp"
                                name="telp"
                                keyfilter={'int'}
                                value={formik?.values.telp}
                                style={{ padding: '1rem' }}
                                onChange={(e) => {
                                    formik?.setFieldValue('telp', e.target.value);
                                }}
                                placeholder="089222333444"
                                className={isFormFieldInvalid('telp') ? 'p-invalid' : ''}
                            />
                        </div>
                        {isFormFieldInvalid('telp') ? getFormErrorMessage('telp') : ''}
                    </div>
                </div>



                {/* {!state?.edit && ( */}
                <div className="flex flex-column gap-2 w-full">
                    <label htmlFor="password">Password</label>
                    <div className="p-inputgroup">
                        <Password
                            id="password"
                            name="password"
                            unstyled
                            pt={{
                                root: { className: 'my-password-unstyled' },
                                input: {
                                    className: 'my-password-input',
                                    style: { width: '100%' }
                                },
                                showIcon: { style: { right: '10px' } },
                                hideIcon: { style: { right: '10px' } }
                            }}
                            toggleMask
                            value={formik?.values.password}
                            onChange={(e) => {
                                formik?.setFieldValue('password', e.target.value);
                            }}
                            className={isFormFieldInvalid('password') ? 'p-invalid' : ''}
                        />
                    </div>
                    {isFormFieldInvalid('password') ? getFormErrorMessage('password') : ''}
                </div>
                {/* )} */}
                {(formik.values.role == 'superadmin' && state.edit) ? "" :

                    <div className="flex flex-column gap-2 w-full">
                        <label htmlFor="role">Role</label>
                        <div className="p-inputgroup">
                            <Dropdown
                                id="role"
                                name="role"
                                options={roles}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Pilih Role"
                                value={formik?.values.role}
                                onChange={(e) => {
                                    formik?.setFieldValue('role', e.value);
                                }}
                                className={isFormFieldInvalid('role') ? 'p-invalid w-full' : 'w-full'}
                            />
                        </div>
                        {isFormFieldInvalid('role') ? getFormErrorMessage('role') : ''}
                    </div>
                }
                <div className="flex flex-column gap-2 w-full">
                    <label htmlFor="status">Status</label>
                    <div className="p-inputgroup">
                        <Dropdown
                            id="status"
                            name="status"
                            optionValue="kode"
                            optionLabel="label"
                            options={[
                                { kode: '0', label: 'nonactive' },
                                { kode: '1', label: 'active' },
                            ]}
                            value={formik?.values.status}
                            onChange={(e) => {
                                formik?.setFieldValue('status', e.value);
                            }}
                            className={isFormFieldInvalid('status') ? 'p-invalid' : ''}
                        />
                    </div>
                    {isFormFieldInvalid('status') ? getFormErrorMessage('status') : ''}
                </div>

                {/* Penugasan Cabang & Wilayah */}
                {/* Penugasan Cabang & Wilayah (Read-Only saat Tambah User) */}
                {state.add && (
                    <div className="surface-100 border-round-xl p-3 border-1 surface-border flex flex-column gap-2 mt-2">
                        <div className="flex align-items-center gap-2 text-primary font-semibold text-sm">
                            <i className="pi pi-building text-base" />
                            <span>Penugasan Otomatis Sesuai Cabang Aktif</span>
                        </div>
                        <div className="grid">
                            <div className="col-12 md:col-6 py-1">
                                <span className="text-xs text-500 font-medium block">Cabang Penugasan (Sesuai Cabang Aktif)</span>
                                <span className="text-sm font-bold text-900 flex align-items-center gap-1 mt-1">
                                    <i className="pi pi-map-marker text-xs text-primary" />
                                    {activeBranchName}
                                </span>
                            </div>
                            <div className="col-12 md:col-6 py-1">
                                <span className="text-xs text-500 font-medium block">Wilayah / Regional</span>
                                <span className="text-sm font-bold text-900 flex align-items-center gap-1 mt-1">
                                    <i className="pi pi-globe text-xs text-primary" />
                                    {activeRegionName}
                                </span>
                            </div>
                        </div>
                        <div className="text-xs text-500 italic">
                            * Karyawan baru otomatis ditugaskan pada unit cabang dan wilayah yang sedang aktif saat ini.
                        </div>
                    </div>
                )}

                {/* Pindah Tugas / Mutasi Cabang (Saat Edit User) */}
                {state.edit && (
                    canMutate ? (
                        <div className="surface-50 border-round-xl p-3 border-1 surface-border flex flex-column gap-3 mt-2">
                            <div className="flex align-items-center justify-content-between">
                                <div className="flex align-items-center gap-2 text-900 font-semibold text-sm">
                                    <i className="pi pi-arrows-h text-primary" />
                                    <span>Mutasi / Pindah Tugas Cabang</span>
                                </div>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 border-round font-medium">
                                    Wewenang Corporate / Regional
                                </span>
                            </div>
                            <div className="grid">
                                <div className="col-12 md:col-7 py-1">
                                    <label htmlFor="default_branch_id" className="font-semibold text-xs text-700 block mb-1">
                                        Pilih Cabang Penugasan Baru
                                    </label>
                                    <Dropdown
                                        id="default_branch_id"
                                        name="default_branch_id"
                                        options={branches}
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Pilih Cabang Baru"
                                        value={formik?.values.default_branch_id}
                                        onChange={(e) => {
                                            formik?.setFieldValue('default_branch_id', e.value);
                                            const selected = branches.find(b => b.value === e.value);
                                            if (selected?.org_node_id) {
                                                formik?.setFieldValue('org_node_id', selected.org_node_id);
                                            }
                                        }}
                                        filter
                                        className="w-full"
                                    />
                                </div>
                                <div className="col-12 md:col-5 py-1">
                                    <label className="font-semibold text-xs text-700 block mb-1">
                                        Wilayah (Otomatis Tersinkron)
                                    </label>
                                    <div className="p-2 border-1 surface-border border-round surface-100 text-sm font-semibold text-800 flex align-items-center gap-2" style={{ height: '42px' }}>
                                        <i className="pi pi-globe text-primary text-xs" />
                                        <span>
                                            {selectedRegionName}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-500">
                                * Saat cabang dipindahkan, cakupan wilayah dan hak akses operasional user akan otomatis mengikuti unit cabang target.
                            </div>
                        </div>
                    ) : (
                        <div className="surface-100 border-round-xl p-3 border-1 surface-border flex flex-column gap-2 mt-2">
                            <div className="flex align-items-center gap-2 text-700 font-semibold text-sm">
                                <i className="pi pi-building text-base" />
                                <span>Cabang & Wilayah Penugasan</span>
                            </div>
                            <div className="grid">
                                <div className="col-12 md:col-6 py-1">
                                    <span className="text-xs text-500 font-medium block">Cabang Penugasan</span>
                                    <span className="text-sm font-bold text-900 mt-1 block">
                                        {selectedBranchObj?.label || 'Cabang Terdaftar'}
                                    </span>
                                </div>
                                <div className="col-12 md:col-6 py-1">
                                    <span className="text-xs text-500 font-medium block">Wilayah / Regional</span>
                                    <span className="text-sm font-bold text-900 mt-1 block">
                                        {selectedRegionName}
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs text-orange-600 font-medium flex align-items-center gap-1">
                                <i className="pi pi-lock text-xs" />
                                <span>Mutasi cabang penugasan hanya dapat dilakukan oleh Management Corporate atau Regional.</span>
                            </div>
                        </div>
                    )
                )}

                <Button type="submit" label={state?.edit ? 'Update' : 'Save'} className="mt-2" loading={state?.load} />
            </form>
        </Dialog>

        <Dialog
            header="Confirm Delete"
            visible={state.delete}
            onHide={() => {
                setState((p) => ({ ...p, add: false, edit: false, delete: false }));
            }}
            modal
            style={{ width: "25rem" }}
            footer={() => {
                return <div className="flex justify-content-center gap-2">
                    <Button
                        label="Batal"
                        icon="pi pi-times"
                        severity="secondary"
                        outlined
                        onClick={
                            () => {
                                setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                            }
                        }
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
            }}
        >
            <div className="flex flex-column align-items-center text-center gap-4 py-4">
                <i className="pi pi-exclamation-triangle text-red-500 text-6xl" />

                <div>
                    <h3 className="font-bold mb-2">
                        {state.selectedData.length > 1
                            ? `Delete ${state.selectedData.length} units?`
                            : "Delete this unit?"
                        }
                    </h3>
                    <p className="text-color-secondary">
                        {state.selectedData.length > 1 ? (
                            `You are going to delete all this selected ${state.selectedData.length} units`
                        ) : (
                            <>
                                You are going to delete this unit as follow : <strong>{state.selectedData[0]?.user_code || ""}</strong>
                                {`(${state.selectedData[0]?.fullname})`}.
                            </>
                        )}
                        <br />
                        This action can&apos;t be undone
                    </p>
                </div>
            </div>
        </Dialog>
    </>

}

export default Form