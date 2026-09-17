import React, { useEffect, useState } from 'react';
import { ReservasiBaruState, initValue, SelectedRoomItem } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiRoomPackages } from './endpoints';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { Galleria } from 'primereact/galleria';
import { Tag } from 'primereact/tag';

interface StepAvailabilityProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepAvailability: React.FC<StepAvailabilityProps> = ({ state, setState, formik, toast }) => {
    const [galleryVisible, setGalleryVisible] = useState(false);
    const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [selectedRoomType, setSelectedRoomType] = useState<any>(null);
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
    const [filterTipeKamar, setFilterTipeKamar] = useState<string>('');
    const [selectedRatePlanPerType, setSelectedRatePlanPerType] = useState<Record<string, any>>({});

    const toggleDescription = (code: string) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [code]: !prev[code]
        }));
    };

    const openGallery = async (tk: any) => {
        setSelectedRoomType(tk);
        setGalleryVisible(true);
        setGalleryLoading(true);
        try {
            const res = await postData('/master/tipe-kamar-foto/tipe-kamar-foto-data', { kode_tipe_kamar: tk.kode_tipe_kamar });
            const data = res.data?.data || [];
            if (data.length > 0) {
                setGalleryPhotos(data);
            } else if (tk.foto_cover_url) {
                setGalleryPhotos([{ id: 0, foto_url: tk.foto_cover_url, is_cover: 1 }]);
            } else {
                setGalleryPhotos([]);
            }
        } catch (err) {
            console.error('Gagal memuat galeri:', err);
            if (tk.foto_cover_url) {
                setGalleryPhotos([{ id: 0, foto_url: tk.foto_cover_url, is_cover: 1 }]);
            } else {
                setGalleryPhotos([]);
            }
        } finally {
            setGalleryLoading(false);
        }
    };

    // Initial search if dates are prefilled
    useEffect(() => {
        if (formik.values.kode_cabang && formik.values.check_in_date && formik.values.check_out_date) {
            searchPackages();
        }
    }, [formik.values.kode_cabang]);

    const handleNightsChange = (val: number | null) => {
        const nights = val || 1;
        formik.setFieldValue('nights', nights);
        if (formik.values.check_in_date) {
            const outDate = new Date(formik.values.check_in_date);
            outDate.setDate(outDate.getDate() + nights);
            formik.setFieldValue('check_out_date', outDate);
            resetSelections();
            searchPackagesWithDates(formik.values.check_in_date, outDate);
        }
    };

    const handleCheckInChange = (date: Date | null) => {
        formik.setFieldValue('check_in_date', date);
        if (date && formik.values.nights) {
            const outDate = new Date(date);
            outDate.setDate(outDate.getDate() + formik.values.nights);
            formik.setFieldValue('check_out_date', outDate);
            resetSelections();
            searchPackagesWithDates(date, outDate);
        }
    };

    const resetSelections = () => {
        formik.setFieldValue('selected_rooms', []);
        formik.setFieldValue('kode_tipe_kamar', '');
        formik.setFieldValue('kode_rate_plan', '');
        formik.setFieldValue('kode_kamar', '');
        setState(p => ({ ...p, rateInfo: null, packagesOptions: [] }));
    };

    const searchPackagesWithDates = async (cin: Date | null, cout: Date | null) => {
        const { kode_cabang } = formik.values;
        if (!kode_cabang || !cin || !cout) return;

        setState(p => ({ ...p, packagesLoad: true, packagesOptions: [], rateInfo: null }));
        formik.setFieldValue('selected_rooms', []);
        formik.setFieldValue('kode_tipe_kamar', '');
        formik.setFieldValue('kode_rate_plan', '');
        formik.setFieldValue('kode_kamar', '');

        try {
            const res = await postData(apiRoomPackages, {
                kode_cabang,
                check_in_date: formatDateSystem(cin, "yyyy-MM-dd"),
                check_out_date: formatDateSystem(cout, "yyyy-MM-dd")
            });

            if (res.data.data) {
                const data = res.data.data || [];
                setState(p => ({
                    ...p,
                    packagesOptions: data
                }));

                const defaultPlans: Record<string, any> = {};
                for (const tk of data) {
                    if (tk.packages && tk.packages.length > 0) {
                        defaultPlans[tk.kode_tipe_kamar] = tk.packages[0];
                    }
                }
                setSelectedRatePlanPerType(defaultPlans);
            }
        } catch (e: any) {
            console.error("Gagal reload ketersediaan kamar:", e);
        } finally {
            setState(p => ({ ...p, packagesLoad: false }));
        }
    };

    const searchPackages = async () => {
        const { kode_cabang, check_in_date, check_out_date } = formik.values;
        if (!check_in_date || !check_out_date) {
            showError(toast, "Lengkapi Tanggal Check-In dan Check-Out");
            return;
        }
        await searchPackagesWithDates(check_in_date, check_out_date);
    };

    const toggleRoomSelection = (tk: any, rm: any) => {
        if (rm.status !== 'available') {
            if (rm.status === 'occupied') {
                showError(toast, `Kamar ${rm.nomor_kamar} sudah dibooking / terisi pada tanggal tersebut.`);
            } else if (rm.status === 'maintenance') {
                showError(toast, `Kamar ${rm.nomor_kamar} sedang dalam perbaikan (maintenance) atau ditutup.`);
            }
            return;
        }

        const currentSelected: SelectedRoomItem[] = formik.values.selected_rooms || [];
        const isAlreadySelected = currentSelected.some(s => s.kode_kamar === rm.kode_kamar);

        let updated: SelectedRoomItem[] = [];
        if (isAlreadySelected) {
            updated = currentSelected.filter(s => s.kode_kamar !== rm.kode_kamar);
        } else {
            const activePlan = selectedRatePlanPerType[tk.kode_tipe_kamar] || tk.packages[0] || {};
            const pricePerNight = activePlan.price_per_night || tk.harga_default || 0;
            const newItem: SelectedRoomItem = {
                kode_tipe_kamar: tk.kode_tipe_kamar,
                nama_tipe: tk.nama_tipe,
                kode_kamar: rm.kode_kamar,
                nomor_kamar: rm.nomor_kamar,
                kode_rate_plan: activePlan.kode_rate_plan || 'RP-001',
                nama_rate_plan: activePlan.nama_rate_plan || 'Standar',
                price_per_night: pricePerNight,
                total_price: pricePerNight * formik.values.nights
            };
            updated = [...currentSelected, newItem];
            showSuccess(toast, `Kamar ${rm.nomor_kamar} (${tk.nama_tipe}) ditambahkan`);
        }

        formik.setFieldValue('selected_rooms', updated);

        if (updated.length > 0) {
            formik.setFieldValue('kode_tipe_kamar', updated[0].kode_tipe_kamar);
            formik.setFieldValue('kode_rate_plan', updated[0].kode_rate_plan);
            formik.setFieldValue('kode_kamar', updated[0].kode_kamar);
            const totalTagihanAll = updated.reduce((sum, item) => sum + item.total_price, 0);
            setState(p => ({
                ...p,
                rateInfo: {
                    ...updated[0],
                    total_price: totalTagihanAll,
                    selected_count: updated.length
                }
            }));
        } else {
            formik.setFieldValue('kode_tipe_kamar', '');
            formik.setFieldValue('kode_rate_plan', '');
            formik.setFieldValue('kode_kamar', '');
            setState(p => ({ ...p, rateInfo: null }));
        }
    };

    const removeRoomSelection = (kode_kamar: string) => {
        const currentSelected = formik.values.selected_rooms || [];
        const updated = currentSelected.filter(s => s.kode_kamar !== kode_kamar);
        formik.setFieldValue('selected_rooms', updated);

        if (updated.length > 0) {
            formik.setFieldValue('kode_tipe_kamar', updated[0].kode_tipe_kamar);
            formik.setFieldValue('kode_rate_plan', updated[0].kode_rate_plan);
            formik.setFieldValue('kode_kamar', updated[0].kode_kamar);
            const totalTagihanAll = updated.reduce((sum, item) => sum + item.total_price, 0);
            setState(p => ({
                ...p,
                rateInfo: {
                    ...updated[0],
                    total_price: totalTagihanAll,
                    selected_count: updated.length
                }
            }));
        } else {
            formik.setFieldValue('kode_tipe_kamar', '');
            formik.setFieldValue('kode_rate_plan', '');
            formik.setFieldValue('kode_kamar', '');
            setState(p => ({ ...p, rateInfo: null }));
        }
    };

    const filteredPackages = (state.packagesOptions || []).filter((tk: any) => {
        if (!filterTipeKamar) return true;
        return tk.kode_tipe_kamar === filterTipeKamar;
    });

    const selectedRooms = formik.values.selected_rooms || [];
    const totalSelectedPrice = selectedRooms.reduce((acc, curr) => acc + (curr.total_price || 0), 0);

    const tipeKamarOptions = [
        { label: 'Semua Tipe', value: '' },
        ...(state.packagesOptions || []).map((tk: any) => ({
            label: tk.nama_tipe,
            value: tk.kode_tipe_kamar
        }))
    ];

    return (
        <div className="p-fluid formgrid grid">
            {/* Filter Tanggal & Tipe Kamar */}
            <div className="field col-12 md:col-3">
                <label className="font-semibold text-sm">Tanggal Check In</label>
                <Calendar 
                    value={formik.values.check_in_date} 
                    onChange={(e) => handleCheckInChange(e.value as Date)}
                    dateFormat="dd/mm/yy" 
                    showIcon
                    className={formik.errors.check_in_date && formik.touched.check_in_date ? 'p-invalid' : ''}
                />
            </div>
            <div className="field col-12 md:col-3">
                <label className="font-semibold text-sm">Jumlah Malam</label>
                <InputNumber 
                    value={formik.values.nights} 
                    onValueChange={(e) => handleNightsChange(e.value ?? null)} 
                    min={1} 
                    showButtons
                />
            </div>
            <div className="field col-12 md:col-3">
                <label className="font-semibold text-sm">Tanggal Check Out</label>
                <Calendar 
                    value={formik.values.check_out_date} 
                    disabled
                    dateFormat="dd/mm/yy" 
                    showIcon
                />
            </div>
            <div className="field col-12 md:col-3">
                <label className="font-semibold text-sm">Filter Tipe Kamar</label>
                <Dropdown 
                    value={filterTipeKamar} 
                    options={tipeKamarOptions} 
                    onChange={(e) => setFilterTipeKamar(e.value)}
                    placeholder="Semua Tipe"
                />
            </div>

            <div className="col-12 mt-1 mb-2">
                <Button label="Cari Ketersediaan Kamar" icon="pi pi-search" onClick={searchPackages} loading={state.packagesLoad} className="p-button-outlined" />
            </div>

            {/* Status Legend Bar (Advance Booking: Status Ketersediaan pada Tanggal Terpilih) */}
            <div className="col-12">
                <div className="flex flex-wrap align-items-center gap-4 py-2 px-3 border-round surface-50 border-1 surface-border mb-3">
                    <span className="text-xs font-bold text-600 uppercase">Ketersediaan pada Tanggal Terpilih:</span>
                    <div className="flex align-items-center gap-2">
                        <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                        <span className="font-semibold text-sm text-700">Tersedia (Bisa Dibooking)</span>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                        <span className="font-semibold text-sm text-700">Sudah Dipesan (Booked)</span>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }}></span>
                        <span className="font-semibold text-sm text-700">Maintenance</span>
                    </div>
                </div>
            </div>

            {/* Katalog Kamar dengan Badge Kamar Fisik */}
            {filteredPackages.length > 0 && (
                <div className="col-12">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h5 className="m-0 text-900 font-bold">Pilih Kamar yang Diinginkan</h5>
                        <span className="text-xs text-500 font-medium">Klik pada nomor kamar fisik berwarna hijau untuk memilih</span>
                    </div>

                    <div className="grid">
                        {filteredPackages.map((tk: any, i: number) => {
                            const activePlan = selectedRatePlanPerType[tk.kode_tipe_kamar] || tk.packages[0] || {};
                            const pricePerNight = activePlan.price_per_night || tk.harga_default || 0;
                            const roomsList = tk.rooms || [];

                            return (
                                <div key={i} className="col-12 lg:col-6 xl:col-6 mb-3">
                                    <Card className="h-full shadow-2 hover:shadow-3 transition-all transition-duration-200 p-0 overflow-hidden flex flex-column border-1 surface-border">
                                        {/* Foto Cover dengan Badge +N Foto */}
                                        <div className="relative w-full overflow-hidden surface-200" style={{ height: '160px' }}>
                                            {tk.foto_cover_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={tk.foto_cover_url}
                                                    alt={tk.nama_tipe}
                                                    style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                                                    onClick={() => openGallery(tk)}
                                                />
                                            ) : (
                                                <div 
                                                    className="w-full h-full flex flex-column align-items-center justify-content-center text-400 bg-bluegray-50 cursor-pointer"
                                                    onClick={() => openGallery(tk)}
                                                >
                                                    <i className="pi pi-building text-4xl mb-1 text-300"></i>
                                                    <span className="text-xs text-500 font-medium">Foto belum tersedia</span>
                                                </div>
                                            )}

                                            {/* Badge +N foto */}
                                            {tk.jumlah_foto > 1 && (
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openGallery(tk);
                                                    }}
                                                    className="absolute bottom-0 right-0 m-2 px-2 py-1 border-round flex align-items-center gap-1 cursor-pointer transition-colors shadow-2"
                                                    style={{
                                                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                                        backdropFilter: 'blur(4px)',
                                                        color: '#fff',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}
                                                    title="Lihat semua foto"
                                                >
                                                    <i className="pi pi-camera text-xs"></i>
                                                    <span>+{tk.jumlah_foto - 1} foto</span>
                                                </div>
                                            )}

                                            {/* Badge Ketersediaan */}
                                            <div className="absolute top-0 right-0 m-2">
                                                <span className={`badge ${tk.available_count > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} px-2 py-1 border-round text-xs font-bold shadow-1`}>
                                                    {tk.available_count > 0 ? `Tersedia ${tk.available_count} Kamar` : 'Habis (0)'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3 flex-1 flex flex-column">
                                            {/* Header Nama Tipe & Harga */}
                                            <div className="flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <h5 className="m-0 text-900 font-bold text-lg">{tk.nama_tipe}</h5>
                                                    <div className="text-xs text-500 mt-1 flex gap-3 align-items-center">
                                                        <span><i className="pi pi-users mr-1 text-primary"></i>{tk.kapasitas_dasar} Tamu</span>
                                                        {tk.luas_m2 ? <span><i className="pi pi-arrows-alt mr-1 text-primary"></i>{tk.luas_m2} m²</span> : null}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-primary text-base">
                                                        Rp {pricePerNight.toLocaleString('id-ID')}
                                                    </div>
                                                    <span className="text-xs text-500">/ malam</span>
                                                </div>
                                            </div>

                                            {/* Deskripsi Kamar */}
                                            {tk.deskripsi && (
                                                <div className="text-xs text-600 mb-2 line-height-2 surface-50 p-2 border-round">
                                                    {expandedDescriptions[tk.kode_tipe_kamar] || tk.deskripsi.length <= 90 ? (
                                                        <>
                                                            {tk.deskripsi}
                                                            {tk.deskripsi.length > 90 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleDescription(tk.kode_tipe_kamar)}
                                                                    className="p-0 ml-1 border-none bg-transparent text-primary font-bold cursor-pointer text-xs underline"
                                                                >
                                                                    Tutup
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {tk.deskripsi.slice(0, 90)}...
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleDescription(tk.kode_tipe_kamar)}
                                                                className="p-0 ml-1 border-none bg-transparent text-primary font-bold cursor-pointer text-xs underline"
                                                            >
                                                                Lihat selengkapnya
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Pilihan Rate Plan jika lebih dari 1 */}
                                            {tk.packages && tk.packages.length > 1 && (
                                                <div className="mb-2">
                                                    <label className="text-xs font-semibold text-600 block mb-1">Paket Harga:</label>
                                                    <Dropdown 
                                                        value={activePlan?.kode_rate_plan} 
                                                        options={tk.packages.map((pkg: any) => ({
                                                            label: `${pkg.nama_rate_plan} (Rp ${pkg.price_per_night?.toLocaleString('id-ID')}/mlm)`,
                                                            value: pkg.kode_rate_plan,
                                                            pkg: pkg
                                                        }))} 
                                                        onChange={(e) => {
                                                            const chosen = tk.packages.find((p: any) => p.kode_rate_plan === e.value);
                                                            setSelectedRatePlanPerType(prev => ({ ...prev, [tk.kode_tipe_kamar]: chosen }));
                                                        }}
                                                        className="w-full text-xs"
                                                    />
                                                </div>
                                            )}

                                            {/* Deretan Kotak / Badge Nomor Kamar Fisik (Sesuai Foto User) */}
                                            <div className="mt-auto pt-2 border-top-1 surface-border">
                                                <div className="flex justify-content-between align-items-center mb-2">
                                                    <span className="text-xs font-bold text-700">
                                                        <i className="pi pi-key mr-1 text-primary text-xs"></i>
                                                        Pilih Kamar Fisik:
                                                    </span>
                                                    <span className="text-xs text-500 italic">
                                                        {roomsList.length} kamar terdaftar
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {roomsList.length > 0 ? (
                                                        roomsList.map((rm: any, idx: number) => {
                                                            const isSelected = selectedRooms.some(s => s.kode_kamar === rm.kode_kamar);
                                                            const isAvailable = rm.status === 'available';
                                                            const isOccupied = rm.status === 'occupied';
                                                            const isMaintenance = rm.status === 'maintenance';

                                                            let badgeClass = '';
                                                            let badgeStyle: React.CSSProperties = {
                                                                minWidth: '54px',
                                                                textAlign: 'center',
                                                                padding: '6px 10px',
                                                                borderRadius: '8px',
                                                                fontSize: '0.875rem',
                                                                fontWeight: '700',
                                                                transition: 'all 0.15s ease',
                                                                userSelect: 'none'
                                                            };

                                                            if (isSelected) {
                                                                badgeClass = 'bg-green-600 text-white shadow-2 cursor-pointer';
                                                                badgeStyle = {
                                                                    ...badgeStyle,
                                                                    border: '2px solid #15803d',
                                                                    boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.4)'
                                                                };
                                                            } else if (isAvailable) {
                                                                badgeClass = 'hover:bg-green-100 cursor-pointer shadow-1';
                                                                badgeStyle = {
                                                                    ...badgeStyle,
                                                                    backgroundColor: '#dcfce7',
                                                                    color: '#15803d',
                                                                    border: '1px solid #86efac'
                                                                };
                                                            } else if (isOccupied) {
                                                                badgeClass = 'cursor-not-allowed opacity-75';
                                                                badgeStyle = {
                                                                    ...badgeStyle,
                                                                    backgroundColor: '#fee2e2',
                                                                    color: '#dc2626',
                                                                    border: '1px solid #fca5a5'
                                                                };
                                                            } else if (isMaintenance) {
                                                                badgeClass = 'cursor-not-allowed opacity-75';
                                                                badgeStyle = {
                                                                    ...badgeStyle,
                                                                    backgroundColor: '#e0f2fe',
                                                                    color: '#0284c7',
                                                                    border: '1px solid #7dd3fc'
                                                                };
                                                            }

                                                            return (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => toggleRoomSelection(tk, rm)}
                                                                    className={`border-none ${badgeClass}`}
                                                                    style={badgeStyle}
                                                                    title={`Kamar ${rm.nomor_kamar} - ${rm.status_label}${isSelected ? ' (Dipilih)' : ''}`}
                                                                >
                                                                    {isSelected && <i className="pi pi-check mr-1" style={{ fontSize: '0.75rem' }}></i>}
                                                                    {rm.nomor_kamar}
                                                                </button>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-xs text-500 italic">Belum ada fisik kamar yang terdaftar.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Ringkasan Keranjang Kamar Terpilih */}
            {selectedRooms.length > 0 && (
                <div className="col-12 mt-3">
                    <div 
                        className="p-3 border-round-xl border-1 surface-border shadow-3 flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-3"
                        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderLeft: '5px solid #22c55e' }}
                    >
                        <div>
                            <div className="flex align-items-center gap-2 mb-1">
                                <i className="pi pi-check-circle text-green-600 text-xl font-bold"></i>
                                <span className="font-bold text-lg text-green-900">{selectedRooms.length} Kamar Terpilih</span>
                                <Tag severity="success" value={`${selectedRooms.length} Unit`} className="text-xs" />
                            </div>

                            <div className="flex flex-wrap gap-2 my-2">
                                {selectedRooms.map((s, idx) => (
                                    <span 
                                        key={idx} 
                                        className="bg-white text-green-800 text-xs font-bold px-2 py-1 border-round-lg flex align-items-center gap-2 shadow-1 border-1 border-green-300"
                                    >
                                        <span>Kamar {s.nomor_kamar} • {s.nama_tipe}</span>
                                        <i 
                                            className="pi pi-times-circle text-red-500 cursor-pointer hover:text-red-700" 
                                            style={{ fontSize: '0.85rem' }}
                                            onClick={() => removeRoomSelection(s.kode_kamar)}
                                            title="Hapus kamar ini"
                                        />
                                    </span>
                                ))}
                            </div>

                            <div className="text-xs text-green-800">
                                Total ({formik.values.nights} malam): <strong className="text-green-900 text-base font-bold ml-1">Rp {totalSelectedPrice.toLocaleString('id-ID')}</strong>
                            </div>
                        </div>

                        <Button 
                            label={formik.values.kode_guest || state.foundGuest || formik.values.full_name ? "Lanjut ke Fasilitas Tambahan" : "Lanjutkan ke Data Tamu"} 
                            icon="pi pi-arrow-right" 
                            iconPos="right" 
                            severity="success"
                            className="font-bold px-4 py-3 border-round-lg shadow-2"
                            onClick={() => setState(p => ({ ...p, activeStep: (formik.values.kode_guest || state.foundGuest || formik.values.full_name) ? 2 : 0 }))}
                        />
                    </div>
                </div>
            )}

            {/* Deskripsi Panduan di Bagian Bawah */}
            <div className="col-12 mt-3">
                <div className="p-3 border-round surface-50 border-1 surface-border text-center text-600 text-sm">
                    <i className="pi pi-info-circle mr-2 text-primary"></i>
                    Pilih tanggal, tipe kamar dan lihat ketersediaan kamar. Klik kamar hijau yang diinginkan untuk reservasi (bisa pilih lebih dari 1 kamar).
                </div>
            </div>

            {/* Modal Lightbox Galeri Foto Tipe Kamar */}
            <Dialog
                visible={galleryVisible}
                onHide={() => setGalleryVisible(false)}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-images text-primary text-xl"></i>
                        <span className="font-bold text-lg">{selectedRoomType?.nama_tipe || 'Galeri Kamar'}</span>
                    </div>
                }
                style={{ width: '90vw', maxWidth: '720px' }}
                modal
                dismissableMask
            >
                {galleryLoading ? (
                    <div className="p-5 text-center text-500">
                        <i className="pi pi-spin pi-spinner text-3xl mb-2 text-primary"></i>
                        <p className="m-0 text-sm">Memuat galeri foto...</p>
                    </div>
                ) : galleryPhotos.length > 0 ? (
                    <div>
                        <Galleria
                            value={galleryPhotos}
                            numVisible={5}
                            circular
                            style={{ maxWidth: '100%' }}
                            showItemNavigators
                            showThumbnails={galleryPhotos.length > 1}
                            item={(item) => (
                                <div className="relative w-full border-round overflow-hidden" style={{ height: '380px' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.foto_url}
                                        alt="Foto Kamar"
                                        style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block' }}
                                    />
                                    {item.is_cover === 1 && (
                                        <div className="absolute top-0 left-0 m-2">
                                            <Tag severity="success" value="Cover Utama" icon="pi pi-star-fill" />
                                        </div>
                                    )}
                                </div>
                            )}
                            thumbnail={(item) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={item.foto_url}
                                    alt="Thumbnail"
                                    style={{ width: '80px', height: '55px', objectFit: 'cover', display: 'block', borderRadius: '4px' }}
                                />
                            )}
                        />
                        {selectedRoomType?.deskripsi && (
                            <div className="mt-3 p-3 surface-50 border-round text-sm line-height-3 text-700">
                                <span className="font-bold block mb-1 text-900">Deskripsi Tipe Kamar:</span>
                                {selectedRoomType.deskripsi}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-5 text-center text-500">
                        <i className="pi pi-image text-4xl mb-2 text-300"></i>
                        <p className="m-0 text-base">Belum ada galeri foto untuk tipe kamar ini.</p>
                    </div>
                )}
            </Dialog>

        </div>
    );
};

export default StepAvailability;
