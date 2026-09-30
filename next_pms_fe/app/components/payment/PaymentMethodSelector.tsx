'use client';

import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { SelectButton } from 'primereact/selectbutton';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import {
    BANK_OPTIONS,
    DEFAULT_HOTEL_BANKS,
    PAYMENT_METHOD_OPTIONS,
    PaymentDetail
} from '@/lib/tools/paymentTools';

export interface PaymentMethodSelectorProps {
    value: PaymentDetail;
    onChange: (detail: PaymentDetail) => void;
    totalAmount?: number;
    cashTendered?: number;
    onCashTenderedChange?: (amount: number) => void;
    disabled?: boolean;
    compact?: boolean;
    qrisMerchantName?: string;
    qrisNmid?: string;
    qrisImageUrl?: string;
    errorMethod?: string;
    errorBank?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
    value,
    onChange,
    totalAmount,
    cashTendered,
    onCashTenderedChange,
    disabled = false,
    compact = false,
    qrisMerchantName = 'Grand Marstech Hotel & Resort',
    qrisNmid = 'ID1020039485721',
    qrisImageUrl = '/layout/images/qris-demo.svg',
    errorMethod,
    errorBank
}) => {
    const [showQrisModal, setShowQrisModal] = useState(false);
    const [copiedBank, setCopiedBank] = useState<string | null>(null);

    const currentMethod = value?.method || 'cash';
    const currentBank = value?.bank_name || '';
    const currentCardType = value?.card_type || 'debit';
    const currentRef = value?.reference_no || '';

    // Cari info rekening bank aktif
    const activeBankInfo = DEFAULT_HOTEL_BANKS.find(
        (b) => b.bank.toLowerCase() === (currentBank || 'bca').toLowerCase()
    ) || DEFAULT_HOTEL_BANKS[0];

    const handleMethodChange = (newMethod: 'cash' | 'card' | 'qris' | 'transfer') => {
        let newBank = currentBank;
        let newCardType = currentCardType;

        if (newMethod === 'card') {
            if (!newBank) newBank = 'BCA';
            if (!newCardType) newCardType = 'debit';
        } else if (newMethod === 'transfer') {
            if (!newBank) newBank = 'BCA';
        }

        onChange({
            method: newMethod,
            bank_name: newMethod === 'card' || newMethod === 'transfer' ? newBank : undefined,
            card_type: newMethod === 'card' ? newCardType : undefined,
            reference_no: currentRef
        });
    };

    const handleBankChange = (newBank: string) => {
        onChange({
            ...value,
            bank_name: newBank
        });
    };

    const handleCardTypeChange = (newCardType: 'debit' | 'credit') => {
        onChange({
            ...value,
            card_type: newCardType
        });
    };

    const handleRefChange = (newRef: string) => {
        onChange({
            ...value,
            reference_no: newRef
        });
    };

    const handleCopyRek = (noRek: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(noRek.replace(/[^0-9]/g, ''));
            setCopiedBank(noRek);
            setTimeout(() => setCopiedBank(null), 2500);
        }
    };

    const cardTypeOptions = [
        { label: 'Kartu Debit', value: 'debit', icon: 'pi pi-id-card' },
        { label: 'Kartu Kredit', value: 'credit', icon: 'pi pi-credit-card' }
    ];

    return (
        <div className="w-full">
            {/* 1. Pemilihan Metode Pembayaran (Pills Tab Buttons) */}
            <div className="mb-3">
                <label className="text-xs font-bold text-700 uppercase block mb-1.5">
                    Metode Pembayaran: <span className="text-red-500">*</span>
                </label>
                <div className="grid">
                    {PAYMENT_METHOD_OPTIONS.map((m) => {
                        const isSelected = currentMethod === m.value;
                        return (
                            <div key={m.value} className={compact ? 'col-6' : 'col-6 sm:col-3'}>
                                <div
                                    className={`p-2.5 border-round-xl border-2 cursor-pointer transition-all duration-150 flex flex-column align-items-center justify-content-center text-center select-none ${
                                        isSelected
                                            ? 'border-green-600 bg-green-50 shadow-1 text-green-900 font-bold'
                                            : 'border-200 surface-0 hover:surface-100 text-700 font-medium'
                                    } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
                                    onClick={() => handleMethodChange(m.value as any)}
                                >
                                    <i
                                        className={`${m.icon} ${compact ? 'text-lg' : 'text-xl'} mb-1 ${
                                            isSelected ? 'text-green-700' : 'text-600'
                                        }`}
                                    ></i>
                                    <span className="text-xs line-height-2">{m.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {errorMethod && <small className="p-error text-xs block mt-1">{errorMethod}</small>}
            </div>

            {/* 2. Formulir Dinamis Berdasarkan Metode */}
            {/* ─── METODE KARTU (CARD) ─── */}
            {currentMethod === 'card' && (
                <div className="surface-50 border-round-xl border-1 surface-border p-3 mb-3 animation-duration-200">
                    <div className="flex align-items-center gap-2 mb-2 pb-1 border-bottom-1 surface-border">
                        <i className="pi pi-credit-card text-blue-600 text-sm"></i>
                        <span className="text-xs font-bold text-800 uppercase">
                            Detail Kartu &amp; Mesin EDC Gesek
                        </span>
                    </div>

                    <div className="grid">
                        {/* Jenis Kartu (Debit / Kredit) */}
                        <div className="col-12 sm:col-6 mb-2">
                            <label className="text-xs font-semibold text-700 block mb-1">
                                Jenis Kartu Customer <span className="text-red-500">*</span>
                            </label>
                            <SelectButton
                                value={currentCardType}
                                onChange={(e) => e.value && handleCardTypeChange(e.value)}
                                options={cardTypeOptions}
                                optionLabel="label"
                                className="w-full p-button-sm text-xs"
                                disabled={disabled}
                            />
                        </div>

                        {/* Bank Penerbit Kartu */}
                        <div className="col-12 sm:col-6 mb-2">
                            <label className="text-xs font-semibold text-700 block mb-1">
                                Bank Penerbit Kartu <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                value={currentBank || 'BCA'}
                                options={BANK_OPTIONS}
                                onChange={(e) => handleBankChange(e.value)}
                                placeholder="Pilih Bank Penerbit"
                                className={`w-full text-sm ${errorBank ? 'p-invalid' : ''}`}
                                disabled={disabled}
                            />
                            {errorBank && <small className="p-error text-xs">{errorBank}</small>}
                        </div>

                        {/* Nomor Kartu / Trace Approval */}
                        <div className="col-12">
                            <label className="text-xs font-semibold text-700 block mb-1">
                                No. Trace EDC / Approval Code / 4 Digit Kartu (Opsional)
                            </label>
                            <InputText
                                value={currentRef}
                                onChange={(e) => handleRefChange(e.target.value)}
                                placeholder="Contoh: Trace 003921 / No: 4111-XXXX / Approval 847291"
                                className="w-full text-sm"
                                disabled={disabled}
                            />
                            <small className="text-500 text-xs mt-1 block">
                                Kasir dapat memasukkan kode approval atau no trace yang tercetak pada struk mesin EDC bank.
                            </small>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── METODE QRIS STATIS (DEMO) ─── */}
            {currentMethod === 'qris' && (
                <div className="surface-50 border-round-xl border-1 surface-border p-3 mb-3 animation-duration-200">
                    <div className="flex align-items-center justify-content-between mb-2 pb-1 border-bottom-1 surface-border flex-wrap gap-2">
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-qrcode text-red-600 text-sm"></i>
                            <span className="text-xs font-bold text-800 uppercase">
                                Pembayaran QRIS Statis Hotel
                            </span>
                        </div>
                        <Button
                            type="button"
                            label="Tampilkan QR Code"
                            icon="pi pi-qrcode"
                            size="small"
                            severity="danger"
                            outlined
                            className="text-xs py-1 px-2.5"
                            onClick={() => setShowQrisModal(true)}
                        />
                    </div>

                    {/* Preview Box & Tombol Pop-up */}
                    <div className="surface-0 border-round-lg border-1 surface-border p-3 mb-3 flex align-items-center justify-content-between flex-wrap gap-3">
                        <div className="flex align-items-center gap-3">
                            <div
                                className="border-1 border-300 border-round p-1 surface-50 cursor-pointer hover:border-red-400 transition-colors"
                                onClick={() => setShowQrisModal(true)}
                                title="Klik untuk perbesar QRIS"
                            >
                                <img
                                    src={qrisImageUrl}
                                    alt="QRIS Demo"
                                    className="w-4rem h-4rem"
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                            <div>
                                <span className="font-bold text-sm text-900 block">{qrisMerchantName}</span>
                                <span className="text-xs text-500 block font-mono">NMID: {qrisNmid}</span>
                                <span className="text-xs text-green-700 font-semibold block mt-0.5">
                                    <i className="pi pi-check-circle text-xs mr-1"></i>
                                    Menerima Semua E-Wallet &amp; Mobile Banking
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            label="Perbesar QRIS"
                            icon="pi pi-external-link"
                            size="small"
                            severity="danger"
                            className="text-xs"
                            onClick={() => setShowQrisModal(true)}
                        />
                    </div>

                    {/* Input No Referensi / RRN QRIS */}
                    <div>
                        <label className="text-xs font-semibold text-700 block mb-1">
                            Nomor Referensi Transaksi QRIS / RRN (dari aplikasi tamu)
                        </label>
                        <InputText
                            value={currentRef}
                            onChange={(e) => handleRefChange(e.target.value)}
                            placeholder="Contoh: RRN-9081238472 / ID Transaksi GoPay / BCA"
                            className="w-full text-sm"
                            disabled={disabled}
                        />
                        <small className="text-500 text-xs mt-1 block">
                            Pastikan tamu telah menunjukkan notifikasi atau bukti "Berhasil" pada aplikasi pembayarannya.
                        </small>
                    </div>
                </div>
            )}

            {/* ─── METODE TRANSFER BANK / VIRTUAL ACCOUNT ─── */}
            {currentMethod === 'transfer' && (
                <div className="surface-50 border-round-xl border-1 surface-border p-3 mb-3 animation-duration-200">
                    <div className="flex align-items-center gap-2 mb-2 pb-1 border-bottom-1 surface-border">
                        <i className="pi pi-arrow-right-arrow-left text-purple-600 text-sm"></i>
                        <span className="text-xs font-bold text-800 uppercase">
                            Transfer Bank &amp; Virtual Account (VA) Hotel
                        </span>
                    </div>

                    <div className="grid">
                        {/* Dropdown Bank Tujuan */}
                        <div className="col-12 sm:col-6 mb-2">
                            <label className="text-xs font-semibold text-700 block mb-1">
                                Bank Tujuan Transfer / VA <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                value={currentBank || 'BCA'}
                                options={BANK_OPTIONS.filter((b) =>
                                    DEFAULT_HOTEL_BANKS.some((hb) => hb.bank.toLowerCase() === b.value.toLowerCase())
                                )}
                                onChange={(e) => handleBankChange(e.value)}
                                placeholder="Pilih Bank Tujuan"
                                className="w-full text-sm"
                                disabled={disabled}
                            />
                        </div>

                        {/* Nomor Referensi Bukti Transfer */}
                        <div className="col-12 sm:col-6 mb-2">
                            <label className="text-xs font-semibold text-700 block mb-1">
                                No. Referensi Transfer / Bukti Setor
                            </label>
                            <InputText
                                value={currentRef}
                                onChange={(e) => handleRefChange(e.target.value)}
                                placeholder="Contoh: TRF-20260929-8812 / 8 Digit Bukti"
                                className="w-full text-sm"
                                disabled={disabled}
                            />
                        </div>

                        {/* Rekening Card Info Hotel */}
                        <div className="col-12">
                            <div className="surface-0 border-round-lg border-1 surface-border p-2.5 flex align-items-center justify-content-between flex-wrap gap-2">
                                <div>
                                    <span className="text-xs text-500 block uppercase font-semibold">
                                        Rekening / VA Resmi Hotel ({activeBankInfo.bank}):
                                    </span>
                                    <span className="text-base font-bold font-mono text-primary block my-0.5">
                                        {activeBankInfo.no_rek}
                                    </span>
                                    <span className="text-xs text-700 font-semibold block">
                                        a.n {activeBankInfo.atas_nama}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    label={copiedBank === activeBankInfo.no_rek ? 'Tersalin!' : 'Salin No. Rek'}
                                    icon={copiedBank === activeBankInfo.no_rek ? 'pi pi-check' : 'pi pi-copy'}
                                    size="small"
                                    severity={copiedBank === activeBankInfo.no_rek ? 'success' : 'secondary'}
                                    outlined
                                    className="text-xs py-1 px-3 font-semibold"
                                    onClick={() => handleCopyRek(activeBankInfo.no_rek)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── METODE TUNAI (CASH) ─── */}
            {currentMethod === 'cash' && (
                <div className="surface-50 border-round-xl border-1 surface-border p-3 mb-2 animation-duration-200">
                    <div className="flex align-items-center justify-content-between mb-2">
                        <span className="text-xs font-bold text-800 uppercase flex align-items-center gap-1.5">
                            <i className="pi pi-wallet text-green-600 text-sm"></i>
                            Penerimaan Uang Tunai (Laci Kasir Front Desk)
                        </span>
                        {totalAmount !== undefined && totalAmount > 0 && (
                            <span className="text-xs text-600">
                                Total Tagihan: <strong className="text-primary font-bold">Rp {totalAmount.toLocaleString('id-ID')}</strong>
                            </span>
                        )}
                    </div>

                    {totalAmount !== undefined && totalAmount > 0 && onCashTenderedChange ? (
                        <div className="grid align-items-center mt-1">
                            <div className="col-12 sm:col-7">
                                <label className="text-xs font-semibold text-700 block mb-1">
                                    Uang Fisik Diterima dari Tamu (Cash Tendered):
                                </label>
                                <InputNumber
                                    value={cashTendered ?? totalAmount}
                                    onValueChange={(e) => onCashTenderedChange(e.value ?? 0)}
                                    mode="currency"
                                    currency="IDR"
                                    locale="id-ID"
                                    className="w-full text-sm font-bold"
                                    min={0}
                                    disabled={disabled}
                                />
                                {/* Quick nominal buttons */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    <Button
                                        type="button"
                                        label="Uang Pas"
                                        size="small"
                                        severity="secondary"
                                        outlined
                                        className="text-xs py-1 px-2 border-round-lg font-semibold"
                                        onClick={() => onCashTenderedChange(totalAmount)}
                                    />
                                    {[50000, 100000, 200000, 500000, 1000000, 2000000].map((nom) => {
                                        if (nom < totalAmount && nom !== 50000 && nom !== 100000) return null;
                                        return (
                                            <Button
                                                key={nom}
                                                type="button"
                                                label={`Rp ${(nom / 1000).toLocaleString('id-ID')}rb`}
                                                size="small"
                                                severity="secondary"
                                                outlined
                                                className="text-xs py-1 px-2 border-round-lg"
                                                onClick={() => onCashTenderedChange(nom)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="col-12 sm:col-5">
                                <div className="p-2.5 border-round-xl border-1 surface-border surface-0 text-center shadow-1">
                                    <span className="text-xs text-500 uppercase block font-semibold">Uang Kembalian:</span>
                                    <div className={`text-xl font-bold my-1 ${((cashTendered ?? totalAmount) - totalAmount) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                        Rp {Math.max(0, (cashTendered ?? totalAmount) - totalAmount).toLocaleString('id-ID')}
                                    </div>
                                    {((cashTendered ?? totalAmount) - totalAmount) < 0 && (
                                        <span className="text-xs text-red-500 font-semibold block">⚠️ Uang tunai masih kurang</span>
                                    )}
                                    {((cashTendered ?? totalAmount) - totalAmount) === 0 && (
                                        <span className="text-xs text-green-600 font-semibold block">✓ Uang Pas Diterima</span>
                                    )}
                                    {((cashTendered ?? totalAmount) - totalAmount) > 0 && (
                                        <span className="text-xs text-blue-600 font-semibold block">Kembalikan ke Tamu</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-600 flex align-items-center gap-2">
                            <i className="pi pi-info-circle text-green-600 text-sm"></i>
                            <span>
                                Pembayaran uang tunai (Cash) diserahkan langsung oleh tamu kepada kasir dan dicatat ke dalam laci kasir Front Desk.
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL QRIS STATIS UNTUK SCAN TAMU */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-qrcode text-red-600 text-xl"></i>
                        <span className="font-bold text-900">QRIS Statis Pembayaran Hotel</span>
                    </div>
                }
                visible={showQrisModal}
                onHide={() => setShowQrisModal(false)}
                style={{ width: '420px', maxWidth: '95vw' }}
                modal
                footer={
                    <div className="flex justify-content-between align-items-center w-full">
                        <span className="text-xs text-500">Tunjukkan QR code ini ke tamu</span>
                        <Button
                            label="Tutup"
                            icon="pi pi-times"
                            severity="secondary"
                            size="small"
                            onClick={() => setShowQrisModal(false)}
                        />
                    </div>
                }
            >
                <div className="flex flex-column align-items-center p-2 text-center">
                    <div className="surface-0 border-round-xl border-1 surface-border p-3 shadow-2 mb-3 w-full flex justify-content-center">
                        <img
                            src={qrisImageUrl}
                            alt="QRIS Demo Full"
                            style={{ width: '100%', maxWidth: '300px', height: 'auto', display: 'block' }}
                        />
                    </div>

                    <div className="surface-100 border-round-lg p-2.5 w-full text-left text-xs mb-2">
                        <div className="flex justify-content-between mb-1">
                            <span className="text-500">Merchant:</span>
                            <span className="font-bold text-900">{qrisMerchantName}</span>
                        </div>
                        <div className="flex justify-content-between mb-1">
                            <span className="text-500">NMID:</span>
                            <span className="font-mono font-bold text-900">{qrisNmid}</span>
                        </div>
                        {totalAmount !== undefined && totalAmount > 0 && (
                            <div className="flex justify-content-between border-top-1 surface-border pt-1 font-bold text-sm text-green-700">
                                <span>Nominal yang Harus Dibayar:</span>
                                <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-500 m-0">
                        Scan menggunakan BCA Mobile, Livin' Mandiri, BRImo, BNI, GoPay, OVO, DANA, atau aplikasi pembayaran QRIS lainnya.
                    </p>
                </div>
            </Dialog>
        </div>
    );
};

export default PaymentMethodSelector;
