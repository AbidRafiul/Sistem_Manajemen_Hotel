'use client';

import { PickList } from 'primereact/picklist';
import { Button } from 'primereact/button';
import { FasilitasItem, State } from '../interfaces';
import { Dispatch, SetStateAction } from 'react';

interface PickListProps {
    state: State;
    setState: Dispatch<SetStateAction<State>>;
    handleSave: () => void;
}

const PickListFasilitas = ({ state, setState, handleSave }: PickListProps) => {
    const itemTemplate = (item: FasilitasItem) => {
        return (
            <div className="flex flex-wrap p-2 align-items-center gap-3">
                <div className="flex-1 flex flex-column gap-2">
                    <span className="font-bold">{item.nama_fasilitas}</span>
                    <span className="text-sm text-gray-500">{item.kode_fasilitas}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="card mt-4">
            <h5 className="mb-4">Assign Fasilitas</h5>
            {state.kode_ruang_event ? (
                <>
                    <PickList
                        source={state.sourceFasilitas}
                        target={state.targetFasilitas}
                        dataKey="kode_fasilitas"
                        onChange={(e) => {
                            setState((p) => ({
                                ...p,
                                sourceFasilitas: e.source,
                                targetFasilitas: e.target
                            }));
                        }}
                        itemTemplate={itemTemplate}
                        filter
                        filterBy="nama_fasilitas"
                        sourceHeader="Fasilitas Tersedia"
                        targetHeader="Fasilitas yang Dipilih"
                        sourceStyle={{ height: '300px' }}
                        targetStyle={{ height: '300px' }}
                        sourceFilterPlaceholder="Cari Fasilitas"
                        targetFilterPlaceholder="Cari Fasilitas"
                    />

                    <div className="flex justify-content-end mt-4">
                        <Button 
                            label="Simpan Konfigurasi Fasilitas" 
                            icon="pi pi-save" 
                            onClick={handleSave} 
                            loading={state.load} 
                        />
                    </div>
                </>
            ) : (
                <div className="flex align-items-center justify-content-center p-5 text-gray-500 bg-gray-50 border-round">
                    <div className="text-center">
                        <i className="pi pi-info-circle text-4xl mb-3"></i>
                        <p className="m-0">Silakan pilih Ruang Event terlebih dahulu untuk mengelola fasilitasnya.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PickListFasilitas;
