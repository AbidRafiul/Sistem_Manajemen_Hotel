import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { FormikProps } from 'formik';

export interface DropdownData {
    kode: string;
    nama: string;
}

export interface FasilitasItem {
    kode_fasilitas: string;
    nama_fasilitas: string;
}

export interface State {
    load: boolean;
    dataParent: DropdownData[];
    kode_tipe_kamar: string;
    sourceFasilitas: FasilitasItem[];
    targetFasilitas: FasilitasItem[];
    session: Session | null;
}
