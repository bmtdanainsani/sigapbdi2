import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RiskVerificationStatus, SurveyApplication } from '../types';
import {
  ShieldCheck,
  Search,
  Filter,
  Building2,
  Eye,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  Calendar,
  MapPin,
  FileText,
  Scale,
  BadgeCheck,
  ShieldAlert,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

type RiskFilterType = 'ready' | 'verified' | 'need_correction' | 'waiting_analyst' | 'all';
type ReadOnlyTab = 'ringkasan' | 'keuangan_agunan' | 'checklist' | 'dokumen';

const isScheduledOrReviewedByAnalyst = (app: SurveyApplication): boolean =>
  app.analystCheck?.status === 'verified_scheduled' ||
  Boolean(app.analystCheck?.committeeSchedule) ||
  Boolean(app.adminReview);

export const RiskManagementWorkspace: React.FC = () => {
  const {
    applications,
    questions,
    currentUser,
    verifyApplicationByRiskManagement,
    viewApplicationDetails,
    printApplicationReport,
  } = useApp();

  const [filterTab, setFilterTab] = useState<RiskFilterType>('ready');
  const [readTab, setReadTab] = useState<ReadOnlyTab>('ringkasan');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [verificationStatus, setVerificationStatus] = useState<RiskVerificationStatus>('verified');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Risk Management sees all applications validated by Branch Manager
  const bmValidatedApps = useMemo(
    () => applications.filter((a) => a.branchValidation?.status === 'valid'),
    [applications]
  );

  const uniqueBranches = useMemo(() => {
    const branches = Array.from(new Set(bmValidatedApps.map((a) => a.cabang).filter(Boolean)));
    return branches.sort();
  }, [bmValidatedApps]);

  const counts = useMemo(() => {
    const ready = bmValidatedApps.filter((a) => isScheduledOrReviewedByAnalyst(a) && !a.riskVerification).length;
    const verified = bmValidatedApps.filter((a) => a.riskVerification?.status === 'verified').length;
    const needCorrection = bmValidatedApps.filter((a) => a.riskVerification?.status === 'need_correction').length;
    const waitingAnalyst = bmValidatedApps.filter((a) => !isScheduledOrReviewedByAnalyst(a)).length;
    return {
      ready,
      verified,
      needCorrection,
      waitingAnalyst,
      all: bmValidatedApps.length,
    };
  }, [bmValidatedApps]);

  const filteredApps = useMemo(() => {
    return bmValidatedApps.filter((app) => {
      const analystReady = isScheduledOrReviewedByAnalyst(app);
      if (filterTab === 'ready' && (!analystReady || Boolean(app.riskVerification))) return false;
      if (filterTab === 'verified' && app.riskVerification?.status !== 'verified') return false;
      if (filterTab === 'need_correction' && app.riskVerification?.status !== 'need_correction') return false;
      if (filterTab === 'waiting_analyst' && analystReady) return false;

      if (branchFilter !== 'ALL' && app.cabang !== branchFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          app.namaDebitur.toLowerCase().includes(q) ||
          app.applicationNumber.toLowerCase().includes(q) ||
          app.cabang.toLowerCase().includes(q) ||
          app.jenisUsaha.toLowerCase().includes(q) ||
          (app.analystCheck?.committeeSchedule?.noAgenda || '').toLowerCase().includes(q) ||
          (app.adminReview?.committeeDoc?.noNotulen || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [bmValidatedApps, filterTab, branchFilter, searchQuery]);

  const selectedApp: SurveyApplication | null = useMemo(() => {
    if (selectedId) {
      const found = filteredApps.find((a) => a.id === selectedId);
      if (found) return found;
    }
    return filteredApps[0] || null;
  }, [filteredApps, selectedId]);

  useEffect(() => {
    if (selectedApp) {
      setVerificationStatus(selectedApp.riskVerification?.status || 'verified');
      setVerificationNotes(selectedApp.riskVerification?.notes || '');
      setFormError('');
    }
  }, [selectedApp?.id]);

  const canVerify = currentUser.role === 'risk_management' || currentUser.role === 'super_admin';

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !canVerify || !isScheduledOrReviewedByAnalyst(selectedApp)) return;

    if (verificationStatus === 'need_correction' && !verificationNotes.trim()) {
      setFormError('Catatan koreksi risiko wajib diisi jika memilih status Catatan Koreksi Risiko.');
      return;
    }

    setFormError('');
    verifyApplicationByRiskManagement(selectedApp.id, {
      status: verificationStatus,
      notes:
        verificationNotes.trim() ||
        'Telah dilakukan pemeriksaan ulang & verifikasi manajemen risiko. Profil risiko dan syarat komite dinyatakan memadai.',
    });
  };

  const formatRupiah = (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      {/* Top Role Scope & Governance Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Divisi Manajemen Risiko — Koreksi Ulang & Verifikasi Komite
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  <Lock className="h-3 w-3" /> Read-Only Data · Verifikasi & Catatan
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                Posisi Manajemen Risiko memeriksa ulang berkas setelah dikoreksi &amp; dijadwalkan sidang komite oleh Analis,
                memberikan <strong className="text-white">catatan koreksi risiko</strong> bila diperlukan, serta menyematkan{' '}
                <strong className="text-cyan-300">Tanda Verifikasi Resmi</strong> yang tampil langsung di Lembar / Berita Acara Komite.
                Data survey, plafon, tenor, dan pencairan tidak dapat diubah dari peran ini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Petugas Aktif</p>
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[10px] font-mono text-cyan-400">{currentUser.roleTitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setFilterTab('ready')}
          className={`text-left rounded-xl border p-3.5 transition-all ${
            filterTab === 'ready'
              ? 'border-cyan-500/60 bg-cyan-950/40 ring-1 ring-cyan-500/30'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Siap Verifikasi</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1.5 font-mono">{counts.ready}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sudah dijadwalkan Analis</p>
        </button>

        <button
          onClick={() => setFilterTab('verified')}
          className={`text-left rounded-xl border p-3.5 transition-all ${
            filterTab === 'verified'
              ? 'border-emerald-500/60 bg-emerald-950/40 ring-1 ring-emerald-500/30'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Terverifikasi Sah</span>
            <BadgeCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1.5 font-mono">{counts.verified}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Tanda verifikasi terpasang</p>
        </button>

        <button
          onClick={() => setFilterTab('need_correction')}
          className={`text-left rounded-xl border p-3.5 transition-all ${
            filterTab === 'need_correction'
              ? 'border-amber-500/60 bg-amber-950/40 ring-1 ring-amber-500/30'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Catatan Koreksi</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1.5 font-mono">{counts.needCorrection}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Perlu penyesuaian komite</p>
        </button>

        <button
          onClick={() => setFilterTab('waiting_analyst')}
          className={`text-left rounded-xl border p-3.5 transition-all ${
            filterTab === 'waiting_analyst'
              ? 'border-indigo-500/60 bg-indigo-950/40 ring-1 ring-indigo-500/30'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Menunggu Analis</span>
            <FileText className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1.5 font-mono">{counts.waitingAnalyst}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Lolos BM · belum dijadwalkan</p>
        </button>

        <button
          onClick={() => setFilterTab('all')}
          className={`text-left rounded-xl border p-3.5 transition-all col-span-2 sm:col-span-1 ${
            filterTab === 'all'
              ? 'border-slate-500 bg-slate-800/80 ring-1 ring-slate-500/40'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Semua Berkas</span>
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1.5 font-mono">{counts.all}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total lolos validasi BM</p>
        </button>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Application Queue */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Antrean Pemeriksaan Risiko</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {filteredApps.length} Berkas
              </span>
            </div>

            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari debitur, no. berkas, no. notulen..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-hidden"
              >
                <option value="ALL">Semua Kantor Cabang ({uniqueBranches.length})</option>
                {uniqueBranches.map((br) => (
                  <option key={br} value={br}>
                    {br}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[680px] overflow-y-auto">
            {filteredApps.length === 0 ? (
              <div className="p-8 text-center">
                <ShieldCheck className="h-10 w-10 text-slate-600 mx-auto mb-2.5" />
                <p className="text-xs font-semibold text-slate-300">Tidak ada berkas pada filter ini</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Coba pilih tab filter lain atau tunggu Analis Komite menyelesaikan review &amp; penjadwalan komite.
                </p>
              </div>
            ) : (
              filteredApps.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                const rv = app.riskVerification;
                const hasAnalyst = isScheduledOrReviewedByAnalyst(app);
                const agendaLabel =
                  app.analystCheck?.committeeSchedule?.noAgenda ||
                  app.adminReview?.committeeDoc?.noNotulen ||
                  'Terjadwal Komite';

                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedId(app.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/35 border-l-4 border-l-cyan-400'
                        : 'hover:bg-slate-800/50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-cyan-400">
                            {app.applicationNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">·</span>
                          <span className="text-[10px] text-slate-400 truncate">{app.cabang}</span>
                        </div>
                        <p className="text-xs font-bold text-white mt-0.5 truncate">{app.namaDebitur}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {app.jenisUsaha} · {formatRupiah(app.adminReview?.approvedPlafon || app.financial.plafonDiajukan)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                            app.scoring.totalScore >= 80
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                              : app.scoring.totalScore >= 65
                              ? 'bg-sky-950/70 text-sky-300 border-sky-500/30'
                              : 'bg-amber-950/70 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          Skor {app.scoring.totalScore}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {hasAnalyst ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/30 text-[10px] text-indigo-300 font-semibold">
                          <Calendar className="h-2.5 w-2.5" />
                          Analis: {agendaLabel}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400">
                          <Clock className="h-2.5 w-2.5" />
                          Menunggu Analis Komite
                        </span>
                      )}

                      {rv ? (
                        rv.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-300 font-bold">
                            <BadgeCheck className="h-2.5 w-2.5" />
                            Terverifikasi Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-[10px] text-amber-300 font-bold">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Koreksi Risk
                          </span>
                        )
                      ) : hasAnalyst ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold">
                          Perlu Verifikasi Risk
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Read-Only Dossier + Risk Verification Form */}
        <div className="lg:col-span-7 space-y-5">
          {!selectedApp ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <ShieldCheck className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">Pilih Berkas untuk Diperiksa</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Pilih salah satu pengajuan di daftar sebelah kiri untuk melihat hasil survey, validasi BM, penjadwalan komite Analis, dan memberikan tanda verifikasi Manajemen Risiko.
              </p>
            </div>
          ) : (
            <>
              {/* Header Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/70 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                        {selectedApp.applicationNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {selectedApp.cabang}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        AO: <strong className="text-slate-200">{selectedApp.marketingName}</strong>
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-white mt-2">{selectedApp.namaDebitur}</h3>
                    <p className="text-xs text-slate-400">
                      {selectedApp.jenisUsaha} (Lama usaha {selectedApp.lamaUsahaBulan} bln) · NIK: {selectedApp.nik}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => viewApplicationDetails(selectedApp)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Lihat Berkas Lengkap</span>
                    </button>
                    <button
                      onClick={() => printApplicationReport(selectedApp)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-600/20 hover:bg-emerald-600/30 px-3 py-2 text-xs font-bold text-emerald-300 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Cetak Lembar Komite</span>
                    </button>
                  </div>
                </div>

                {/* Read-Only Key Risk Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
                  <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Skor &amp; Grade 5C</p>
                    <p className="text-base font-extrabold text-white font-mono mt-0.5">
                      {selectedApp.scoring.totalScore}/100
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-400 truncate">
                      {selectedApp.scoring.ratingGrade}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Rasio DSR</p>
                    <p
                      className={`text-base font-extrabold font-mono mt-0.5 ${
                        selectedApp.financial.dsrRatio <= 35
                          ? 'text-emerald-400'
                          : selectedApp.financial.dsrRatio <= 45
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {selectedApp.financial.dsrRatio.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Cashflow: {formatRupiah(selectedApp.financial.availableCashflow)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Agunan &amp; LTV</p>
                    <p className="text-base font-extrabold text-white font-mono mt-0.5">
                      {selectedApp.collateral.persentaseLtv.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {selectedApp.collateral.jenisJaminan} ({formatRupiah(selectedApp.collateral.nilaiPasarTaksasi)})
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Fraud Red Flag</p>
                    <p
                      className={`text-base font-extrabold font-mono mt-0.5 ${
                        selectedApp.fraudEvaluation.hasRedFlags ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {selectedApp.fraudEvaluation.hasRedFlags
                        ? `${selectedApp.fraudEvaluation.detectedFlags.length} Temuan`
                        : '0 Temuan'}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase">
                      Severity: {selectedApp.fraudEvaluation.riskSeverity}
                    </p>
                  </div>
                </div>

                {/* Fraud warning if any */}
                {selectedApp.fraudEvaluation.hasRedFlags && (
                  <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                      <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                      <span>Indikator Red Flag Terdeteksi pada Survey Lapangan:</span>
                    </div>
                    <ul className="mt-1.5 space-y-1 text-[11px] text-rose-200 list-disc list-inside">
                      {selectedApp.fraudEvaluation.detectedFlags.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Read-Only Data Inspection Panel (Membaca seluruh data tanpa kemampuan mengubah) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-lg">
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'ringkasan', label: 'Identitas, BM & Jadwal Analis' },
                        { id: 'keuangan_agunan', label: 'Keuangan & Agunan' },
                        { id: 'checklist', label: `Checklist 5C (${selectedApp.checklistAnswers.length})` },
                        { id: 'dokumen', label: 'Foto & Geotagging' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setReadTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          readTab === tab.id
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    <Lock className="h-3 w-3 text-cyan-400" />
                    <span>Read-Only</span>
                  </span>
                </div>

                <div className="p-4 text-xs">
                  {readTab === 'ringkasan' && (
                    <div className="space-y-4">
                      {/* Debitur Profile Read-only */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                        <div>
                          <span className="text-[10px] text-slate-500 block">No. KK / HP</span>
                          <span className="text-slate-200 font-mono">{selectedApp.noKk} · {selectedApp.noHp}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Status Pernikahan</span>
                          <span className="text-slate-200">
                            {selectedApp.statusPernikahan}
                            {selectedApp.namaPasangan ? ` (${selectedApp.namaPasangan})` : ''}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-500 block">Alamat Domisili</span>
                          <span className="text-slate-200">{selectedApp.alamatDomisili}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* BM Validation Summary */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                              <UserCheck className="h-4 w-4 text-indigo-400" />
                              Validasi Branch Manager (Read-Only)
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-bold uppercase">
                              Sah Cabang
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 space-y-1">
                            <p>
                              Validator: <strong className="text-white">{selectedApp.branchValidation?.validatedBy || '-'}</strong>
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Tanggal:{' '}
                              {selectedApp.branchValidation?.validatedAt
                                ? new Date(selectedApp.branchValidation.validatedAt).toLocaleString('id-ID')
                                : '-'}
                            </p>
                            {selectedApp.branchValidation?.rekomendasiPlafonBM && (
                              <p className="text-[11px] text-indigo-300 font-mono">
                                Rek. Cabang: {formatRupiah(selectedApp.branchValidation.rekomendasiPlafonBM)} /{' '}
                                {selectedApp.branchValidation.rekomendasiTenorBM || selectedApp.financial.tenorBulanDiajukan} bln
                              </p>
                            )}
                            <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 text-[11px] text-slate-300 italic">
                              &ldquo;{selectedApp.branchValidation?.notes || 'Tidak ada catatan khusus BM'}&rdquo;
                            </div>
                          </div>
                        </div>

                        {/* Analyst Verification & Committee Schedule Summary */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                              <Scale className="h-4 w-4 text-emerald-400" />
                              Pemeriksaan &amp; Jadwal Analis Komite (Read-Only)
                            </span>
                            {selectedApp.adminReview ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-bold uppercase">
                                {selectedApp.adminReview.decision === 'approved'
                                  ? 'Disetujui'
                                  : selectedApp.adminReview.decision === 'conditional_approval'
                                  ? 'Bersyarat'
                                  : selectedApp.adminReview.decision === 'rejected'
                                  ? 'Ditolak'
                                  : 'Review'}
                              </span>
                            ) : selectedApp.analystCheck?.status === 'verified_scheduled' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/70 border border-sky-500/30 text-sky-300 font-bold uppercase">
                                Terjadwal Komite
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-semibold">
                                Belum Dijadwalkan
                              </span>
                            )}
                          </div>

                          {selectedApp.analystCheck?.committeeSchedule || selectedApp.adminReview ? (
                            <div className="text-xs text-slate-300 space-y-1.5">
                              <p>
                                Analis / Komite:{' '}
                                <strong className="text-white">
                                  {selectedApp.adminReview?.reviewedBy || selectedApp.analystCheck?.checkedBy || '-'}
                                </strong>
                              </p>
                              {selectedApp.adminReview && (
                                <p className="text-[11px] font-mono text-emerald-300">
                                  Putusan Komite: {formatRupiah(selectedApp.adminReview.approvedPlafon)} · Tenor{' '}
                                  {selectedApp.adminReview.approvedTenor} bln
                                </p>
                              )}
                              <div className="text-[11px] text-slate-300 space-y-0.5 bg-slate-900/80 border border-slate-800 rounded-lg p-2">
                                <p>
                                  No. Agenda / Notulen:{' '}
                                  <strong className="font-mono text-white">
                                    {selectedApp.adminReview?.committeeDoc?.noNotulen ||
                                      selectedApp.analystCheck?.committeeSchedule?.noAgenda ||
                                      '-'}
                                  </strong>
                                </p>
                                <p className="flex items-center gap-1 text-slate-400">
                                  <Calendar className="h-3 w-3 text-cyan-400" />
                                  Jadwal Sidang:{' '}
                                  <span className="text-slate-200 font-mono">
                                    {(
                                      selectedApp.adminReview?.committeeDoc?.waktuSidang ||
                                      selectedApp.analystCheck?.committeeSchedule?.waktuSidang ||
                                      '-'
                                    ).replace('T', ' ')}
                                  </span>
                                </p>
                                <p className="flex items-center gap-1 text-slate-400">
                                  <MapPin className="h-3 w-3 text-cyan-400" />
                                  Lokasi:{' '}
                                  <span className="text-slate-200">
                                    {selectedApp.adminReview?.committeeDoc?.lokasiSidang ||
                                      selectedApp.analystCheck?.committeeSchedule?.lokasiSidang ||
                                      '-'}
                                  </span>
                                </p>
                              </div>
                              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 text-[11px] text-slate-300 italic">
                                &ldquo;
                                {selectedApp.adminReview?.notes ||
                                  selectedApp.analystCheck?.notes ||
                                  'Berkas terverifikasi Analis'}
                                &rdquo;
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-center">
                              <Clock className="h-6 w-6 text-slate-500 mx-auto mb-1.5" />
                              <p className="text-xs font-semibold text-slate-300">Menunggu Analis Komite</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Analis belum memverifikasi dan menjadwalkan sidang komite untuk berkas ini.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {readTab === 'keuangan_agunan' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                          <span className="text-[10px] text-slate-400 block">Omzet Bulanan</span>
                          <span className="font-mono font-bold text-white">{formatRupiah(selectedApp.financial.omzetBulanan)}</span>
                        </div>
                        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                          <span className="text-[10px] text-slate-400 block">Laba Usaha Bersih</span>
                          <span className="font-mono font-bold text-emerald-400">{formatRupiah(selectedApp.financial.labaUsahaBersih)}</span>
                        </div>
                        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                          <span className="text-[10px] text-slate-400 block">Biaya Rumah Tangga &amp; HPP</span>
                          <span className="font-mono text-slate-200">
                            {formatRupiah(selectedApp.financial.kebutuhanRumahTangga + selectedApp.financial.biayaHppUsaha)}
                          </span>
                        </div>
                        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                          <span className="text-[10px] text-slate-400 block">Plafon &amp; Tenor Diajukan</span>
                          <span className="font-mono font-bold text-white">
                            {formatRupiah(selectedApp.financial.plafonDiajukan)} · {selectedApp.financial.tenorBulanDiajukan} Bln
                          </span>
                        </div>
                        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                          <span className="text-[10px] text-slate-400 block">Estimasi Angsuran / Bln</span>
                          <span className="font-mono font-bold text-sky-300">
                            {formatRupiah(selectedApp.financial.estimasiAngsuranDiajukan)}
                          </span>
                        </div>
                        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                          <span className="text-[10px] text-slate-400 block">Stress Test Cashflow (-20%)</span>
                          <span className="font-mono font-bold text-amber-300">
                            {formatRupiah(selectedApp.financial.stressTestCashflow)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          Rincian Agunan ({(selectedApp.collaterals && selectedApp.collaterals.length > 0 ? selectedApp.collaterals : [selectedApp.collateral]).length} Item)
                        </p>
                        {(selectedApp.collaterals && selectedApp.collaterals.length > 0
                          ? selectedApp.collaterals
                          : [selectedApp.collateral]
                        ).map((col, idx) => (
                          <div
                            key={col.id || idx}
                            className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <p className="font-bold text-white">
                                #{idx + 1} {col.jenisJaminan} · No. {col.nomorDokumen || '-'}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Atas Nama: <strong className="text-slate-200">{col.atasNama}</strong> ({col.hubunganPemilik})
                                {col.keterangan ? ` · ${col.keterangan}` : ''}
                              </p>
                            </div>
                            <div className="text-left sm:text-right font-mono shrink-0">
                              <p className="text-emerald-400 font-bold">Pasar: {formatRupiah(col.nilaiPasarTaksasi)}</p>
                              <p className="text-[11px] text-slate-400">
                                Likuidasi: {formatRupiah(col.nilaiLikuidasi)} · LTV {col.persentaseLtv.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {readTab === 'checklist' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {[
                          { label: 'Character', val: selectedApp.scoring.characterScore },
                          { label: 'Capacity', val: selectedApp.scoring.capacityScore },
                          { label: 'Capital', val: selectedApp.scoring.capitalScore },
                          { label: 'Collateral', val: selectedApp.scoring.collateralScore },
                          { label: 'Condition', val: selectedApp.scoring.conditionScore },
                        ].map((s) => (
                          <div key={s.label} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                            <span className="text-[10px] text-slate-400 block">{s.label}</span>
                            <span className="text-sm font-black font-mono text-cyan-300">{s.val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800/70 bg-slate-950/40">
                        {selectedApp.checklistAnswers.map((ans) => {
                          const qDef = questions.find((q) => q.id === ans.questionId);
                          return (
                            <div key={ans.questionId} className="px-3 py-2 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-slate-200 font-medium">
                                  <span className="font-mono text-[10px] text-slate-400 mr-1.5">[{ans.code}]</span>
                                  {qDef?.question || `Pertanyaan #${ans.questionId}`}
                                </p>
                                {ans.notes && <p className="text-[11px] text-slate-400 italic mt-0.5">Catatan: {ans.notes}</p>}
                              </div>
                              <span
                                className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  ans.status === 'sesuai'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                    : ans.status === 'cukup'
                                    ? 'bg-sky-950 text-sky-300 border border-sky-500/30'
                                    : ans.status === 'tidak_sesuai'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {ans.status.replace('_', ' ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {readTab === 'dokumen' && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span>
                          Lokasi GPS Survey: <strong className="font-mono text-cyan-300">{selectedApp.evidence.lokasiGps}</strong>
                        </span>
                        <span className="text-slate-400">
                          Tanggal Survey: {selectedApp.evidence.tanggalSurvey} ({selectedApp.evidence.surveyorName})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { title: 'Foto KTP Pemohon', url: selectedApp.evidence.fotoKtp },
                          { title: 'Foto KTP Pendamping', url: selectedApp.evidence.fotoKtpPendamping },
                          { title: 'Foto Debitur', url: selectedApp.evidence.fotoDebitur },
                          { title: 'Foto Lokasi Usaha', url: selectedApp.evidence.fotoRumahUsaha },
                          { title: 'Foto Stok / Aset', url: selectedApp.evidence.fotoStokAset },
                          { title: 'Bukti Penghasilan', url: selectedApp.evidence.fotoBuktiPenghasilan },
                        ]
                          .filter((item) => Boolean(item.url))
                          .map((item) => (
                            <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                              <p className="text-[10px] font-bold text-slate-300 mb-1.5">{item.title}</p>
                              <img
                                src={item.url}
                                alt={item.title}
                                className="h-28 w-full object-cover rounded-lg border border-slate-800"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Management Verification & Notes Section */}
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">
                        Koreksi Akhir &amp; Tanda Verifikasi Manajemen Risiko
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Tanda verifikasi dan catatan ini akan tampil langsung pada Form saat Sidang Komite berlangsung serta di Berita Acara PDF.
                      </p>
                    </div>
                  </div>

                  {selectedApp.riskVerification && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono border ${
                        selectedApp.riskVerification.status === 'verified'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {selectedApp.riskVerification.verificationCode}
                    </span>
                  )}
                </div>

                {/* Current Stamp Preview */}
                {selectedApp.riskVerification && (
                  <div
                    className={`rounded-xl border p-3.5 ${
                      selectedApp.riskVerification.status === 'verified'
                        ? 'border-emerald-500/30 bg-emerald-950/30'
                        : 'border-amber-500/30 bg-amber-950/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`text-xs font-extrabold uppercase tracking-wide ${
                          selectedApp.riskVerification.status === 'verified' ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {selectedApp.riskVerification.status === 'verified'
                          ? '✓ TERVERIFIKASI MANAJEMEN RISIKO'
                          : '! CATATAN KOREKSI MANAJEMEN RISIKO'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(selectedApp.riskVerification.verifiedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                      &ldquo;{selectedApp.riskVerification.notes}&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Diverifikasi oleh: <strong className="text-white">{selectedApp.riskVerification.verifiedBy}</strong>
                    </p>
                  </div>
                )}

                {!isScheduledOrReviewedByAnalyst(selectedApp) ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 flex items-start gap-3">
                    <Lock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-300">
                        Form Verifikasi Risiko Terkunci Sementara
                      </p>
                      <p className="text-[11px] text-amber-200/90 mt-1 leading-relaxed">
                        Sesuai alur operasional, Manajemen Risiko memberikan tanda verifikasi dan koreksi setelah berkas diperiksa dan dijadwalkan komite oleh Analis Kredit. Saat ini Anda dapat membaca seluruh data di atas secara read-only.
                      </p>
                    </div>
                  </div>
                ) : !canVerify ? (
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-400">
                    Akun Anda bukan peran Manajemen Risiko atau Super Administrator.
                  </div>
                ) : (
                  <form onSubmit={handleSubmitVerification} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Pilih Status Pemeriksaan &amp; Tanda Verifikasi
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setVerificationStatus('verified')}
                          className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                            verificationStatus === 'verified'
                              ? 'border-emerald-500 bg-emerald-950/50 ring-1 ring-emerald-500/40'
                              : 'border-slate-700 bg-slate-950/50 hover:border-slate-600'
                          }`}
                        >
                          <CheckCircle2
                            className={`h-5 w-5 shrink-0 mt-0.5 ${
                              verificationStatus === 'verified' ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          />
                          <div>
                            <p className="text-xs font-bold text-white">Beri Tanda Verifikasi Sah</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Analisa &amp; jadwal komite sudah sesuai mitigasi risiko. Sematkan stempel verifikasi di Lembar Komite.
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVerificationStatus('need_correction')}
                          className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                            verificationStatus === 'need_correction'
                              ? 'border-amber-500 bg-amber-950/50 ring-1 ring-amber-500/40'
                              : 'border-slate-700 bg-slate-950/50 hover:border-slate-600'
                          }`}
                        >
                          <AlertTriangle
                            className={`h-5 w-5 shrink-0 mt-0.5 ${
                              verificationStatus === 'need_correction' ? 'text-amber-400' : 'text-slate-500'
                            }`}
                          />
                          <div>
                            <p className="text-xs font-bold text-white">Beri Catatan Koreksi Risiko</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Terdapat poin risiko yang perlu dikoreksi/diperketat oleh Komite &amp; Analis sebelum realisasi.
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Catatan Koreksi &amp; Mitigasi Manajemen Risiko
                        {verificationStatus === 'need_correction' && <span className="text-rose-400"> *</span>}
                      </label>
                      <textarea
                        rows={4}
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        placeholder={
                          verificationStatus === 'verified'
                            ? 'Tuliskan catatan verifikasi risiko, penekanan mitigasi agunan/DSR, atau konfirmasi kesesuaian...'
                            : 'Jelaskan poin koreksi risiko yang wajib diperhatikan Analis & Komite (misal: LTV perlu diturunkan, tambah syarat preseden)...'
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-hidden"
                      />
                    </div>

                    {formError && (
                      <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-xs text-rose-300">
                        {formError}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <p className="text-[11px] text-slate-400">
                        * Aksi ini hanya menyimpan tanda verifikasi &amp; catatan Manajemen Risiko tanpa mengubah data lain.
                      </p>
                      <button
                        type="submit"
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all ${
                          verificationStatus === 'verified'
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : 'bg-amber-600 hover:bg-amber-500'
                        }`}
                      >
                        <BadgeCheck className="h-4 w-4" />
                        <span>
                          {selectedApp.riskVerification
                            ? 'Perbarui Tanda Verifikasi & Catatan'
                            : 'Simpan Tanda Verifikasi & Catatan'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
