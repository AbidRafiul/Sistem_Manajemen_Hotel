'use client';

import { Dialog } from 'primereact/dialog';
import { FormProps, initValue, OCCUPANCY_STATUS_OPTIONS, HOUSEKEEPING_STATUS_OPTIONS, VIEW_TYPE_OPTIONS } from '../interfaces';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointGet, apiEndpointUpdate } from '../endpoints';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useEffect, useState } from 'react';
import { getTzUser } from '@/lib/tools/dateTools';
import { InputSwitch } from 'primereact/inputswitch';

const Form = ({ state, setState, formik, toast, getData }: FormProps) => {
    const [cabangList, setCabangList] = useState([]);
    const [lantaiList, setLantaiList] = useState([]);
    const [tipeKamarList, setTipeKamarList] = useState([]);
    const [bedTypeList, setBedTypeList] = useState([]);

    const fetchCabang = async (keyword = '') => {
        try {
            const res = await postData('/master/cabang/cabang-data', { perPage: 50, keyword });
            setCabangList(res.data.data);
        } catch (error) { console.error(error); }
    };
    const fetchLantai = async (keyword = '') => {
        try {
            const res = await postData('/master/lantai/lantai-data', { perPage: 50, keyword });
            setLantaiList(res.data.data);
        } catch (error) { console.error(error); }
    };
    const fetchTipeKamar = async (keyword = '') => {
        try {
            const res = await postData('/master/tipe-kamar/tipe-kamar-data', { perPage: 50, keyword });
            setTipeKamarList(res.data.data);
        } catch (error) { console.error(error); }
    };
    const fetchBedType = async (keyword = '') => {
        try {
            const res = await postData('/master/bed-type/bed-type-data', { perPage: 50, keyword });
            setBedTypeList(res.data.data);
        } catch (error) { console.error(error); }
    };

    const handleFilterHotel = (e: any) => fetchCabang(e.filter);
    const handleFilterLantai = (e: any) => fetchLantai(e.filter);
    const handleFilterTipeKamar = (e: any) => fetchTipeKamar(e.filter);
    const handleFilterBedType = (e: any) => fetchBedType(e.filter);
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
                kode_lantai: input.kode_lantai,
                kode_tipe_kamar: input.kode_tipe_kamar,
                kode_bed_type: input.kode_bed_type || null,
                name: input.nomor_kamar,
                tipe_view: input.tipe_view,
                boleh_merokok: input.boleh_merokok,
                occupancy_status: input.occupancy_status,
                housekeeping_status: input.housekeeping_status,
                is_active: input.is_active,
                tz: getTzUser()
            };

            if (isEdit) {
                oBody['kode_kamar'] = input.kode_kamar;
            }

            const vaData = await postData(cEndPoint, oBody, oHeaders);
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil Menyimpan Data Kamar');
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

            const vaCode = state.selectedDatas.map((v) => v.kode_kamar);

            const vaData = await postData(apiEndpointDelete, { kode_kamar: vaCode, tz: getTzUser() });
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil menghapus data Kamar.');
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
        fetchLantai();
        fetchTipeKamar();
        fetchBedType();
    }, []);

    return (
        <>
            <Dialog
                visible={state.add || state.edit}
                header={state.edit ? 'Edit Data Kamar' : 'Tambah Kamar Baru'}
                modal
                style={{ width: '100%', maxWidth: '700px' }}
                breakpoints={{ '641px': '90vw' }}
                onHide={() => {
                    setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                    formik?.resetForm();
                }}
            >
                <form onSubmit={formik?.handleSubmit} className="flex gap-3 flex-column pt-2">
                    <div className="flex gap-2 flex-column w-full">
                        {/* Hotel & Lantai */}
                        <div className="flex flex-column md:flex-row gap-3 w-full">
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
                                    onFilter={handleFilterHotel}
                                    resetFilterOnHide={true}
                                    className={isFormFieldInvalid('kode_cabang') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('kode_cabang')}
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="kode_lantai" className="font-semibold text-sm">
                                    Lantai <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="kode_lantai"
                                    name="kode_lantai"
                                    value={formik?.values.kode_lantai}
                                    options={lantaiList}
                                    optionLabel="name"
                                    optionValue="kode_lantai"
                                    onChange={formik?.handleChange}
                                    placeholder="-- Pilih Lantai --"
                                    filter
                                    onFilter={handleFilterLantai}
                                    resetFilterOnHide={true}
                                    className={isFormFieldInvalid('kode_lantai') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('kode_lantai')}
                            </div>
                        </div>

                        {/* Tipe Kamar & Bed Type */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="kode_tipe_kamar" className="font-semibold text-sm">
                                    Tipe Kamar <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="kode_tipe_kamar"
                                    name="kode_tipe_kamar"
                                    value={formik?.values.kode_tipe_kamar}
                                    options={tipeKamarList}
                                    optionLabel="name"
                                    optionValue="kode_tipe_kamar"
                                    onChange={formik?.handleChange}
                                    placeholder="-- Pilih Tipe Kamar --"
                                    filter
                                    onFilter={handleFilterTipeKamar}
                                    resetFilterOnHide={true}
                                    className={isFormFieldInvalid('kode_tipe_kamar') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('kode_tipe_kamar')}
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="kode_bed_type" className="font-semibold text-sm">
                                    Tipe Bed
                                </label>
                                <Dropdown
                                    id="kode_bed_type"
                                    name="kode_bed_type"
                                    value={formik?.values.kode_bed_type}
                                    options={bedTypeList}
                                    optionLabel="name"
                                    optionValue="kode_bed_type"
                                    onChange={formik?.handleChange}
                                    placeholder="-- Pilih Tipe Bed --"
                                    filter
                                    onFilter={handleFilterBedType}
                                    resetFilterOnHide={true}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Nomor Kamar & View */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="nomor_kamar" className="font-semibold text-sm">
                                    Nomor Kamar <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="nomor_kamar"
                                    name="nomor_kamar"
                                    value={formik?.values.nomor_kamar || ''}
                                    placeholder="Contoh: 101, A205"
                                    onChange={(e) => formik?.setFieldValue('nomor_kamar', e.target.value)}
                                    className={isFormFieldInvalid('nomor_kamar') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('nomor_kamar')}
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="tipe_view" className="font-semibold text-sm">
                                    Tipe View
                                </label>
                                <Dropdown
                                    id="tipe_view"
                                    name="tipe_view"
                                    options={VIEW_TYPE_OPTIONS}
                                    value={formik?.values.tipe_view || 'City View'}
                                    onChange={(e) => formik?.setFieldValue('tipe_view', e.value)}
                                    placeholder="Pilih Tipe View"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Status Kamar */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="occupancy_status" className="font-semibold text-sm">
                                    Occupancy Status <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="occupancy_status"
                                    name="occupancy_status"
                                    options={OCCUPANCY_STATUS_OPTIONS}
                                    value={formik?.values.occupancy_status || 'vacant'}
                                    onChange={(e) => formik?.setFieldValue('occupancy_status', e.value)}
                                    placeholder="Pilih Status"
                                    className={isFormFieldInvalid('occupancy_status') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('occupancy_status')}
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="housekeeping_status" className="font-semibold text-sm">
                                    Housekeeping Status <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="housekeeping_status"
                                    name="housekeeping_status"
                                    options={HOUSEKEEPING_STATUS_OPTIONS}
                                    value={formik?.values.housekeeping_status || 'clean'}
                                    onChange={(e) => formik?.setFieldValue('housekeeping_status', e.value)}
                                    placeholder="Pilih Status"
                                    className={isFormFieldInvalid('housekeeping_status') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('housekeeping_status')}
                            </div>
                        </div>

                        {/* Switches */}
                        <div className="flex flex-column md:flex-row gap-4 mt-4">
                            <div className="flex align-items-center gap-2">
                                <InputSwitch
                                    id="boleh_merokok"
                                    name="boleh_merokok"
                                    checked={formik?.values.boleh_merokok === 1}
                                    onChange={(e) => formik?.setFieldValue('boleh_merokok', e.value ? 1 : 0)}
                                />
                                <label htmlFor="boleh_merokok" className="font-semibold text-sm cursor-pointer select-none">
                                    Boleh Merokok (Smoking Room)
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
                            {state.selectedDatas.length > 1 ? `Hapus ${state.selectedDatas.length} data Kamar?` : 'Hapus data Kamar ini?'}
                        </h3>
                        <p className="text-color-secondary">
                            {state.selectedDatas.length > 1 ? (
                                `Anda akan menghapus ${state.selectedDatas.length} item kamar.`
                            ) : (
                                <>
                                    Anda akan menghapus kamar: <br />
                                    <strong>
                                        {state.selectedDatas[0]?.kode_kamar || ''} - {state.selectedDatas[0]?.nomor_kamar || ''}
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
