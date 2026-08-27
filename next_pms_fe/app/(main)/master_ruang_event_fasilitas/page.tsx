'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useSession } from 'next-auth/react';
import { State, FasilitasItem } from './components/interfaces';
import { apiEndpointGet, apiEndpointAssign, apiEndpointRuangEvent, apiEndpointFasilitas } from './components/endpoints';
import PickListFasilitas from './components/display/PickListFasilitas';
import { Dropdown } from 'primereact/dropdown';

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    const [state, setState] = useState<State>({
        load: false,
        dataRuangEvent: [],
        kode_ruang_event: '',
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
            const [resRuang, resFasilitas] = await Promise.all([
                postData(apiEndpointRuangEvent, { perPage: 1000 }), // Get all ruang event
                postData(apiEndpointFasilitas, { perPage: 1000 })  // Get all fasilitas
            ]);

            const mappedRuang = resRuang.data?.data?.map((d: any) => ({
                kode: d.kode_ruang_event,
                nama: `${d.nama_ruang} (${d.nama_gedung || d.cabang_name || 'Tanpa Gedung'})`
            })) || [];

            const mappedFasilitas = resFasilitas.data?.data?.map((d: any) => ({
                kode_fasilitas: d.kode_fasilitas,
                nama_fasilitas: d.nama_fasilitas || d.name
            })) || [];

            setState((p) => ({ ...p, dataRuangEvent: mappedRuang }));
            setAllFasilitas(mappedFasilitas);
        } catch (error) {
            console.error("Error fetching initial data", error);
            showError(toast, "Gagal mengambil data awal");
        }
    };

    const handleRuangEventChange = async (kode_ruang_event: string) => {
        setState((p) => ({ ...p, kode_ruang_event, load: true }));
        try {
            const res = await postData(apiEndpointGet, { kode_ruang_event });
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
            showError(toast, "Gagal mengambil data fasilitas untuk ruang event ini");
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    const handleSave = async () => {
        setState((p) => ({ ...p, load: true }));
        try {
            const kode_fasilitas = state.targetFasilitas.map(f => f.kode_fasilitas);
            const oPayload = {
                kode_ruang_event: state.kode_ruang_event,
                kode_fasilitas
            };

            const res = await postData(apiEndpointAssign, oPayload);
            showSuccess(toast, res.data?.message || 'Berhasil menyimpan fasilitas ruang event');
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
                            <i className="pi pi-th-large text-blue-600 text-3xl"></i>Master Fasilitas Ruang Event
                        </h3>
                        <p className="text-gray-500">Kelola dan assign fasilitas (kursi, sound system, proyektor) ke masing-masing ruang event.</p>
                    </div>

                    <div className="field">
                        <label className="font-bold block mb-2">Pilih Ruang Event</label>
                        <Dropdown
                            value={state.kode_ruang_event}
                            options={state.dataRuangEvent}
                            onChange={(e) => handleRuangEventChange(e.value)}
                            optionLabel="nama"
                            optionValue="kode"
                            placeholder="Cari dan Pilih Ruang Event..."
                            filter
                            className="w-full md:w-30rem"
                            disabled={state.load && state.dataRuangEvent.length === 0}
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
