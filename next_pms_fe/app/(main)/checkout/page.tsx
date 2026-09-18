'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import { TabView, TabPanel } from 'primereact/tabview';
import { useRouter } from 'next/navigation';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { apiCheckoutSearch, apiCheckoutSubmit, apiShiftCurrent } from './components/endpoints';
import DialogInvoice from '@/app/components/dialogComponents/dialog_invoice';

const CheckoutPage = () => {
    const toast = useRef<Toast>(null);
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [submitLoad, setSubmitLoad] = useState(false);

    const [rooms, setRooms] = useState<any[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
    const [shiftAktif, setShiftAktif] = useState<any>(null);

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
            const res = await postData(apiCheckoutSearch, { keyword });
            const list = res?.data?.data || [];
            setRooms(list);

            // If selectedRoom is still open, re-sync its data
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
        searchRooms();
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchKeyword(val);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            searchRooms(val);
        }, 400);
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
                kode_reservasi_room: targetIds[0]
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
    const totalRoomsUnderFolio = selectedRoom?.rooms?.length || 1;

    return (
        <div className="grid">
            <Toast ref={toast} />

            {/* Header Title Card (Without redundant KPI cards) */}
            <div className="col-12">
                <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border mb-3">
                    <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
                        <div>
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-sign-out text-primary text-2xl"></i>
                                <span className="text-2xl font-bold text-900">Checkout & Penyelesaian Tagihan</span>
                            </div>
                            <span className="text-sm text-color-secondary mt-1 block">
                                Periksa rincian kamar, selesaikan tagihan/piutang akhir, terbitkan invoice resmi, dan delegasikan pembersihan ke tim Housekeeping.
                            </span>
                        </div>
                        <div className="flex align-items-center gap-2 flex-wrap">
                            <Button
                                label="Segarkan Data"
                                icon="pi pi-refresh"
                                className="p-button-outlined p-button-sm"
                                onClick={() => searchRooms(searchKeyword)}
                                loading={loading}
                            />
                            <Button
                                label="Daftar Tamu Menginap"
                                icon="pi pi-users"
                                className="p-button-outlined p-button-sm"
                                onClick={() => router.push('/tamu_menginap')}
                            />
                            <Button
                                label="Dashboard Reservasi"
                                icon="pi pi-th-large"
                                className="p-button-outlined p-button-sm"
                                onClick={() => router.push('/reservasi_dashboard')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Layout: Left Table & Right Details */}
            <div className="col-12 lg:col-7">
                <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border h-full">
                    <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-2 mb-3">
                        <div>
                            <h5 className="m-0 font-bold text-900">Daftar Folio & Kamar Aktif In-House</h5>
                            <span className="text-xs text-color-secondary">Pilih folio tamu untuk memproses checkout tunggal maupun multiple kamar sekaligus.</span>
                        </div>
                        <div className="w-full sm:w-auto">
                            <IconField iconPosition="left">
                                <InputIcon className="pi pi-search" />
                                <InputText
                                    value={searchKeyword}
                                    className="w-full sm:w-16rem text-sm"
                                    placeholder="Cari kamar / nama tamu..."
                                    onChange={handleSearchChange}
                                />
                            </IconField>
                        </div>
                    </div>

                    <DataTable
                        value={rooms}
                        loading={loading}
                        emptyMessage="Tidak ada kamar occupied yang ditemukan."
                        selectionMode="single"
                        selection={selectedRoom}
                        onSelectionChange={(e) => handleSelectRoom(e.value)}
                        dataKey="kode_folio"
                        paginator
                        rows={10}
                        stripedRows
                        className="p-datatable-sm"
                        rowClassName={(data: any) => (selectedRoom?.kode_folio === data?.kode_folio ? 'surface-100 font-semibold' : '')}
                    >
                        <Column
                            field="nomor_kamar"
                            header="Kamar"
                            body={(rowData) => {
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
                            }}
                            style={{ minWidth: '160px' }}
                        />
                        <Column
                            field="guest_name"
                            header="Tamu & PIC"
                            body={(rowData) => (
                                <div>
                                    <div className="font-semibold text-900">{rowData.guest_name}</div>
                                    <div className="text-xs text-500">{rowData.guest_phone || '-'}</div>
                                </div>
                            )}
                            style={{ minWidth: '150px' }}
                        />
                        <Column
                            header="Jadwal Stay"
                            body={(rowData) => (
                                <div className="text-xs">
                                    <div>In: {formatDateSystem(rowData.check_in_date, 'dd/MM/yyyy HH:mm')}</div>
                                    <div className="text-500">Out: {formatDateSystem(rowData.check_out_date, 'dd/MM/yyyy HH:mm')}</div>
                                </div>
                            )}
                            style={{ minWidth: '140px' }}
                        />
                        <Column
                            header="Status Tagihan"
                            body={(rowData) => {
                                const isSettled = rowData.is_settled || Number(rowData.balance || 0) <= 0;
                                return isSettled ? (
                                    <Tag severity="success" value="LUNAS" icon="pi pi-check" />
                                ) : (
                                    <div className="flex flex-column align-items-start gap-1">
                                        <Tag severity="danger" value="BELUM LUNAS" icon="pi pi-exclamation-circle" />
                                        <span className="text-xs font-bold text-red-600">
                                            {formatCurrency(rowData.balance)}
                                        </span>
                                    </div>
                                );
                            }}
                            style={{ minWidth: '130px' }}
                        />
                        <Column
                            header="Aksi"
                            body={(rowData) => (
                                <Button
                                    label="Pilih"
                                    icon="pi pi-arrow-right"
                                    className="p-button-text p-button-sm font-semibold"
                                    onClick={() => handleSelectRoom(rowData)}
                                />
                            )}
                            style={{ width: '80px', textAlign: 'center' }}
                        />
                    </DataTable>
                </div>
            </div>

            {/* Right Panel: Folio Checkout Details & Action */}
            <div className="col-12 lg:col-5">
                <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border h-full flex flex-column justify-content-between">
                    {!selectedRoom ? (
                        <div className="flex flex-column align-items-center justify-content-center text-center p-6 border-dashed border-round surface-border my-auto">
                            <div className="w-4rem h-4rem border-circle bg-blue-50 text-blue-600 flex align-items-center justify-content-center mb-3">
                                <i className="pi pi-check-square text-3xl"></i>
                            </div>
                            <h6 className="font-bold text-900 m-0 mb-1">Belum Ada Folio Terpilih</h6>
                            <p className="m-0 text-500 text-sm max-w-20rem">
                                Klik tombol &quot;Pilih&quot; pada salah satu baris di tabel sebelah kiri untuk memuat rincian tagihan, daftar kamar, dan formulir checkout.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-column gap-3">
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
                                        {/* Room charges */}
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

                                        {/* Extra charges */}
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

                                        {/* Taxes */}
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

                            {/* Dynamic Action Section based on Settlement */}
                            {isSelectedSettled ? (
                                <div className="flex flex-column gap-2 mt-2">
                                    <Button
                                        label={
                                            selectedRoomIds.length > 1
                                                ? `Konfirmasi Checkout (${selectedRoomIds.length} Kamar Sekaligus)`
                                                : `Konfirmasi Checkout (Kamar ${selectedRoom.nomor_kamar})`
                                        }
                                        icon="pi pi-check"
                                        severity="success"
                                        size="large"
                                        onClick={() => handleCheckout(false)}
                                        loading={submitLoad}
                                        disabled={selectedRoomIds.length === 0}
                                    />
                                    <Button
                                        label="Pratinjau / Cetak Invoice"
                                        icon="pi pi-file-pdf"
                                        className="p-button-outlined"
                                        onClick={() => {
                                            setActiveInvoiceFolio(selectedRoom.kode_folio);
                                            setActiveInvoiceNumber(selectedRoom.invoice_number || '');
                                            setInvoiceModalVisible(true);
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-column gap-2 mt-2">
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

                                    <Button
                                        label={
                                            selectedRoomIds.length > 1
                                                ? `Bayar ${formatCurrency(paymentAmount || selectedBalance)} & Checkout (${selectedRoomIds.length} Kamar)`
                                                : `Bayar ${formatCurrency(paymentAmount || selectedBalance)} & Checkout`
                                        }
                                        icon="pi pi-credit-card"
                                        severity="warning"
                                        size="large"
                                        onClick={() => handleCheckout(true)}
                                        loading={submitLoad}
                                        disabled={(paymentMethod === 'cash' && !shiftAktif) || selectedRoomIds.length === 0}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

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
