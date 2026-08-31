'use client';

import { Dialog } from 'primereact/dialog';
import { FormProps } from '../interfaces';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';
import { MultiSelect } from 'primereact/multiselect';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointUpdate, apiEndpointGet } from '../endpoints';
import { useEffect, useState } from 'react';

const Form = ({ getData, toast, state, setState, formik }: FormProps) => {
    const [fasilitasList, setFasilitasList] = useState([]);

    const fetchFasilitas = async (keyword = '') => {
        try {
            const res = await postData('/master/fasilitas/fasilitas-data', { perPage: 1000, keyword });
            setFasilitasList(res.data.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchFasilitas();
    }, []);

    useEffect(() => {
        const fetchAssigned = async () => {
            if (state.edit && formik.values.kode_ruang_event) {
                setState(p => ({ ...p, load: true }));
                try {
                    const resFas = await postData('/master/ruang-event-fasilitas/ruang-event-fasilitas-data', { kode_ruang_event: formik.values.kode_ruang_event });
                    const assignedFas = resFas.data.data.map((f: any) => f.kode_fasilitas);
                    formik.setFieldValue('kode_fasilitas', assignedFas);
                } catch(e) {
                    console.error("Gagal mengambil data fasilitas assigned", e);
                } finally {
                    setState(p => ({ ...p, load: false }));
                }
            } else if (state.add) {
                formik.setFieldValue('kode_fasilitas', []);
            }
        };
        if (state.add || state.edit) {
            fetchAssigned();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.add, state.edit]);

    const isFormFieldInvalid = (name: string) => !!(formik.touched[name as keyof typeof formik.touched] && formik.errors[name as keyof typeof formik.errors]);

    const getFormErrorMessage = (name: string) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name as keyof typeof formik.errors]}</small> : <small className="p-error">&nbsp;</small>;
    };

    const handleSave = async () => {
        if (!formik.isValid) {
            formik.submitForm();
            return;
        }

        setState((p) => ({ ...p, load: true }));
        try {
            const apiEndpoint = state.edit ? apiEndpointUpdate : apiEndpointCreate;
            const res = await postData(apiEndpoint, formik.values);
            const savedKode = state.edit ? formik.values.kode_ruang_event : res.data?.data?.kode_ruang_event;

            try {
                await postData('/master/ruang-event-fasilitas/ruang-event-fasilitas-assign', { 
                    kode_ruang_event: savedKode, 
                    kode_fasilitas: formik.values.kode_fasilitas || [] 
                });
            } catch (assignError) {
                console.error(assignError);
                showError(toast, 'Ruang Event tersimpan, namun gagal menyimpan assignment fasilitas');
            }

            showSuccess(toast, res.data?.message || 'Berhasil menyimpan data');
            setState((p) => ({ ...p, add: false, edit: false }));
            getData(apiEndpointGet);
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Gagal menyimpan data');
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    const handleDelete = async () => {
        setState((p) => ({ ...p, load: true }));
        try {
            const promises = state.selectedDatas.map((data) => postData(apiEndpointDelete, { kode_ruang_event: data.kode_ruang_event }));
            await Promise.all(promises);
            showSuccess(toast, 'Berhasil menghapus data');
            setState((p) => ({ ...p, delete: false, selectedDatas: [] }));
            getData(apiEndpointGet);
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Gagal menghapus data');
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    return (
        <>
            {/* Form Add / Edit */}
            <Dialog
                visible={state.add || state.edit}
                style={{ width: '450px' }}
                header={state.edit ? 'Edit Ruang Event' : 'Tambah Ruang Event'}
                modal
                className="p-fluid"
                onHide={() => setState((p) => ({ ...p, add: false, edit: false }))}
                footer={
                    <>
                        <Button label="Batal" icon="pi pi-times" outlined onClick={() => setState((p) => ({ ...p, add: false, edit: false }))} />
                        <Button label="Simpan" icon="pi pi-check" onClick={handleSave} loading={state.load} />
                    </>
                }
            >
                <div className="field">
                    <label htmlFor="kode_cabang">Cabang <span className="text-red-500">*</span></label>
                    <Dropdown
                        id="kode_cabang"
                        name="kode_cabang"
                        value={formik.values.kode_cabang}
                        options={state.dataCabang}
                        optionLabel="nama"
                        optionValue="kode"
                        placeholder="Pilih Cabang"
                        filter
                        onChange={(e) => {
                            formik.setFieldValue('kode_cabang', e.value);
                            formik.setFieldValue('kode_gedung', '');
                            formik.setFieldValue('kode_lantai', '');
                        }}
                        className={classNames({ 'p-invalid': isFormFieldInvalid('kode_cabang') })}
                    />
                    {getFormErrorMessage('kode_cabang')}
                </div>

                <div className="field">
                    <label htmlFor="kode_tipe_ruang_event">Tipe Ruang Event <span className="text-red-500">*</span></label>
                    <Dropdown
                        id="kode_tipe_ruang_event"
                        name="kode_tipe_ruang_event"
                        value={formik.values.kode_tipe_ruang_event}
                        options={state.dataTipe}
                        optionLabel="nama"
                        optionValue="kode"
                        placeholder="Pilih Tipe Ruang"
                        filter
                        onChange={(e) => formik.setFieldValue('kode_tipe_ruang_event', e.value)}
                        className={classNames({ 'p-invalid': isFormFieldInvalid('kode_tipe_ruang_event') })}
                    />
                    {getFormErrorMessage('kode_tipe_ruang_event')}
                </div>

                <div className="field">
                    <label htmlFor="nama_ruang">Nama Ruang Event <span className="text-red-500">*</span></label>
                    <InputText
                        id="nama_ruang"
                        name="nama_ruang"
                        value={formik.values.nama_ruang}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Contoh: Grand Ballroom"
                        className={classNames({ 'p-invalid': isFormFieldInvalid('nama_ruang') })}
                    />
                    {getFormErrorMessage('nama_ruang')}
                </div>

                <div className="formgrid grid">
                    <div className="field col">
                        <label htmlFor="kode_gedung">Gedung</label>
                        <Dropdown
                            id="kode_gedung"
                            name="kode_gedung"
                            value={formik.values.kode_gedung}
                            options={state.dataGedung.filter(g => !formik.values.kode_cabang || g.kode_cabang === formik.values.kode_cabang)}
                            optionLabel="nama"
                            optionValue="kode"
                            placeholder="Pilih Gedung"
                            filter
                            showClear
                            onChange={(e) => {
                                formik.setFieldValue('kode_gedung', e.value);
                                formik.setFieldValue('kode_lantai', '');
                            }}
                        />
                    </div>
                    <div className="field col">
                        <label htmlFor="kode_lantai">Lantai</label>
                        <Dropdown
                            id="kode_lantai"
                            name="kode_lantai"
                            value={formik.values.kode_lantai}
                            options={state.dataLantai.filter(l => (!formik.values.kode_cabang || l.kode_cabang === formik.values.kode_cabang) && (!formik.values.kode_gedung || l.kode_gedung === formik.values.kode_gedung))}
                            optionLabel="nama"
                            optionValue="kode"
                            placeholder="Pilih Lantai"
                            filter
                            showClear
                            onChange={(e) => formik.setFieldValue('kode_lantai', e.value)}
                        />
                    </div>
                </div>

                <div className="formgrid grid">
                    <div className="field col">
                        <label htmlFor="kapasitas_orang">Kapasitas (Orang)</label>
                        <InputNumber
                            id="kapasitas_orang"
                            name="kapasitas_orang"
                            value={formik.values.kapasitas_orang}
                            onValueChange={(e) => formik.setFieldValue('kapasitas_orang', e.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="field col">
                        <label htmlFor="luas_sqm">Luas Ruangan (m2)</label>
                        <InputNumber
                            id="luas_sqm"
                            name="luas_sqm"
                            value={formik.values.luas_sqm}
                            onValueChange={(e) => formik.setFieldValue('luas_sqm', e.value)}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="field">
                    <label htmlFor="layout_support">Layout Support</label>
                    <InputText
                        id="layout_support"
                        name="layout_support"
                        value={formik.values.layout_support}
                        onChange={formik.handleChange}
                        placeholder="Theater, U-Shape, Classroom"
                    />
                </div>

                <div className="field">
                    <label htmlFor="kode_fasilitas">Fasilitas Tersedia</label>
                    <MultiSelect
                        id="kode_fasilitas"
                        name="kode_fasilitas"
                        value={formik.values.kode_fasilitas}
                        options={fasilitasList}
                        onChange={formik.handleChange}
                        optionLabel="name"
                        optionValue="kode_fasilitas"
                        placeholder="Pilih Fasilitas"
                        display="chip"
                        filter
                        className="w-full"
                    />
                </div>

                <div className="field">
                    <label htmlFor="is_active">Status</label>
                    <Dropdown
                        id="is_active"
                        name="is_active"
                        value={formik.values.is_active}
                        options={[
                            { label: 'Aktif', value: 1 },
                            { label: 'Non-Aktif', value: 0 }
                        ]}
                        onChange={(e) => formik.setFieldValue('is_active', e.value)}
                    />
                </div>
            </Dialog>

            {/* Dialog Hapus */}
            <Dialog
                visible={state.delete}
                style={{ width: '450px' }}
                header="Konfirmasi"
                modal
                footer={
                    <>
                        <Button label="Batal" icon="pi pi-times" outlined onClick={() => setState((p) => ({ ...p, delete: false, selectedDatas: [] }))} />
                        <Button label="Hapus" icon="pi pi-check" severity="danger" onClick={handleDelete} loading={state.load} />
                    </>
                }
                onHide={() => setState((p) => ({ ...p, delete: false, selectedDatas: [] }))}
            >
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {state.selectedDatas.length > 0 && (
                        <span>
                            Apakah Anda yakin ingin menghapus <b>{state.selectedDatas.length === 1 ? state.selectedDatas[0].nama_ruang : `${state.selectedDatas.length} data ruang event`}</b>?
                        </span>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default Form;
