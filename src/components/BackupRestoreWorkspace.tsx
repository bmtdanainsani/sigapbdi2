import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  DatabaseBackupPayload,
  exportFullDatabaseBackupToExcel,
  parseDatabaseBackupFromExcel,
} from '../utils/exportUtils';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  Users,
  ClipboardList,
  ScrollText,
  Bell,
  Sliders,
  Info,
  X,
  Check,
} from 'lucide-react';

export const BackupRestoreWorkspace: React.FC = () => {
  const {
    currentUser,
    users,
    applications,
    auditLogs,
    notifications,
    questions,
    scoringConfig,
    appSettings,
    isCloudConnected,
    setActiveTab,
    recordDatabaseBackup,
    restoreDatabaseFromBackup,
  } = useApp();

  // Backup module selection
  const [includeModules, setIncludeModules] = useState({
    applications: true,
    users: true,
    questions: true,
    configs: true,
    auditLogs: true,
    notifications: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Restore state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedBackup, setParsedBackup] = useState<DatabaseBackupPayload | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; message: string } | null>(null);

  // Role Guard: Strictly Super Admin
  if (currentUser.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 max-w-lg w-full space-y-4 shadow-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-400 mx-auto">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Akses Backup & Restore Dibatasi</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Menu pencadangan (backup) dan pemulihan (restore) database hanya dapat diakses oleh{' '}
            <strong className="text-white">Super Administrator</strong>.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </div>
    );
  }

  const toggleModule = (key: keyof typeof includeModules) => {
    setIncludeModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAnyModuleSelected = Object.values(includeModules).some(Boolean);

  const handleDownloadBackup = () => {
    if (!hasAnyModuleSelected || isExporting) return;
    setIsExporting(true);
    try {
      const exportedAt = new Date().toISOString();
      const appsToSave = includeModules.applications ? applications : undefined;
      const usersToSave = includeModules.users ? users : undefined;
      const questionsToSave = includeModules.questions ? questions : undefined;
      const logsToSave = includeModules.auditLogs ? auditLogs : undefined;
      const notifsToSave = includeModules.notifications ? notifications : undefined;

      const payload: DatabaseBackupPayload = {
        meta: {
          backupVersion: '1.0',
          exportedAt,
          exportedBy: `${currentUser.name} (@${currentUser.username})`,
          institutionName: appSettings.institutionName || 'BMT Dana Insani',
          counts: {
            applications: appsToSave?.length ?? 0,
            users: usersToSave?.length ?? 0,
            questions: questionsToSave?.length ?? 0,
            auditLogs: logsToSave?.length ?? 0,
            notifications: notifsToSave?.length ?? 0,
          },
        },
        applications: appsToSave,
        users: usersToSave,
        questions: questionsToSave,
        auditLogs: logsToSave,
        notifications: notifsToSave,
        scoringConfig: includeModules.configs ? scoringConfig : undefined,
        appSettings: includeModules.configs ? appSettings : undefined,
      };

      exportFullDatabaseBackupToExcel(payload);
      recordDatabaseBackup(payload.meta.counts);
      setLastBackupTime(exportedAt);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (file: File | null | undefined) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setParsedBackup(null);
    setParseError(null);
    setRestoreResult(null);
    setIsConfirmingRestore(false);
    setIsParsing(true);

    try {
      const parsed = await parseDatabaseBackupFromExcel(file);
      setParsedBackup(parsed);
    } catch (err) {
      setParseError(
        err instanceof Error
          ? err.message
          : 'Gagal membaca file Excel backup. Pastikan format file valid.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFileName(null);
    setParsedBackup(null);
    setParseError(null);
    setIsConfirmingRestore(false);
    setRestoreResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteRestore = async () => {
    if (!parsedBackup || isRestoring) return;
    setIsRestoring(true);
    setRestoreResult(null);
    try {
      const res = await restoreDatabaseFromBackup(parsedBackup, restoreMode);
      setRestoreResult(res);
      setIsConfirmingRestore(false);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Backup & Restore Database (.xlsx)
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Unduh seluruh database operasional (berkas survey beserta foto bukti, akun staf, checklist 5C, rumus scoring, pengaturan lembaga, log audit, dan notifikasi) ke dalam satu file Excel (.xlsx), dan pulihkan kembali kapan saja dari file backup serupa.
              </p>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shrink-0 ${
              isCloudConnected
                ? 'border-emerald-500/30 bg-emerald-950/50 text-emerald-300'
                : 'border-amber-500/30 bg-amber-950/50 text-amber-300'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isCloudConnected ? 'Cloud Firestore Terhubung' : 'Mode Cache Lokal'}</span>
          </div>
        </div>

        {/* Live Database Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Berkas Survey</span>
              <ClipboardList className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
              {applications.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Akun Staf</span>
              <Users className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <p className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
              {users.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Butir Checklist</span>
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
              {questions.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Log Audit</span>
              <ScrollText className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <p className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
              {auditLogs.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Notifikasi</span>
              <Bell className="h-3.5 w-3.5 text-teal-400" />
            </div>
            <p className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
              {notifications.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL: BACKUP TO EXCEL */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">1. Backup Database ke Excel (.xlsx)</h2>
                <p className="text-xs text-slate-400">
                  Pilih modul data yang ingin dicadangkan dan unduh sebagai file Excel terstruktur.
                </p>
              </div>
            </div>

            {/* Module Selection Checklist */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">Cakupan Data Backup:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {[
                  {
                    key: 'applications' as const,
                    label: 'Berkas Survey & Foto',
                    count: `${applications.length} berkas`,
                    icon: ClipboardList,
                  },
                  {
                    key: 'users' as const,
                    label: 'Akun Staf & Kredensial',
                    count: `${users.length} akun`,
                    icon: Users,
                  },
                  {
                    key: 'questions' as const,
                    label: 'Parameter Checklist 5C',
                    count: `${questions.length} butir`,
                    icon: ShieldCheck,
                  },
                  {
                    key: 'configs' as const,
                    label: 'Rumus Scoring & Pengaturan',
                    count: 'Bobot 5C & Branding',
                    icon: Sliders,
                  },
                  {
                    key: 'auditLogs' as const,
                    label: 'Log Aktivitas Audit',
                    count: `${auditLogs.length} catatan`,
                    icon: ScrollText,
                  },
                  {
                    key: 'notifications' as const,
                    label: 'Riwayat Notifikasi',
                    count: `${notifications.length} pesan`,
                    icon: Bell,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const checked = includeModules[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleModule(item.key)}
                      className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        checked
                          ? 'border-emerald-500/40 bg-emerald-950/30 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            checked ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{item.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{item.count}</p>
                        </div>
                      </div>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          checked
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Excel Workbook Format Info */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Struktur File Excel Backup (.xlsx):</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Workbook berisi sheet ringkasan yang mudah dibaca manusia (<strong className="text-slate-200">Info_Backup</strong>, <strong className="text-slate-200">Ringkasan_Pengajuan</strong>, <strong className="text-slate-200">Data_Staf</strong>, <strong className="text-slate-200">Checklist_5C</strong>, <strong className="text-slate-200">Log_Audit</strong>) serta sheet pemulihan utuh (<strong className="text-slate-200">_DB_RESTORE_DATA</strong>) agar seluruh data beserta foto KTP dan dokumen dapat direstore 100% akurat.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {lastBackupTime && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Backup terakhir diunduh pada{' '}
                  <strong className="font-mono">
                    {new Date(lastBackupTime).toLocaleString('id-ID')}
                  </strong>
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={!hasAnyModuleSelected || isExporting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Menyiapkan File Backup Excel...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Backup Database (.xlsx)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: RESTORE FROM EXCEL */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">2. Restore Database dari Excel (.xlsx)</h2>
                <p className="text-xs text-slate-400">
                  Unggah file Excel hasil backup sebelumnya untuk memulihkan data lokal & Cloud Firestore.
                </p>
              </div>
            </div>

            {/* File Input Upload Box */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
                id="backup-excel-upload"
              />

              {!selectedFileName ? (
                <label
                  htmlFor="backup-excel-upload"
                  className="flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/50 p-6 text-center cursor-pointer hover:border-sky-500/60 hover:bg-slate-900/80 transition-all"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Pilih File Backup Excel (.xlsx)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik untuk menelusuri file backup yang pernah diunduh dari menu ini
                    </p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileSpreadsheet className="h-4 w-4 text-sky-400 shrink-0" />
                    <span className="font-semibold text-white truncate">{selectedFileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedFile}
                    className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                    title="Hapus pilihan file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Loading Parse Indicator */}
            {isParsing && (
              <div className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-950/40 px-3.5 py-2.5 text-xs text-sky-300">
                <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
                <span>Membaca dan memvalidasi isi file backup Excel...</span>
              </div>
            )}

            {/* Parse Error */}
            {parseError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3.5 text-xs text-rose-200">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-100">File Backup Tidak Valid</p>
                  <p className="mt-0.5 text-rose-300/90 leading-relaxed">{parseError}</p>
                </div>
              </div>
            )}

            {/* Parsed Backup Preview */}
            {parsedBackup && (
              <div className="space-y-4">
                <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                      <HardDrive className="h-4 w-4 text-sky-400" />
                      <span>Pratinjau Data Backup Siap Pulih</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-sky-300">
                      v{parsedBackup.meta.backupVersion}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Lembaga: </span>
                      <span className="font-semibold text-white">
                        {parsedBackup.meta.institutionName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Waktu Backup: </span>
                      <span className="font-mono text-white">
                        {new Date(parsedBackup.meta.exportedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400">Dibuat Oleh: </span>
                      <span className="font-semibold text-white">
                        {parsedBackup.meta.exportedBy}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-sky-500/20 text-center">
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Survey</p>
                      <p className="font-mono text-xs font-bold text-white">
                        {parsedBackup.applications?.length ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Staf</p>
                      <p className="font-mono text-xs font-bold text-white">
                        {parsedBackup.users?.length ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Checklist</p>
                      <p className="font-mono text-xs font-bold text-white">
                        {parsedBackup.questions?.length ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Audit</p>
                      <p className="font-mono text-xs font-bold text-white">
                        {parsedBackup.auditLogs?.length ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Notif</p>
                      <p className="font-mono text-xs font-bold text-white">
                        {parsedBackup.notifications?.length ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Setting</p>
                      <p className="font-mono text-xs font-bold text-emerald-400">
                        {parsedBackup.scoringConfig || parsedBackup.appSettings ? 'Ya' : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Restore Mode Selector */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300">Metode Pemulihan Database:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setRestoreMode('merge');
                        setIsConfirmingRestore(false);
                      }}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        restoreMode === 'merge'
                          ? 'border-sky-500/50 bg-sky-950/40 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-bold flex items-center justify-between">
                        <span>Gabung Data (Merge)</span>
                        {restoreMode === 'merge' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-600 text-white">
                            Dipilih
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Menambahkan data yang belum ada & memperbarui ID yang cocok tanpa menghapus data terbaru saat ini.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRestoreMode('replace');
                        setIsConfirmingRestore(false);
                      }}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        restoreMode === 'replace'
                          ? 'border-amber-500/50 bg-amber-950/30 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-bold flex items-center justify-between">
                        <span>Timpa Penuh (Replace)</span>
                        {restoreMode === 'replace' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600 text-white">
                            Dipilih
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Mengembalikan isi database persis seperti saat backup dibuat (akun Super Admin aktif tetap dijaga).
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!parsedBackup && !parseError && !isParsing && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Gunakan file Excel (<strong className="text-slate-200">.xlsx</strong>) yang diunduh langsung dari tombol <strong className="text-slate-200">Download Backup Database</strong> di sebelah kiri agar proses restore berjalan akurat.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {restoreResult && (
              <div
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                  restoreResult.success
                    ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-950/50 text-rose-200'
                }`}
              >
                {restoreResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {restoreResult.success ? 'Pemulihan Database Selesai' : 'Pemulihan Gagal'}
                  </p>
                  <p className="mt-0.5 opacity-90">{restoreResult.message}</p>
                </div>
              </div>
            )}

            {parsedBackup && (
              isConfirmingRestore ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-3.5 space-y-2.5 text-xs">
                  <p className="font-bold text-amber-200">
                    Konfirmasi Restore Database ({restoreMode === 'replace' ? 'Timpa Penuh' : 'Gabung Data'})
                  </p>
                  <p className="text-[11px] text-amber-100/80 leading-relaxed">
                    {restoreMode === 'replace'
                      ? 'Perhatian: Data pengajuan & staf yang tidak ada di file backup ini akan dihapus dari sistem lokal dan Cloud Firestore.'
                      : 'Data dari file backup akan digabungkan dan disinkronkan ke sistem lokal dan Cloud Firestore.'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExecuteRestore}
                      disabled={isRestoring}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Menyinkronkan Database...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Ya, Jalankan Restore</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingRestore(false)}
                      disabled={isRestoring}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingRestore(true)}
                  disabled={isRestoring}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors shadow-md"
                >
                  <Upload className="h-4 w-4" />
                  <span>Pulihkan Database dari File Ini</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
