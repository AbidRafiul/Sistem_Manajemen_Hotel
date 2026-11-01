'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Image } from 'primereact/image';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import postData from '@/lib/axios/postData';
import { formatDateSystem } from '@/lib/tools/dateTools';
import StatusIndicator from '@/app/components/status/StatusIndicator';
import {
    apiEndpointFotoData,
    apiEndpointFasilitasByTipe,
    apiEndpointAmenityByTipe,
    apiEndpointKamarByTipe
} from '../endpoints';
import { DetailProps } from '../interfaces';

export default function Detail({ state, setState, formik }: DetailProps) {
    const roomType = state.selectedDetail;

    const [fasilitas, setFasilitas] = useState<any[]>([]);
    const [amenities, setAmenities] = useState<any[]>([]);
    const [photos, setPhotos] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);

    const [loadingFacilities, setLoadingFacilities] = useState<boolean>(false);
    const [loadingPhotos, setLoadingPhotos] = useState<boolean>(false);
    const [loadingRooms, setLoadingRooms] = useState<boolean>(false);

    useEffect(() => {
        if (state.detail && roomType?.kode_tipe_kamar) {
            fetchFasilitasAndAmenity(roomType.kode_tipe_kamar);
            fetchPhotos(roomType.kode_tipe_kamar);
            fetchRooms(roomType.kode_tipe_kamar, roomType.kode_cabang);
        } else {
            setFasilitas([]);
            setAmenities([]);
            setPhotos([]);
            setRooms([]);
        }
    }, [state.detail, roomType?.kode_tipe_kamar]);

    const fetchFasilitasAndAmenity = async (kode_tipe_kamar: string) => {
        setLoadingFacilities(true);
        try {
            const [resFas, resAm] = await Promise.all([
                postData(apiEndpointFasilitasByTipe, { kode_tipe_kamar }),
                postData(apiEndpointAmenityByTipe, { kode_tipe_kamar })
            ]);
            setFasilitas(resFas?.data?.data || []);
            setAmenities(resAm?.data?.data || []);
        } catch (err) {
            console.error('Gagal mengambil fasilitas & amenity:', err);
            setFasilitas([]);
            setAmenities([]);
        } finally {
            setLoadingFacilities(false);
        }
    };

    const fetchPhotos = async (kode_tipe_kamar: string) => {
        setLoadingPhotos(true);
        try {
            const res = await postData(apiEndpointFotoData, { kode_tipe_kamar });
            setPhotos(res?.data?.data || []);
        } catch (err) {
            console.error('Gagal mengambil galeri foto:', err);
            setPhotos([]);
        } finally {
            setLoadingPhotos(false);
        }
    };

    const fetchRooms = async (kode_tipe_kamar: string, kode_cabang?: string) => {
        setLoadingRooms(true);
        try {
            const res = await postData(apiEndpointKamarByTipe, {
                kode_tipe_kamar,
                kode_cabang: kode_cabang || undefined,
                perPage: 100
            });
            setRooms(res?.data?.data || []);
        } catch (err) {
            console.error('Gagal mengambil data kamar terkait:', err);
            setRooms([]);
        } finally {
            setLoadingRooms(false);
        }
    };

    if (!roomType) return null;

    const formatCurrency = (val: number | null | undefined) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(val || 0));
    };

    const handleOpenEdit = () => {
        if (formik) {
            formik.setValues({
                kode_tipe_kamar: roomType.kode_tipe_kamar || '',
                kode_cabang: roomType.kode_cabang || '',
                name: roomType.name || '',
                harga_default: roomType.harga_default || 0,
                kode_bed_type: roomType.kode_bed_type || null,
                kapasitas_dasar: roomType.kapasitas_dasar || 1,
                kapasitas_maksimal: roomType.kapasitas_maksimal || 2,
                luas_m2: roomType.luas_m2 || null,
                deskripsi: roomType.deskripsi || '',
                is_active: roomType.is_active !== undefined ? roomType.is_active : 1
            });
        }
        setState((p) => ({
            ...p,
            detail: false,
            selectedDetail: null,
            add: false,
            delete: false,
            edit: true
        }));
    };

    const dialogHeader = (
        <div className="flex align-items-center justify-content-between w-full pr-3">
            <div className="flex align-items-center gap-2">
                <i className="pi pi-th-large text-blue-600 text-xl" />
                <div>
                    <div className="text-lg font-bold text-900">
                        Detail Tipe Kamar: {roomType.name}
                    </div>
                    <div className="text-xs text-500">
                        Kode: <strong className="text-700">{roomType.kode_tipe_kamar}</strong> &bull; Cabang: {roomType.cabang_name || roomType.kode_cabang || '-'}
                    </div>
                </div>
            </div>
            <div>
                <Tag
                    value={roomType.is_active === 1 ? 'Aktif' : 'Non-Aktif'}
                    severity={roomType.is_active === 1 ? 'success' : 'danger'}
                    rounded
                />
            </div>
        </div>
    );

    const dialogFooter = (
        <div className="flex justify-content-between align-items-center w-full">
            <div className="text-xs text-500">
                Tipe Kamar: <strong className="text-700">{roomType.name}</strong> ({roomType.kode_tipe_kamar})
            </div>
            <div className="flex gap-2">
                {formik && (
                    <Button
                        label="Edit Tipe Kamar"
                        icon="pi pi-pencil"
                        outlined
                        className="p-button-sm"
                        onClick={handleOpenEdit}
                    />
                )}
                <Button
                    label="Tutup"
                    icon="pi pi-times"
                    className="p-button-sm"
                    severity="secondary"
                    onClick={() => setState((p) => ({ ...p, detail: false, selectedDetail: null }))}
                />
            </div>
        </div>
    );

    return (
        <Dialog
            visible={state.detail}
            header={dialogHeader}
            style={{ width: '85vw', maxWidth: '980px' }}
            modal
            onHide={() => setState((p) => ({ ...p, detail: false, selectedDetail: null }))}
            footer={dialogFooter}
        >
            {/* Top Hero Banner */}
            <div className="flex flex-wrap align-items-center justify-content-between p-3 bg-blue-50 border-round mb-3 gap-3 border-1 border-blue-100">
                <div className="flex align-items-center gap-3">
                    <div className="w-3rem h-3rem md:w-4rem md:h-4rem border-circle bg-blue-600 text-white flex align-items-center justify-content-center text-xl md:text-2xl font-bold shadow-1 flex-shrink-0">
                        <i className="pi pi-building text-xl md:text-2xl" />
                    </div>
                    <div>
                        <h4 className="m-0 text-xl font-bold text-900 flex align-items-center gap-2 flex-wrap">
                            {roomType.name}
                            <Tag value={roomType.kode_tipe_kamar} severity="info" />
                        </h4>
                        <p className="m-0 mt-1 text-gray-600 text-sm">
                            Cabang: <strong>{roomType.cabang_name || roomType.kode_cabang || '-'}</strong> &bull; Tipe Bed: <strong>{roomType.bed_type_name || '-'}</strong>
                        </p>
                    </div>
                </div>
                <div className="text-right ml-auto">
                    <span className="text-xs text-gray-500 uppercase font-semibold block">Harga Default</span>
                    <span className="text-2xl font-bold text-teal-600">
                        {formatCurrency(roomType.harga_default)}
                    </span>
                    <span className="text-xs text-gray-500 block">/ malam</span>
                </div>
            </div>

            {/* Quick Stat Summary Cards */}
            <div className="grid mb-3">
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Harga Default</span>
                            <i className="pi pi-tag text-teal-600 bg-teal-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-teal-700">{formatCurrency(roomType.harga_default)}</div>
                            <div className="text-xs text-500 mt-1">Tarif dasar per malam</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Tipe Bed</span>
                            <i className="pi pi-inbox text-blue-600 bg-blue-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-900">{roomType.bed_type_name || '-'}</div>
                            <div className="text-xs text-500 mt-1">Konfigurasi tempat tidur</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Kapasitas Tamu</span>
                            <i className="pi pi-users text-orange-600 bg-orange-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-900">
                                {roomType.kapasitas_dasar} s/d {roomType.kapasitas_maksimal} Orang
                            </div>
                            <div className="text-xs text-500 mt-1">
                                Dasar: {roomType.kapasitas_dasar} &bull; Maks: {roomType.kapasitas_maksimal}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full flex flex-column justify-content-between shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-500 text-xs uppercase font-semibold">Luas Kamar</span>
                            <i className="pi pi-arrows-alt text-purple-600 bg-purple-50 p-2 border-circle" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-900">
                                {roomType.luas_m2 ? `${roomType.luas_m2} m²` : '-'}
                            </div>
                            <div className="text-xs text-500 mt-1">Dimensi luas ruangan</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabbed Content */}
            <TabView>
                {/* Tab 1: Informasi Spesifikasi & Deskripsi */}
                <TabPanel header="Spesifikasi & Informasi" leftIcon="pi pi-info-circle mr-2">
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="surface-card p-3 border-round border-1 surface-border h-full shadow-1">
                                <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                                    <i className="pi pi-sliders-h text-blue-600" /> Spesifikasi & Konfigurasi
                                </h5>
                                <div className="flex flex-column gap-2 text-sm">
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Kode Tipe Kamar</span>
                                        <span className="font-bold text-900">{roomType.kode_tipe_kamar}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Nama Tipe</span>
                                        <span className="font-semibold text-900">{roomType.name}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Cabang Hotel</span>
                                        <span className="font-medium text-900">{roomType.cabang_name || roomType.kode_cabang || '-'}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Tipe Tempat Tidur (Bed)</span>
                                        <span className="font-medium text-900">{roomType.bed_type_name || '-'}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Kapasitas Dasar</span>
                                        <span className="font-medium text-900">{roomType.kapasitas_dasar} Tamu</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Kapasitas Maksimal</span>
                                        <span className="font-medium text-900">{roomType.kapasitas_maksimal} Tamu</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 surface-100">
                                        <span className="text-500">Luas Ruangan</span>
                                        <span className="font-medium text-900">{roomType.luas_m2 ? `${roomType.luas_m2} m²` : '-'}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2">
                                        <span className="text-500">Status Operasional</span>
                                        <span>
                                            <Tag
                                                value={roomType.is_active === 1 ? 'Aktif' : 'Non-Aktif'}
                                                severity={roomType.is_active === 1 ? 'success' : 'danger'}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-6">
                            <div className="flex flex-column gap-3 h-full">
                                <div className="surface-card p-3 border-round border-1 surface-border shadow-1 flex-1">
                                    <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                                        <i className="pi pi-align-left text-teal-600" /> Deskripsi & Tarif
                                    </h5>
                                    <div className="mb-3">
                                        <span className="text-xs text-500 uppercase font-semibold block mb-1">Tarif Standar / Default</span>
                                        <div className="text-2xl font-bold text-teal-700">
                                            {formatCurrency(roomType.harga_default)}
                                            <span className="text-xs text-500 font-normal"> / malam</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-500 uppercase font-semibold block mb-1">Deskripsi Ruangan</span>
                                        <div
                                            className="p-3 surface-50 border-round border-1 surface-border text-700 text-sm line-height-3 white-space-pre-line"
                                            style={{ minHeight: '80px' }}
                                        >
                                            {roomType.deskripsi || 'Tidak ada deskripsi yang dicantumkan untuk tipe kamar ini.'}
                                        </div>
                                    </div>
                                </div>

                                <div className="surface-card p-3 border-round border-1 surface-border shadow-1">
                                    <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center gap-2">
                                        <i className="pi pi-clock text-orange-600" /> Informasi Waktu & Riwayat
                                    </h5>
                                    <div className="flex flex-column gap-2 text-sm">
                                        <div className="flex justify-content-between py-1 border-bottom-1 surface-100">
                                            <span className="text-500">Waktu Dibuat</span>
                                            <span className="font-medium text-700">
                                                {roomType.created_at ? formatDateSystem(roomType.created_at) : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-content-between py-1">
                                            <span className="text-500">Terakhir Diperbarui</span>
                                            <span className="font-medium text-700">
                                                {roomType.updated_at ? formatDateSystem(roomType.updated_at) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                {/* Tab 2: Fasilitas & Amenity */}
                <TabPanel
                    header={`Fasilitas & Amenity (${fasilitas.length + amenities.length})`}
                    leftIcon="pi pi-star mr-2"
                >
                    {loadingFacilities ? (
                        <div className="flex justify-content-center align-items-center py-5">
                            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                        </div>
                    ) : (
                        <div className="flex flex-column gap-4">
                            {/* Fasilitas Kamar */}
                            <div className="surface-card p-3 border-round border-1 surface-border shadow-1">
                                <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center justify-content-between">
                                    <span className="flex align-items-center gap-2">
                                        <i className="pi pi-check-circle text-teal-600" /> Fasilitas Kamar
                                    </span>
                                    <Tag value={`${fasilitas.length} Fasilitas`} severity="info" rounded />
                                </h5>

                                {fasilitas.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {fasilitas.map((f, idx) => (
                                            <div
                                                key={idx}
                                                className="flex align-items-center gap-2 px-3 py-2 bg-teal-50 border-round border-1 border-teal-200 text-teal-900 font-medium text-sm shadow-sm"
                                            >
                                                <i className="pi pi-check text-teal-600 text-sm" />
                                                <span>{f.nama_fasilitas}</span>
                                                {f.kode_fasilitas && (
                                                    <span className="text-xs text-teal-700 bg-teal-100 px-1 border-round font-semibold">
                                                        {f.kode_fasilitas}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-500 text-sm p-4 border-round border-dashed border-1 surface-border text-center">
                                        <i className="pi pi-info-circle text-400 mr-2" />
                                        Belum ada fasilitas khusus yang ditautkan ke tipe kamar ini.
                                    </div>
                                )}
                            </div>

                            {/* Amenity Kamar */}
                            <div className="surface-card p-3 border-round border-1 surface-border shadow-1">
                                <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-3 text-900 flex align-items-center justify-content-between">
                                    <span className="flex align-items-center gap-2">
                                        <i className="pi pi-gift text-indigo-600" /> Amenity Kamar
                                    </span>
                                    <Tag value={`${amenities.length} Amenity`} severity="warning" rounded />
                                </h5>

                                {amenities.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {amenities.map((a, idx) => (
                                            <div
                                                key={idx}
                                                className="flex align-items-center gap-2 px-3 py-2 bg-indigo-50 border-round border-1 border-indigo-200 text-indigo-900 font-medium text-sm shadow-sm"
                                            >
                                                <i className="pi pi-sparkles text-indigo-600 text-sm" />
                                                <span>{a.nama_amenity}</span>
                                                {a.kode_amenity && (
                                                    <span className="text-xs text-indigo-700 bg-indigo-100 px-1 border-round font-semibold">
                                                        {a.kode_amenity}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-500 text-sm p-4 border-round border-dashed border-1 surface-border text-center">
                                        <i className="pi pi-info-circle text-400 mr-2" />
                                        Belum ada amenity khusus yang ditautkan ke tipe kamar ini.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </TabPanel>

                {/* Tab 3: Galeri Foto */}
                <TabPanel header={`Galeri Foto (${photos.length})`} leftIcon="pi pi-images mr-2">
                    {loadingPhotos ? (
                        <div className="flex justify-content-center align-items-center py-5">
                            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                        </div>
                    ) : photos.length > 0 ? (
                        <div className="grid">
                            {photos.map((photo, idx) => (
                                <div key={idx} className="col-12 sm:col-6 md:col-4 lg:col-3">
                                    <div className="surface-card border-1 surface-border border-round overflow-hidden shadow-1 flex flex-column h-full">
                                        <div
                                            className="relative flex align-items-center justify-content-center overflow-hidden"
                                            style={{ height: '150px', backgroundColor: '#f8fafc' }}
                                        >
                                            <Image
                                                src={photo.foto_url}
                                                alt={`Foto ${roomType.name} #${idx + 1}`}
                                                width="100%"
                                                preview
                                                imageStyle={{ height: '150px', objectFit: 'cover', width: '100%' }}
                                            />
                                            {photo.is_cover === 1 && (
                                                <div className="absolute top-0 right-0 m-2">
                                                    <Tag value="Foto Utama" severity="success" icon="pi pi-star-fill" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 text-xs text-500 flex justify-content-between align-items-center surface-50">
                                            <span>Foto #{photo.urutan || idx + 1}</span>
                                            {photo.created_at && <span>{formatDateSystem(photo.created_at)}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-5 border-round border-dashed border-2 surface-border">
                            <i className="pi pi-images text-400 text-5xl mb-2" />
                            <div className="font-semibold text-700 text-base">Belum Ada Foto</div>
                            <div className="text-500 text-sm mt-1">
                                Belum ada foto tipe kamar yang diunggah. Anda dapat mengunggahnya pada formulir Edit Tipe Kamar.
                            </div>
                        </div>
                    )}
                </TabPanel>

                {/* Tab 4: Unit Kamar Terdaftar */}
                <TabPanel header={`Daftar Kamar (${rooms.length})`} leftIcon="pi pi-key mr-2">
                    {loadingRooms ? (
                        <div className="flex justify-content-center align-items-center py-5">
                            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                        </div>
                    ) : (
                        <div>
                            <DataTable
                                value={rooms}
                                emptyMessage="Belum ada unit kamar yang terdaftar untuk tipe kamar ini"
                                paginator={rooms.length > 5}
                                rows={5}
                                size="small"
                                className="p-datatable-sm"
                            >
                                <Column
                                    field="nomor_kamar"
                                    header="No. Kamar"
                                    body={(r) => (
                                        <span className="font-bold text-blue-600">
                                            <i className="pi pi-key mr-2" />
                                            {r.nomor_kamar}
                                        </span>
                                    )}
                                    sortable
                                />
                                <Column
                                    field="floor_name"
                                    header="Lantai"
                                    body={(r) => r.floor_name || '-'}
                                    sortable
                                />
                                <Column
                                    field="tipe_view"
                                    header="Pemandangan"
                                    body={(r) => r.tipe_view || '-'}
                                />
                                <Column
                                    field="boleh_merokok"
                                    header="Area Merokok"
                                    body={(r) => (
                                        <Tag
                                            value={r.boleh_merokok === 1 ? 'Smoking' : 'Non-Smoking'}
                                            severity={r.boleh_merokok === 1 ? 'warning' : 'success'}
                                        />
                                    )}
                                    align="center"
                                />
                                <Column
                                    field="occupancy_status"
                                    header="Occupancy"
                                    body={(r) => (
                                        <Tag
                                            value={r.occupancy_status?.toUpperCase() || '-'}
                                            severity={r.occupancy_status === 'vacant' ? 'success' : 'danger'}
                                        />
                                    )}
                                    align="center"
                                />
                                <Column
                                    field="housekeeping_status"
                                    header="Housekeeping"
                                    body={(r) => (
                                        <Tag
                                            value={r.housekeeping_status?.toUpperCase() || '-'}
                                            severity={
                                                r.housekeeping_status === 'clean'
                                                    ? 'success'
                                                    : r.housekeeping_status === 'dirty'
                                                    ? 'warning'
                                                    : 'info'
                                            }
                                        />
                                    )}
                                    align="center"
                                />
                                <Column
                                    field="is_active"
                                    header="Status"
                                    body={(r) => <StatusIndicator status={r.is_active} />}
                                    align="center"
                                />
                            </DataTable>
                        </div>
                    )}
                </TabPanel>
            </TabView>
        </Dialog>
    );
}
