'use client';

import { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { useFormik } from 'formik';
import { useSession } from 'next-auth/react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiGuestData, apiGuestDelete } from './components/endpoints';
import { FORMATTER_CONFIG, GuestData, HEADER_CONFIG, initValueForm, State } from './components/interfaces';
import Table from './components/display/table';
import Form from './components/display/form';
import Detail from './components/display/detail';
import Suspects from './components/display/suspects';
import Print from './components/display/print';
import { DataRekap } from '@/types/print-tools';
import { transformTableData } from '@/lib/tools/printTools/transformData';
import { formatDateSystem } from '@/lib/tools/dateTools';

export default function MasterTamuPage() {
  const toast = useRef<Toast>(null);
  const { data: session } = useSession();

  const [state, setState] = useState<State>({
    load: false,
    data: [],
    add: false,
    edit: false,
    delete: false,
    detail: false,
    suspects: false,
    selectedDatas: [],
    selectedGuest: null,
    searchVal: '',
    keyword: '',
    guestTypeFilter: '',
    nationalityFilter: '',
    vipFilter: '',
    blacklistFilter: '',
    incompleteOnly: false,
    first: 0,
    rows: 10,
    page: 1,
    totalData: 0,
    sortField: 'updated_at',
    sortOrder: 'desc'
  });

  const [dataRekap, setDataRekap] = useState<DataRekap>({
    data: [],
    totalData: 0,
    head: [],
    load: false,
    columnStyles: {},
    show: false,
    adjust: false,
    fileName: `laporan-master-tamu-${new Date().toISOString().slice(0, 10)}`,
    judul1: 'Laporan Master Data Tamu',
    judul2: ''
  });

  const formik = useFormik<Partial<GuestData>>({
    initialValues: initValueForm,
    validate: (values) => {
      const errors: Record<string, string> = {};
      const activeCabang = values.kode_cabang || session?.user?.active_kode_cabang;
      if (!activeCabang) errors.kode_cabang = 'Cabang hotel wajib dipilih';
      if (!values.full_name || !values.full_name.trim()) errors.full_name = 'Nama lengkap wajib diisi';
      if (!values.id_number || !values.id_number.trim()) errors.id_number = 'Nomor identitas wajib diisi';
      if (!values.phone || !values.phone.trim()) errors.phone = 'Nomor telepon wajib diisi';
      return errors;
    },
    onSubmit: () => {}
  });

  useEffect(() => {
    if (session?.user?.active_kode_cabang && !formik.values.kode_cabang) {
      formik.setFieldValue('kode_cabang', session.user.active_kode_cabang);
    }
  }, [session?.user?.active_kode_cabang]);

  const getData = async () => {
    setState((p) => ({ ...p, load: true }));
    try {
      const oPayload = {
        page: state.page,
        perPage: state.rows,
        keyword: state.keyword,
        guest_type: state.guestTypeFilter,
        nationality: state.nationalityFilter,
        vip_level: state.vipFilter,
        is_blacklisted: state.blacklistFilter,
        sortField: state.sortField || 'updated_at',
        sortOrder: state.sortOrder || 'desc'
      };

      const res = await postData(apiGuestData, oPayload);
      if (res?.data?.data) {
        setState((p) => ({
          ...p,
          data: res.data.data,
          totalData: res.data.total_data || 0
        }));
      }
    } catch (error: any) {
      const e = error?.response?.data || error;
      showError(toast, e?.message || 'Gagal memuat data tamu');
    } finally {
      setState((p) => ({ ...p, load: false }));
    }
  };

  const getPrintData = async () => {
    setDataRekap((p) => ({ ...p, load: true }));
    try {
      const oPayload = {
        keyword: state.keyword,
        guest_type: state.guestTypeFilter || undefined,
        nationality: state.nationalityFilter || undefined,
        vip_level: state.vipFilter || undefined,
        is_blacklisted: state.blacklistFilter !== '' ? state.blacklistFilter : undefined,
        sortField: state.sortField || 'full_name',
        sortOrder: state.sortOrder || 'asc'
      };

      const res = await postData(apiGuestData, oPayload);
      const rawGuests = res?.data?.data || [];

      if (!rawGuests.length) {
        showError(toast, 'Tidak ada data tamu yang dapat diekspor');
        return;
      }

      // Transform data: pastikan kolom laporan proporsional dan rapi
      const preparedGuests = rawGuests.map((g: any) => ({
        nama_lengkap: `${g.title ? g.title + '. ' : ''}${g.full_name || '-'}`,
        identitas: `${(g.id_type || 'KTP').toUpperCase()}: ${g.id_number || '-'}`,
        phone: g.phone || '-',
        nationality: g.nationality || '-',
        guest_type: g.guest_type || 'individual',
        vip_level: g.vip_level || 'none',
        is_active: g.is_active !== undefined ? g.is_active : 1
      }));

      const formattedData = transformTableData(preparedGuests, {
        headerMap: HEADER_CONFIG,
        customFormatters: FORMATTER_CONFIG,
        includeKeys: ['nama_lengkap', 'identitas', 'phone', 'nationality', 'guest_type', 'vip_level', 'is_active']
      });

      const columnStyles = {
        0: { halign: 'center', cellWidth: 11 },    // No.
        1: { halign: 'left', cellWidth: 'auto' },  // Nama Lengkap
        2: { halign: 'left', cellWidth: 37 },      // No. Identitas
        3: { halign: 'center', cellWidth: 25 },    // No. Telepon
        4: { halign: 'center', cellWidth: 29 },    // Kewarganegaraan
        5: { halign: 'center', cellWidth: 21 },    // Jenis Tamu
        6: { halign: 'center', cellWidth: 20 },    // Tingkat VIP
        7: { halign: 'center', cellWidth: 14 }     // Status
      };

      setDataRekap((p) => ({
        ...p,
        data: formattedData,
        totalData: res.data.total_data || formattedData.length,
        show: true,
        adjust: true,
        columnStyles
      }));
    } catch (error: any) {
      const e = error?.response?.data || error;
      showError(toast, e?.message || 'Gagal menyiapkan data cetak');
    } finally {
      setDataRekap((p) => ({ ...p, load: false }));
    }
  };

  const handleDelete = async () => {
    const targets = state.selectedDatas;
    if (!targets || targets.length === 0) return;

    confirmDialog({
      message: `Apakah Anda yakin ingin menghapus ${targets.length} data tamu terpilih?`,
      header: 'Konfirmasi Hapus',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const ids = targets.map((t) => t.id);
          const res = await postData(apiGuestDelete, { ids });
          if (res.status === 200) {
            showSuccess(toast, `${targets.length} data tamu berhasil dihapus`);
            setState((p) => ({ ...p, delete: false, selectedDatas: [] }));
            getData();
          }
        } catch (error: any) {
          const e = error?.response?.data || error;
          showError(toast, e?.message || 'Gagal menghapus data tamu');
        }
      }
    });
  };

  useEffect(() => {
    if (state.delete) {
      handleDelete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.delete]);

  const onLazyLoad = (event: any) => {
    setState((prev) => {
      const newPage = typeof event.page === 'number' ? event.page + 1 : prev.page;
      return {
        ...prev,
        first: event.first,
        rows: event.rows,
        page: newPage,
        sortField: event.sortField || prev.sortField,
        sortOrder: event.sortOrder ? (event.sortOrder === 1 ? 'asc' : 'desc') : prev.sortOrder
      };
    });
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.page, state.rows, state.sortField, state.sortOrder, state.keyword, state.guestTypeFilter, state.vipFilter, state.blacklistFilter]);

  return (
    <div className="p-0">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      <Table
        dataRekap={dataRekap}
        setDataRekap={setDataRekap}
        state={state}
        setState={setState}
        getData={getData}
        getPrintData={getPrintData}
        onLazyLoad={onLazyLoad}
        formik={formik}
        toast={toast}
      />

      <Print
        dataRekap={dataRekap}
        setDataRekap={setDataRekap}
        toast={toast}
      />

      <Form
        state={state}
        setState={setState}
        formik={formik}
        toast={toast}
        getData={getData}
      />

      <Detail
        state={state}
        setState={setState}
      />

      <Suspects
        state={state}
        setState={setState}
        toast={toast}
        getData={getData}
      />
    </div>
  );
}
