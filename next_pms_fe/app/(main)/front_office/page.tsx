'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import postData from '@/lib/axios/postData';

// Dynamic Lazy-loading of existing reservation modules (Zero duplication, 100% consistent)
const WalkInModule = dynamic(() => import('@/app/(main)/reservasi_baru/page'), {
    loading: () => (
        <div className="card p-5 text-center surface-card border-round-xl border-1 surface-border">
            <i className="pi pi-spin pi-spinner text-primary text-3xl mb-2" />
            <p className="text-500 text-xs m-0">Memuat modul Walk-In Check-In...</p>
        </div>
    ),
    ssr: false
});

const BookingModule = dynamic(() => import('@/app/(main)/reservasi_booking/page'), {
    loading: () => (
        <div className="card p-5 text-center surface-card border-round-xl border-1 surface-border">
            <i className="pi pi-spin pi-spinner text-blue-600 text-3xl mb-2" />
            <p className="text-500 text-xs m-0">Memuat modul Booking Reservasi...</p>
        </div>
    ),
    ssr: false
});

const ArrivalsModule = dynamic(() => import('@/app/(main)/reservasi_checkin/page'), {
    loading: () => (
        <div className="card p-5 text-center surface-card border-round-xl border-1 surface-border">
            <i className="pi pi-spin pi-spinner text-teal-600 text-3xl mb-2" />
            <p className="text-500 text-xs m-0">Memuat modul Kedatangan (Arrivals)...</p>
        </div>
    ),
    ssr: false
});

const InHouseModule = dynamic(() => import('@/app/(main)/tamu_menginap/page'), {
    loading: () => (
        <div className="card p-5 text-center surface-card border-round-xl border-1 surface-border">
            <i className="pi pi-spin pi-spinner text-indigo-600 text-3xl mb-2" />
            <p className="text-500 text-xs m-0">Memuat modul Tamu Menginap...</p>
        </div>
    ),
    ssr: false
});

const CheckoutModule = dynamic(() => import('@/app/(main)/checkout/page'), {
    loading: () => (
        <div className="card p-5 text-center surface-card border-round-xl border-1 surface-border">
            <i className="pi pi-spin pi-spinner text-red-600 text-3xl mb-2" />
            <p className="text-500 text-xs m-0">Memuat modul Checkout & Billing...</p>
        </div>
    ),
    ssr: false
});

interface NavTabItem {
    key: string;
    route: string;
    label: string;
    icon: string;
    badgeIndex: number;
    component: React.ComponentType<any>;
}

// Route mapping configuration to existing components
const ROUTE_CONFIG: Record<string, { key: string; defaultLabel: string; defaultIcon: string; badgeIndex: number; component: React.ComponentType<any> }> = {
    '/reservasi_baru': {
        key: 'walkin',
        defaultLabel: 'Walk-In Check-In',
        defaultIcon: 'pi pi-user-plus text-primary',
        badgeIndex: 1,
        component: WalkInModule
    },
    '/reservasi_booking': {
        key: 'booking',
        defaultLabel: 'Booking Reservasi',
        defaultIcon: 'pi pi-calendar text-blue-600',
        badgeIndex: 2,
        component: BookingModule
    },
    '/reservasi_checkin': {
        key: 'arrivals',
        defaultLabel: 'Kedatangan (Arrivals)',
        defaultIcon: 'pi pi-sign-in text-teal-600',
        badgeIndex: 3,
        component: ArrivalsModule
    },
    '/tamu_menginap': {
        key: 'inhouse',
        defaultLabel: 'Tamu Menginap',
        defaultIcon: 'pi pi-users text-indigo-600',
        badgeIndex: 4,
        component: InHouseModule
    },
    '/checkout': {
        key: 'checkout',
        defaultLabel: 'Checkout & Billing',
        defaultIcon: 'pi pi-sign-out text-red-600',
        badgeIndex: 5,
        component: CheckoutModule
    }
};

