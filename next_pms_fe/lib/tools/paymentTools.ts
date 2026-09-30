/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard PMS Hotel
 * @file paymentTools.ts
 * @description Helper functions and constants for standard hotel payment methods
 */

export interface PaymentDetail {
    method: 'cash' | 'card' | 'qris' | 'transfer';
    bank_name?: string;
    card_type?: 'debit' | 'credit';
    reference_no?: string;
}

export interface BankAccountInfo {
    bank: string;
    no_rek: string;
    atas_nama: string;
}

export const DEFAULT_HOTEL_BANKS: BankAccountInfo[] = [
    { bank: 'BCA', no_rek: '8001-2938-4720', atas_nama: 'PT MARSTECH GLOBAL HOSPITALITY' },
    { bank: 'Mandiri', no_rek: '138-00-1928374-1', atas_nama: 'PT MARSTECH GLOBAL HOSPITALITY' },
    { bank: 'BNI', no_rek: '089-281-9283', atas_nama: 'PT MARSTECH GLOBAL HOSPITALITY' },
    { bank: 'BRI', no_rek: '0021-01-098234-50-2', atas_nama: 'PT MARSTECH GLOBAL HOSPITALITY' },
    { bank: 'BSI', no_rek: '710-928-3841', atas_nama: 'PT MARSTECH GLOBAL HOSPITALITY' },
    { bank: 'Permata', no_rek: '8910-2938-4720', atas_nama: 'PT MARSTECH GLOBAL HOSPITALITY' }
];

export const BANK_OPTIONS = [
    { label: 'Bank BCA', value: 'BCA' },
    { label: 'Bank Mandiri', value: 'Mandiri' },
    { label: 'Bank BNI', value: 'BNI' },
    { label: 'Bank BRI', value: 'BRI' },
    { label: 'Bank CIMB Niaga', value: 'CIMB Niaga' },
    { label: 'Bank Permata', value: 'Permata' },
    { label: 'Bank Danamon', value: 'Danamon' },
    { label: 'Bank Syariah Indonesia (BSI)', value: 'BSI' },
    { label: 'Bank Lainnya', value: 'Lainnya' }
];

export const PAYMENT_METHOD_OPTIONS = [
    { label: 'Tunai (Cash)', value: 'cash', icon: 'pi pi-money-bill', color: 'green' },
    { label: 'Kartu (Card)', value: 'card', icon: 'pi pi-credit-card', color: 'blue' },
    { label: 'QRIS Statis', value: 'qris', icon: 'pi pi-qrcode', color: 'red' },
    { label: 'Transfer Bank / VA', value: 'transfer', icon: 'pi pi-arrow-right-arrow-left', color: 'purple' }
];

/**
 * Format badge/label metode pembayaran untuk ditampilkan di tabel transaksi, folio, kasir, dsb.
 */
export const formatPaymentDisplay = (
    method?: string | null,
    bankName?: string | null,
    cardType?: string | null
): { label: string; severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary'; icon: string } => {
    const m = (method || 'cash').toLowerCase();

    if (m === 'cash') {
        return { label: 'TUNAI (CASH)', severity: 'success', icon: 'pi pi-money-bill' };
    }

    if (m === 'card') {
        const typeStr = (cardType || 'DEBIT').toUpperCase();
        const bankStr = bankName ? ` - ${bankName.toUpperCase()}` : '';
        return { label: `KARTU ${typeStr}${bankStr}`, severity: 'info', icon: 'pi pi-credit-card' };
    }

    if (m === 'qris') {
        return { label: 'QRIS STATIS', severity: 'danger', icon: 'pi pi-qrcode' };
    }

    if (m === 'transfer') {
        const bankStr = bankName ? ` - ${bankName.toUpperCase()}` : '';
        return { label: `TRANSFER VA${bankStr}`, severity: 'warning', icon: 'pi pi-arrow-right-arrow-left' };
    }

    if (m === 'edc') {
        return { label: 'KARTU (EDC)', severity: 'info', icon: 'pi pi-credit-card' };
    }

    return { label: (method || '-').toUpperCase(), severity: 'secondary', icon: 'pi pi-tag' };
};

/**
 * Format string nomor referensi lengkap untuk disimpan ke database
 */
export const buildStandardReferenceNo = (
    method: string,
    rawRef?: string,
    bankName?: string,
    cardType?: string
): string => {
    const cleanRef = (rawRef || '').trim();
    if (method === 'card') {
        const parts: string[] = [];
        if (bankName) parts.push(bankName.toUpperCase());
        if (cardType) parts.push(cardType.toUpperCase());
        const header = parts.length > 0 ? `[${parts.join(' - ')}]` : '[KARTU]';
        return cleanRef ? `${header} ${cleanRef}` : header;
    }

    if (method === 'transfer') {
        const header = bankName ? `[VA ${bankName.toUpperCase()}]` : '[TRANSFER VA]';
        return cleanRef ? `${header} ${cleanRef}` : header;
    }

    if (method === 'qris') {
        const header = '[QRIS STATIS]';
        return cleanRef ? `${header} ${cleanRef}` : header;
    }

    return cleanRef;
};
