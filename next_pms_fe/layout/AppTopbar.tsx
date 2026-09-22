/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { signOut, useSession } from 'next-auth/react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { formatDateSystem } from '@/lib/tools/dateTools';
import axios from 'axios';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { data: session, update } = useSession();
    const { onMenuToggle } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const op = useRef<OverlayPanel>(null);
    const toast = useRef<Toast>(null);
    const [realZonedTime, setRealZonedTime] = useState<string | null>("-");
    const [isSwitching, setIsSwitching] = useState<boolean>(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setRealZonedTime(formatDateSystem(new Date(), "EEEE, dd MMMM yyyy HH:mm:ss", null, 'id'));
        }, 1000);

        return () => clearInterval(timer);
    }, [session]);

    const handleLogout = () => {
        signOut();
    };

    const handleSwitchBranch = async (e: { value: string }) => {
        const selectedValue = e.value;
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
                    summary: 'Cabang Dialihkan',
                    detail: res.data?.message || `Berhasil beralih ke cabang ${selectedValue}`,
                    life: 2500
                });

                // Update session state in NextAuth
                await update({
                    active_branch: res.data.data.active_branch,
                    access_token: res.data.data.access_token,
                    refresh_token: res.data.data.refresh_token,
                });

                // Reload window to refresh all page queries with new active branch context
                setTimeout(() => {
                    window.location.reload();
                }, 800);
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Gagal Beralih Cabang',
                    detail: res.data?.message || 'Terjadi kesalahan saat beralih cabang',
                    life: 4000
                });
            }
        } catch (err: any) {
            console.error("Switch branch error:", err);
            toast.current?.show({
                severity: 'error',
                summary: 'Gagal',
                detail: err?.response?.data?.message || err.message || 'Tidak dapat beralih cabang',
                life: 4000
            });
        } finally {
            setIsSwitching(false);
        }
    };

    const allowedBranches = session?.user?.allowed_branches || [];
    const canSwitch = Boolean(session?.user?.can_switch_branch) && allowedBranches.length > 1;

    const branchOptions = allowedBranches.map((b: any) => ({
        label: `${b.kode_cabang} - ${b.nama_hotel}`,
        value: b.kode_cabang
    }));

    const getRoleSeverity = (role?: string) => {
        switch (role?.toLowerCase()) {
            case 'superadmin':
            case 'admin':
                return 'danger';
            case 'corporate_manager':
            case 'regional_manager':
            case 'manager':
            case 'general manager':
                return 'warning';
            case 'branch_manager':
            case 'kepala cabang':
                return 'success';
            case 'frontdesk':
            case 'receptionist':
                return 'info';
            case 'kasir':
                return 'contrast';
            case 'auditor':
                return 'secondary';
            case 'housekeeping':
                return 'info';
            default:
                return 'info';
        }
    };

    return (
        <div className="layout-topbar">
            <Toast ref={toast} />
            <div className="flex justify-content-between w-full align-items-center">
                {/* Left Side: Brand & Mobile Menu */}
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

                    <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button ml-2" onClick={onMenuToggle} suppressHydrationWarning>
                        <i className="pi pi-bars" />
                    </button>
                </div>

                {/* Center / Enterprise Context: Role Badge & Active Branch */}
                <div className="hidden md:flex align-items-center gap-3">
                    {session?.user?.role && (
                        <div className="flex align-items-center gap-1">
                            <span className="text-xs text-500 font-medium">Role:</span>
                            <Tag
                                value={session.user.role.toUpperCase()}
                                severity={getRoleSeverity(session.user.role)}
                                className="text-xs px-2 py-1 font-semibold"
                            />
                        </div>
                    )}

                    {canSwitch ? (
                        <div className="flex align-items-center gap-2 px-2 py-1 surface-100 border-round border-1 surface-border">
                            <i className="pi pi-building text-primary font-bold text-sm ml-1" />
                            <span className="text-xs text-600 font-medium">Cabang:</span>
                            <Dropdown
                                value={session?.user?.active_kode_cabang}
                                options={branchOptions}
                                onChange={handleSwitchBranch}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Pilih Cabang"
                                disabled={isSwitching}
                                className="p-inputtext-sm border-none bg-transparent font-semibold text-900"
                                style={{ minWidth: '220px' }}
                            />
                            {isSwitching && <i className="pi pi-spin pi-spinner text-primary text-sm mr-1" />}
                        </div>
                    ) : (
                        <div className="flex align-items-center gap-2 px-3 py-1 surface-100 border-round border-1 surface-border">
                            <i className="pi pi-building text-primary text-sm" />
                            <span className="text-xs text-600 font-medium">Cabang:</span>
                            <span className="text-xs font-bold text-900">
                                {session?.user?.active_branch_name ? `${session?.user?.active_kode_cabang} - ${session?.user?.active_branch_name}` : (session?.user?.active_kode_cabang || '-')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Side: Clock, User Info, Actions */}
                <div className="flex gap-2 align-items-center">
                    <div className="hidden lg:flex align-items-center text-sm" suppressHydrationWarning>
                        <div className="font-semibold text-xs text-600">{realZonedTime}</div>
                        <span className="mx-2 text-300">|</span>
                        <div className="font-bold text-700">
                            {session?.user?.name}
                        </div>
                    </div>

                    <button type="button" className="p-link layout-topbar-button" suppressHydrationWarning>
                        <i className="pi pi-bell"></i>
                        <span>Notification</span>
                    </button>

                    <button type="button" onClick={(e) => op?.current?.toggle(e)} className="p-link layout-topbar-button" suppressHydrationWarning>
                        <i className="pi pi-user"></i>
                        <span>Log Out</span>
                    </button>

                    <OverlayPanel ref={op} className="p-2 shadow-3">
                        <div className="flex flex-column gap-2" style={{ minWidth: '180px' }}>
                            <div className="border-bottom-1 surface-border pb-2">
                                <div className="font-bold text-900">{session?.user?.name}</div>
                                <div className="text-xs text-500">{session?.user?.role}</div>
                                <div className="text-xs text-primary font-medium mt-1">
                                    {session?.user?.active_kode_cabang} - {session?.user?.active_branch_name}
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
