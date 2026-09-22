'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { TabView, TabPanel } from 'primereact/tabview';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { apiCheckoutSearch, apiCheckoutSubmit, apiShiftCurrent } from './components/endpoints';
import DialogInvoice from '@/app/components/dialogComponents/dialog_invoice';
import StatusIndicator from '@/app/components/status/StatusIndicator';
import StatusLegend from '@/app/components/status/StatusLegend';

const CheckoutPage = () => {
    const toast = useRef<Toast>(null);
    const router = useRouter();
    const { data: session } = useSession();

    const [loading, setLoading] = useState(false);
    const [submitLoad, setSubmitLoad] = useState(false);

    const [rooms, setRooms] = useState<any[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roomTypeFilter, setRoomTypeFilter] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Pagination state
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
    const [shiftAktif, setShiftAktif] = useState<any>(null);

    // Checkout modal state
    const [checkoutDialogVisible, setCheckoutDialogVisible] = useState(false);

    // Payment form state
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
    const [referenceNo, setReferenceNo] = useState('');

    // Invoice & Success modal states
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);
    const [lastCheckoutResult, setLastCheckoutResult] = useState<any>(null);
    const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
    const [activeInvoiceFolio, setActiveInvoiceFolio] = useState<string>('');
    const [activeInvoiceNumber, setActiveInvoiceNumber] = useState<string>('');

    const fetchShift = async () => {
        try {
            const res = await postData(apiShiftCurrent, {});
            setShiftAktif(res?.data?.data || null);
        } catch (error) {
            console.error('Failed to fetch shift', error);
        }
    };

    const searchRooms = async (keyword: string = '') => {
        setLoading(true);
        try {
            const res = await postData(apiCheckoutSearch, { 
                keyword,
                kode_cabang: session?.user?.active_kode_cabang 
            });
            const list = res?.data?.data || [];
            setRooms(list);

            // If selectedRoom is still active, re-sync its data
            if (selectedRoom) {
                const updated = list.find((r: any) => r.kode_folio === selectedRoom.kode_folio);
                if (updated) {
                    setSelectedRoom(updated);
                    if (updated.balance > 0) {
                        setPaymentAmount(updated.balance);
                    }
                }
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal mencari kamar siap checkout');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShift();
        if (session?.user?.active_kode_cabang) {
            searchRooms();
        }
    }, [session?.user?.active_kode_cabang]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchKeyword(val);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            searchRooms(val);
            setFirst(0);
        }, 400);
    };

    const handleResetFilter = () => {
        setSearchKeyword('');
        setStatusFilter('');
        setRoomTypeFilter('');
        setFirst(0);
        searchRooms('');
    };

    const handleSelectRoom = (room: any) => {
        setSelectedRoom(room);
        if (room) {
            const allIds = (room.rooms || [room]).map((r: any) => r.kode_reservasi_room).filter(Boolean);
            setSelectedRoomIds(allIds);
            if (room.balance > 0) {
                setPaymentAmount(room.balance);
            } else {
                setPaymentAmount(null);
            }
        } else {
            setSelectedRoomIds([]);
            setPaymentAmount(null);
        }
        setReferenceNo('');
    };

    // Filtered rooms based on dropdowns
    const filteredRooms = useMemo(() => {
        return rooms.filter((r) => {
            const isSettled = r.is_settled || Number(r.balance || 0) <= 0;
            if (statusFilter === 'settled' && !isSettled) return false;
            if (statusFilter === 'unsettled' && isSettled) return false;
            if (roomTypeFilter && r.nama_tipe !== roomTypeFilter) return false;
            return true;
        });
    }, [rooms, statusFilter, roomTypeFilter]);

    // Distinct room types for dropdown filter
    const roomTypeOptions = useMemo(() => {
        const set = new Set<string>();
        rooms.forEach((r) => {
            if (r.nama_tipe) set.add(r.nama_tipe);
        });
        return [
            { label: 'Semua Tipe Kamar', value: '' },
            ...Array.from(set).map((t) => ({ label: t, value: t }))
        ];
    }, [rooms]);

    const statusOptions = [
        { label: 'Semua Status Tagihan', value: '' },
        { label: 'Lunas', value: 'settled' },
        { label: 'Belum Lunas', value: 'unsettled' }
    ];

    const handleCheckout = async (withPayment: boolean = false) => {
        if (!selectedRoom) return;

        const targetIds = selectedRoomIds.length > 0
            ? selectedRoomIds
            : (selectedRoom.rooms || [selectedRoom]).map((r: any) => r.kode_reservasi_room).filter(Boolean);

        if (targetIds.length === 0) {
            showError(toast, 'Pilih minimal satu kamar untuk checkout');
            return;
        }

        const outstanding = Number(selectedRoom.balance || 0);

        if (withPayment || outstanding > 0) {
            const payVal = paymentAmount !== null && paymentAmount !== undefined ? paymentAmount : outstanding;
            if (!payVal || payVal <= 0) {
                showError(toast, 'Nominal pembayaran tidak valid');
                return;
            }

            if (paymentMethod === 'cash' && !shiftAktif) {
                showError(toast, 'Shift kasir belum dibuka. Buka shift kasir terlebih dahulu untuk pembayaran tunai.');
                return;
            }
        }

        setSubmitLoad(true);
        try {
            const payload: any = {
                kode_folio: selectedRoom.kode_folio,
                kode_reservasi_rooms: targetIds,
                kode_reservasi_room: targetIds[0],
                kode_cabang: session?.user?.active_kode_cabang || selectedRoom.kode_cabang
            };

            if (withPayment || outstanding > 0) {
                payload.payment = [
                    {
                        payment_method: paymentMethod,
                        amount: paymentAmount !== null ? paymentAmount : outstanding,
                        kode_cashier_shift: paymentMethod === 'cash' ? shiftAktif?.kode_cashier_shift : undefined,
                        reference_no: referenceNo || undefined
                    }
                ];
            }

            const res = await postData(apiCheckoutSubmit, payload);
            const resData = res?.data?.data || {};

            showSuccess(toast, res?.data?.message || 'Checkout kamar berhasil diproses!');

            setLastCheckoutResult({
                ...selectedRoom,
                nomor_kamar: resData.nomor_kamar || selectedRoom.nomor_kamar,
                room_count: resData.room_count || targetIds.length,
                invoice_number: resData.invoice_number || selectedRoom.invoice_number,
                rooms_checked_out: resData.rooms_checked_out || [],
                is_folio_closed: resData.is_folio_closed
            });
            setActiveInvoiceFolio(selectedRoom.kode_folio);
            setActiveInvoiceNumber(resData.invoice_number || selectedRoom.invoice_number || '');
            setCheckoutDialogVisible(false);
            setSuccessDialogVisible(true);

            // Reset selection & refresh table
            setSelectedRoom(null);
            setSelectedRoomIds([]);
            setPaymentAmount(null);
            setReferenceNo('');
            searchRooms();
        } catch (error: any) {
            const errMsg = error?.response?.data?.message || 'Gagal memproses checkout';
            showError(toast, errMsg);

            if (errMsg.includes('belum lunas: Rp')) {
                const match = errMsg.match(/Rp\s*([\d.,]+)/);
                if (match && match[1]) {
                    const amountStr = match[1].replace(/[^\d]/g, '');
                    const amountNum = parseInt(amountStr, 10);
                    if (!isNaN(amountNum)) {
                        setPaymentAmount(amountNum);
                    }
                }
            }
        } finally {
            setSubmitLoad(false);
        }
    };

    const formatCurrency = (val: number | string | undefined | null) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
            Number(val || 0)
        );
    };

    const isSelectedSettled = selectedRoom ? selectedRoom.is_settled || Number(selectedRoom.balance || 0) <= 0 : false;
    const selectedBalance = selectedRoom ? Math.max(0, Number(selectedRoom.balance || 0)) : 0;

    // Body templates matching Master Tamu conventions
    const roomBodyTemplate = (rowData: any) => {
        const count = rowData.room_count || rowData.rooms?.length || 1;
        return (
            <div className="flex flex-column gap-1">
                <div className="flex align-items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-primary">
                        Kamar {rowData.nomor_kamar}
                    </span>
                    {count > 1 && (
                        <Tag severity="info" value={`${count} Kamar`} className="text-xs font-bold" />
                    )}
                </div>
                <span className="text-xs text-500 font-normal">{rowData.nama_tipe}</span>
            </div>
        );
    };

    const guestBodyTemplate = (rowData: any) => (
        <div>
            <div className="font-semibold text-900">{rowData.guest_name}</div>
            <div className="text-xs text-500">{rowData.guest_phone || '-'}</div>
        </div>
    );

    const stayScheduleBodyTemplate = (rowData: any) => (
        <div className="text-xs">
            <div>In: {formatDateSystem(rowData.check_in_date, 'dd/MM/yyyy HH:mm')}</div>
            <div className="text-500">Out: {formatDateSystem(rowData.check_out_date, 'dd/MM/yyyy HH:mm')}</div>
        </div>
    );

    const billingStatusBodyTemplate = (rowData: any) => {
        const isSettled = rowData.is_settled || Number(rowData.balance || 0) <= 0;
        return isSettled ? (
            <Tag severity="success" value="LUNAS" icon="pi pi-check" />
        ) : (
            <Tag severity="danger" value="BELUM LUNAS" icon="pi pi-exclamation-circle" />
        );
    };

    const actionBodyTemplate = (rowData: any) => (
        <div className="flex justify-content-center gap-1">
            <Button
                icon="pi pi-sign-out"
                outlined
                severity="success"
                className="p-button-sm"
                onClick={() => {
                    handleSelectRoom(rowData);
                    setCheckoutDialogVisible(true);
                }}
                tooltip="Proses Checkout"
            />
            <Button
                icon="pi pi-eye"
                outlined
                severity="info"
                className="p-button-sm"
                onClick={() => {
                    handleSelectRoom(rowData);
                    setCheckoutDialogVisible(true);
                }}
                tooltip="Rincian Folio & Tagihan"
            />
            <Button
                icon="pi pi-file-pdf"
                outlined
                severity="secondary"
                className="p-button-sm"
                onClick={() => {
                    setActiveInvoiceFolio(rowData.kode_folio);
                    setActiveInvoiceNumber(rowData.invoice_number || '');
                    setInvoiceModalVisible(true);
                }}
                tooltip="Invoice Resmi"
            />
        </div>
    );

    // Table Header Template matching Master Tamu pattern
    const headerTemplate = (
        <div className="flex flex-column gap-3">
            <div className="flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="text-xl font-bold">Daftar Kamar Siap Checkout</span>
                <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
                    <IconField iconPosition="left" className="w-full md:w-20rem">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={searchKeyword}
                            className="w-full"
                            placeholder="Cari Kamar / Tamu / Folio..."
                            onChange={handleSearchChange}
                        />
                    </IconField>
                    <Button
                        type="button"
                        icon="pi pi-filter-slash"
                        outlined
                        severity="danger"
                        tooltip="Reset Filter"
                        tooltipOptions={{ position: 'bottom' }}
                        onClick={handleResetFilter}
                    />
                </div>
            </div>

            <div className="flex flex-wrap align-items-center gap-2 pt-2 border-top-1 surface-border">
                <Dropdown
                    value={statusFilter}
                    options={statusOptions}
                    onChange={(e) => {
                        setStatusFilter(e.value);
                        setFirst(0);
                    }}
                    placeholder="Status Tagihan"
                    className="p-inputtext-sm w-full md:w-13rem"
                />
                <Dropdown
                    value={roomTypeFilter}
                    options={roomTypeOptions}
                    onChange={(e) => {
                        setRoomTypeFilter(e.value);
                        setFirst(0);
                    }}
                    placeholder="Tipe Kamar"
                    className="p-inputtext-sm w-full md:w-13rem"
                />
            </div>
        </div>
    );

    return (
        <div className="p-0">
            <Toast ref={toast} position="top-right" />

            {/* Master Tamu Styled Card */}
            <div className="card">
                {/* Page Title & Subtitle */}
                <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center mb-4 gap-2">
                    <div className="flex flex-column">
                        <h3 className="text-2xl font-semibold flex align-items-center gap-2 m-0">
                            <i className="pi pi-sign-out text-blue-600 text-3xl"></i>Checkout & Penyelesaian Tagihan
                        </h3>
                        <p className="text-gray-500 m-0 mt-1">
                            Kelola checkout kamar, pelunasan sisa tagihan folio, dan penerbitan invoice resmi tamu.
                        </p>
                    </div>
                    <div className="inline-flex align-items-center gap-2 px-3 py-2 border-round-lg surface-ground border-1 surface-border">
                        <i className="pi pi-building text-primary font-bold"></i>
                        <span className="text-xs text-500 font-medium">Cabang Aktif:</span>
                        <span className="text-sm font-semibold text-900">
                            {session?.user?.active_kode_cabang || '-'} {session?.user?.active_branch_name ? `(${session.user.active_branch_name})` : ''}
                        </span>
                    </div>
                </div>

                {/* Toolbar Buttons with Dividers */}
                <div className="flex flex-row flex-wrap align-items-center gap-2 mb-3">
                    <Button
                        size="small"
                        label="Checkout Terpilih"
                        icon="pi pi-sign-out"
                        outlined
                        severity="success"
                        disabled={!selectedRoom}
                        onClick={() => setCheckoutDialogVisible(true)}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Cetak Invoice"
                        icon="pi pi-file-pdf"
                        outlined
                        severity="info"
                        disabled={!selectedRoom}
                        onClick={() => {
                            if (selectedRoom) {
                                setActiveInvoiceFolio(selectedRoom.kode_folio);
                                setActiveInvoiceNumber(selectedRoom.invoice_number || '');
                                setInvoiceModalVisible(true);
                            }
                        }}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Daftar Tamu Menginap"
                        icon="pi pi-users"
                        outlined
                        severity="secondary"
                        onClick={() => router.push('/tamu_menginap')}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Dashboard Reservasi"
                        icon="pi pi-th-large"
                        outlined
                        severity="warning"
                        onClick={() => router.push('/reservasi_dashboard')}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => searchRooms(searchKeyword)}
                        loading={loading}
                    />
                </div>

                {/* Status Legend matching Master Tamu */}
                <StatusLegend items={[{ label: 'Lunas', color: '#22c55e' }, { label: 'Belum Lunas', color: '#ef4444' }]} />

                {/* Master Tamu Styled DataTable */}
                <DataTable
                    value={filteredRooms}
                    scrollable
                    paginator
                    first={first}
                    rows={rows}
                    totalRecords={filteredRooms.length}
                    onPage={(e) => {
                        setFirst(e.first);
                        setRows(e.rows);
                    }}
                    selectionMode="single"
                    selection={selectedRoom}
                    onSelectionChange={(e) => handleSelectRoom(e.value)}
                    dataKey="kode_folio"
                    header={headerTemplate}
                    loading={loading}
                    emptyMessage="Tidak ada data kamar siap checkout"
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data checkout"
                    stripedRows
                    rowHover
                >
                    <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
                    <Column
                        field="is_settled"
                        header="Status"
                        align="center"
                        body={(rowData) => {
                            const isSettled = rowData.is_settled || Number(rowData.balance || 0) <= 0;
                            return <StatusIndicator status={isSettled ? 1 : 0} label={isSettled ? 'Lunas' : 'Belum Lunas'} />;
                        }}
                        style={{ minWidth: '5rem', width: '5rem' }}
                    />
                    <Column
                        field="nomor_kamar"
                        header="Kamar"
                        body={roomBodyTemplate}
                        sortable
                        style={{ minWidth: '12rem' }}
                    />
                    <Column
                        field="kode_folio"
                        header="Kode Folio"
                        sortable
                        style={{ minWidth: '11rem' }}
                    />
                    <Column
                        field="guest_name"
                        header="Nama Tamu (PIC)"
                        body={guestBodyTemplate}
                        sortable
                        style={{ minWidth: '15rem' }}
                    />
                    <Column
                        field="nama_tipe"
                        header="Tipe Kamar"
                        sortable
                        style={{ minWidth: '11rem' }}
                    />
                    <Column
                        field="check_in_date"
                        header="Jadwal Menginap"
                        body={stayScheduleBodyTemplate}
                        sortable
                        style={{ minWidth: '14rem' }}
                    />
                    <Column
                        field="total_charges"
                        header="Total Tagihan"
                        body={(r) => (
                            <span className="font-semibold text-900">
                                {formatCurrency(r.total_charges || r.current_grand_total)}
                            </span>
                        )}
                        align="right"
                        sortable
                        style={{ minWidth: '11rem' }}
                    />
                    <Column
                        field="balance"
                        header="Sisa Saldo"
                        body={(r) => {
                            const bal = Number(r.balance || 0);
                            return (
                                <span className={`font-bold ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(bal)}
                                </span>
                            );
                        }}
                        align="right"
                        sortable
                        style={{ minWidth: '11rem' }}
                    />
                    <Column
                        field="is_settled"
                        header="Status Tagihan"
                        body={billingStatusBodyTemplate}
                        align="center"
                        sortable
                        style={{ minWidth: '10rem' }}
                    />
                    <Column
                        header="Aksi"
                        body={actionBodyTemplate}
                        align="center"
                        frozen
                        alignFrozen="right"
                        style={{ minWidth: '10rem' }}
                    />
                </DataTable>
            </div>

            {/* Modal Dialog: Proses Checkout & Pelunasan Folio */}
            <Dialog
                visible={checkoutDialogVisible}
                onHide={() => setCheckoutDialogVisible(false)}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-sign-out text-primary text-xl"></i>
                        <span className="font-bold text-lg">Proses Checkout & Pelunasan Folio</span>
                    </div>
                }
                style={{ width: '90vw', maxWidth: '840px' }}
                modal
                closable
                footer={
                    <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                        <Button
                            label="Tutup"
                            icon="pi pi-times"
                            className="p-button-outlined p-button-sm"
                            onClick={() => setCheckoutDialogVisible(false)}
                        />
                        <div className="flex gap-2">
                            {selectedRoom && (
                                <Button
                                    label="Pratinjau Invoice"
                                    icon="pi pi-file-pdf"
                                    className="p-button-outlined p-button-sm"
                                    severity="info"
                                    onClick={() => {
                                        setActiveInvoiceFolio(selectedRoom.kode_folio);
                                        setActiveInvoiceNumber(selectedRoom.invoice_number || '');
                                        setInvoiceModalVisible(true);
                                    }}
                                />
                            )}
                            {isSelectedSettled ? (
                                <Button
                                    label={
                                        selectedRoomIds.length > 1
                                            ? `Konfirmasi Checkout (${selectedRoomIds.length} Kamar)`
                                            : `Konfirmasi Checkout (Kamar ${selectedRoom?.nomor_kamar})`
                                    }
                                    icon="pi pi-check"
                                    severity="success"
                                    className="p-button-sm font-semibold"
                                    onClick={() => handleCheckout(false)}
                                    loading={submitLoad}
                                    disabled={selectedRoomIds.length === 0}
                                />
                            ) : (
                                <Button
                                    label={
                                        selectedRoomIds.length > 1
                                            ? `Bayar ${formatCurrency(paymentAmount || selectedBalance)} & Checkout (${selectedRoomIds.length} Kamar)`
                                            : `Bayar ${formatCurrency(paymentAmount || selectedBalance)} & Checkout`
                                    }
                                    icon="pi pi-credit-card"
                                    severity="warning"
                                    className="p-button-sm font-semibold"
                                    onClick={() => handleCheckout(true)}
                                    loading={submitLoad}
                                    disabled={(paymentMethod === 'cash' && !shiftAktif) || selectedRoomIds.length === 0}
                                />
                            )}
                        </div>
                    </div>
                }
            >
                {selectedRoom && (
                    <div className="flex flex-column gap-3 pt-2">
                        {/* Folio Info Banner */}
                        <div className="surface-50 border-1 surface-border border-round-xl p-3">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-bold text-color-secondary uppercase">Informasi Folio & PIC</span>
                                <span className="text-xs font-semibold px-2 py-1 bg-white border-round border-1 surface-border text-700">
                                    {selectedRoom.kode_folio}
                                </span>
                            </div>
                            <div className="flex align-items-center gap-3">
                                <div className="w-3rem h-3rem border-round-xl bg-primary text-white font-bold text-lg flex align-items-center justify-content-center shadow-1">
                                    {selectedRoom.room_count > 1 ? `${selectedRoom.room_count}K` : selectedRoom.nomor_kamar}
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-900">{selectedRoom.guest_name}</div>
                                    <div className="text-xs text-500">
                                        Kamar: {selectedRoom.nomor_kamar} &bull; Reservasi: {selectedRoom.kode_reservasi}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Multi-Room Checkout Selector */}
                        {selectedRoom.rooms && selectedRoom.rooms.length > 1 && (
                            <div className="surface-50 border-1 surface-border border-round-xl p-3">
                                <div className="flex justify-content-between align-items-center mb-2">
                                    <span className="text-xs font-bold text-color-secondary uppercase">
                                        Pilih Kamar yang Di-Checkout ({selectedRoomIds.length} dari {selectedRoom.rooms.length} Kamar)
                                    </span>
                                    <Button
                                        label={selectedRoomIds.length === selectedRoom.rooms.length ? 'Batal Semua' : 'Pilih Semua'}
                                        className="p-button-text p-button-sm text-xs p-0 font-semibold"
                                        onClick={() => {
                                            if (selectedRoomIds.length === selectedRoom.rooms.length) {
                                                setSelectedRoomIds([]);
                                            } else {
                                                setSelectedRoomIds(selectedRoom.rooms.map((r: any) => r.kode_reservasi_room));
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex flex-column gap-2 max-h-10rem overflow-y-auto">
                                    {selectedRoom.rooms.map((rm: any, idx: number) => {
                                        const isChecked = selectedRoomIds.includes(rm.kode_reservasi_room);
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex align-items-center justify-content-between p-2 border-round cursor-pointer transition-colors ${
                                                    isChecked ? 'bg-primary-50 border-1 border-primary-300' : 'surface-100 border-1 surface-border'
                                                }`}
                                                onClick={() => {
                                                    if (isChecked) {
                                                        setSelectedRoomIds(selectedRoomIds.filter((id) => id !== rm.kode_reservasi_room));
                                                    } else {
                                                        setSelectedRoomIds([...selectedRoomIds, rm.kode_reservasi_room]);
                                                    }
                                                }}
                                            >
                                                <div className="flex align-items-center gap-2">
                                                    <i
                                                        className={`pi ${isChecked ? 'pi-check-circle text-primary font-bold' : 'pi-circle text-400'} text-base`}
                                                    ></i>
                                                    <span className="font-bold text-900">Kamar {rm.nomor_kamar}</span>
                                                    <span className="text-xs text-500">({rm.nama_tipe || selectedRoom.nama_tipe})</span>
                                                </div>
                                                <span className="text-xs font-semibold text-700">{formatCurrency(rm.rate_per_night)}/mlm</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Settlement Status Banner */}
                        {isSelectedSettled ? (
                            <div className="p-3 border-round-xl bg-green-50 border-1 border-green-200 text-green-900 flex align-items-center gap-3">
                                <i className="pi pi-check-circle text-green-600 text-2xl flex-shrink-0"></i>
                                <div>
                                    <div className="font-bold text-sm">Status Tagihan: LUNAS / SETTLED</div>
                                    <div className="text-xs text-green-700 mt-1">
                                        Seluruh tagihan kamar dan fasilitas telah terselesaikan. Kamar siap di-checkout langsung tanpa tambahan biaya.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 border-round-xl bg-red-50 border-1 border-red-200 text-red-900 flex align-items-center gap-3">
                                <i className="pi pi-exclamation-triangle text-red-600 text-2xl flex-shrink-0"></i>
                                <div>
                                    <div className="font-bold text-sm">Status Tagihan: BELUM LUNAS</div>
                                    <div className="text-xs text-red-700 mt-1">
                                        Terdapat sisa tagihan sebesar <strong className="text-red-900">{formatCurrency(selectedBalance)}</strong> yang harus dilunasi sebelum checkout disetujui.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Breakdown Tabs */}
                        <TabView className="checkout-tabview">
                            <TabPanel header="Rincian Biaya" leftIcon="pi pi-list mr-2">
                                <div className="flex flex-column gap-2 max-h-12rem overflow-y-auto pr-1">
                                    <div className="text-xs font-bold text-color-secondary uppercase mb-1">
                                        Kamar Ditempati ({selectedRoom.rooms?.length || 1} Kamar):
                                    </div>
                                    {(selectedRoom.rooms || [selectedRoom]).map((rm: any, idx: number) => (
                                        <div key={idx} className="flex justify-content-between align-items-center text-sm border-bottom-1 surface-border pb-1">
                                            <span>
                                                Kamar <strong>{rm.nomor_kamar}</strong> ({rm.nama_tipe || selectedRoom.nama_tipe})
                                            </span>
                                            <span className="font-semibold text-900">
                                                {formatCurrency(rm.subtotal || rm.total_charges || rm.rate_per_night)}
                                            </span>
                                        </div>
                                    ))}

                                    {selectedRoom.charges && selectedRoom.charges.length > 0 && (
                                        <>
                                            <div className="text-xs font-bold text-color-secondary uppercase mt-2 mb-1">Layanan Tambahan:</div>
                                            {selectedRoom.charges.map((ch: any, idx: number) => (
                                                <div key={idx} className="flex justify-content-between align-items-center text-sm border-bottom-1 surface-border pb-1">
                                                    <span>
                                                        {ch.nama_charge} <span className="text-xs text-500">x{ch.qty}</span>
                                                    </span>
                                                    <span className="font-semibold text-900">{formatCurrency(ch.total_amount)}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {selectedRoom.tax_details && selectedRoom.tax_details.length > 0 && (
                                        <>
                                            <div className="text-xs font-bold text-color-secondary uppercase mt-2 mb-1">Pajak & Layanan:</div>
                                            {selectedRoom.tax_details.map((tx: any, idx: number) => (
                                                <div key={idx} className="flex justify-content-between align-items-center text-sm border-bottom-1 surface-border pb-1">
                                                    <span className="text-500">
                                                        {tx.tax_name} ({tx.tax_rate}%)
                                                    </span>
                                                    <span className="text-700">{formatCurrency(tx.tax_amount)}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </TabPanel>

                            <TabPanel header="Riwayat Pembayaran" leftIcon="pi pi-credit-card mr-2">
                                <div className="flex flex-column gap-2 max-h-12rem overflow-y-auto pr-1">
                                    {(!selectedRoom.payments || selectedRoom.payments.length === 0) ? (
                                        <div className="text-center text-500 text-xs py-3">Belum ada catatan pembayaran.</div>
                                    ) : (
                                        selectedRoom.payments.map((p: any, idx: number) => (
                                            <div key={idx} className="surface-50 p-2 border-round text-xs flex justify-content-between align-items-center">
                                                <div>
                                                    <span className="font-bold uppercase text-primary">{p.payment_method}</span>
                                                    <span className="text-500 ml-2">{formatDateSystem(p.payment_date, 'dd/MM/yy HH:mm')}</span>
                                                    {p.reference_no && <div className="text-500 mt-1">Ref: {p.reference_no}</div>}
                                                </div>
                                                <span className="font-bold text-green-700 text-sm">{formatCurrency(p.amount)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabPanel>
                        </TabView>

                        {/* Financial Summary Card */}
                        <div className="surface-100 p-3 border-round-xl border-1 surface-border">
                            <div className="flex justify-content-between text-sm py-1">
                                <span className="text-700">Subtotal Biaya</span>
                                <span className="font-semibold text-900">{formatCurrency(selectedRoom.subtotal || selectedRoom.current_grand_total)}</span>
                            </div>
                            <div className="flex justify-content-between text-sm py-1">
                                <span className="text-700">Pajak & Service Charge</span>
                                <span className="font-semibold text-900">{formatCurrency(selectedRoom.total_tax)}</span>
                            </div>
                            <div className="flex justify-content-between text-base py-1 font-bold border-top-1 surface-border mt-1">
                                <span className="text-900">Total Tagihan (Grand Total)</span>
                                <span className="text-primary">{formatCurrency(selectedRoom.total_charges || selectedRoom.current_grand_total)}</span>
                            </div>
                            <div className="flex justify-content-between text-sm py-1">
                                <span className="text-green-700">Total Pembayaran Masuk</span>
                                <span className="font-semibold text-green-700">- {formatCurrency(selectedRoom.total_paid)}</span>
                            </div>
                            <div className="flex justify-content-between text-base py-2 font-bold border-top-1 surface-border mt-1">
                                <span className="text-900">Sisa Tagihan (Saldo Akhir)</span>
                                <span className={`text-xl ${isSelectedSettled ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(selectedBalance)}
                                </span>
                            </div>
                        </div>

                        {/* Form Pelunasan Kasir jika Belum Lunas */}
                        {!isSelectedSettled && (
                            <div className="surface-50 p-3 border-round-xl border-1 surface-border p-fluid">
                                <div className="text-xs font-bold text-color-secondary uppercase mb-2">Formulir Pelunasan Kasir</div>

                                <div className="field mb-2">
                                    <label className="text-xs font-semibold">Metode Pembayaran</label>
                                    <Dropdown
                                        value={paymentMethod}
                                        options={[
                                            { label: 'Cash (Tunai)', value: 'cash' },
                                            { label: 'Kartu Debit / Kredit', value: 'card' },
                                            { label: 'Transfer Bank', value: 'transfer' },
                                            { label: 'QRIS / EDC', value: 'edc' }
                                        ]}
                                        onChange={(e) => setPaymentMethod(e.value)}
                                        className="w-full text-sm"
                                    />
                                    {paymentMethod === 'cash' && !shiftAktif && (
                                        <small className="p-error block mt-1">
                                            Shift kasir belum aktif! Buka shift di menu Shift Kasir untuk transaksi tunai.
                                        </small>
                                    )}
                                </div>

                                <div className="field mb-2">
                                    <label className="text-xs font-semibold">Nominal Pembayaran</label>
                                    <InputNumber
                                        value={paymentAmount}
                                        onValueChange={(e) => setPaymentAmount(e.value as number | null)}
                                        mode="currency"
                                        currency="IDR"
                                        locale="id-ID"
                                        placeholder="Jumlah bayar"
                                        className="w-full text-sm"
                                    />
                                </div>

                                {paymentMethod !== 'cash' && (
                                    <div className="field mb-0">
                                        <label className="text-xs font-semibold">No. Referensi / Transaksi (Opsional)</label>
                                        <InputText
                                            value={referenceNo}
                                            onChange={(e) => setReferenceNo(e.target.value)}
                                            placeholder="Cth: No Kartu / Trx ID / Approval Code"
                                            className="w-full text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Dialog>

            {/* Post-Checkout Success Dialog */}
            <Dialog
                visible={successDialogVisible}
                onHide={() => setSuccessDialogVisible(false)}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-check-circle text-green-600 text-2xl"></i>
                        <span className="font-bold text-lg">Checkout Berhasil Diproses</span>
                    </div>
                }
                style={{ width: '90vw', maxWidth: '520px' }}
                modal
                closable={false}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button
                            label="Lihat / Cetak Invoice"
                            icon="pi pi-print"
                            severity="success"
                            onClick={() => {
                                setSuccessDialogVisible(false);
                                setInvoiceModalVisible(true);
                            }}
                        />
                        <Button
                            label="Selesai"
                            icon="pi pi-times"
                            className="p-button-outlined"
                            onClick={() => setSuccessDialogVisible(false)}
                        />
                    </div>
                }
            >
                {lastCheckoutResult && (
                    <div className="flex flex-column gap-3 text-center py-2">
                        <div className="w-4rem h-4rem border-circle bg-green-100 text-green-600 flex align-items-center justify-content-center mx-auto">
                            <i className="pi pi-check text-3xl"></i>
                        </div>
                        <div>
                            <h5 className="font-bold text-900 m-0">
                                {lastCheckoutResult.room_count > 1
                                    ? `${lastCheckoutResult.room_count} Kamar Berhasil Checkout`
                                    : `Kamar ${lastCheckoutResult.nomor_kamar} Berhasil Checkout`}
                            </h5>
                            <span className="text-sm text-500">{lastCheckoutResult.guest_name}</span>
                        </div>

                        <div className="surface-50 border-1 surface-border border-round-xl p-3 text-left text-sm flex flex-column gap-2">
                            <div className="flex justify-content-between">
                                <span className="text-500">Nomor Invoice:</span>
                                <span className="font-bold text-900">{activeInvoiceNumber || 'Terdaftar'}</span>
                            </div>
                            <div className="flex justify-content-between">
                                <span className="text-500">Kode Folio:</span>
                                <span className="font-mono text-700">{lastCheckoutResult.kode_folio}</span>
                            </div>
                            <div className="flex justify-content-between">
                                <span className="text-500">Kamar Di-Checkout:</span>
                                <span className="font-semibold text-primary">{lastCheckoutResult.nomor_kamar}</span>
                            </div>
                            <div className="flex justify-content-between align-items-center">
                                <span className="text-500">Status Fisik Kamar:</span>
                                <Tag severity="warning" value="DIRTY / CLEANING" icon="pi pi-clock" />
                            </div>
                            <div className="flex justify-content-between align-items-center">
                                <span className="text-500">Tugas Housekeeping:</span>
                                <span className="text-xs text-green-700 font-semibold">
                                    <i className="pi pi-check-circle mr-1"></i>
                                    {lastCheckoutResult.room_count > 1
                                        ? `${lastCheckoutResult.room_count} Tugas Otomatis Dibuat`
                                        : 'Otomatis Ditugaskan'}
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-500 m-0">
                            Seluruh kamar yang dipilih telah dialihkan statusnya ke pembersihan Housekeeping dan saldo tagihan folio telah dituntaskan.
                        </p>
                    </div>
                )}
            </Dialog>

            {/* Official Invoice Dialog */}
            <DialogInvoice
                visible={invoiceModalVisible}
                onHide={() => setInvoiceModalVisible(false)}
                kodeFolio={activeInvoiceFolio}
                invoiceNumber={activeInvoiceNumber}
            />
        </div>
    );
};

export default CheckoutPage;
