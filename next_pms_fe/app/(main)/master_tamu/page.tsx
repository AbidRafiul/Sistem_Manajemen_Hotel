'use client';

import { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { useFormik } from 'formik';
import { useSession } from 'next-auth/react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiGuestData, apiGuestDelete, apiGuestExport } from './components/endpoints';
import { GuestData, initValueForm, State } from './components/interfaces';
import Table from './components/display/table';
import Form from './components/display/form';
import Detail from './components/display/detail';
import Suspects from './components/display/suspects';

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

  const formik = useFormik<Partial<GuestData>>({
    initialValues: initValueForm,
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.kode_cabang) errors.kode_cabang = 'Cabang hotel wajib dipilih';
      if (!values.full_name || !values.full_name.trim()) errors.full_name = 'Nama lengkap wajib diisi';
      if (!values.id_number || !values.id_number.trim()) errors.id_number = 'Nomor identitas wajib diisi';
      if (!values.phone || !values.phone.trim()) errors.phone = 'Nomor telepon wajib diisi';
      return errors;
    },
    onSubmit: () => {}
  });

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
    setState((p) => ({ ...p, load: true }));
    try {
      const res = await postData(apiGuestExport, {
        keyword: state.keyword,
        guest_type: state.guestTypeFilter
      });
      if (res?.data?.data) {
        showSuccess(toast, `Data ${res.data.data.length} tamu disiapkan untuk di-export`);
      }
    } catch (error: any) {
      const e = error?.response?.data || error;
      showError(toast, e?.message || 'Gagal menyiapkan export data');
    } finally {
      setState((p) => ({ ...p, load: false }));
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
        state={state}
        setState={setState}
        getData={getData}
        getPrintData={getPrintData}
        onLazyLoad={onLazyLoad}
        formik={formik}
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
