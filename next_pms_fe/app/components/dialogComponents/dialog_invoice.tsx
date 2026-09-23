'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { SelectButton } from 'primereact/selectbutton';
import { useReactToPrint } from 'react-to-print';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import CetakInvoiceHotel from '@/app/components/printComponents/cetakInvoiceHotel';
import CetakInvoiceThermal from '@/app/components/printComponents/CetakInvoiceThermal';

interface DialogInvoiceProps {
    visible: boolean;
    onHide: () => void;
    kode_folio?: string;
    kodeFolio?: string;
    kode_reservation?: string;
    kodeReservasi?: string;
    kode_reservasi_room?: string;
    invoiceNumber?: string;
    autoPrint?: boolean;
    defaultMode?: 'thermal' | 'a4';
}

export const DialogInvoice: React.FC<DialogInvoiceProps> = ({
    visible,
    onHide,
    kode_folio,
    kodeFolio,
    kode_reservation,
    kodeReservasi,
    kode_reservasi_room,
    invoiceNumber,
    autoPrint = false,
    defaultMode = 'thermal'
}) => {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [printMode, setPrintMode] = useState<'thermal' | 'a4'>(defaultMode);
    const hasAutoPrintedRef = useRef(false);

    const printRef = useRef<HTMLDivElement>(null);

    const handleTriggerPrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: invoiceData?.invoice_number
            ? `${printMode === 'thermal' ? 'Struk' : 'Invoice'}-${invoiceData.invoice_number}`
            : 'Struk-Hotel',
        pageStyle: printMode === 'thermal'
            ? `
                @page {
                    size: 80mm auto;
                    margin: 0mm !important;
                }
                @media print {
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `
            : `
                @page {
                    size: A4 portrait;
                    margin: 8mm;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `
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
            hasAutoPrintedRef.current = false;
            setPrintMode(defaultMode);
            loadInvoice();
        } else {
            setInvoiceData(null);
            setErrorMsg(null);
            hasAutoPrintedRef.current = false;
        }
    }, [visible, targetFolio, targetResv, kode_reservasi_room, defaultMode]);

    // Handle auto-print saat data siap
    useEffect(() => {
        if (visible && autoPrint && invoiceData && !loading && !hasAutoPrintedRef.current) {
            hasAutoPrintedRef.current = true;
            const timer = setTimeout(() => {
                handleTriggerPrint();
            }, 450);
            return () => clearTimeout(timer);
        }
    }, [visible, autoPrint, invoiceData, loading]);

    const formatOptions = [
        { label: 'Struk Thermal (80mm)', value: 'thermal', icon: 'pi pi-receipt' },
        { label: 'Faktur A4 (Standar)', value: 'a4', icon: 'pi pi-file-pdf' }
    ];

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={
                <div className="flex align-items-center justify-content-between w-full pr-4 flex-wrap gap-2">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-print text-primary text-xl"></i>
                        <span className="font-bold text-lg">Cetak Bukti Pembayaran / Struk Hotel</span>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <SelectButton
                            value={printMode}
                            onChange={(e) => e.value && setPrintMode(e.value)}
                            options={formatOptions}
                            optionLabel="label"
                            className="p-button-sm text-xs"
                        />
                    </div>
                </div>
            }
            style={{ width: '92vw', maxWidth: printMode === 'thermal' ? '540px' : '900px' }}
            breakpoints={{ '960px': '95vw', '641px': '100vw' }}
            modal
            footer={
                <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="flex align-items-center gap-2">
                        <Button
                            label={printMode === 'thermal' ? 'Cetak Struk Thermal (80mm)' : 'Cetak Faktur A4'}
                            icon="pi pi-print"
                            severity="success"
                            onClick={() => handleTriggerPrint()}
                            disabled={loading || !invoiceData}
                            className="font-bold"
                        />
                        {printMode === 'thermal' ? (
                            <Button
                                label="Beralih ke A4"
                                icon="pi pi-file"
                                text
                                size="small"
                                severity="secondary"
                                onClick={() => setPrintMode('a4')}
                            />
                        ) : (
                            <Button
                                label="Beralih ke Struk Thermal"
                                icon="pi pi-receipt"
                                text
                                size="small"
                                severity="secondary"
                                onClick={() => setPrintMode('thermal')}
                            />
                        )}
                    </div>
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
                <div className="flex justify-content-center p-2 surface-100 border-round-xl">
                    {printMode === 'thermal' ? (
                        <div
                            className="bg-white border-round shadow-4 overflow-hidden"
                            style={{
                                width: '80mm',
                                maxWidth: '100%',
                                border: '1px solid #dcdcdc'
                            }}
                        >
                            <CetakInvoiceThermal
                                ref={printRef}
                                data={invoiceData}
                                cashierName={session?.user?.name || 'Front Desk'}
                            />
                        </div>
                    ) : (
                        <div className="surface-border border-1 border-round-xl overflow-x-auto shadow-2 bg-white w-full">
                            <CetakInvoiceHotel ref={printRef} data={invoiceData} />
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    );
};

export default DialogInvoice;