// Fallback operational tabs if navigation is loading
const FALLBACK_TABS: NavTabItem[] = Object.values(ROUTE_CONFIG).map((cfg) => ({
    key: cfg.key,
    route: Object.keys(ROUTE_CONFIG).find(k => ROUTE_CONFIG[k].key === cfg.key) || '',
    label: `${cfg.badgeIndex}. ${cfg.defaultLabel}`,
    icon: cfg.defaultIcon,
    badgeIndex: cfg.badgeIndex,
    component: cfg.component
})).sort((a, b) => a.badgeIndex - b.badgeIndex);

// Palet warna standar Sakai PMS untuk masing-masing alur resepsionis (1 s/d 5)
const TAB_COLOR_CONFIG: Record<string, {
    inactiveBg: string;
    inactiveBorder: string;
    inactiveText: string;
    inactiveIcon: string;
    inactiveBadgeBg: string;
    inactiveBadgeText: string;
    inactiveBadgeBorder: string;
    hoverBg: string;
    activeBg: string;
    activeBorder: string;
    activeBadgeText: string;
}> = {
    walkin: {
        inactiveBg: 'bg-green-50',
        inactiveBorder: 'border-green-200',
        inactiveText: 'text-green-800',
        inactiveIcon: 'text-green-600',
        inactiveBadgeBg: 'bg-white',
        inactiveBadgeText: 'text-green-700',
        inactiveBadgeBorder: 'border-green-300',
        hoverBg: 'hover:bg-green-100',
        activeBg: 'bg-green-600',
        activeBorder: 'border-green-600',
        activeBadgeText: 'text-green-700'
    },
    booking: {
        inactiveBg: 'bg-blue-50',
        inactiveBorder: 'border-blue-200',
        inactiveText: 'text-blue-800',
        inactiveIcon: 'text-blue-600',
        inactiveBadgeBg: 'bg-white',
        inactiveBadgeText: 'text-blue-700',
        inactiveBadgeBorder: 'border-blue-300',
        hoverBg: 'hover:bg-blue-100',
        activeBg: 'bg-blue-600',
        activeBorder: 'border-blue-600',
        activeBadgeText: 'text-blue-700'
    },
    arrivals: {
        inactiveBg: 'bg-teal-50',
        inactiveBorder: 'border-teal-200',
        inactiveText: 'text-teal-800',
        inactiveIcon: 'text-teal-600',
        inactiveBadgeBg: 'bg-white',
        inactiveBadgeText: 'text-teal-700',
        inactiveBadgeBorder: 'border-teal-300',
        hoverBg: 'hover:bg-teal-100',
        activeBg: 'bg-teal-600',
        activeBorder: 'border-teal-600',
        activeBadgeText: 'text-teal-700'
    },
    inhouse: {
        inactiveBg: 'bg-indigo-50',
        inactiveBorder: 'border-indigo-200',
        inactiveText: 'text-indigo-800',
        inactiveIcon: 'text-indigo-600',
        inactiveBadgeBg: 'bg-white',
        inactiveBadgeText: 'text-indigo-700',
        inactiveBadgeBorder: 'border-indigo-300',
        hoverBg: 'hover:bg-indigo-100',
        activeBg: 'bg-indigo-600',
        activeBorder: 'border-indigo-600',
        activeBadgeText: 'text-indigo-700'
    },
    checkout: {
        inactiveBg: 'bg-orange-50',
        inactiveBorder: 'border-orange-200',
        inactiveText: 'text-orange-800',
        inactiveIcon: 'text-orange-600',
        inactiveBadgeBg: 'bg-white',
        inactiveBadgeText: 'text-orange-700',
        inactiveBadgeBorder: 'border-orange-300',
        hoverBg: 'hover:bg-orange-100',
        activeBg: 'bg-orange-600',
        activeBorder: 'border-orange-600',
        activeBadgeText: 'text-orange-700'
    }
};

