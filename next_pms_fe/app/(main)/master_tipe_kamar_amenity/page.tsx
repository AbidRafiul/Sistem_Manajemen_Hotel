'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useSession } from 'next-auth/react';
import { State, AmenityItem } from './components/interfaces';
import { apiEndpointGet, apiEndpointAssign, apiEndpointParent, apiEndpointItem } from './components/endpoints';
import PickListAmenity from './components/display/PickListAmenity';
import { Dropdown } from 'primereact/dropdown';

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    const [state, setState] = useState<State>({
        load: false,
        dataParent: [],
        kode_tipe_kamar: '',
        sourceAmenity: [],
        targetAmenity: [],
        session: null
    });

    const [allAmenity, setAllAmenity] = useState<AmenityItem[]>([]);

    useEffect(() => {
        if (session) {
            setState((p) => ({ ...p, session }));
            getInitialData();
        }
    }, [session]);

    const getInitialData = async () => {
        try {
            const [resParent, resItem] = await Promise.all([
                postData(apiEndpointParent, { perPage: 1000 }), // Get all tipe kamar
                postData(apiEndpointItem, { perPage: 1000 })  // Get all amenity
            ]);

            const mappedParent = resParent.data?.data?.map((d: any) => ({
                kode: d.kode_tipe_kamar,
                nama: d.name || d.nama_tipe
            })) || [];

            const mappedItem = resItem.data?.data?.map((d: any) => ({
                kode_amenity: d.kode_amenity,
                nama_amenity: d.name || d.nama_amenity
            })) || [];

            setState((p) => ({ ...p, dataParent: mappedParent }));
            setAllAmenity(mappedItem);
        } catch (error) {
            console.error("Error fetching initial data", error);
            showError(toast, "Gagal mengambil data awal");
        }
    };

    const handleParentChange = async (kode_tipe_kamar: string) => {
        setState((p) => ({ ...p, kode_tipe_kamar, load: true }));
        try {
            const res = await postData(apiEndpointGet, { kode_tipe_kamar });
            const assignedData: AmenityItem[] = res.data?.data || [];
            
            // Map the assigned data back to the interface
            const assignedItem = assignedData.map(d => ({
                kode_amenity: d.kode_amenity,
                nama_amenity: d.nama_amenity
            }));
            
            // Filter out assigned amenity from all amenity to get source
            const assignedCodes = assignedItem.map(f => f.kode_amenity);
            const availableItem = allAmenity.filter(f => !assignedCodes.includes(f.kode_amenity));

            setState((p) => ({
                ...p,
                sourceAmenity: availableItem,
                targetAmenity: assignedItem
            }));
        } catch (error) {
            showError(toast, "Gagal mengambil data amenity untuk tipe kamar ini");
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    const handleSave = async () => {
        setState((p) => ({ ...p, load: true }));
        try {
            const kode_amenity = state.targetAmenity.map(f => f.kode_amenity);
            const oPayload = {
                kode_tipe_kamar: state.kode_tipe_kamar,
                kode_amenity
            };

            const res = await postData(apiEndpointAssign, oPayload);
            showSuccess(toast, res.data?.message || 'Berhasil menyimpan amenity tipe kamar');
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
                            <i className="pi pi-th-large text-blue-600 text-3xl"></i>Master Amenity Tipe Kamar
                        </h3>
                        <p className="text-gray-500">Kelola dan assign amenity ke masing-masing tipe kamar.</p>
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

                    <PickListAmenity 
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
