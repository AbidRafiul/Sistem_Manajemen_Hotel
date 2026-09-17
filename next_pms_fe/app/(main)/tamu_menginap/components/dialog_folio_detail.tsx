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

interface DialogFolioDetailProps {
    visible: boolean;
    onHide: () => void;
    roomData: any;
}

export const DialogFolioDetail: React.FC<DialogFolioDetailProps> = ({ visible, onHide, roomData }) => {
    const [loading, setLoading] = useState(false);
    const [folioData, setFolioData] = useState<any>(null);
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
        <Dialog
            visible={visible}
            onHide={onHide}
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-receipt text-primary text-xl"></i>
                    <span className="font-bold text-lg">Kartu Tagihan Folio Tamu (Guest Folio)</span>
                </div>
            }
            style={{ width: '90vw', maxWidth: '950px' }}
            modal
            footer={
                <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                    <Button
                        label="Cetak Tagihan"
                        icon="pi pi-print"
                        className="p-button-outlined"
                        onClick={handlePrint}
                        disabled={loading || !folioData}
                    />
                    <Button label="Tutup" icon="pi pi-times" className="p-button-secondary" onClick={onHide} />
                </div>
            }
        >
            {loading && <ProgressBar mode="indeterminate" style={{ height: '4px' }} className="mb-3" />}

            {folioData && (
                <div ref={printRef} className="flex flex-column gap-3">
                    {/* Header Folio Card */}
                    <div className="surface-card border-round-xl border-1 surface-border p-3 shadow-1">
                        <div className="grid">
                            <div className="col-12 md:col-6">
                                <div className="text-xs text-color-secondary uppercase font-semibold">Tamu & Kamar</div>
                                <div className="text-xl font-bold text-900 mt-1">
                                    {header?.nomor_kamar ? `Kamar ${header.nomor_kamar}` : 'Kamar -'} ({header?.nama_tipe_kamar || 'Tipe Kamar'})
                                </div>
                                <div className="text-sm font-semibold text-700 mt-1">
                                    <i className="pi pi-user mr-1 text-color-secondary"></i>
                                    {header?.guest_name || '-'}
                                </div>
                                <div className="text-xs text-500 mt-1">
                                    <i className="pi pi-phone mr-1"></i>
                                    {header?.guest_phone || '-'}
                                </div>
                            </div>
                            <div className="col-12 md:col-6 text-left md:text-right flex flex-column justify-content-center">
                                <div className="text-xs text-color-secondary uppercase font-semibold">Nomor Folio</div>
                                <div className="text-lg font-bold text-primary mt-1 font-mono">
                                    {header?.kode_folio || '-'}
                                </div>
                                <div className="text-xs text-700 mt-1">
                                    Periode: <strong>{header?.check_in_date ? formatDateSystem(header.check_in_date, 'dd MMM yyyy') : '-'}</strong> s/d{' '}
                                    <strong>{header?.check_out_date ? formatDateSystem(header.check_out_date, 'dd MMM yyyy') : '-'}</strong>
                                </div>
                                <div className="mt-2">
                                    <Tag
                                        severity={isSettled ? 'success' : 'danger'}
                                        value={isSettled ? 'STATUS: LUNAS (SETTLED)' : `BELUM LUNAS (Rp ${(header?.balance || 0).toLocaleString('id-ID')})`}
                                        className="text-xs px-3 py-1 font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Daftar Tagihan (Charges) */}
                    <div className="surface-card border-round-xl border-1 surface-border p-3">
                        <div className="font-bold text-base text-900 mb-2 flex align-items-center gap-2">
                            <i className="pi pi-list text-primary"></i>
                            Rincian Tagihan Kamar & Layanan (Charges)
                        </div>
                        <DataTable value={charges} size="small" emptyMessage="Belum ada tagihan." responsiveLayout="scroll">
                            <Column
                                header="Waktu"
                                body={(rowData) => formatDateSystem(rowData.posted_at || rowData.created_at, 'dd/MM/yyyy HH:mm')}
                                style={{ width: '150px' }}
                            />
                            <Column
                                header="Kategori"
                                field="charge_type"
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
                                        className="text-xs"
                                    />
                                )}
                                style={{ width: '120px' }}
                            />
                            <Column header="Keterangan / Item" field="description" />
                            <Column
                                header="Qty"
                                field="qty"
                                body={(rowData) => `${rowData.qty || 1}x`}
                                style={{ width: '80px', textAlign: 'center' }}
                            />
                            <Column
                                header="Harga Satuan"
                                body={(rowData) => `Rp ${Number(rowData.unit_price || 0).toLocaleString('id-ID')}`}
                                style={{ width: '130px', textAlign: 'right' }}
                            />
                            <Column
                                header="Jumlah"
                                body={(rowData) => (
                                    <span className="font-semibold text-900">
                                        Rp {Number(rowData.amount || 0).toLocaleString('id-ID')}
                                    </span>
                                )}
                                style={{ width: '140px', textAlign: 'right' }}
                            />
                        </DataTable>
                    </div>

                    {/* Section 2: Daftar Pembayaran (Payments) */}
                    <div className="surface-card border-round-xl border-1 surface-border p-3">
                        <div className="font-bold text-base text-900 mb-2 flex align-items-center gap-2">
                            <i className="pi pi-wallet text-green-600"></i>
                            Riwayat Pembayaran Diterima (Payments)
                        </div>
                        <DataTable value={payments} size="small" emptyMessage="Belum ada pembayaran tercatat." responsiveLayout="scroll">
                            <Column
                                header="Waktu Bayar"
                                body={(rowData) => formatDateSystem(rowData.paid_at || rowData.created_at, 'dd/MM/yyyy HH:mm')}
                                style={{ width: '160px' }}
                            />
                            <Column
                                header="Metode"
                                field="payment_method"
                                body={(rowData) => (
                                    <Tag severity="success" value={rowData.payment_method?.toUpperCase()} className="text-xs font-semibold" />
                                )}
                                style={{ width: '120px' }}
                            />
                            <Column
                                header="No. Referensi / Shift"
                                body={(rowData) => (
                                    <span className="text-xs text-700">
                                        {rowData.reference_no || '-'} {rowData.kode_cashier_shift ? `(${rowData.kode_cashier_shift})` : ''}
                                    </span>
                                )}
                            />
                            <Column
                                header="Nominal Bayar"
                                body={(rowData) => (
                                    <span className="font-bold text-green-700">
                                        Rp {Number(rowData.amount || 0).toLocaleString('id-ID')}
                                    </span>
                                )}
                                style={{ width: '150px', textAlign: 'right' }}
                            />
                        </DataTable>
                    </div>

                    {/* Section 3: Summary Saldo */}
                    <div className="surface-card border-round-xl border-1 surface-border p-3 bg-bluegray-50">
                        <div className="flex justify-content-between align-items-center py-1">
                            <span className="text-sm text-700">Total Tagihan (Grand Total):</span>
                            <span className="text-base font-bold text-900">
                                Rp {Number(header?.grand_total || 0).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex justify-content-between align-items-center py-1 border-bottom-1 surface-border">
                            <span className="text-sm text-700">Total Pembayaran Masuk:</span>
                            <span className="text-base font-bold text-green-600">
                                - Rp {Number(header?.total_paid || 0).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex justify-content-between align-items-center pt-2">
                            <span className="text-base font-bold text-900">Sisa Tagihan (Saldo / Outstanding):</span>
                            <span className={`text-xl font-bold ${isSettled ? 'text-green-600' : 'text-red-600'}`}>
                                Rp {Number(header?.balance || 0).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </Dialog>
    );
};
export default DialogFolioDetail;
