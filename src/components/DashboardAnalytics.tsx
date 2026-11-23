import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Download,
  PlusCircle,
  FileCheck,
  UserCheck,
  Lock,
  Building2,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { exportApplicationsToExcel } from '../utils/exportUtils';

export const DashboardAnalytics: React.FC = () => {
  const {
    applications,
    currentUser,
    users,
    appSettings,
    setActiveTab,
    viewApplicationDetails,
  } = useApp();

  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
  const [officeFilter, setOfficeFilter] = useState<string>('all');
  const [aoFilter, setAoFilter] = useState<string>('all');

  const isAccountOfficer = currentUser.role === 'marketing';
  const isBranchManager = currentUser.role === 'branch_manager';
  const isCreditAnalystOrCommittee = currentUser.role === 'admin';
  const isManagement = currentUser.role === 'management';
  const isRiskManagement = currentUser.role === 'risk_management';

  // Role-scoped applications:
  // - AO only sees their own surveys
  // - BM sees all surveys in their branch (kantor yang sama)
  // - Komite & Analis Kredit (admin) & Manajemen Risiko (risk_management) ONLY sees surveys validated by Branch Manager
  // - Manajemen & Super Admin sees all branches (baik sudah atau belum tervalidasi)
  const roleScopedApplications = useMemo(() => {
    if (isAccountOfficer) {
      return applications.filter((a) => {
        const matchId = a.marketingId === currentUser.id;
        const matchName = Boolean(a.marketingName && currentUser.name && a.marketingName.toLowerCase().trim() === currentUser.name.toLowerCase().trim());
        const matchBranch = Boolean(a.cabang && currentUser.branch && a.cabang.toLowerCase().trim() === currentUser.branch.toLowerCase().trim());
        return matchId || matchName || matchBranch;
      });
    }
    if (isBranchManager) {
      return applications.filter(
        (a) => (a.cabang || '').toLowerCase().trim() === (currentUser.branch || '').toLowerCase().trim()
      );
    }
    if (isCreditAnalystOrCommittee || isRiskManagement) {
      return applications.filter((a) => a.branchValidation?.status === 'valid');
    }
    // Management and Super Admin see all applications from all branches
    return applications;
  }, [applications, currentUser, isAccountOfficer, isBranchManager, isCreditAnalystOrCommittee, isRiskManagement, isManagement]);

  // Office filter options from Super Admin catalog + users + visible applications
  const officeFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    (appSettings.officeAoCatalog || []).forEach((entry) => {
      const clean = entry.officeName.trim();
      if (clean && !map.has(clean.toLowerCase())) {
        map.set(clean.toLowerCase(), clean);
      }
    });
    users.forEach((u) => {
      const clean = (u.branch || '').trim();
      if (clean && !map.has(clean.toLowerCase())) {
        map.set(clean.toLowerCase(), clean);
      }
    });
    roleScopedApplications.forEach((a) => {
      const clean = (a.cabang || '').trim();
      if (clean && !map.has(clean.toLowerCase())) {
        map.set(clean.toLowerCase(), clean);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'id'));
  }, [appSettings.officeAoCatalog, users, roleScopedApplications]);

  // AO filter options (narrowed by officeFilter when selected)
  const aoFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    const selectedOfficeLower = officeFilter !== 'all' ? officeFilter.trim().toLowerCase() : null;

    (appSettings.officeAoCatalog || []).forEach((entry) => {
      if (!selectedOfficeLower || entry.officeName.trim().toLowerCase() === selectedOfficeLower) {
        entry.aoNames.forEach((ao) => {
          const clean = ao.trim();
          if (clean && !map.has(clean.toLowerCase())) {
            map.set(clean.toLowerCase(), clean);
          }
        });
      }
    });

    users.forEach((u) => {
      if (u.role === 'marketing' && u.name.trim()) {
        if (!selectedOfficeLower || (u.branch || '').trim().toLowerCase() === selectedOfficeLower) {
          const clean = u.name.trim();
          if (!map.has(clean.toLowerCase())) {
            map.set(clean.toLowerCase(), clean);
          }
        }
      }
    });

    roleScopedApplications.forEach((a) => {
      if (!selectedOfficeLower || (a.cabang || '').trim().toLowerCase() === selectedOfficeLower) {
        const clean = (a.marketingName || '').trim();
        if (clean && !map.has(clean.toLowerCase())) {
          map.set(clean.toLowerCase(), clean);
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'id'));
  }, [appSettings.officeAoCatalog, users, roleScopedApplications, officeFilter]);

  // Apply time, office, and AO filters
  const scopedApplications = useMemo(() => {
    const now = new Date();
    return roleScopedApplications.filter((a) => {
      if (timeFilter === 'month') {
        const created = new Date(a.createdAt);
        if (
          Number.isNaN(created.getTime()) ||
          created.getMonth() !== now.getMonth() ||
          created.getFullYear() !== now.getFullYear()
        ) {
          return false;
        }
      }
      if (officeFilter !== 'all') {
        if ((a.cabang || '').trim().toLowerCase() !== officeFilter.trim().toLowerCase()) {
          return false;
        }
      }
      if (aoFilter !== 'all') {
        if ((a.marketingName || '').trim().toLowerCase() !== aoFilter.trim().toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [roleScopedApplications, timeFilter, officeFilter, aoFilter]);

  // Calculations based on scopedApplications
  const totalApps = scopedApplications.length;
  const approvedApps = scopedApplications.filter((a) => a.status === 'approved' || a.status === 'conditional_approval').length;
  const pendingApps = scopedApplications.filter((a) => a.status === 'submitted' || a.status === 'under_review').length;
  const rejectedApps = scopedApplications.filter((a) => a.status === 'rejected').length;

  const approvalRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;

  const totalPlafonDiajukan = scopedApplications.reduce((sum, a) => sum + (a.financial.plafonDiajukan || 0), 0);
  const totalPlafonDisetujui = scopedApplications.reduce((sum, a) => {
    if (a.status === 'approved' || a.status === 'conditional_approval') {
      return sum + (a.adminReview?.approvedPlafon || a.scoring.plafonDisarankan || a.financial.plafonDiajukan);
    }
    return sum;
  }, 0);

  const avgScore = totalApps > 0
    ? Math.round(scopedApplications.reduce((sum, a) => sum + a.scoring.totalScore, 0) / totalApps)
    : 0;

  const avgDsr = totalApps > 0
    ? Math.round(scopedApplications.reduce((sum, a) => sum + (a.financial.dsrRatio || 0), 0) / totalApps)
    : 0;

  // Grade distributions
  const gradeCounts = {
    A: scopedApplications.filter((a) => a.scoring.ratingGrade.startsWith('A')).length,
    B: scopedApplications.filter((a) => a.scoring.ratingGrade.startsWith('B')).length,
    C: scopedApplications.filter((a) => a.scoring.ratingGrade.startsWith('C')).length,
    D: scopedApplications.filter((a) => a.scoring.ratingGrade.startsWith('D')).length,
  };

  // 5C Average Breakdown
  const avg5C = {
    character: totalApps > 0 ? Math.round(scopedApplications.reduce((sum, a) => sum + a.scoring.characterScore, 0) / totalApps) : 0,
    capacity: totalApps > 0 ? Math.round(scopedApplications.reduce((sum, a) => sum + a.scoring.capacityScore, 0) / totalApps) : 0,
    capital: totalApps > 0 ? Math.round(scopedApplications.reduce((sum, a) => sum + a.scoring.capitalScore, 0) / totalApps) : 0,
    collateral: totalApps > 0 ? Math.round(scopedApplications.reduce((sum, a) => sum + a.scoring.collateralScore, 0) / totalApps) : 0,
    condition: totalApps > 0 ? Math.round(scopedApplications.reduce((sum, a) => sum + a.scoring.conditionScore, 0) / totalApps) : 0,
  };

  // Applications requiring attention
  const needsReviewApps = scopedApplications.filter((a) => a.status === 'submitted' || a.status === 'under_review');
  const fraudFlagApps = scopedApplications.filter((a) => a.fraudEvaluation.hasRedFlags || a.scoring.ratingGrade.startsWith('D'));

  return (
    <div className="space-y-6">
      {/* Account Officer Mode Notice Banner */}
      {isAccountOfficer && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300 backdrop-blur-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">
              Mode Account Officer Pribadi ({currentUser.name} · {currentUser.branch})
            </p>
            <p className="text-[11px] text-emerald-400/90 mt-0.5 leading-relaxed">
              Anda hanya dapat melihat analitik, statistik persetujuan, dan riwayat survey yang Anda input sendiri. Data nasabah surveyor lain disembunyikan untuk menjaga privasi.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-emerald-950 px-2.5 py-1 text-[11px] font-mono text-emerald-400 border border-emerald-500/20">
            <Lock className="h-3 w-3" />
            <span>Privasi AO Aktif</span>
          </div>
        </div>
      )}

      {/* Branch Manager Notice Banner */}
      {isBranchManager && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-4 text-xs text-indigo-300 backdrop-blur-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">
              Mode Supervisi Branch Manager ({currentUser.name} · {currentUser.branch})
            </p>
            <p className="text-[11px] text-indigo-300/90 mt-0.5 leading-relaxed">
              Menampilkan akumulasi kinerja seluruh Account Officer (AO) di kantor cabang Anda. Buka tab "Validasi Cabang" untuk memvalidasi berkas sebelum diteruskan ke Komite & Analis.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('branch_workspace')}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shrink-0"
          >
            <span>Validasi Cabang</span>
          </button>
        </div>
      )}

      {/* Komite & Analis Kredit Notice Banner */}
      {isCreditAnalystOrCommittee && (
        <div className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-950/40 p-4 text-xs text-sky-300 backdrop-blur-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
            <FileCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">
              Mode Komite Pembiayaan & Analis Kredit
            </p>
            <p className="text-[11px] text-sky-300/90 mt-0.5 leading-relaxed">
              Analitik hanya mengkalkulasi berkas yang telah mengantongi validasi sah dari Branch Manager masing-masing kantor cabang.
            </p>
          </div>
        </div>
      )}

      {/* Dewan Manajemen Executive Notice Banner */}
      {isManagement && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 text-xs text-amber-200 backdrop-blur-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-white">
                Mode Eksekutif Dewan Manajemen ({currentUser.name} · {currentUser.branch})
              </p>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                Read-Only
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
              Monitoring komprehensif seluruh kantor cabang. Anda dapat meninjau seluruh data pengajuan survey (baik yang sudah divalidasi maupun yang masih menunggu validasi Branch Manager) tanpa akses mengubah data atau mengisi formulir survey.
            </p>
          </div>
        </div>
      )}

      {/* Manajemen Risiko Notice Banner */}
      {isRiskManagement && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-4 text-xs text-cyan-200 backdrop-blur-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-white">
                Divisi Manajemen Risiko ({currentUser.name} · {currentUser.branch})
              </p>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                Read-Only + Verifikasi Komite
              </span>
            </div>
            <p className="text-[11px] text-cyan-200/90 mt-0.5 leading-relaxed">
              Peran Anda memeriksa ulang berkas setelah dikoreksi &amp; dijadwalkan komite oleh Analis, memberikan catatan koreksi, dan menyematkan Tanda Verifikasi yang tampil pada Lembar Komite.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('risk_workspace')}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 transition-colors shrink-0 self-start sm:self-center"
          >
            <span>Buka Verifikasi Risiko</span>
          </button>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isAccountOfficer
              ? `Dasbor Kinerja Survey - ${currentUser.name}`
              : isManagement
              ? 'Dasbor Eksekutif Manajemen - Akumulasi Seluruh Cabang'
              : isRiskManagement
              ? 'Dasbor Pengawasan & Verifikasi Manajemen Risiko'
              : 'Dasbor Analitik & Profil Risiko Kredit'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            {isAccountOfficer
              ? `Monitoring portofolio survey pembiayaan Anda di ${currentUser.branch}.`
              : isManagement
              ? 'Pengawasan portofolio pembiayaan makro, distribusi grade kelayakan 5C, dan rasio persetujuan lintas cabang.'
              : isRiskManagement
              ? 'Pemantauan profil risiko berkas lolos validasi BM, status review Analis Komite, dan tanda verifikasi risiko.'
              : 'Monitoring kelayakan calon debitur, evaluasi 5C terintegrasi, dan notifikasi persetujuan instan.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Time Filter Button */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-800/60 p-1 text-xs">
            <button
              onClick={() => setTimeFilter('all')}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                timeFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                timeFilter === 'month' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bulan Ini
            </button>
          </div>

          <button
            onClick={() => exportApplicationsToExcel(scopedApplications, isAccountOfficer ? `Laporan_Survey_${currentUser.name.replace(/\s+/g, '_')}.xlsx` : 'Laporan_Credit_Scoring.xlsx')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>

          {/* Form Survey hanya untuk Marketing dan Super Admin */}
          {(currentUser.role === 'marketing' || currentUser.role === 'super_admin') && (
            <button
              onClick={() => setActiveTab('survey_form')}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Survey Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar: Kantor, Nama AO & Periode */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
            <span>Filter Dasbor:</span>
          </div>

          {/* Filter Kantor */}
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={officeFilter}
              onChange={(e) => {
                const nextOffice = e.target.value;
                setOfficeFilter(nextOffice);
                setAoFilter('all');
              }}
              aria-label="Filter Kantor"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">Semua Kantor ({officeFilterOptions.length})</option>
              {officeFilterOptions.map((office) => (
                <option key={office} value={office}>
                  {office}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Nama AO */}
          <div className="flex items-center gap-2">
            <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={aoFilter}
              onChange={(e) => setAoFilter(e.target.value)}
              aria-label="Filter Account Officer"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">Semua AO ({aoFilterOptions.length})</option>
              {aoFilterOptions.map((ao) => (
                <option key={ao} value={ao}>
                  {ao}
                </option>
              ))}
            </select>
          </div>

          {(officeFilter !== 'all' || aoFilter !== 'all' || timeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setOfficeFilter('all');
                setAoFilter('all');
                setTimeFilter('all');
              }}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Menampilkan <strong className="text-white">{scopedApplications.length}</strong> dari{' '}
          <strong className="text-slate-200">{roleScopedApplications.length}</strong> pengajuan
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Applications */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Pengajuan</span>
            <span className="text-slate-500 font-mono text-xs">{totalApps} berkas</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{totalApps}</span>
            <span className="text-xs text-emerald-400 flex items-center font-medium">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Aktif
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Total Plafon: <span className="font-mono text-slate-300">Rp {(totalPlafonDiajukan / 1000000).toFixed(0)} Jt</span>
          </p>
        </div>

        {/* Average Credit Score */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rata-rata Skor Risiko</span>
            <span className="text-slate-500 font-mono text-xs">Skala 0-100</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{avgScore}</span>
            <span className="text-xs text-emerald-400 font-medium">/ 100</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Status: <span className="text-emerald-400 font-semibold">{avgScore >= 75 ? 'Risiko Rendah / Baik' : 'Risiko Menengah'}</span>
          </p>
        </div>

        {/* Average DSR (Debt Service Ratio) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rata-rata DSR (Beban Hutang)</span>
            <span className="text-slate-500 font-mono text-xs">Maksimal 35%</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{avgDsr}%</span>
            <span className={`text-xs font-medium ${avgDsr <= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {avgDsr <= 35 ? 'Sehat' : 'Waspada'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Beban angsuran terhadap laba bersih
          </p>
        </div>

        {/* Approval Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tingkat Persetujuan</span>
            <span className="text-slate-500 font-mono text-xs">{approvedApps} disetujui</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{approvalRate}%</span>
            <span className="text-xs text-sky-400 font-medium">Approval Rate</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Disetujui: <span className="font-mono text-slate-300">Rp {(totalPlafonDisetujui / 1000000).toFixed(0)} Jt</span>
          </p>
        </div>
      </div>

      {/* Analytics Row: 5C Profile Breakdown + Risk Rating Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 5C Dimensions Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Rata-rata Penilaian 5C Pembiayaan</h2>
              <p className="text-xs text-slate-400">Hasil audit 68 parameter survey lapangan</p>
            </div>
            <span className="font-mono text-xs text-slate-500">Bobot Terkalkulasi</span>
          </div>

          <div className="mt-4 space-y-3.5">
            {/* Character */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">1. Character (Integritas & Riwayat)</span>
                <span className="font-mono text-slate-200">{avg5C.character}/100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${avg5C.character}%` }}
                />
              </div>
            </div>

            {/* Capacity */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">2. Capacity (Kemampuan Arus Kas & DSR)</span>
                <span className="font-mono text-slate-200">{avg5C.capacity}/100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${avg5C.capacity}%` }}
                />
              </div>
            </div>

            {/* Capital */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">3. Capital (Modal Sendiri & Kekayaan Bersih)</span>
                <span className="font-mono text-slate-200">{avg5C.capital}/100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${avg5C.capital}%` }}
                />
              </div>
            </div>

            {/* Collateral */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">4. Collateral (Nilai Agunan & Marketability)</span>
                <span className="font-mono text-slate-200">{avg5C.collateral}/100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${avg5C.collateral}%` }}
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">5. Condition (Prospek Usaha & Musiman)</span>
                <span className="font-mono text-slate-200">{avg5C.condition}/100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${avg5C.condition}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Profile Distribution (Grade A - D) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Distribusi Profil Risiko Calon Debitur</h2>
              <p className="text-xs text-slate-400">Pengelompokan kelayakan berdasarkan standar scoring</p>
            </div>
            <span className="font-mono text-xs text-slate-500">{totalApps} total</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Grade A */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400">Grade A</span>
                <span className="font-mono text-lg font-bold text-white tabular-nums">{gradeCounts.A}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300 font-medium">Sangat Layak (Skor &ge; 80)</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Disetujui 100% plafon tanpa kendala</p>
            </div>

            {/* Grade B */}
            <div className="rounded-lg border border-sky-500/20 bg-sky-950/20 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-400">Grade B</span>
                <span className="font-mono text-lg font-bold text-white tabular-nums">{gradeCounts.B}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300 font-medium">Layak Bersyarat (65 - 79)</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Plafon disesuaikan / mitigasi jaminan</p>
            </div>

            {/* Grade C */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">Grade C</span>
                <span className="font-mono text-lg font-bold text-white tabular-nums">{gradeCounts.C}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300 font-medium">Tinjauan Komite (50 - 64)</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Memerlukan mitigasi ketat / agunan ekstra</p>
            </div>

            {/* Grade D */}
            <div className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400">Grade D</span>
                <span className="font-mono text-lg font-bold text-white tabular-nums">{gradeCounts.D}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300 font-medium">Tidak Layak / Ditolak (&lt; 50)</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Defisit kas / terdeteksi Fraud Red Flag</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Sections: Waiting for Admin Review & High Risk Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Needs Admin Review Queue */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Menunggu Review Komite / Admin</h2>
            </div>
            <span className="font-mono text-xs text-amber-400">{needsReviewApps.length} Pengajuan</span>
          </div>

          <div className="mt-3 divide-y divide-slate-800/80">
            {needsReviewApps.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Semua pengajuan telah diproses oleh Admin.
              </div>
            ) : (
              needsReviewApps.map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{app.namaDebitur}</span>
                      <span className="text-[11px] font-mono text-slate-400">({app.applicationNumber})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Plafon: <span className="font-mono text-slate-200">Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}</span> · Skor: <span className="font-mono font-semibold text-emerald-400">{app.scoring.totalScore}</span> ({app.scoring.ratingGrade})
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Surveyor: {app.marketingName} · {app.cabang}
                    </p>
                  </div>

                  <button
                    onClick={() => viewApplicationDetails(app)}
                    className="flex items-center gap-1 rounded-md bg-emerald-600/20 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 transition-colors border border-emerald-500/30"
                  >
                    <span>Review</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fraud Red Flag Alerts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <h2 className="text-sm font-semibold text-white">Peringatan Red Flag & Risiko Tinggi</h2>
            </div>
            <span className="font-mono text-xs text-rose-400">{fraudFlagApps.length} Terdeteksi</span>
          </div>

          <div className="mt-3 divide-y divide-slate-800/80">
            {fraudFlagApps.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Tidak ada indikasi fraud red flag kritis yang aktif.
              </div>
            ) : (
              fraudFlagApps.map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between">
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-rose-300">{app.namaDebitur}</span>
                      <span className="text-[10px] text-rose-400/90 font-mono">
                        [{app.scoring.ratingGrade}]
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {app.scoring.summaryRemarks}
                    </p>
                    {app.fraudEvaluation.detectedFlags.length > 0 && (
                      <p className="text-[10px] text-rose-400/80 mt-0.5 line-clamp-1">
                        Flag: {app.fraudEvaluation.detectedFlags[0]}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => viewApplicationDetails(app)}
                    className="flex items-center gap-1 rounded-md bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                  >
                    <span>Investigasi</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
