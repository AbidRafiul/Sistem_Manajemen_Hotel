'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useSession } from 'next-auth/react';
import { State, FasilitasItem } from './components/interfaces';
import { apiEndpointGet, apiEndpointAssign, apiEndpointParent, apiEndpointFasilitas } from './components/endpoints';
import PickListFasilitas from './components/display/PickListFasilitas';
import { Dropdown } from 'primereact/dropdown';

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    const [state, setState] = useState<State>({
        load: false,
        dataParent: [],
        kode_tipe_kamar: '',
        sourceFasilitas: [],
        targetFasilitas: [],
        session: null
    });

    const [allFasilitas, setAllFasilitas] = useState<FasilitasItem[]>([]);

    useEffect(() => {
        if (session) {
            setState((p) => ({ ...p, session }));
            getInitialData();
        }
    }, [session]);

    const getInitialData = async () => {
        try {
            const [resParent, resFasilitas] = await Promise.all([
                postData(apiEndpointParent, { perPage: 1000 }), // Get all tipe kamar
                postData(apiEndpointFasilitas, { perPage: 1000 })  // Get all fasilitas
            ]);

            const mappedParent = resParent.data?.data?.map((d: any) => ({
                kode: d.kode_tipe_kamar,
                nama: d.name || d.nama_tipe
            })) || [];

            const mappedFasilitas = resFasilitas.data?.data?.map((d: any) => ({
                kode_fasilitas: d.kode_fasilitas,
                nama_fasilitas: d.nama_fasilitas || d.name
            })) || [];

            setState((p) => ({ ...p, dataParent: mappedParent }));
            setAllFasilitas(mappedFasilitas);
        } catch (error) {
            console.error("Error fetching initial data", error);
            showError(toast, "Gagal mengambil data awal");
        }
    };

    const handleParentChange = async (kode_tipe_kamar: string) => {
        setState((p) => ({ ...p, kode_tipe_kamar, load: true }));
        try {
            const res = await postData(apiEndpointGet, { kode_tipe_kamar });
            const assignedData: FasilitasItem[] = res.data?.data || [];
            
            // Map the assigned data back to the interface
            const assignedFasilitas = assignedData.map(d => ({
                kode_fasilitas: d.kode_fasilitas,
                nama_fasilitas: d.nama_fasilitas
            }));
            
            // Filter out assigned fasilitas from all fasilitas to get source
            const assignedCodes = assignedFasilitas.map(f => f.kode_fasilitas);
            const availableFasilitas = allFasilitas.filter(f => !assignedCodes.includes(f.kode_fasilitas));

            setState((p) => ({
                ...p,
                sourceFasilitas: availableFasilitas,
                targetFasilitas: assignedFasilitas
            }));
        } catch (error) {
            showError(toast, "Gagal mengambil data fasilitas untuk tipe kamar ini");
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    const handleSave = async () => {
        setState((p) => ({ ...p, load: true }));
        try {
            const kode_fasilitas = state.targetFasilitas.map(f => f.kode_fasilitas);
            const oPayload = {
                kode_tipe_kamar: state.kode_tipe_kamar,
                kode_fasilitas
            };

            const res = await postData(apiEndpointAssign, oPayload);
            showSuccess(toast, res.data?.message || 'Berhasil menyimpan fasilitas tipe kamar');
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Gagal menyimpan data');
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="card">
                    <div className="flex flex-column mb-5">
                        <h3 className="text-2xl font-semibold flex align-items-center gap-2">
                            <i className="pi pi-th-large text-blue-600 text-3xl"></i>Master Fasilitas Tipe Kamar
                        </h3>
                        <p className="text-gray-500">Kelola dan assign fasilitas ke masing-masing tipe kamar.</p>
                    </div>

                    <div className="field">
                        <label className="font-bold block mb-2">Pilih Tipe Kamar</label>
                        <Dropdown
                            value={state.kode_tipe_kamar}
                            options={state.dataParent}
                            onChange={(e) => handleParentChange(e.value)}
                            optionLabel="nama"
                            optionValue="kode"
                            placeholder="Cari dan Pilih Tipe Kamar..."
                            filter
                            className="w-full md:w-30rem"
                            disabled={state.load && state.dataParent.length === 0}
                        />
                    </div>

                    <PickListFasilitas 
                        state={state} 
                        setState={setState} 
                        handleSave={handleSave} 
                    />
                </div>
            </div>
        </div>
    );
};

export default Page;
