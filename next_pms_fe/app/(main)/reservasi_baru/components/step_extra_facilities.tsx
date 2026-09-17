'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { ReservasiBaruState, initValue, ExtraFacilityItem, MasterFasilitasItem, MasterAmenityItem } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import postData from '@/lib/axios/postData';
import { apiFasilitasDropdown, apiAmenityDropdown } from './endpoints';

interface StepExtraFacilitiesProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const getItemIcon = (name: string, category: 'fasilitas' | 'amenity'): string => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('sarapan') || lower.includes('breakfast') || lower.includes('makan') || lower.includes('buffet')) return 'pi pi-coffee';
    if (lower.includes('bed') || lower.includes('kasur') || lower.includes('matras') || lower.includes('extra bed')) return 'pi pi-box';
    if (lower.includes('laundry') || lower.includes('cuci') || lower.includes('setrika')) return 'pi pi-sync';
    if (lower.includes('wifi') || lower.includes('internet')) return 'pi pi-wifi';
    if (lower.includes('late checkout') || lower.includes('check-out') || lower.includes('checkout')) return 'pi pi-clock';
    if (lower.includes('spa') || lower.includes('sauna') || lower.includes('massage') || lower.includes('pijat')) return 'pi pi-sun';
    if (lower.includes('renang') || lower.includes('pool') || lower.includes('kolam')) return 'pi pi-compass';
    if (lower.includes('gym') || lower.includes('fitness')) return 'pi pi-bolt';
    if (lower.includes('bandara') || lower.includes('airport') || lower.includes('shuttle') || lower.includes('jemput') || lower.includes('antar') || lower.includes('mobil')) return 'pi pi-car';
    if (lower.includes('minibar') || lower.includes('snack') || lower.includes('minuman')) return 'pi pi-shopping-bag';
    if (lower.includes('bantal') || lower.includes('selimut') || lower.includes('linen') || lower.includes('pillow')) return 'pi pi-heart';
    if (lower.includes('mandi') || lower.includes('toiletries') || lower.includes('sabun') || lower.includes('vip')) return 'pi pi-shield';
    if (lower.includes('meeting') || lower.includes('rapat')) return 'pi pi-briefcase';
    return category === 'amenity' ? 'pi pi-sparkles' : 'pi pi-building';
};

const isSwitchType = (name: string): boolean => {
    const lower = (name || '').toLowerCase();
    return lower.includes('wifi') || lower.includes('check-out') || lower.includes('checkout');
};

const getUnitLabel = (name: string, category: 'fasilitas' | 'amenity'): string => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('sarapan') || lower.includes('breakfast')) return '/ orang';
    if (lower.includes('bed') || lower.includes('kasur')) return '/ unit';
    if (lower.includes('laundry')) return '/ kg';
    if (lower.includes('wifi')) return '/ hari';
    if (lower.includes('checkout') || lower.includes('check-out')) return '/ reservasi';
    if (lower.includes('shuttle') || lower.includes('bandara') || lower.includes('airport')) return '/ trip';
    if (lower.includes('spa') || lower.includes('pijat')) return '/ sesi';
    if (lower.includes('bantal') || lower.includes('selimut')) return '/ set';
    if (lower.includes('mandi')) return '/ paket';
    if (lower.includes('minibar')) return '/ paket';
    return category === 'amenity' ? '/ item' : '/ layanan';
};

