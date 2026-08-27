/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file page.tsx
 * @description File induk dari page master navigasi sidebar
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-27
 *
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 *
 * @lastModified Fadil (2026-08-27)
 * @version 1.0.1
 */

'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError } from '@/lib/tools/generalTools';
import { useFormik } from 'formik';
import { initValue, State } from './components/interfaces';
import Table from './components/display/table';
import { apiEndpointList } from './components/endpoints';

const Page = () => {
    const toast = useRef<Toast>(null);

    const [state, setState] = useState<State>({
        load: false,
        data: [],
        add: false,
        edit: false,
        delete: false,
        selectedData: null,
    });

    const formik = useFormik<initValue>({
        initialValues: {
            id: undefined,
            role: '',
            menu: [],
            tz: '',
        },
        validate: (data: initValue) => {
            const errors: Record<string, string> = {};
            if (!data.role) errors.role = 'Role wajib dipilih.';
            return errors;
        },
        onSubmit: (data) => {
            setState((p) => ({ ...p, submittedData: data }));
        },
    });

    const getData = async () => {
        setState((p) => ({ ...p, load: true }));
        try {
            const res = await postData(apiEndpointList, {});
            setState((p) => ({ ...p, data: res.data.data }));
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi kesalahan saat memuat data');
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    useEffect(() => {
        getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <div className="p-0">
                <Toast ref={toast} position="top-right" />
                <Table
                    state={state}
                    setState={setState}
                    formik={formik}
                    toast={toast}
                    getData={getData}
                />
            </div>
        </>
    );
};

export default Page;
