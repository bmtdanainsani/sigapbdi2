import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SURVEY_QUESTIONS, QuestionDefinition } from '../data/surveyQuestions';
import { ChecklistAnswer, AnswerStatus, SurveyCategory, CollateralData } from '../types';
import {
  calculateFinancialMetrics,
  evaluateCreditScore,
  detectFraudRedFlags,
} from '../utils/scoringEngine';
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  Calculator,
  User,
  Send,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  FileText,
  Upload,
  Sparkles,
  RotateCcw,
  Percent,
  Plus,
  Trash2,
  Layers,
  ShieldAlert,
  Check,
  Save,
  FilePlus2,
  Building2,
  UserCheck,
  Lock,
  Edit3,
} from 'lucide-react';
import { DocumentCameraCapture } from './DocumentCameraCapture';
import { analyzeKtpImage } from '../utils/ktpAnalysis';

const CATEGORIES: SurveyCategory[] = [
  'Identitas & Domisili',
  'Tujuan Pembiayaan',
  'Character',
  'Usaha/Pekerjaan',
  'Capacity',
  'Capital',
  'Jaminan',
  'Bukti Survey',
  'Fraud Red Flag',
  'Kesimpulan Survey',
];

interface FormCollateral {
  id: string;
  jenisJaminan: 'SHM' | 'BPKB Motor' | 'BPKB Mobil' | 'AJB' | 'Tabungan / Deposito' | 'Lainnya';
  nomorDokumen: string;
  atasNama: string;
  hubunganPemilik: 'Calon Kreditur' | 'Pasangan' | 'Orang Tua' | 'Pihak Lain';
  nilaiPasarTaksasi: number;
  nilaiLikuidasi: number;
  keterangan: string;
}

interface SurveyFormDraft {
  selectedOffice: string;
  selectedAoName: string;
  activeCategoryIndex: number;
  namaDebitur: string;
  nik: string;
  noKk: string;
  noHp: string;
  alamatKtp: string;
  alamatDomisili: string;
  jenisUsaha: string;
  lamaUsahaBulan: number;
  statusPernikahan: 'Menikah' | 'Belum Menikah' | 'Cerai';
  namaPasangan: string;
  plafonDiajukan: number;
  tenorBulanDiajukan: number;
  persentaseBasil: number;
  nominalAngsuran: number;
  isManualAngsuran: boolean;
  omzetBulanan: number;
  biayaHppUsaha: number;
  biayaOperasionalUsaha: number;
  kebutuhanRumahTangga: number;
  angsuranLainSaatIni: number;
  sumberPembayaran: string;
  answers: Record<number, { status: AnswerStatus; notes?: string }>;
  collaterals: FormCollateral[];
  fotoKtp: string;
  fotoKtpStatus: 'asli' | 'fotocopy';
  fotoKtpCatatanSurveyor: string;
  fotoKtpDeteksiInfo: string;
  fotoKtpPendamping: string;
  fotoKtpPendampingStatus: 'asli' | 'fotocopy';
  fotoKtpPendampingCatatanSurveyor: string;
  fotoKtpPendampingDeteksiInfo: string;
  lokasiGps: string;
  alamatDigital: string;
  fotoDebitur: string;
  fotoRumahUsaha: string;
  fotoStokAset: string;
  fotoBuktiPenghasilan: string;
  savedAt: string;
}

const DEFAULT_COLLATERAL_ITEM: FormCollateral = {
  id: 'col-1',
  jenisJaminan: 'BPKB Motor',
  nomorDokumen: '',
  atasNama: '',
  hubunganPemilik: 'Calon Kreditur',
  nilaiPasarTaksasi: 0,
  nilaiLikuidasi: 0,
  keterangan: '',
};

const getDraftStorageKey = (userId: string) => `credit_scoring_survey_draft_${userId}`;

const loadSavedDraft = (key: string): Partial<SurveyFormDraft> | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Partial<SurveyFormDraft>) : null;
  } catch {
    return null;
  }
};

