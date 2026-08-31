'use client';

import { Dialog } from 'primereact/dialog';
import { FormProps, initValue } from '../interfaces';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointGet, apiEndpointUpdate } from '../endpoints';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { getTzUser } from '@/lib/tools/dateTools';
import { InputSwitch } from 'primereact/inputswitch';

const Form = ({ state, setState, formik, toast, getData }: FormProps) => {
    const [cabangList, setCabangList] = useState([]);
    const [bedTypeList, setBedTypeList] = useState([]);
    const [fasilitasList, setFasilitasList] = useState([]);
    const [amenityList, setAmenityList] = useState([]);

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

    const fetchBedType = async (keyword = '') => {
        try {
            const res = await postData('/master/bed-type/bed-type-data', { perPage: 50, keyword });
            setBedTypeList(res.data.data);
        } catch (error) { console.error(error); }
    };

    const fetchFasilitas = async (keyword = '') => {
        try {
            const res = await postData('/master/fasilitas/fasilitas-data', { perPage: 1000, keyword });
            setFasilitasList(res.data.data);
        } catch (error) { console.error(error); }
    };

    const fetchAmenity = async (keyword = '') => {
        try {
            const res = await postData('/master/amenity/amenity-data', { perPage: 1000, keyword });
            setAmenityList(res.data.data);
        } catch (error) { console.error(error); }
    };

    const handleFilterCabang = (e: any) => {
        fetchCabang(e.filter);
    };

    const handleFilterBedType = (e: any) => {
        fetchBedType(e.filter);
    };

    useEffect(() => {
        fetchCabang();
        fetchBedType();
        fetchFasilitas();
        fetchAmenity();
    }, []);

    useEffect(() => {
        const fetchAssigned = async () => {
            if (state.edit && formik.values.kode_tipe_kamar) {
                setState(p => ({ ...p, load: true }));
                try {
                    const [resFas, resAm] = await Promise.all([
                        postData('/master/room-type-fasilitas/room-type-fasilitas-data', { kode_tipe_kamar: formik.values.kode_tipe_kamar }),
                        postData('/master/room-type-amenity/room-type-amenity-data', { kode_tipe_kamar: formik.values.kode_tipe_kamar })
                    ]);
                    const assignedFas = resFas.data.data.map((f: any) => f.kode_fasilitas);
                    const assignedAm = resAm.data.data.map((a: any) => a.kode_amenity);
                    formik.setFieldValue('kode_fasilitas', assignedFas);
                    formik.setFieldValue('kode_amenity', assignedAm);
                } catch(e) {
                    console.error("Gagal mengambil data fasilitas/amenity assigned", e);
                } finally {
                    setState(p => ({ ...p, load: false }));
                }
            } else if (state.add) {
                formik.setFieldValue('kode_fasilitas', []);
                formik.setFieldValue('kode_amenity', []);
            }
        };
        if (state.add || state.edit) {
            fetchAssigned();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.add, state.edit]);

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
                harga_default: input.harga_default,
                kode_bed_type: input.kode_bed_type || null,
                kapasitas_dasar: input.kapasitas_dasar,
                kapasitas_maksimal: input.kapasitas_maksimal,
                luas_m2: input.luas_m2,
                deskripsi: input.deskripsi,
                is_active: input.is_active,
                tz: getTzUser()
            };

            if (isEdit) {
                oBody['kode_tipe_kamar'] = input.kode_tipe_kamar;
            }

            const vaData = await postData(cEndPoint, oBody, oHeaders);
            const res = vaData.data;

            const savedKode = isEdit ? input.kode_tipe_kamar : res.data?.kode_tipe_kamar;

            try {
                await Promise.all([
                    postData('/master/room-type-fasilitas/room-type-fasilitas-assign', { kode_tipe_kamar: savedKode, kode_fasilitas: input.kode_fasilitas || [] }),
                    postData('/master/room-type-amenity/room-type-amenity-assign', { kode_tipe_kamar: savedKode, kode_amenity: input.kode_amenity || [] })
                ]);
            } catch (assignError) {
                console.error(assignError);
                showError(toast, 'Tipe Kamar tersimpan, namun gagal menyimpan assignment fasilitas/amenity');
            }

            showSuccess(toast, res.message || 'Berhasil Menyimpan Data Tipe Kamar');
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

            const vaCode = state.selectedDatas.map((v) => v.kode_tipe_kamar);

            const vaData = await postData(apiEndpointDelete, { kode_tipe_kamar: vaCode, tz: getTzUser() });
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil menghapus data Tipe Kamar.');
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


    return (
        <>
            <Dialog
                visible={state.add || state.edit}
                header={state.edit ? 'Edit Data Tipe Kamar' : 'Tambah Tipe Kamar Baru'}
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

                        {/* Nama Tipe Kamar & Luas */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="name" className="font-semibold text-sm">
                                    Nama Tipe Kamar <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="name"
                                    name="name"
                                    value={formik?.values.name || ''}
                                    placeholder="Contoh: Deluxe Room, Superior Room"
                                    onChange={(e) => formik?.setFieldValue('name', e.target.value)}
                                    className={isFormFieldInvalid('name') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('name')}
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
                                    placeholder="-- Pilih Tipe Bed (Opsional) --"
                                    filter
                                    onFilter={handleFilterBedType}
                                    resetFilterOnHide={true}
                                    showClear
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Harga Default & Luas */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="harga_default" className="font-semibold text-sm">
                                    Harga Default <span className="text-red-500">*</span>
                                </label>
                                <InputNumber
                                    id="harga_default"
                                    name="harga_default"
                                    value={formik?.values.harga_default}
                                    onValueChange={(e) => formik?.setFieldValue('harga_default', e.value)}
                                    className={isFormFieldInvalid('harga_default') ? 'p-invalid w-full' : 'w-full'}
                                    mode="currency"
                                    currency="IDR"
                                    locale="id-ID"
                                />
                                {getFormErrorMessage('harga_default')}
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="luas_m2" className="font-semibold text-sm">
                                    Luas (m²)
                                </label>
                                <InputNumber
                                    id="luas_m2"
                                    name="luas_m2"
                                    value={formik?.values.luas_m2}
                                    onValueChange={(e) => formik?.setFieldValue('luas_m2', e.value)}
                                    className="w-full"
                                    showButtons
                                    min={1}
                                    max={1000}
                                    suffix=" m²"
                                />
                            </div>
                        </div>

                        {/* Fasilitas & Amenity */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="kode_fasilitas" className="font-semibold text-sm">
                                    Fasilitas Tersedia
                                </label>
                                <MultiSelect
                                    id="kode_fasilitas"
                                    name="kode_fasilitas"
                                    value={formik?.values.kode_fasilitas}
                                    options={fasilitasList}
                                    onChange={formik?.handleChange}
                                    optionLabel="name"
                                    optionValue="kode_fasilitas"
                                    placeholder="Pilih Fasilitas"
                                    display="chip"
                                    filter
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="kode_amenity" className="font-semibold text-sm">
                                    Amenity Tersedia
                                </label>
                                <MultiSelect
                                    id="kode_amenity"
                                    name="kode_amenity"
                                    value={formik?.values.kode_amenity}
                                    options={amenityList}
                                    onChange={formik?.handleChange}
                                    optionLabel="name"
                                    optionValue="kode_amenity"
                                    placeholder="Pilih Amenity"
                                    display="chip"
                                    filter
                                    className="w-full"
                                />
                            </div>
                        </div>


                        {/* Kapasitas */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="kapasitas_dasar" className="font-semibold text-sm">
                                    Kapasitas Dasar (Orang) <span className="text-red-500">*</span>
                                </label>
                                <InputNumber
                                    id="kapasitas_dasar"
                                    name="kapasitas_dasar"
                                    value={formik?.values.kapasitas_dasar}
                                    onValueChange={(e) => formik?.setFieldValue('kapasitas_dasar', e.value)}
                                    className={isFormFieldInvalid('kapasitas_dasar') ? 'p-invalid w-full' : 'w-full'}
                                    showButtons
                                    min={1}
                                    max={20}
                                />
                                {getFormErrorMessage('kapasitas_dasar')}
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="kapasitas_maksimal" className="font-semibold text-sm">
                                    Kapasitas Maksimal (Orang) <span className="text-red-500">*</span>
                                </label>
                                <InputNumber
                                    id="kapasitas_maksimal"
                                    name="kapasitas_maksimal"
                                    value={formik?.values.kapasitas_maksimal}
                                    onValueChange={(e) => formik?.setFieldValue('kapasitas_maksimal', e.value)}
                                    className={isFormFieldInvalid('kapasitas_maksimal') ? 'p-invalid w-full' : 'w-full'}
                                    showButtons
                                    min={1}
                                    max={30}
                                />
                                {getFormErrorMessage('kapasitas_maksimal')}
                            </div>
                        </div>

                        {/* Deskripsi */}
                        <div className="flex flex-column gap-1 w-full mt-2">
                            <label htmlFor="deskripsi" className="font-semibold text-sm">
                                Deskripsi Kamar
                            </label>
                            <InputTextarea
                                id="deskripsi"
                                name="deskripsi"
                                value={formik?.values.deskripsi || ''}
                                placeholder="Jelaskan detail tipe kamar..."
                                onChange={(e) => formik?.setFieldValue('deskripsi', e.target.value)}
                                className="w-full"
                                rows={3}
                                autoResize
                            />
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
                            {state.selectedDatas.length > 1 ? `Hapus ${state.selectedDatas.length} data Tipe Kamar?` : 'Hapus data Tipe Kamar ini?'}
                        </h3>
                        <p className="text-color-secondary">
                            {state.selectedDatas.length > 1 ? (
                                `Anda akan menghapus ${state.selectedDatas.length} item tipe kamar.`
                            ) : (
                                <>
                                    Anda akan menghapus tipe kamar: <br />
                                    <strong>
                                        {state.selectedDatas[0]?.kode_tipe_kamar || ''} - {state.selectedDatas[0]?.name || ''}
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
