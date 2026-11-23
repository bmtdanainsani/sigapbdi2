import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SurveyApplication, BranchValidationStatus } from '../types';
import { exportApplicationsToExcel } from '../utils/exportUtils';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  FileCheck,
  UserCheck,
  Send,
  Eye,
  Printer,
  Download,
  Search,
  Filter,
  Users,
  TrendingUp,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  HelpCircle,
  MessageSquare,
  DollarSign,
  Briefcase,
  ChevronRight,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const BranchWorkspace: React.FC = () => {
  const {
    applications,
    users,
    currentUser,
    validateApplicationByBM,
    viewApplicationDetails,
    printApplicationReport,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'accumulation_report' | 'validation_queue'>('validation_queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [validationFilter, setValidationFilter] = useState<'all' | 'pending' | 'valid' | 'revision' | 'rejected'>('all');

  // Selected application for Branch Manager validation modal
  const [validatingApp, setValidatingApp] = useState<SurveyApplication | null>(null);
  const [bmDecision, setBmDecision] = useState<'valid' | 'revision' | 'rejected'>('valid');
  const [bmNotes, setBmNotes] = useState('');
  const [bmRevisiNotes, setBmRevisiNotes] = useState('');
  const [bmPlafon, setBmPlafon] = useState<number>(0);
  const [bmTenor, setBmTenor] = useState<number>(12);

  // If super_admin, allow filtering by branch or defaulting to current user's branch
  const isSuperAdmin = currentUser.role === 'super_admin';
  const [selectedBranch, setSelectedBranch] = useState<string>(currentUser.branch || 'Cabang Pasar Minggu');

  const effectiveBranch = isSuperAdmin ? selectedBranch : currentUser.branch;

  // List of AO / Marketing in this branch
  const branchAOs = useMemo(() => {
    return users.filter(
      (u) => u.role === 'marketing' && u.branch.toLowerCase() === effectiveBranch.toLowerCase()
    );
  }, [users, effectiveBranch]);

  // List of survey applications in this branch
  const branchApplications = useMemo(() => {
    return applications.filter(
      (a) => a.cabang.toLowerCase() === effectiveBranch.toLowerCase()
    );
  }, [applications, effectiveBranch]);

  // Pending validation count
  const pendingCount = useMemo(() => {
    return branchApplications.filter(
      (a) => !a.branchValidation || a.branchValidation.status === 'pending'
    ).length;
  }, [branchApplications]);

  const validCount = useMemo(() => {
    return branchApplications.filter((a) => a.branchValidation?.status === 'valid').length;
  }, [branchApplications]);

  const revisionCount = useMemo(() => {
    return branchApplications.filter((a) => a.branchValidation?.status === 'revision').length;
  }, [branchApplications]);

  // Accumulation Metrics for this branch
  const totalPlafonDiajukan = branchApplications.reduce((sum, a) => sum + (a.financial.plafonDiajukan || 0), 0);
  const totalPlafonDisetujui = branchApplications.reduce((sum, a) => {
    if (a.status === 'approved' || a.status === 'conditional_approval') {
      return sum + (a.adminReview?.approvedPlafon || a.scoring.plafonDisarankan || a.financial.plafonDiajukan);
    }
    return sum;
  }, 0);

  const avgBranchScore = branchApplications.length > 0
    ? Math.round(branchApplications.reduce((sum, a) => sum + a.scoring.totalScore, 0) / branchApplications.length)
    : 0;

  const avgBranchDsr = branchApplications.length > 0
    ? Math.round(branchApplications.reduce((sum, a) => sum + (a.financial.dsrRatio || 0), 0) / branchApplications.length)
    : 0;

  // AO Performance Breakdown in this Branch
  const aoSummary = useMemo(() => {
    return branchAOs.map((ao) => {
      const aoApps = branchApplications.filter(
        (a) => a.marketingId === ao.id || a.marketingName === ao.name
      );
      const totalPlafon = aoApps.reduce((sum, a) => sum + (a.financial.plafonDiajukan || 0), 0);
      const validatedApps = aoApps.filter((a) => a.branchValidation?.status === 'valid').length;
      const approvedApps = aoApps.filter((a) => a.status === 'approved' || a.status === 'conditional_approval').length;
      const avgScore = aoApps.length > 0
        ? Math.round(aoApps.reduce((sum, a) => sum + a.scoring.totalScore, 0) / aoApps.length)
        : 0;

      return {
        ao,
        totalApps: aoApps.length,
        totalPlafon,
        validatedApps,
        approvedApps,
        avgScore,
      };
    });
  }, [branchAOs, branchApplications]);

  // Filtered applications for queue
  const filteredQueue = useMemo(() => {
    return branchApplications.filter((app) => {
      // Query filter
      const q = searchQuery.toLowerCase();
      const match =
        app.namaDebitur.toLowerCase().includes(q) ||
        app.applicationNumber.toLowerCase().includes(q) ||
        app.marketingName.toLowerCase().includes(q) ||
        app.jenisUsaha.toLowerCase().includes(q);
      if (!match) return false;

      // Status filter
      const status: BranchValidationStatus = app.branchValidation?.status || 'pending';
      if (validationFilter === 'pending' && status !== 'pending') return false;
      if (validationFilter === 'valid' && status !== 'valid') return false;
      if (validationFilter === 'revision' && status !== 'revision') return false;
      if (validationFilter === 'rejected' && status !== 'rejected') return false;

      return true;
    });
  }, [branchApplications, searchQuery, validationFilter]);

  // Open validation modal
  const handleOpenValidateModal = (app: SurveyApplication) => {
    setValidatingApp(app);
    setBmDecision(app.branchValidation?.status && app.branchValidation.status !== 'pending' ? app.branchValidation.status : 'valid');
    setBmNotes(app.branchValidation?.notes || `Supervisi Cabang: Usaha ${app.jenisUsaha} milik ${app.namaDebitur} telah diperiksa dan direkomendasikan untuk proses sidang komite.`);
    setBmRevisiNotes(app.branchValidation?.revisiNotes || '');
    setBmPlafon(app.branchValidation?.rekomendasiPlafonBM || app.scoring.plafonDisarankan || app.financial.plafonDiajukan);
    setBmTenor(app.branchValidation?.rekomendasiTenorBM || app.scoring.tenorDisarankan || app.financial.tenorBulanDiajukan);
  };

  const handleSubmitValidation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatingApp) return;

    validateApplicationByBM(validatingApp.id, {
      status: bmDecision,
      notes: bmNotes.trim(),
      revisiNotes: bmDecision === 'revision' ? bmRevisiNotes.trim() : undefined,
      rekomendasiPlafonBM: bmPlafon,
      rekomendasiTenorBM: bmTenor,
    });

    setValidatingApp(null);
  };

  // Unique list of branches for super admin switcher
  const availableBranches = useMemo(() => {
    const list = Array.from(new Set(users.map((u) => u.branch).filter(Boolean)));
    return list.length > 0 ? list : ['Cabang Pasar Minggu', 'Cabang Kebayoran'];
  }, [users]);

  return (
    <div className="space-y-6">
      {/* 1. Branch Manager Scope Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
                  Otoritas Branch Manager (BM)
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {currentUser.name}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
                <span>{effectiveBranch}</span>
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Supervisi terpadu pengajuan survey AO sekantor cabang & otorisasi validasi sebelum diteruskan ke Komite Pembiayaan & Analis Kredit.
              </p>
            </div>
          </div>

          {/* Super Admin branch selector if applicable */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 p-2 rounded-xl text-xs">
              <span className="text-slate-400 shrink-0 font-medium">Pilih Cabang:</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-slate-800 text-white font-semibold rounded px-2.5 py-1 border border-slate-600 focus:outline-hidden"
              >
                {availableBranches.map((br) => (
                  <option key={br} value={br}>
                    {br}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Operational Restriction Reminder */}
        <div className="mt-4 pt-3.5 border-t border-indigo-500/20 flex items-start gap-2.5 text-xs text-indigo-200/90 leading-relaxed">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Standar Operasional Kredit:</strong> Sebelum Branch Manager memberikan <span className="text-emerald-400 font-bold">Validasi (Valid)</span>, berkas survey dari Account Officer <strong className="text-rose-300 underline">TIDAK AKAN MUNCUL</strong> di akun Komite Pembiayaan & Analis Kredit demi mencegah berkas belum terverifikasi masuk ke meja sidang.
          </p>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('validation_queue')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'validation_queue'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Antrean Validasi Survey AO</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('accumulation_report')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'accumulation_report'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Laporan Akumulasi Survey Cabang</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {branchApplications.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => exportApplicationsToExcel(branchApplications, `Laporan_Akumulasi_Survey_${effectiveBranch.replace(/\s+/g, '_')}.xlsx`)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Download className="h-4 w-4 text-emerald-400" />
          <span>Ekspor Laporan Cabang ({branchApplications.length})</span>
        </button>
      </div>

      {/* 3. Sub-Tab Content */}

      {/* SUB-TAB 1: ANTREAN VALIDASI SURVEY AO */}
      {activeSubTab === 'validation_queue' && (
        <div className="space-y-6">
          {/* Quick Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari debitur, nomor survey, nama AO, atau usaha di cabang ini..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
              <select
                value={validationFilter}
                onChange={(e) => setValidationFilter(e.target.value as any)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden font-semibold"
              >
                <option value="all">Semua Status Validasi ({branchApplications.length})</option>
                <option value="pending">Menunggu Validasi BM ({pendingCount})</option>
                <option value="valid">Telah Divalidasi / Teruskan ke Komite ({validCount})</option>
                <option value="revision">Perlu Revisi AO ({revisionCount})</option>
                <option value="rejected">Ditolak di Cabang</option>
              </select>
            </div>
          </div>

          {/* List of Applications for Validation */}
          {filteredQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/30">
              <FileCheck className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Tidak Ada Pengajuan Survey Ditemukan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Tidak ada berkas survey yang cocok dengan kriteria filter saat ini untuk {effectiveBranch}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map((app) => {
                const validationStatus: BranchValidationStatus = app.branchValidation?.status || 'pending';
                const isPending = validationStatus === 'pending';
                const isValid = validationStatus === 'valid';
                const isRevision = validationStatus === 'revision';
                const isRejected = validationStatus === 'rejected';

                return (
                  <div
                    key={app.id}
                    className={`rounded-xl border p-4 sm:p-5 transition-all bg-slate-900/70 hover:bg-slate-900 ${
                      isPending
                        ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                        : isValid
                        ? 'border-emerald-500/30'
                        : isRevision
                        ? 'border-sky-500/30'
                        : 'border-rose-500/30'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Debitur & AO Details */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                            {app.applicationNumber}
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-white">
                            {app.namaDebitur}
                          </span>
                          <span className="text-xs text-slate-400">· {app.jenisUsaha}</span>

                          {/* BM Validation Status Badge */}
                          {app.analystCheck?.status === 'revision_to_bm' && isPending && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/90 px-2.5 py-0.5 rounded-full border border-rose-500/40 animate-pulse">
                              <RotateCcw className="h-3 w-3" />
                              <span>Revisi Diminta Analis ke BM</span>
                            </span>
                          )}
                          {isPending && app.analystCheck?.status !== 'revision_to_bm' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                              <Clock className="h-3 w-3" />
                              <span>Menunggu Validasi BM</span>
                            </span>
                          )}
                          {isValid && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>
                                {app.analystCheck?.status === 'verified_scheduled'
                                  ? 'Valid · Dijadwalkan Komite Analis'
                                  : 'Valid (Menunggu Cek & Jadwal Analis)'}
                              </span>
                            </span>
                          )}
                          {isRevision && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-500/30">
                              <RotateCcw className="h-3 w-3" />
                              <span>Revisi Diminta ke AO</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                              <XCircle className="h-3 w-3" />
                              <span>Ditolak di Cabang</span>
                            </span>
                          )}
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <p>
                            AO Surveyor: <strong className="text-slate-200">{app.marketingName}</strong>
                          </p>
                          <p>
                            Tanggal: <span className="font-mono text-slate-300">{new Date(app.createdAt).toLocaleDateString('id-ID')}</span>
                          </p>
                          <p>
                            Domisili: <span className="text-slate-300 truncate">{app.alamatDomisili}</span>
                          </p>
                        </div>

                        {/* Metrics Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Plafon Pengajuan</span>
                            <span className="font-mono font-bold text-white text-xs">
                              Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">{app.financial.tenorBulanDiajukan} Bulan</span>
                          </div>

                          <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Skor 5C Sistem</span>
                            <span className="font-mono font-bold text-emerald-400 text-xs">
                              {app.scoring.totalScore} / 100
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">{app.scoring.ratingGrade.split(' ')[0]}</span>
                          </div>

                          <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Rasio DSR Usaha</span>
                            <span className={`font-mono font-bold text-xs ${app.financial.dsrRatio <= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {app.financial.dsrRatio}%
                            </span>
                            <span className="text-[10px] text-slate-400 block">Kas: Rp {Math.round(app.financial.availableCashflow / 1000)}k</span>
                          </div>

                          <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Agunan & Taksasi</span>
                            <span className="font-bold text-white text-xs truncate block">
                              {app.collateral.jenisJaminan}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400">
                              Rp {Math.round(app.collateral.nilaiPasarTaksasi / 1000000)} Jt (LTV {app.collateral.persentaseLtv}%)
                            </span>
                          </div>
                        </div>

                        {/* Management Note & Attention Banner */}
                        {app.managementNote && (
                          <div className={`rounded-lg p-2.5 text-xs mt-2 border ${
                            app.managementNote.isAttention
                              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                              : 'bg-slate-900/80 border-slate-700 text-slate-300'
                          }`}>
                            <div className="flex items-center justify-between font-bold text-white text-[11px] mb-0.5">
                              <span className="flex items-center gap-1.5 text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Atensi Dewan Manajemen ({app.managementNote.notedBy}):</span>
                              </span>
                              {app.managementNote.isAttention && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                                  Prioritas Khusus
                                </span>
                              )}
                            </div>
                            <p className="text-slate-200 text-[11px] italic">
                              "{app.managementNote.notes}"
                            </p>
                          </div>
                        )}

                        {/* Analyst Revision Request to BM Banner */}
                        {app.analystCheck?.status === 'revision_to_bm' && (
                          <div className="rounded-lg p-3 text-xs mt-2 border border-rose-500/40 bg-rose-950/40 text-rose-200">
                            <div className="flex items-center justify-between font-bold text-white text-[11px] mb-1">
                              <span className="flex items-center gap-1.5 text-rose-300">
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Permintaan Revisi dari Analis Kredit ({app.analystCheck.checkedBy}):</span>
                              </span>
                              <span className="font-mono text-[10px] text-rose-300/80">
                                {new Date(app.analystCheck.checkedAt).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <p className="text-rose-100 text-[11px] italic leading-relaxed bg-slate-950/50 p-2 rounded border border-rose-500/20">
                              &ldquo;{app.analystCheck.notes}&rdquo;
                            </p>
                            <p className="text-[10px] text-rose-300/90 mt-1">
                              Harap periksa catatan kekurangan di atas, lengkapi/perbaiki catatan cabang (atau minta revisi ke AO jika perlu data lapangan tambahan), lalu validasi ulang ke Analis.
                            </p>
                          </div>
                        )}

                        {/* Existing Branch Manager Notes if already reviewed */}
                        {app.branchValidation?.notes && (
                          <div className="rounded-lg bg-indigo-950/30 border border-indigo-500/20 p-2.5 text-xs text-indigo-200 mt-2">
                            <div className="flex items-center justify-between font-semibold text-white text-[11px] mb-0.5">
                              <span className="flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                                <span>Catatan Supervisi BM ({app.branchValidation.validatedBy}):</span>
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {new Date(app.branchValidation.validatedAt).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              "{app.branchValidation.notes}"
                            </p>
                            {app.branchValidation.revisiNotes && app.branchValidation.status === 'revision' && (
                              <p className="text-amber-300 text-[11px] mt-1">
                                <strong>Instruksi Revisi AO:</strong> {app.branchValidation.revisiNotes}
                              </p>
                            )}
                            {app.branchValidation.rekomendasiPlafonBM && app.branchValidation.rekomendasiPlafonBM > 0 && (
                              <p className="text-emerald-300 text-[10px] font-mono mt-0.5">
                                Rekomendasi Plafon BM: Rp {app.branchValidation.rekomendasiPlafonBM.toLocaleString('id-ID')} · Tenor: {app.branchValidation.rekomendasiTenorBM || 12} Bln
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                        <button
                          onClick={() => handleOpenValidateModal(app)}
                          className={`w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                            isPending
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500 ring-2 ring-emerald-500/30'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500'
                          }`}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>{isPending ? 'Beri Catatan & Validasi' : 'Ubah Validasi BM'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => viewApplicationDetails(app)}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Buka Berkas Survey Lengkap"
                          >
                            <Eye className="h-3.5 w-3.5 text-sky-400" />
                            <span>Detail</span>
                          </button>

                          <button
                            onClick={() => printApplicationReport(app)}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Cetak Berkas Survey"
                          >
                            <Printer className="h-3.5 w-3.5 text-slate-400" />
                            <span className="hidden sm:inline">Cetak</span>
                          </button>
                        </div>

                        {/* Visibility notice */}
                        <div className="text-[10px] text-right font-medium">
                          {isValid ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Terbuka di Sidang Komite</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              <span>Tertutup dari Komite & Analis</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: LAPORAN AKUMULASI SURVEY CABANG */}
      {activeSubTab === 'accumulation_report' && (
        <div className="space-y-6">
          {/* Key Metric Cards Grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Total Surveys */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400 font-medium">Total Survey Cabang</span>
              <p className="mt-1 text-2xl font-black text-white font-mono">
                {branchApplications.length}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400">
                <Users className="h-3.5 w-3.5" />
                <span>{branchAOs.length} Account Officer Aktif</span>
              </div>
            </div>

            {/* Total Plafon Diajukan */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400 font-medium">Akumulasi Plafon Masuk</span>
              <p className="mt-1 text-lg sm:text-xl font-bold text-white font-mono truncate">
                Rp {totalPlafonDiajukan.toLocaleString('id-ID')}
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                Rata-rata: Rp {branchApplications.length > 0 ? Math.round(totalPlafonDiajukan / branchApplications.length).toLocaleString('id-ID') : 0} / berkas
              </p>
            </div>

            {/* Status Validasi BM */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400 font-medium">Otorisasi Validasi BM</span>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {validCount}
                </p>
                <span className="text-xs text-slate-400 font-mono">
                  / {branchApplications.length} ({branchApplications.length > 0 ? Math.round((validCount / branchApplications.length) * 100) : 0}%)
                </span>
              </div>
              <p className="mt-2 text-[11px] text-amber-400 font-medium">
                {pendingCount} Berkas Menunggu Validasi Anda
              </p>
            </div>

            {/* Quality Rating */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400 font-medium">Rata-rata Skor Risiko 5C</span>
              <p className="mt-1 text-2xl font-black text-indigo-400 font-mono">
                {avgBranchScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                Rata-rata DSR Angsuran: <strong className="text-white font-mono">{avgBranchDsr}%</strong>
              </p>
            </div>
          </div>

          {/* Table: AO Performance Accumulation in this Branch */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-400" />
                  <span>Akumulasi Kinerja Survey Per Account Officer (AO) di {effectiveBranch}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Daftar seluruh Account Officer yang terdaftar pada kantor cabang ini beserta statistik surveynya.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/20">
                {branchAOs.length} AO Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/20 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Account Officer (AO)</th>
                    <th className="py-3 px-4">Kontak / Email</th>
                    <th className="py-3 px-4 text-center">Jumlah Survey</th>
                    <th className="py-3 px-4">Total Plafon Diajukan</th>
                    <th className="py-3 px-4 text-center">Lolos Validasi BM</th>
                    <th className="py-3 px-4 text-center">Diputus Komite</th>
                    <th className="py-3 px-4 text-center">Rata-rata Skor 5C</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {aoSummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Belum ada Account Officer yang terdaftar pada kantor cabang ini.
                      </td>
                    </tr>
                  ) : (
                    aoSummary.map(({ ao, totalApps, totalPlafon, validatedApps, approvedApps, avgScore }) => (
                      <tr key={ao.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950 text-indigo-400 font-bold border border-indigo-500/30">
                              {ao.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white">{ao.name}</p>
                              <p className="text-[10px] text-slate-400">{ao.roleTitle}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-300">
                          <p>{ao.email}</p>
                          <p className="text-slate-500 text-[10px]">{ao.phone}</p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <span className="font-mono font-bold text-white text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {totalApps} Berkas
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-emerald-400">
                          Rp {totalPlafon.toLocaleString('id-ID')}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <span className="font-mono font-semibold text-xs text-indigo-300">
                            {validatedApps} / {totalApps}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <span className="font-mono font-semibold text-xs text-emerald-400">
                            {approvedApps} Berkas
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <span className="font-mono font-bold text-xs text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {avgScore} / 100
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Master List of all Surveys in this Branch */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Daftar Seluruh Pengajuan Survey Cabang ({branchApplications.length} Pengajuan)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/20 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">No. Pengajuan</th>
                    <th className="py-3 px-4">Debitur & Usaha</th>
                    <th className="py-3 px-4">AO Surveyor</th>
                    <th className="py-3 px-4">Plafon & Tenor</th>
                    <th className="py-3 px-4">Skor 5C</th>
                    <th className="py-3 px-4">Validasi BM</th>
                    <th className="py-3 px-4">Status Komite</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {branchApplications.map((app) => {
                    const status = app.branchValidation?.status || 'pending';
                    return (
                      <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] font-bold text-emerald-400">
                          {app.applicationNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-bold text-white">{app.namaDebitur}</p>
                          <p className="text-[10px] text-slate-400">{app.jenisUsaha}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                          {app.marketingName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono">
                          <p className="font-bold text-white">Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}</p>
                          <p className="text-[10px] text-slate-400">{app.financial.tenorBulanDiajukan} Bulan</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-emerald-400">
                            {app.scoring.totalScore}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{app.scoring.ratingGrade.split(' ')[0]}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {status === 'pending' ? (
                            <span className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Pending BM</span>
                            </span>
                          ) : status === 'valid' ? (
                            <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Valid</span>
                            </span>
                          ) : status === 'revision' ? (
                            <span className="text-sky-400 font-semibold text-[11px] flex items-center gap-1">
                              <RotateCcw className="h-3 w-3" />
                              <span>Revisi</span>
                            </span>
                          ) : (
                            <span className="text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              <span>Ditolak</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {app.status === 'approved' ? (
                            <span className="text-emerald-400 font-bold text-[11px]">Disetujui Penuh</span>
                          ) : app.status === 'conditional_approval' ? (
                            <span className="text-sky-400 font-bold text-[11px]">Disetujui Bersyarat</span>
                          ) : app.status === 'rejected' ? (
                            <span className="text-rose-400 font-bold text-[11px]">Ditolak Komite</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Menunggu Sidang</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleOpenValidateModal(app)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-colors"
                          >
                            Validasi
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Interactive Validation Modal Dialog */}
      {validatingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setValidatingApp(null)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-2xl rounded-2xl border border-indigo-500/40 bg-slate-900 shadow-2xl p-6 overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Form Validasi & Catatan Branch Manager
                  </h3>
                  <p className="text-xs text-slate-400">
                    Otorisasi Kepala Cabang sebelum diteruskan ke Komite Pembiayaan & Analis Kredit.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setValidatingApp(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Target Survey Snapshot */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 mb-4 space-y-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                    {validatingApp.applicationNumber}
                  </span>
                  <span className="text-sm font-extrabold text-white ml-2">
                    {validatingApp.namaDebitur}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Plafon: </span>
                  <strong className="text-white font-mono">
                    Rp {validatingApp.financial.plafonDiajukan.toLocaleString('id-ID')}
                  </strong>
                  <span className="text-slate-400"> ({validatingApp.financial.tenorBulanDiajukan} Bln)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-500 block">AO Surveyor</span>
                  <span className="text-slate-200 font-semibold">{validatingApp.marketingName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jenis Usaha</span>
                  <span className="text-slate-200 truncate block">{validatingApp.jenisUsaha}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Skor 5C Sistem</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {validatingApp.scoring.totalScore} / 100 ({validatingApp.scoring.ratingGrade.split(' ')[0]})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Agunan & Taksasi</span>
                  <span className="text-white font-mono font-semibold">
                    Rp {Math.round(validatingApp.collateral.nilaiPasarTaksasi / 1000000)} Jt ({validatingApp.collateral.jenisJaminan})
                  </span>
                </div>
              </div>
            </div>

            {/* Permintaan Revisi dari Analis Kredit jika ada */}
            {validatingApp.analystCheck?.status === 'revision_to_bm' && (
              <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-200 text-xs mb-4">
                <div className="flex items-center justify-between font-bold text-white mb-1.5">
                  <span className="flex items-center gap-2 text-rose-300">
                    <RotateCcw className="h-4 w-4" />
                    <span>Permintaan Revisi dari Analis Kredit kepada Pimpinan Cabang:</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/30">
                    Wajib Ditindaklanjuti
                  </span>
                </div>
                <p className="text-rose-100 italic text-[11px] leading-relaxed bg-slate-900/70 p-2.5 rounded-lg border border-rose-500/20">
                  &ldquo;{validatingApp.analystCheck.notes}&rdquo;
                </p>
                <p className="mt-1.5 text-[10px] text-rose-300/90">
                  Diminta oleh: <strong>{validatingApp.analystCheck.checkedBy}</strong> pada {new Date(validatingApp.analystCheck.checkedAt).toLocaleString('id-ID')}
                </p>
              </div>
            )}

            {/* Catatan & Atensi Dewan Manajemen jika ada */}
            {validatingApp.managementNote && (
              <div className={`p-4 rounded-xl border text-xs mb-4 ${
                validatingApp.managementNote.isAttention
                  ? 'border-amber-500/50 bg-amber-950/40 text-amber-200'
                  : 'border-slate-700 bg-slate-950/60 text-slate-300'
              }`}>
                <div className="flex items-center justify-between font-bold text-white mb-1.5">
                  <span className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Instruksi / Catatan Pengawasan Dewan Manajemen:</span>
                  </span>
                  {validatingApp.managementNote.isAttention && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                      Tanda Perhatian Khusus
                    </span>
                  )}
                </div>
                <p className="text-slate-100 italic text-[11px] leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  "{validatingApp.managementNote.notes}"
                </p>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Diberikan oleh: <strong className="text-amber-300">{validatingApp.managementNote.notedBy}</strong> (Dewan Manajemen) pada {new Date(validatingApp.managementNote.notedAt).toLocaleString('id-ID')}
                </p>
              </div>
            )}

            {/* Validation Form */}
            <form onSubmit={handleSubmitValidation} className="space-y-4 text-xs">
              {/* Decision Radio/Buttons */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  Putusan Validasi Kepala Cabang (Branch Manager) <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBmDecision('valid')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left font-bold transition-all ${
                      bmDecision === 'valid'
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 ring-2 ring-emerald-500/30'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs">Valid & Teruskan</p>
                      <p className="text-[10px] text-slate-400 font-normal">Kirim ke Komite & Analis</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBmDecision('revision')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left font-bold transition-all ${
                      bmDecision === 'revision'
                        ? 'border-sky-500 bg-sky-950/60 text-sky-300 ring-2 ring-sky-500/30'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <RotateCcw className="h-4 w-4 text-sky-400 shrink-0" />
                    <div>
                      <p className="text-xs">Minta Revisi AO</p>
                      <p className="text-[10px] text-slate-400 font-normal">Kembalikan ke Surveyor</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBmDecision('rejected')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left font-bold transition-all ${
                      bmDecision === 'rejected'
                        ? 'border-rose-500 bg-rose-950/60 text-rose-300 ring-2 ring-rose-500/30'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    <div>
                      <p className="text-xs">Tolak di Cabang</p>
                      <p className="text-[10px] text-slate-400 font-normal">Tidak layak diproses</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Notes for Branch Manager */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Catatan Supervisi Branch Manager <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={bmNotes}
                  onChange={(e) => setBmNotes(e.target.value)}
                  placeholder="Tuliskan catatan evaluasi karakter debitur, pengenalan lapangan, atau arahan khusus untuk Komite Pembiayaan..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3 text-white focus:border-indigo-500 focus:outline-hidden leading-relaxed text-xs"
                />
              </div>

              {/* Revision notes if selected */}
              {bmDecision === 'revision' && (
                <div className="rounded-xl border border-sky-500/40 bg-sky-950/30 p-3.5 space-y-2">
                  <label className="block text-sky-300 font-bold text-xs flex items-center gap-1.5">
                    <RotateCcw className="h-4 w-4" />
                    <span>Instruksi Revisi Khusus untuk AO {validatingApp.marketingName}:</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={bmRevisiNotes}
                    onChange={(e) => setBmRevisiNotes(e.target.value)}
                    placeholder="Contoh: Bukti nota penjualan belum lengkap, harap foto ulang stok barang dan verifikasi ulang riwayat angsuran..."
                    className="w-full rounded-lg border border-sky-600/50 bg-slate-900 p-2.5 text-white text-xs focus:outline-hidden"
                  />
                </div>
              )}

              {/* Recommendation for Plafon and Tenor */}
              {bmDecision === 'valid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Rekomendasi Plafon BM (Rp)
                    </label>
                    <input
                      type="number"
                      step={500000}
                      value={bmPlafon}
                      onChange={(e) => setBmPlafon(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Rekomendasi Tenor BM (Bulan)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={bmTenor}
                      onChange={(e) => setBmTenor(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Notice regarding visibility */}
              {bmDecision === 'valid' ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    Setelah Anda menyimpan validasi ini, berkas akan <strong>segera muncul</strong> di antrean user Komite Pembiayaan & Analis Kredit untuk diagendakan sidang.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300 text-[11px]">
                  <Lock className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    Berkas ini <strong>tetap tidak akan muncul</strong> di user Komite & Analis sampai seluruh perbaikan selesai divalidasi.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setValidatingApp(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold text-white transition-colors shadow-sm ${
                    bmDecision === 'valid'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : bmDecision === 'revision'
                      ? 'bg-sky-600 hover:bg-sky-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Simpan Putusan Validasi BM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
