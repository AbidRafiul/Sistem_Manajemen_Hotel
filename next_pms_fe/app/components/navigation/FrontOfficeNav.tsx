'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tag } from 'primereact/tag';

interface NavItem {
    label: string;
    sublabel?: string;
    path: string;
    icon: string;
    badge?: string;
    severity?: 'success' | 'info' | 'warning' | 'danger';
}

const FRONT_OFFICE_ROUTES: NavItem[] = [
    {
        label: 'Dashboard FO',
        sublabel: 'Kalender & Okupansi',
        path: '/reservasi_dashboard',
        icon: 'pi pi-th-large'
    },
    {
        label: 'Booking Reservasi',
        sublabel: 'Pemesanan Kamar',
        path: '/reservasi_booking',
        icon: 'pi pi-calendar-plus'
    },
    {
        label: 'Walk-In Check-In',
        sublabel: 'Tamu Tiba Langsung',
        path: '/reservasi_baru',
        icon: 'pi pi-bolt'
    },
    {
        label: 'Kedatangan (Arrivals)',
        sublabel: 'Check-in Tamu Booking',
        path: '/reservasi_checkin',
        icon: 'pi pi-sign-in'
    },
    {
        label: 'Tamu Menginap',
        sublabel: 'In-House & Folio',
        path: '/tamu_menginap',
        icon: 'pi pi-users'
    },
    {
        label: 'Checkout & Pelunasan',
        sublabel: 'Settlement Kasir',
        path: '/checkout',
        icon: 'pi pi-sign-out'
    },
    {
        label: 'Shift Kasir',
        sublabel: 'Laci Kasir & Rekap',
        path: '/kasir_shift',
        icon: 'pi pi-wallet'
    }
];

export const FrontOfficeNav: React.FC = () => {
    const pathname = usePathname();
    const activeTabRef = useRef<HTMLAnchorElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll tab aktif ke posisi nyaman di layar tablet / iPad
    useEffect(() => {
        if (activeTabRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const activeElem = activeTabRef.current;
            const containerWidth = container.offsetWidth;
            const elemLeft = activeElem.offsetLeft;
            const elemWidth = activeElem.offsetWidth;

            // Pusatkan tab aktif jika berada di luar jangkauan tampilan layar
            container.scrollTo({
                left: elemLeft - containerWidth / 2 + elemWidth / 2,
                behavior: 'smooth'
            });
        }
    }, [pathname]);

    return (
        <div className="surface-card border-round-2xl border-1 surface-border shadow-1 mb-3.5 p-2 select-none">
            {/* Header Mini Front Desk di Tablet/Desktop */}
            <div className="flex align-items-center justify-content-between px-2 pt-1 pb-2 border-bottom-1 surface-border flex-wrap gap-2">
                <div className="flex align-items-center gap-2">
                    <span className="flex align-items-center justify-content-center bg-primary-50 border-circle w-2rem h-2rem text-primary">
                        <i className="pi pi-desktop text-sm"></i>
                    </span>
                    <div>
                        <span className="font-bold text-xs uppercase tracking-wider text-900 block line-height-1">
                            Front Office Desk Hub
                        </span>
                        <span className="text-500 font-normal line-height-1" style={{ fontSize: '11px' }}>
                            Akses Cepat Alur Layanan Resepsionis &amp; Kasir
                        </span>
                    </div>
                </div>

                <div className="flex align-items-center gap-2">
                    <Tag
                        severity="success"
                        value="Mobile &amp; Tablet Ready"
                        icon="pi pi-check"
                        className="text-xs font-semibold py-0.5 px-2"
                        style={{ fontSize: '10.5px' }}
                    />
                </div>
            </div>

            {/* Container Bar Navigasi Horizontal dengan Touch-Scroll Ramah iPad */}
            <div
                ref={scrollContainerRef}
                className="flex align-items-center gap-1.5 pt-2 overflow-x-auto w-full"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                {FRONT_OFFICE_ROUTES.map((route) => {
                    const isActive = pathname === route.path || (route.path !== '/' && pathname.startsWith(route.path));

                    return (
                        <Link
                            key={route.path}
                            href={route.path}
                            prefetch={true}
                            ref={isActive ? activeTabRef : null}
                            className={`flex align-items-center gap-2.5 px-3 py-2 border-round-xl transition-all duration-150 text-decoration-none whitespace-nowrap cursor-pointer ${
                                isActive
                                    ? 'bg-primary-50 text-primary border-2 border-primary-500 shadow-1 font-bold'
                                    : 'surface-0 hover:surface-100 text-700 border-1 border-200 font-medium hover:text-900 hover:border-300'
                            }`}
                            style={{
                                minHeight: '44px',
                                flexShrink: 0
                            }}
                        >
                            <span
                                className={`flex align-items-center justify-content-center border-round-lg w-2rem h-2rem ${
                                    isActive
                                        ? 'bg-primary text-white shadow-1'
                                        : 'surface-100 text-600'
                                }`}
                                style={{ fontSize: '13px' }}
                            >
                                <i className={route.icon}></i>
                            </span>

                            <div className="flex flex-column text-left">
                                <span className={`text-xs line-height-2 ${isActive ? 'font-bold text-primary-900' : 'text-800'}`}>
                                    {route.label}
                                </span>
                                {route.sublabel && (
                                    <span
                                        className={`line-height-1 hidden sm:block ${
                                            isActive ? 'text-primary-700' : 'text-500'
                                        }`}
                                        style={{ fontSize: '10px' }}
                                    >
                                        {route.sublabel}
                                    </span>
                                )}
                            </div>

                            {isActive && (
                                <span
                                    className="border-circle bg-primary ml-1"
                                    style={{
                                        width: '6px',
                                        height: '6px',
                                        boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)'
                                    }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default FrontOfficeNav;
