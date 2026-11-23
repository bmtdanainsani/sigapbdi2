import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  Bell,
  Plus,
  BarChart3,
  ClipboardList,
  ShieldAlert,
  Gavel,
  ListChecks,
  Users,
  ScrollText,
  Building2,
  Key,
  User as UserIcon,
  LogIn,
  Sun,
  Moon,
  Banknote,
  Sliders,
  Settings,
  ShieldCheck,
  Database,
  LogOut,
  Cloud,
  CloudOff,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    unreadNotificationsCount,
    setIsNotificationPanelOpen,
    isNotificationPanelOpen,
    setIsSidebarOpen,
    setIsAccountSettingsOpen,
    setIsLoginModalOpen,
    logout,
    theme,
    toggleTheme,
    isCloudConnected,
    firebaseUser,
    connectGoogleCloudSync,
  } = useApp();

  // Get active tab details
  const getTabInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dasbor Analitik',
          subtitle: 'Tren profil risiko portofolio & metrik persetujuan kredit',
          icon: BarChart3,
        };
      case 'branch_workspace':
        return {
          title: 'Validasi & Akumulasi Cabang',
          subtitle: `Supervisi berkas survey AO & validasi Kepala Cabang (${currentUser.branch})`,
          icon: Building2,
        };
      case 'survey_form':
        return {
          title: 'Form Survey Lapangan',
          subtitle: 'Input data verifikasi 5C, kalkulasi DSR, dan skoring risiko instan',
          icon: ClipboardList,
        };
      case 'applications_list':
        return {
          title: 'Daftar Pengajuan Survey',
          subtitle: 'Monitoring status kelayakan, ekspor laporan, dan audit berkas',
          icon: ShieldAlert,
        };
      case 'committee':
        return {
          title: 'Sidang Komite Pembiayaan',
          subtitle: 'Analisa risiko 5C, penetapan limit & tenor, dan dokumentasi risalah',
          icon: Gavel,
        };
      case 'risk_workspace':
        return {
          title: 'Verifikasi Manajemen Risiko',
          subtitle: 'Pemeriksaan ulang pasca-komite Analis, catatan koreksi & tanda verifikasi lembar komite',
          icon: ShieldCheck,
        };
      case 'checklist_management':
        return {
          title: 'Kelola Checklist Survey',
          subtitle: 'Hapus, kurangi, atau edit butir checklist 5C lapangan (Super Admin)',
          icon: ListChecks,
        };
      case 'user_management':
        return {
          title: 'Manajemen Staf & Peran',
          subtitle: 'Otentikasi, hak akses operasional, dan pendaftaran akun baru',
          icon: Users,
        };
      case 'office_ao_management':
        return {
          title: 'Kelola Pilihan Kantor & Nama AO',
          subtitle: 'Master daftar kantor cabang dan nama Account Officer untuk Form Survey & Dasbor',
          icon: Building2,
        };
      case 'scoring_formula':
        return {
          title: 'Rumus Perhitungan & Manajemen Risiko',
          subtitle: 'Kustomisasi bobot 5C, ambang batas Grade A-D, toleransi DSR, dan penalti fraud',
          icon: Sliders,
        };
      case 'audit_log':
        return {
          title: 'Log Aktivitas & Audit Trail',
          subtitle: 'Pencatatan transparan seluruh riwayat perubahan status & aksi staf',
          icon: ScrollText,
        };
      case 'disbursement_workspace':
        return {
          title: 'Administrasi Pencairan & Pengikatan Agunan',
          subtitle: 'Tindak lanjut instruksi komite, akad notaris (Fidusia/APHT), dokumentasi & pencairan',
          icon: Banknote,
        };
      case 'app_settings':
        return {
          title: 'Pengaturan Aplikasi & Lembaga',
          subtitle: 'Kustomisasi identitas, sub-judul, tema warna, format kop surat, dan kebijakan operasional',
          icon: Settings,
        };
      case 'backup_restore':
        return {
          title: 'Backup & Restore Database',
          subtitle: 'Ekspor seluruh database ke Excel (.xlsx) dan pemulihan data terintegrasi',
          icon: Database,
        };
      default:
        return {
          title: 'Sistem Credit Scoring',
          subtitle: 'Aplikasi penilaian kapasitas calon kreditur',
          icon: BarChart3,
        };
    }
  };

  const currentTabInfo = getTabInfo();
  const TabIcon = currentTabInfo.icon;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Sidebar Trigger + Screen Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden focus:outline-hidden"
            aria-label="Buka Menu Samping"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TabIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                {currentTabInfo.title}
              </h2>
              <p className="hidden md:block text-[11px] text-slate-400 leading-tight">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Action + Notification + Role Badge */}
        <div className="flex items-center gap-2.5">
          {/* Cloud Firestore Sync Status / Connect Button */}
          {isCloudConnected && firebaseUser?.emailVerified ? (
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300"
              title={`Cloud Firestore aktif (${firebaseUser.email}). Data tersinkron otomatis antar perangkat.`}
            >
              <Cloud className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="hidden xl:inline">Cloud Aktif</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void connectGoogleCloudSync()}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/60 hover:bg-amber-900/70 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 transition-colors shadow-xs"
              title="Saat ini berjalan di Mode Lokal (hanya perangkat ini). Klik untuk menghubungkan Akun Google agar data tersinkron ke Cloud & gadget lain."
            >
              <CloudOff className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Hubungkan Cloud</span>
            </button>
          )}

          {/* Quick "Survey Baru" Button (Hanya untuk Marketing/AO & Super Admin) */}
          {activeTab !== 'survey_form' && (currentUser.role === 'marketing' || currentUser.role === 'super_admin') && (
            <button
              onClick={() => setActiveTab('survey_form')}
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Survey Baru</span>
            </button>
          )}

          {/* Global Theme Toggle Button (Dark vs High-Contrast Light) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all shadow-xs focus:outline-hidden"
            title={theme === 'dark' ? 'Beralih ke Mode Terang Kontras Tinggi' : 'Beralih ke Mode Gelap (Dark Mode)'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400 shrink-0 animate-in spin-in-180 duration-300" />
                <span className="hidden md:inline text-[11px] font-semibold text-slate-200">
                  Mode Terang
                </span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-indigo-600 shrink-0 animate-in spin-in-180 duration-300" />
                <span className="hidden md:inline text-[11px] font-semibold text-slate-800">
                  Mode Gelap
                </span>
              </>
            )}
          </button>

          {/* Real-time Notification Bell */}
          <button
            onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-hidden"
            title="Notifikasi Real-time"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-slate-950 animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Role Status Tag & Account Profile */}
          <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-3 ml-1 text-right">
            <div>
              <div className="flex items-center justify-end gap-1.5">
                <p className="text-xs font-semibold text-white leading-none">
                  {currentUser.name}
                </p>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  @{currentUser.username}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-none mt-1">
                {currentUser.roleTitle} · {currentUser.branch}
              </p>
            </div>
            
            <button
              onClick={() => setIsAccountSettingsOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
              title="Pengaturan Akun & Kredensial Saya"
            >
              <Key className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Masuk / Ganti Akun dengan Username & Password"
            >
              <LogIn className="h-4 w-4" />
            </button>

            <button
              onClick={() => logout('manual')}
              className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-950/40 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 hover:bg-rose-600 hover:text-white transition-colors"
              title="Keluar (Logout) dari sesi"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>

          {/* Mobile quick Logout button */}
          <button
            onClick={() => logout('manual')}
            className="lg:hidden p-2 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/60 transition-colors"
            title="Keluar (Logout)"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
