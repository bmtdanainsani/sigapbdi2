import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { OfficeAoEntry } from '../types';
import {
  Building2,
  UserPlus,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Lock,
  RefreshCw,
  Users,
  Search,
  AlertTriangle,
} from 'lucide-react';

export const OfficeAoManagement: React.FC = () => {
  const {
    currentUser,
    users,
    appSettings,
    updateAppSettings,
    setActiveTab,
  } = useApp();

  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeInitialAo, setNewOfficeInitialAo] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [newAoInputs, setNewAoInputs] = useState<Record<string, string>>({});
  const [editingOfficeId, setEditingOfficeId] = useState<string | null>(null);
  const [editingOfficeValue, setEditingOfficeValue] = useState('');
  const [editingAoKey, setEditingAoKey] = useState<{ officeId: string; index: number } | null>(null);
  const [editingAoValue, setEditingAoValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const catalog: OfficeAoEntry[] = useMemo(() => {
    return Array.isArray(appSettings.officeAoCatalog) ? appSettings.officeAoCatalog : [];
  }, [appSettings.officeAoCatalog]);

  // Access Guard: Menu ini hanya ada di user Super Admin
  if (currentUser.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 max-w-lg w-full space-y-4 shadow-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-400 mx-auto">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Menu Kelola Kantor &amp; AO Dibatasi</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Pengaturan daftar pilihan kantor dan nama Account Officer (AO) hanya dapat diakses oleh{' '}
            <strong className="text-white">Super Administrator</strong>.
          </p>
          <p className="text-[11px] text-slate-400 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            Peran Anda saat ini adalah <strong className="text-white">{currentUser.roleTitle}</strong> ({currentUser.branch}).
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </div>
    );
  }

  const saveCatalog = (nextCatalog: OfficeAoEntry[]) => {
    setErrorMsg(null);
    updateAppSettings({ officeAoCatalog: nextCatalog });
  };

  const handleAddOffice = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newOfficeName.trim();
    if (!cleanName) {
      setErrorMsg('Nama kantor / cabang wajib diisi.');
      return;
    }

    const exists = catalog.some(
      (item) => item.officeName.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      setErrorMsg(`Kantor "${cleanName}" sudah ada dalam daftar.`);
      return;
    }

    const initialAos = newOfficeInitialAo
      .split(',')
      .map((s) => s.trim())
      .filter((s, idx, arr) => Boolean(s) && arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === idx);

    const created: OfficeAoEntry = {
      id: `office-${Date.now()}`,
      officeName: cleanName,
      aoNames: initialAos,
    };

    saveCatalog([...catalog, created]);
    setNewOfficeName('');
    setNewOfficeInitialAo('');
    setSelectedOfficeId(created.id);
  };

  const handleDeleteOffice = (office: OfficeAoEntry) => {
    if (
      !window.confirm(
        `Hapus kantor "${office.officeName}" beserta ${office.aoNames.length} nama AO di dalamnya dari daftar pilihan?`
      )
    ) {
      return;
    }
    const next = catalog.filter((item) => item.id !== office.id);
    saveCatalog(next);
    if (selectedOfficeId === office.id) {
      setSelectedOfficeId(null);
    }
  };

  const handleStartEditOffice = (office: OfficeAoEntry) => {
    setEditingOfficeId(office.id);
    setEditingOfficeValue(office.officeName);
    setErrorMsg(null);
  };

  const handleSaveEditOffice = (officeId: string) => {
    const cleanName = editingOfficeValue.trim();
    if (!cleanName) {
      setErrorMsg('Nama kantor tidak boleh kosong.');
      return;
    }
    const duplicate = catalog.some(
      (item) => item.id !== officeId && item.officeName.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      setErrorMsg(`Kantor "${cleanName}" sudah terdaftar.`);
      return;
    }

    const next = catalog.map((item) =>
      item.id === officeId ? { ...item, officeName: cleanName } : item
    );
    saveCatalog(next);
    setEditingOfficeId(null);
    setEditingOfficeValue('');
  };

  const handleAddAo = (officeId: string) => {
    const raw = (newAoInputs[officeId] || '').trim();
    if (!raw) {
      setErrorMsg('Nama Account Officer (AO) tidak boleh kosong.');
      return;
    }

    const targetOffice = catalog.find((o) => o.id === officeId);
    if (!targetOffice) return;

    const alreadyExists = targetOffice.aoNames.some(
      (name) => name.trim().toLowerCase() === raw.toLowerCase()
    );
    if (alreadyExists) {
      setErrorMsg(`Nama AO "${raw}" sudah ada di ${targetOffice.officeName}.`);
      return;
    }

    const next = catalog.map((item) =>
      item.id === officeId ? { ...item, aoNames: [...item.aoNames, raw] } : item
    );
    saveCatalog(next);
    setNewAoInputs((prev) => ({ ...prev, [officeId]: '' }));
  };

  const handleRemoveAo = (officeId: string, index: number) => {
    const next = catalog.map((item) =>
      item.id === officeId
        ? { ...item, aoNames: item.aoNames.filter((_, idx) => idx !== index) }
        : item
    );
    saveCatalog(next);
  };

  const handleSaveEditAo = (officeId: string, index: number) => {
    const cleanAo = editingAoValue.trim();
    if (!cleanAo) {
      setErrorMsg('Nama AO tidak boleh kosong.');
      return;
    }
    const targetOffice = catalog.find((o) => o.id === officeId);
    if (!targetOffice) return;
    const duplicate = targetOffice.aoNames.some(
      (n, idx) => idx !== index && n.trim().toLowerCase() === cleanAo.toLowerCase()
    );
    if (duplicate) {
      setErrorMsg(`Nama AO "${cleanAo}" sudah ada di ${targetOffice.officeName}.`);
      return;
    }

    const next = catalog.map((item) =>
      item.id === officeId
        ? {
            ...item,
            aoNames: item.aoNames.map((n, idx) => (idx === index ? cleanAo : n)),
          }
        : item
    );
    saveCatalog(next);
    setEditingAoKey(null);
    setEditingAoValue('');
  };

  const handleSyncFromStaffUsers = () => {
    const officeMap = new Map<string, OfficeAoEntry>();
    catalog.forEach((entry) => {
      officeMap.set(entry.officeName.trim().toLowerCase(), {
        ...entry,
        aoNames: [...entry.aoNames],
      });
    });

    users.forEach((user) => {
      const branchName = (user.branch || '').trim();
      if (!branchName) return;
      const key = branchName.toLowerCase();
      if (!officeMap.has(key)) {
        officeMap.set(key, {
          id: `office-sync-${Date.now()}-${officeMap.size}`,
          officeName: branchName,
          aoNames: [],
        });
      }
      if (user.role === 'marketing' && user.name.trim()) {
        const entry = officeMap.get(key)!;
        const existsAo = entry.aoNames.some(
          (n) => n.trim().toLowerCase() === user.name.trim().toLowerCase()
        );
        if (!existsAo) {
          entry.aoNames.push(user.name.trim());
        }
      }
    });

    saveCatalog(Array.from(officeMap.values()));
  };

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (office) =>
        office.officeName.toLowerCase().includes(q) ||
        office.aoNames.some((ao) => ao.toLowerCase().includes(q))
    );
  }, [catalog, searchQuery]);

  const totalAos = useMemo(
    () => catalog.reduce((sum, item) => sum + item.aoNames.length, 0),
    [catalog]
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white">Kelola Pilihan Kantor &amp; Nama AO</h2>
              <span className="text-xs font-mono text-emerald-400">
                Super Admin · {catalog.length} Kantor · {totalAos} AO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tambahkan dan kelola daftar kantor cabang serta nama Account Officer (AO) yang tampil pada Form Survey dan Filter Dasbor.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncFromStaffUsers}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
          <span>Sinkronkan dari Akun Staf</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-950/60 px-4 py-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add New Office Form */}
      <form
        onSubmit={handleAddOffice}
        className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Plus className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Tambah Kantor / Cabang Baru</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-xs">
          <div className="md:col-span-5">
            <label className="block text-slate-300 font-medium mb-1">
              Nama Kantor / Cabang <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={newOfficeName}
              onChange={(e) => setNewOfficeName(e.target.value)}
              placeholder="Contoh: Cabang Depok / Cabang Bekasi"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-slate-300 font-medium mb-1">
              Nama AO Awal (Opsional, pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={newOfficeInitialAo}
              onChange={(e) => setNewOfficeInitialAo(e.target.value)}
              placeholder="Contoh: Andi Wijaya, Siti Aminah"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kantor</span>
            </button>
          </div>
        </div>
      </form>

      {/* Search & Offices List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">
            Daftar Kantor &amp; Account Officer ({filteredCatalog.length})
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kantor atau nama AO..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {filteredCatalog.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-10 text-center text-xs text-slate-400">
            Belum ada kantor yang cocok dengan pencarian Anda. Tambahkan kantor baru di atas.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCatalog.map((office) => {
              const isEditingOffice = editingOfficeId === office.id;
              return (
                <div
                  key={office.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between gap-4"
                >
                  {/* Office Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    {isEditingOffice ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingOfficeValue}
                          onChange={(e) => setEditingOfficeValue(e.target.value)}
                          className="flex-1 rounded-lg border border-emerald-500/60 bg-slate-800 px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditOffice(office.id)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                          title="Simpan Nama Kantor"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingOfficeId(null)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          title="Batal"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <h4 className="text-sm font-bold text-white">{office.officeName}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {office.aoNames.length} Account Officer terdaftar
                        </p>
                      </div>
                    )}

                    {!isEditingOffice && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditOffice(office)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Ubah Nama Kantor"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOffice(office)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="Hapus Kantor"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AO List inside Office */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>Daftar Nama AO</span>
                      </span>
                    </div>

                    {office.aoNames.length === 0 ? (
                      <p className="text-[11px] text-slate-500 py-2">
                        Belum ada nama AO terdaftar di kantor ini. Tambahkan nama AO di bawah.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-800/80 rounded-lg border border-slate-800/80 bg-slate-950/40">
                        {office.aoNames.map((aoName, idx) => {
                          const isEditingThisAo =
                            editingAoKey?.officeId === office.id && editingAoKey.index === idx;
                          return (
                            <li
                              key={`${office.id}-ao-${idx}`}
                              className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
                            >
                              {isEditingThisAo ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingAoValue}
                                    onChange={(e) => setEditingAoValue(e.target.value)}
                                    className="flex-1 rounded border border-emerald-500/60 bg-slate-800 px-2 py-1 text-xs text-white focus:outline-hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditAo(office.id, idx)}
                                    className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingAoKey(null)}
                                    className="p-1 rounded bg-slate-800 text-slate-300"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-slate-200 font-medium truncate">
                                    {idx + 1}. {aoName}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingAoKey({ officeId: office.id, index: idx });
                                        setEditingAoValue(aoName);
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                                      title="Edit Nama AO"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAo(office.id, idx)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                                      title="Hapus Nama AO"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Add AO to Office */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <input
                      type="text"
                      value={newAoInputs[office.id] || ''}
                      onChange={(e) =>
                        setNewAoInputs((prev) => ({ ...prev, [office.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAo(office.id);
                        }
                      }}
                      placeholder={`Tambah nama AO di ${office.officeName}...`}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAo(office.id)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors shrink-0"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Tambah AO</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
