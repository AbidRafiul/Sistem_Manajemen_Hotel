/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { signOut, useSession } from 'next-auth/react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { formatDateSystem } from '@/lib/tools/dateTools';
import postData from '@/lib/axios/postData';
import axios from 'axios';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { data: session, update } = useSession();
    const { onMenuToggle } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const branchOp = useRef<OverlayPanel>(null);
    const userOp = useRef<OverlayPanel>(null);
    const toast = useRef<Toast>(null);

    const [realZonedTime, setRealZonedTime] = useState<string | null>('-');
    const [isSwitching, setIsSwitching] = useState<boolean>(false);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
    const [selectedRegion, setSelectedRegion] = useState<string | number | null>('ALL');
    const [regions, setRegions] = useState<{ label: string; value: any }[]>([]);
    const [allBranches, setAllBranches] = useState<any[]>([]);

    // Live clock formatted in Indonesian locale
    useEffect(() => {
        const updateClock = () => {
            const formatted = formatDateSystem(new Date(), 'EEEE, dd MMMM yyyy HH:mm:ss', null, 'id');
            setRealZonedTime(formatted || '-');
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, [session]);

    // Role & Permission resolution
    const roleLower = (session?.user?.role || '').toLowerCase();
    const isManagerOrAdmin = ['superadmin', 'admin', 'master', 'corporate_manager', 'regional_manager'].includes(roleLower);
    const canSwitch = isManagerOrAdmin || Boolean(session?.user?.can_switch_branch);

    // Fetch branches and regions for hierarchical switching
    const fetchDropdownData = async () => {
        setIsLoadingData(true);
        try {
            // 1. Fetch regions
            const regionRes = await postData('/master/wilayah/wilayah-dropdown', {});
            const rData = regionRes?.data?.data || regionRes?.data;
            if (Array.isArray(rData)) {
                setRegions(rData.map((r: any) => ({
                    label: r.name || r.nama || r.label,
                    value: Number(r.id || r.value || r.kode)
                })));
            }

            // 2. Fetch branches
            const branchRes = await postData('/master/cabang/cabang-data', { perPage: 100 });
            const bData = branchRes?.data?.data || branchRes?.data;
            let mappedBranches: any[] = [];
            if (Array.isArray(bData) && bData.length > 0) {
                mappedBranches = bData.map((b: any) => ({
                    id: Number(b.id),
                    kode_cabang: b.kode_cabang,
                    nama_hotel: b.name || b.nama_hotel,
                    org_node_id: b.org_node_id ? Number(b.org_node_id) : null,
                    nama_wilayah: b.nama_wilayah
                }));
                setAllBranches(mappedBranches);
            } else if (session?.user?.allowed_branches && session.user.allowed_branches.length > 0) {
                mappedBranches = session.user.allowed_branches.map((b: any) => ({
                    ...b,
                    org_node_id: b.org_node_id ? Number(b.org_node_id) : null
                }));
                setAllBranches(mappedBranches);
            }

            // Inisialisasi filter Region agar otomatis mengikuti region dari cabang aktif (jika belum disetel manual)
            if (session?.user?.active_kode_cabang) {
                const activeCabang = mappedBranches.find((b: any) => b.kode_cabang === session.user.active_kode_cabang);
                if (activeCabang?.org_node_id) {
                    setSelectedRegion((prev: string | number | null) => (prev === null ? Number(activeCabang.org_node_id) : prev));
                }
            }
        } catch (err) {
            console.warn('Gagal memuat data cabang / wilayah di topbar:', err);
            if (session?.user?.allowed_branches && session.user.allowed_branches.length > 0) {
                setAllBranches(session.user.allowed_branches);
            }
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        fetchDropdownData();
    }, [session]);

    // Handle switching branch
    const handleSwitchBranch = async (selectedValue: string) => {
        if (!selectedValue || selectedValue === session?.user?.active_kode_cabang) return;

        setIsSwitching(true);
        try {
            const res = await axios.post('/api/auth/switch-branch', {
                kode_cabang: selectedValue,
                target_kode_cabang: selectedValue
            });

            if (res.data?.status === '00') {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Cabang Berhasil Dialihkan',
                    detail: res.data?.message || `Beralih ke unit ${selectedValue}`,
                    life: 2500
                });

                await update({
                    active_branch: res.data.data.active_branch,
                    access_token: res.data.data.access_token,
                    refresh_token: res.data.data.refresh_token
                });

                branchOp.current?.hide();

                setTimeout(() => {
                    window.location.reload();
                }, 600);
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Gagal Memindahkan Cabang',
                    detail: res.data?.message || 'Terjadi kesalahan saat beralih cabang',
                    life: 4000
                });
            }
        } catch (err: any) {
            console.error('Switch branch error:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Gagal',
                detail: err?.response?.data?.message || err.message || 'Tidak dapat memindahkan cabang',
                life: 4000
            });
        } finally {
            setIsSwitching(false);
        }
    };

    const handleLogout = () => {
        signOut();
    };

    // Region dropdown options (sebagai filter)
    const regionOptions = [
        { label: 'Semua Region / Wilayah', value: 'ALL' },
        ...regions
    ];

    // Branch dropdown options filtered by selected region
    const branchesSource = allBranches.length > 0 ? allBranches : (session?.user?.allowed_branches || []);
    const isFilterAll = !selectedRegion || selectedRegion === 'ALL';
    const filteredBranches = isFilterAll
        ? branchesSource
        : branchesSource.filter((b: any) => Number(b.org_node_id) === Number(selectedRegion));

    const branchDropdownOptions = filteredBranches.map((b: any) => ({
        label: b.nama_hotel || b.name || b.kode_cabang,
        value: b.kode_cabang
    }));

    // Cek apakah cabang aktif ada di dalam cabang yang sedang terfilter
    const isCurrentActiveInFiltered = filteredBranches.some((b: any) => b.kode_cabang === session?.user?.active_kode_cabang);
    const selectedBranchValue = isCurrentActiveInFiltered ? session?.user?.active_kode_cabang : null;

    const activeBranchName = session?.user?.active_branch_name || session?.user?.active_kode_cabang || 'Grand Marstech Hotel & Resort Magetan';

    return (
        <div className="layout-topbar">
            <Toast ref={toast} />

            <div className="flex justify-content-between w-full align-items-center">
                {/* Sisi Kiri: Brand & Menu Button */}
                <div className="flex align-items-center gap-2">
                    <Link href="/" className="layout-topbar-logo text-decoration-none">
                        <img src="/layout/images/logo.png" width="36px" height="36px" alt="logo" />
                        <div className="flex flex-column ml-2">
                            <span className="font-bold text-base text-900 line-height-1">
                                {session?.user?.company_name || 'Grand Marstech'}
                            </span>
                            <span className="text-xs text-500 font-normal line-height-1 mt-1">
                                Enterprise PMS
                            </span>
                        </div>
                    </Link>

                    <button
                        ref={menubuttonRef}
                        type="button"
                        className="p-link layout-menu-button layout-topbar-button ml-2"
                        onClick={onMenuToggle}
                        suppressHydrationWarning
                    >
                        <i className="pi pi-bars" />
                    </button>
                </div>

                {/* Sisi Kanan: Date & Time, User Info, Minimalist Branch Switcher Pill & Action Icons */}
                <div className="flex align-items-center gap-3">
                    {/* Live Date, Time & User Name / Role */}
                    <div className="hidden lg:flex align-items-center text-sm" suppressHydrationWarning>
                        <span className="font-bold text-sm text-800">{realZonedTime}</span>
                        <span className="mx-3 text-400 font-normal">|</span>
                        <span className="font-semibold text-sm text-700">
                            {session?.user?.name || (session?.user?.role ? session.user.role.toUpperCase() : 'User')}
                        </span>
                    </div>

                    {/* Branch Switcher Pill Button (Consistent with Lara Light Green Theme) */}
                    <button
                        type="button"
                        onClick={(e) => branchOp?.current?.toggle(e)}
                        className="p-link flex align-items-center gap-2 px-3 py-2 border-round-3xl transition-all cursor-pointer shadow-none hover:surface-hover"
                        style={{
                            backgroundColor: 'var(--primary-50, #ecfdf5)',
                            border: '1px solid var(--primary-200, #a7f3d0)',
                            outline: 'none'
                        }}
                        title="Pindah Cabang Hotel"
                        suppressHydrationWarning
                    >
                        <i className="pi pi-building text-sm text-primary" />
                        <span
                            className="font-semibold text-xs md:text-sm line-height-1"
                            style={{ color: 'var(--primary-700, #047857)' }}
                        >
                            {activeBranchName}
                        </span>
                        <i className="pi pi-chevron-down text-xs ml-1 text-primary" />
                    </button>

                    {/* Popup Pindah Cabang Hotel (Hierarchical OverlayPanel) */}
                    <OverlayPanel
                        ref={branchOp}
                        className="p-0 shadow-4 border-round-2xl overflow-hidden"
                        style={{ width: '360px', borderRadius: '16px' }}
                    >
                        <div className="p-4 bg-white flex flex-column">
                            {/* Header: Pindah Cabang Hotel + Refresh Button */}
                            <div className="flex align-items-center justify-content-between mb-3">
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-building font-bold text-base text-primary" />
                                    <span className="font-bold text-900 text-base">Pindah Cabang Hotel</span>
                                </div>
                                <button
                                    type="button"
                                    className="p-link text-500 hover:text-primary p-2 border-circle hover:surface-100 transition-colors"
                                    onClick={fetchDropdownData}
                                    title="Refresh Data Cabang"
                                >
                                    <i className={`pi pi-refresh text-sm ${isLoadingData ? 'pi-spin' : ''}`} />
                                </button>
                            </div>

                            {/* Active Card: CABANG AKTIF */}
                            <div
                                className="p-3 border-round-xl flex align-items-center gap-3 mb-3"
                                style={{
                                    backgroundColor: 'var(--primary-50, #ecfdf5)',
                                    border: '1px solid var(--primary-100, #d1fae5)'
                                }}
                            >
                                <div className="flex align-items-center justify-content-center">
                                    <i className="pi pi-map-marker text-xl text-primary" />
                                </div>
                                <div className="flex flex-column">
                                    <span
                                        className="font-bold text-500 uppercase"
                                        style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}
                                    >
                                        CABANG AKTIF
                                    </span>
                                    <span
                                        className="font-bold text-sm mt-1"
                                        style={{ color: 'var(--primary-700, #047857)' }}
                                    >
                                        {activeBranchName}
                                    </span>
                                </div>
                            </div>

                            <div className="border-bottom-1 surface-border my-2" />

                            {/* Field 1: Region / Wilayah (Filter) */}
                            <div className="flex flex-column gap-1 mb-3">
                                <label className="text-xs font-semibold text-700 flex align-items-center gap-2">
                                    <i className="pi pi-building text-primary text-xs" />
                                    <span>Region/Wilayah</span>
                                </label>
                                <Dropdown
                                    value={selectedRegion}
                                    options={regionOptions}
                                    onChange={(e) => setSelectedRegion(e.value)}
                                    placeholder="Pilih Region / Wilayah"
                                    showClear
                                    className="w-full text-sm"
                                    panelClassName="text-sm"
                                />
                            </div>

                            {/* Field 2: Hotel Cabang */}
                            <div className="flex flex-column gap-1 mb-2">
                                <label className="text-xs font-semibold text-700 flex align-items-center gap-2">
                                    <i className="pi pi-sitemap text-primary text-xs" />
                                    <span>Hotel Cabang</span>
                                </label>
                                <Dropdown
                                    value={selectedBranchValue}
                                    options={branchDropdownOptions}
                                    onChange={(e) => {
                                        if (e.value) {
                                            handleSwitchBranch(e.value);
                                        }
                                    }}
                                    placeholder={filteredBranches.length > 0 ? "Pilih Hotel Cabang" : "Tidak ada cabang di region ini"}
                                    emptyMessage="Tidak ada cabang hotel di region ini"
                                    className="w-full text-sm"
                                    panelClassName="text-sm"
                                    disabled={!canSwitch || isSwitching || filteredBranches.length === 0}
                                />
                                {isSwitching && (
                                    <div className="flex align-items-center gap-2 text-xs text-primary mt-1">
                                        <i className="pi pi-spin pi-spinner text-xs" />
                                        <span>Sedang memindahkan cabang...</span>
                                    </div>
                                )}
                            </div>

                            {!canSwitch && (
                                <div className="p-2 border-round surface-100 text-xs text-orange-600 font-medium flex align-items-center gap-2 mt-1">
                                    <i className="pi pi-lock text-xs" />
                                    <span>Akun Anda terkunci pada unit cabang ini.</span>
                                </div>
                            )}
                        </div>
                    </OverlayPanel>

                    {/* Notification Icon Button */}
                    <button
                        type="button"
                        className="p-link layout-topbar-button"
                        style={{ width: '2.5rem', height: '2.5rem' }}
                        title="Notifikasi"
                        suppressHydrationWarning
                    >
                        <i className="pi pi-bell text-lg text-600" />
                    </button>

                    {/* User Profile Button */}
                    <button
                        type="button"
                        onClick={(e) => userOp?.current?.toggle(e)}
                        className="p-link layout-topbar-button"
                        style={{ width: '2.5rem', height: '2.5rem' }}
                        title="Profil Akun"
                        suppressHydrationWarning
                    >
                        <i className="pi pi-user text-lg text-600" />
                    </button>

                    {/* User Profile & Logout Overlay */}
                    <OverlayPanel ref={userOp} className="p-2 shadow-3" style={{ minWidth: '220px' }}>
                        <div className="flex flex-column gap-2">
                            <div className="border-bottom-1 surface-border pb-2">
                                <div className="font-bold text-900">{session?.user?.name}</div>
                                <div className="text-xs text-500 mt-1">{session?.user?.role?.toUpperCase()}</div>
                                <div className="text-xs text-primary font-medium mt-1">
                                    {session?.user?.active_kode_cabang} - {activeBranchName}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="p-link flex align-items-center gap-2 text-red-600 p-2 border-round hover:surface-100 w-full text-left"
                                onClick={() => handleLogout()}
                            >
                                <i className="pi pi-sign-out text-sm" />
                                <span className="font-medium text-sm">Log Out</span>
                            </button>
                        </div>
                    </OverlayPanel>
                </div>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
