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
                        <span className="font-bold text-base text-900">Rincian Folio & Tagihan Tamu</span>
                    </div>
                }
                style={{ width: '92vw', maxWidth: '600px' }}
                contentStyle={{ overflowX: 'hidden', padding: '1rem' }}
                modal
                footer={
                    <div className="flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top-1 surface-border">
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
                    <div ref={printRef} className="flex flex-column gap-2.5">
                        {/* 1. Header Card: Compact & Proporsional */}
                        <div className="surface-card border-round-xl border-1 surface-border p-3">
                            <div className="flex justify-content-between align-items-start gap-2">
                                <div>
                                    <div className="flex align-items-center gap-2">
                                        <span className="bg-primary text-white font-bold border-round px-2 py-1 text-xs">
                                            {folioData.rooms && folioData.rooms.length > 1
                                                ? `Kamar ${folioData.rooms.map((r: any) => r.nomor_kamar).join(', ')}`
                                                : header?.nomor_kamar
                                                ? `Kamar ${header.nomor_kamar}`
                                                : 'Kamar -'}
                                        </span>
                                        <span className="font-semibold text-sm text-900">
                                            {header?.nama_tipe_kamar || 'Tipe Kamar'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-700 mt-1.5 flex align-items-center gap-2">
                                        <span>
                                            <i className="pi pi-user mr-1 text-500 text-xs"></i>
                                            {header?.guest_name || '-'}
                                        </span>
                                        {header?.guest_phone && (
                                            <span className="text-xs text-500 font-normal">
                                                ({header.guest_phone})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-xs text-500 font-mono font-semibold">
                                        {header?.kode_folio || '-'}
                                    </div>
                                    <div className="text-xs text-600 mt-0.5">
                                        {header?.check_in_date ? formatDateSystem(header.check_in_date, 'dd MMM') : '-'} –{' '}
                                        {header?.check_out_date ? formatDateSystem(header.check_out_date, 'dd MMM yyyy') : '-'}
                                    </div>
                                    <div className="mt-1">
                                        <Tag
                                            severity={isSettled ? 'success' : 'danger'}
                                            value={isSettled ? 'LUNAS' : 'BELUM LUNAS'}
                                            className="text-xs px-2 py-0 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Rincian Tagihan (Charges) - Tabel Presisi & Terpadu */}
                        <div className="surface-card border-round-xl border-1 surface-border p-3">
                            <div className="font-bold text-sm text-900 mb-2 flex align-items-center gap-1.5">
                                <i className="pi pi-list text-primary text-xs"></i>
                                Rincian Biaya Sewa & Layanan ({charges.length} Item)
                            </div>
                            <DataTable
                                value={charges}
                                size="small"
                                className="p-datatable-sm"
                                emptyMessage="Belum ada tagihan."
                                responsiveLayout="scroll"
                            >
                                <Column
                                    header="Keterangan / Layanan"
                                    align="left"
                                    alignHeader="left"
                                    headerStyle={{ width: '48%', textAlign: 'left' }}
                                    bodyStyle={{ width: '48%', textAlign: 'left' }}
                                    body={(rowData) => (
                                        <div>
                                            <div className="font-semibold text-sm text-900 line-height-2">
                                                {rowData.description}
                                            </div>
                                            <div className="text-xs text-500 flex align-items-center gap-1 mt-0.5">
                                                <span>{formatDateSystem(rowData.posted_at || rowData.created_at, 'dd/MM HH:mm')}</span>
                                                <span>•</span>
                                                <span className="uppercase text-primary font-semibold">{rowData.charge_type}</span>
                                            </div>
                                        </div>
                                    )}
                                />
                                <Column
                                    header="Qty"
                                    field="qty"
                                    align="center"
                                    alignHeader="center"
                                    headerStyle={{ width: '12%', textAlign: 'center' }}
                                    bodyStyle={{ width: '12%', textAlign: 'center' }}
                                    body={(rowData) => (
                                        <span className="font-semibold text-sm text-700">{rowData.qty || 1}x</span>
                                    )}
                                />
                                <Column
                                    header="Tarif Satuan"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '20%', textAlign: 'right' }}
                                    bodyStyle={{ width: '20%', textAlign: 'right' }}
                                    body={(rowData) => (
                                        <span className="text-sm text-700">
                                            Rp {Number(rowData.unit_price || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Subtotal"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '20%', textAlign: 'right' }}
                                    bodyStyle={{ width: '20%', textAlign: 'right' }}
                                    body={(rowData) => (
                                        <span className="font-bold text-sm text-900">
                                            Rp {Number(rowData.amount || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                            </DataTable>
                        </div>

                        {/* 3. Riwayat Pembayaran (Payments) */}
                        <div className="surface-card border-round-xl border-1 surface-border p-3">
                            <div className="font-bold text-sm text-900 mb-2 flex align-items-center gap-1.5">
                                <i className="pi pi-wallet text-green-600 text-xs"></i>
                                Riwayat Pembayaran Diterima
                            </div>
                            {payments.length > 0 ? (
                                <DataTable
                                    value={payments}
                                    size="small"
                                    className="p-datatable-sm"
                                    responsiveLayout="scroll"
                                >
                                    <Column
                                        header="Waktu"
                                        align="left"
                                        alignHeader="left"
                                        headerStyle={{ width: '30%', textAlign: 'left' }}
                                        bodyStyle={{ width: '30%', textAlign: 'left' }}
                                        body={(rowData) => (
                                            <span className="text-xs text-700">
                                                {formatDateSystem(rowData.paid_at || rowData.created_at, 'dd/MM/yyyy HH:mm')}
                                            </span>
                                        )}
                                    />
                                    <Column
                                        header="Metode"
                                        align="center"
                                        alignHeader="center"
                                        headerStyle={{ width: '25%', textAlign: 'center' }}
                                        bodyStyle={{ width: '25%', textAlign: 'center' }}
                                        body={(rowData) => (
                                            <Tag
                                                severity="success"
                                                value={rowData.payment_method?.toUpperCase()}
                                                className="text-xs py-0 font-semibold"
                                            />
                                        )}
                                    />
                                    <Column
                                        header="Ref / Shift"
                                        align="left"
                                        alignHeader="left"
                                        headerStyle={{ width: '20%', textAlign: 'left' }}
                                        bodyStyle={{ width: '20%', textAlign: 'left' }}
                                        body={(rowData) => (
                                            <span className="text-xs text-600">
                                                {rowData.reference_no || rowData.kode_cashier_shift || '-'}
                                            </span>
                                        )}
                                    />
                                    <Column
                                        header="Nominal"
                                        align="right"
                                        alignHeader="right"
                                        headerStyle={{ width: '25%', textAlign: 'right' }}
                                        bodyStyle={{ width: '25%', textAlign: 'right' }}
                                        body={(rowData) => (
                                            <span className="font-bold text-green-700 text-sm">
                                                Rp {Number(rowData.amount || 0).toLocaleString('id-ID')}
                                            </span>
                                        )}
                                    />
                                </DataTable>
                            ) : (
                                <div className="surface-50 border-round-lg p-2.5 text-center text-xs text-500">
                                    Belum ada transaksi pembayaran masuk pada folio ini.
                                </div>
                            )}
                        </div>

                        {/* 4. Ringkasan Saldo Akhir */}
                        <div className="surface-card border-round-xl border-1 surface-border p-3 bg-bluegray-50">
                            <div className="flex justify-content-between align-items-center py-1">
                                <span className="text-xs font-medium text-600">Total Biaya & Sewa:</span>
                                <span className="text-sm font-semibold text-900">
                                    Rp {Number(header?.grand_total || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-content-between align-items-center py-1 border-bottom-1 surface-border">
                                <span className="text-xs font-medium text-600">Pembayaran Diterima:</span>
                                <span className="text-sm font-semibold text-green-600">
                                    - Rp {Number(header?.total_paid || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-content-between align-items-center pt-2">
                                <span className="text-sm font-bold text-900">Sisa Saldo Tagihan:</span>
                                <span className={`text-lg font-bold ${isSettled ? 'text-green-600' : 'text-red-600'}`}>
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
