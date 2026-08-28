import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { FormikProps } from 'formik';

export interface DropdownData {
    kode: string;
    nama: string;
}

export interface AmenityItem {
    kode_amenity: string;
    nama_amenity: string;
}

export interface State {
    load: boolean;
    dataParent: DropdownData[];
    kode_tipe_kamar: string;
    sourceAmenity: AmenityItem[];
    targetAmenity: AmenityItem[];
    session: Session | null;
}
