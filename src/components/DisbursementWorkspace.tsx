import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  SurveyApplication,
  DisbursementExecution,
  JenisPengikatanAgunan,
} from '../types';
import {
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Upload,
  UserCheck,
  Calendar,
  Building,
  DollarSign,
  Printer,
  ChevronRight,
  ShieldAlert,
  FileText,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
  ZoomIn,
  X,
  Send,
  Building2,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  Landmark,
  CreditCard,
  FileSignature,
  Scale,
  Receipt,
  Eye,
} from 'lucide-react';
import { DocumentCameraCapture } from './DocumentCameraCapture';

export const DisbursementWorkspace: React.FC = () => {
  const {
    applications,
    currentUser,
    submitDisbursementExecution,
    validateDisbursementByBM,
    printApplicationReport,
    selectedApplication,
    setSelectedApplication,
    setIsDetailModalOpen,
  } = useApp();

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isBranchAdmin = currentUser.role === 'branch_admin';
  const isBranchManager = currentUser.role === 'branch_manager';
  const isAnalis = currentUser.role === 'admin';
  const isManajemen = currentUser.role === 'management';

  // Branch filter (Super Admin & Manajemen can choose branch or all)
  const [selectedBranch, setSelectedBranch] = useState<string>(
    currentUser.branch || 'Cabang Pasar Minggu'
  );

  // Status Filter tab
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'pending_execution' | 'pending_bm_validation' | 'revision' | 'validated'
  >('all');

  const [searchQuery, setSearchQuery] = useState('');

  // Applications eligible for disbursement:
  // Must be approved by Komite (status approved or conditional_approval) and have disbursementInstruction
  const eligibleApplications = useMemo(() => {
    return applications.filter((app) => {
      // Must be approved or conditional_approval or have disbursementInstruction/execution
      const hasDisbursementData =
        Boolean(app.disbursementInstruction) ||
        Boolean(app.disbursementExecution) ||
        app.status === 'approved' ||
        app.status === 'conditional_approval';

      if (!hasDisbursementData) return false;

      // Branch check: branch_admin and branch_manager see their own branch, super_admin/manajemen/analis see all
      if (isBranchAdmin || isBranchManager) {
        if (currentUser.branch && app.cabang.toLowerCase() !== currentUser.branch.toLowerCase()) {
          return false;
        }
      } else if (selectedBranch !== 'all' && (isSuperAdmin || isManajemen)) {
        if (app.cabang.toLowerCase() !== selectedBranch.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [applications, isBranchAdmin, isBranchManager, isSuperAdmin, isManajemen, currentUser.branch, selectedBranch]);

  // Filtered applications based on active filter & search
  const filteredApplications = useMemo(() => {
    return eligibleApplications.filter((app) => {
      // Status filter
      const exec = app.disbursementExecution;
      if (activeFilter === 'pending_execution') {
        if (exec && exec.status !== 'revision') return false;
      } else if (activeFilter === 'pending_bm_validation') {
        if (!exec || exec.status !== 'pending_bm_validation') return false;
      } else if (activeFilter === 'revision') {
        if (!exec || exec.status !== 'revision') return false;
      } else if (activeFilter === 'validated') {
        if (!exec || exec.status !== 'validated') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = app.namaDebitur.toLowerCase().includes(q);
        const matchNo = app.applicationNumber.toLowerCase().includes(q);
        const matchAkad = app.disbursementExecution?.nomorAkad.toLowerCase().includes(q);
        const matchNik = app.nik.includes(q);
        if (!matchName && !matchNo && !matchAkad && !matchNik) return false;
      }

      return true;
    });
  }, [eligibleApplications, activeFilter, searchQuery]);

  // Selected application to process or view
  const [selectedAppId, setSelectedAppId] = useState<string>(() => {
    if (selectedApplication && eligibleApplications.some((a) => a.id === selectedApplication.id)) {
      return selectedApplication.id;
    }
    return eligibleApplications[0]?.id || '';
  });

  const selectedApp = eligibleApplications.find((a) => a.id === selectedAppId);

  // Form State for Admin Cabang Execution
  const [nomorAkad, setNomorAkad] = useState('');
  const [tanggalAkad, setTanggalAkad] = useState(new Date().toISOString().slice(0, 10));
  const [tanggalPencairan, setTanggalPencairan] = useState(new Date().toISOString().slice(0, 10));
  const [nominalDicairkan, setNominalDicairkan] = useState<number>(0);
  const [metodePencairan, setMetodePencairan] = useState<
    'Transfer Rekening Bank' | 'Kas Tunai Kantor Cabang' | 'Pemindahbukuan Tabungan BMT'
  >('Transfer Rekening Bank');
  const [nomorRekeningTujuan, setNomorRekeningTujuan] = useState('');
  const [namaBankTujuan, setNamaBankTujuan] = useState('Bank Syariah Indonesia (BSI)');
  const [namaPenerima, setNamaPenerima] = useState('');
  const [notarisPelaksana, setNotarisPelaksana] = useState('');
  const [nomorAktaNotaris, setNomorAktaNotaris] = useState('');
  const [catatanAdminCabang, setCatatanAdminCabang] = useState('');

  // 4 Wajib Foto Dokumentasi
  const [fotoAkadBasah, setFotoAkadBasah] = useState('');
  const [fotoBuktiPencairan, setFotoBuktiPencairan] = useState('');
  const [fotoDokumentasiAkad, setFotoDokumentasiAkad] = useState('');
  const [fotoAgunanFisik, setFotoAgunanFisik] = useState('');

  // Validation state & errors
  const [formError, setFormError] = useState<string | null>(null);

  // BM Validation Modal & Action State
  const [isBMModalOpen, setIsBMModalOpen] = useState(false);
  const [bmDecision, setBmDecision] = useState<'valid' | 'revision'>('valid');
  const [bmNotes, setBmNotes] = useState('');

  // Camera Capture Modal State
  const [cameraConfig, setCameraConfig] = useState<{
    isOpen: boolean;
    targetField: 'akad_basah' | 'bukti_cair' | 'dokumentasi_sesi' | 'agunan_fisik' | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    targetField: null,
    title: '',
    description: '',
  });

  // Image Preview Zoom Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Sync state when selected application changes
  React.useEffect(() => {
    if (selectedApp) {
      const existing = selectedApp.disbursementExecution;
      const instruction = selectedApp.disbursementInstruction;

      const defaultNominal =
        instruction?.nominalDisetujui ||
        selectedApp.adminReview?.approvedPlafon ||
        selectedApp.scoring.plafonDisarankan ||
        selectedApp.financial.plafonDiajukan;

      if (existing) {
        setNomorAkad(existing.nomorAkad || `AKAD/${selectedApp.applicationNumber}/2026`);
        setTanggalAkad(existing.tanggalAkad || new Date().toISOString().slice(0, 10));
        setTanggalPencairan(existing.tanggalPencairan || new Date().toISOString().slice(0, 10));
        setNominalDicairkan(existing.nominalDicairkan || defaultNominal);
        setMetodePencairan(existing.metodePencairan || 'Transfer Rekening Bank');
        setNomorRekeningTujuan(existing.nomorRekeningTujuan || '');
        setNamaBankTujuan(existing.namaBankTujuan || 'Bank Syariah Indonesia (BSI)');
        setNamaPenerima(existing.namaPenerima || selectedApp.namaDebitur);
        setNotarisPelaksana(
          existing.notarisPelaksana ||
          instruction?.notarisPpats ||
          'Notaris & PPAT Siti Rahmawati, S.H., M.Kn.'
        );
        setNomorAktaNotaris(existing.nomorAktaNotaris || '');
        setCatatanAdminCabang(existing.catatanAdminCabang || '');
        setFotoAkadBasah(existing.fotoAkadBasah || '');
        setFotoBuktiPencairan(existing.fotoBuktiPencairan || '');
        setFotoDokumentasiAkad(existing.fotoDokumentasiAkad || '');
        setFotoAgunanFisik(existing.fotoAgunanFisik || '');
      } else {
        // Initialize fresh defaults from committee order
        setNomorAkad(`AKAD-BMT/2026/${selectedApp.applicationNumber.replace(/[^a-zA-Z0-9]/g, '')}`);
        setTanggalAkad(new Date().toISOString().slice(0, 10));
        setTanggalPencairan(new Date().toISOString().slice(0, 10));
        setNominalDicairkan(defaultNominal);
        setMetodePencairan('Transfer Rekening Bank');
        setNomorRekeningTujuan('');
        setNamaBankTujuan('Bank Syariah Indonesia (BSI)');
        setNamaPenerima(selectedApp.namaDebitur);
        setNotarisPelaksana(
          instruction?.notarisPpats || 'Notaris & PPAT Siti Rahmawati, S.H., M.Kn.'
        );
        setNomorAktaNotaris(`AKTA-${instruction?.jenisPengikatan || 'FIDUSIA'}/2026/${Date.now().toString().slice(-4)}`);
        setCatatanAdminCabang(
          `Pencairan pembiayaan ${selectedApp.namaDebitur} senilai Rp ${defaultNominal.toLocaleString('id-ID')} telah direalisasikan secara sah bersama notaris rekanan dengan pengikatan ${instruction?.jenisPengikatan || 'Fidusia/APHT'}.`
        );
        setFotoAkadBasah('');
        setFotoBuktiPencairan('');
        setFotoDokumentasiAkad('');
        setFotoAgunanFisik('');
      }
      setFormError(null);
    }
  }, [selectedAppId]);

  // Handle Photo Upload
  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'akad_basah' | 'bukti_cair' | 'dokumentasi_sesi' | 'agunan_fisik'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (target === 'akad_basah') setFotoAkadBasah(dataUrl);
      else if (target === 'bukti_cair') setFotoBuktiPencairan(dataUrl);
      else if (target === 'dokumentasi_sesi') setFotoDokumentasiAkad(dataUrl);
      else if (target === 'agunan_fisik') setFotoAgunanFisik(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Open Camera for specific document
  const openCamera = (
    targetField: 'akad_basah' | 'bukti_cair' | 'dokumentasi_sesi' | 'agunan_fisik',
    title: string,
    description: string
  ) => {
    setCameraConfig({
      isOpen: true,
      targetField,
      title,
      description,
    });
  };

  const handleCameraCaptureConfirm = (imageDataUrl: string) => {
    if (cameraConfig.targetField === 'akad_basah') {
      setFotoAkadBasah(imageDataUrl);
    } else if (cameraConfig.targetField === 'bukti_cair') {
      setFotoBuktiPencairan(imageDataUrl);
    } else if (cameraConfig.targetField === 'dokumentasi_sesi') {
      setFotoDokumentasiAkad(imageDataUrl);
    } else if (cameraConfig.targetField === 'agunan_fisik') {
      setFotoAgunanFisik(imageDataUrl);
    }
  };

  // Submit Disbursement by Admin Cabang
  const handleSubmitExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setFormError(null);

    // Validations: Required fields
    if (!nomorAkad.trim()) {
      setFormError('Nomor Akad Pembiayaan wajib diisi.');
      return;
    }
    if (!nominalDicairkan || nominalDicairkan <= 0) {
      setFormError('Nominal yang dicairkan harus lebih besar dari 0.');
      return;
    }
    if (!notarisPelaksana.trim()) {
      setFormError('Nama Notaris / PPAT Pelaksana wajib diisi.');
      return;
    }

    // Mandatory Photo Validations as explicitly requested by user:
    // "itu ajib didokumentasikan berupa foto fil dan dokumentasi"
    if (!fotoDokumentasiAkad) {
      setFormError('Wajib melampirkan Foto Dokumentasi Sesi Penandatanganan Akad bersama Debitur.');
      return;
    }
    if (!fotoAkadBasah) {
      setFormError('Wajib melampirkan Foto Fisik Lembar Akad Basah Bertandatangan & Bermaterai.');
      return;
    }
    if (!fotoBuktiPencairan) {
      setFormError('Wajib melampirkan Foto Bukti Transfer Bank atau Kwitansi Pencairan Kas.');
      return;
    }

    const executionData: Omit<DisbursementExecution, 'status' | 'bmValidation'> = {
      disbursedAt: new Date().toISOString(),
      disbursedBy: currentUser.name,
      disburserId: currentUser.id,
      branch: selectedApp.cabang,
      nomorAkad: nomorAkad.trim(),
      tanggalAkad,
      tanggalPencairan,
      nominalDicairkan,
      metodePencairan,
      nomorRekeningTujuan: nomorRekeningTujuan.trim(),
      namaBankTujuan: namaBankTujuan.trim(),
      namaPenerima: namaPenerima.trim() || selectedApp.namaDebitur,
      notarisPelaksana: notarisPelaksana.trim(),
      nomorAktaNotaris: nomorAktaNotaris.trim(),
      catatanAdminCabang: catatanAdminCabang.trim(),
      fotoAkadBasah,
      fotoBuktiPencairan,
      fotoDokumentasiAkad,
      fotoAgunanFisik,
    };

    submitDisbursementExecution(selectedApp.id, executionData);
  };

  // Branch Manager Validation Handler
  const handleBMValidationSubmit = () => {
    if (!selectedApp) return;
    if (bmDecision === 'revision' && !bmNotes.trim()) {
      alert('Mohon tuliskan catatan instruksi revisi yang jelas untuk Admin Cabang.');
      return;
    }

    validateDisbursementByBM(
      selectedApp.id,
      bmDecision,
      bmNotes.trim() ||
        (bmDecision === 'valid'
          ? 'Dokumentasi fisik akad, pengikatan notaris, dan bukti pencairan telah diperiksa dan disahkan sesuai SOP.'
          : 'Perlu perbaikan dokumen pencairan.')
    );

    setIsBMModalOpen(false);
    setBmNotes('');
  };

  // Metrics for Cards
  const stats = useMemo(() => {
    let pendingExecution = 0;
    let pendingBM = 0;
    let revision = 0;
    let validated = 0;
    let totalNominal = 0;

    eligibleApplications.forEach((app) => {
      const exec = app.disbursementExecution;
      if (!exec) {
        pendingExecution++;
      } else if (exec.status === 'pending_bm_validation') {
        pendingBM++;
      } else if (exec.status === 'revision') {
        revision++;
      } else if (exec.status === 'validated') {
        validated++;
        totalNominal += exec.nominalDicairkan || 0;
      }
    });

    return {
      pendingExecution,
      pendingBM,
      revision,
      validated,
      totalNominal,
    };
  }, [eligibleApplications]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Administrasi Pencairan & Pengikatan Agunan</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-500/30">
                  {currentUser.role === 'branch_admin'
                    ? 'Admin Cabang'
                    : currentUser.role === 'branch_manager'
                    ? 'Supervisi BM'
                    : currentUser.role === 'admin'
                    ? 'Monitoring Analis'
                    : currentUser.role === 'management'
                    ? 'Monitoring Eksekutif'
                    : 'Super Admin'}
                </span>
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Pusat tindak lanjut instruksi komite pembiayaan: pengikatan notaris (Fidusia / APHT), dokumentasi fisik foto wajib, realisasi pencairan dana, serta pengesahan validasi akhir Branch Manager.
              </p>
            </div>
          </div>
        </div>

        {/* Branch Filter for Head Office / Super Admin / Management */}
        {(isSuperAdmin || isManajemen || isAnalis) && (
          <div className="flex items-center gap-2 shrink-0">
            <Building className="h-4 w-4 text-slate-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-hidden font-medium"
            >
              <option value="all">Semua Cabang BMT</option>
              <option value="Cabang Pasar Minggu">Cabang Pasar Minggu</option>
              <option value="Cabang Tebet">Cabang Tebet</option>
              <option value="Cabang Depok">Cabang Depok</option>
              <option value="Cabang Ciputat">Cabang Ciputat</option>
              <option value="Cabang Bekasi">Cabang Bekasi</option>
            </select>
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Siap Dicairkan */}
        <div
          onClick={() => setActiveFilter('pending_execution')}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
            activeFilter === 'pending_execution'
              ? 'border-amber-500 bg-amber-950/30 shadow-md ring-1 ring-amber-500/30'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Perintah Masuk</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-white mt-1.5">{stats.pendingExecution}</p>
          <p className="text-[11px] text-amber-400 mt-1">Siap ditindaklanjuti</p>
        </div>

        {/* Card 2: Menunggu BM */}
        <div
          onClick={() => setActiveFilter('pending_bm_validation')}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
            activeFilter === 'pending_bm_validation'
              ? 'border-indigo-500 bg-indigo-950/30 shadow-md ring-1 ring-indigo-500/30'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Menunggu BM</span>
            <UserCheck className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-xl font-extrabold text-white mt-1.5">{stats.pendingBM}</p>
          <p className="text-[11px] text-indigo-400 mt-1">Verifikasi Branch Manager</p>
        </div>

        {/* Card 3: Perlu Revisi */}
        <div
          onClick={() => setActiveFilter('revision')}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
            activeFilter === 'revision'
              ? 'border-rose-500 bg-rose-950/30 shadow-md ring-1 ring-rose-500/30'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Perlu Revisi</span>
            <RotateCcw className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-xl font-extrabold text-white mt-1.5">{stats.revision}</p>
          <p className="text-[11px] text-rose-400 mt-1">Catatan koreksi BM</p>
        </div>

        {/* Card 4: Tuntas Validasi */}
        <div
          onClick={() => setActiveFilter('validated')}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
            activeFilter === 'validated'
              ? 'border-emerald-500 bg-emerald-950/30 shadow-md ring-1 ring-emerald-500/30'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Disahkan Sah</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-white mt-1.5">{stats.validated}</p>
          <p className="text-[11px] text-emerald-400 mt-1">Pencairan tuntas</p>
        </div>

        {/* Card 5: Total Realisasi */}
        <div
          onClick={() => setActiveFilter('all')}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all col-span-2 sm:col-span-2 lg:col-span-1 ${
            activeFilter === 'all'
              ? 'border-teal-500 bg-teal-950/30 shadow-md ring-1 ring-teal-500/30'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Realisasi Cair</span>
            <Receipt className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-sm font-extrabold text-white mt-1.5 truncate">
            Rp {stats.totalNominal.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-teal-400 mt-1">Seluruh berkas sah</p>
        </div>
      </div>

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Disbursement Applications */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Daftar Instruksi Pencairan ({filteredApplications.length})
              </span>
              <span className="text-[11px] text-teal-400 font-mono">Pilih Berkas</span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama debitur, no berkas, akad..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            {/* List items */}
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {filteredApplications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <Banknote className="h-8 w-8 mx-auto text-slate-600 mb-2 opacity-50" />
                  <p className="font-semibold text-slate-400">Tidak Ada Berkas Sesuai Filter</p>
                  <p className="text-[11px] mt-1 text-slate-500">
                    Berkas pencairan diterbitkan oleh Analis setelah sidang komite disahkan.
                  </p>
                </div>
              ) : (
                filteredApplications.map((app) => {
                  const isSelected = app.id === selectedAppId;
                  const exec = app.disbursementExecution;
                  const instruction = app.disbursementInstruction;
                  const nominal =
                    exec?.nominalDicairkan ||
                    instruction?.nominalDisetujui ||
                    app.adminReview?.approvedPlafon ||
                    app.financial.plafonDiajukan;

                  const statusBadge = !exec ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/30">
                      Perintah Masuk
                    </span>
                  ) : exec.status === 'pending_bm_validation' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 animate-pulse">
                      Menunggu Validasi BM
                    </span>
                  ) : exec.status === 'revision' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30">
                      Revisi BM
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                      Divalidasi Sah
                    </span>
                  );

                  return (
                    <button
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`w-full text-left rounded-lg p-3 border transition-colors flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-950/20'
                          : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-teal-400 font-semibold truncate">
                            {app.applicationNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">· {app.cabang}</span>
                        </div>
                        <p className="font-bold text-white text-xs mt-1 truncate">
                          {app.namaDebitur}
                        </p>
                        <p className="text-[11px] font-semibold text-emerald-400 mt-0.5 font-mono">
                          Rp {nominal.toLocaleString('id-ID')}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {statusBadge}
                          {instruction?.jenisPengikatan && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                              {instruction.jenisPengikatan}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 mt-2 shrink-0 ${
                          isSelected ? 'text-teal-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Form & Results Viewer */}
        <div className="lg:col-span-8">
          {selectedApp ? (
            <div className="space-y-5">
              {/* Card 1: Official Order Banner from Analis & Komite */}
              <div className="rounded-xl border border-teal-500/40 bg-teal-950/20 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-teal-500/30 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                      <FileSignature className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Perintah Resmi Pencairan dari Komite Pembiayaan & Analis
                      </h3>
                      <p className="text-[11px] text-teal-300">
                        Diterbitkan oleh {selectedApp.disbursementInstruction?.orderIssuedBy || 'Analis Kredit'} · {selectedApp.applicationNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedApplication(selectedApp);
                        setIsDetailModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-sky-400" />
                      <span>Lihat Berkas Survey</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => printApplicationReport(selectedApp)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5 text-teal-400" />
                      <span>Cetak BA Komite</span>
                    </button>
                  </div>
                </div>

                {/* Instruction Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[11px] block">Nominal Putusan Komite</span>
                    <p className="text-base font-extrabold text-emerald-400 mt-1 font-mono">
                      Rp{' '}
                      {(
                        selectedApp.disbursementInstruction?.nominalDisetujui ||
                        selectedApp.adminReview?.approvedPlafon ||
                        selectedApp.financial.plafonDiajukan
                      ).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Tenor:{' '}
                      {selectedApp.disbursementInstruction?.tenorDisetujui ||
                        selectedApp.adminReview?.approvedTenor ||
                        selectedApp.financial.tenorBulanDiajukan}{' '}
                      Bulan · Margin {selectedApp.disbursementInstruction?.marginUjrah || 12}% p.a.
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[11px] block">Jenis Pengikatan Agunan</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Scale className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="font-extrabold text-sm text-amber-300">
                        {selectedApp.disbursementInstruction?.jenisPengikatan || 'Fidusia'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Agunan:{' '}
                      {selectedApp.disbursementInstruction?.jenisAgunan?.join(', ') ||
                        selectedApp.collateral.jenisJaminan}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[11px] block">Notaris / PPAT Ditunjuk</span>
                    <p className="text-xs font-bold text-white mt-1 leading-snug">
                      {selectedApp.disbursementInstruction?.notarisPpats ||
                        'Notaris Rekanan BMT Jakarta Selatan'}
                    </p>
                    <span className="text-[10px] text-teal-400 mt-0.5 block">
                      Pejabat Pembuat Akta Sah
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[11px] block">Status Validasi BM</span>
                    <div className="mt-1.5">
                      {!selectedApp.disbursementExecution ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-500/30">
                          Menunggu Realisasi
                        </span>
                      ) : selectedApp.disbursementExecution.status === 'validated' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Divalidasi Sah</span>
                        </span>
                      ) : selectedApp.disbursementExecution.status === 'revision' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-500/30">
                          <RotateCcw className="h-3 w-3" />
                          <span>Perlu Revisi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                          <Clock className="h-3 w-3" />
                          <span>Menunggu BM</span>
                        </span>
                      )}
                    </div>
                    {selectedApp.disbursementExecution?.bmValidation && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        Oleh: {selectedApp.disbursementExecution.bmValidation.validatedBy}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pengantar Penting dari Analis */}
                <div className="rounded-lg bg-slate-900/90 border border-teal-500/30 p-3.5 text-xs">
                  <div className="flex items-center gap-2 text-teal-300 font-semibold mb-1">
                    <Sparkles className="h-4 w-4 text-teal-400" />
                    <span>Pengantar Penting dari Analis Terkait Pencairan:</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800 font-mono text-[11px]">
                    "{selectedApp.disbursementInstruction?.pengantarPencairan ||
                      'Harap lakukan pencairan sesuai nominal yang disepakati di komite. Pastikan penandatanganan akad dihadiri oleh debitur dan pasangan sah di hadapan notaris yang ditunjuk, cek fisik keabsahan dokumen agunan, dan wajib mendokumentasikan foto penandatanganan serta bukti transfer.'}"
                  </p>
                </div>
              </div>

              {/* Card 2: Form Realisasi Pencairan & Pengikatan (Admin Cabang) */}
              <form onSubmit={handleSubmitExecution} className="space-y-5">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-teal-400" />
                      <h3 className="text-sm font-bold text-white">
                        Form Realisasi Pencairan & Pengikatan Notaris
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      Diisi oleh <strong className="text-white">Admin Cabang</strong>
                    </span>
                  </div>

                  {formError && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-200 animate-in fade-in duration-200">
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Nomor Akad Kredit / Pembiayaan <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nomorAkad}
                        onChange={(e) => setNomorAkad(e.target.value)}
                        placeholder="Contoh: AKAD-BMT/2026/001"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Tanggal Penandatanganan Akad <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={tanggalAkad}
                        onChange={(e) => setTanggalAkad(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Tanggal Realisasi Pencairan <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={tanggalPencairan}
                        onChange={(e) => setTanggalPencairan(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Nominal Dicairkan (Rp) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min={100000}
                        required
                        value={nominalDicairkan}
                        onChange={(e) => setNominalDicairkan(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono font-bold focus:border-teal-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                        Terbilang: Rp {nominalDicairkan.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Metode Pencairan Dana <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={metodePencairan}
                        onChange={(e) => setMetodePencairan(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-hidden"
                      >
                        <option value="Transfer Rekening Bank">Transfer Rekening Bank</option>
                        <option value="Kas Tunai Kantor Cabang">Kas Tunai Kantor Cabang</option>
                        <option value="Pemindahbukuan Tabungan BMT">Pemindahbukuan Tabungan BMT</option>
                      </select>
                    </div>

                    {metodePencairan === 'Transfer Rekening Bank' ? (
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Nama Bank Tujuan Transfer
                        </label>
                        <input
                          type="text"
                          value={namaBankTujuan}
                          onChange={(e) => setNamaBankTujuan(e.target.value)}
                          placeholder="Contoh: Bank Syariah Indonesia / BCA / BRI"
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-hidden"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Nama Penerima Dana
                        </label>
                        <input
                          type="text"
                          value={namaPenerima}
                          onChange={(e) => setNamaPenerima(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {metodePencairan === 'Transfer Rekening Bank' && (
                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-semibold mb-1">
                          Nomor Rekening Tujuan & Atas Nama
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={nomorRekeningTujuan}
                            onChange={(e) => setNomorRekeningTujuan(e.target.value)}
                            placeholder="Nomor Rekening (Contoh: 7123456789)"
                            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                          />
                          <input
                            type="text"
                            value={namaPenerima}
                            onChange={(e) => setNamaPenerima(e.target.value)}
                            placeholder="Atas Nama Pemilik Rekening"
                            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Notaris / PPAT Pelaksana <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={notarisPelaksana}
                        onChange={(e) => setNotarisPelaksana(e.target.value)}
                        placeholder="Nama Notaris & PPAT"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Nomor Akta Notaris / Bukti Pendaftaran
                      </label>
                      <input
                        type="text"
                        value={nomorAktaNotaris}
                        onChange={(e) => setNomorAktaNotaris(e.target.value)}
                        placeholder="Contoh: No. 18/Not/III/2026 atau Bukti APHT No. ..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-slate-300 font-semibold mb-1">
                        Catatan & Keterangan Admin Cabang
                      </label>
                      <textarea
                        rows={2}
                        value={catatanAdminCabang}
                        onChange={(e) => setCatatanAdminCabang(e.target.value)}
                        placeholder="Keterangan pelaksanaan akad, saksi yang hadir, pengecekan agunan asli, dll..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 3: Wajib Dokumentasi Foto & Dokumen Fisik (Strict Requirement) */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 gap-1">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">
                        Dokumentasi Wajib Foto Fisik & Berkas Akad
                      </h3>
                    </div>
                    <span className="text-[11px] text-amber-400 font-semibold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/20">
                      Wajib Dilampirkan Sebelum Kirim ke BM
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sesuai instruksi dan SOP pembiayaan, seluruh realisasi pencairan dan pengikatan agunan <strong>wajib didokumentasikan</strong> berupa foto fisik sesi akad, lembar akad bertandatangan basah, bukti pencairan/transfer, dan foto agunan asli di brankas cabang.
                  </p>

                  {/* 4 Photo Upload Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Foto 1: Sesi Akad */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-white leading-tight">1. Sesi Akad & Debitur</p>
                          <span className="text-[10px] text-emerald-400 font-bold">*Wajib</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2 leading-tight">
                          Foto sesi penandatanganan akad bersama debitur & admin cabang.
                        </p>
                        <div
                          onClick={() =>
                            fotoDokumentasiAkad &&
                            setPreviewImage({
                              url: fotoDokumentasiAkad,
                              title: 'Foto Sesi Penandatanganan Akad bersama Debitur',
                            })
                          }
                          className="aspect-[4/3] w-full rounded-lg bg-slate-800 overflow-hidden relative border border-slate-700 cursor-pointer group"
                        >
                          {fotoDokumentasiAkad ? (
                            <>
                              <img
                                src={fotoDokumentasiAkad}
                                alt="Sesi Akad"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="h-5 w-5 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-2">
                              <Camera className="h-6 w-6 text-slate-600 mb-1" />
                              <span className="text-[10px]">Belum Ada Foto</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openCamera(
                                'dokumentasi_sesi',
                                'Ambil Foto Sesi Penandatanganan Akad',
                                'Potret debitur saat menandatangani berkas akad pembiayaan di kantor cabang atau kantor notaris.'
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1 rounded bg-teal-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-teal-500 transition-colors"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>Kamera</span>
                          </button>

                          <input
                            type="file"
                            accept="image/*"
                            id="upload-sesi-akad"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'dokumentasi_sesi')}
                          />
                          <label
                            htmlFor="upload-sesi-akad"
                            className="flex-1 flex items-center justify-center gap-1 cursor-pointer rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload</span>
                          </label>
                        </div>
                        {fotoDokumentasiAkad && (
                          <button
                            type="button"
                            onClick={() => setFotoDokumentasiAkad('')}
                            className="w-full text-center text-[10px] text-slate-500 hover:text-rose-400 py-0.5"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Foto 2: Lembar Akad Basah */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-white leading-tight">2. Lembar Akad Basah</p>
                          <span className="text-[10px] text-emerald-400 font-bold">*Wajib</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2 leading-tight">
                          Foto fisik halaman tanda tangan & materai akad pembiayaan.
                        </p>
                        <div
                          onClick={() =>
                            fotoAkadBasah &&
                            setPreviewImage({
                              url: fotoAkadBasah,
                              title: 'Foto Fisik Lembar Akad Basah Bertandatangan',
                            })
                          }
                          className="aspect-[4/3] w-full rounded-lg bg-slate-800 overflow-hidden relative border border-slate-700 cursor-pointer group"
                        >
                          {fotoAkadBasah ? (
                            <>
                              <img
                                src={fotoAkadBasah}
                                alt="Akad Basah"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="h-5 w-5 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-2">
                              <FileText className="h-6 w-6 text-slate-600 mb-1" />
                              <span className="text-[10px]">Belum Ada Foto</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openCamera(
                                'akad_basah',
                                'Ambil Foto Lembar Tanda Tangan Basah',
                                'Pastikan tanda tangan debitur, pasangan, dan materai 10.000 terlihat tajam dan jelas.'
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1 rounded bg-teal-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-teal-500 transition-colors"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>Kamera</span>
                          </button>

                          <input
                            type="file"
                            accept="image/*"
                            id="upload-akad-basah"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'akad_basah')}
                          />
                          <label
                            htmlFor="upload-akad-basah"
                            className="flex-1 flex items-center justify-center gap-1 cursor-pointer rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload</span>
                          </label>
                        </div>
                        {fotoAkadBasah && (
                          <button
                            type="button"
                            onClick={() => setFotoAkadBasah('')}
                            className="w-full text-center text-[10px] text-slate-500 hover:text-rose-400 py-0.5"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Foto 3: Bukti Transfer / Pencairan */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-white leading-tight">3. Bukti Pencairan / Transfer</p>
                          <span className="text-[10px] text-emerald-400 font-bold">*Wajib</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2 leading-tight">
                          Foto bukti transfer bank atau slip kwitansi pencairan kas.
                        </p>
                        <div
                          onClick={() =>
                            fotoBuktiPencairan &&
                            setPreviewImage({
                              url: fotoBuktiPencairan,
                              title: 'Foto Bukti Transfer / Kwitansi Pencairan Dana',
                            })
                          }
                          className="aspect-[4/3] w-full rounded-lg bg-slate-800 overflow-hidden relative border border-slate-700 cursor-pointer group"
                        >
                          {fotoBuktiPencairan ? (
                            <>
                              <img
                                src={fotoBuktiPencairan}
                                alt="Bukti Transfer"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="h-5 w-5 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-2">
                              <Receipt className="h-6 w-6 text-slate-600 mb-1" />
                              <span className="text-[10px]">Belum Ada Foto</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openCamera(
                                'bukti_cair',
                                'Ambil Foto Bukti Transfer / Pencairan',
                                'Posisikan kamera ke bukti mutasi transfer m-banking / slip transfer teller bank / kwitansi kas BMT.'
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1 rounded bg-teal-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-teal-500 transition-colors"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>Kamera</span>
                          </button>

                          <input
                            type="file"
                            accept="image/*"
                            id="upload-bukti-cair"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'bukti_cair')}
                          />
                          <label
                            htmlFor="upload-bukti-cair"
                            className="flex-1 flex items-center justify-center gap-1 cursor-pointer rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload</span>
                          </label>
                        </div>
                        {fotoBuktiPencairan && (
                          <button
                            type="button"
                            onClick={() => setFotoBuktiPencairan('')}
                            className="w-full text-center text-[10px] text-slate-500 hover:text-rose-400 py-0.5"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Foto 4: Fisik Agunan Asli di Brankas / Khazanah */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-white leading-tight">4. Dokumen Agunan Asli</p>
                          <span className="text-[10px] text-slate-400 font-mono">Disimpan</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2 leading-tight">
                          Foto sertifikat/BPKB asli & tanda terima titipan di khazanah.
                        </p>
                        <div
                          onClick={() =>
                            fotoAgunanFisik &&
                            setPreviewImage({
                              url: fotoAgunanFisik,
                              title: 'Foto Fisik Dokumen Agunan Asli di Khazanah BMT',
                            })
                          }
                          className="aspect-[4/3] w-full rounded-lg bg-slate-800 overflow-hidden relative border border-slate-700 cursor-pointer group"
                        >
                          {fotoAgunanFisik ? (
                            <>
                              <img
                                src={fotoAgunanFisik}
                                alt="Agunan Asli"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="h-5 w-5 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-2">
                              <Lock className="h-6 w-6 text-slate-600 mb-1" />
                              <span className="text-[10px]">Opsional / Pendukung</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openCamera(
                                'agunan_fisik',
                                'Ambil Foto Dokumen Agunan Asli',
                                'Foto fisik sertifikat SHM asli atau buku BPKB asli yang telah diserahkan debitur ke petugas BMT.'
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1 rounded bg-teal-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-teal-500 transition-colors"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>Kamera</span>
                          </button>

                          <input
                            type="file"
                            accept="image/*"
                            id="upload-agunan-fisik"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'agunan_fisik')}
                          />
                          <label
                            htmlFor="upload-agunan-fisik"
                            className="flex-1 flex items-center justify-center gap-1 cursor-pointer rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload</span>
                          </label>
                        </div>
                        {fotoAgunanFisik && (
                          <button
                            type="button"
                            onClick={() => setFotoAgunanFisik('')}
                            className="w-full text-center text-[10px] text-slate-500 hover:text-rose-400 py-0.5"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 4: Submission & Branch Manager Validation Action Area */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  {/* Status Banner */}
                  {selectedApp.disbursementExecution?.status === 'validated' ? (
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <h4 className="text-sm font-bold text-white">
                            Pencairan & Pengikatan Telah Divalidasi Sah oleh Branch Manager
                          </h4>
                        </div>
                        <span className="font-mono text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                          Realisasi Tuntas
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Disahkan oleh{' '}
                        <strong className="text-white">
                          {selectedApp.disbursementExecution.bmValidation?.validatedBy || 'Branch Manager'}
                        </strong>{' '}
                        pada{' '}
                        {new Date(
                          selectedApp.disbursementExecution.bmValidation?.validatedAt || ''
                        ).toLocaleString('id-ID')}
                        .
                      </p>
                      {selectedApp.disbursementExecution.bmValidation?.notes && (
                        <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded border border-slate-800">
                          Catatan BM: "{selectedApp.disbursementExecution.bmValidation.notes}"
                        </p>
                      )}
                      <p className="text-[11px] text-emerald-300/80">
                        Hasil pencairan dan seluruh lampiran foto dokumentasi fisik dapat dipantau langsung oleh Analis Kredit dan Dewan Manajemen.
                      </p>
                    </div>
                  ) : selectedApp.disbursementExecution?.status === 'revision' ? (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-rose-400" />
                        <h4 className="text-sm font-bold text-white">
                          Instruksi Revisi Dokumen dari Branch Manager
                        </h4>
                      </div>
                      <p className="text-xs text-rose-200">
                        Catatan BM: "
                        {selectedApp.disbursementExecution.bmValidation?.notes ||
                          'Harap perbaiki lampiran foto atau lengkapi data notaris pelaksana.'}
                        "
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Silakan perbarui data di atas atau upload ulang foto dokumentasi, lalu tekan tombol kirim ulang di bawah.
                      </p>
                    </div>
                  ) : selectedApp.disbursementExecution?.status === 'pending_bm_validation' ? (
                    <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/40 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-indigo-400 animate-spin" />
                          <h4 className="text-sm font-bold text-white">
                            Berkas Sedang Menunggu Validasi Akhir Branch Manager
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                          Pending BM
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Data realisasi pencairan dan foto dokumentasi fisik telah dikirim oleh Admin Cabang (
                        {selectedApp.disbursementExecution.disbursedBy}). Menunggu supervisi dan pengesahan Branch Manager cabang {selectedApp.cabang}.
                      </p>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => printApplicationReport(selectedApp)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <Printer className="h-4 w-4 text-sky-400" />
                        <span>Cetak Laporan Lengkap</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {/* Branch Manager Validation Button (Accessible by BM or Super Admin) */}
                      {(isBranchManager || isSuperAdmin) &&
                        selectedApp.disbursementExecution?.status === 'pending_bm_validation' && (
                          <button
                            type="button"
                            onClick={() => {
                              setBmDecision('valid');
                              setBmNotes('');
                              setIsBMModalOpen(true);
                            }}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            <span>Validasi & Sahkan Pencairan (BM)</span>
                          </button>
                        )}

                      {/* Admin Cabang Submit Button */}
                      {(isBranchAdmin || isSuperAdmin) &&
                        (!selectedApp.disbursementExecution ||
                          selectedApp.disbursementExecution.status === 'revision') && (
                          <button
                            type="submit"
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition-colors shadow-md"
                          >
                            <Send className="h-4 w-4" />
                            <span>Kirim Berkas untuk Validasi BM</span>
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500 text-xs">
              <Banknote className="h-10 w-10 mx-auto text-slate-600 mb-3 opacity-40" />
              <p className="font-semibold text-slate-400 text-sm">Belum Ada Berkas Terpilih</p>
              <p className="text-slate-500 mt-1 max-w-md mx-auto">
                Pilih salah satu instruksi pencairan di sebelah kiri untuk melihat rincian perintah komite, mengisi nomor akad & notaris, serta mengunggah dokumentasi foto wajib.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Branch Manager Validation Modal */}
      {isBMModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-indigo-500/40 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Validasi Pencairan & Pengikatan (Branch Manager)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedApp.applicationNumber} · {selectedApp.namaDebitur}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBMModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nominal Dicairkan:</span>
                  <span className="font-bold text-emerald-400">
                    Rp {selectedApp.disbursementExecution?.nominalDicairkan.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nomor Akad:</span>
                  <span className="text-white">{selectedApp.disbursementExecution?.nomorAkad}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Notaris Pelaksana:</span>
                  <span className="text-white">{selectedApp.disbursementExecution?.notarisPelaksana}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Keputusan Validasi Branch Manager:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBmDecision('valid')}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 border font-bold transition-all ${
                      bmDecision === 'valid'
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Sahkan & Validasi Sah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBmDecision('revision')}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 border font-bold transition-all ${
                      bmDecision === 'revision'
                        ? 'border-rose-500 bg-rose-950/60 text-rose-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <RotateCcw className="h-4 w-4 text-rose-400" />
                    <span>Minta Revisi Dokumen</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Catatan Supervisi Branch Manager {bmDecision === 'revision' && <span className="text-rose-400">*</span>}:
                </label>
                <textarea
                  rows={3}
                  value={bmNotes}
                  onChange={(e) => setBmNotes(e.target.value)}
                  placeholder={
                    bmDecision === 'valid'
                      ? 'Catatan pengesahan (Opsional): Seluruh dokumen fisik dan bukti transfer telah diperiksa sah...'
                      : 'Tuliskan secara spesifik kekurangan dokumen yang harus diperbaiki oleh Admin Cabang...'
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBMModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBMValidationSubmit}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>Simpan Putusan BM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <DocumentCameraCapture
        isOpen={cameraConfig.isOpen}
        onClose={() => setCameraConfig((prev) => ({ ...prev, isOpen: false }))}
        onCapture={handleCameraCaptureConfirm}
        documentType="general"
        documentTitle={cameraConfig.title}
        documentDescription={cameraConfig.description}
      />

      {/* Image Preview Zoom Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950">
              <span className="text-xs font-bold text-white">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center flex-1 bg-black/60">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