const FrontOfficeMainContent = () => {
    const toast = useRef<Toast>(null);
    const router = useRouter();
    const { data: session } = useSession();

    const [activeTab, setActiveTab] = useState<number>(0);
    const [navTabs, setNavTabs] = useState<NavTabItem[]>(FALLBACK_TABS);
    const [shiftAktif, setShiftAktif] = useState<any>(null);
    const [shiftLoading, setShiftLoading] = useState<boolean>(false);

    // Fetch active cashier shift
    const fetchCurrentShift = async () => {
        setShiftLoading(true);
        try {
            const res = await postData('/kasir/shift-current', {});
            setShiftAktif(res?.data?.data || null);
        } catch {
            setShiftAktif(null);
        } finally {
            setShiftLoading(false);
        }
    };

    const searchParams = useSearchParams();

    // Inisialisasi tab aktif dari parameter URL (misal: ?tab=arrivals atau ?tab=3)
    useEffect(() => {
        if (!searchParams) return;
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            const foundIdx = navTabs.findIndex(
                (t) => t.key.toLowerCase() === tabParam.toLowerCase() || String(t.badgeIndex) === tabParam
            );
            if (foundIdx !== -1) {
                setActiveTab(foundIdx);
            }
        }
    }, [searchParams, navTabs]);

    const handleSelectTab = (index: number) => {
        setActiveTab(index);
        const targetTab = navTabs[index];
        if (targetTab) {
            router.replace(`/front_office?tab=${targetTab.key}`, { scroll: false });
        }
    };

    // Load RBAC-authorized menu from database (mst_navigation via /setup/nav/user-data)
    useEffect(() => {
        const fetchNavFromDatabase = async () => {
            const userCode = session?.user?.user_code;
            if (!userCode) return;

            try {
                const res = await postData('/setup/nav/user-data', { user_code: userCode });
                const menuList = res?.data?.data || [];

                // Cari grup menu Reservasi dari database
                const reservasiMenu = menuList.find((m: any) =>
                    m.label?.toLowerCase() === 'reservasi' ||
                    (Array.isArray(m.items) && m.items.some((i: any) => ROUTE_CONFIG[i.to]))
                );

                if (reservasiMenu?.items && Array.isArray(reservasiMenu.items)) {
                    const authorizedTabs: NavTabItem[] = [];

                    reservasiMenu.items.forEach((item: any) => {
                        const target = ROUTE_CONFIG[item.to];
                        if (target) {
                            authorizedTabs.push({
                                key: target.key,
                                route: item.to,
                                label: `${target.badgeIndex}. ${item.label || target.defaultLabel}`,
                                icon: item.icon ? `${item.icon}` : target.defaultIcon,
                                badgeIndex: target.badgeIndex,
                                component: target.component
                            });
                        }
                    });

                    if (authorizedTabs.length > 0) {
                        // Urutkan berdasarkan urutan alur resepsionis 1 s/d 5
                        authorizedTabs.sort((a, b) => a.badgeIndex - b.badgeIndex);
                        setNavTabs(authorizedTabs);
                    }
                }
            } catch (err) {
                console.warn('Gagal memuat navigasi RBAC dari database, menggunakan konfigurasi standar:', err);
            }
        };

        fetchNavFromDatabase();
        fetchCurrentShift();
    }, [session?.user?.user_code]);

    return (
        <div className="p-0">
            <Toast ref={toast} position="top-right" />

            {/* Header Standar Proyek PMS */}
            <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center mb-3 gap-2">
                <div className="flex flex-column">
                    <h3 className="text-2xl font-semibold flex align-items-center gap-2 m-0 text-900">
                        <i className="pi pi-desktop text-primary text-3xl" />
                        Front Office Desk
                    </h3>
                    <p className="text-500 text-xs m-0 mt-1">
                        Pusat kendali operasional terpadu resepsionis hotel berbasis navigasi master data.
                    </p>
                </div>

                {/* Status Ringkas Shift Kasir Aktif */}
                <div className="flex align-items-center gap-2 surface-card p-2 px-3 border-round-xl border-1 surface-border shadow-1">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-wallet text-xl text-primary" />
                        <div className="text-left">
                            <span className="text-500 text-xs block">Sesi Kasir:</span>
                            <span className="font-semibold text-xs text-900">
                                {shiftLoading ? 'Memeriksa...' : shiftAktif ? (shiftAktif.nama_counter || shiftAktif.kode_cashier_shift) : 'Belum Dibuka'}
                            </span>
                        </div>
                    </div>
                    {shiftAktif ? (
                        <Tag severity="success" value="AKTIF" className="text-xs ml-2" />
                    ) : (
                        <Button 
                            label="Buka Shift" 
                            icon="pi pi-external-link" 
                            size="small" 
                            severity="warning" 
                            outlined 
                            className="text-xs py-1 px-2 ml-2"
                            onClick={() => router.push('/kasir_shift')}
                        />
                    )}
                </div>
            </div>

            {/* Navigasi Alur Resepsionis (Card Button Bar Terpisah) */}
            <div className="surface-card p-2 border-round-xl border-1 surface-border shadow-1 mb-3">
                <div 
                    className="flex align-items-center gap-2 overflow-x-auto flex-nowrap"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {navTabs.map((tab, idx) => {
                        const isActive = activeTab === idx;
                        const labelText = tab.label.replace(/^\d+\.\s*/, '');
                        const theme = TAB_COLOR_CONFIG[tab.key] || TAB_COLOR_CONFIG.walkin;
                        
                        // Bersihkan class warna bawaan pada icon saat tab aktif agar tampil putih bersih
                        const baseIcon = tab.icon.replace(/text-[a-z0-9-]+/g, '').trim();
                        const iconClass = isActive ? `${baseIcon} text-white` : `${baseIcon} ${theme.inactiveIcon}`;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleSelectTab(idx)}
                                className={`flex-1 min-w-max flex align-items-center justify-content-center gap-2 px-3 py-2 border-round-lg cursor-pointer transition-all transition-duration-150 select-none ${
                                    isActive
                                        ? `${theme.activeBg} text-white shadow-2 font-bold border-1 ${theme.activeBorder}`
                                        : `${theme.inactiveBg} ${theme.inactiveText} ${theme.hoverBg} border-1 ${theme.inactiveBorder} font-semibold shadow-none`
                                }`}
                                style={{ outline: 'none', fontFamily: 'inherit' }}
                            >
                                <span
                                    className={`border-circle flex align-items-center justify-content-center text-xs font-bold transition-colors ${
                                        isActive
                                            ? `bg-white ${theme.activeBadgeText} shadow-1`
                                            : `${theme.inactiveBadgeBg} ${theme.inactiveBadgeText} border-1 ${theme.inactiveBadgeBorder} shadow-1`
                                    }`}
                                    style={{ width: '24px', height: '24px', minWidth: '24px', flexShrink: 0 }}
                                >
                                    {tab.badgeIndex}
                                </span>
                                <i className={iconClass} style={{ fontSize: '1rem' }} />
                                <span className={`text-sm ${isActive ? 'text-white font-bold' : `${theme.inactiveText} font-semibold`} white-space-nowrap`}>
                                    {labelText}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Area Konten Modul Navigasi Terpilih (Card Independen di Bawahnya) */}
            {navTabs[activeTab] && (
                <div key={navTabs[activeTab].key} className="animation-duration-200 fadein">
                    {React.createElement(navTabs[activeTab].component)}
                </div>
            )}
        </div>
    );
};

const FrontOfficePage = () => {
    return (
        <Suspense fallback={<div className="p-4 text-center">Memuat Front Office Desk...</div>}>
            <FrontOfficeMainContent />
        </Suspense>
    );
};

export default FrontOfficePage;
