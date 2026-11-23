import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import { exportApplicationsToExcel } from '../utils/exportUtils';
import { ApplicationProgressTracker } from './ApplicationProgressTracker';
import { RiskVerificationStatus } from '../types';
import {
  X,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  User,
  Building,
  DollarSign,
  Camera,
  MapPin,
  ClipboardList,
  Shield,
  HelpCircle,
  CreditCard,
  FileText,
  Gavel,
  Flag,
  MessageSquare,
  Send,
  Banknote,
  Scale,
  Landmark,
  Receipt,
  ZoomIn,
  Clock,
  ShieldCheck,
  BadgeCheck,
  Lock,
  Calendar,
} from 'lucide-react';

export const SurveyDetailModal: React.FC = () => {
  const {
    selectedApplication,
    isDetailModalOpen,
    setIsDetailModalOpen,
    currentUser,
    reviewApplication,
    printApplicationReport,
    setActiveTab: setMainActiveTab,
    addManagementNote,
    verifyApplicationByRiskManagement,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'financial' | 'evidence' | 'review' | 'disbursement'>('overview');
  const [modalPreviewImage, setModalPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Management Note & Attention State
  const [isEditingManagementNote, setIsEditingManagementNote] = useState(false);
  const [managementNoteInput, setManagementNoteInput] = useState('');
  const [managementAttentionInput, setManagementAttentionInput] = useState(true);

  // Risk Management Verification State
  const [riskVerificationStatus, setRiskVerificationStatus] = useState<RiskVerificationStatus>('verified');
  const [riskVerificationNotes, setRiskVerificationNotes] = useState('');

  // Review Form State
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'conditional_approval' | 'need_reverification'>('approved');
  const [approvedPlafon, setApprovedPlafon] = useState<number>(0);
  const [approvedTenor, setApprovedTenor] = useState<number>(12);
  const [reviewNotes, setReviewNotes] = useState('');
  const [signatureName, setSignatureName] = useState(currentUser.name);

  // Initialize review & management inputs when application is selected
  React.useEffect(() => {
    if (selectedApplication) {
      if (selectedApplication.managementNote) {
        setManagementNoteInput(selectedApplication.managementNote.notes);
        setManagementAttentionInput(selectedApplication.managementNote.isAttention);
      } else {
        setManagementNoteInput('');
        setManagementAttentionInput(true);
      }
      setIsEditingManagementNote(false);

      if (selectedApplication.riskVerification) {
        setRiskVerificationStatus(selectedApplication.riskVerification.status);
        setRiskVerificationNotes(selectedApplication.riskVerification.notes);
      } else {
        setRiskVerificationStatus('verified');
        setRiskVerificationNotes('');
      }

      if (selectedApplication.adminReview) {
        setDecision(selectedApplication.adminReview.decision);
        setApprovedPlafon(selectedApplication.adminReview.approvedPlafon);
        setApprovedTenor(selectedApplication.adminReview.approvedTenor);
        setReviewNotes(selectedApplication.adminReview.notes);
        setSignatureName(selectedApplication.adminReview.signatureName || currentUser.name);
      } else {
        setApprovedPlafon(selectedApplication.scoring.plafonDisarankan || selectedApplication.financial.plafonDiajukan);
        setApprovedTenor(selectedApplication.scoring.tenorDisarankan || selectedApplication.financial.tenorBulanDiajukan);
        setReviewNotes(selectedApplication.scoring.summaryRemarks);
        setSignatureName(currentUser.name);
        setDecision(
          selectedApplication.scoring.recommendation === 'SETUJUI_PENUH'
            ? 'approved'
            : selectedApplication.scoring.recommendation === 'SETUJUI_DENGAN_SYARAT'
            ? 'conditional_approval'
            : selectedApplication.scoring.recommendation === 'TINJAUAN_KOMITE'
            ? 'conditional_approval'
            : 'rejected'
        );
      }
    }
  }, [selectedApplication, currentUser]);

  if (!isDetailModalOpen || !selectedApplication) return null;

  const app = selectedApplication;

  // Account Officer Ownership Guard: AO cannot view other surveyors' applications
  if (
    currentUser.role === 'marketing' &&
    app.marketingId !== currentUser.id &&
    app.marketingName !== currentUser.name
  ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
        <div className="rounded-2xl border border-rose-500/40 bg-slate-900 p-6 max-w-md w-full text-center shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-400 mx-auto mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Akses Berkas Dibatasi</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Sebagai Account Officer, Anda hanya memiliki hak akses untuk membuka dan memeriksa berkas pengajuan survey yang Anda tangani sendiri ({currentUser.name} · {currentUser.branch}).
          </p>
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="mt-5 w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
          >
            Tutup & Kembali
          </button>
        </div>
      </div>
    );
  }

  // Branch Manager Scope Guard: BM can only view applications in their same branch
  if (
    currentUser.role === 'branch_manager' &&
    app.cabang.toLowerCase() !== currentUser.branch.toLowerCase()
  ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
        <div className="rounded-2xl border border-rose-500/40 bg-slate-900 p-6 max-w-md w-full text-center shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-400 mx-auto mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Di Luar Kewenangan Kantor Cabang</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Anda login sebagai Branch Manager <strong className="text-white">{currentUser.branch}</strong>. Berkas survey ini terdaftar di wilayah supervisi <strong className="text-white">{app.cabang}</strong>.
          </p>
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="mt-5 w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
          >
            Tutup & Kembali
          </button>
        </div>
      </div>
    );
  }

  // Komite & Analis Guard: Before BM gives validation, survey MUST NOT appear in Committee & Credit Analyst!
  if (
    currentUser.role === 'admin' &&
    app.branchValidation?.status !== 'valid' &&
    app.analystCheck?.status !== 'revision_to_bm'
  ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
        <div className="rounded-2xl border border-amber-500/40 bg-slate-900 p-6 max-w-md w-full text-center shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-400 mx-auto mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Menunggu Validasi Branch Manager</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Berkas survey <strong className="text-white">{app.applicationNumber}</strong> ({app.namaDebitur}) dari <strong className="text-white">{app.cabang}</strong> belum divalidasi oleh Branch Manager setempat.
          </p>
          <p className="text-[11px] text-amber-400/90 mt-2 bg-amber-950/60 p-2.5 rounded-lg border border-amber-500/20">
            Sesuai Standard Operating Procedure (SOP), user Komite Pembiayaan & Analis Kredit hanya dapat membuka dan menyidangkan berkas yang telah mengantongi validasi sah dari Kepala Cabang.
          </p>
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="mt-5 w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
          >
            Tutup & Kembali
          </button>
        </div>
      </div>
    );
  }

  const answerMap = new Map(app.checklistAnswers.map((a) => [a.questionId, a]));

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    reviewApplication(app.id, {
      reviewedBy: currentUser.name,
      reviewerId: currentUser.id,
      reviewedAt: new Date().toISOString(),
      decision,
      approvedPlafon,
      approvedTenor,
      notes: reviewNotes,
      signatureName,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={() => setIsDetailModalOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-800/50 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {app.applicationNumber}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {app.namaDebitur}
              </h2>
              <span className="text-xs text-slate-400">· {app.jenisUsaha}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Surveyor: <span className="text-slate-300 font-medium">{app.marketingName}</span> · Cabang: {app.cabang} · Tanggal: {new Date(app.createdAt).toLocaleDateString('id-ID')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(currentUser.role === 'branch_manager' || currentUser.role === 'super_admin') && (
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setMainActiveTab('branch_workspace');
                }}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 transition-colors"
                title="Buka Workspace Branch Manager untuk Validasi"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Validasi Cabang</span>
              </button>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setMainActiveTab('committee');
                }}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
                title="Buka Ruang Sidang Komite untuk Berkas Ini"
              >
                <Gavel className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Sidang Komite</span>
              </button>
            )}

            {(currentUser.role === 'risk_management' || currentUser.role === 'super_admin') && (
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setMainActiveTab('risk_workspace');
                }}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/60 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 transition-colors"
                title="Buka Workspace Verifikasi Manajemen Risiko"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Verifikasi Risiko</span>
              </button>
            )}

            <button
              onClick={() => printApplicationReport(app)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Cetak PDF</span>
            </button>

            <button
              onClick={() => exportApplicationsToExcel([app], `Credit_Scoring_${app.applicationNumber}.xlsx`)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Ekspor Excel</span>
            </button>

            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Visual Workflow Progress Tracker across 4 stages */}
        <ApplicationProgressTracker
          application={app}
          activeTab={activeTab}
          onSelectStage={(stageTab) => setActiveTab(stageTab)}
        />

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 text-xs font-medium shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Ringkasan & Skor 5C
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Checklist 68 Parameter ({app.checklistAnswers.length})
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'financial'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Kapasitas Kas & Agunan
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Bukti Foto & Geotagging
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'review'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-amber-400 hover:text-amber-300 font-semibold'
            }`}
          >
            Keputusan Komite Kredit / Admin
          </button>
          <button
            onClick={() => setActiveTab('disbursement')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'disbursement'
                ? 'border-teal-400 text-teal-400 font-bold'
                : 'border-transparent text-teal-400/80 hover:text-teal-300 font-semibold'
            }`}
          >
            <Banknote className="h-3.5 w-3.5" />
            <span>Pencairan & Notaris</span>
            {app.disbursementExecution?.status === 'validated' && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Catatan & Tanda Perhatian Dewan Manajemen Card */}
              {(app.managementNote || currentUser.role === 'management' || currentUser.role === 'super_admin') && (
                <div
                  className={`rounded-xl border p-4 text-xs transition-all ${
                    app.managementNote?.isAttention
                      ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-white mb-2">
                    <span className="flex items-center gap-2">
                      <Flag className={`h-4 w-4 ${app.managementNote?.isAttention ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span>Catatan & Atensi Dewan Manajemen:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {app.managementNote?.isAttention && (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                          Tanda Perhatian Khusus
                        </span>
                      )}
                      {(currentUser.role === 'management' || currentUser.role === 'super_admin') && !isEditingManagementNote && (
                        <button
                          onClick={() => {
                            setManagementNoteInput(app.managementNote?.notes || '');
                            setManagementAttentionInput(app.managementNote?.isAttention ?? true);
                            setIsEditingManagementNote(true);
                          }}
                          className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors"
                        >
                          {app.managementNote ? 'Ubah Catatan' : '+ Beri Catatan / Atensi'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingManagementNote ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addManagementNote(app.id, managementNoteInput, managementAttentionInput);
                        setIsEditingManagementNote(false);
                      }}
                      className="mt-3 space-y-3 pt-3 border-t border-slate-800"
                    >
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Tuliskan Catatan Supervisi Eksekutif:
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={managementNoteInput}
                          onChange={(e) => setManagementNoteInput(e.target.value)}
                          placeholder="Tuliskan arahan, perhatian risiko, atau instruksi tindak lanjut..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="detailAttentionToggle"
                          checked={managementAttentionInput}
                          onChange={(e) => setManagementAttentionInput(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                        />
                        <label htmlFor="detailAttentionToggle" className="text-xs text-amber-300 font-semibold cursor-pointer select-none">
                          Beri Tanda Perhatian Khusus (Kirim Notifikasi Instan ke Branch Manager & Analis)
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingManagementNote(false)}
                          className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors"
                        >
                          <Send className="h-3 w-3" />
                          <span>Simpan & Kirim Notifikasi</span>
                        </button>
                      </div>
                    </form>
                  ) : app.managementNote ? (
                    <div className="mt-2 text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <p className="italic text-white">"{app.managementNote.notes}"</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
                        <span>Oleh: <strong className="text-amber-300">{app.managementNote.notedBy}</strong> (Dewan Manajemen)</span>
                        <span>{new Date(app.managementNote.notedAt).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Belum ada catatan khusus dari Dewan Manajemen untuk berkas ini.
                    </p>
                  )}
                </div>
              )}

              {/* Branch Manager Validation Status Card */}
              {app.branchValidation ? (
                <div
                  className={`rounded-xl border p-4 text-xs ${
                    app.branchValidation.status === 'valid'
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                      : app.branchValidation.status === 'revision'
                      ? 'border-sky-500/30 bg-sky-950/20 text-sky-200'
                      : app.branchValidation.status === 'rejected'
                      ? 'border-rose-500/30 bg-rose-950/20 text-rose-200'
                      : 'border-amber-500/30 bg-amber-950/20 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-white mb-1">
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-indigo-400" />
                      <span>Status Validasi Branch Manager ({app.cabang}):</span>
                    </span>
                    <span
                      className={`font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                        app.branchValidation.status === 'valid'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : app.branchValidation.status === 'revision'
                          ? 'bg-sky-950 text-sky-300 border border-sky-500/30'
                          : app.branchValidation.status === 'rejected'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {app.branchValidation.status === 'valid'
                        ? 'Valid (Diteruskan ke Komite & Analis)'
                        : app.branchValidation.status === 'revision'
                        ? 'Revisi Diminta ke AO'
                        : app.branchValidation.status === 'rejected'
                        ? 'Ditolak di Cabang'
                        : 'Menunggu Validasi Branch Manager'}
                    </span>
                  </div>

                  {app.branchValidation.notes ? (
                    <div className="mt-2 text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <p className="font-semibold text-white">Catatan Kepala Cabang ({app.branchValidation.validatedBy}):</p>
                      <p className="mt-0.5">"{app.branchValidation.notes}"</p>
                      {app.branchValidation.revisiNotes && (
                        <p className="mt-1 text-sky-300">
                          <strong>Catatan Revisi:</strong> {app.branchValidation.revisiNotes}
                        </p>
                      )}
                      {app.branchValidation.rekomendasiPlafonBM && app.branchValidation.rekomendasiPlafonBM > 0 && (
                        <p className="mt-1 font-mono text-emerald-400 font-bold">
                          Rekomendasi Plafon BM: Rp {app.branchValidation.rekomendasiPlafonBM.toLocaleString('id-ID')} · Tenor: {app.branchValidation.rekomendasiTenorBM || 12} Bulan
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Berkas baru diajukan oleh AO dan sedang menunggu verifikasi supervisi oleh Kepala Cabang setempat.
                    </p>
                  )}
                </div>
              ) : null}

              {/* Risk Management Verification Status Card (Overview Tab) */}
              {(app.riskVerification || app.adminReview) && (
                <div
                  className={`rounded-xl border p-4 text-xs ${
                    app.riskVerification?.status === 'verified'
                      ? 'border-cyan-500/40 bg-cyan-950/25 text-cyan-100'
                      : app.riskVerification?.status === 'need_correction'
                      ? 'border-amber-500/40 bg-amber-950/25 text-amber-100'
                      : 'border-dashed border-cyan-500/30 bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-white mb-1">
                    <span className="flex items-center gap-1.5">
                      <BadgeCheck className="h-4 w-4 text-cyan-400" />
                      <span>Verifikasi &amp; Koreksi Manajemen Risiko:</span>
                    </span>
                    {app.riskVerification ? (
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                          app.riskVerification.status === 'verified'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {app.riskVerification.status === 'verified'
                          ? `✓ TERVERIFIKASI (${app.riskVerification.verificationCode})`
                          : `! KOREKSI RISIKO (${app.riskVerification.verificationCode})`}
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-cyan-500/30">
                        Menunggu Verifikasi Manajemen Risiko
                      </span>
                    )}
                  </div>
                  {app.riskVerification ? (
                    <div className="mt-2 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <p className="text-slate-200 italic">&ldquo;{app.riskVerification.notes}&rdquo;</p>
                      <p className="text-[10px] text-slate-400">
                        Diverifikasi oleh <strong className="text-white">{app.riskVerification.verifiedBy}</strong> ·{' '}
                        {new Date(app.riskVerification.verifiedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Berkas telah diproses Analis Komite. Menunggu pemeriksaan ulang dan tanda verifikasi dari Divisi Manajemen Risiko.
                    </p>
                  )}
                </div>
              )}

              {/* Score Headline Card */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-700">
                      <span className="font-mono text-2xl font-black text-emerald-400 tabular-nums">
                        {app.scoring.totalScore}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Total Skor Kelayakan Kredit
                      </p>
                      <h3 className="text-lg font-bold text-white">
                        {app.scoring.ratingGrade}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Rekomendasi:{' '}
                        <span className="font-semibold text-emerald-400">
                          {app.scoring.recommendation === 'SETUJUI_PENUH'
                            ? 'Disetujui Penuh'
                            : app.scoring.recommendation === 'SETUJUI_DENGAN_SYARAT'
                            ? 'Disetujui Bersyarat'
                            : app.scoring.recommendation === 'TINJAUAN_KOMITE'
                            ? 'Tinjauan Khusus Komite'
                            : 'Ditolak'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-700 sm:pl-6">
                    <p className="text-xs text-slate-400">Plafon Disarankan</p>
                    <p className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
                      Rp {app.scoring.plafonDisarankan.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tenor optimal: <span className="font-mono text-slate-200">{app.scoring.tenorDisarankan} Bulan</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/60">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-white">Analisis Sistem: </span>
                    {app.scoring.summaryRemarks}
                  </p>
                </div>
              </div>

              {/* 5C Dimensions Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Character</p>
                  <p className="font-mono text-xl font-bold text-emerald-400 mt-1 tabular-nums">
                    {app.scoring.characterScore}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Bobot 25%</p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Capacity</p>
                  <p className="font-mono text-xl font-bold text-sky-400 mt-1 tabular-nums">
                    {app.scoring.capacityScore}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Bobot 30%</p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Capital</p>
                  <p className="font-mono text-xl font-bold text-indigo-400 mt-1 tabular-nums">
                    {app.scoring.capitalScore}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Bobot 15%</p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Collateral</p>
                  <p className="font-mono text-xl font-bold text-amber-400 mt-1 tabular-nums">
                    {app.scoring.collateralScore}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Bobot 15%</p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center col-span-2 sm:col-span-1">
                  <p className="text-[11px] text-slate-400 font-medium">Condition</p>
                  <p className="font-mono text-xl font-bold text-teal-400 mt-1 tabular-nums">
                    {app.scoring.conditionScore}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Bobot 15%</p>
                </div>
              </div>

              {/* Strengths & Key Risks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kekuatan Kredit */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Kekuatan Kredit Teridentifikasi</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {app.scoring.kekuatanKredit.map((k, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">·</span>
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risiko Kunci & Mitigasi */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Risiko Kunci & Mitigasi yang Disarankan</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {app.scoring.mitigasiUtama.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">·</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Status & Review Summary */}
              {app.adminReview && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4">
                  <div className="flex items-center justify-between border-b border-sky-500/20 pb-2 mb-2">
                    <h4 className="text-xs font-bold text-sky-300">Catatan Resmi Komite Pembiayaan</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(app.adminReview.reviewedAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{app.adminReview.notes}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Plafon Disetujui: <strong className="text-white font-mono">Rp {app.adminReview.approvedPlafon.toLocaleString('id-ID')}</strong> ({app.adminReview.approvedTenor} Bulan)
                    </span>
                    <span>Reviewer: <strong className="text-white">{app.adminReview.reviewedBy}</strong></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHECKLIST 68 PERTANYAAN */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Daftar lengkap 68 butir checklist survey marketing terintegrasi credit scoring sesuai dokumen acuan:
              </p>
              <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                {SURVEY_QUESTIONS.map((q) => {
                  const ans = answerMap.get(q.id);
                  const status = ans?.status || 'sesuai';
                  return (
                    <div key={q.id} className="p-3.5 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-slate-400 font-bold">#{q.id}</span>
                            <span className="font-mono text-[11px] text-emerald-400">[{q.code}]</span>
                            <span className="text-[10px] text-slate-500 uppercase">{q.category}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({q.dimension5C})</span>
                          </div>
                          <p className="text-xs font-medium text-white">{q.question}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Bukti / Evidence: {q.evidenceGuide}
                          </p>
                          {ans?.notes && (
                            <p className="text-[11px] text-emerald-300/90 mt-1 italic">
                              Catatan Lapangan: &quot;{ans.notes}&quot;
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {status === 'sesuai' ? (
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              Sesuai
                            </span>
                          ) : status === 'cukup' ? (
                            <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                              Cukup/Ragu
                            </span>
                          ) : status === 'tidak_sesuai' ? (
                            <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                              Tidak Sesuai
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              N/A
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIAL & COLLATERAL */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Skema Pembiayaan & Bagi Hasil Lembaga */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Skema Pengajuan Pembiayaan & Bagi Hasil (Basil)
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Margin Lembaga: {app.financial.persentaseBasil ?? 12}% p.a.
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Plafon Diajukan:</span>
                    <p className="text-sm font-bold font-mono text-white mt-0.5">
                      Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}
                    </p>
                    <span className="text-[10px] text-slate-500">Tenor: {app.financial.tenorBulanDiajukan} Bulan</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Bagi Hasil ({app.financial.persentaseBasil ?? 12}% p.a.):</span>
                    <p className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                      Rp {(app.financial.totalBagiHasil ?? Math.round(app.financial.plafonDiajukan * (((app.financial.persentaseBasil ?? 12) / 100) * (app.financial.tenorBulanDiajukan / 12)))).toLocaleString('id-ID')}
                    </p>
                    <span className="text-[10px] text-slate-500">Total Margin</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Pengembalian:</span>
                    <p className="text-sm font-bold font-mono text-sky-300 mt-0.5">
                      Rp {(app.financial.totalKewajiban ?? (app.financial.plafonDiajukan + (app.financial.totalBagiHasil ?? 0))).toLocaleString('id-ID')}
                    </p>
                    <span className="text-[10px] text-slate-500">Pokok + Bagi Hasil</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 font-semibold">Nominal Angsuran:</span>
                    <p className="text-base font-extrabold font-mono text-emerald-400 mt-0.5">
                      Rp {(app.financial.nominalAngsuran || app.financial.estimasiAngsuranDiajukan).toLocaleString('id-ID')}/bln
                    </p>
                    <span className="text-[10px] text-emerald-400/70">Kewajiban Angsuran</span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Analisis Kapasitas Keuangan Calon Debitur
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Omzet Bulanan:</span>
                    <p className="text-sm font-bold font-mono text-white mt-0.5">
                      Rp {app.financial.omzetBulanan.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">HPP & Biaya Usaha:</span>
                    <p className="text-sm font-bold font-mono text-rose-300 mt-0.5">
                      Rp {(app.financial.biayaHppUsaha + app.financial.biayaOperasionalUsaha).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Kebutuhan Rumah Tangga:</span>
                    <p className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                      Rp {app.financial.kebutuhanRumahTangga.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Angsuran Hutang Lain:</span>
                    <p className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                      Rp {app.financial.angsuranLainSaatIni.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Sisa Kas Bersih (Available):</span>
                    <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                      Rp {app.financial.availableCashflow.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Rasio Beban DSR:</span>
                    <p className={`text-sm font-bold font-mono mt-0.5 ${app.financial.dsrRatio <= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {app.financial.dsrRatio}%
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Stress Test (-20% Omzet):</span>
                    <p className={`text-sm font-bold font-mono mt-0.5 ${app.financial.stressTestCashflow >= 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                      Rp {app.financial.stressTestCashflow.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Sumber Pembayaran:</span>
                    <p className="text-xs text-white font-medium mt-0.5">
                      {app.financial.sumberPembayaran}
                    </p>
                  </div>
                </div>
              </div>

              {/* Collateral Summary & Multi-Agunan List */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Data Agunan & Taksasi Pasar ({app.collaterals?.length || 1} Agunan Terdaftar)
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Rasio LTV:</span>
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        app.collateral.persentaseLtv <= 70
                          ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/30'
                          : 'text-amber-300 bg-amber-950/80 border border-amber-500/30'
                      }`}
                    >
                      {app.collateral.persentaseLtv}%
                    </span>
                  </div>
                </div>

                {/* Portfolio Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Total Taksasi Pasar:</span>
                    <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                      Rp {app.collateral.nilaiPasarTaksasi.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Total Likuidasi Cepat:</span>
                    <p className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                      Rp {app.collateral.nilaiLikuidasi.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Plafon Diajukan:</span>
                    <p className="text-sm font-bold font-mono text-white mt-0.5">
                      Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Kelebihan Agunan:</span>
                    <p className="text-sm font-bold font-mono text-sky-300 mt-0.5">
                      Rp {Math.max(0, app.collateral.nilaiPasarTaksasi - app.financial.plafonDiajukan).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Multi-Agunan Breakdown */}
                {app.collaterals && app.collaterals.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Rincian Dokumen & Fisik Setiap Agunan ({app.collaterals.length} Aset):
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {app.collaterals.map((c, idx) => (
                        <div
                          key={c.id || idx}
                          className="rounded-lg bg-slate-950/80 border border-slate-800 p-3.5 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span className="h-4 w-4 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] flex items-center justify-center font-mono">
                                {idx + 1}
                              </span>
                              <span>{c.jenisJaminan}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded">
                              LTV: {c.persentaseLtv}%
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-500 block text-[10px]">No. Dokumen:</span>
                              <span className="font-mono text-white font-medium">{c.nomorDokumen}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Atas Nama:</span>
                              <span className="text-white font-medium">{c.atasNama} ({c.hubunganPemilik})</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Taksasi Pasar:</span>
                              <span className="font-mono text-emerald-400 font-bold">
                                Rp {c.nilaiPasarTaksasi.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Nilai Likuidasi:</span>
                              <span className="font-mono text-slate-300 font-bold">
                                Rp {c.nilaiLikuidasi.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                            <strong>Kondisi:</strong> {c.keterangan}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
                    <div>
                      <span className="text-slate-400">Jenis Jaminan:</span>
                      <p className="text-sm font-bold text-white mt-0.5">{app.collateral.jenisJaminan}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Nomor Dokumen:</span>
                      <p className="text-sm font-mono text-white mt-0.5">{app.collateral.nomorDokumen}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Atas Nama:</span>
                      <p className="text-sm text-white mt-0.5">{app.collateral.atasNama} ({app.collateral.hubunganPemilik})</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Keterangan Fisik:</span>
                      <p className="text-xs text-slate-300 mt-0.5">{app.collateral.keterangan}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EVIDENCE & GEOTAGGING */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Dokumen KTP Debitur */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>KTP Calon Debitur</span>
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        app.evidence.fotoKtpStatus === 'fotocopy'
                          ? 'text-amber-300 bg-amber-950/80 border border-amber-500/30'
                          : 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/30'
                      }`}
                    >
                      {app.evidence.fotoKtpStatus === 'fotocopy' ? 'Fotocopy / Cetak' : 'e-KTP Fisik Asli'}
                    </span>
                  </div>
                  <div className="aspect-[1.58/1] w-full rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                    <img
                      src={app.evidence.fotoKtp || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80'}
                      alt="Foto KTP Asli"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {app.evidence.fotoKtpDeteksiInfo && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      Deteksi: {app.evidence.fotoKtpDeteksiInfo}
                    </p>
                  )}
                  {app.evidence.fotoKtpCatatanSurveyor && (
                    <div className="rounded bg-amber-950/30 border border-amber-500/30 p-2 text-[10px] text-amber-200">
                      <strong>Keterangan Surveyor:</strong> {app.evidence.fotoKtpCatatanSurveyor}
                    </div>
                  )}
                </div>

                {/* Dokumen KTP Pendamping (Istri jika menikah / Orang Tua jika belum menikah) */}
                {app.evidence.fotoKtpPendamping && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>
                          {app.evidence.fotoKtpPendampingLabel ||
                            (app.statusPernikahan === 'Menikah'
                              ? 'KTP Istri / Pasangan'
                              : app.statusPernikahan === 'Belum Menikah'
                              ? 'KTP Orang Tua'
                              : 'KTP Penjamin')}
                        </span>
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          app.evidence.fotoKtpPendampingStatus === 'fotocopy'
                            ? 'text-amber-300 bg-amber-950/80 border border-amber-500/30'
                            : 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/30'
                        }`}
                      >
                        {app.evidence.fotoKtpPendampingStatus === 'fotocopy' ? 'Fotocopy / Cetak' : 'e-KTP Fisik Asli'}
                      </span>
                    </div>
                    <div className="aspect-[1.58/1] w-full rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                      <img
                        src={app.evidence.fotoKtpPendamping}
                        alt="Foto KTP Pendamping"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {app.evidence.fotoKtpPendampingDeteksiInfo && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        Deteksi: {app.evidence.fotoKtpPendampingDeteksiInfo}
                      </p>
                    )}
                    {app.evidence.fotoKtpPendampingCatatanSurveyor && (
                      <div className="rounded bg-amber-950/30 border border-amber-500/30 p-2 text-[10px] text-amber-200">
                        <strong>Keterangan Surveyor:</strong> {app.evidence.fotoKtpPendampingCatatanSurveyor}
                      </div>
                    )}
                  </div>
                )}

                {/* Bukti Pendapatan / Mutasi */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Bukti Penghasilan / Mutasi Kas</span>
                    </p>
                    <span className="text-[10px] text-sky-400 font-mono">Checklist #30</span>
                  </div>
                  <div className="aspect-4/3 w-full rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                    <img
                      src={app.evidence.fotoBuktiPenghasilan}
                      alt="Bukti Pendapatan"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Foto Debitur */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs font-semibold text-slate-300 mb-2">Foto Debitur di Lokasi</p>
                  <div className="aspect-4/3 w-full rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                    <img
                      src={app.evidence.fotoDebitur}
                      alt="Foto Debitur"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Foto Rumah/Usaha */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs font-semibold text-slate-300 mb-2">Foto Tempat Usaha / Domisili</p>
                  <div className="aspect-4/3 w-full rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                    <img
                      src={app.evidence.fotoRumahUsaha}
                      alt="Foto Rumah Usaha"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Foto Stok / Aset */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs font-semibold text-slate-300 mb-2">Foto Stok / Alat Usaha</p>
                  <div className="aspect-4/3 w-full rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                    <img
                      src={app.evidence.fotoStokAset}
                      alt="Foto Stok Aset"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold">
                  <MapPin className="h-4 w-4" />
                  <span>Informasi Geotagging & Timestamp Survey</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400">Koordinat GPS:</span>
                    <p className="font-mono text-white font-medium">{app.evidence.lokasiGps}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Alamat Digital:</span>
                    <p className="text-white font-medium">{app.evidence.alamatDigital}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Waktu Survey:</span>
                    <p className="font-mono text-white font-medium">{app.evidence.tanggalSurvey}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADMIN REVIEW ACTION FORM OR READ-ONLY VIEW */}
          {activeTab === 'review' && (
            <div className="space-y-6">
              {/* If user is Admin or Super Admin: show editable decision form */}
              {currentUser.role === 'admin' || currentUser.role === 'super_admin' ? (
                <form onSubmit={handleSaveReview} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white">
                      Form Keputusan Komite Pembiayaan (Admin Reviewer)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tambahkan catatan resmi, sesuaikan plafon/tenor, dan tentukan status keputusan pembiayaan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Keputusan Komite Kredit
                      </label>
                      <select
                        value={decision}
                        onChange={(e) => setDecision(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-semibold focus:border-emerald-500 focus:outline-hidden"
                      >
                        <option value="approved">Setujui Penuh (Approved)</option>
                        <option value="conditional_approval">Setujui Bersyarat (Conditional)</option>
                        <option value="need_reverification">Perlu Verifikasi Ulang</option>
                        <option value="rejected">Tolak Pengajuan (Rejected)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Plafon Disetujui (Rp)
                      </label>
                      <input
                        type="number"
                        step={500000}
                        value={approvedPlafon}
                        onChange={(e) => setApprovedPlafon(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Tenor Disetujui (Bulan)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={approvedTenor}
                        onChange={(e) => setApprovedTenor(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block text-slate-300 font-medium mb-1">
                      Catatan Resmi Komite / Alasan Keputusan / Syarat Mitigasi
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Tuliskan analisis komite, pertimbangan risiko, atau syarat dokumen pencairan..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Nama Pejabat Penandatangan</label>
                      <input
                        type="text"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Simpan Keputusan Review Komite</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* Read-Only Decision Card for Management, Marketing, Branch Manager */
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Gavel className="h-4 w-4 text-emerald-400" />
                        <span>Risalah Putusan Komite Pembiayaan</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {currentUser.role === 'management'
                          ? 'Mode Lihat Saja (Dewan Manajemen) - Hak akses untuk memantau tanpa wewenang mengubah keputusan komite.'
                          : 'Informasi hasil keputusan resmi sidang komite pembiayaan & analisa kredit.'}
                      </p>
                    </div>
                    {currentUser.role === 'management' && (
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                        Read-Only Manajemen
                      </span>
                    )}
                  </div>

                  {app.adminReview ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700/60">
                          <span className="text-[11px] text-slate-400 block">Status Keputusan</span>
                          <span className="text-xs font-bold uppercase text-emerald-400 mt-1 block">
                            {app.adminReview.decision === 'approved'
                              ? 'Disetujui Penuh'
                              : app.adminReview.decision === 'conditional_approval'
                              ? 'Disetujui Bersyarat'
                              : app.adminReview.decision === 'rejected'
                              ? 'Ditolak'
                              : 'Perlu Verifikasi Ulang'}
                          </span>
                        </div>

                        <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700/60">
                          <span className="text-[11px] text-slate-400 block">Plafon Disetujui</span>
                          <span className="text-xs font-mono font-bold text-white mt-1 block">
                            Rp {app.adminReview.approvedPlafon.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700/60">
                          <span className="text-[11px] text-slate-400 block">Tenor Disetujui</span>
                          <span className="text-xs font-mono font-bold text-white mt-1 block">
                            {app.adminReview.approvedTenor} Bulan
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/60 space-y-2">
                        <span className="text-[11px] font-semibold text-slate-300 block">
                          Catatan & Pertimbangan Komite:
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-900/60 p-3 rounded border border-slate-800">
                          "{app.adminReview.notes}"
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                        <span>
                          Ditetapkan Oleh: <strong className="text-white">{app.adminReview.reviewedBy}</strong> ({app.adminReview.signatureName || app.adminReview.reviewedBy})
                        </span>
                        <span>
                          Tanggal Putusan: <strong className="text-white">{new Date(app.adminReview.reviewedAt).toLocaleString('id-ID')}</strong>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <p className="text-xs">
                        Berkas ini belum disidangkan atau diputuskan oleh Komite Pembiayaan.
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Status berkas saat ini:{' '}
                        <strong className="text-amber-400 uppercase">{app.status}</strong>
                        {app.branchValidation?.status !== 'valid' && ' (Menunggu Validasi Branch Manager)'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pemeriksaan & Jadwal Sidang Komite Analis */}
              {app.analystCheck && (
                <div
                  className={`rounded-xl border p-4 space-y-2 text-xs ${
                    app.analystCheck.status === 'revision_to_bm'
                      ? 'border-rose-500/40 bg-rose-950/25'
                      : 'border-sky-500/35 bg-sky-950/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-sky-400" />
                      <span>
                        {app.analystCheck.status === 'revision_to_bm'
                          ? 'Permintaan Revisi Analis ke Pimpinan Cabang'
                          : 'Verifikasi Analis Kredit & Penjadwalan Sidang Komite'}
                      </span>
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                        app.analystCheck.status === 'verified_scheduled'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : app.analystCheck.status === 'revision_to_bm'
                          ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                          : 'bg-amber-950 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {app.analystCheck.status === 'verified_scheduled'
                        ? 'TERJADWAL KOMITE'
                        : app.analystCheck.status === 'revision_to_bm'
                        ? 'REVISI KE BM'
                        : 'SUDAH DIREVISI BM'}
                    </span>
                  </div>
                  {app.analystCheck.committeeSchedule && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg bg-slate-900/70 border border-slate-800 p-2.5 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">No. Agenda</span>
                        <strong className="font-mono text-white">{app.analystCheck.committeeSchedule.noAgenda}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Waktu Sidang</span>
                        <strong className="font-mono text-sky-300">
                          {app.analystCheck.committeeSchedule.waktuSidang.replace('T', ' ')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Lokasi Sidang</span>
                        <strong className="text-white">{app.analystCheck.committeeSchedule.lokasiSidang}</strong>
                      </div>
                    </div>
                  )}
                  <p className="text-slate-200 italic">&ldquo;{app.analystCheck.notes}&rdquo;</p>
                  <p className="text-[10px] text-slate-400">
                    Analis: <strong className="text-slate-200">{app.analystCheck.checkedBy}</strong> ·{' '}
                    {new Date(app.analystCheck.checkedAt).toLocaleString('id-ID')}
                  </p>
                </div>
              )}

              {/* Risk Management Verification & Notes Panel inside Review Tab */}
              <div className="rounded-xl border border-cyan-500/30 bg-slate-900/70 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-cyan-400" />
                      <span>Tanda Verifikasi &amp; Koreksi Manajemen Risiko (Lembar Komite)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pemeriksaan lapis kedua setelah koreksi dan penjadwalan komite oleh Analis. Muncul pada Form &amp; Lembar Komite.
                    </p>
                  </div>
                  {app.riskVerification && (
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold border ${
                        app.riskVerification.status === 'verified'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {app.riskVerification.verificationCode}
                    </span>
                  )}
                </div>

                {app.riskVerification && (
                  <div
                    className={`rounded-lg border p-3.5 text-xs ${
                      app.riskVerification.status === 'verified'
                        ? 'border-emerald-500/30 bg-emerald-950/25'
                        : 'border-amber-500/30 bg-amber-950/25'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`font-extrabold uppercase ${
                          app.riskVerification.status === 'verified' ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {app.riskVerification.status === 'verified'
                          ? '✓ TERVERIFIKASI SAH MANAJEMEN RISIKO'
                          : '! CATATAN KOREKSI MANAJEMEN RISIKO'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(app.riskVerification.verifiedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-slate-200 italic mt-1.5">&ldquo;{app.riskVerification.notes}&rdquo;</p>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Verifikator: <strong className="text-white">{app.riskVerification.verifiedBy}</strong>
                    </p>
                  </div>
                )}

                {(currentUser.role === 'risk_management' || currentUser.role === 'super_admin') ? (
                  !(
                    app.analystCheck?.status === 'verified_scheduled' ||
                    Boolean(app.analystCheck?.committeeSchedule) ||
                    Boolean(app.adminReview)
                  ) ? (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-950/25 p-3.5 flex items-start gap-2.5 text-xs">
                      <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-amber-200/90 leading-relaxed">
                        Menunggu Analis melakukan verifikasi dan penjadwalan komite terlebih dahulu sebelum Manajemen Risiko dapat menyematkan tanda verifikasi &amp; catatan koreksi.
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        verifyApplicationByRiskManagement(app.id, {
                          status: riskVerificationStatus,
                          notes:
                            riskVerificationNotes.trim() ||
                            'Telah diperiksa ulang dan diverifikasi oleh Divisi Manajemen Risiko.',
                        });
                      }}
                      className="space-y-3 pt-1 text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRiskVerificationStatus('verified')}
                          className={`rounded-lg border p-3 text-left transition-all ${
                            riskVerificationStatus === 'verified'
                              ? 'border-emerald-500 bg-emerald-950/40 text-white'
                              : 'border-slate-700 bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <p className="font-bold">✓ Beri Tanda Verifikasi Sah</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Lulus pemeriksaan Manajemen Risiko
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRiskVerificationStatus('need_correction')}
                          className={`rounded-lg border p-3 text-left transition-all ${
                            riskVerificationStatus === 'need_correction'
                              ? 'border-amber-500 bg-amber-950/40 text-white'
                              : 'border-slate-700 bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <p className="font-bold">! Beri Catatan Koreksi Risiko</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Ada koreksi/catatan mitigasi risiko
                          </p>
                        </button>
                      </div>
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Catatan Koreksi &amp; Verifikasi Manajemen Risiko
                        </label>
                        <textarea
                          rows={3}
                          required={riskVerificationStatus === 'need_correction'}
                          value={riskVerificationNotes}
                          onChange={(e) => setRiskVerificationNotes(e.target.value)}
                          placeholder="Tuliskan hasil pemeriksaan ulang, koreksi mitigasi risiko, atau konfirmasi kesesuaian lembar komite..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 font-bold text-white transition-colors"
                        >
                          <BadgeCheck className="h-4 w-4" />
                          <span>
                            {app.riskVerification ? 'Perbarui Verifikasi Risiko' : 'Simpan Tanda Verifikasi Risiko'}
                          </span>
                        </button>
                      </div>
                    </form>
                  )
                ) : !app.riskVerification ? (
                  <p className="text-xs text-slate-400 italic">
                    Belum ada tanda verifikasi atau catatan koreksi dari Divisi Manajemen Risiko.
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {/* TAB 6: DISBURSEMENT & NOTARY RESULTS */}
          {activeTab === 'disbursement' && (
            <div className="space-y-6 text-xs">
              {/* Status Header Banner */}
              <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-teal-500/20 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-teal-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Administrasi Pencairan & Pengikatan Notaris
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {app.applicationNumber} · {app.namaDebitur} ({app.cabang})
                      </p>
                    </div>
                  </div>

                  <div>
                    {!app.disbursementExecution ? (
                      <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-500/30">
                        Menunggu Realisasi Admin Cabang
                      </span>
                    ) : app.disbursementExecution.status === 'validated' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Pencairan Sah & Selesai (Divalidasi BM)</span>
                      </span>
                    ) : app.disbursementExecution.status === 'revision' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Perlu Revisi Dokumen</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Menunggu Validasi Akhir BM</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid 1: Perintah Komite & Analis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                    <span className="text-[11px] text-slate-400 block">Nominal Putusan Komite</span>
                    <span className="text-sm font-extrabold text-emerald-400 font-mono mt-1 block">
                      Rp{' '}
                      {(
                        app.disbursementInstruction?.nominalDisetujui ||
                        app.adminReview?.approvedPlafon ||
                        app.financial.plafonDiajukan
                      ).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Tenor {app.disbursementInstruction?.tenorDisetujui || app.adminReview?.approvedTenor || 12} Bulan
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                    <span className="text-[11px] text-slate-400 block">Jenis Pengikatan</span>
                    <span className="text-sm font-extrabold text-amber-300 mt-1 block flex items-center gap-1">
                      <Scale className="h-3.5 w-3.5" />
                      <span>{app.disbursementInstruction?.jenisPengikatan || 'Fidusia / APHT'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Agunan: {app.collateral.jenisJaminan}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                    <span className="text-[11px] text-slate-400 block">Notaris / PPAT</span>
                    <span className="text-xs font-bold text-white mt-1 block leading-snug">
                      {app.disbursementInstruction?.notarisPpats || 'Notaris Rekanan BMT'}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                    <span className="text-[11px] text-slate-400 block">Realisasi Pencairan</span>
                    <span className="text-sm font-extrabold text-white font-mono mt-1 block">
                      {app.disbursementExecution
                        ? `Rp ${app.disbursementExecution.nominalDicairkan.toLocaleString('id-ID')}`
                        : '-'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {app.disbursementExecution?.metodePencairan || 'Belum dieksekusi'}
                    </span>
                  </div>
                </div>

                {/* Pengantar dari Analis */}
                {app.disbursementInstruction?.pengantarPencairan && (
                  <div className="rounded-lg bg-slate-900/90 border border-teal-500/20 p-3">
                    <span className="text-[11px] font-semibold text-teal-300 block mb-1">
                      Pengantar Penting dari Analis Terkait Pencairan:
                    </span>
                    <p className="text-slate-300 font-mono text-[11px] bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      "{app.disbursementInstruction.pengantarPencairan}"
                    </p>
                  </div>
                )}
              </div>

              {/* Detail Eksekusi oleh Admin Cabang */}
              {app.disbursementExecution ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white text-xs">
                        Rincian Berkas Pencairan & Akta Notaris
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Admin Pelaksana: <strong className="text-white">{app.disbursementExecution.disbursedBy}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Nomor Akad</span>
                        <span className="text-white font-bold">{app.disbursementExecution.nomorAkad}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Tanggal Akad</span>
                        <span className="text-white">{app.disbursementExecution.tanggalAkad}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Tanggal Pencairan</span>
                        <span className="text-white">{app.disbursementExecution.tanggalPencairan}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">No. Akta Notaris</span>
                        <span className="text-white">{app.disbursementExecution.nomorAktaNotaris || '-'}</span>
                      </div>
                    </div>

                    {app.disbursementExecution.metodePencairan === 'Transfer Rekening Bank' && (
                      <div className="bg-slate-950/60 p-3 rounded border border-slate-800 text-[11px] font-mono flex flex-wrap gap-4 text-slate-300">
                        <span>Bank: <strong className="text-white">{app.disbursementExecution.namaBankTujuan}</strong></span>
                        <span>No. Rek: <strong className="text-white">{app.disbursementExecution.nomorRekeningTujuan || '-'}</strong></span>
                        <span>Penerima: <strong className="text-white">{app.disbursementExecution.namaPenerima || app.namaDebitur}</strong></span>
                      </div>
                    )}

                    {app.disbursementExecution.catatanAdminCabang && (
                      <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
                        <span className="text-slate-400 text-[10px] block mb-1">Catatan Admin Cabang:</span>
                        <p className="text-slate-200">{app.disbursementExecution.catatanAdminCabang}</p>
                      </div>
                    )}
                  </div>

                  {/* 4 Foto Dokumentasi Wajib */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Camera className="h-4 w-4 text-emerald-400" />
                        <span>Dokumentasi Wajib Foto Fisik Pencairan & Pengikatan</span>
                      </span>
                      <span className="text-[10px] text-teal-400 font-mono">Diverifikasi BM & Analis</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Foto 1 */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block truncate">
                          1. Sesi Akad & Debitur
                        </span>
                        <div
                          onClick={() =>
                            app.disbursementExecution?.fotoDokumentasiAkad &&
                            setModalPreviewImage({
                              url: app.disbursementExecution.fotoDokumentasiAkad,
                              title: 'Foto Sesi Penandatanganan Akad bersama Debitur',
                            })
                          }
                          className="aspect-[4/3] rounded-lg bg-slate-800 border border-slate-700 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          {app.disbursementExecution.fotoDokumentasiAkad ? (
                            <img
                              src={app.disbursementExecution.fotoDokumentasiAkad}
                              alt="Dokumentasi Akad"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-[10px]">
                              Tidak ada foto
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Foto 2 */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block truncate">
                          2. Lembar Akad Basah
                        </span>
                        <div
                          onClick={() =>
                            app.disbursementExecution?.fotoAkadBasah &&
                            setModalPreviewImage({
                              url: app.disbursementExecution.fotoAkadBasah,
                              title: 'Foto Fisik Lembar Akad Basah Bertandatangan',
                            })
                          }
                          className="aspect-[4/3] rounded-lg bg-slate-800 border border-slate-700 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          {app.disbursementExecution.fotoAkadBasah ? (
                            <img
                              src={app.disbursementExecution.fotoAkadBasah}
                              alt="Akad Basah"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-[10px]">
                              Tidak ada foto
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Foto 3 */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block truncate">
                          3. Bukti Transfer / Kwitansi
                        </span>
                        <div
                          onClick={() =>
                            app.disbursementExecution?.fotoBuktiPencairan &&
                            setModalPreviewImage({
                              url: app.disbursementExecution.fotoBuktiPencairan,
                              title: 'Foto Bukti Transfer Bank / Slip Pencairan Kas',
                            })
                          }
                          className="aspect-[4/3] rounded-lg bg-slate-800 border border-slate-700 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          {app.disbursementExecution.fotoBuktiPencairan ? (
                            <img
                              src={app.disbursementExecution.fotoBuktiPencairan}
                              alt="Bukti Cair"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-[10px]">
                              Tidak ada foto
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Foto 4 */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block truncate">
                          4. Agunan Asli di Brankas
                        </span>
                        <div
                          onClick={() =>
                            app.disbursementExecution?.fotoAgunanFisik &&
                            setModalPreviewImage({
                              url: app.disbursementExecution.fotoAgunanFisik,
                              title: 'Foto Fisik Agunan Asli di Khazanah BMT',
                            })
                          }
                          className="aspect-[4/3] rounded-lg bg-slate-800 border border-slate-700 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          {app.disbursementExecution.fotoAgunanFisik ? (
                            <img
                              src={app.disbursementExecution.fotoAgunanFisik}
                              alt="Agunan Asli"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-[10px]">
                              Tidak ada foto
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validasi Branch Manager */}
                  {app.disbursementExecution.bmValidation && (
                    <div
                      className={`rounded-xl border p-4 space-y-2 ${
                        app.disbursementExecution.bmValidation.status === 'valid'
                          ? 'border-emerald-500/40 bg-emerald-950/30'
                          : 'border-rose-500/40 bg-rose-950/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          <span>Pengesahan Validasi oleh Branch Manager:</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.disbursementExecution.bmValidation.status === 'valid'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {app.disbursementExecution.bmValidation.status === 'valid'
                            ? 'DISAHKAN SAH'
                            : 'PERLU REVISI'}
                        </span>
                      </div>
                      <p className="text-slate-300">
                        Validator: <strong className="text-white">{app.disbursementExecution.bmValidation.validatedBy}</strong> · Tanggal: {new Date(app.disbursementExecution.bmValidation.validatedAt).toLocaleString('id-ID')}
                      </p>
                      {app.disbursementExecution.bmValidation.notes && (
                        <p className="text-slate-200 bg-slate-900/80 p-2.5 rounded border border-slate-800">
                          "{app.disbursementExecution.bmValidation.notes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <Banknote className="h-8 w-8 mx-auto text-slate-600 mb-1 opacity-50" />
                  <p className="font-semibold text-slate-300">
                    Belum Ada Data Realisasi Pencairan dari Admin Cabang
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Admin Cabang akan mengisi data akad, nomor notaris, dan mengunggah 4 foto dokumentasi fisik untuk divalidasi oleh Branch Manager.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-slate-800/40 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400">
            Status Berkas:{' '}
            <strong className="text-emerald-400 uppercase">
              {app.status}
            </strong>
          </span>
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="px-4 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Image Preview Zoom Modal */}
      {modalPreviewImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950">
              <span className="text-xs font-bold text-white">{modalPreviewImage.title}</span>
              <button
                onClick={() => setModalPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center flex-1 bg-black/60">
              <img
                src={modalPreviewImage.url}
                alt={modalPreviewImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
