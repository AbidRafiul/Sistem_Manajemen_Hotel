'use client';

import { Dialog } from 'primereact/dialog';
import { FormProps, initValue, TAX_TYPE_OPTIONS } from '../interfaces';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointGet, apiEndpointUpdate } from '../endpoints';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useEffect, useState } from 'react';
import { getTzUser } from '@/lib/tools/dateTools';
import { InputSwitch } from 'primereact/inputswitch';

const Form = ({ state, setState, formik, toast, getData }: FormProps) => {
    const [cabangList, setCabangList] = useState<any[]>([]);

    const fetchCabang = async (keyword = '') => {
        try {
            const res = await postData('/api/interceptor/routes', {
                endpoint: '/master/cabang',
                payload: { page: 1, perPage: 100, keyword }
            });
            setCabangList(res.data.data);
        } catch (error) {
            console.error('Error fetching cabang:', error);
        }
    };
    const handleSave = async (input: initValue) => {
        setState((p) => ({ ...p, load: true }));

        try {
            const isEdit = Boolean(state.edit);
            const cEndPoint = isEdit ? apiEndpointUpdate : apiEndpointCreate;

            const oHeaders: Record<string, string> = {
                'X-Level': '1'
            };

            const oBody: Record<string, any> = {
                kode_cabang: input.kode_cabang,
                name: input.name,
                tax_type: input.tax_type,
                percentage: input.percentage,
                is_compounding: input.is_compounding,
                is_active: input.is_active,
                tz: getTzUser()
            };

            if (isEdit) {
                oBody['kode_pajak'] = input.kode_pajak;
            }

            const vaData = await postData(cEndPoint, oBody, oHeaders);
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil Menyimpan Data Pajak');
            formik.resetForm();
            setState((p) => ({ ...p, add: false, edit: false, delete: false }));
            await getData(apiEndpointGet);
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan saat menyimpan data');
        } finally {
            setState((p) => ({ ...p, load: false, submittedData: null }));
        }
    };

    const handleDelete = async () => {
        setState((p) => ({ ...p, load: true }));

        try {
            if (state.selectedDatas.length < 1) {
                showError(toast, 'Tidak ada data yang dipilih.');
                return;
            }

            const vaCode = state.selectedDatas.map((v) => v.kode_pajak);

            const vaData = await postData(apiEndpointDelete, { kode_pajak: vaCode, tz: getTzUser() });
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil menghapus data Pajak.');
            setState((p) => ({ ...p, selectedDatas: [], add: false, edit: false, delete: false }));
            await getData(apiEndpointGet);
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi kesalahan saat menghapus data.');
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
                onClick={() => {
                    setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                }}
                disabled={state.load}
            />
            <Button label="Ya, Hapus" icon="pi pi-trash" severity="danger" onClick={handleDelete} loading={state.load} />
        </div>
    );

    const isFormFieldInvalid = (name: keyof initValue) => !!(formik?.touched[name] && formik?.errors[name]);

    const getFormErrorMessage = (name: keyof initValue) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik?.errors[name] as string}</small> : <small className="p-error">&nbsp;</small>;
    };

    useEffect(() => {
        if (state.submittedData) {
            handleSave(state.submittedData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.submittedData]);

    useEffect(() => {
        fetchCabang();
    }, []);

    return (
        <>
            <Dialog
                visible={state.add || state.edit}
                header={state.edit ? 'Edit Data Pajak' : 'Tambah Pajak Baru'}
                modal
                style={{ width: '100%', maxWidth: '500px' }}
                breakpoints={{ '641px': '90vw' }}
                onHide={() => {
                    setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                    formik?.resetForm();
                }}
            >
                <form onSubmit={formik?.handleSubmit} className="flex gap-3 flex-column pt-2">
                    <div className="flex gap-2 flex-column w-full">
                        {/* Cabang */}
                        <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="kode_cabang" className="font-semibold text-sm">
                                Cabang <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="kode_cabang"
                                name="kode_cabang"
                                options={cabangList.map((c) => ({ label: c.nama_hotel, value: c.kode_cabang }))}
                                value={formik?.values.kode_cabang || ''}
                                onChange={(e) => formik?.setFieldValue('kode_cabang', e.value)}
                                placeholder="Pilih Cabang"
                                className={isFormFieldInvalid('kode_cabang') ? 'p-invalid w-full' : 'w-full'}
                                filter
                                onFilter={(e) => fetchCabang(e.filter)}
                                emptyMessage="Cabang tidak ditemukan"
                                emptyFilterMessage="Cabang tidak ditemukan"
                                showClear
                            />
                            {getFormErrorMessage('kode_cabang')}
                        </div>

                        {/* Nama Pajak */}
                        <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="name" className="font-semibold text-sm">
                                Nama Pajak <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="name"
                                name="name"
                                value={formik?.values.name || ''}
                                placeholder="Contoh: PPN 11%, Service Charge 10%"
                                onChange={(e) => formik?.setFieldValue('name', e.target.value)}
                                className={isFormFieldInvalid('name') ? 'p-invalid w-full' : 'w-full'}
                            />
                            {getFormErrorMessage('name')}
                        </div>

                        {/* Tipe Pajak */}
                        <div className="flex flex-column gap-1 w-full mt-2">
                            <label htmlFor="tax_type" className="font-semibold text-sm">
                                Tipe Pajak <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="tax_type"
                                name="tax_type"
                                options={TAX_TYPE_OPTIONS}
                                value={formik?.values.tax_type || 'tax'}
                                onChange={(e) => formik?.setFieldValue('tax_type', e.value)}
                                placeholder="Pilih Tipe Pajak"
                                className={isFormFieldInvalid('tax_type') ? 'p-invalid w-full' : 'w-full'}
                            />
                            {getFormErrorMessage('tax_type')}
                        </div>

                        {/* Persentase */}
                        <div className="flex flex-column gap-1 w-full mt-2">
                            <label htmlFor="percentage" className="font-semibold text-sm">
                                Persentase (%) <span className="text-red-500">*</span>
                            </label>
                            <InputNumber
                                id="percentage"
                                name="percentage"
                                value={formik?.values.percentage}
                                onValueChange={(e) => formik?.setFieldValue('percentage', e.value)}
                                className={isFormFieldInvalid('percentage') ? 'p-invalid w-full' : 'w-full'}
                                showButtons
                                mode="decimal"
                                maxFractionDigits={2}
                                min={0}
                                max={100}
                                suffix=" %"
                            />
                            {getFormErrorMessage('percentage')}
                        </div>

                        {/* Switches */}
                        <div className="flex flex-column md:flex-row gap-4 mt-4">
                            <div className="flex align-items-center gap-2">
                                <InputSwitch
                                    id="is_compounding"
                                    name="is_compounding"
                                    checked={formik?.values.is_compounding === 1}
                                    onChange={(e) => formik?.setFieldValue('is_compounding', e.value ? 1 : 0)}
                                />
                                <label htmlFor="is_compounding" className="font-semibold text-sm cursor-pointer select-none">
                                    Compounding
                                </label>
                            </div>

                            <div className="flex align-items-center gap-2">
                                <InputSwitch
                                    id="is_active"
                                    name="is_active"
                                    checked={formik?.values.is_active === 1}
                                    onChange={(e) => formik?.setFieldValue('is_active', e.value ? 1 : 0)}
                                />
                                <label htmlFor="is_active" className="font-semibold text-sm cursor-pointer select-none">
                                    Status Aktif
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-content-end mt-4 border-t-1 border-300 pt-3 gap-2">
                        <Button
                            label="Batal"
                            severity="secondary"
                            outlined
                            icon="pi pi-times"
                            onClick={() => {
                                setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                                formik?.resetForm();
                            }}
                            className="w-full md:w-auto"
                        />
                        <Button type="submit" severity="success" label="Simpan" icon="pi pi-check" loading={state?.load} className="w-full md:w-auto" />
                    </div>
                </form>
            </Dialog>

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
                        <h3 className="font-bold mb-2">
                            {state.selectedDatas.length > 1 ? `Hapus ${state.selectedDatas.length} data Pajak?` : 'Hapus data Pajak ini?'}
                        </h3>
                        <p className="text-color-secondary">
                            {state.selectedDatas.length > 1 ? (
                                `Anda akan menghapus ${state.selectedDatas.length} item pajak.`
                            ) : (
                                <>
                                    Anda akan menghapus pajak: <br />
                                    <strong>
                                        {state.selectedDatas[0]?.kode_pajak || state.selectedDatas[0]?.kode_pajak || ''} - {state.selectedDatas[0]?.name || ''}
                                    </strong>
                                </>
                            )}
                            <br />
                            <br />
                            Data akan dinonaktifkan (soft delete).
                        </p>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default Form;
