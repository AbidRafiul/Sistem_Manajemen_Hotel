'use client';

import { Dialog } from 'primereact/dialog';
import { FormProps, initValue } from '../interfaces';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointGet, apiEndpointUpdate } from '../endpoints';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { getTzUser } from '@/lib/tools/dateTools';
import { InputSwitch } from 'primereact/inputswitch';

const Form = ({ state, setState, formik, toast, getData }: FormProps) => {
    const [cabangList, setCabangList] = useState([]);
    const [gedungList, setGedungList] = useState([]);

    const fetchCabang = async (keyword = '') => {
        try {
            const res = await postData('/master/cabang/cabang-data', {
                perPage: 50,
                keyword: keyword
            });
            setCabangList(res.data.data);
        } catch (error) {
            console.error('Gagal mengambil data cabang:', error);
        }
    };

    const fetchGedung = async (kodeCabang: string, keyword = '') => {
        if (!kodeCabang) {
            setGedungList([]);
            return;
        }
        try {
            const res = await postData('/master/gedung/gedung-data', {
                perPage: 50,
                keyword: keyword,
                kode_cabang: kodeCabang
            });
            setGedungList(res.data.data);
        } catch (error) {
            console.error('Gagal mengambil data gedung:', error);
        }
    };

    const handleFilterCabang = (e: any) => {
        fetchCabang(e.filter);
    };
    const handleFilterGedung = (e: any) => {
        fetchGedung(formik?.values.kode_cabang || '', e.filter);
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
                kode_gedung: input.kode_gedung,
                name: input.name,
                nomor_lantai: input.nomor_lantai,
                is_active: input.is_active,
                tz: getTzUser()
            };

            if (isEdit) {
                oBody['kode_lantai'] = input.kode_lantai;
            }

            const vaData = await postData(cEndPoint, oBody, oHeaders);
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil Menyimpan Data Lantai');
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

            const vaCode = state.selectedDatas.map((v) => v.kode_lantai);

            const vaData = await postData(apiEndpointDelete, { kode_lantai: vaCode, tz: getTzUser() });
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil menghapus data Lantai.');
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

    useEffect(() => {
        if (formik?.values.kode_cabang) {
            fetchGedung(formik.values.kode_cabang);
        } else {
            setGedungList([]);
        }
    }, [formik?.values.kode_cabang]);

    return (
        <>
            <Dialog
                visible={state.add || state.edit}
                header={state.edit ? 'Edit Data Lantai' : 'Tambah Lantai Baru'}
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
                        {/* Cabang & Gedung */}
                        <div className="flex flex-column gap-3 w-full">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="kode_cabang" className="font-semibold text-sm">
                                    Cabang <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="kode_cabang"
                                    name="kode_cabang"
                                    value={formik?.values.kode_cabang}
                                    options={cabangList}
                                    optionLabel="name"
                                    optionValue="kode_cabang"
                                    onChange={formik?.handleChange}
                                    placeholder="-- Pilih Cabang --"
                                    filter
                                    onFilter={handleFilterCabang}
                                    resetFilterOnHide={true}
                                    className={isFormFieldInvalid('kode_cabang') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('kode_cabang')}
                            </div>
                            
                            <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="kode_gedung" className="font-semibold text-sm">
                                Gedung <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="kode_gedung"
                                name="kode_gedung"
                                value={formik?.values.kode_gedung}
                                options={gedungList}
                                optionLabel="nama_gedung"
                                optionValue="kode_gedung"
                                onChange={formik?.handleChange}
                                placeholder="-- Pilih Gedung --"
                                filter
                                onFilter={handleFilterGedung}
                                resetFilterOnHide={true}
                                className={isFormFieldInvalid('kode_gedung') ? 'p-invalid w-full' : 'w-full'}
                            />
                            {getFormErrorMessage('kode_gedung')}
                            </div>
                        </div>

                        {/* Nama Lantai */}
                        <div className="flex flex-column gap-1 w-full mt-2">
                            <label htmlFor="name" className="font-semibold text-sm">
                                Nama Lantai <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="name"
                                name="name"
                                value={formik?.values.name || ''}
                                placeholder="Contoh: Lantai Dasar, Lantai 1"
                                onChange={(e) => formik?.setFieldValue('name', e.target.value)}
                                className={isFormFieldInvalid('name') ? 'p-invalid w-full' : 'w-full'}
                            />
                            {getFormErrorMessage('name')}
                        </div>

                        {/* Nomor Lantai */}
                        <div className="flex flex-column gap-1 w-full mt-2">
                            <label htmlFor="nomor_lantai" className="font-semibold text-sm">
                                Urutan Nomor Lantai
                            </label>
                            <InputNumber
                                id="nomor_lantai"
                                name="nomor_lantai"
                                value={formik?.values.nomor_lantai}
                                onValueChange={(e) => formik?.setFieldValue('nomor_lantai', e.value)}
                                className={isFormFieldInvalid('nomor_lantai') ? 'p-invalid w-full' : 'w-full'}
                                showButtons
                                min={-10}
                                max={200}
                            />
                            {getFormErrorMessage('nomor_lantai')}
                        </div>

                        {/* Status Aktif */}
                        <div className="flex align-items-center gap-2 mt-4">
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
                            {state.selectedDatas.length > 1 ? `Hapus ${state.selectedDatas.length} data Lantai?` : 'Hapus data Lantai ini?'}
                        </h3>
                        <p className="text-color-secondary">
                            {state.selectedDatas.length > 1 ? (
                                `Anda akan menghapus ${state.selectedDatas.length} item lantai.`
                            ) : (
                                <>
                                    Anda akan menghapus lantai: <br />
                                    <strong>
                                        {state.selectedDatas[0]?.kode_lantai || ''} - {state.selectedDatas[0]?.name || ''}
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
