'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import postData from '@/lib/axios/postData';
import { apiFolioDetail } from './endpoints';
import { formatDateSystem } from '@/lib/tools/dateTools';

import DialogInvoice from '@/app/components/dialogComponents/dialog_invoice';

interface DialogFolioDetailProps {
    visible: boolean;
    onHide: () => void;
    roomData: any;
}

export const DialogFolioDetail: React.FC<DialogFolioDetailProps> = ({ visible, onHide, roomData }) => {
    const [loading, setLoading] = useState(false);
    const [folioData, setFolioData] = useState<any>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const fetchFolioDetail = async () => {
        if (!roomData?.kode_reservasi_room && !roomData?.kode_folio) return;
        setLoading(true);
        try {
            const res = await postData(apiFolioDetail, {
                kode_reservasi_room: roomData.kode_reservasi_room,
                kode_folio: roomData.kode_folio
            });
            if (res?.data?.data) {
                setFolioData(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load folio details', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchFolioDetail();
        } else {
            setFolioData(null);
        }
    }, [visible, roomData]);

    const handlePrint = () => {
        window.print();
    };

    const header = folioData?.folio;
    const charges = folioData?.charges || [];
    const payments = folioData?.payments || [];

    const isSettled = (header?.balance || 0) <= 0;

    return (
        <>
            <Dialog
                visible={visible}
                onHide={onHide}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-receipt text-primary text-base"></i>
                        <span className="font-bold text-base text-900">Kartu Tagihan Folio Tamu (Guest Folio)</span>
                    </div>
                }
                style={{ width: '92vw', maxWidth: '820px' }}
                contentStyle={{ overflowX: 'hidden', padding: '1rem' }}
                modal
                footer={
                    <div className="flex justify-content-between align-items-center flex-wrap gap-2 pt-2">
                        <div className="flex gap-2">
                            <Button
                                label="Cetak Folio"
                                icon="pi pi-print"
                                size="small"
                                className="p-button-outlined text-xs"
                                onClick={handlePrint}
                                disabled={loading || !folioData}
                            />
                            <Button
                                label="Invoice Resmi"
                                icon="pi pi-file-pdf"
                                size="small"
                                severity="success"
                                className="text-xs"
                                onClick={() => setShowInvoiceModal(true)}
                                disabled={loading || !folioData}
                            />
                        </div>
                        <Button
                            label="Tutup"
                            icon="pi pi-times"
                            size="small"
                            className="p-button-secondary text-xs"
                            onClick={onHide}
                        />
                    </div>
                }
            >
                {loading && <ProgressBar mode="indeterminate" style={{ height: '3px' }} className="mb-2" />}

                {folioData && (
                    <div ref={printRef} className="flex flex-column gap-2 text-xs">
                        {/* Header Folio Card Compact */}
                        <div className="surface-card border-round-xl border-1 surface-border p-2 sm:p-3">
                            <div className="grid align-items-center">
                                <div className="col-12 sm:col-7">
                                    <div className="text-xs text-500 font-semibold uppercase">Tamu & Kamar (PIC)</div>
                                    <div className="text-base font-bold text-900 mt-1 flex align-items-center gap-2 flex-wrap">
                                        <span className="bg-primary-50 text-primary border-round px-2 py-0.5 font-bold">
                                            {folioData.rooms && folioData.rooms.length > 1
                                                ? `Kamar ${folioData.rooms.map((r: any) => r.nomor_kamar).join(', ')}`
                                                : header?.nomor_kamar
                                                ? `Kamar ${header.nomor_kamar}`
                                                : 'Kamar -'}
                                        </span>
                                        <span className="text-xs font-normal text-600">
                                            {folioData.rooms && folioData.rooms.length > 1
                                                ? [...new Set(folioData.rooms.map((r: any) => r.nama_tipe_kamar || r.nama_tipe))].join(', ')
                                                : header?.nama_tipe_kamar || 'Tipe Kamar'}
                                        </span>
                                    </div>
                                    <div className="text-xs font-semibold text-700 mt-1 flex align-items-center gap-2">
                                        <span>
                                            <i className="pi pi-user mr-1 text-400"></i>
                                            {header?.guest_name || '-'}
                                        </span>
                                        {header?.guest_phone && (
                                            <span className="text-500 font-normal">
                                                <i className="pi pi-phone mr-1 text-400"></i>
                                                {header.guest_phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12 sm:col-5 text-left sm:text-right">
                                    <div className="text-xs text-500 font-semibold uppercase">Nomor Folio</div>
                                    <div className="text-sm font-bold text-primary font-mono mt-0.5">
                                        {header?.kode_folio || '-'}
                                    </div>
                                    <div className="text-xs text-600 mt-0.5">
                                        {header?.check_in_date ? formatDateSystem(header.check_in_date, 'dd MMM yyyy') : '-'} s/d{' '}
                                        {header?.check_out_date ? formatDateSystem(header.check_out_date, 'dd MMM yyyy') : '-'}
                                    </div>
                                    <div className="mt-1">
                                        <Tag
                                            severity={isSettled ? 'success' : 'danger'}
                                            value={isSettled ? 'LUNAS (SETTLED)' : `BELUM LUNAS (Rp ${(header?.balance || 0).toLocaleString('id-ID')})`}
                                            className="text-xs px-2 py-0 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 0: Daftar Kamar Ditempati */}
                        {folioData.rooms && folioData.rooms.length > 0 && (
                            <div className="surface-card border-round-xl border-1 surface-border p-2 sm:p-3">
                                <div className="font-bold text-xs sm:text-sm text-900 mb-2 flex align-items-center gap-1.5">
                                    <i className="pi pi-home text-primary text-xs"></i>
                                    Daftar Kamar Ditempati ({folioData.rooms.length} Kamar)
                                </div>
                                <DataTable
                                    value={folioData.rooms}
                                    size="small"
                                    className="p-datatable-sm"
                                    responsiveLayout="scroll"
                                >
                                    <Column
                                        header="Kamar"
                                        align="left"
                                        alignHeader="left"
                                        headerStyle={{ width: '36%', textAlign: 'left' }}
                                        bodyStyle={{ width: '36%', textAlign: 'left' }}
                                        body={(rowData) => (
                                            <div className="flex align-items-center gap-2">
                                                <span className="w-1.5rem h-1.5rem border-round bg-primary-100 text-primary font-bold flex align-items-center justify-content-center text-xs">
                                                    {rowData.nomor_kamar}
                                                </span>
                                                <span className="font-semibold text-900 text-xs">
                                                    {rowData.nama_tipe_kamar || rowData.nama_tipe}
                                                </span>
                                            </div>
                                        )}
                                    />
                                    <Column
                                        header="Status"
                                        align="center"
                                        alignHeader="center"
                                        headerStyle={{ width: '20%', textAlign: 'center' }}
                                        bodyStyle={{ width: '20%', textAlign: 'center' }}
                                        body={(rowData) => (
                                            <Tag
                                                severity={
                                                    rowData.status_room === 'checked_in' || rowData.status === 'checked_in'
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                                value={
                                                    rowData.status_room === 'checked_in' || rowData.status === 'checked_in'
                                                        ? 'CHECKED IN'
                                                        : String(rowData.status_room || rowData.status || '-').toUpperCase()
                                                }
                                                className="text-xs py-0"
                                            />
                                        )}
                                    />
                                    <Column
                                        header="Tarif / Malam"
                                        align="right"
                                        alignHeader="right"
                                        headerStyle={{ width: '22%', textAlign: 'right' }}
                                        bodyStyle={{ width: '22%', textAlign: 'right' }}
                                        body={(rowData) => (
                                            <span className="text-xs">
                                                Rp {Number(rowData.rate_per_night || 0).toLocaleString('id-ID')}
                                            </span>
                                        )}
                                    />
                                    <Column
                                        header="Subtotal Sewa"
                                        align="right"
                                        alignHeader="right"
                                        headerStyle={{ width: '22%', textAlign: 'right' }}
                                        bodyStyle={{ width: '22%', textAlign: 'right' }}
                                        body={(rowData) => (
                                            <span className="font-bold text-900 text-xs">
                                                Rp {Number(rowData.subtotal || rowData.total_charges || rowData.rate_per_night || 0).toLocaleString('id-ID')}
                                            </span>
                                        )}
                                    />
                                </DataTable>
                            </div>
                        )}

                        {/* Section 1: Rincian Tagihan Layanan & Fasilitas (Charges) */}
                        <div className="surface-card border-round-xl border-1 surface-border p-2 sm:p-3">
                            <div className="font-bold text-xs sm:text-sm text-900 mb-2 flex align-items-center gap-1.5">
                                <i className="pi pi-list text-primary text-xs"></i>
                                Rincian Tagihan Layanan & Fasilitas Tambahan (Charges)
                            </div>
                            <DataTable
                                value={charges}
                                size="small"
                                className="p-datatable-sm"
                                emptyMessage="Belum ada tagihan fasilitas tambahan."
                                responsiveLayout="scroll"
                            >
                                <Column
                                    header="Waktu"
                                    align="left"
                                    alignHeader="left"
                                    headerStyle={{ width: '18%', textAlign: 'left' }}
                                    bodyStyle={{ width: '18%', textAlign: 'left' }}
                                    body={(rowData) => (
                                        <span className="text-xs text-600">
                                            {formatDateSystem(rowData.posted_at || rowData.created_at, 'dd/MM/yyyy HH:mm')}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Kategori"
                                    align="center"
                                    alignHeader="center"
                                    headerStyle={{ width: '14%', textAlign: 'center' }}
                                    bodyStyle={{ width: '14%', textAlign: 'center' }}
                                    body={(rowData) => (
                                        <Tag
                                            severity={
                                                rowData.charge_type === 'room'
                                                    ? 'info'
                                                    : rowData.charge_type === 'restaurant'
                                                    ? 'warning'
                                                    : rowData.charge_type === 'laundry'
                                                    ? 'contrast'
                                                    : 'secondary'
                                            }
                                            value={rowData.charge_type?.toUpperCase()}
                                            className="text-xs py-0"
                                        />
                                    )}
                                />
                                <Column
                                    header="Keterangan / Item"
                                    field="description"
                                    align="left"
                                    alignHeader="left"
                                    headerStyle={{ width: '36%', textAlign: 'left' }}
                                    bodyStyle={{ width: '36%', textAlign: 'left' }}
                                    body={(rowData) => (
                                        <span className="font-medium text-800 text-xs">
                                            {rowData.description}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Qty"
                                    field="qty"
                                    align="center"
                                    alignHeader="center"
                                    headerStyle={{ width: '8%', textAlign: 'center' }}
                                    bodyStyle={{ width: '8%', textAlign: 'center' }}
                                    body={(rowData) => (
                                        <span className="text-xs">{rowData.qty || 1}x</span>
                                    )}
                                />
                                <Column
                                    header="Harga Satuan"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '12%', textAlign: 'right' }}
                                    bodyStyle={{ width: '12%', textAlign: 'right' }}
                                    body={(rowData) => (
                                        <span className="text-xs text-700">
                                            Rp {Number(rowData.unit_price || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Jumlah"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '12%', textAlign: 'right' }}
                                    bodyStyle={{ width: '12%', textAlign: 'right' }}
                                    body={(rowData) => (
                                        <span className="font-bold text-900 text-xs">
                                            Rp {Number(rowData.amount || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                            </DataTable>
                        </div>

                        {/* Section 2: Riwayat Pembayaran (Payments) */}
                        <div className="surface-card border-round-xl border-1 surface-border p-2 sm:p-3">
                            <div className="font-bold text-xs sm:text-sm text-900 mb-2 flex align-items-center gap-1.5">
                                <i className="pi pi-wallet text-green-600 text-xs"></i>
                                Riwayat Pembayaran Diterima (Payments)
                            </div>
                            <DataTable
                                value={payments}
                                size="small"
                                className="p-datatable-sm"
                                emptyMessage="Belum ada pembayaran tercatat."
                                responsiveLayout="scroll"
                            >
                                <Column
                                    header="Waktu Bayar"
                                    align="left"
                                    alignHeader="left"
                                    headerStyle={{ width: '22%', textAlign: 'left' }}
                                    bodyStyle={{ width: '22%', textAlign: 'left' }}
                                    body={(rowData) => (
                                        <span className="text-xs text-600">
                                            {formatDateSystem(rowData.paid_at || rowData.created_at, 'dd/MM/yyyy HH:mm')}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Metode"
                                    align="center"
                                    alignHeader="center"
                                    headerStyle={{ width: '18%', textAlign: 'center' }}
                                    bodyStyle={{ width: '18%', textAlign: 'center' }}
                                    body={(rowData) => (
                                        <Tag
                                            severity="success"
                                            value={rowData.payment_method?.toUpperCase()}
                                            className="text-xs py-0 font-semibold"
                                        />
                                    )}
                                />
                                <Column
                                    header="No. Referensi / Shift"
                                    align="left"
                                    alignHeader="left"
                                    headerStyle={{ width: '38%', textAlign: 'left' }}
                                    bodyStyle={{ width: '38%', textAlign: 'left' }}
                                    body={(rowData) => (
                                        <span className="text-xs text-700">
                                            {rowData.reference_no || '-'} {rowData.kode_cashier_shift ? `(${rowData.kode_cashier_shift})` : ''}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Nominal Bayar"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '22%', textAlign: 'right' }}
                                    bodyStyle={{ width: '22%', textAlign: 'right' }}
                                    body={(rowData) => (
                                        <span className="font-bold text-green-700 text-xs">
                                            Rp {Number(rowData.amount || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                            </DataTable>
                        </div>

                        {/* Section 3: Summary Saldo Compact */}
                        <div className="surface-card border-round-xl border-1 surface-border p-2 sm:p-3 bg-bluegray-50">
                            <div className="flex justify-content-between align-items-center py-0.5">
                                <span className="text-xs text-700">Total Tagihan (Grand Total):</span>
                                <span className="text-xs font-bold text-900">
                                    Rp {Number(header?.grand_total || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-content-between align-items-center py-0.5 border-bottom-1 surface-border">
                                <span className="text-xs text-700">Total Pembayaran Masuk:</span>
                                <span className="text-xs font-bold text-green-600">
                                    - Rp {Number(header?.total_paid || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-content-between align-items-center pt-1.5">
                                <span className="text-xs font-bold text-900">Sisa Tagihan (Saldo / Outstanding):</span>
                                <span className={`text-base font-bold ${isSettled ? 'text-green-600' : 'text-red-600'}`}>
                                    Rp {Number(header?.balance || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>

            <DialogInvoice
                visible={showInvoiceModal}
                onHide={() => setShowInvoiceModal(false)}
                kodeFolio={header?.kode_folio || roomData?.kode_folio}
                kodeReservasi={header?.kode_reservasi || roomData?.kode_reservasi}
            />
        </>
    );
};

export default DialogFolioDetail;
