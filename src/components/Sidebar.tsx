import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  ClipboardList,
  ShieldAlert,
  Gavel,
  ListChecks,
  Users,
  ScrollText,
  UserCheck,
  ChevronDown,
  RotateCcw,
  X,
  ShieldCheck,
  Building2,
  Sparkles,
  Layers,
  ChevronRight,
  Key,
  LogIn,
  Banknote,
  Sliders,
  Trash2,
  Settings,
  Database,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    users,
    switchUser,
    activeTab,
    setActiveTab,
    applications,
    questions,
    appSettings,
    isSidebarOpen,
    setIsSidebarOpen,
    resetAllData,
    deleteAllApplications,
    setIsAccountSettingsOpen,
    setIsLoginModalOpen,
    logout,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Computed counts for badges
  const isAccountOfficer = currentUser.role === 'marketing';
  const isBranchManager = currentUser.role === 'branch_manager';
  const isCreditAnalystOrCommittee = currentUser.role === 'admin';
  const isRiskManagement = currentUser.role === 'risk_management';

  const scopedApps = isAccountOfficer
    ? applications.filter((a) => {
        const matchId = a.marketingId === currentUser.id;
        const matchName = Boolean(a.marketingName && currentUser.name && a.marketingName.toLowerCase().trim() === currentUser.name.toLowerCase().trim());
        const matchBranch = Boolean(a.cabang && currentUser.branch && a.cabang.toLowerCase().trim() === currentUser.branch.toLowerCase().trim());
        return matchId || matchName || matchBranch;
      })
    : isBranchManager
    ? applications.filter((a) => (a.cabang || '').toLowerCase().trim() === (currentUser.branch || '').toLowerCase().trim())
    : isCreditAnalystOrCommittee || isRiskManagement
    ? applications.filter((a) => a.branchValidation?.status === 'valid')
    : applications;

  const totalApps = scopedApps.length;

  // Committee agenda: strictly applications validated by BM!
  const pendingReviewApps = applications.filter(
    (a) => a.branchValidation?.status === 'valid' && (a.status === 'submitted' || a.status === 'under_review')
  ).length;

  // Risk Management queue: validated by BM and already scheduled/reviewed by Analis, pending Risk Verification
  const pendingRiskVerifications = applications.filter(
    (a) =>
      a.branchValidation?.status === 'valid' &&
      (a.analystCheck?.status === 'verified_scheduled' || Boolean(a.analystCheck?.committeeSchedule) || Boolean(a.adminReview)) &&
      !a.riskVerification
  ).length;

  // Branch Manager queue: surveys in the same branch pending BM validation
  const pendingBMValidations = applications.filter(
    (a) =>
      a.cabang.toLowerCase() === currentUser.branch.toLowerCase() &&
      (!a.branchValidation || a.branchValidation.status === 'pending')
  ).length;

  // Pencairan & Pengikatan queue
  const pendingDisbursements = applications.filter((a) => {
    const hasOrder = Boolean(a.disbursementInstruction) || a.status === 'approved' || a.status === 'conditional_approval';
    if (!hasOrder) return false;
    if (currentUser.role === 'branch_admin') {
      if (currentUser.branch && a.cabang.toLowerCase() !== currentUser.branch.toLowerCase()) return false;
      return !a.disbursementExecution || a.disbursementExecution.status === 'revision';
    }
    if (currentUser.role === 'branch_manager') {
      if (currentUser.branch && a.cabang.toLowerCase() !== currentUser.branch.toLowerCase()) return false;
      return a.disbursementExecution?.status === 'pending_bm_validation';
    }
    return !a.disbursementExecution || a.disbursementExecution.status === 'pending_bm_validation' || a.disbursementExecution.status === 'revision';
  }).length;

  const activeQuestionsCount = questions.filter((q) => q.isActive !== false).length;

  const handleNavClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Branding / Logo Header */}
        <div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-extrabold tracking-tight text-white uppercase truncate" title={appSettings.institutionName}>
                  {appSettings.institutionName || 'BMT Dana Insani'}
                </h1>
                <p className="text-[10px] text-emerald-400 font-medium tracking-wide truncate" title={appSettings.appSubtitle}>
                  {appSettings.appSubtitle || 'Credit Scoring 5C & Survey'}
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links Scrollable Area */}
          <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-170px)]">
            {/* Group 1: Operasional Survey */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Operasional Lapangan
              </p>
              <div className="space-y-1">
                {/* 1. Dasbor */}
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className={`h-4 w-4 ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>Dasbor Analitik</span>
                  </div>
                  {activeTab === 'dashboard' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-xs" />
                  )}
                </button>

                {/* 2. Form Survey (Hanya untuk Marketing/AO & Super Admin, disembunyikan untuk Branch Manager & Manajemen) */}
                {(currentUser.role === 'marketing' || currentUser.role === 'super_admin') && (
                  <button
                    onClick={() => handleNavClick('survey_form')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'survey_form'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardList className={`h-4 w-4 ${activeTab === 'survey_form' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Form Survey</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {activeQuestionsCount} Item
                    </span>
                  </button>
                )}

                {/* 3. Pengajuan */}
                <button
                  onClick={() => handleNavClick('applications_list')}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'applications_list'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className={`h-4 w-4 ${activeTab === 'applications_list' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>Daftar Pengajuan</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                    {totalApps}
                  </span>
                </button>
              </div>
            </div>

            {/* Group 2: Supervisi Cabang & Validasi (Branch Manager & Super Admin) */}
            {(currentUser.role === 'branch_manager' || currentUser.role === 'super_admin') && (
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Supervisi Cabang
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavClick('branch_workspace')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'branch_workspace'
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className={`h-4 w-4 ${activeTab === 'branch_workspace' ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span>Validasi & Akumulasi</span>
                    </div>
                    {pendingBMValidations > 0 ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30 font-bold animate-pulse">
                        {pendingBMValidations} Validasi
                      </span>
                    ) : (
                      activeTab === 'branch_workspace' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-xs" />
                      )
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Group 3: Komite & Review Pembiayaan (Admin & Super Admin) */}
            {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Sidang & Analisa Risiko
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavClick('committee')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'committee'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Gavel className={`h-4 w-4 ${activeTab === 'committee' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Sidang Komite</span>
                    </div>
                    {pendingReviewApps > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30 font-bold animate-pulse">
                        {pendingReviewApps} Agenda
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Group 3.2: Manajemen Risiko (Verifikasi & Koreksi Ulang Komite) */}
            {(currentUser.role === 'risk_management' || currentUser.role === 'super_admin') && (
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Manajemen Risiko
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavClick('risk_workspace')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'risk_workspace'
                        ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className={`h-4 w-4 ${activeTab === 'risk_workspace' ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>Verifikasi Risiko</span>
                    </div>
                    {pendingRiskVerifications > 0 ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold animate-pulse">
                        {pendingRiskVerifications} Verifikasi
                      </span>
                    ) : (
                      activeTab === 'risk_workspace' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-xs" />
                      )
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Group 3.5: Administrasi Pencairan & Notaris (Admin Cabang, BM, Analis, Manajemen, Super Admin) */}
            {(currentUser.role === 'branch_admin' ||
              currentUser.role === 'branch_manager' ||
              currentUser.role === 'admin' ||
              currentUser.role === 'management' ||
              currentUser.role === 'super_admin') && (
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Pencairan & Notaris
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavClick('disbursement_workspace')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'disbursement_workspace'
                        ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className={`h-4 w-4 ${activeTab === 'disbursement_workspace' ? 'text-teal-400' : 'text-slate-400'}`} />
                      <span>Administrasi Pencairan</span>
                    </div>
                    {pendingDisbursements > 0 ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-400 border border-teal-500/30 font-bold animate-pulse">
                        {pendingDisbursements} Berkas
                      </span>
                    ) : (
                      activeTab === 'disbursement_workspace' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-xs" />
                      )
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Group 3: Master Data & Konfigurasi (Super Admin) */}
            {currentUser.role === 'super_admin' && (
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Master Data & Staf
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavClick('checklist_management')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'checklist_management'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ListChecks className={`h-4 w-4 ${activeTab === 'checklist_management' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Kelola Checklist</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {questions.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavClick('user_management')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'user_management'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className={`h-4 w-4 ${activeTab === 'user_management' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Kelola Staf & Peran</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {users.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavClick('office_ao_management')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'office_ao_management'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className={`h-4 w-4 ${activeTab === 'office_ao_management' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Kelola Kantor &amp; AO</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {(appSettings.officeAoCatalog || []).length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavClick('scoring_formula')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'scoring_formula'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sliders className={`h-4 w-4 ${activeTab === 'scoring_formula' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Rumus & Mitigasi Risiko</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-bold">
                      5C Engine
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavClick('app_settings')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'app_settings'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className={`h-4 w-4 ${activeTab === 'app_settings' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Pengaturan Lembaga</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Branding
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavClick('backup_restore')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === 'backup_restore'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Database className={`h-4 w-4 ${activeTab === 'backup_restore' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Backup & Restore DB</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-bold">
                      Excel
                    </span>
                  </button>

                  {applications.length > 0 && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            'Apakah Anda yakin ingin menghapus SEMUA data berkas pengajuan survey uji coba? Database pengajuan akan dikosongkan.'
                          )
                        ) {
                          deleteAllApplications();
                        }
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/40 border border-rose-500/20 transition-all mt-1.5"
                      title="Kosongkan seluruh data pengajuan survey uji coba"
                    >
                      <div className="flex items-center gap-3">
                        <Trash2 className="h-4 w-4 text-rose-400" />
                        <span>Hapus Data Uji Coba</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-bold border border-rose-500/30">
                        {applications.length}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Group 4: Keamanan & Audit Log */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Audit Trail
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavClick('audit_log')}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'audit_log'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ScrollText className={`h-4 w-4 ${activeTab === 'audit_log' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>Log Aktivitas</span>
                  </div>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom: Current User Profile & Role Switcher */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 relative">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight truncate">
                    {currentUser.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold truncate">
                      @{currentUser.username}
                    </span>
                    <span className="text-[9px] text-slate-500">·</span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {currentUser.branch}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Quick Role Switcher Popover */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 z-50 w-full rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl ring-1 ring-slate-800">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Akun Aktif Saat Ini</p>
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        @{currentUser.username}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">({currentUser.roleTitle})</span>
                    </div>
                  </div>

                  {/* Actions for Current Account */}
                  <div className="space-y-1 mb-2 border-b border-slate-800 pb-1.5">
                    <button
                      onClick={() => {
                        setIsAccountSettingsOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                    >
                      <Key className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Pengaturan Akun & Kredensial</span>
                    </button>

                      <button
                        onClick={() => {
                          setIsLoginModalOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                      >
                        <LogIn className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        <span>Ganti Akun Pengguna</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout('manual');
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-rose-300 hover:text-white hover:bg-rose-950/60 transition-colors font-semibold"
                      >
                        <LogOut className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        <span>Keluar / Logout Sesi</span>
                      </button>
                    </div>

                    {currentUser.role === 'super_admin' && (
                      <div className="mt-2 border-t border-slate-800 pt-1.5">
                        <button
                          onClick={() => {
                            handleNavClick('user_management');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Users className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Kelola Kredensial & Staf</span>
                        </button>
                      </div>
                    )}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
