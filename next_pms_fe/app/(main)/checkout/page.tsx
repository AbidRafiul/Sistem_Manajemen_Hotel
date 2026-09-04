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
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { apiCheckoutSearch, apiCheckoutSubmit, apiShiftCurrent } from './components/endpoints';

const CheckoutPage = () => {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [submitLoad, setSubmitLoad] = useState(false);
    
    const [rooms, setRooms] = useState<any[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [shiftAktif, setShiftAktif] = useState<any>(null);
    
    // Payment form state
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
    const [referenceNo, setReferenceNo] = useState('');

    const fetchShift = async () => {
        try {
            const res = await postData(apiShiftCurrent, {});
            setShiftAktif(res.data.data);
        } catch (error) {
            console.error("Failed to fetch shift", error);
        }
    };

    const searchRooms = async (keyword: string = '') => {
        setLoading(true);
        try {
            const res = await postData(apiCheckoutSearch, { keyword });
            setRooms(res.data.data);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal mencari kamar');
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
        }, 500);
    };

    const handleCheckout = async (withPayment: boolean = false) => {
        if (!selectedRoom) return;
        
        if (withPayment && paymentMethod === 'cash' && !shiftAktif) {
            showError(toast, 'Shift kasir belum dibuka. Buka shift terlebih dahulu untuk pembayaran cash.');
            return;
        }

        if (withPayment && (!paymentAmount || paymentAmount <= 0)) {
            showError(toast, 'Nominal pembayaran tidak valid');
            return;
        }

        setSubmitLoad(true);
        try {
            const payload: any = {
                kode_reservasi_room: selectedRoom.kode_reservasi_room
            };
            
            if (withPayment) {
                payload.payment = [
                    {
                        payment_method: paymentMethod,
                        amount: paymentAmount,
                        kode_cashier_shift: paymentMethod === 'cash' ? shiftAktif.kode_cashier_shift : undefined,
                        reference_no: referenceNo
                    }
                ];
            }

            const res = await postData(apiCheckoutSubmit, payload);
            showSuccess(toast, 'Checkout berhasil diproses!');
            setSelectedRoom(null);
            setPaymentAmount(null);
            setReferenceNo('');
            searchRooms(); // refresh table
            
        } catch (error: any) {
            const errMsg = error?.response?.data?.message || 'Gagal memproses checkout';
            showError(toast, errMsg);
            
            // Auto-fill amount if the error tells us the outstanding
            if (errMsg.includes("belum lunas: Rp")) {
                const match = errMsg.match(/Rp\s*([\d\.,]+)/);
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

    const formatCurrency = (val: number | string) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(val));
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12 md:col-7">
                <div className="card">
                    <h5>Cari Kamar Checkout</h5>
                    
                    <div className="mb-4">
                        <span className="p-input-icon-left w-full">
                            <IconField iconPosition="left">
                                <InputIcon className="pi pi-search" />
                                <InputText
                                    value={searchKeyword}
                                    className="w-full"
                                    placeholder="Cari No Kamar atau Nama Tamu..."
                                    onChange={handleSearchChange}
                                />
                            </IconField>
                        </span>
                    </div>

                    <DataTable
                        value={rooms}
                        loading={loading}
                        emptyMessage="Tidak ada kamar occupied yang ditemukan."
                        selectionMode="single"
                        selection={selectedRoom}
                        onSelectionChange={(e) => {
                            setSelectedRoom(e.value);
                            setPaymentAmount(null); // reset form when selecting another room
                        }}
                        dataKey="kode_reservasi_room"
                        paginator
                        rows={10}
                        stripedRows
                        className="p-datatable-sm"
                    >
                        <Column field="kode_kamar" header="Kamar" style={{ width: '15%' }}></Column>
                        <Column field="guest_name" header="Nama Tamu" style={{ width: '35%' }}></Column>
                        <Column field="current_grand_total" header="Tagihan Smtr" body={(rowData) => formatCurrency(rowData.current_grand_total)}></Column>
                        <Column 
                            header="Check In" 
                            body={(rowData) => formatDateSystem(rowData.check_in_date, "dd-MM-yyyy HH:mm")}
                        ></Column>
                    </DataTable>
                </div>
            </div>

            <div className="col-12 md:col-5">
                <div className="card h-full">
                    <h5>Detail Checkout</h5>
                    
                    {!selectedRoom ? (
                        <div className="flex flex-column align-items-center justify-content-center text-center p-5 border-dashed border-round surface-border">
                            <i className="pi pi-check-square text-4xl text-500 mb-3"></i>
                            <p className="m-0 text-500">Pilih kamar dari tabel di samping untuk melanjutkan proses checkout.</p>
                        </div>
                    ) : (
                        <div className="flex flex-column gap-3">
                            <div className="surface-100 p-3 border-round mb-2">
                                <div className="flex justify-content-between mb-2">
                                    <span className="text-secondary">Kamar</span>
                                    <span className="font-bold">{selectedRoom.kode_kamar}</span>
                                </div>
                                <div className="flex justify-content-between mb-2">
                                    <span className="text-secondary">Tamu</span>
                                    <span className="font-bold">{selectedRoom.guest_name}</span>
                                </div>
                                <div className="flex justify-content-between mb-2">
                                    <span className="text-secondary">Folio</span>
                                    <span className="font-bold">{selectedRoom.kode_folio}</span>
                                </div>
                                <div className="flex justify-content-between mb-2">
                                    <span className="text-secondary">Subtotal Kamar (Exc. Tax)</span>
                                    <span className="font-bold">{formatCurrency(selectedRoom.current_grand_total)}</span>
                                </div>
                                <div className="text-xs text-orange-500 mt-2">
                                    * Pajak & Service Charge akan dihitung final oleh sistem saat checkout.
                                </div>
                            </div>

                            <Button 
                                label="Proses Checkout (Tanpa Tambahan Bayar)" 
                                icon="pi pi-sign-out" 
                                severity="warning"
                                onClick={() => handleCheckout(false)} 
                                loading={submitLoad}
                                tooltip="Gunakan ini jika tagihan sudah lunas via deposit."
                                tooltipOptions={{ position: 'top' }}
                            />
                            
                            <div className="flex align-items-center my-2">
                                <div className="border-top-1 surface-border flex-1"></div>
                                <span className="px-3 text-500 text-sm">Atau Lunasi Tagihan</span>
                                <div className="border-top-1 surface-border flex-1"></div>
                            </div>

                            <div className="p-fluid">
                                <div className="field">
                                    <label>Metode Pembayaran</label>
                                    <Dropdown
                                        value={paymentMethod}
                                        options={[
                                            { label: 'Cash', value: 'cash' },
                                            { label: 'Credit/Debit Card', value: 'card' },
                                            { label: 'Transfer Bank', value: 'transfer' },
                                            { label: 'EDC', value: 'edc' }
                                        ]}
                                        onChange={(e) => setPaymentMethod(e.value)}
                                    />
                                    {paymentMethod === 'cash' && !shiftAktif && (
                                        <small className="p-error block mt-1">Shift kasir belum aktif! Buka shift di menu Shift Kasir.</small>
                                    )}
                                </div>
                                
                                <div className="field">
                                    <label>Nominal Pembayaran</label>
                                    <InputNumber
                                        value={paymentAmount}
                                        onValueChange={(e) => setPaymentAmount(e.value as number | null)}
                                        mode="currency"
                                        currency="IDR"
                                        locale="id-ID"
                                        placeholder="Masukkan jumlah"
                                    />
                                </div>
                                
                                {paymentMethod !== 'cash' && (
                                    <div className="field">
                                        <label>No. Referensi (Opsional)</label>
                                        <InputText
                                            value={referenceNo}
                                            onChange={(e) => setReferenceNo(e.target.value)}
                                            placeholder="Cth: No Kartu / Trx ID"
                                        />
                                    </div>
                                )}
                            </div>

                            <Button 
                                label="Bayar & Checkout" 
                                icon="pi pi-check" 
                                severity="success"
                                onClick={() => handleCheckout(true)} 
                                loading={submitLoad}
                                disabled={paymentMethod === 'cash' && !shiftAktif}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
