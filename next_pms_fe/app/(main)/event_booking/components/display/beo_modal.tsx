'use client';

import React, { useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { formatCurrency } from '@/lib/tools/generalTools';

interface BeoModalProps {
    visible: boolean;
    data: any | null;
    onHide: () => void;
}

export const BeoModal: React.FC<BeoModalProps> = ({ visible, data, onHide }) => {
    const printAreaRef = useRef<HTMLDivElement>(null);

    if (!data) return null;

    const {
        header = {},
        schedule_and_room = {},
        requirements_and_notes = {},
        fnb_orders = [],
        equipment_orders = [],
        financial_summary = {},
        hotel_profile = {},
    } = data;

    const handlePrint = () => {
        if (!printAreaRef.current) return;
        const printContents = printAreaRef.current.innerHTML;
        const originalContents = document.body.innerHTML;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>BEO_${header.beo_number || 'Sheet'}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; color: #111; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        .text-right { text-align: right; }
                        .header-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 4px; }
                        .sub-title { text-align: center; font-size: 12px; color: #555; margin-bottom: 16px; }
                        .section-title { font-weight: bold; background: #eee; padding: 4px 8px; margin: 10px 0 4px 0; border: 1px solid #ccc; }
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        .signature-box { border-top: 1px solid #000; width: 180px; text-align: center; margin-top: 50px; padding-top: 4px; }
                    </style>
                </head>
                <body onload="window.print();window.close()">${printContents}</body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <Dialog
            header={`Banquet Event Order (BEO) - ${header.beo_number || ''}`}
            visible={visible}
            style={{ width: '90vw', maxWidth: '850px' }}
            modal
            onHide={onHide}
            footer={
                <div className="flex justify-content-between align-items-center w-full">
                    <span className="text-xs text-500">Standar Dokumen Operasional Hotel (BEO Sheet)</span>
                    <div className="flex gap-2">
                        <Button label="Tutup" icon="pi pi-times" className="p-button-text" onClick={onHide} />
                        <Button label="Cetak BEO" icon="pi pi-print" className="p-button-primary" onClick={handlePrint} />
                    </div>
                </div>
            }
        >
            <div ref={printAreaRef} className="p-3 surface-0 border-round text-800">
                {/* KOP HOTEL */}
                <div className="text-center pb-3 border-bottom-2 border-900 mb-3">
                    <h2 className="m-0 font-bold text-xl uppercase tracking-wider">{hotel_profile.nama_hotel || 'Grand Marstech Hotel & Resort'}</h2>
                    <p className="m-0 text-xs text-600">{hotel_profile.alamat} | Telp: {hotel_profile.telepon}</p>
                    <div className="mt-2 inline-block px-3 py-1 bg-primary text-white font-bold text-sm border-round">
                        BANQUET EVENT ORDER (BEO)
                    </div>
                </div>

                {/* HEADER INFORMASI BEO */}
                <div className="grid grid-nogutter text-xs mb-3 border-1 border-300 p-2 border-round">
                    <div className="col-6 pr-2">
                        <div className="flex justify-content-between mb-1">
                            <span className="text-500">Nomor BEO:</span>
                            <span className="font-bold text-primary font-mono">{header.beo_number}</span>
                        </div>
                        <div className="flex justify-content-between mb-1">
                            <span className="text-500">Nama Acara:</span>
                            <span className="font-bold text-900">{header.nama_event}</span>
                        </div>
                        <div className="flex justify-content-between mb-1">
                            <span className="text-500">Penyelenggara:</span>
                            <span className="font-semibold text-900">{header.organizer_name}</span>
                        </div>
                    </div>
                    <div className="col-6 pl-2 border-left-1 border-200">
                        <div className="flex justify-content-between mb-1">
                            <span className="text-500">Status Acara:</span>
                            <span className="font-bold text-primary">{header.status_event}</span>
                        </div>
                        <div className="flex justify-content-between mb-1">
                            <span className="text-500">PIC Lapangan:</span>
                            <span className="font-semibold text-900">{header.pic_name} ({header.pic_phone})</span>
                        </div>
                        <div className="flex justify-content-between mb-1">
                            <span className="text-500">Diterbitkan Pada:</span>
                            <span className="text-700">{header.issue_date}</span>
                        </div>
                    </div>
                </div>

                {/* RUANG & JADWAL */}
                <div className="surface-100 p-2 font-bold text-xs uppercase border-round mb-2 text-900">
                    1. Ruang & Jadwal Pelaksanaan
                </div>
                <div className="grid grid-nogutter text-xs mb-3 p-2 border-1 border-200 border-round">
                    <div className="col-6 pr-2">
                        <p className="m-0 mb-1"><b>Ruang Acara:</b> {schedule_and_room.nama_ruang} ({schedule_and_room.kode_ruang_event})</p>
                        <p className="m-0 mb-1"><b>Tanggal:</b> {schedule_and_room.tgl_mulai} s/d {schedule_and_room.tgl_selesai}</p>
                        <p className="m-0 mb-1"><b>Jam Pelaksanaan:</b> {schedule_and_room.jam_mulai} - {schedule_and_room.jam_selesai} ({schedule_and_room.durasi_jam} Jam)</p>
                    </div>
                    <div className="col-6 pl-2 border-left-1 border-200">
                        <p className="m-0 mb-1"><b>Estimasi Tamu:</b> {schedule_and_room.jumlah_tamu} Orang / Pax</p>
                        <p className="m-0 mb-1"><b>Tata Letak Meja/Kursi:</b> <span className="font-bold text-primary">{schedule_and_room.layout_setup}</span></p>
                        <p className="m-0 mb-1"><b>Waktu Persiapan:</b> {schedule_and_room.setup_buffer_minutes} Menit Sebelum Acara</p>
                    </div>
                </div>

                {/* INSTRUKSI KHUSUS */}
                <div className="surface-100 p-2 font-bold text-xs uppercase border-round mb-2 text-900">
                    2. Instruksi Khusus & Kebutuhan Teknis
                </div>
                <div className="p-2 border-1 border-200 border-round text-xs mb-3 bg-50">
                    <p className="m-0 text-700 font-italic">{requirements_and_notes.catatan_khusus}</p>
                </div>

                {/* PESANAN F&B */}
                {fnb_orders.length > 0 && (
                    <>
                        <div className="surface-100 p-2 font-bold text-xs uppercase border-round mb-2 text-900">
                            3. Rincian Food & Beverage (F&B)
                        </div>
                        <table className="w-full text-xs mb-3">
                            <thead>
                                <tr className="surface-200 text-left">
                                    <th className="p-2 border-1 border-300">Menu / Paket</th>
                                    <th className="p-2 border-1 border-300 text-center" style={{ width: '4rem' }}>Qty</th>
                                    <th className="p-2 border-1 border-300 text-center" style={{ width: '5rem' }}>Satuan</th>
                                    <th className="p-2 border-1 border-300 text-right" style={{ width: '8rem' }}>Harga</th>
                                    <th className="p-2 border-1 border-300 text-right" style={{ width: '8rem' }}>Subtotal</th>
                                    <th className="p-2 border-1 border-300">Catatan Waktu Saji</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fnb_orders.map((f: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="p-2 border-1 border-200 font-semibold">{f.item_name}</td>
                                        <td className="p-2 border-1 border-200 text-center">{f.qty}</td>
                                        <td className="p-2 border-1 border-200 text-center">{f.unit}</td>
                                        <td className="p-2 border-1 border-200 text-right">{formatCurrency(f.harga_satuan)}</td>
                                        <td className="p-2 border-1 border-200 text-right font-semibold">{formatCurrency(f.subtotal)}</td>
                                        <td className="p-2 border-1 border-200 text-600">{f.catatan}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* PERLENGKAPAN AUDIO VISUAL */}
                {equipment_orders.length > 0 && (
                    <>
                        <div className="surface-100 p-2 font-bold text-xs uppercase border-round mb-2 text-900">
                            4. Perlengkapan Audio Visual & Fasilitas
                        </div>
                        <table className="w-full text-xs mb-3">
                            <thead>
                                <tr className="surface-200 text-left">
                                    <th className="p-2 border-1 border-300">Item Perlengkapan</th>
                                    <th className="p-2 border-1 border-300 text-center" style={{ width: '4rem' }}>Qty</th>
                                    <th className="p-2 border-1 border-300 text-center" style={{ width: '5rem' }}>Satuan</th>
                                    <th className="p-2 border-1 border-300 text-right" style={{ width: '8rem' }}>Harga</th>
                                    <th className="p-2 border-1 border-300 text-right" style={{ width: '8rem' }}>Subtotal</th>
                                    <th className="p-2 border-1 border-300">Catatan Khusus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment_orders.map((eq: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="p-2 border-1 border-200 font-semibold">{eq.item_name}</td>
                                        <td className="p-2 border-1 border-200 text-center">{eq.qty}</td>
                                        <td className="p-2 border-1 border-200 text-center">{eq.unit}</td>
                                        <td className="p-2 border-1 border-200 text-right">{formatCurrency(eq.harga_satuan)}</td>
                                        <td className="p-2 border-1 border-200 text-right font-semibold">{formatCurrency(eq.subtotal)}</td>
                                        <td className="p-2 border-1 border-200 text-600">{eq.catatan}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* FINANCIAL & DEPOSIT SUMMARY */}
                <div className="surface-100 p-2 font-bold text-xs uppercase border-round mb-2 text-900">
                    5. Ringkasan Finansial & Pembayaran
                </div>
                <div className="grid grid-nogutter text-xs mb-4 p-2 border-1 border-300 border-round">
                    <div className="col-7 pr-3">
                        <div className="flex justify-content-between mb-1">
                            <span className="text-600">Tarif Sewa Ruang:</span>
                            <span className="font-semibold">{formatCurrency(financial_summary.tarif_sewa || 0)}</span>
                        </div>
                        <div className="flex justify-content-between mb-1">
                            <span className="text-600">Total F&B & Perlengkapan:</span>
                            <span className="font-semibold">{formatCurrency(financial_summary.biaya_tambahan || 0)}</span>
                        </div>
                        {financial_summary.diskon > 0 && (
                            <div className="flex justify-content-between mb-1 text-red-500">
                                <span>Diskon:</span>
                                <span>-{formatCurrency(financial_summary.diskon)}</span>
                            </div>
                        )}
                        <div className="flex justify-content-between mb-1">
                            <span className="text-600">Service Charge ({financial_summary.service_charge_persen}%):</span>
                            <span>{formatCurrency(financial_summary.nominal_service_charge || 0)}</span>
                        </div>
                        <div className="flex justify-content-between mb-1">
                            <span className="text-600">Pajak Daerah / PB1 ({financial_summary.pajak_persen}%):</span>
                            <span>{formatCurrency(financial_summary.nominal_pajak || 0)}</span>
                        </div>
                    </div>
                    <div className="col-5 pl-3 border-left-1 border-300 flex flex-column justify-content-center">
                        <div className="flex justify-content-between mb-2">
                            <span className="font-bold text-900">Grand Total:</span>
                            <span className="font-bold text-base text-primary">{formatCurrency(financial_summary.total_biaya || 0)}</span>
                        </div>
                        <div className="flex justify-content-between mb-1 text-green-600 font-semibold">
                            <span>Uang Muka (DP):</span>
                            <span>{formatCurrency(financial_summary.deposit_paid || 0)}</span>
                        </div>
                        <div className="flex justify-content-between mb-2 text-red-600 font-bold border-top-1 border-300 pt-1">
                            <span>Sisa Tagihan:</span>
                            <span>{formatCurrency(financial_summary.sisa_tagihan || 0)}</span>
                        </div>
                        <div className="text-center">
                            <Tag value={`STATUS: ${financial_summary.status_pembayaran || 'UNPAID'}`} className="text-xs" />
                        </div>
                    </div>
                </div>

                {/* TANDA TANGAN SERAH TERIMA */}
                <div className="grid grid-nogutter text-xs text-center mt-5">
                    <div className="col-4">
                        <p className="m-0 mb-5 font-semibold">Disiapkan Oleh (Sales/Banquet):</p>
                        <div className="border-top-1 border-900 mx-3 pt-1">
                            <p className="m-0 font-semibold">Banquet Sales Executive</p>
                        </div>
                    </div>
                    <div className="col-4">
                        <p className="m-0 mb-5 font-semibold">Disetujui Oleh (Penyelenggara):</p>
                        <div className="border-top-1 border-900 mx-3 pt-1">
                            <p className="m-0 font-semibold">{header.pic_name || 'Client PIC'}</p>
                        </div>
                    </div>
                    <div className="col-4">
                        <p className="m-0 mb-5 font-semibold">Eksekusi Operasional (Captain):</p>
                        <div className="border-top-1 border-900 mx-3 pt-1">
                            <p className="m-0 font-semibold">Banquet Operations Manager</p>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};
