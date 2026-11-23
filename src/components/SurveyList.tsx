import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SurveyApplication } from '../types';
import { exportApplicationsToExcel } from '../utils/exportUtils';
import {
  Search,
  Filter,
  Download,
  Eye,
  Printer,
  Trash2,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Gavel,
  UserCheck,
  Lock,
  Flag,
  MessageSquare,
  Building2,
  X,
  Send,
  CheckSquare,
  CheckCheck,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export const SurveyList: React.FC = () => {
  const {
    applications,
    currentUser,
    viewApplicationDetails,
    printApplicationReport,
    deleteApplication,
    deleteAllApplications,
    setActiveTab,
    setSelectedApplication,
    addManagementNote,
    batchValidateByBM,
    batchAddManagementNote,
    batchReviewApplications,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Multi-select state
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  // Branch Manager Batch Modal
  const [isBatchBMModalOpen, setIsBatchBMModalOpen] = useState(false);
  const [batchBMStatus, setBatchBMStatus] = useState<'valid' | 'revision' | 'rejected'>('valid');
  const [batchBMNotes, setBatchBMNotes] = useState('Diverifikasi dan disetujui untuk diproses ke Sidang Komite Pembiayaan.');
  const [batchBMRevisiNotes, setBatchBMRevisiNotes] = useState('');

  // Management Batch Note & Attention Modal
  const [isBatchManagementModalOpen, setIsBatchManagementModalOpen] = useState(false);
  const [batchManagementNoteText, setBatchManagementNoteText] = useState('');
  const [batchIsAttention, setBatchIsAttention] = useState(true);

  // Committee / Super Admin Batch Review Modal
  const [isBatchCommitteeModalOpen, setIsBatchCommitteeModalOpen] = useState(false);
  const [batchCommitteeDecision, setBatchCommitteeDecision] = useState<'approved' | 'conditional_approval' | 'rejected'>('approved');
  const [batchCommitteeNotes, setBatchCommitteeNotes] = useState('Disetujui dalam keputusan rapat komite pembiayaan.');

  // Single Management Note & Attention Modal
  const [activeManagementModalApp, setActiveManagementModalApp] = useState<SurveyApplication | null>(null);
  const [managementNoteText, setManagementNoteText] = useState('');
  const [isAttentionChecked, setIsAttentionChecked] = useState(true);

  const isAccountOfficer = currentUser.role === 'marketing';
  const isBranchManager = currentUser.role === 'branch_manager';
  const isCreditAnalystOrCommittee = currentUser.role === 'admin';
  const isManagement = currentUser.role === 'management';
  const isRiskManagement = currentUser.role === 'risk_management';

  // Extract unique branches from applications
  const availableBranches = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => {
      if (a.cabang) set.add(a.cabang);
    });
    return Array.from(set);
  }, [applications]);

  // Role-based scoping:
  // - Account Officer sees applications they created (or in their same branch)
  // - Branch Manager sees all applications in their same branch (kantor yang sama)
  // - Komite & Analis Kredit (admin) & Manajemen Risiko (risk_management) ONLY sees applications validated by Branch Manager
  // - Dewan Manajemen & Super Admin sees all branches (baik yang sudah atau belum tervalidasi)
  const scopedApps = useMemo(() => {
    if (isAccountOfficer) {
      return applications.filter((app) => {
        const matchId = app.marketingId === currentUser.id;
        const matchName = Boolean(app.marketingName && currentUser.name && app.marketingName.toLowerCase().trim() === currentUser.name.toLowerCase().trim());
        const matchBranch = Boolean(app.cabang && currentUser.branch && app.cabang.toLowerCase().trim() === currentUser.branch.toLowerCase().trim());
        return matchId || matchName || matchBranch;
      });
    }
    if (isBranchManager) {
      return applications.filter(
        (app) => (app.cabang || '').toLowerCase().trim() === (currentUser.branch || '').toLowerCase().trim()
      );
    }
    if (isCreditAnalystOrCommittee || isRiskManagement) {
      return applications.filter((app) => app.branchValidation?.status === 'valid');
    }
    return applications;
  }, [applications, currentUser, isAccountOfficer, isBranchManager, isCreditAnalystOrCommittee, isRiskManagement, isManagement]);

  // Filtered applications based on scopedApps + branchFilter
  const filteredApps = scopedApps.filter((app) => {
    // Branch Filter (Khusus Manajemen & Super Admin)
    if (branchFilter !== 'all' && (app.cabang || '').toLowerCase().trim() !== branchFilter.toLowerCase().trim()) {
      return false;
    }

    // Search query
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchQuery =
        (app.namaDebitur || '').toLowerCase().includes(query) ||
        (app.nik || '').includes(query) ||
        (app.applicationNumber || '').toLowerCase().includes(query) ||
        (app.marketingName || '').toLowerCase().includes(query) ||
        (app.cabang || '').toLowerCase().includes(query) ||
        (app.jenisUsaha || '').toLowerCase().includes(query);

      if (!matchQuery) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && !(app.status === 'submitted' || app.status === 'under_review')) return false;
      if (statusFilter === 'approved' && app.status !== 'approved') return false;
      if (statusFilter === 'conditional' && app.status !== 'conditional_approval') return false;
      if (statusFilter === 'rejected' && app.status !== 'rejected') return false;
    }

    // Grade filter
    if (gradeFilter !== 'all') {
      const rating = app.scoring?.ratingGrade || '';
      if (!rating.startsWith(gradeFilter)) return false;
    }

    return true;
  });

  const handleSaveManagementNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeManagementModalApp) return;
    addManagementNote(activeManagementModalApp.id, managementNoteText, isAttentionChecked);
    setActiveManagementModalApp(null);
  };

  // Selection calculations
  const filteredAppIds = useMemo(() => filteredApps.map((a) => a.id), [filteredApps]);

  const allFilteredSelected = useMemo(() => {
    return filteredAppIds.length > 0 && filteredAppIds.every((id) => selectedAppIds.includes(id));
  }, [filteredAppIds, selectedAppIds]);

  const isSomeFilteredSelected = useMemo(() => {
    return filteredAppIds.some((id) => selectedAppIds.includes(id)) && !allFilteredSelected;
  }, [filteredAppIds, selectedAppIds, allFilteredSelected]);

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedAppIds((prev) => prev.filter((id) => !filteredAppIds.includes(id)));
    } else {
      setSelectedAppIds((prev) => Array.from(new Set([...prev, ...filteredAppIds])));
    }
  };

  const toggleSelectApp = (id: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedAppIds([]);
  };

  const selectedAppsList = useMemo(() => {
    return applications.filter((a) => selectedAppIds.includes(a.id));
  }, [applications, selectedAppIds]);

  const handleBatchBMSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAppIds.length === 0) return;
    batchValidateByBM(selectedAppIds, {
      status: batchBMStatus,
      notes: batchBMNotes,
      revisiNotes: batchBMRevisiNotes,
    });
    setIsBatchBMModalOpen(false);
    clearSelection();
  };

  const handleBatchManagementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAppIds.length === 0) return;
    batchAddManagementNote(selectedAppIds, batchManagementNoteText, batchIsAttention);
    setIsBatchManagementModalOpen(false);
    clearSelection();
  };

  const handleBatchCommitteeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAppIds.length === 0) return;
    batchReviewApplications(selectedAppIds, batchCommitteeDecision, batchCommitteeNotes);
    setIsBatchCommitteeModalOpen(false);
    clearSelection();
  };

  return (
    <div className="space-y-6">
      {/* Account Officer Privacy Mode Notice */}
      {isAccountOfficer && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">
              Hak Akses Account Officer: Berkas Milik {currentUser.name} ({currentUser.branch})
            </p>
            <p className="text-[11px] text-emerald-400/90 mt-0.5 leading-relaxed">
              Anda hanya memiliki otorisasi untuk melihat, memantau, dan mencetak berkas survey pengajuan yang Anda input sendiri. Berkas milik Account Officer lain diproteksi.
            </p>
          </div>
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded border border-emerald-500/20 text-[11px] shrink-0">
            {scopedApps.length} Berkas Anda
          </span>
        </div>
      )}

      {/* Branch Manager Mode Notice */}
      {isBranchManager && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-4 text-xs text-indigo-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">
              Hak Akses Branch Manager: Seluruh Berkas AO di {currentUser.branch}
            </p>
            <p className="text-[11px] text-indigo-300/90 mt-0.5 leading-relaxed">
              Menampilkan seluruh berkas survey yang diajukan oleh Account Officer yang bertugas di kantor cabang Anda. Berkas yang belum Anda validasi tidak akan diteruskan ke meja Komite & Analis.
            </p>
          </div>
          <span className="font-mono text-indigo-400 font-bold bg-indigo-950 px-2.5 py-1 rounded border border-indigo-500/30 text-[11px] shrink-0">
            {scopedApps.length} Berkas Cabang
          </span>
        </div>
      )}

      {/* Komite & Analis Notice */}
      {isCreditAnalystOrCommittee && (
        <div className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-950/40 p-4 text-xs text-sky-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">
              Hak Akses Komite Pembiayaan & Analis Kredit
            </p>
            <p className="text-[11px] text-sky-300/90 mt-0.5 leading-relaxed">
              Sesuai SOP, daftar ini hanya menampilkan berkas survey lapangan yang telah memperoleh <strong className="text-white">Validasi Sah dari Branch Manager</strong> masing-masing kantor cabang.
            </p>
          </div>
          <span className="font-mono text-sky-400 font-bold bg-sky-950 px-2.5 py-1 rounded border border-sky-500/30 text-[11px] shrink-0">
            {scopedApps.length} Lolos Validasi BM
          </span>
        </div>
      )}

      {/* Dewan Manajemen Executive Notice */}
      {isManagement && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 text-xs text-amber-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-white">
                Hak Akses Dewan Manajemen: Portofolio Seluruh Kantor Cabang
              </p>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                Read-Only
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
              Menampilkan seluruh berkas pengajuan survey dari semua cabang (baik yang sudah tervalidasi maupun yang masih menunggu validasi Branch Manager). Mode pengawasan eksekutif: Anda dapat meninjau detail, mengekspor Excel, dan mencetak laporan tanpa dapat mengedit data atau mengisi formulir survey.
            </p>
          </div>
          <span className="font-mono text-amber-400 font-bold bg-amber-950 px-2.5 py-1 rounded border border-amber-500/30 text-[11px] shrink-0">
            {scopedApps.length} Total Berkas
          </span>
        </div>
      )}

      {/* Manajemen Risiko Notice */}
      {isRiskManagement && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-4 text-xs text-cyan-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-white">
                Hak Akses Divisi Manajemen Risiko (Read-Only Data · Koreksi &amp; Tanda Verifikasi)
              </p>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                Verifikasi Pasca-Analis
              </span>
            </div>
            <p className="text-[11px] text-cyan-200/90 mt-0.5 leading-relaxed">
              Anda dapat melihat berkas yang lolos validasi Branch Manager, memeriksa hasil koreksi &amp; jadwal komite Analis, dan menyematkan Tanda Verifikasi Manajemen Risiko tanpa hak mengubah data survey, plafon, tenor, atau pencairan.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('risk_workspace')}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 transition-colors shrink-0 self-start sm:self-center"
          >
            <span>Menu Verifikasi Risiko</span>
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isAccountOfficer
              ? `Daftar Pengajuan Survey Anda`
              : isManagement
              ? 'Daftar Pengajuan Survey - Seluruh Kantor Cabang'
              : isRiskManagement
              ? 'Daftar Pengajuan - Pemeriksaan & Verifikasi Risiko'
              : 'Daftar Pengajuan & Hasil Credit Scoring'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {isAccountOfficer
              ? `Total ${scopedApps.length} berkas survey yang Anda daftarkan di ${currentUser.branch}.`
              : isManagement
              ? `Total ${scopedApps.length} berkas survey terdata dari seluruh jaringan kantor cabang BMT Dana Insani.`
              : isRiskManagement
              ? `Total ${scopedApps.length} berkas lolos validasi cabang yang tersedia untuk dipantau dan diverifikasi pasca-komite Analis.`
              : 'Arsip lengkap berkas survey lapangan, verifikasi komite pembiayaan, dan status keputusan kredit.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'super_admin' && applications.length > 0 && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA berkas survey uji coba? Database pengajuan akan dikosongkan untuk persiapan data riil.'
                  )
                ) {
                  deleteAllApplications();
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white px-3 py-2 text-xs font-semibold transition-colors shadow-xs"
              title="Hapus seluruh data survey uji coba"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>Hapus Semua Data Uji Coba ({applications.length})</span>
            </button>
          )}

          <button
            onClick={() => exportApplicationsToExcel(filteredApps, isAccountOfficer ? `Daftar_Survey_${currentUser.name.replace(/\s+/g, '_')}.xlsx` : 'Daftar_Credit_Scoring_Survey.xlsx')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Ekspor Excel ({filteredApps.length})</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama debitur, NIK, nomor pengajuan, atau surveyor..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Cabang (Khusus Dewan Manajemen, Manajemen Risiko & Super Admin) */}
          {(isManagement || isRiskManagement || currentUser.role === 'super_admin') && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-amber-400 shrink-0 hidden sm:block" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="rounded-lg border border-amber-500/40 bg-slate-800 px-3 py-2 text-xs text-amber-300 font-semibold focus:border-amber-400 focus:outline-hidden"
              >
                <option value="all">Semua Cabang ({applications.length})</option>
                {availableBranches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Review</option>
            <option value="approved">Disetujui Penuh</option>
            <option value="conditional">Disetujui Bersyarat</option>
            <option value="rejected">Ditolak</option>
          </select>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">Semua Grade</option>
            <option value="A">Grade A (Sangat Layak)</option>
            <option value="B">Grade B (Layak Bersyarat)</option>
            <option value="C">Grade C (Perlu Komite)</option>
            <option value="D">Grade D (Tidak Layak)</option>
          </select>
        </div>
      </div>

      {/* High Density Applications Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeFilteredSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    title={allFilteredSelected ? 'Batalkan pilihan semua' : 'Pilih semua berkas pada filter ini'}
                  />
                </th>
                <th className="py-3 px-4">No. Pengajuan</th>
                <th className="py-3 px-4">Debitur & Usaha</th>
                <th className="py-3 px-4 text-right">Plafon & Tenor</th>
                <th className="py-3 px-4 text-right">DSR</th>
                <th className="py-3 px-4 text-center">Skor 5C</th>
                <th className="py-3 px-4">Grade & Rekomendasi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Surveyor</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
                        <FileCheck className="h-6 w-6 text-emerald-400" />
                      </div>
                      <p className="font-semibold text-white text-sm">Belum Ada Pengajuan Survey</p>
                      <p className="text-slate-400 text-[11px] max-w-sm">
                        Sistem aktif dan siap mencatat berkas debitur. Klik tombol Survey Baru untuk membuat pengajuan baru.
                      </p>
                      {(currentUser.role === 'marketing' || currentUser.role === 'super_admin') && (
                        <button
                          onClick={() => setActiveTab('survey_form')}
                          className="mt-2 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                        >
                          Mulai Survey Baru
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const isRedFlag = app.fraudEvaluation?.hasRedFlags ?? false;
                  const grade = app.scoring?.ratingGrade ?? 'B (Layak Bersyarat)';
                  const isSelected = selectedAppIds.includes(app.id);

                  return (
                    <tr
                      key={app.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-emerald-950/30 hover:bg-emerald-950/40 border-l-2 border-l-emerald-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Multi-select Checkbox */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectApp(app.id)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* App Number & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-white">
                          {app.applicationNumber}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(app.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </td>

                      {/* Debitur & Usaha */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">
                            {app.namaDebitur}
                          </span>
                          {app.managementNote?.isAttention && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse cursor-pointer shrink-0"
                              title={`⚠️ Atensi Dewan Manajemen: "${app.managementNote.notes}" - oleh ${app.managementNote.notedBy}`}
                              onClick={() => {
                                if (isManagement || currentUser.role === 'super_admin') {
                                  setActiveManagementModalApp(app);
                                  setManagementNoteText(app.managementNote?.notes || '');
                                  setIsAttentionChecked(app.managementNote?.isAttention ?? true);
                                } else {
                                  viewApplicationDetails(app);
                                }
                              }}
                            >
                              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                              <span>Atensi Manajemen</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {app.jenisUsaha} ({app.lamaUsahaBulan} bln)
                        </p>
                        {app.managementNote && !app.managementNote.isAttention && (
                          <p className="text-[10px] text-amber-400/90 italic mt-0.5 line-clamp-1 flex items-center gap-1">
                            <MessageSquare className="h-2.5 w-2.5 shrink-0" />
                            <span>Catatan Manajemen: "{app.managementNote.notes}"</span>
                          </p>
                        )}
                      </td>

                      {/* Plafon & Tenor */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-200 tabular-nums">
                          Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {app.financial.tenorBulanDiajukan} Bulan
                        </p>
                      </td>

                      {/* DSR Ratio */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-semibold tabular-nums ${
                            app.financial.dsrRatio <= 35
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {app.financial.dsrRatio}%
                        </span>
                      </td>

                      {/* 5C Total Score */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center font-mono font-extrabold text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-white tabular-nums">
                          {app.scoring.totalScore}
                        </span>
                      </td>

                      {/* Grade & Red Flag indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              grade.startsWith('A')
                                ? 'text-emerald-400'
                                : grade.startsWith('B')
                                ? 'text-sky-400'
                                : grade.startsWith('C')
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {grade.split(' ')[0]}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {app.scoring.recommendation === 'SETUJUI_PENUH'
                              ? 'Layak'
                              : app.scoring.recommendation === 'SETUJUI_DENGAN_SYARAT'
                              ? 'Bersyarat'
                              : app.scoring.recommendation === 'TINJAUAN_KOMITE'
                              ? 'Komite'
                              : 'Tolak'}
                          </span>
                          {isRedFlag && (
                            <span title="Ada Red Flag">
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {app.status === 'approved' ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Disetujui
                            </span>
                          ) : app.status === 'conditional_approval' ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-sky-400">
                              <FileCheck className="h-3.5 w-3.5" />
                              Bersyarat
                            </span>
                          ) : app.status === 'rejected' ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                              <XCircle className="h-3.5 w-3.5" />
                              Ditolak
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                              <Clock className="h-3.5 w-3.5" />
                              Review
                            </span>
                          )}
                          {app.riskVerification ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border w-fit ${
                                app.riskVerification.status === 'verified'
                                  ? 'text-cyan-300 bg-cyan-950/70 border-cyan-500/30'
                                  : 'text-amber-300 bg-amber-950/70 border-amber-500/30'
                              }`}
                            >
                              <ShieldCheck className="h-2.5 w-2.5" />
                              {app.riskVerification.status === 'verified' ? 'Verif Risk' : 'Koreksi Risk'}
                            </span>
                          ) : app.adminReview ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                              Menunggu Risk
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Surveyor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="text-slate-300 font-medium text-[11px]">{app.marketingName}</p>
                        <p className="text-[10px] text-slate-500">{app.cabang}</p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => viewApplicationDetails(app)}
                            className="p-1.5 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Lihat Detail Survey Lengkap"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setActiveTab('committee');
                              }}
                              className="p-1.5 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 transition-colors"
                              title="Masuk ke Sidang Komite Pembiayaan"
                            >
                              <Gavel className="h-4 w-4" />
                            </button>
                          )}

                          {(isRiskManagement || currentUser.role === 'super_admin') && app.adminReview && (
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setActiveTab('risk_workspace');
                              }}
                              className="p-1.5 rounded text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 transition-colors"
                              title="Beri Tanda Verifikasi & Koreksi Manajemen Risiko"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          )}

                          {/* Tombol Beri Catatan & Atensi Khusus (Dewan Manajemen & Super Admin) */}
                          {(isManagement || currentUser.role === 'super_admin') && (
                            <button
                              onClick={() => {
                                setActiveManagementModalApp(app);
                                setManagementNoteText(app.managementNote?.notes || '');
                                setIsAttentionChecked(app.managementNote?.isAttention ?? true);
                              }}
                              className={`p-1.5 rounded transition-colors ${
                                app.managementNote?.isAttention
                                  ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/30'
                                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                              }`}
                              title="Beri Catatan & Tanda Perhatian Dewan Manajemen"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => printApplicationReport(app)}
                            className="p-1.5 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                            title="Cetak Laporan / PDF"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => exportApplicationsToExcel([app], `Credit_Scoring_${app.applicationNumber}.xlsx`)}
                            className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Ekspor Excel (.xlsx)"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {currentUser.role === 'super_admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus pengajuan ${app.applicationNumber}?`)) {
                                  deleteApplication(app.id);
                                }
                              }}
                              className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Hapus Pengajuan (Super Admin)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Batch Operations Toolbar */}
      {selectedAppIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 shrink-0">
                <CheckSquare className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {selectedAppIds.length} Berkas Dipilih
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-medium">
                    Operasi Sekaligus
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Total Plafon: <strong className="text-emerald-400 font-mono">Rp {selectedAppsList.reduce((acc, curr) => acc + (curr.financial?.plafonDiajukan || 0), 0).toLocaleString('id-ID')}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={clearSelection}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Batalkan ({selectedAppIds.length})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
            {/* Branch Manager Action: Validasi & Setujui Cabang Sekaligus */}
            {(isBranchManager || currentUser.role === 'super_admin') && (
              <button
                onClick={() => {
                  setBatchBMStatus('valid');
                  setBatchBMNotes('Berkas survey telah diverifikasi lapangan dan disetujui untuk diteruskan ke Sidang Komite Pembiayaan.');
                  setBatchBMRevisiNotes('');
                  setIsBatchBMModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 font-bold transition-all shadow-sm active:scale-95"
                title="Validasi & Setujui Cabang Sekaligus"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Validasi & Setujui Cabang ({selectedAppIds.length})</span>
              </button>
            )}

            {/* Management Action: Catatan & Atensi Manajemen Sekaligus */}
            {(isManagement || currentUser.role === 'super_admin') && (
              <button
                onClick={() => {
                  setBatchManagementNoteText('');
                  setBatchIsAttention(true);
                  setIsBatchManagementModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 font-bold transition-all shadow-sm active:scale-95"
                title="Beri Catatan Supervisi & Tanda Perhatian ke Berkas Terpilih"
              >
                <Flag className="h-4 w-4" />
                <span>Beri Catatan & Atensi ({selectedAppIds.length})</span>
              </button>
            )}

            {/* Admin / Komite Action: Keputusan Sidang Komite Sekaligus */}
            {(isCreditAnalystOrCommittee || currentUser.role === 'super_admin') && (
              <button
                onClick={() => {
                  setBatchCommitteeDecision('approved');
                  setBatchCommitteeNotes('Disetujui dalam keputusan rapat komite pembiayaan sesuai rekomendasi credit scoring.');
                  setIsBatchCommitteeModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 font-bold transition-all shadow-sm active:scale-95"
                title="Tetapkan Keputusan Sidang Komite untuk Berkas Terpilih"
              >
                <Gavel className="h-4 w-4" />
                <span>Keputusan Komite ({selectedAppIds.length})</span>
              </button>
            )}

            {/* Universal Batch Export Excel */}
            <button
              onClick={() => {
                exportApplicationsToExcel(selectedAppsList, `Ekspor_Batch_${selectedAppsList.length}_Berkas.xlsx`);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 font-semibold transition-colors"
              title="Ekspor berkas yang dicentang ke file Excel"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Batch Validasi Cabang (Branch Manager) */}
      {isBatchBMModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Validasi Cabang Sekaligus ({selectedAppIds.length} Berkas)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Otorisasi Branch Manager: {currentUser.name} ({currentUser.branch})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchBMModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBatchBMSubmit} className="space-y-4">
              {/* Ringkasan Berkas Terpilih */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800/80 pb-1.5">
                  <span>Daftar Pengajuan ({selectedAppsList.length} Berkas)</span>
                  <span className="font-mono text-emerald-400">
                    Total: Rp {selectedAppsList.reduce((acc, curr) => acc + (curr.financial?.plafonDiajukan || 0), 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/50">
                  {selectedAppsList.map((app) => (
                    <div key={app.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{app.namaDebitur}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({app.applicationNumber})</span>
                        <p className="text-[10px] text-slate-500">{app.jenisUsaha} · AO: {app.marketingName}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-200">
                          Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[10px] text-emerald-400 font-semibold">
                          Grade {app.scoring.ratingGrade.split(' ')[0]} ({app.scoring.totalScore} Poin)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Keputusan Cabang */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Keputusan Validasi Cabang: <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchBMStatus('valid')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      batchBMStatus === 'valid'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Valid / Sah Cabang</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-400 leading-tight">
                      Teruskan ke meja Komite & Analis Kredit
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchBMStatus('revision')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      batchBMStatus === 'revision'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Minta Revisi AO</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-400 leading-tight">
                      Kembalikan ke Account Officer
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchBMStatus('rejected')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      batchBMStatus === 'rejected'
                        ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                      <span>Tolak di Cabang</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-400 leading-tight">
                      Gugurkan berkas di tingkat supervisi
                    </p>
                  </button>
                </div>
              </div>

              {/* Catatan Supervisi Kepala Cabang */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Catatan Supervisi Branch Manager: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={batchBMNotes}
                  onChange={(e) => setBatchBMNotes(e.target.value)}
                  placeholder="Tuliskan catatan supervisi dan rekomendasi Branch Manager untuk berkas terpilih..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {batchBMStatus === 'revision' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                    Instruksi Khusus Revisi AO: <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={batchBMRevisiNotes}
                    onChange={(e) => setBatchBMRevisiNotes(e.target.value)}
                    placeholder="Tuliskan data atau lampiran survey yang harus dilengkapi oleh Account Officer..."
                    className="w-full rounded-xl border border-amber-500/50 bg-slate-800/90 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatchBMModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>Proses Validasi ({selectedAppIds.length} Berkas)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Batch Catatan & Tanda Atensi (Dewan Manajemen) */}
      {isBatchManagementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-amber-500/30 bg-slate-900 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Catatan Supervisi & Atensi Manajemen Sekaligus ({selectedAppIds.length} Berkas)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Otorisasi Dewan Pengurus & Manajemen Eksekutif: {currentUser.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchManagementModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBatchManagementSubmit} className="space-y-4">
              {/* Ringkasan Berkas Terpilih */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800/80 pb-1.5">
                  <span>Daftar Pengajuan ({selectedAppsList.length} Berkas)</span>
                  <span className="font-mono text-amber-400">
                    Total: Rp {selectedAppsList.reduce((acc, curr) => acc + (curr.financial?.plafonDiajukan || 0), 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/50">
                  {selectedAppsList.map((app) => (
                    <div key={app.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{app.namaDebitur}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({app.applicationNumber})</span>
                        <p className="text-[10px] text-slate-500">{app.jenisUsaha} · Kantor: <strong className="text-slate-300">{app.cabang}</strong></p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-200">
                          Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[10px] text-emerald-400 font-semibold">
                          Grade {app.scoring.ratingGrade.split(' ')[0]} ({app.scoring.totalScore} Poin)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Catatan Supervisi Dewan Manajemen */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Catatan Supervisi / Arahan Dewan Manajemen: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={batchManagementNoteText}
                  onChange={(e) => setBatchManagementNoteText(e.target.value)}
                  placeholder="Tuliskan arahan pengawasan, instruksi penajaman survey, atau pertimbangan persetujuan manajemen..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* Tanda Perhatian Checkbox */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5">
                <input
                  type="checkbox"
                  id="batchAttentionToggle"
                  checked={batchIsAttention}
                  onChange={(e) => setBatchIsAttention(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="batchAttentionToggle" className="text-xs cursor-pointer select-none">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Beri Tanda Perhatian Khusus (Notifikasi Instan ke Semua Cabang Terkait)
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Jika dicentang, badge perhatian khusus akan terpasang pada <strong className="text-white">{selectedAppIds.length} berkas</strong> ini dan notifikasi prioritas tinggi otomatis dikirim ke masing-masing <strong className="text-white">Branch Manager</strong> cabang terkait serta seluruh user <strong className="text-white">Analis Pembiayaan / Komite</strong>.
                  </p>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatchManagementModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 transition-colors shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Simpan & Kirim Notifikasi ({selectedAppIds.length} Berkas)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Batch Sidang Komite (Admin / Super Admin) */}
      {isBatchCommitteeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-sky-500/30 bg-slate-900 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Gavel className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Keputusan Sidang Komite Pembiayaan ({selectedAppIds.length} Berkas)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Otorisasi Komite & Analis Kredit: {currentUser.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchCommitteeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBatchCommitteeSubmit} className="space-y-4">
              {/* Ringkasan Berkas Terpilih */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800/80 pb-1.5">
                  <span>Daftar Pengajuan ({selectedAppsList.length} Berkas)</span>
                  <span className="font-mono text-sky-400">
                    Total: Rp {selectedAppsList.reduce((acc, curr) => acc + (curr.financial?.plafonDiajukan || 0), 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/50">
                  {selectedAppsList.map((app) => (
                    <div key={app.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{app.namaDebitur}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({app.applicationNumber})</span>
                        <p className="text-[10px] text-slate-500">{app.jenisUsaha} · {app.cabang}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-200">
                          Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[10px] text-emerald-400 font-semibold">
                          Grade {app.scoring.ratingGrade.split(' ')[0]} ({app.scoring.totalScore} Poin)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pilihan Keputusan */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Keputusan Rapat Komite: <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchCommitteeDecision('approved')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      batchCommitteeDecision === 'approved'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Setujui Penuh</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-400 leading-tight">
                      Sesuai rekomendasi plafon & skoring
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchCommitteeDecision('conditional_approval')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      batchCommitteeDecision === 'conditional_approval'
                        ? 'border-sky-500 bg-sky-950/40 text-sky-300'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <FileCheck className="h-3.5 w-3.5 text-sky-400" />
                      <span>Setujui Bersyarat</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-400 leading-tight">
                      Dengan syarat preseden/subsequen
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchCommitteeDecision('rejected')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      batchCommitteeDecision === 'rejected'
                        ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                      <span>Tolak Pengajuan</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-400 leading-tight">
                      Tidak memenuhi kriteria kelayakan
                    </p>
                  </button>
                </div>
              </div>

              {/* Catatan Keputusan Sidang Komite */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Catatan Risalah Sidang Komite: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={batchCommitteeNotes}
                  onChange={(e) => setBatchCommitteeNotes(e.target.value)}
                  placeholder="Tuliskan ringkasan pertimbangan keputusan rapat komite pembiayaan..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatchCommitteeModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition-colors shadow-sm"
                >
                  <Gavel className="h-4 w-4" />
                  <span>Sahkan Keputusan Komite ({selectedAppIds.length} Berkas)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Beri Catatan & Tanda Perhatian Dewan Manajemen */}
      {activeManagementModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Catatan & Atensi Dewan Manajemen</h3>
                  <p className="text-[11px] text-slate-400">
                    {activeManagementModalApp.applicationNumber} · {activeManagementModalApp.namaDebitur} ({activeManagementModalApp.cabang})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveManagementModalApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManagementNote} className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Plafon Diajukan:</span>
                  <span className="font-mono font-bold text-white">
                    Rp {activeManagementModalApp.financial.plafonDiajukan.toLocaleString('id-ID')} ({activeManagementModalApp.financial.tenorBulanDiajukan} Bln)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Skor 5C & Grade:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {activeManagementModalApp.scoring.totalScore} Poin · {activeManagementModalApp.scoring.ratingGrade}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Surveyor Lapangan:</span>
                  <span className="text-slate-300">
                    {activeManagementModalApp.marketingName} ({activeManagementModalApp.cabang})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Catatan Supervisi / Arahan Dewan Manajemen: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={managementNoteText}
                  onChange={(e) => setManagementNoteText(e.target.value)}
                  placeholder="Tuliskan catatan pengawasan, instruksi verifikasi lanjutan, atau pertimbangan makro untuk berkas ini..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* Tanda Perhatian Checkbox */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5">
                <input
                  type="checkbox"
                  id="attentionToggle"
                  checked={isAttentionChecked}
                  onChange={(e) => setIsAttentionChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="attentionToggle" className="text-xs cursor-pointer select-none">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Beri Tanda Perhatian Khusus (Notifikasi Instan)
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Jika dicentang, notifikasi prioritas tinggi akan otomatis terkirim ke user <strong className="text-white">Branch Manager ({activeManagementModalApp.cabang})</strong> dan <strong className="text-white">Analis Pembiayaan / Komite</strong> untuk segera ditindaklanjuti.
                  </p>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveManagementModalApp(null)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 transition-colors shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Simpan & Kirim Notifikasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
