'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { useReactToPrint } from 'react-to-print';
import postData from '@/lib/axios/postData';
import CetakInvoiceHotel from '@/app/components/printComponents/cetakInvoiceHotel';

interface DialogInvoiceProps {
    visible: boolean;
    onHide: () => void;
    kode_folio?: string;
    kodeFolio?: string;
    kode_reservation?: string;
    kodeReservasi?: string;
    kode_reservasi_room?: string;
    invoiceNumber?: string;
}

export const DialogInvoice: React.FC<DialogInvoiceProps> = ({
    visible,
    onHide,
    kode_folio,
    kodeFolio,
    kode_reservation,
    kodeReservasi,
    kode_reservasi_room,
    invoiceNumber
}) => {
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const printRef = useRef<HTMLDivElement>(null);

    const handleTriggerPrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: invoiceData?.invoice_number ? `Invoice-${invoiceData.invoice_number}` : 'Invoice-Hotel'
    });

    const targetFolio = kode_folio || kodeFolio;
    const targetResv = kode_reservation || kodeReservasi;

    const loadInvoice = async () => {
        if (!targetFolio && !targetResv && !kode_reservasi_room) return;
        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await postData('/reservasi/invoice/invoice-detail', {
                kode_folio: targetFolio,
                kode_reservasi: targetResv,
                kode_reservasi_room: kode_reservasi_room
            });
            if (res?.data?.data) {
                setInvoiceData(res.data.data);
            }
        } catch (e: any) {
            setErrorMsg(e?.response?.data?.message || e.message || 'Gagal memuat dokumen invoice.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            loadInvoice();
        } else {
            setInvoiceData(null);
            setErrorMsg(null);
        }
    }, [visible, targetFolio, targetResv, kode_reservasi_room]);

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-receipt text-primary text-xl"></i>
                    <span className="font-bold text-lg">Cetak Dokumen Invoice Hotel</span>
                </div>
            }
            style={{ width: '92vw', maxWidth: '850px' }}
            modal
            footer={
                <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                    <Button
                        label="Cetak Invoice (Nota)"
                        icon="pi pi-print"
                        severity="success"
                        onClick={() => handleTriggerPrint()}
                        disabled={loading || !invoiceData}
                    />
                    <Button label="Tutup" icon="pi pi-times" className="p-button-secondary" onClick={onHide} />
                </div>
            }
        >
            {loading && <ProgressBar mode="indeterminate" style={{ height: '4px' }} className="mb-3" />}

            {errorMsg && (
                <div className="p-4 bg-red-50 text-red-700 border-round border-1 border-red-200 mb-3">
                    <i className="pi pi-exclamation-triangle mr-2"></i>
                    {errorMsg}
                </div>
            )}

            {invoiceData && (
                <div className="surface-border border-1 border-round-xl overflow-x-auto shadow-1 bg-white">
                    <CetakInvoiceHotel ref={printRef} data={invoiceData} />
                </div>
            )}
        </Dialog>
    );
};

export default DialogInvoice;
