'use client';

import { PickList } from 'primereact/picklist';
import { Button } from 'primereact/button';
import { AmenityItem, State } from '../interfaces';
import { Dispatch, SetStateAction } from 'react';

interface PickListProps {
    state: State;
    setState: Dispatch<SetStateAction<State>>;
    handleSave: () => void;
}

const PickListAmenity = ({ state, setState, handleSave }: PickListProps) => {
    const itemTemplate = (item: AmenityItem) => {
        return (
            <div className="flex flex-wrap p-2 align-items-center gap-3">
                <div className="flex-1 flex flex-column gap-2">
                    <span className="font-bold">{item.nama_amenity}</span>
                    <span className="text-sm text-gray-500">{item.kode_amenity}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="card mt-4">
            <h5 className="mb-4">Assign Amenity</h5>
            {state.kode_tipe_kamar ? (
                <>
                    <PickList
                        source={state.sourceAmenity}
                        target={state.targetAmenity}
                        dataKey="kode_amenity"
                        onChange={(e) => {
                            setState((p) => ({
                                ...p,
                                sourceAmenity: e.source,
                                targetAmenity: e.target
                            }));
                        }}
                        itemTemplate={itemTemplate}
                        filter
                        filterBy="nama_amenity"
                        sourceHeader="Amenity Tersedia"
                        targetHeader="Amenity yang Dipilih"
                        sourceStyle={{ height: '300px' }}
                        targetStyle={{ height: '300px' }}
                        sourceFilterPlaceholder="Cari Amenity"
                        targetFilterPlaceholder="Cari Amenity"
                    />

                    <div className="flex justify-content-end mt-4">
                        <Button 
                            label="Simpan Konfigurasi Amenity" 
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
                        <p className="m-0">Silakan pilih Tipe Kamar terlebih dahulu untuk mengelola amenity.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PickListAmenity;