export const SurveyForm: React.FC = () => {
  const {
    currentUser,
    users,
    appSettings,
    submitSurveyApplication,
    setActiveTab,
    viewApplicationDetails,
    questions,
    scoringConfig,
  } = useApp();

  const draftKey = getDraftStorageKey(currentUser.id);
  const initialDraft = useMemo(() => loadSavedDraft(draftKey), [draftKey]);
  const loadedDraftKeyRef = useRef<string>(draftKey);

  // Office & AO Selection Gate State
  const [selectedOffice, setSelectedOffice] = useState<string>(() => initialDraft?.selectedOffice ?? '');
  const [selectedAoName, setSelectedAoName] = useState<string>(() => initialDraft?.selectedAoName ?? '');
  const [aoInputMode, setAoInputMode] = useState<'select' | 'manual'>('select');
  const [manualAoInput, setManualAoInput] = useState<string>('');
  const [isEditingOfficeAo, setIsEditingOfficeAo] = useState<boolean>(
    () => !(Boolean(initialDraft?.selectedOffice?.trim()) && Boolean(initialDraft?.selectedAoName?.trim()))
  );

  // Build available offices from Super Admin catalog + registered staff branches
  const officeOptions = useMemo(() => {
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
    return Array.from(map.values());
  }, [appSettings.officeAoCatalog, users]);

  // Build available AO names for the selected office
  const aoOptionsForSelectedOffice = useMemo(() => {
    if (!selectedOffice.trim()) return [];
    const targetLower = selectedOffice.trim().toLowerCase();
    const map = new Map<string, string>();

    (appSettings.officeAoCatalog || []).forEach((entry) => {
      if (entry.officeName.trim().toLowerCase() === targetLower) {
        entry.aoNames.forEach((ao) => {
          const clean = ao.trim();
          if (clean && !map.has(clean.toLowerCase())) {
            map.set(clean.toLowerCase(), clean);
          }
        });
      }
    });

    users.forEach((u) => {
      if (
        u.role === 'marketing' &&
        (u.branch || '').trim().toLowerCase() === targetLower &&
        u.name.trim()
      ) {
        const clean = u.name.trim();
        if (!map.has(clean.toLowerCase())) {
          map.set(clean.toLowerCase(), clean);
        }
      }
    });

    return Array.from(map.values());
  }, [selectedOffice, appSettings.officeAoCatalog, users]);

  const isOfficeAndAoSelected = Boolean(selectedOffice.trim() && selectedAoName.trim());

  // Active Questions (exclude deactivated questions by Super Admin)
  const activeQuestions = useMemo(() => {
    return questions.filter((q) => q.isActive !== false);
  }, [questions]);

  // Active Category Step
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(() =>
    typeof initialDraft?.activeCategoryIndex === 'number' &&
    initialDraft.activeCategoryIndex >= 0 &&
    initialDraft.activeCategoryIndex < CATEGORIES.length
      ? initialDraft.activeCategoryIndex
      : 0
  );
  const currentCategory = CATEGORIES[activeCategoryIndex];

  // Debitur basic info state
  const [namaDebitur, setNamaDebitur] = useState(() => initialDraft?.namaDebitur ?? '');
  const [nik, setNik] = useState(() => initialDraft?.nik ?? '');
  const [noKk, setNoKk] = useState(() => initialDraft?.noKk ?? '');
  const [noHp, setNoHp] = useState(() => initialDraft?.noHp ?? '');
  const [alamatKtp, setAlamatKtp] = useState(() => initialDraft?.alamatKtp ?? '');
  const [alamatDomisili, setAlamatDomisili] = useState(() => initialDraft?.alamatDomisili ?? '');
  const [jenisUsaha, setJenisUsaha] = useState(() => initialDraft?.jenisUsaha ?? '');
  const [lamaUsahaBulan, setLamaUsahaBulan] = useState<number>(() => initialDraft?.lamaUsahaBulan ?? 0);
  const [statusPernikahan, setStatusPernikahan] = useState<'Menikah' | 'Belum Menikah' | 'Cerai'>(
    () => initialDraft?.statusPernikahan ?? 'Menikah'
  );
  const [namaPasangan, setNamaPasangan] = useState(() => initialDraft?.namaPasangan ?? '');

  // Default basil dari konfigurasi lembaga (default 12% p.a.)
  const defaultBasil = scoringConfig?.financialSettings?.annualMarginRate
    ? Number((scoringConfig.financialSettings.annualMarginRate * 100).toFixed(2))
    : 12;

  // Financial Capacity State
  const [plafonDiajukan, setPlafonDiajukan] = useState<number>(() => initialDraft?.plafonDiajukan ?? 0);
  const [tenorBulanDiajukan, setTenorBulanDiajukan] = useState<number>(() => initialDraft?.tenorBulanDiajukan ?? 12);
  const [persentaseBasil, setPersentaseBasil] = useState<number>(() =>
    typeof initialDraft?.persentaseBasil === 'number' ? initialDraft.persentaseBasil : defaultBasil
  );
  const [nominalAngsuran, setNominalAngsuran] = useState<number>(() => initialDraft?.nominalAngsuran ?? 0);
  const [isManualAngsuran, setIsManualAngsuran] = useState<boolean>(() => initialDraft?.isManualAngsuran ?? false);
  const [omzetBulanan, setOmzetBulanan] = useState<number>(() => initialDraft?.omzetBulanan ?? 0);
  const [biayaHppUsaha, setBiayaHppUsaha] = useState<number>(() => initialDraft?.biayaHppUsaha ?? 0);
  const [biayaOperasionalUsaha, setBiayaOperasionalUsaha] = useState<number>(
    () => initialDraft?.biayaOperasionalUsaha ?? 0
  );
  const [kebutuhanRumahTangga, setKebutuhanRumahTangga] = useState<number>(
    () => initialDraft?.kebutuhanRumahTangga ?? 0
  );
  const [angsuranLainSaatIni, setAngsuranLainSaatIni] = useState<number>(
    () => initialDraft?.angsuranLainSaatIni ?? 0
  );
  const [sumberPembayaran, setSumberPembayaran] = useState(() => initialDraft?.sumberPembayaran ?? '');

  // Auto-sync nominal angsuran from basil & plafon & tenor when not customized manually
  useEffect(() => {
    if (!isManualAngsuran) {
      const tenor = Math.max(1, tenorBulanDiajukan);
      const marginRate = (Number(persentaseBasil) || 0) / 100;
      const totalMargin = Math.round(plafonDiajukan * (marginRate * (tenor / 12)));
      const totalKewajiban = plafonDiajukan + totalMargin;
      const autoAngsuran = plafonDiajukan > 0 ? Math.round(totalKewajiban / tenor) : 0;
      setNominalAngsuran(autoAngsuran);
    }
  }, [plafonDiajukan, tenorBulanDiajukan, persentaseBasil, isManualAngsuran]);

  // Survey checklist answers state
  const [answers, setAnswers] = useState<Record<number, { status: AnswerStatus; notes?: string }>>(
    () => initialDraft?.answers ?? {}
  );
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(() => initialDraft?.savedAt ?? null);
  const [isConfirmingNewForm, setIsConfirmingNewForm] = useState(false);

  // Financial metrics computation
  const financialMetrics = useMemo(() => {
    return calculateFinancialMetrics(
      omzetBulanan,
      biayaHppUsaha,
      biayaOperasionalUsaha,
      kebutuhanRumahTangga,
      angsuranLainSaatIni,
      plafonDiajukan,
      tenorBulanDiajukan,
      scoringConfig,
      persentaseBasil,
      nominalAngsuran
    );
  }, [
    omzetBulanan,
    biayaHppUsaha,
    biayaOperasionalUsaha,
    kebutuhanRumahTangga,
    angsuranLainSaatIni,
    plafonDiajukan,
    tenorBulanDiajukan,
    scoringConfig,
    persentaseBasil,
    nominalAngsuran,
  ]);

  // Multi-Collateral State (Maksimal 10 Agunan)
  const [collaterals, setCollaterals] = useState<FormCollateral[]>(() =>
    Array.isArray(initialDraft?.collaterals) && initialDraft.collaterals.length > 0
      ? initialDraft.collaterals
      : [{ ...DEFAULT_COLLATERAL_ITEM }]
  );

  const addCollateral = () => {
    if (collaterals.length >= 10) return;
    setCollaterals((prev) => [
      ...prev,
      {
        id: `col-${Date.now()}-${prev.length + 1}`,
        jenisJaminan: 'BPKB Motor',
        nomorDokumen: '',
        atasNama: namaDebitur || '',
        hubunganPemilik: 'Calon Kreditur',
        nilaiPasarTaksasi: 0,
        nilaiLikuidasi: 0,
        keterangan: '',
      },
    ]);
  };

  const removeCollateral = (index: number) => {
    if (collaterals.length <= 1) return;
    setCollaterals((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateCollateral = (index: number, field: keyof FormCollateral, value: any) => {
    setCollaterals((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Evidence state: Foto KTP Calon Debitur
  const [fotoKtp, setFotoKtp] = useState(() => initialDraft?.fotoKtp ?? '');
  const [fotoKtpStatus, setFotoKtpStatus] = useState<'asli' | 'fotocopy'>(
    () => initialDraft?.fotoKtpStatus ?? 'asli'
  );
  const [fotoKtpCatatanSurveyor, setFotoKtpCatatanSurveyor] = useState(
    () => initialDraft?.fotoKtpCatatanSurveyor ?? ''
  );
  const [fotoKtpDeteksiInfo, setFotoKtpDeteksiInfo] = useState(() => initialDraft?.fotoKtpDeteksiInfo ?? '');
  const [isAnalyzingKtpDebitur, setIsAnalyzingKtpDebitur] = useState(false);

  // Evidence state: Foto KTP Pendamping (Istri jika menikah, Orang Tua jika belum menikah)
  const [fotoKtpPendamping, setFotoKtpPendamping] = useState(() => initialDraft?.fotoKtpPendamping ?? '');
  const [fotoKtpPendampingStatus, setFotoKtpPendampingStatus] = useState<'asli' | 'fotocopy'>(
    () => initialDraft?.fotoKtpPendampingStatus ?? 'asli'
  );
  const [fotoKtpPendampingCatatanSurveyor, setFotoKtpPendampingCatatanSurveyor] = useState(
    () => initialDraft?.fotoKtpPendampingCatatanSurveyor ?? ''
  );
  const [fotoKtpPendampingDeteksiInfo, setFotoKtpPendampingDeteksiInfo] = useState(
    () => initialDraft?.fotoKtpPendampingDeteksiInfo ?? ''
  );
  const [isAnalyzingKtpPendamping, setIsAnalyzingKtpPendamping] = useState(false);

  const [lokasiGps, setLokasiGps] = useState(() => initialDraft?.lokasiGps ?? '');
  const [alamatDigital, setAlamatDigital] = useState(() => initialDraft?.alamatDigital ?? '');
  const [fotoDebitur, setFotoDebitur] = useState(() => initialDraft?.fotoDebitur ?? '');
  const [fotoRumahUsaha, setFotoRumahUsaha] = useState(() => initialDraft?.fotoRumahUsaha ?? '');
  const [fotoStokAset, setFotoStokAset] = useState(() => initialDraft?.fotoStokAset ?? '');
  const [fotoBuktiPenghasilan, setFotoBuktiPenghasilan] = useState(
    () => initialDraft?.fotoBuktiPenghasilan ?? ''
  );
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const hasDraftContent = useMemo(() => {
    const hasCollateralFilled =
      collaterals.length > 1 ||
      collaterals.some(
        (c) =>
          c.nomorDokumen.trim() !== '' ||
          c.atasNama.trim() !== '' ||
          Number(c.nilaiPasarTaksasi) > 0 ||
          Number(c.nilaiLikuidasi) > 0 ||
          c.keterangan.trim() !== '' ||
          c.jenisJaminan !== 'BPKB Motor' ||
          c.hubunganPemilik !== 'Calon Kreditur'
      );

    return Boolean(
      selectedOffice.trim() ||
        selectedAoName.trim() ||
        activeCategoryIndex > 0 ||
        namaDebitur.trim() ||
        nik.trim() ||
        noKk.trim() ||
        noHp.trim() ||
        alamatKtp.trim() ||
        alamatDomisili.trim() ||
        jenisUsaha.trim() ||
        lamaUsahaBulan > 0 ||
        namaPasangan.trim() ||
        plafonDiajukan > 0 ||
        tenorBulanDiajukan !== 12 ||
        isManualAngsuran ||
        omzetBulanan > 0 ||
        biayaHppUsaha > 0 ||
        biayaOperasionalUsaha > 0 ||
        kebutuhanRumahTangga > 0 ||
        angsuranLainSaatIni > 0 ||
        sumberPembayaran.trim() ||
        Object.keys(answers).length > 0 ||
        hasCollateralFilled ||
        fotoKtp ||
        fotoKtpPendamping ||
        fotoDebitur ||
        fotoRumahUsaha ||
        fotoStokAset ||
        fotoBuktiPenghasilan ||
        lokasiGps.trim() ||
        alamatDigital.trim()
    );
  }, [
    selectedOffice,
    selectedAoName,
    activeCategoryIndex,
    namaDebitur,
    nik,
    noKk,
    noHp,
    alamatKtp,
    alamatDomisili,
    jenisUsaha,
    lamaUsahaBulan,
    namaPasangan,
    plafonDiajukan,
    tenorBulanDiajukan,
    isManualAngsuran,
    omzetBulanan,
    biayaHppUsaha,
    biayaOperasionalUsaha,
    kebutuhanRumahTangga,
    angsuranLainSaatIni,
    sumberPembayaran,
    answers,
    collaterals,
    fotoKtp,
    fotoKtpPendamping,
    fotoDebitur,
    fotoRumahUsaha,
    fotoStokAset,
    fotoBuktiPenghasilan,
    lokasiGps,
    alamatDigital,
  ]);

  // Reload draft safely when switching accounts while component remains mounted
  useEffect(() => {
    if (loadedDraftKeyRef.current === draftKey) return;
    const saved = loadSavedDraft(draftKey);
    loadedDraftKeyRef.current = draftKey;

    const restoredOffice = saved?.selectedOffice ?? '';
    const restoredAo = saved?.selectedAoName ?? '';
    setSelectedOffice(restoredOffice);
    setSelectedAoName(restoredAo);
    setManualAoInput('');
    setAoInputMode('select');
    setIsEditingOfficeAo(!(Boolean(restoredOffice.trim()) && Boolean(restoredAo.trim())));

    setActiveCategoryIndex(
      typeof saved?.activeCategoryIndex === 'number' &&
        saved.activeCategoryIndex >= 0 &&
        saved.activeCategoryIndex < CATEGORIES.length
        ? saved.activeCategoryIndex
        : 0
    );
    setNamaDebitur(saved?.namaDebitur ?? '');
    setNik(saved?.nik ?? '');
    setNoKk(saved?.noKk ?? '');
    setNoHp(saved?.noHp ?? '');
    setAlamatKtp(saved?.alamatKtp ?? '');
    setAlamatDomisili(saved?.alamatDomisili ?? '');
    setJenisUsaha(saved?.jenisUsaha ?? '');
    setLamaUsahaBulan(saved?.lamaUsahaBulan ?? 0);
    setStatusPernikahan(saved?.statusPernikahan ?? 'Menikah');
    setNamaPasangan(saved?.namaPasangan ?? '');
    setPlafonDiajukan(saved?.plafonDiajukan ?? 0);
    setTenorBulanDiajukan(saved?.tenorBulanDiajukan ?? 12);
    setPersentaseBasil(typeof saved?.persentaseBasil === 'number' ? saved.persentaseBasil : defaultBasil);
    setNominalAngsuran(saved?.nominalAngsuran ?? 0);
    setIsManualAngsuran(saved?.isManualAngsuran ?? false);
    setOmzetBulanan(saved?.omzetBulanan ?? 0);
    setBiayaHppUsaha(saved?.biayaHppUsaha ?? 0);
    setBiayaOperasionalUsaha(saved?.biayaOperasionalUsaha ?? 0);
    setKebutuhanRumahTangga(saved?.kebutuhanRumahTangga ?? 0);
    setAngsuranLainSaatIni(saved?.angsuranLainSaatIni ?? 0);
    setSumberPembayaran(saved?.sumberPembayaran ?? '');
    setAnswers(saved?.answers ?? {});
    setCollaterals(
      Array.isArray(saved?.collaterals) && saved.collaterals.length > 0
        ? saved.collaterals
        : [{ ...DEFAULT_COLLATERAL_ITEM }]
    );
    setFotoKtp(saved?.fotoKtp ?? '');
    setFotoKtpStatus(saved?.fotoKtpStatus ?? 'asli');
    setFotoKtpCatatanSurveyor(saved?.fotoKtpCatatanSurveyor ?? '');
    setFotoKtpDeteksiInfo(saved?.fotoKtpDeteksiInfo ?? '');
    setFotoKtpPendamping(saved?.fotoKtpPendamping ?? '');
    setFotoKtpPendampingStatus(saved?.fotoKtpPendampingStatus ?? 'asli');
    setFotoKtpPendampingCatatanSurveyor(saved?.fotoKtpPendampingCatatanSurveyor ?? '');
    setFotoKtpPendampingDeteksiInfo(saved?.fotoKtpPendampingDeteksiInfo ?? '');
    setLokasiGps(saved?.lokasiGps ?? '');
    setAlamatDigital(saved?.alamatDigital ?? '');
    setFotoDebitur(saved?.fotoDebitur ?? '');
    setFotoRumahUsaha(saved?.fotoRumahUsaha ?? '');
    setFotoStokAset(saved?.fotoStokAset ?? '');
    setFotoBuktiPenghasilan(saved?.fotoBuktiPenghasilan ?? '');
    setDraftSavedAt(saved?.savedAt ?? null);
    setFormError(null);
    setIsConfirmingNewForm(false);
  }, [draftKey, defaultBasil]);

  // Auto-save half-filled survey form draft to localStorage
  useEffect(() => {
    if (loadedDraftKeyRef.current !== draftKey) return;
    if (!hasDraftContent) {
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      setDraftSavedAt(null);
      return;
    }

    const nowIso = new Date().toISOString();
    const draftPayload: SurveyFormDraft = {
      selectedOffice,
      selectedAoName,
      activeCategoryIndex,
      namaDebitur,
      nik,
      noKk,
      noHp,
      alamatKtp,
      alamatDomisili,
      jenisUsaha,
      lamaUsahaBulan,
      statusPernikahan,
      namaPasangan,
      plafonDiajukan,
      tenorBulanDiajukan,
      persentaseBasil,
      nominalAngsuran,
      isManualAngsuran,
      omzetBulanan,
      biayaHppUsaha,
      biayaOperasionalUsaha,
      kebutuhanRumahTangga,
      angsuranLainSaatIni,
      sumberPembayaran,
      answers,
      collaterals,
      fotoKtp,
      fotoKtpStatus,
      fotoKtpCatatanSurveyor,
      fotoKtpDeteksiInfo,
      fotoKtpPendamping,
      fotoKtpPendampingStatus,
      fotoKtpPendampingCatatanSurveyor,
      fotoKtpPendampingDeteksiInfo,
      lokasiGps,
      alamatDigital,
      fotoDebitur,
      fotoRumahUsaha,
      fotoStokAset,
      fotoBuktiPenghasilan,
      savedAt: nowIso,
    };

    try {
      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
      setDraftSavedAt(nowIso);
    } catch {
      // Fallback: if base64 images exceed localStorage quota, keep all form inputs & checklist answers
      try {
        const textOnlyDraft: SurveyFormDraft = {
          ...draftPayload,
          fotoKtp: '',
          fotoKtpPendamping: '',
          fotoDebitur: '',
          fotoRumahUsaha: '',
          fotoStokAset: '',
          fotoBuktiPenghasilan: '',
        };
        localStorage.setItem(draftKey, JSON.stringify(textOnlyDraft));
        setDraftSavedAt(nowIso);
      } catch (innerErr) {
        console.warn('Gagal menyimpan draft form survey:', innerErr);
      }
    }
  }, [
    draftKey,
    hasDraftContent,
    selectedOffice,
    selectedAoName,
    activeCategoryIndex,
    namaDebitur,
    nik,
    noKk,
    noHp,
    alamatKtp,
    alamatDomisili,
    jenisUsaha,
    lamaUsahaBulan,
    statusPernikahan,
    namaPasangan,
    plafonDiajukan,
    tenorBulanDiajukan,
    persentaseBasil,
    nominalAngsuran,
    isManualAngsuran,
    omzetBulanan,
    biayaHppUsaha,
    biayaOperasionalUsaha,
    kebutuhanRumahTangga,
    angsuranLainSaatIni,
    sumberPembayaran,
    answers,
    collaterals,
    fotoKtp,
    fotoKtpStatus,
    fotoKtpCatatanSurveyor,
    fotoKtpDeteksiInfo,
    fotoKtpPendamping,
    fotoKtpPendampingStatus,
    fotoKtpPendampingCatatanSurveyor,
    fotoKtpPendampingDeteksiInfo,
    lokasiGps,
    alamatDigital,
    fotoDebitur,
    fotoRumahUsaha,
    fotoStokAset,
    fotoBuktiPenghasilan,
  ]);

  // Document Camera Capture Modal State
  const [cameraModalConfig, setCameraModalConfig] = useState<{
    isOpen: boolean;
    documentType: 'ktp' | 'income' | 'general';
    documentTitle: string;
    documentDescription?: string;
    targetField: 'fotoKtp' | 'fotoKtpPendamping' | 'fotoBuktiPenghasilan' | 'fotoDebitur' | 'fotoRumahUsaha' | 'fotoStokAset';
  }>({
    isOpen: false,
    documentType: 'ktp',
    documentTitle: 'Foto KTP Asli Calon Debitur',
    targetField: 'fotoKtp',
  });

  const openCameraCapture = (
    targetField: 'fotoKtp' | 'fotoKtpPendamping' | 'fotoBuktiPenghasilan' | 'fotoDebitur' | 'fotoRumahUsaha' | 'fotoStokAset',
    documentType: 'ktp' | 'income' | 'general',
    documentTitle: string,
    documentDescription?: string
  ) => {
    setCameraModalConfig({
      isOpen: true,
      documentType,
      documentTitle,
      documentDescription,
      targetField,
    });
  };

  const handleCameraCaptureConfirm = async (imageDataUrl: string) => {
    if (cameraModalConfig.targetField === 'fotoKtp') {
      setFotoKtp(imageDataUrl);
      setIsAnalyzingKtpDebitur(true);
      try {
        const res = await analyzeKtpImage(imageDataUrl);
        setFotoKtpStatus(res.status);
        setFotoKtpDeteksiInfo(`${res.label} (${res.confidence}%) - ${res.reason}`);
      } finally {
        setIsAnalyzingKtpDebitur(false);
      }
    } else if (cameraModalConfig.targetField === 'fotoKtpPendamping') {
      setFotoKtpPendamping(imageDataUrl);
      setIsAnalyzingKtpPendamping(true);
      try {
        const res = await analyzeKtpImage(imageDataUrl);
        setFotoKtpPendampingStatus(res.status);
        setFotoKtpPendampingDeteksiInfo(`${res.label} (${res.confidence}%) - ${res.reason}`);
      } finally {
        setIsAnalyzingKtpPendamping(false);
      }
    } else if (cameraModalConfig.targetField === 'fotoBuktiPenghasilan') {
      setFotoBuktiPenghasilan(imageDataUrl);
    } else if (cameraModalConfig.targetField === 'fotoDebitur') {
      setFotoDebitur(imageDataUrl);
    } else if (cameraModalConfig.targetField === 'fotoRumahUsaha') {
      setFotoRumahUsaha(imageDataUrl);
    } else if (cameraModalConfig.targetField === 'fotoStokAset') {
      setFotoStokAset(imageDataUrl);
    }
  };

  // Aggregation of all collaterals
  const totalNilaiPasarTaksasi = useMemo(() => {
    return collaterals.reduce((sum, c) => sum + (Number(c.nilaiPasarTaksasi) || 0), 0);
  }, [collaterals]);

  const totalNilaiLikuidasi = useMemo(() => {
    return collaterals.reduce((sum, c) => sum + (Number(c.nilaiLikuidasi) || 0), 0);
  }, [collaterals]);

  const aggregateLtv = useMemo(() => {
    return totalNilaiPasarTaksasi > 0 ? (plafonDiajukan / totalNilaiPasarTaksasi) * 100 : 0;
  }, [plafonDiajukan, totalNilaiPasarTaksasi]);

  // Primary collateral object for scoring engine and backward compatibility
  const collateralData: CollateralData = useMemo(() => {
    const first = collaterals[0] || {
      id: 'col-1',
      jenisJaminan: 'BPKB Motor',
      nomorDokumen: '',
      atasNama: '',
      hubunganPemilik: 'Calon Kreditur',
      nilaiPasarTaksasi: 0,
      nilaiLikuidasi: 0,
      keterangan: '',
    };

    return {
      id: first.id,
      jenisJaminan: collaterals.length === 1 ? first.jenisJaminan : 'Lainnya',
      nomorDokumen: collaterals.map((c, i) => `#${i + 1} [${c.jenisJaminan}] ${c.nomorDokumen || '-'}`).join(', '),
      atasNama: first.atasNama || namaDebitur || '-',
      hubunganPemilik: first.hubunganPemilik,
      nilaiPasarTaksasi: totalNilaiPasarTaksasi,
      nilaiLikuidasi: totalNilaiLikuidasi,
      persentaseLtv: Math.round(aggregateLtv * 10) / 10,
      keterangan: collaterals.map((c, i) => `Agunan ${i + 1} (${c.jenisJaminan} - ${c.nomorDokumen || '-'}): ${c.keterangan || 'Fisik baik'}`).join(' | '),
    };
  }, [collaterals, totalNilaiPasarTaksasi, totalNilaiLikuidasi, aggregateLtv, namaDebitur]);

  // Full array of individual collaterals (up to 10)
  const fullCollateralList: CollateralData[] = useMemo(() => {
    return collaterals.map((c) => ({
      id: c.id,
      jenisJaminan: c.jenisJaminan,
      nomorDokumen: c.nomorDokumen.trim() || '-',
      atasNama: c.atasNama.trim() || namaDebitur.trim() || '-',
      hubunganPemilik: c.hubunganPemilik,
      nilaiPasarTaksasi: Number(c.nilaiPasarTaksasi) || 0,
      nilaiLikuidasi: Number(c.nilaiLikuidasi) || 0,
      persentaseLtv: Number(c.nilaiPasarTaksasi) > 0 ? Math.round((plafonDiajukan / Number(c.nilaiPasarTaksasi)) * 100) : 0,
      keterangan: c.keterangan.trim() || 'Fisik dan dokumen agunan lengkap.',
    }));
  }, [collaterals, plafonDiajukan, namaDebitur]);

  // Convert answers record to array for engine using activeQuestions
  const answersList: ChecklistAnswer[] = useMemo(() => {
    return activeQuestions.map((q) => ({
      questionId: q.id,
      code: q.code,
      status: answers[q.id]?.status || 'sesuai',
      notes: answers[q.id]?.notes || '',
    }));
  }, [answers, activeQuestions]);

  // Live Credit Scoring calculation based on activeQuestions
  const liveScoring = useMemo(() => {
    const fullFinancial = {
      omzetBulanan,
      biayaHppUsaha,
      biayaOperasionalUsaha,
      kebutuhanRumahTangga,
      angsuranLainSaatIni,
      plafonDiajukan,
      tenorBulanDiajukan,
      sumberPembayaran,
      ...financialMetrics,
    };
    return evaluateCreditScore(answersList, fullFinancial, collateralData, activeQuestions, scoringConfig);
  }, [answersList, omzetBulanan, biayaHppUsaha, biayaOperasionalUsaha, kebutuhanRumahTangga, angsuranLainSaatIni, plafonDiajukan, tenorBulanDiajukan, sumberPembayaran, financialMetrics, collateralData, activeQuestions, scoringConfig]);

  const liveFraudEvaluation = useMemo(() => {
    return detectFraudRedFlags(answersList, activeQuestions);
  }, [answersList, activeQuestions]);

  // Handler for question status change
  const handleAnswerChange = (questionId: number, status: AnswerStatus) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        status,
      },
    }));
  };

  const handleNotesChange = (questionId: number, notes: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        notes,
      },
    }));
  };

  // GPS Geolocation Handler
  const handleCaptureGps = () => {
    setIsGettingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setLokasiGps(`${lat}, ${lng}`);
          setAlamatDigital(`Geotagging Akurat GPS (${lat}, ${lng}) - Lokasi Survey Aktual`);
          setIsGettingGps(false);
        },
        (error) => {
          setIsGettingGps(false);
          setFormError('Tidak dapat mendeteksi koordinat GPS otomatis (' + (error.message || 'Izin lokasi tidak diberikan') + '). Anda dapat memasukkan alamat secara manual.');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setIsGettingGps(false);
      setFormError('Fitur Geolocation tidak didukung pada peramban ini.');
    }
  };

  // Reset form fields and clear persisted draft (triggered after submit or explicit "Buat Form Baru")
  const resetForm = () => {
    setSelectedOffice('');
    setSelectedAoName('');
    setManualAoInput('');
    setAoInputMode('select');
    setIsEditingOfficeAo(true);
    setActiveCategoryIndex(0);
    setAnswers({});
    setIsConfirmingNewForm(false);

    setNamaDebitur('');
    setNik('');
    setNoKk('');
    setNoHp('');
    setAlamatKtp('');
    setAlamatDomisili('');
    setJenisUsaha('');
    setLamaUsahaBulan(0);
    setStatusPernikahan('Menikah');
    setNamaPasangan('');

    setPlafonDiajukan(0);
    setTenorBulanDiajukan(12);
    setPersentaseBasil(defaultBasil);
    setNominalAngsuran(0);
    setIsManualAngsuran(false);
    setOmzetBulanan(0);
    setBiayaHppUsaha(0);
    setBiayaOperasionalUsaha(0);
    setKebutuhanRumahTangga(0);
    setAngsuranLainSaatIni(0);
    setSumberPembayaran('');

    setCollaterals([{ ...DEFAULT_COLLATERAL_ITEM }]);

    setFotoKtp('');
    setFotoKtpStatus('asli');
    setFotoKtpCatatanSurveyor('');
    setFotoKtpDeteksiInfo('');

    setFotoKtpPendamping('');
    setFotoKtpPendampingStatus('asli');
    setFotoKtpPendampingCatatanSurveyor('');
    setFotoKtpPendampingDeteksiInfo('');

    setFotoDebitur('');
    setFotoRumahUsaha('');
    setFotoStokAset('');
    setFotoBuktiPenghasilan('');
    setLokasiGps('');
    setAlamatDigital('');
    setFormError(null);
    setDraftSavedAt(null);

    try {
      localStorage.removeItem(draftKey);
    } catch {}
  };

  // Helper to surface validation error clearly regardless of scroll position
  const showValidationError = (msg: string) => {
    setFormError(msg);
    const errEl = document.getElementById('survey-form-error-bottom') || document.getElementById('survey-form-error-top');
    if (errEl) {
      errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Submit Handler with inline validation (no alert)
  const handleSubmitSurvey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!selectedOffice.trim()) {
      showValidationError('Pilihan Kantor / Cabang wajib dipilih terlebih dahulu.');
      return;
    }

    if (!selectedAoName.trim()) {
      showValidationError('Nama Account Officer (AO) wajib dipilih atau diisi secara manual.');
      return;
    }

    if (!namaDebitur.trim()) {
      showValidationError('Nama lengkap calon debitur wajib diisi sesuai KTP.');
      return;
    }

    const cleanNik = nik.replace(/\D/g, '');
    if (cleanNik.length < 16) {
      showValidationError(
        `Nomor Induk Kependudukan (NIK) wajib 16 digit angka (saat ini ${cleanNik.length} digit). Sistem menolak pengajuan jika NIK kurang dari 16 digit.`
      );
      return;
    }

    const cleanNoKk = noKk.replace(/\D/g, '');
    if (cleanNoKk.length < 16) {
      showValidationError(
        `Nomor Kartu Keluarga (KK) wajib diisi dan minimal 16 digit angka (saat ini ${cleanNoKk.length} digit). Sistem menolak pengajuan jika No KK kurang dari 16 digit.`
      );
      return;
    }

    const cleanNoHp = noHp.replace(/\D/g, '');
    if (cleanNoHp.length < 10) {
      showValidationError(
        `Nomor HP / WhatsApp wajib diisi dan minimal 10 digit angka (saat ini ${cleanNoHp.length} digit). Sistem menolak pengajuan jika nomor HP kurang dari 10 digit.`
      );
      return;
    }

    if (!alamatDomisili.trim()) {
      showValidationError('Alamat domisili aktual hasil survey lapangan wajib diisi.');
      return;
    }

    if (!jenisUsaha.trim()) {
      showValidationError('Bidang / jenis usaha calon debitur wajib diisi.');
      return;
    }

    if (plafonDiajukan <= 0) {
      showValidationError('Plafon pembiayaan yang diajukan harus lebih dari Rp 0.');
      return;
    }

    // Validasi Foto KTP Calon Debitur
    if (!fotoKtp) {
      showValidationError('Lampiran foto e-KTP calon debitur wajib diambil / diunggah!');
      return;
    }

    if (fotoKtpStatus === 'fotocopy' && !fotoKtpCatatanSurveyor.trim()) {
      showValidationError(
        'Foto e-KTP calon debitur teridentifikasi sebagai Hasil Cetak / Fotocopy. Surveyor wajib mengisi kolom keterangan / alasan di bawah foto KTP!'
      );
      return;
    }

    // Validasi Wajib KTP Pendamping berdasarkan Status Pernikahan
    if (statusPernikahan === 'Menikah') {
      if (!fotoKtpPendamping) {
        showValidationError(
          'Karena status debitur Menikah, lampiran foto e-KTP Istri / Pasangan wajib dilampirkan!'
        );
        return;
      }
      if (fotoKtpPendampingStatus === 'fotocopy' && !fotoKtpPendampingCatatanSurveyor.trim()) {
        showValidationError(
          'Foto e-KTP Istri / Pasangan berstatus Hasil Cetak / Fotocopy. Surveyor wajib mengisi kolom keterangan / alasan mengapa bukan e-KTP asli fisik!'
        );
        return;
      }
    } else if (statusPernikahan === 'Belum Menikah') {
      if (!fotoKtpPendamping) {
        showValidationError(
          'Karena status debitur Belum Menikah, lampiran foto e-KTP Orang Tua (Ayah / Ibu Kandung) wajib dilampirkan!'
        );
        return;
      }
      if (fotoKtpPendampingStatus === 'fotocopy' && !fotoKtpPendampingCatatanSurveyor.trim()) {
        showValidationError(
          'Foto e-KTP Orang Tua berstatus Hasil Cetak / Fotocopy. Surveyor wajib mengisi kolom keterangan / alasan mengapa bukan e-KTP asli fisik!'
        );
        return;
      }
    } else if (statusPernikahan === 'Cerai') {
      if (fotoKtpPendamping && fotoKtpPendampingStatus === 'fotocopy' && !fotoKtpPendampingCatatanSurveyor.trim()) {
        showValidationError(
          'Foto e-KTP Penjamin / Ahli Waris berstatus Hasil Cetak / Fotocopy. Surveyor wajib mengisi kolom keterangan / alasan!'
        );
        return;
      }
    }

    // Validasi Minimal Ada 1 Agunan
    if (collaterals.length === 0) {
      showValidationError('Minimal harus ada 1 agunan / jaminan yang didaftarkan.');
      return;
    }

    const fullFinancial = {
      omzetBulanan,
      biayaHppUsaha,
      biayaOperasionalUsaha,
      kebutuhanRumahTangga,
      angsuranLainSaatIni,
      plafonDiajukan,
      tenorBulanDiajukan,
      sumberPembayaran: sumberPembayaran.trim() || 'Hasil usaha operasional',
      ...financialMetrics,
    };

    const evidenceData = {
      fotoKtp,
      fotoKtpStatus,
      fotoKtpCatatanSurveyor: fotoKtpCatatanSurveyor.trim() || undefined,
      fotoKtpDeteksiInfo: fotoKtpDeteksiInfo || undefined,
      fotoKtpPendamping: fotoKtpPendamping || undefined,
      fotoKtpPendampingType: (statusPernikahan === 'Menikah' ? 'pasangan' : statusPernikahan === 'Belum Menikah' ? 'orang_tua' : 'wali') as 'pasangan' | 'orang_tua' | 'wali',
      fotoKtpPendampingLabel: statusPernikahan === 'Menikah' ? 'Foto e-KTP Istri / Pasangan' : statusPernikahan === 'Belum Menikah' ? 'Foto e-KTP Orang Tua (Ayah/Ibu)' : 'Foto e-KTP Penjamin / Ahli Waris',
      fotoKtpPendampingStatus,
      fotoKtpPendampingCatatanSurveyor: fotoKtpPendampingCatatanSurveyor.trim() || undefined,
      fotoKtpPendampingDeteksiInfo: fotoKtpPendampingDeteksiInfo || undefined,
      fotoDebitur,
      fotoRumahUsaha,
      fotoStokAset,
      fotoBuktiPenghasilan,
      lokasiGps: lokasiGps || 'Koordinat belum direkam',
      alamatDigital: alamatDigital || 'Alamat fisik terlampir pada berkas survey',
      tanggalSurvey: new Date().toISOString().slice(0, 10),
      surveyorName: selectedAoName.trim() || currentUser.name || 'Account Officer',
    };

    const createdApp = submitSurveyApplication({
      namaDebitur: namaDebitur.trim(),
      nik: cleanNik,
      noKk: cleanNoKk,
      noHp: cleanNoHp,
      alamatKtp: alamatKtp.trim() || alamatDomisili.trim(),
      alamatDomisili: alamatDomisili.trim(),
      jenisUsaha: jenisUsaha.trim(),
      lamaUsahaBulan: Number(lamaUsahaBulan) || 12,
      statusPernikahan,
      namaPasangan: namaPasangan.trim() || undefined,
      checklistAnswers: answersList,
      financial: fullFinancial,
      collateral: collateralData,
      collaterals: fullCollateralList,
      evidence: evidenceData,
      selectedCabang: selectedOffice.trim(),
      selectedAoName: selectedAoName.trim(),
    });

    // Reset form fields cleanly so next survey starts fresh
    resetForm();

    // Immediately switch tab to Daftar Pengajuan so the user sees the new entry!
    setActiveTab('applications_list');

    // Also open details modal to preview full credit scoring results
    viewApplicationDetails(createdApp);
  };

  // Filter current questions using activeQuestions
  const currentCategoryQuestions = useMemo(() => {
    return activeQuestions.filter((q) => q.category === currentCategory);
  }, [activeQuestions, currentCategory]);

  // Role Guard: Form survey is strictly for Marketing/AO and Super Admin
  if (currentUser.role !== 'marketing' && currentUser.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 max-w-lg w-full space-y-4 shadow-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-400 mx-auto">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Akses Form Survey Dibatasi</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Formulir pengisian survey lapangan 5C hanya diperuntukkan bagi <strong className="text-white">Account Officer (Marketing)</strong> dan <strong className="text-white">Super Administrator</strong>.
          </p>
          <p className="text-[11px] text-slate-400 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            Peran Anda saat ini adalah <strong className="text-white">{currentUser.roleTitle}</strong> ({currentUser.branch}). Sesuai tata kelola operasional, peran ini tidak diotorisasi untuk mengisi formulir survey.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
            <span>Form Survey Lapangan & Credit Scoring</span>
            <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              {activeQuestions.length} Parameter Aktif
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Terintegrasi evaluasi 5C, screening fraud red flag, kalkulator DSR instan, dan geotagging bukti survey.
          </p>
        </div>

        {hasDraftContent && draftSavedAt && (
          <div className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-950/50 px-3 py-2 text-[11px] text-sky-300 shrink-0">
            <Save className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <div>
              <p className="font-bold text-sky-200 leading-tight">Draft Tersimpan Otomatis</p>
              <p className="text-[10px] text-sky-400/90 font-mono">
                Terakhir disimpan {new Date(draftSavedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step 0: Menu Pilih Kantor & Nama AO (Wajib sebelum mengisi Form Survey) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Identitas Kantor &amp; Account Officer (AO)
              </h2>
              <p className="text-[11px] text-slate-400">
                Pilih Kantor terlebih dahulu, lalu pilih atau tambahkan Nama AO secara manual untuk membuka Form Survey.
              </p>
            </div>
          </div>

          {isOfficeAndAoSelected && !isEditingOfficeAo && (
            <button
              type="button"
              onClick={() => setIsEditingOfficeAo(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors self-start sm:self-center"
            >
              <Edit3 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ubah Kantor / AO</span>
            </button>
          )}
        </div>

        {isOfficeAndAoSelected && !isEditingOfficeAo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 flex items-center gap-3">
              <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Kantor Terpilih</p>
                <p className="text-sm font-bold text-white">{selectedOffice}</p>
              </div>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 flex items-center gap-3">
              <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Nama Account Officer (AO)</p>
                <p className="text-sm font-bold text-white">{selectedAoName}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Pilih Kantor */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                1. Pilih Kantor / Cabang <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedOffice}
                onChange={(e) => {
                  const nextOffice = e.target.value;
                  setSelectedOffice(nextOffice);
                  setSelectedAoName('');
                  setManualAoInput('');
                  setAoInputMode('select');
                  setFormError(null);
                }}
                className="w-full sm:max-w-md rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="">-- Pilih Kantor / Cabang --</option>
                {officeOptions.map((office) => (
                  <option key={office} value={office}>
                    {office}
                  </option>
                ))}
              </select>
              {officeOptions.length === 0 && (
                <p className="mt-1.5 text-[11px] text-amber-400">
                  Belum ada daftar kantor. Hubungi Super Admin untuk menambahkan pilihan kantor di menu Kelola Kantor &amp; AO.
                </p>
              )}
            </div>

            {/* Muncul setelah memilih kantor: Form Pilih Nama AO atau Tambah Manual */}
            {selectedOffice.trim() !== '' && (
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <label className="block text-slate-200 font-semibold">
                      2. Pilih Nama AO untuk {selectedOffice} <span className="text-rose-400">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Pilih nama AO dari daftar kantor ini atau tambahkan secara manual.
                    </p>
                  </div>

                  {/* Mode switcher: Pilih Daftar vs Tambah Manual */}
                  <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1 self-start">
                    <button
                      type="button"
                      onClick={() => setAoInputMode('select')}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        aoInputMode === 'select'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pilih Daftar AO ({aoOptionsForSelectedOffice.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAoInputMode('manual')}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        aoInputMode === 'manual'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      + Tambah AO Manual
                    </button>
                  </div>
                </div>

                {aoInputMode === 'select' ? (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={
                          aoOptionsForSelectedOffice.some(
                            (ao) => ao.toLowerCase() === selectedAoName.trim().toLowerCase()
                          )
                            ? selectedAoName
                            : ''
                        }
                        onChange={(e) => {
                          const chosen = e.target.value;
                          setSelectedAoName(chosen);
                          setFormError(null);
                          if (chosen.trim()) {
                            setIsEditingOfficeAo(false);
                          }
                        }}
                        className="flex-1 sm:max-w-md rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-hidden"
                      >
                        <option value="">-- Pilih Nama AO --</option>
                        {aoOptionsForSelectedOffice.map((aoName) => (
                          <option key={aoName} value={aoName}>
                            {aoName}
                          </option>
                        ))}
                      </select>

                      {aoOptionsForSelectedOffice.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setAoInputMode('manual')}
                          className="rounded-lg border border-emerald-500/40 bg-emerald-950/50 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                          + Input Nama AO Manual
                        </button>
                      )}
                    </div>

                    {aoOptionsForSelectedOffice.length === 0 && (
                      <p className="text-[11px] text-amber-300">
                        Belum ada nama AO terdaftar di kantor {selectedOffice}. Klik &quot;+ Tambah AO Manual&quot; untuk mengetikkan nama AO secara langsung.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={manualAoInput}
                      onChange={(e) => setManualAoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const clean = manualAoInput.trim();
                          if (clean) {
                            setSelectedAoName(clean);
                            setIsEditingOfficeAo(false);
                            setFormError(null);
                          }
                        }
                      }}
                      placeholder="Masukkan nama lengkap AO / Surveyor..."
                      className="flex-1 sm:max-w-md rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = manualAoInput.trim();
                        if (!clean) {
                          setFormError('Masukkan nama AO terlebih dahulu.');
                          return;
                        }
                        setSelectedAoName(clean);
                        setIsEditingOfficeAo(false);
                        setFormError(null);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shrink-0"
                    >
                      <Check className="h-4 w-4" />
                      <span>Gunakan Nama AO &amp; Buka Form</span>
                    </button>
                  </div>
                )}

                {selectedAoName.trim() !== '' && (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-200">
                    <span>
                      AO aktif: <strong className="text-white">{selectedAoName}</strong> ({selectedOffice})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingOfficeAo(false)}
                      className="font-bold text-emerald-400 hover:text-emerald-300"
                    >
                      Lanjut Isi Form &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!isOfficeAndAoSelected ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-10 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-amber-400 mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            Formulir Survey Belum Terbuka
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Silakan pilih <strong className="text-white">Kantor / Cabang</strong> terlebih dahulu di atas, lalu pilih atau tambahkan <strong className="text-white">Nama AO</strong> secara manual agar dapat mulai mengisi formulir survey lapangan.
          </p>
        </div>
      ) : (
      <>
      {/* Floating / Sticky Live Scoring Bar */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Live Score */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
                <span className="font-mono text-xl font-extrabold text-emerald-400 tabular-nums">
                  {liveScoring.totalScore}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Skor Risiko Instan</p>
                <p className="text-sm font-bold text-white">{liveScoring.ratingGrade}</p>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-[1px] bg-slate-800" />

            {/* DSR & Cashflow */}
            <div className="text-xs">
              <p className="text-slate-400 text-[11px]">Rasio Hutang (DSR)</p>
              <p className={`font-mono font-bold ${financialMetrics.dsrRatio <= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {financialMetrics.dsrRatio}% {financialMetrics.dsrRatio <= 35 ? '(Aman)' : '(Tinggi)'}
              </p>
            </div>

            <div className="text-xs">
              <p className="text-slate-400 text-[11px]">Sisa Kas Bebas (Available)</p>
              <p className={`font-mono font-bold ${financialMetrics.availableCashflow > 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                Rp {financialMetrics.availableCashflow.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="text-xs">
              <p className="text-slate-400 text-[11px]">Plafon Disarankan</p>
              <p className="font-mono font-bold text-emerald-400">
                Rp {liveScoring.plafonDisarankan.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Red Flag indicator & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {liveFraudEvaluation.hasRedFlags ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>{liveFraudEvaluation.detectedFlags.length} Red Flag Terdeteksi!</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Bebas Red Flag Kritis</span>
              </div>
            )}

            {isConfirmingNewForm ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/60 px-2.5 py-1 text-xs">
                <span className="text-amber-200 font-semibold text-[11px]">Kosongkan draft?</span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded bg-rose-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-rose-500 transition-colors"
                >
                  Ya, Form Baru
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingNewForm(false)}
                  className="rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (hasDraftContent) {
                    setIsConfirmingNewForm(true);
                  } else {
                    resetForm();
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shadow-xs"
                title="Kosongkan draft saat ini dan buat formulir survey baru"
              >
                <FilePlus2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Buat Form Baru</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmitSurvey()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Kirim ke Admin</span>
            </button>
          </div>
        </div>
      </div>

      {formError && (
        <div
          id="survey-form-error-top"
          className="flex items-center gap-3 rounded-xl border border-rose-500/50 bg-rose-950/80 p-4 text-xs text-rose-200 shadow-md animate-in fade-in duration-200"
        >
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-rose-100">Validasi Formulir Survey</p>
            <p className="mt-0.5">{formError}</p>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-xs text-rose-300 hover:text-white px-2.5 py-1 rounded-lg bg-rose-900/60 border border-rose-700/50 font-medium"
          >
            Tutup
          </button>
        </div>
      )}

      <form noValidate onSubmit={handleSubmitSurvey} className="space-y-6">
        {/* Section 0: Data Pokok Calon Debitur */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <User className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Profil & Identitas Calon Debitur</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Nama Lengkap Sesuai KTP <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={namaDebitur}
                onChange={(e) => setNamaDebitur(e.target.value)}
                placeholder="Contoh: Hj. Siti Fatimah"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-medium">
                  Nomor Induk Kependudukan (NIK) <span className="text-rose-400">*</span>
                </label>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    nik.replace(/\D/g, '').length === 16
                      ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/30'
                      : 'text-amber-300 bg-amber-950/80 border border-amber-500/30'
                  }`}
                >
                  {nik.replace(/\D/g, '').length}/16 digit {nik.replace(/\D/g, '').length === 16 ? '✓ Lengkap' : '(Wajib 16)'}
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="16 digit NIK KTP (wajib 16 digit)"
                className={`w-full rounded-lg border px-3 py-2 text-white placeholder-slate-500 font-mono focus:outline-hidden ${
                  nik && nik.replace(/\D/g, '').length < 16
                    ? 'border-amber-500/70 bg-amber-950/10 focus:border-amber-400'
                    : 'border-slate-700 bg-slate-800/80 focus:border-emerald-500'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-medium">
                  Nomor Kartu Keluarga (KK) <span className="text-rose-400">*</span>
                </label>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    noKk.replace(/\D/g, '').length === 16
                      ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/30'
                      : 'text-amber-300 bg-amber-950/80 border border-amber-500/30'
                  }`}
                >
                  {noKk.replace(/\D/g, '').length}/16 digit {noKk.replace(/\D/g, '').length === 16 ? '✓ Lengkap' : '(Wajib 16)'}
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={noKk}
                onChange={(e) => setNoKk(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="16 digit No KK (wajib 16 digit)"
                className={`w-full rounded-lg border px-3 py-2 text-white placeholder-slate-500 font-mono focus:outline-hidden ${
                  noKk && noKk.replace(/\D/g, '').length < 16
                    ? 'border-amber-500/70 bg-amber-950/10 focus:border-amber-400'
                    : 'border-slate-700 bg-slate-800/80 focus:border-emerald-500'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-medium">
                  Nomor HP / WhatsApp Aktif <span className="text-rose-400">*</span>
                </label>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    noHp.replace(/\D/g, '').length >= 10
                      ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/30'
                      : 'text-amber-300 bg-amber-950/80 border border-amber-500/30'
                  }`}
                >
                  {noHp.replace(/\D/g, '').length} digit {noHp.replace(/\D/g, '').length >= 10 ? '✓ Valid' : '(Min. 10)'}
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={15}
                value={noHp}
                onChange={(e) => setNoHp(e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="Contoh: 081234567890 (min. 10 digit)"
                className={`w-full rounded-lg border px-3 py-2 text-white placeholder-slate-500 font-mono focus:outline-hidden ${
                  noHp && noHp.replace(/\D/g, '').length < 10
                    ? 'border-amber-500/70 bg-amber-950/10 focus:border-amber-400'
                    : 'border-slate-700 bg-slate-800/80 focus:border-emerald-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Bidang / Jenis Usaha <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={jenisUsaha}
                onChange={(e) => setJenisUsaha(e.target.value)}
                placeholder="Contoh: Grosir Sembako / Bengkel / Katering"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Lama Usaha Berjalan (Bulan)
              </label>
              <input
                type="number"
                min={1}
                value={lamaUsahaBulan === 0 ? '' : lamaUsahaBulan}
                onChange={(e) => setLamaUsahaBulan(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="Contoh: 12"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Alamat Domisili Aktual (Sesuai Lapangan)
              </label>
              <input
                type="text"
                value={alamatDomisili}
                onChange={(e) => setAlamatDomisili(e.target.value)}
                placeholder="Alamat lengkap tempat tinggal/usaha yang disurvey"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Status Pernikahan
              </label>
              <select
                value={statusPernikahan}
                onChange={(e) => setStatusPernikahan(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="Menikah">Menikah</option>
                <option value="Belum Menikah">Belum Menikah</option>
                <option value="Cerai">Cerai</option>
              </select>
            </div>

            {/* Nama Pasangan jika Menikah */}
            {statusPernikahan === 'Menikah' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nama Istri / Suami (Pasangan) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={namaPasangan}
                  onChange={(e) => setNamaPasangan(e.target.value)}
                  placeholder="Nama lengkap pasangan sesuai KTP"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* KARTU 1: Foto e-KTP Asli Calon Debitur */}
            <div className="sm:col-span-2 lg:col-span-3 mt-1 rounded-xl border border-slate-700/80 bg-slate-950/60 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="aspect-[1.58/1] w-32 sm:w-44 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden relative shrink-0 shadow-md">
                    {fotoKtp ? (
                      <img
                        src={fotoKtp}
                        alt="Foto KTP Calon Debitur"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-slate-500">
                        <CreditCard className="h-6 w-6 mb-1 text-slate-600" />
                        <span className="text-[10px]">Belum Ada Foto KTP</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-bold text-white">1. Lampiran Foto KTP Calon Debitur</h4>
                      {fotoKtp ? (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                          KTP Terlampir
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/80 border border-rose-500/30 px-2 py-0.5 rounded">
                          Wajib Dilampirkan
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Ambil foto e-KTP fisik calon debitur saat wawancara survey. Sistem otomatis menganalisis keaslian blangko fisik vs hasil cetak/fotocopy.
                    </p>

                    {/* Status Deteksi Sistem */}
                    {fotoKtp && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Deteksi Sistem:</span>
                            {isAnalyzingKtpDebitur ? (
                              <span className="text-[10px] text-sky-400 animate-pulse font-mono">
                                Menganalisis spektrum blangko...
                              </span>
                            ) : fotoKtpStatus === 'asli' ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                <span>e-KTP Fisik Asli</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" />
                                <span>Hasil Cetak / Fotocopy</span>
                              </span>
                            )}
                          </div>

                          {/* Surveyor Status Toggle */}
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400 mr-1">Status Fisik:</span>
                            <button
                              type="button"
                              onClick={() => setFotoKtpStatus('asli')}
                              className={`px-2 py-0.5 rounded border transition-colors ${
                                fotoKtpStatus === 'asli'
                                  ? 'bg-emerald-600 border-emerald-500 text-white font-semibold'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              KTP Asli Fisik
                            </button>
                            <button
                              type="button"
                              onClick={() => setFotoKtpStatus('fotocopy')}
                              className={`px-2 py-0.5 rounded border transition-colors ${
                                fotoKtpStatus === 'fotocopy'
                                  ? 'bg-amber-600 border-amber-500 text-white font-semibold'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              Fotocopy / Cetak
                            </button>
                          </div>
                        </div>

                        {fotoKtpDeteksiInfo && (
                          <p className="text-[10px] text-slate-400 font-mono leading-relaxed border-t border-slate-800/80 pt-1.5">
                            {fotoKtpDeteksiInfo}
                          </p>
                        )}

                        {/* Kolom Keterangan Surveyor Wajib jika bukan KTP asli fisik */}
                        {fotoKtpStatus === 'fotocopy' && (
                          <div className="pt-2 border-t border-amber-500/30">
                            <label className="block text-[11px] font-bold text-amber-300 mb-1">
                              Kolom Keterangan Surveyor (Wajib Diisi Karena Bukan KTP Asli Fisik) <span className="text-rose-400">*</span>
                            </label>
                            <textarea
                              rows={2}
                              required
                              value={fotoKtpCatatanSurveyor}
                              onChange={(e) => setFotoKtpCatatanSurveyor(e.target.value)}
                              placeholder="Wajib diisi surveyor: Jelaskan alasan mengapa e-KTP fisik asli debitur tidak dapat difoto (contoh: e-KTP asli disimpan di safe deposit box / sedang proses penggantian di Disdukcapil)..."
                              className="w-full rounded-lg border border-amber-500/50 bg-amber-950/20 px-3 py-1.5 text-xs text-white placeholder-amber-300/40 focus:border-amber-400 focus:outline-hidden font-mono"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      openCameraCapture(
                        'fotoKtp',
                        'ktp',
                        'Ambil Foto KTP Asli Calon Debitur',
                        'Posisikan kartu identitas di dalam bingkai hijau. Pastikan seluruh teks NIK dan nama terbaca jelas.'
                      )
                    }
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                  >
                    <Camera className="h-4 w-4" />
                    <span>{fotoKtp ? 'Ambil Ulang KTP Debitur' : 'Buka Kamera KTP Debitur'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* KARTU 2: Foto e-KTP Pendamping (Istri jika Menikah, Orang Tua jika Belum Menikah) */}
            <div className="sm:col-span-2 lg:col-span-3 mt-1 rounded-xl border border-slate-700/80 bg-slate-950/60 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="aspect-[1.58/1] w-32 sm:w-44 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden relative shrink-0 shadow-md">
                    {fotoKtpPendamping ? (
                      <img
                        src={fotoKtpPendamping}
                        alt="Foto KTP Pendamping"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-slate-500">
                        <CreditCard className="h-6 w-6 mb-1 text-slate-600" />
                        <span className="text-[10px]">
                          {statusPernikahan === 'Menikah'
                            ? 'Foto KTP Istri'
                            : statusPernikahan === 'Belum Menikah'
                            ? 'Foto KTP Orang Tua'
                            : 'Foto KTP Penjamin'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-bold text-white">
                        2. {statusPernikahan === 'Menikah'
                          ? 'Lampiran Foto KTP Asli Istri / Pasangan'
                          : statusPernikahan === 'Belum Menikah'
                          ? 'Lampiran Foto KTP Asli Orang Tua (Ayah / Ibu Kandung)'
                          : 'Lampiran Foto KTP Penjamin / Ahli Waris'}
                      </h4>
                      {fotoKtpPendamping ? (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                          KTP Terlampir
                        </span>
                      ) : statusPernikahan === 'Cerai' ? (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          Opsional
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/80 border border-rose-500/30 px-2 py-0.5 rounded">
                          Wajib Dilampirkan ({statusPernikahan})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {statusPernikahan === 'Menikah'
                        ? 'Calon debitur berstatus Menikah, wajib melampirkan foto e-KTP Istri/Pasangan untuk persetujuan pembiayaan keluarga.'
                        : statusPernikahan === 'Belum Menikah'
                        ? 'Calon debitur berstatus Belum Menikah, wajib melampirkan foto e-KTP Orang Tua (Ayah/Ibu) sebagai penjamin/wali keluarga.'
                        : 'Lampiran e-KTP penjamin, ahli waris, atau kerabat terdekat calon debitur.'}
                    </p>

                    {/* Status Deteksi Sistem untuk KTP Pendamping */}
                    {fotoKtpPendamping && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Deteksi Sistem:</span>
                            {isAnalyzingKtpPendamping ? (
                              <span className="text-[10px] text-sky-400 animate-pulse font-mono">
                                Menganalisis spektrum blangko...
                              </span>
                            ) : fotoKtpPendampingStatus === 'asli' ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                <span>e-KTP Fisik Asli</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" />
                                <span>Hasil Cetak / Fotocopy</span>
                              </span>
                            )}
                          </div>

                          {/* Surveyor Status Toggle */}
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400 mr-1">Status Fisik:</span>
                            <button
                              type="button"
                              onClick={() => setFotoKtpPendampingStatus('asli')}
                              className={`px-2 py-0.5 rounded border transition-colors ${
                                fotoKtpPendampingStatus === 'asli'
                                  ? 'bg-emerald-600 border-emerald-500 text-white font-semibold'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              KTP Asli Fisik
                            </button>
                            <button
                              type="button"
                              onClick={() => setFotoKtpPendampingStatus('fotocopy')}
                              className={`px-2 py-0.5 rounded border transition-colors ${
                                fotoKtpPendampingStatus === 'fotocopy'
                                  ? 'bg-amber-600 border-amber-500 text-white font-semibold'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              Fotocopy / Cetak
                            </button>
                          </div>
                        </div>

                        {fotoKtpPendampingDeteksiInfo && (
                          <p className="text-[10px] text-slate-400 font-mono leading-relaxed border-t border-slate-800/80 pt-1.5">
                            {fotoKtpPendampingDeteksiInfo}
                          </p>
                        )}

                        {/* Kolom Keterangan Surveyor Wajib jika bukan KTP asli fisik */}
                        {fotoKtpPendampingStatus === 'fotocopy' && (
                          <div className="pt-2 border-t border-amber-500/30">
                            <label className="block text-[11px] font-bold text-amber-300 mb-1">
                              Kolom Keterangan Surveyor (Wajib Diisi Karena Bukan KTP Asli Fisik) <span className="text-rose-400">*</span>
                            </label>
                            <textarea
                              rows={2}
                              required
                              value={fotoKtpPendampingCatatanSurveyor}
                              onChange={(e) => setFotoKtpPendampingCatatanSurveyor(e.target.value)}
                              placeholder={`Wajib diisi surveyor: Jelaskan alasan mengapa e-KTP fisik asli ${statusPernikahan === 'Menikah' ? 'istri/pasangan' : 'orang tua'} tidak dapat difoto langsung...`}
                              className="w-full rounded-lg border border-amber-500/50 bg-amber-950/20 px-3 py-1.5 text-xs text-white placeholder-amber-300/40 focus:border-amber-400 focus:outline-hidden font-mono"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      openCameraCapture(
                        'fotoKtpPendamping',
                        'ktp',
                        statusPernikahan === 'Menikah'
                          ? 'Ambil Foto KTP Asli Istri / Pasangan'
                          : statusPernikahan === 'Belum Menikah'
                          ? 'Ambil Foto KTP Asli Orang Tua (Ayah / Ibu)'
                          : 'Ambil Foto KTP Penjamin / Ahli Waris',
                        'Posisikan kartu identitas di dalam bingkai hijau. Pastikan seluruh teks NIK dan nama terbaca jelas.'
                      )
                    }
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                  >
                    <Camera className="h-4 w-4" />
                    <span>
                      {fotoKtpPendamping
                        ? 'Ambil Ulang KTP'
                        : statusPernikahan === 'Menikah'
                        ? 'Buka Kamera KTP Istri'
                        : statusPernikahan === 'Belum Menikah'
                        ? 'Buka Kamera KTP Orang Tua'
                        : 'Buka Kamera KTP Pendamping'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Financial & Capacity Calculator */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">
                Kalkulator Kapasitas Finansial & Rasio DSR (Otomatis)
              </h2>
            </div>
            <span className="text-xs text-slate-400">Dimensi Capacity (5C)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs mb-5">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Plafon Diajukan (Rp) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step={1000000}
                value={plafonDiajukan === 0 ? '' : plafonDiajukan}
                onChange={(e) => setPlafonDiajukan(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="Contoh: 25000000"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Tenor Pengajuan (Bulan)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={tenorBulanDiajukan === 0 ? '' : tenorBulanDiajukan}
                onChange={(e) => setTenorBulanDiajukan(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="Contoh: 12"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-medium">
                  Bagi Hasil Lembaga (% p.a.)
                </label>
                <span className="text-[10px] text-emerald-400/90 font-mono">Bisa diedit</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={100}
                  value={persentaseBasil === 0 ? '' : persentaseBasil}
                  onChange={(e) => setPersentaseBasil(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="Contoh: 12"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 pr-7 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                />
                <span className="absolute right-2.5 top-2 text-xs text-slate-400 font-mono">%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-medium">
                  Nominal Angsuran (Rp/Bln)
                </label>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isManualAngsuran
                      ? 'text-amber-300 bg-amber-950/80 border border-amber-500/30'
                      : 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/30'
                  }`}
                >
                  {isManualAngsuran ? 'Manual' : 'Otomatis'}
                </span>
              </div>
              <input
                type="number"
                step={10000}
                value={nominalAngsuran === 0 ? '' : nominalAngsuran}
                onChange={(e) => {
                  setIsManualAngsuran(true);
                  setNominalAngsuran(e.target.value === '' ? 0 : Number(e.target.value));
                }}
                placeholder="0"
                className={`w-full rounded-lg border px-3 py-2 text-white font-mono focus:outline-hidden ${
                  isManualAngsuran
                    ? 'border-amber-500/70 bg-amber-950/15 focus:border-amber-400'
                    : 'border-slate-700 bg-slate-800/80 focus:border-emerald-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Omzet Rata-rata / Bulan (Rp)
              </label>
              <input
                type="number"
                step={500000}
                value={omzetBulanan === 0 ? '' : omzetBulanan}
                onChange={(e) => setOmzetBulanan(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Biaya HPP Usaha / Kulakan (Rp)
              </label>
              <input
                type="number"
                step={500000}
                value={biayaHppUsaha === 0 ? '' : biayaHppUsaha}
                onChange={(e) => setBiayaHppUsaha(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Biaya Operasional Usaha (Rp)
              </label>
              <input
                type="number"
                step={100000}
                value={biayaOperasionalUsaha === 0 ? '' : biayaOperasionalUsaha}
                onChange={(e) => setBiayaOperasionalUsaha(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0 (gaji, sewa, listrik)"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Kebutuhan Rumah Tangga (Rp)
              </label>
              <input
                type="number"
                step={100000}
                value={kebutuhanRumahTangga === 0 ? '' : kebutuhanRumahTangga}
                onChange={(e) => setKebutuhanRumahTangga(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0 (makan, dapur, sekolah)"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Angsuran Hutang Lain (Bank/Leasing)
              </label>
              <input
                type="number"
                step={100000}
                value={angsuranLainSaatIni === 0 ? '' : angsuranLainSaatIni}
                onChange={(e) => setAngsuranLainSaatIni(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-slate-300 font-medium mb-1">
                Sumber Utama Pembayaran
              </label>
              <input
                type="text"
                value={sumberPembayaran}
                onChange={(e) => setSumberPembayaran(e.target.value)}
                placeholder="Contoh: Laba harian toko sembako / Hasil panen bulanan"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Ornamen Perhitungan Angsuran & Margin Bagi Hasil Lembaga */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 mb-5 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-emerald-300">
                  Ornamen Skema Perhitungan Angsuran & Bagi Hasil (Basil)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {isManualAngsuran ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualAngsuran(false);
                      const tenor = Math.max(1, tenorBulanDiajukan);
                      const marginRate = (Number(persentaseBasil) || 0) / 100;
                      const totalMargin = Math.round(plafonDiajukan * (marginRate * (tenor / 12)));
                      const totalKewajiban = plafonDiajukan + totalMargin;
                      const autoAngsuran = plafonDiajukan > 0 ? Math.round(totalKewajiban / tenor) : 0;
                      setNominalAngsuran(autoAngsuran);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Hitung Ulang dari Rumus Basil ({persentaseBasil}% p.a.)</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Mode: Rumus Otomatis Lembaga ({persentaseBasil}% p.a.)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                <span className="text-[10px] text-slate-400 block">Plafon Pokok Pinjaman</span>
                <span className="text-xs font-bold font-mono text-white mt-0.5 block tabular-nums">
                  Rp {plafonDiajukan.toLocaleString('id-ID')}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Tenor {tenorBulanDiajukan} Bulan</span>
              </div>

              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                <span className="text-[10px] text-slate-400 block">
                  Total Basil Lembaga ({persentaseBasil}% p.a.)
                </span>
                <span className="text-xs font-bold font-mono text-amber-300 mt-0.5 block tabular-nums">
                  Rp {financialMetrics.totalBagiHasil.toLocaleString('id-ID')}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  Rp {Math.round(financialMetrics.totalBagiHasil / Math.max(1, tenorBulanDiajukan)).toLocaleString('id-ID')}/bln
                </span>
              </div>

              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                <span className="text-[10px] text-slate-400 block">Total Kewajiban (Pokok + Basil)</span>
                <span className="text-xs font-bold font-mono text-sky-300 mt-0.5 block tabular-nums">
                  Rp {financialMetrics.totalKewajiban.toLocaleString('id-ID')}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Total Pengembalian</span>
              </div>

              <div className="rounded-lg bg-emerald-900/30 border border-emerald-500/40 p-2.5">
                <span className="text-[10px] text-emerald-300 font-semibold block">
                  Angsuran per Bulan {isManualAngsuran ? '(Manual)' : '(Otomatis)'}
                </span>
                <span className="text-sm font-extrabold font-mono text-emerald-400 mt-0.5 block tabular-nums">
                  Rp {financialMetrics.nominalAngsuran.toLocaleString('id-ID')}/bln
                </span>
                <span className="text-[9px] text-emerald-400/70 block mt-0.5">
                  {isManualAngsuran ? 'Disesuaikan AO/Lembaga' : 'Dari Plafon & Basil'}
                </span>
              </div>
            </div>
          </div>

          {/* Computed Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-4 bg-slate-950/40 p-3 rounded-lg">
            <div>
              <span className="text-[11px] text-slate-400">Laba Usaha Bersih:</span>
              <p className="text-sm font-bold font-mono text-white tabular-nums">
                Rp {financialMetrics.labaUsahaBersih.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Estimasi Angsuran Baru:</span>
              <p className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                Rp {financialMetrics.estimasiAngsuranDiajukan.toLocaleString('id-ID')}/bln
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Rasio Beban DSR:</span>
              <p className={`text-sm font-bold font-mono tabular-nums ${financialMetrics.dsrRatio <= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {financialMetrics.dsrRatio}%
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Stress Test (-20% Omzet):</span>
              <p className={`text-sm font-bold font-mono tabular-nums ${financialMetrics.stressTestCashflow >= 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                {financialMetrics.stressTestCashflow >= 0 ? 'Surplus' : 'Defisit!'} (Rp {financialMetrics.stressTestCashflow.toLocaleString('id-ID')})
              </p>
            </div>
          </div>

          {/* Foto Bukti Penghasilan Capture Field */}
          <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="aspect-[4/3] w-28 sm:w-36 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden relative shrink-0 shadow-md">
                  {fotoBuktiPenghasilan ? (
                    <img
                      src={fotoBuktiPenghasilan}
                      alt="Bukti Penghasilan"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-slate-500">
                      <FileText className="h-6 w-6 mb-1 text-slate-600" />
                      <span className="text-[10px]">Belum Ada Bukti</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">Lampiran Foto Bukti Penghasilan / Mutasi Kas</h4>
                    {fotoBuktiPenghasilan ? (
                      <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/80 border border-sky-500/30 px-2 py-0.5 rounded">
                        Bukti Terlampir
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded">
                        Perlu Dilampirkan
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Ambil foto fisik slip gaji, buku rekening/mutasi bank 3 bulan terakhir, atau buku catatan penjualan harian langsung di tempat usaha untuk verifikasi kapasitas riil (Checklist #30 & #54).
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Verifikasi Omzet: Rp {omzetBulanan.toLocaleString('id-ID')}/bln · Cashflow Bebas: Rp {financialMetrics.availableCashflow.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openCameraCapture(
                      'fotoBuktiPenghasilan',
                      'income',
                      'Ambil Bukti Penghasilan / Mutasi',
                      'Posisikan dokumen slip gaji, buku tabungan, atau nota penjualan agar angka omzet terbaca jelas.'
                    )
                  }
                  className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-colors shadow-sm"
                >
                  <Camera className="h-4 w-4" />
                  <span>{fotoBuktiPenghasilan ? 'Foto Ulang Bukti' : 'Buka Kamera Bukti Kas'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Jaminan (Collateral) Information - Up to 10 Agunan */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  Data Agunan / Jaminan Pembiayaan (Maksimal 10 Agunan)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tambahkan seluruh aset jaminan yang diagunkan debitur (SHM, BPKB, AJB, Deposito, dll.)
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                Agunan: {collaterals.length} / 10
              </span>
              <button
                type="button"
                onClick={addCollateral}
                disabled={collaterals.length >= 10}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
                  collaterals.length >= 10
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Agunan ({collaterals.length}/10)</span>
              </button>
            </div>
          </div>

          {/* Portfolio Aggregation Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Taksasi Pasar ({collaterals.length} Agunan):</span>
              <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5 tabular-nums">
                Rp {totalNilaiPasarTaksasi.toLocaleString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Total Likuidasi Cepat:</span>
              <span className="text-sm font-bold font-mono text-slate-200 block mt-0.5 tabular-nums">
                Rp {totalNilaiLikuidasi.toLocaleString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Rasio LTV Agregat:</span>
              <span
                className={`text-sm font-bold font-mono block mt-0.5 tabular-nums ${
                  aggregateLtv <= 70
                    ? 'text-emerald-400'
                    : aggregateLtv <= 85
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {Math.round(aggregateLtv * 10) / 10}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Status Coverage Agunan:</span>
              <span className="text-[11px] font-semibold text-slate-300 block mt-0.5">
                {totalNilaiPasarTaksasi === 0
                  ? 'Belum ada taksasi'
                  : aggregateLtv <= 70
                  ? '✓ Sangat Kuat (Safe)'
                  : aggregateLtv <= 85
                  ? '✓ Cukup Memadai'
                  : aggregateLtv <= 100
                  ? '⚠️ Agunan Pas-pasan'
                  : '🚨 Di Bawah Plafon (Under-Collateralized)'}
              </span>
            </div>
          </div>

          {/* Collateral Cards List */}
          <div className="space-y-4">
            {collaterals.map((col, index) => {
              const itemLtv =
                Number(col.nilaiPasarTaksasi) > 0
                  ? Math.round((plafonDiajukan / Number(col.nilaiPasarTaksasi)) * 100)
                  : 0;

              return (
                <div
                  key={col.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition-all hover:border-slate-700 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 font-mono">
                        {index + 1}
                      </span>
                      <h3 className="text-xs font-bold text-white">
                        Agunan #{index + 1}: {col.jenisJaminan}
                        {col.nomorDokumen ? ` (${col.nomorDokumen})` : ''}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                        LTV Single: {itemLtv}%
                      </span>
                    </div>

                    {collaterals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCollateral(index)}
                        className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/40 px-2 py-1 rounded transition-colors cursor-pointer"
                        title="Hapus agunan ini"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Hapus Agunan #{index + 1}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Jenis Agunan</label>
                      <select
                        value={col.jenisJaminan}
                        onChange={(e) => updateCollateral(index, 'jenisJaminan', e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                      >
                        <option value="SHM">Sertifikat Hak Milik (SHM)</option>
                        <option value="BPKB Mobil">BPKB Mobil</option>
                        <option value="BPKB Motor">BPKB Motor</option>
                        <option value="AJB">Akta Jual Beli (AJB)</option>
                        <option value="Tabungan / Deposito">Bilyet Deposito / Tabungan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Nomor Dokumen / Sertifikat</label>
                      <input
                        type="text"
                        value={col.nomorDokumen}
                        onChange={(e) => updateCollateral(index, 'nomorDokumen', e.target.value)}
                        placeholder="No. SHM / No. BPKB / No. Polisi"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Atas Nama Dokumen</label>
                      <input
                        type="text"
                        value={col.atasNama}
                        onChange={(e) => updateCollateral(index, 'atasNama', e.target.value)}
                        placeholder="Nama pemilik sah di sertifikat/BPKB"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Hubungan Kepemilikan</label>
                      <select
                        value={col.hubunganPemilik}
                        onChange={(e) => updateCollateral(index, 'hubunganPemilik', e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                      >
                        <option value="Calon Kreditur">Calon Kreditur Sendiri</option>
                        <option value="Pasangan">Pasangan (Suami/Istri)</option>
                        <option value="Orang Tua">Orang Tua Kandung</option>
                        <option value="Pihak Lain">Pihak Lain</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Nilai Pasar Taksasi (Rp)</label>
                      <input
                        type="number"
                        step={1000000}
                        value={col.nilaiPasarTaksasi === 0 ? '' : col.nilaiPasarTaksasi}
                        onChange={(e) =>
                          updateCollateral(
                            index,
                            'nilaiPasarTaksasi',
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
                        }
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Nilai Likuidasi Cepat (Rp)</label>
                      <input
                        type="number"
                        step={1000000}
                        value={col.nilaiLikuidasi === 0 ? '' : col.nilaiLikuidasi}
                        onChange={(e) =>
                          updateCollateral(
                            index,
                            'nilaiLikuidasi',
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
                        }
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-slate-300 font-medium mb-1">
                        Keterangan Fisik, Lokasi & Kondisi Agunan #{index + 1}
                      </label>
                      <input
                        type="text"
                        value={col.keterangan}
                        onChange={(e) => updateCollateral(index, 'keterangan', e.target.value)}
                        placeholder="Contoh: Honda Vario 160cc Thn 2023, pajak hidup, fisik mulus / Tanah darat seluas 150m2 bebas sengketa"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Checklist Verification Questions by Category Tabs */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Checklist Survey Lapangan ({activeQuestions.length} Parameter Aktif)
              </h2>
              <p className="text-xs text-slate-400">
                Pilih status verifikasi dan bukti evidence untuk setiap parameter
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>Area {activeCategoryIndex + 1} dari {CATEGORIES.length}</span>
            </div>
          </div>

          {/* Category Tabs Scrollbar */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-slate-800/80 text-xs">
            {CATEGORIES.map((cat, idx) => {
              const isCurrent = idx === activeCategoryIndex;
              const catQuestions = activeQuestions.filter((q) => q.category === cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-75">({catQuestions.length})</span>
                </button>
              );
            })}
          </div>

          {/* Current Category Questions Table / Cards */}
          <div className="space-y-3">
            {currentCategoryQuestions.map((q) => {
              const currentAns = answers[q.id] || { status: 'sesuai', notes: '' };
              const isRedFlag = q.isRedFlagTrigger;

              return (
                <div
                  key={q.id}
                  className={`rounded-lg border p-3.5 transition-colors ${
                    currentAns.status === 'tidak_sesuai' && isRedFlag
                      ? 'border-rose-500/50 bg-rose-950/20'
                      : currentAns.status === 'cukup'
                      ? 'border-amber-500/30 bg-amber-950/10'
                      : 'border-slate-800 bg-slate-900/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{q.id}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-emerald-400/90">
                          [{q.code}]
                        </span>
                        {q.criticality === 'critical' && (
                          <span className="text-[10px] font-semibold text-rose-400">
                            · Syarat Kritis
                          </span>
                        )}
                        {isRedFlag && (
                          <span className="text-[10px] font-semibold text-amber-400">
                            · Trigger Red Flag
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-white leading-relaxed">
                        {q.question}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                        <HelpCircle className="h-3 w-3 text-slate-500 shrink-0" />
                        <span>Cara Verifikasi / Evidence: {q.evidenceGuide}</span>
                      </p>
                    </div>

                    {/* Verification Choice Toggle */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAnswerChange(q.id, 'sesuai')}
                        className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                          currentAns.status === 'sesuai'
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Sesuai / Valid
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAnswerChange(q.id, 'cukup')}
                        className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                          currentAns.status === 'cukup'
                            ? 'bg-amber-600 text-white font-semibold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Cukup / Ragu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAnswerChange(q.id, 'tidak_sesuai')}
                        className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                          currentAns.status === 'tidak_sesuai'
                            ? 'bg-rose-600 text-white font-semibold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Tidak Sesuai
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAnswerChange(q.id, 'na')}
                        className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          currentAns.status === 'na'
                            ? 'bg-slate-600 text-white font-semibold'
                            : 'bg-slate-800 text-slate-500 hover:text-white'
                        }`}
                      >
                        N/A
                      </button>
                    </div>
                  </div>

                  {/* Notes for this item */}
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={currentAns.notes}
                      onChange={(e) => handleNotesChange(q.id, e.target.value)}
                      placeholder="Catatan surveyor / temuan lapangan untuk butir ini (opsional)..."
                      className="w-full rounded border border-slate-800 bg-slate-950/50 px-2.5 py-1 text-xs text-slate-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between border-t border-slate-800 mt-5 pt-4">
            <button
              type="button"
              disabled={activeCategoryIndex === 0}
              onClick={() => setActiveCategoryIndex((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            <span className="text-xs text-slate-400">
              {currentCategory} ({currentCategoryQuestions.length} parameter)
            </span>

            <button
              type="button"
              disabled={activeCategoryIndex === CATEGORIES.length - 1}
              onClick={() => setActiveCategoryIndex((prev) => Math.min(CATEGORIES.length - 1, prev + 1))}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Section 4: Bukti Survey, Geotagging GPS & Dokumen */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Bukti Survey & Geotagging Koordinat Lokasi</h2>
            </div>
            <button
              type="button"
              onClick={handleCaptureGps}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>{isGettingGps ? 'Mengambil GPS...' : 'Ambil Koordinat GPS Sekarang'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Foto KTP */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                    <span>1. Dokumen KTP Asli</span>
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    ID Card
                  </span>
                </div>
                <div className="aspect-[1.58/1] w-full rounded-md bg-slate-800 overflow-hidden relative border border-slate-700/60">
                  {fotoKtp ? (
                    <img
                      src={fotoKtp}
                      alt="Foto KTP"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500 text-xs">
                      Belum ada foto
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openCameraCapture(
                      'fotoKtp',
                      'ktp',
                      'Ambil Foto KTP Asli Calon Debitur',
                      'Posisikan kartu identitas di dalam bingkai hijau. Pastikan seluruh teks NIK dan nama terbaca jelas.'
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{fotoKtp ? 'Foto Ulang KTP' : 'Kamera KTP'}</span>
                </button>
              </div>
            </div>

            {/* Foto Bukti Omzet / Mutasi */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-sky-400" />
                    <span>2. Bukti Penghasilan / Mutasi</span>
                  </p>
                  <span className="text-[10px] text-sky-400 font-semibold bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/20">
                    Slip / Mutasi
                  </span>
                </div>
                <div className="aspect-[4/3] w-full rounded-md bg-slate-800 overflow-hidden relative border border-slate-700/60">
                  {fotoBuktiPenghasilan ? (
                    <img
                      src={fotoBuktiPenghasilan}
                      alt="Bukti Pendapatan"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500 text-xs">
                      Belum ada bukti
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openCameraCapture(
                      'fotoBuktiPenghasilan',
                      'income',
                      'Ambil Bukti Penghasilan / Mutasi Kas',
                      'Posisikan slip gaji atau mutasi rekening agar angka omzet terbaca jelas.'
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-sky-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-sky-500 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{fotoBuktiPenghasilan ? 'Foto Ulang Bukti' : 'Kamera Bukti Kas'}</span>
                </button>
              </div>
            </div>

            {/* Foto Debitur */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>3. Foto Debitur di Lokasi</span>
                  </p>
                </div>
                <div className="aspect-[4/3] w-full rounded-md bg-slate-800 overflow-hidden relative border border-slate-700/60">
                  {fotoDebitur ? (
                    <img
                      src={fotoDebitur}
                      alt="Foto Debitur"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500 text-xs">
                      Belum ada foto
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openCameraCapture(
                      'fotoDebitur',
                      'general',
                      'Foto Debitur di Lokasi Survey',
                      'Ambil foto calon kreditur bersama surveyor atau di lingkungan domisili.'
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Ambil Foto Debitur</span>
                </button>
              </div>
            </div>

            {/* Foto Rumah/Usaha */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>4. Tempat Usaha / Domisili</span>
                  </p>
                </div>
                <div className="aspect-[4/3] w-full rounded-md bg-slate-800 overflow-hidden relative border border-slate-700/60">
                  {fotoRumahUsaha ? (
                    <img
                      src={fotoRumahUsaha}
                      alt="Foto Rumah Usaha"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500 text-xs">
                      Belum ada foto
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openCameraCapture(
                      'fotoRumahUsaha',
                      'general',
                      'Foto Rumah / Tempat Usaha',
                      'Tunjukkan tampak depan tempat usaha atau domisili beserta akses jalannya.'
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Ambil Foto Tempat</span>
                </button>
              </div>
            </div>

            {/* Foto Stok / Aset */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>5. Stok & Alat Usaha</span>
                  </p>
                </div>
                <div className="aspect-[4/3] w-full rounded-md bg-slate-800 overflow-hidden relative border border-slate-700/60">
                  {fotoStokAset ? (
                    <img
                      src={fotoStokAset}
                      alt="Foto Stok Aset"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500 text-xs">
                      Belum ada foto
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openCameraCapture(
                      'fotoStokAset',
                      'general',
                      'Foto Stok & Alat Usaha',
                      'Dokumentasikan stok barang dagangan atau peralatan usaha utama.'
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Ambil Foto Stok</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Koordinat GPS Geotagging</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={lokasiGps}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Surveyor / Account Officer Pelaksana</label>
              <input
                type="text"
                readOnly
                value={`${selectedAoName} · ${selectedOffice}`}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-white"
              />
            </div>
          </div>
        </div>

        {formError && (
          <div
            id="survey-form-error-bottom"
            className="flex items-center gap-3 rounded-xl border border-rose-500/50 bg-rose-950/80 p-4 text-xs text-rose-200 shadow-md animate-in fade-in duration-200"
          >
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-rose-100">Pengajuan Belum Dapat Dikirim</p>
              <p className="mt-0.5">{formError}</p>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-xs text-rose-300 hover:text-white px-2.5 py-1 rounded-lg bg-rose-900/60 border border-rose-700/50 font-medium"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Final Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
          <div>
            <h3 className="text-sm font-bold text-white">Selesai Survey & Kalkulasi Kredit</h3>
            <p className="text-xs text-slate-400">
              Data akan otomatis diarsipkan, skor risiko 5C terverifikasi, dan notifikasi real-time terkirim ke Admin Komite Pembiayaan.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md"
            >
              <Send className="h-4 w-4" />
              <span>Simpan & Kirim Pengajuan</span>
            </button>
          </div>
        </div>
      </form>
      </>
      )}

      {/* Document Camera Capture Modal */}
      <DocumentCameraCapture
        isOpen={cameraModalConfig.isOpen}
        onClose={() => setCameraModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onCapture={handleCameraCaptureConfirm}
        documentType={cameraModalConfig.documentType}
        documentTitle={cameraModalConfig.documentTitle}
        documentDescription={cameraModalConfig.documentDescription}
      />
    </div>
  );
};