const StepExtraFacilities: React.FC<StepExtraFacilitiesProps> = ({ state, setState, formik, toast }) => {
    const [availableAddOns, setAvailableAddOns] = useState<ExtraFacilityItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [filterCategory, setFilterCategory] = useState<'all' | 'fasilitas' | 'amenity'>('all');

    // Ambil data Master Fasilitas & Master Amenity dari backend
    useEffect(() => {
        const fetchMasterData = async () => {
            if (!formik.values.kode_cabang) {
                setAvailableAddOns([]);
                return;
            }
            setLoading(true);
            try {
                const [resFasilitas, resAmenity] = await Promise.all([
                    postData(apiFasilitasDropdown, { kode_cabang: formik.values.kode_cabang }),
                    postData(apiAmenityDropdown, {})
                ]);

                const fasData: MasterFasilitasItem[] = resFasilitas?.data?.data || [];
                const amnData: MasterAmenityItem[] = resAmenity?.data?.data || [];

                // Format Fasilitas (hanya yang aktif & memiliki tarif harga > 0 sebagai add-on)
                const mappedFasilitas: ExtraFacilityItem[] = fasData
                    .filter(f => f.is_active === 1 && Number(f.harga || 0) > 0)
                    .map(f => {
                        const harga = Number(f.harga || 0);
                        const tipe = isSwitchType(f.name) ? 'switch' : 'counter';
                        return {
                            id: `fas_${f.kode_fasilitas}`,
                            kode_fasilitas: f.kode_fasilitas,
                            nama: f.name,
                            tipe,
                            harga,
                            unit_label: getUnitLabel(f.name, 'fasilitas'),
                            icon: getItemIcon(f.name, 'fasilitas'),
                            category: 'fasilitas' as const,
                            source: 'master_fasilitas',
                            description: `Layanan fasilitas hotel cabang (${f.kode_fasilitas})`,
                            qty: 0,
                            subtotal: 0
                        };
                    });

                // Format Amenity (hanya yang aktif & memiliki tarif harga > 0 sebagai add-on)
                const mappedAmenity: ExtraFacilityItem[] = amnData
                    .filter(a => a.is_active === 1 && Number(a.harga || 0) > 0)
                    .map(a => {
                        const harga = Number(a.harga || 0);
                        const tipe = isSwitchType(a.name) ? 'switch' : 'counter';
                        return {
                            id: `amn_${a.kode_amenity}`,
                            kode_amenity: a.kode_amenity,
                            nama: a.name,
                            tipe,
                            harga,
                            unit_label: getUnitLabel(a.name, 'amenity'),
                            icon: a.icon || getItemIcon(a.name, 'amenity'),
                            category: 'amenity' as const,
                            source: 'master_amenity',
                            description: `Amenity & kenyamanan kamar hotel (${a.kode_amenity})`,
                            qty: 0,
                            subtotal: 0
                        };
                    });

                const combined = [...mappedFasilitas, ...mappedAmenity];
                setAvailableAddOns(combined);
            } catch (err: any) {
                console.error('Gagal mengambil data fasilitas & amenity:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMasterData();
    }, [formik.values.kode_cabang]);

    const selectedFacilities = useMemo(() => formik.values.extra_facilities || [], [formik.values.extra_facilities]);

    const getItemCurrentState = (item: ExtraFacilityItem) => {
        const found = selectedFacilities.find(f =>
            f.id === item.id ||
            (item.kode_fasilitas && f.kode_fasilitas === item.kode_fasilitas) ||
            (item.kode_amenity && f.kode_amenity === item.kode_amenity)
        );
        return {
            qty: found ? found.qty : 0,
            subtotal: found ? found.subtotal : 0,
            isSelected: found ? found.qty > 0 : false
        };
    };

    const updateFacilityQty = (item: ExtraFacilityItem, newQty: number) => {
        const qty = Math.max(0, newQty);
        const subtotal = qty * item.harga;
        const currentList = formik.values.extra_facilities || [];

        const existingIdx = currentList.findIndex(f =>
            f.id === item.id ||
            (item.kode_fasilitas && f.kode_fasilitas === item.kode_fasilitas) ||
            (item.kode_amenity && f.kode_amenity === item.kode_amenity)
        );

        let updatedList: ExtraFacilityItem[];
        if (existingIdx >= 0) {
            updatedList = [...currentList];
            updatedList[existingIdx] = {
                ...updatedList[existingIdx],
                ...item,
                qty,
                subtotal
            };
        } else {
            updatedList = [
                ...currentList,
                {
                    ...item,
                    qty,
                    subtotal
                }
            ];
        }
        formik.setFieldValue('extra_facilities', updatedList);
    };

    const activeFacilities = selectedFacilities.filter(f => f.qty > 0 || f.subtotal > 0);
    const totalPaidAmount = activeFacilities.reduce((sum, f) => sum + (f.subtotal || 0), 0);
    const totalSelectedCount = activeFacilities.length;

    const filteredItems = useMemo(() => {
        if (filterCategory === 'all') return availableAddOns;
        return availableAddOns.filter(item => item.category === filterCategory);
    }, [availableAddOns, filterCategory]);

    const countFasilitas = availableAddOns.filter(i => i.category === 'fasilitas').length;
    const countAmenity = availableAddOns.filter(i => i.category === 'amenity').length;

    return (
        <div className="p-fluid formgrid grid">
            {/* Header Banner */}
            <div className="col-12 mb-3">
                <div className="p-3 border-round-xl border-1 surface-border bg-blue-50 flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="flex align-items-center gap-3">
                        <div
                            className="border-circle bg-blue-100 flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '42px', height: '42px' }}
                        >
                            <i className="pi pi-sparkles text-blue-600 text-xl"></i>
                        </div>
                        <div>
                            <div className="font-bold text-blue-900 text-base">Fasilitas & Layanan Tambahan (Add-ons)</div>
                            <div className="text-blue-700 text-xs mt-1">
                                Layanan berbayar yang terhubung langsung dari Master Fasilitas cabang & Master Amenity hotel.
                            </div>
                        </div>
                    </div>
                    {totalSelectedCount > 0 && (
                        <Tag
                            severity="info"
                            value={`${totalSelectedCount} Layanan Dipilih (+ Rp ${totalPaidAmount.toLocaleString('id-ID')})`}
                            icon="pi pi-check-circle"
                            className="px-3 py-2 font-semibold text-xs shadow-1"
                        />
                    )}
                </div>
            </div>

            {/* Filter & Subheader Row */}
            <div className="col-12 mb-3 flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="flex align-items-center gap-2">
                    <span className="font-bold text-900 text-base flex align-items-center gap-2">
                        <i className="pi pi-shopping-bag text-primary text-lg"></i>
                        Pilihan Add-ons & Fasilitas
                    </span>
                    <span className="text-xs text-color-secondary hidden md:inline">
                        (Biaya masuk ke folio tamu)
                    </span>
                </div>

                {/* Category Filter Buttons */}
                <div className="flex align-items-center gap-2">
                    <Button
                        type="button"
                        label={`Semua (${availableAddOns.length})`}
                        className={`p-button-sm px-3 py-1 text-xs border-round-lg font-medium ${
                            filterCategory === 'all'
                                ? 'p-button-primary shadow-1'
                                : 'p-button-outlined p-button-secondary surface-0'
                        }`}
                        onClick={() => setFilterCategory('all')}
                    />
                    <Button
                        type="button"
                        icon="pi pi-building"
                        label={`Fasilitas (${countFasilitas})`}
                        className={`p-button-sm px-3 py-1 text-xs border-round-lg font-medium ${
                            filterCategory === 'fasilitas'
                                ? 'p-button-primary shadow-1'
                                : 'p-button-outlined p-button-secondary surface-0'
                        }`}
                        onClick={() => setFilterCategory('fasilitas')}
                    />
                    <Button
                        type="button"
                        icon="pi pi-sparkles"
                        label={`Amenity (${countAmenity})`}
                        className={`p-button-sm px-3 py-1 text-xs border-round-lg font-medium ${
                            filterCategory === 'amenity'
                                ? 'p-button-primary shadow-1'
                                : 'p-button-outlined p-button-secondary surface-0'
                        }`}
                        onClick={() => setFilterCategory('amenity')}
                    />
                </div>
            </div>

            {/* Content Section */}
            {!formik.values.kode_cabang ? (
                <div className="col-12 mb-3">
                    <div className="p-4 border-round-xl surface-100 text-color-secondary text-center flex flex-column align-items-center justify-content-center gap-2">
                        <i className="pi pi-info-circle text-blue-500 text-2xl"></i>
                        <span className="font-medium text-sm">
                            Silakan pilih cabang hotel terlebih dahulu di tab <strong>Data Tamu</strong> untuk memuat daftar add-on.
                        </span>
                    </div>
                </div>
            ) : loading ? (
                <>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="col-12 md:col-6 lg:col-4 mb-3">
                            <Skeleton height="140px" className="border-round-xl" />
                        </div>
                    ))}
                </>
            ) : filteredItems.length === 0 ? (
                <div className="col-12 mb-3">
                    <div className="p-4 border-round-xl surface-100 text-color-secondary text-center flex flex-column align-items-center justify-content-center gap-2">
                        <i className="pi pi-box text-color-secondary text-2xl"></i>
                        <span className="font-medium text-sm">
                            Belum ada layanan add-on berbayar yang aktif pada kategori ini di Master Fasilitas / Master Amenity.
                        </span>
                    </div>
                </div>
            ) : (
                filteredItems.map(item => {
                    const { qty, subtotal, isSelected } = getItemCurrentState(item);

                    return (
                        <div key={item.id} className="col-12 md:col-6 lg:col-4 mb-3">
                            <div
                                className={`surface-card border-round-xl border-1 p-3 flex flex-column justify-content-between transition-all transition-duration-150 h-full ${
                                    isSelected
                                        ? 'border-primary shadow-2 bg-blue-50'
                                        : 'surface-border hover:border-300 hover:shadow-1'
                                }`}
                            >
                                <div>
                                    {/* Header: Icon, Name, Category Badge */}
                                    <div className="flex align-items-start gap-3 mb-2">
                                        <div
                                            className="flex align-items-center justify-content-center border-circle flex-shrink-0"
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                background: isSelected ? 'var(--blue-100)' : 'var(--surface-100)',
                                                color: isSelected ? 'var(--primary-color)' : 'var(--text-color-secondary)',
                                                transition: 'background 0.15s, color 0.15s'
                                            }}
                                        >
                                            <i className={item.icon} style={{ fontSize: '1.2rem' }}></i>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex align-items-center justify-content-between gap-1 mb-1">
                                                <Tag
                                                    severity={item.category === 'amenity' ? 'warning' : 'info'}
                                                    value={item.category === 'amenity' ? 'Amenity' : 'Fasilitas'}
                                                    className="text-xs px-2 py-0"
                                                />
                                                <span className="text-xs text-color-secondary font-mono">
                                                    {item.kode_fasilitas || item.kode_amenity}
                                                </span>
                                            </div>
                                            <div
                                                className="font-bold text-sm text-overflow-ellipsis overflow-hidden white-space-nowrap"
                                                title={item.nama}
                                                style={{ color: isSelected ? 'var(--primary-900)' : 'var(--text-900)' }}
                                            >
                                                {item.nama}
                                            </div>
                                            <div className="text-xs text-primary font-bold mt-1">
                                                Rp {item.harga.toLocaleString('id-ID')}{item.unit_label ? ` ${item.unit_label}` : ''}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {item.description && (
                                        <div className="text-xs text-color-secondary mb-3 line-height-2">
                                            {item.description}
                                        </div>
                                    )}
                                </div>

                                {/* Controls & Subtotal Footer */}
                                <div className="flex align-items-center justify-content-between pt-2 border-top-1 surface-border">
                                    <div className="text-xs">
                                        {isSelected && subtotal > 0 ? (
                                            <span className="text-green-700 font-bold">
                                                Subtotal: Rp {subtotal.toLocaleString('id-ID')}
                                            </span>
                                        ) : (
                                            <span className="text-color-secondary">Pilih jumlah</span>
                                        )}
                                    </div>

                                    {item.tipe === 'switch' ? (
                                        <div className="flex align-items-center gap-2">
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: isSelected ? 'var(--primary-color)' : 'var(--text-color-secondary)' }}
                                            >
                                                {isSelected ? 'Aktif' : 'Off'}
                                            </span>
                                            <InputSwitch
                                                checked={isSelected}
                                                onChange={e => updateFacilityQty(item, e.value ? 1 : 0)}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="flex align-items-center gap-2"
                                            style={{
                                                border: '1px solid var(--surface-border)',
                                                borderRadius: '8px',
                                                padding: '2px 6px',
                                                background: 'var(--surface-0)'
                                            }}
                                        >
                                            <Button
                                                type="button"
                                                icon="pi pi-minus"
                                                className="p-button-text p-button-secondary p-button-sm p-0 flex align-items-center justify-content-center"
                                                style={{ width: '26px', height: '26px' }}
                                                onClick={() => updateFacilityQty(item, qty - 1)}
                                                disabled={qty <= 0}
                                            />
                                            <span
                                                className="font-bold text-center text-900 text-sm"
                                                style={{ minWidth: '24px' }}
                                            >
                                                {qty}
                                            </span>
                                            <Button
                                                type="button"
                                                icon="pi pi-plus"
                                                className="p-button-text p-button-primary p-button-sm p-0 flex align-items-center justify-content-center"
                                                style={{ width: '26px', height: '26px' }}
                                                onClick={() => updateFacilityQty(item, qty + 1)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {/* Catatan / Permintaan Khusus */}
            <div className="col-12 mt-2">
                <label htmlFor="special_request" className="font-semibold text-sm text-900 mb-2 block flex align-items-center gap-2">
                    <i className="pi pi-comment text-color-secondary"></i>
                    Catatan / Permintaan Khusus Tamu (Opsional)
                </label>
                <InputTextarea
                    id="special_request"
                    name="special_request"
                    value={formik.values.special_request || ''}
                    onChange={formik.handleChange}
                    placeholder="Contoh: Minta extra pillow, kamar bebas asap rokok, kamar lantai atas, konfirmasi penjemputan bandara jam 14:00, dll."
                    rows={3}
                    autoResize
                    className="w-full text-sm"
                />
            </div>

            {/* Tombol Navigasi Bawah */}
            <div className="col-12 flex justify-content-between align-items-center flex-wrap gap-3 mt-4 pt-3 border-top-1 surface-border">
                <Button
                    type="button"
                    label="Kembali ke Kamar & Tarif"
                    icon="pi pi-arrow-left"
                    outlined
                    severity="secondary"
                    className="p-button-sm font-medium px-3 py-2"
                    onClick={() => setState(p => ({ ...p, activeStep: 1 }))}
                />
                <div className="flex align-items-center gap-3 ml-auto">
                    {totalPaidAmount > 0 && (
                        <div className="text-right">
                            <span className="text-xs text-color-secondary block">Total Fasilitas Tambahan</span>
                            <span className="font-bold text-primary text-base">
                                + Rp {totalPaidAmount.toLocaleString('id-ID')}
                            </span>
                        </div>
                    )}
                    <Button
                        type="button"
                        label="Lanjut ke Deposit & Pembayaran"
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        severity="success"
                        className="p-button-sm font-bold px-4 py-2"
                        onClick={() => setState(p => ({ ...p, activeStep: 3 }))}
                    />
                </div>
            </div>
        </div>
    );
};

export default StepExtraFacilities;
