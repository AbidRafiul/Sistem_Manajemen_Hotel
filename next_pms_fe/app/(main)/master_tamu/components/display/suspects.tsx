'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useEffect, useState } from 'react';
import postData from '@/lib/axios/postData';
import { apiDuplicateSuspects, apiGuestMerge } from '../endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';

interface SuspectsProps {
  state: any;
  setState: any;
  toast: any;
  getData: () => void;
}

export default function Suspects({ state, setState, toast, getData }: SuspectsProps) {
  const [suspectGroups, setSuspectGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrimary, setSelectedPrimary] = useState<any>(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState<any>(null);

  useEffect(() => {
    if (state.suspects) {
      fetchSuspects();
    }
  }, [state.suspects]);

  const fetchSuspects = async () => {
    setLoading(true);
    try {
      const res = await postData(apiDuplicateSuspects, {});
      if (res?.data?.data) {
        setSuspectGroups(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedPrimary || !selectedDuplicate) {
      showError(toast, 'Pilih 1 profil utama dan 1 profil duplikat yang akan digabungkan');
      return;
    }
    if (selectedPrimary.kode_tamu === selectedDuplicate.kode_tamu) {
      showError(toast, 'Profil utama dan profil duplikat tidak boleh sama');
      return;
    }

    try {
      const res = await postData(apiGuestMerge, {
        primary_kode_tamu: selectedPrimary.kode_tamu,
        duplicate_kode_tamu: selectedDuplicate.kode_tamu
      });
      if (res.status === 200) {
        showSuccess(toast, `Berhasil menggabungkan profil ${selectedDuplicate.kode_tamu} ke ${selectedPrimary.kode_tamu}`);
        setSelectedPrimary(null);
        setSelectedDuplicate(null);
        fetchSuspects();
        getData();
      }
    } catch (error: any) {
      const e = error?.response?.data || error;
      showError(toast, e?.message || 'Gagal menggabungkan profil');
    }
  };

  return (
    <Dialog
      visible={state.suspects}
      header="Review & Merge Suspek Duplikat Data Tamu"
      style={{ width: '90vw', maxWidth: '1100px' }}
      modal
      onHide={() => setState((p: any) => ({ ...p, suspects: false }))}
      footer={<Button label="Tutup" icon="pi pi-times" onClick={() => setState((p: any) => ({ ...p, suspects: false }))} />}
    >
      <div className="mb-4">
        <p className="text-gray-600">Pilih profil utama yang akan dipertahankan dan profil duplikat yang akan dileburkan ke dalamnya.</p>
      </div>

      {loading ? (
        <div className="text-center p-5"><i className="pi pi-spin pi-spinner text-3xl"></i></div>
      ) : suspectGroups.length === 0 ? (
        <div className="text-center p-5 text-gray-500 font-semibold"><i className="pi pi-check-circle text-green-500 text-3xl mb-2 block"></i>Tidak ditemukan suspek duplikat di database!</div>
      ) : (
        <div className="flex flex-column gap-4">
          {suspectGroups.map((grp, gIdx) => (
            <div key={gIdx} className="border-1 surface-border border-round p-3 surface-card">
              <div className="flex justify-content-between align-items-center mb-3 border-bottom-1 surface-border pb-2">
                <span className="font-bold text-lg text-blue-700"><i className="pi pi-users mr-2"></i>Grup #{gIdx + 1}: {grp.reason} ({grp.key})</span>
                <Tag value={`${grp.profiles.length} Profil`} severity="warning" />
              </div>

              <div className="grid">
                {grp.profiles.map((p: any) => {
                  const isPrimary = selectedPrimary?.kode_tamu === p.kode_tamu;
                  const isDup = selectedDuplicate?.kode_tamu === p.kode_tamu;

                  return (
                    <div key={p.kode_tamu} className="col-12 md:col-6">
                      <div className={`p-3 border-round border-2 ${isPrimary ? 'border-green-500 bg-green-50' : isDup ? 'border-red-500 bg-red-50' : 'surface-border bg-white'}`}>
                        <div className="flex justify-content-between align-items-start mb-2">
                          <span className="font-bold text-base">{p.full_name} ({p.kode_tamu})</span>
                          <span className="text-xs text-gray-500">Dibuat: {p.created_at}</span>
                        </div>
                        <p className="m-0 text-sm"><strong>Identitas:</strong> {p.id_type?.toUpperCase()}: {p.id_number || '-'}</p>
                        <p className="m-0 text-sm"><strong>Telepon:</strong> {p.phone || '-'}</p>
                        <p className="m-0 text-sm"><strong>Riwayat Stay:</strong> {p.total_stay || 0} kali | Spend: {p.total_spending || 0}</p>

                        <div className="flex gap-2 mt-3">
                          <Button
                            size="small"
                            label={isPrimary ? "Profil Utama" : "Pilih sbg Utama"}
                            icon="pi pi-check"
                            severity={isPrimary ? "success" : "secondary"}
                            outlined={!isPrimary}
                            onClick={() => setSelectedPrimary(p)}
                          />
                          <Button
                            size="small"
                            label={isDup ? "Profil Lebur" : "Pilih sbg Duplikat"}
                            icon="pi pi-sign-in"
                            severity={isDup ? "danger" : "secondary"}
                            outlined={!isDup}
                            onClick={() => setSelectedDuplicate(p)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPrimary && selectedDuplicate && grp.profiles.some((p: any) => p.kode_tamu === selectedPrimary.kode_tamu) && (
                <div className="mt-3 p-3 bg-yellow-50 border-round flex justify-content-between align-items-center">
                  <span>Menggabungkan <strong>{selectedDuplicate.full_name} ({selectedDuplicate.kode_tamu})</strong> KE <strong>{selectedPrimary.full_name} ({selectedPrimary.kode_tamu})</strong></span>
                  <Button label="Gabungkan Sekarang (Merge)" icon="pi pi-sync" severity="danger" onClick={handleMerge} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
