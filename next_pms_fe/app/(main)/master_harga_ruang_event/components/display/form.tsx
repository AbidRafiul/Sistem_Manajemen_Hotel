'use client';

import { Dialog } from 'primereact/dialog';
import { FormProps } from '../interfaces';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointUpdate, apiEndpointGet } from '../endpoints';

const Form = ({ getData, toast, state, setState, formik }: FormProps) => {
    const isFormFieldInvalid = (name: string) => !!((formik.touched as any)[name] && (formik.errors as any)[name]);

    const getFormErrorMessage = (name: string) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{(formik.errors as any)[name]}</small> : <small className="p-error">&nbsp;</small>;
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
            const promises = state.selectedDatas.map((data) => postData(apiEndpointDelete, { kode_harga_ruang_event: data.kode_harga_ruang_event }));
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
                header={state.edit ? 'Edit Harga Ruang Event' : 'Tambah Harga Ruang Event'}
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
                    <label htmlFor="kode_ruang_event">Ruang Event <span className="text-red-500">*</span></label>
                    <Dropdown
                        id="kode_ruang_event"
                        name="kode_ruang_event"
                        value={formik.values.kode_ruang_event}
                        options={state.dataRuangEvent}
                        optionLabel="nama"
                        optionValue="kode"
                        placeholder="Pilih Ruang Event"
                        filter
                        onChange={(e) => formik.setFieldValue('kode_ruang_event', e.value)}
                        className={classNames({ 'p-invalid': isFormFieldInvalid('kode_ruang_event') })}
                    />
                    {getFormErrorMessage('kode_ruang_event')}
                </div>

                <div className="field">
                    <label htmlFor="tipe_sewa">Tipe Sewa <span className="text-red-500">*</span></label>
                    <Dropdown
                        id="tipe_sewa"
                        name="tipe_sewa"
                        value={formik.values.tipe_sewa}
                        options={[
                            { label: 'Full Day', value: 'full_day' },
                            { label: 'Half Day', value: 'half_day' },
                            { label: 'Per Jam', value: 'per_jam' }
                        ]}
                        onChange={(e) => formik.setFieldValue('tipe_sewa', e.value)}
                        className={classNames({ 'p-invalid': isFormFieldInvalid('tipe_sewa') })}
                    />
                    {getFormErrorMessage('tipe_sewa')}
                </div>

                <div className="field">
                    <label htmlFor="kode_musim">Season / Musim (Opsional)</label>
                    <Dropdown
                        id="kode_musim"
                        name="kode_musim"
                        value={formik.values.kode_musim}
                        options={state.dataMusim}
                        optionLabel="nama"
                        optionValue="kode"
                        placeholder="Pilih Musim"
                        filter
                        showClear
                        onChange={(e) => formik.setFieldValue('kode_musim', e.value)}
                    />
                    <small className="text-gray-500 mt-1 block">Biarkan kosong jika ini harga reguler.</small>
                </div>

                <div className="field">
                    <label htmlFor="harga">Harga Sewa (IDR) <span className="text-red-500">*</span></label>
                    <InputNumber
                        id="harga"
                        name="harga"
                        value={formik.values.harga}
                        onValueChange={(e) => formik.setFieldValue('harga', e.value)}
                        placeholder="0"
                        mode="currency"
                        currency="IDR"
                        locale="id-ID"
                        className={classNames({ 'p-invalid': isFormFieldInvalid('harga') })}
                    />
                    {getFormErrorMessage('harga')}
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
                            Apakah Anda yakin ingin menghapus harga untuk <b>{state.selectedDatas.length === 1 ? state.selectedDatas[0].ruang_name : `${state.selectedDatas.length} data ruang event`}</b>?
                        </span>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default Form;
