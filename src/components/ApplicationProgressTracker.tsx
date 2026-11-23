import React from 'react';
import { SurveyApplication } from '../types';
import {
  ClipboardCheck,
  Gavel,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Lock,
  ChevronRight,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export interface ApplicationProgressTrackerProps {
  application: SurveyApplication;
  activeTab?: string;
  onSelectStage?: (stageTab: 'overview' | 'checklist' | 'financial' | 'evidence' | 'review' | 'disbursement') => void;
  className?: string;
}

export type StageKey = 'surveying' | 'committee' | 'disbursement' | 'validation';

export interface StageItem {
  key: StageKey;
  stepNumber: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  status: 'completed' | 'in_progress' | 'pending' | 'revision' | 'rejected';
  statusLabel: string;
  targetTab: 'overview' | 'checklist' | 'financial' | 'evidence' | 'review' | 'disbursement';
  icon: React.ElementType;
  actor?: string;
  actorRole?: string;
  date?: string;
  primaryMetric?: string;
  badgeTheme: {
    bg: string;
    border: string;
    text: string;
    dot: string;
    circleBg: string;
    circleBorder: string;
    circleText: string;
  };
}

export const ApplicationProgressTracker: React.FC<ApplicationProgressTrackerProps> = ({
  application: app,
  activeTab,
  onSelectStage,
  className = '',
}) => {
  // 1. Stage 1: Surveying (Always completed for submitted records)
  const isSurveyCompleted = true;
  const surveyScore = app.scoring?.totalScore ?? 0;
  const surveyGrade = app.scoring?.ratingGrade?.split(' ')[0] || 'Grade -';
  const surveyDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  // 2. Stage 2: Committee Review
  const isBmValid = app.branchValidation?.status === 'valid';
  const isBmRevision = app.branchValidation?.status === 'revision';
  const isBmRejected = app.branchValidation?.status === 'rejected';
  const isAnalystRevisionToBm = app.analystCheck?.status === 'revision_to_bm' && !isBmValid;
  const isAnalystScheduled = app.analystCheck?.status === 'verified_scheduled' || Boolean(app.analystCheck?.committeeSchedule);
  const isCommitteeApproved = app.status === 'approved' || app.status === 'conditional_approval' || app.adminReview?.decision === 'approved' || app.adminReview?.decision === 'conditional_approval';
  const isCommitteeRejected = app.status === 'rejected' || app.adminReview?.decision === 'rejected';

  let committeeStatus: StageItem['status'] = 'in_progress';
  let committeeStatusLabel = 'Menunggu Validasi BM';
  let committeeSubtitle = `Verifikasi Kepala Cabang (${app.cabang})`;
  let committeeMetric = undefined;
  let committeeActor = app.branchValidation?.validatedBy || `Branch Manager ${app.cabang}`;
  let committeeDate = app.branchValidation?.validatedAt ? new Date(app.branchValidation.validatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : undefined;

  if (isCommitteeRejected || isBmRejected) {
    committeeStatus = 'rejected';
    committeeStatusLabel = isBmRejected ? 'Ditolak Branch Manager' : 'Ditolak Sidang Komite';
    committeeSubtitle = app.adminReview?.notes || app.branchValidation?.notes || 'Berkas tidak memenuhi kriteria';
    committeeActor = app.adminReview?.reviewedBy || app.branchValidation?.validatedBy || 'Komite Pembiayaan';
    committeeDate = app.adminReview?.reviewedAt ? new Date(app.adminReview.reviewedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : committeeDate;
  } else if (isCommitteeApproved) {
    committeeStatus = 'completed';
    committeeStatusLabel = app.status === 'conditional_approval' ? 'Disetujui Bersyarat' : 'Disetujui Penuh Komite';
    const approvedNominal = app.adminReview?.approvedPlafon || app.scoring?.plafonDisarankan || app.financial?.plafonDiajukan || 0;
    committeeMetric = `Plafon: Rp ${approvedNominal.toLocaleString('id-ID')}`;
    const riskSuffix = app.riskVerification
      ? app.riskVerification.status === 'verified'
        ? ` · ✓ Verifikasi Risk (${app.riskVerification.verificationCode})`
        : ` · ! Koreksi Manajemen Risiko`
      : ' · Menunggu Verifikasi Risk';
    committeeSubtitle = `Tenor ${app.adminReview?.approvedTenor || 12} Bln · Risalah Sah${riskSuffix}`;
    committeeActor = app.adminReview?.reviewedBy || 'Komite Pembiayaan';
    committeeDate = app.adminReview?.reviewedAt ? new Date(app.adminReview.reviewedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : committeeDate;
  } else if (isAnalystRevisionToBm) {
    committeeStatus = 'revision';
    committeeStatusLabel = 'Revisi Analis ke BM';
    committeeSubtitle = app.analystCheck?.notes || 'Analis meminta revisi ke Pimpinan Cabang';
    committeeActor = app.analystCheck?.checkedBy || 'Analis Kredit';
    committeeDate = app.analystCheck?.checkedAt ? new Date(app.analystCheck.checkedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : committeeDate;
  } else if (isBmRevision) {
    committeeStatus = 'revision';
    committeeStatusLabel = 'Perlu Revisi Survey';
    committeeSubtitle = app.branchValidation?.revisiNotes || app.branchValidation?.notes || 'Perbaikan data lapangan';
    committeeActor = app.branchValidation?.validatedBy || 'Branch Manager';
    committeeDate = app.branchValidation?.validatedAt ? new Date(app.branchValidation.validatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : committeeDate;
  } else if (isBmValid && isAnalystScheduled) {
    committeeStatus = 'in_progress';
    committeeStatusLabel = 'Terjadwal Sidang Komite';
    committeeSubtitle = app.riskVerification
      ? `${app.analystCheck?.committeeSchedule?.noAgenda || 'Komite'} · ${app.riskVerification.status === 'verified' ? '✓ Verifikasi Risk' : '! Koreksi Risk'}`
      : `${app.analystCheck?.committeeSchedule?.noAgenda || 'Komite'} · Menunggu Verifikasi Risk`;
    committeeActor = app.analystCheck?.checkedBy || 'Komite & Analis Kredit';
    committeeDate = app.analystCheck?.committeeSchedule?.waktuSidang
      ? new Date(app.analystCheck.committeeSchedule.waktuSidang).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      : committeeDate;
  } else if (isBmValid) {
    committeeStatus = 'in_progress';
    committeeStatusLabel = 'Cek & Jadwal Analis';
    committeeSubtitle = 'BM Cabang Valid · Pemeriksaan & Penjadwalan Analis';
    committeeActor = 'Analis Kredit';
  }

  // 3. Stage 3: Disbursement (Akad Notaris & Realisasi Pencairan Agunan)
  const hasDisbursementOrder = Boolean(app.disbursementInstruction);
  const hasDisbursementExecution = Boolean(app.disbursementExecution);

  let disbursementStatus: StageItem['status'] = 'pending';
  let disbursementStatusLabel = 'Menunggu Putusan';
  let disbursementSubtitle = 'Terkunci sebelum putusan komite';
  let disbursementMetric = undefined;
  let disbursementActor = undefined;
  let disbursementDate = undefined;

  if (isCommitteeRejected || isBmRejected) {
    disbursementStatus = 'pending';
    disbursementStatusLabel = 'Dibatalkan (Komite Tolak)';
    disbursementSubtitle = 'Tidak dapat dicairkan';
  } else if (!isCommitteeApproved) {
    disbursementStatus = 'pending';
    disbursementStatusLabel = 'Belum Mulai';
    disbursementSubtitle = 'Menunggu putusan sidang komite';
  } else if (hasDisbursementExecution) {
    disbursementStatus = 'completed';
    disbursementStatusLabel = 'Akad & Cair Selesai';
    const cairNominal = app.disbursementExecution?.nominalDicairkan || 0;
    disbursementMetric = `Cair: Rp ${cairNominal.toLocaleString('id-ID')}`;
    disbursementSubtitle = `Akad: ${app.disbursementExecution?.nomorAkad || '-'} (${app.disbursementExecution?.metodePencairan || 'Transfer'})`;
    disbursementActor = app.disbursementExecution?.disbursedBy || 'Admin Cabang';
    disbursementDate = app.disbursementExecution?.tanggalPencairan || (app.disbursementExecution?.disbursedAt ? new Date(app.disbursementExecution.disbursedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : undefined);
  } else if (hasDisbursementOrder) {
    disbursementStatus = 'in_progress';
    disbursementStatusLabel = 'Instruksi Komite Siap';
    disbursementSubtitle = `Pengikatan ${app.disbursementInstruction?.jenisPengikatan || 'Agunan'} · ${app.disbursementInstruction?.notarisPpats || 'Notaris'}`;
    disbursementActor = 'Admin Cabang';
  } else {
    disbursementStatus = 'in_progress';
    disbursementStatusLabel = 'Menunggu Administrasi';
    disbursementSubtitle = 'Berkas diteruskan ke Admin Cabang';
    disbursementActor = 'Admin Cabang';
  }

  // 4. Stage 4: Final Validation (Validasi Realisasi Pencairan oleh Branch Manager)
  const isDisbursementValidated = app.disbursementExecution?.status === 'validated' || app.disbursementExecution?.bmValidation?.status === 'valid';
  const isDisbursementRevision = app.disbursementExecution?.status === 'revision' || app.disbursementExecution?.bmValidation?.status === 'revision';

  let validationStatus: StageItem['status'] = 'pending';
  let validationStatusLabel = 'Tahap Terakhir';
  let validationSubtitle = 'Menunggu realisasi pencairan';
  let validationMetric = undefined;
  let validationActor = undefined;
  let validationDate = undefined;

  if (isCommitteeRejected || isBmRejected) {
    validationStatus = 'pending';
    validationStatusLabel = 'Tidak Diproses';
    validationSubtitle = 'Pembiayaan ditolak';
  } else if (!hasDisbursementExecution) {
    validationStatus = 'pending';
    validationStatusLabel = 'Belum Mulai';
    validationSubtitle = 'Menunggu upload akad & bukti transfer';
  } else if (isDisbursementValidated) {
    validationStatus = 'completed';
    validationStatusLabel = 'Dana Cair Sempurna';
    validationSubtitle = 'Tervalidasi BM · Berkas Resmi Ditutup';
    validationMetric = 'Status: Sah & Lunas Administrasi';
    validationActor = app.disbursementExecution?.bmValidation?.validatedBy || `Branch Manager ${app.cabang}`;
    validationDate = app.disbursementExecution?.bmValidation?.validatedAt ? new Date(app.disbursementExecution.bmValidation.validatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : undefined;
  } else if (isDisbursementRevision) {
    validationStatus = 'revision';
    validationStatusLabel = 'Perlu Revisi Akad';
    validationSubtitle = app.disbursementExecution?.bmValidation?.notes || 'Perbaikan dokumen pencairan';
    validationActor = app.disbursementExecution?.bmValidation?.validatedBy || 'Branch Manager';
    validationDate = app.disbursementExecution?.bmValidation?.validatedAt ? new Date(app.disbursementExecution.bmValidation.validatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : undefined;
  } else {
    validationStatus = 'in_progress';
    validationStatusLabel = 'Menunggu Validasi BM';
    validationSubtitle = 'Bukti akad & transfer telah diinput Admin Cabang';
    validationActor = `Branch Manager (${app.cabang})`;
  }

  // Helper for color styles based on status
  const getTheme = (status: StageItem['status']) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-emerald-950/40 hover:bg-emerald-950/60',
          border: 'border-emerald-500/40',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
          circleBg: 'bg-emerald-600',
          circleBorder: 'border-emerald-400',
          circleText: 'text-white',
        };
      case 'in_progress':
        return {
          bg: 'bg-sky-950/40 hover:bg-sky-950/60',
          border: 'border-sky-500/40',
          text: 'text-sky-400',
          dot: 'bg-sky-400 animate-pulse',
          circleBg: 'bg-sky-600 animate-pulse',
          circleBorder: 'border-sky-400',
          circleText: 'text-white',
        };
      case 'revision':
        return {
          bg: 'bg-amber-950/40 hover:bg-amber-950/60',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          dot: 'bg-amber-400 animate-bounce',
          circleBg: 'bg-amber-600',
          circleBorder: 'border-amber-400',
          circleText: 'text-white',
        };
      case 'rejected':
        return {
          bg: 'bg-rose-950/40 hover:bg-rose-950/60',
          border: 'border-rose-500/40',
          text: 'text-rose-400',
          dot: 'bg-rose-400',
          circleBg: 'bg-rose-600',
          circleBorder: 'border-rose-400',
          circleText: 'text-white',
        };
      case 'pending':
      default:
        return {
          bg: 'bg-slate-900/60 hover:bg-slate-900',
          border: 'border-slate-800',
          text: 'text-slate-400',
          dot: 'bg-slate-600',
          circleBg: 'bg-slate-800',
          circleBorder: 'border-slate-700',
          circleText: 'text-slate-400',
        };
    }
  };

  const stages: StageItem[] = [
    {
      key: 'surveying',
      stepNumber: 1,
      title: 'Surveying',
      shortTitle: 'Survey Lapangan',
      subtitle: `${app.checklistAnswers.length} Parameter 5C & Geotagging`,
      status: 'completed',
      statusLabel: 'Survey Selesai',
      targetTab: 'overview',
      icon: ClipboardCheck,
      actor: app.marketingName,
      actorRole: 'Account Officer',
      date: surveyDate,
      primaryMetric: `Skor: ${surveyScore}/100 (${surveyGrade})`,
      badgeTheme: getTheme('completed'),
    },
    {
      key: 'committee',
      stepNumber: 2,
      title: 'Committee Review',
      shortTitle: 'Sidang Komite',
      subtitle: committeeSubtitle,
      status: committeeStatus,
      statusLabel: committeeStatusLabel,
      targetTab: 'review',
      icon: Gavel,
      actor: committeeActor,
      actorRole: isBmValid ? 'Komite Pembiayaan' : 'Branch Manager',
      date: committeeDate,
      primaryMetric: committeeMetric,
      badgeTheme: getTheme(committeeStatus),
    },
    {
      key: 'disbursement',
      stepNumber: 3,
      title: 'Disbursement',
      shortTitle: 'Pencairan Agunan',
      subtitle: disbursementSubtitle,
      status: disbursementStatus,
      statusLabel: disbursementStatusLabel,
      targetTab: 'disbursement',
      icon: Banknote,
      actor: disbursementActor,
      actorRole: hasDisbursementExecution ? 'Admin Cabang' : undefined,
      date: disbursementDate,
      primaryMetric: disbursementMetric,
      badgeTheme: getTheme(disbursementStatus),
    },
    {
      key: 'validation',
      stepNumber: 4,
      title: 'Final Validation',
      shortTitle: 'Validasi Akhir BM',
      subtitle: validationSubtitle,
      status: validationStatus,
      statusLabel: validationStatusLabel,
      targetTab: 'disbursement',
      icon: ShieldCheck,
      actor: validationActor,
      actorRole: isDisbursementValidated ? 'Branch Manager' : undefined,
      date: validationDate,
      primaryMetric: validationMetric,
      badgeTheme: getTheme(validationStatus),
    },
  ];

  // Calculate overall progress percentage
  let completedCount = 0;
  if (isSurveyCompleted) completedCount += 1;
  if (committeeStatus === 'completed') completedCount += 1;
  if (disbursementStatus === 'completed') completedCount += 1;
  if (validationStatus === 'completed') completedCount += 1;

  const progressPercentage = Math.round((completedCount / 4) * 100);

  // Overall workflow headline
  let currentStageText = 'Tahap 1/4: Survey Lapangan AO';
  if (validationStatus === 'completed') {
    currentStageText = 'Tahap Selesai: Pembiayaan Dicairkan & Ditutup';
  } else if (validationStatus === 'in_progress' || validationStatus === 'revision') {
    currentStageText = 'Tahap 4/4: Validasi Pencairan oleh Branch Manager';
  } else if (disbursementStatus === 'completed' || disbursementStatus === 'in_progress') {
    currentStageText = 'Tahap 3/4: Realisasi Pencairan & Pengikatan Notaris';
  } else if (committeeStatus === 'rejected') {
    currentStageText = 'Tahap Berhenti: Pembiayaan Ditolak Komite';
  } else if (committeeStatus === 'completed' || committeeStatus === 'in_progress' || committeeStatus === 'revision') {
    currentStageText = 'Tahap 2/4: Supervisi & Sidang Komite Pembiayaan';
  }

  return (
    <div className={`border-b border-slate-800 bg-slate-950/70 p-4 sm:px-6 sm:py-4.5 ${className}`}>
      {/* Top Bar: Headline & Overall Progress Meter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Alur Tahapan Berkas (Workflow Tracker)
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-200">
                {progressPercentage}% Progres
              </span>
            </div>
            <p className="text-xs font-semibold text-white mt-0.5 flex items-center gap-1.5">
              <span>{currentStageText}</span>
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="flex items-center gap-2 w-full sm:w-56 shrink-0">
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                committeeStatus === 'rejected'
                  ? 'bg-rose-500'
                  : progressPercentage === 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500'
              }`}
              style={{ width: `${committeeStatus === 'rejected' ? 50 : progressPercentage}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 shrink-0 font-bold">
            {completedCount}/4 Tahap
          </span>
        </div>
      </div>

      {/* The 4 Connected Progress Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelectedTab =
            (stage.key === 'surveying' && (activeTab === 'overview' || activeTab === 'checklist' || activeTab === 'financial' || activeTab === 'evidence')) ||
            (stage.key === 'committee' && activeTab === 'review') ||
            (stage.key === 'disbursement' && activeTab === 'disbursement') ||
            (stage.key === 'validation' && activeTab === 'disbursement');

          return (
            <div
              key={stage.key}
              onClick={() => onSelectStage && onSelectStage(stage.targetTab)}
              className={`group relative rounded-xl border p-3 transition-all cursor-pointer flex flex-col justify-between ${
                stage.badgeTheme.bg
              } ${
                isSelectedTab
                  ? 'border-emerald-400 ring-1 ring-emerald-400/30 shadow-md shadow-emerald-950/40'
                  : stage.badgeTheme.border
              }`}
              title={`Klik untuk melihat detail tahap ${stage.title} (${stage.targetTab})`}
            >
              {/* Card Top: Step Indicator & Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border font-bold text-xs shrink-0 ${stage.badgeTheme.circleBg} ${stage.badgeTheme.circleBorder} ${stage.badgeTheme.circleText}`}
                  >
                    {stage.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : stage.status === 'rejected' ? (
                      <XCircle className="h-4 w-4" />
                    ) : stage.status === 'revision' ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : stage.status === 'in_progress' ? (
                      <Clock className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 opacity-60" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 leading-none block">
                      Tahap {stage.stepNumber}
                    </span>
                    <h4 className="text-xs font-bold text-white leading-tight mt-0.5 group-hover:text-emerald-300 transition-colors">
                      {stage.title}
                    </h4>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                    stage.status === 'completed'
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                      : stage.status === 'in_progress'
                      ? 'bg-sky-950/80 border-sky-500/40 text-sky-300'
                      : stage.status === 'revision'
                      ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                      : stage.status === 'rejected'
                      ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${stage.badgeTheme.dot}`} />
                  <span className="truncate max-w-[85px]">{stage.statusLabel}</span>
                </span>
              </div>

              {/* Card Middle: Subtitle / Current State Description */}
              <div className="space-y-1 mb-2.5">
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                  {stage.subtitle}
                </p>
                {stage.primaryMetric && (
                  <div className="inline-block px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono font-bold text-emerald-400">
                    {stage.primaryMetric}
                  </div>
                )}
              </div>

              {/* Card Bottom: Actor & Date Meta */}
              <div className="border-t border-slate-800/70 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <div className="flex items-center gap-1 truncate max-w-[70%]">
                  <User className="h-3 w-3 text-slate-500 shrink-0" />
                  <span className="truncate text-slate-300">
                    {stage.actor || 'Menunggu'}
                  </span>
                </div>
                {stage.date ? (
                  <div className="flex items-center gap-1 shrink-0 text-slate-400">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>{stage.date}</span>
                  </div>
                ) : (
                  <span className="text-slate-500 text-[9px] group-hover:text-emerald-400 transition-colors flex items-center gap-0.5">
                    Buka Tab <ArrowRight className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>

              {/* Active Indicator Accent Line */}
              {isSelectedTab && (
                <div className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-emerald-400 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
