export type UserRole = 'super_admin' | 'admin' | 'marketing' | 'branch_manager' | 'branch_admin' | 'management' | 'risk_management';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  branch: string;
  avatarUrl?: string;
  phone: string;
  createdAt: string;
  status: 'active' | 'inactive';
  username: string; // Username aktif untuk login
  initialUsername: string; // Username awal yang dibuat oleh Super Admin
  password: string; // Password akun saat ini (dapat dilihat/diakses Super Admin)
  initialPassword?: string; // Password awal saat pembuatan
  lastModifiedCredentialsAt?: string; // Tanggal jika diubah sendiri oleh user
}

export type SurveyCategory =
  | 'Identitas & Domisili'
  | 'Tujuan Pembiayaan'
  | 'Character'
  | 'Usaha/Pekerjaan'
  | 'Capacity'
  | 'Capital'
  | 'Jaminan'
  | 'Bukti Survey'
  | 'Fraud Red Flag'
  | 'Kesimpulan Survey';

export type AnswerStatus = 'sesuai' | 'cukup' | 'tidak_sesuai' | 'na';

export interface ChecklistAnswer {
  questionId: number;
  code: string;
  status: AnswerStatus;
  notes?: string;
}

export interface FinancialCapacityData {
  omzetBulanan: number;
  biayaHppUsaha: number;
  biayaOperasionalUsaha: number;
  kebutuhanRumahTangga: number;
  angsuranLainSaatIni: number;
  plafonDiajukan: number;
  tenorBulanDiajukan: number;
  persentaseBasil?: number; // Persentase bagi hasil / margin lembaga (% p.a.)
  nominalAngsuran?: number; // Nominal angsuran per bulan (bisa diisi manual atau terhitung otomatis)
  totalBagiHasil?: number; // Total nominal bagi hasil/margin selama tenor
  totalKewajiban?: number; // Total pengembalian pinjaman (plafon + bagi hasil)
  estimasiAngsuranDiajukan: number;
  sumberPembayaran: string;
  // Computed fields
  pendapatanKotor: number;
  labaUsahaBersih: number;
  availableCashflow: number;
  dsrRatio: number; // Debt Service Ratio in %
  stressTestCashflow: number; // after 20% drop
  plafonRekomendasiMaksimal: number;
}

export interface CollateralData {
  id?: string;
  jenisJaminan: 'SHM' | 'BPKB Motor' | 'BPKB Mobil' | 'AJB' | 'Tabungan / Deposito' | 'Lainnya';
  nomorDokumen: string;
  atasNama: string;
  hubunganPemilik: 'Calon Kreditur' | 'Pasangan' | 'Orang Tua' | 'Pihak Lain';
  nilaiPasarTaksasi: number;
  nilaiLikuidasi: number;
  persentaseLtv: number; // Plafon / Nilai Pasar %
  keterangan: string;
}

export interface SurveyEvidence {
  fotoKtp?: string;
  fotoKtpStatus?: 'asli' | 'fotocopy';
  fotoKtpCatatanSurveyor?: string;
  fotoKtpDeteksiInfo?: string;
  // Foto KTP Pendamping (Istri / Suami jika menikah, Orang Tua jika belum menikah)
  fotoKtpPendamping?: string;
  fotoKtpPendampingType?: 'pasangan' | 'orang_tua' | 'wali';
  fotoKtpPendampingLabel?: string;
  fotoKtpPendampingStatus?: 'asli' | 'fotocopy';
  fotoKtpPendampingCatatanSurveyor?: string;
  fotoKtpPendampingDeteksiInfo?: string;
  fotoDebitur: string;
  fotoRumahUsaha: string;
  fotoStokAset: string;
  fotoBuktiPenghasilan: string;
  lokasiGps: string;
  alamatDigital: string;
  tanggalSurvey: string;
  surveyorName: string;
}

export interface FraudEvaluation {
  hasRedFlags: boolean;
  detectedFlags: string[];
  riskSeverity: 'low' | 'medium' | 'high' | 'critical';
}

export type CreditRatingGrade = 'A (Sangat Layak)' | 'B (Layak Bersyarat)' | 'C (Perlu Komite Khusus)' | 'D (Tidak Layak/Ditolak)';

export interface ScoringFormulaConfig {
  id: string;
  policyName: string;
  policyVersion: string;
  updatedAt: string;
  updatedBy: string;

  // 1. Bobot Dimensi 5C (Total Persentase harus 100%)
  weights5C: {
    capacity: number; // e.g. 30 (%)
    character: number; // e.g. 25 (%)
    collateral: number; // e.g. 15 (%)
    capital: number; // e.g. 15 (%)
    condition: number; // e.g. 15 (%)
  };

  // 2. Ambang Batas Skor & Penentuan Grade Risiko
  gradeThresholds: {
    minScoreGradeA: number; // e.g. 80
    maxDsrGradeA: number; // e.g. 35 (%)
    minScoreGradeB: number; // e.g. 65
    maxDsrGradeB: number; // e.g. 42 (%)
    minScoreGradeC: number; // e.g. 50
    maxDsrGradeC: number; // e.g. 50 (%)
    maxRedFlagsGradeC: number; // e.g. 1
  };

  // 3. Kebijakan Keuangan & DSR (Debt Service Ratio)
  financialSettings: {
    annualMarginRate: number; // e.g. 0.12 (12% per tahun)
    safeDsrLimit: number; // e.g. 35 (%)
    criticalDsrLimit: number; // e.g. 45 (%)
    stressTestDropPct: number; // e.g. 20 (%)
    safeCashflowMultiplier: number; // e.g. 0.65 (65% cashflow bebas)
  };

  // 4. Parameter Penalti Fraud Red Flag
  fraudSettings: {
    criticalPenaltyPoints: number; // e.g. 18 poin
    highPenaltyPoints: number; // e.g. 10 poin
    autoRejectRedFlagCount: number; // e.g. 2
  };

  // 5. Parameter Penilaian Agunan & LTV Maksimal
  collateralSettings: {
    shmMaxLtv: number; // e.g. 85 (%)
    bpkbMobilMaxLtv: number; // e.g. 75 (%)
    bpkbMotorMaxLtv: number; // e.g. 65 (%)
    ajbMaxLtv: number; // e.g. 60 (%)
    depositoMaxLtv: number; // e.g. 90 (%)
    lainnyaMaxLtv: number; // e.g. 50 (%)
    haircutLiquidationRate: number; // e.g. 75 (%)
  };

  notes?: string;
}

export interface ScoringResult {
  totalScore: number; // 0 - 100
  characterScore: number; // 0 - 100
  capacityScore: number; // 0 - 100
  capitalScore: number; // 0 - 100
  collateralScore: number; // 0 - 100
  conditionScore: number; // 0 - 100
  fraudDeduction: number;
  ratingGrade: CreditRatingGrade;
  recommendation: 'SETUJUI_PENUH' | 'SETUJUI_DENGAN_SYARAT' | 'TINJAUAN_KOMITE' | 'TOLAK';
  summaryRemarks: string;
  plafonDisarankan: number;
  tenorDisarankan: number;
  mitigasiUtama: string[];
  kekuatanKredit: string[];
  risikoKunci: string[];
}

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'conditional_approval';

export interface CommitteeDocumentation {
  noNotulen?: string;
  fotoRisalah?: string;
  fotoSidangKomite?: string;
  fotoPengesahan?: string;
  waktuSidang?: string;
  lokasiSidang?: string;
  anggotaKomiteHadir?: string[];
  anggotaKomiteDetail?: { id?: string; nama: string; role: string; status: string }[];
  analisa5CDeskripsi?: {
    character: string;
    capacity: string;
    capital: string;
    collateral: string;
    condition: string;
  };
  syaratPreseden?: string[];
  syaratSubsequen?: string[];
  skemaAkad?: string;
  marginBagiHasil?: number;
  rekomendasiAgunan?: string;
  rekomendasiMitigasi?: string;
}

export type JenisPengikatanAgunan =
  | 'Fidusia'
  | 'APHT'
  | 'SKMHT'
  | 'Bawah Tangan & Legalisasi Notaris'
  | 'Internal BMT (Gadai Syariah / Rahn)'
  | 'Lainnya';

export interface DisbursementInstruction {
  orderIssuedAt: string;
  orderIssuedBy: string;
  orderIssuerId: string;
  nominalDisetujui: number;
  tenorDisetujui: number;
  marginUjrah: number;
  estimasiAngsuran: number;
  jenisAgunan: string[];
  jenisPengikatan: JenisPengikatanAgunan | string;
  jenisPengikatanList?: string[];
  notarisPpats: string;
  pengantarPencairan: string; // Pengantar penting terkait pencairan
  syaratSebelumCair?: string[];
}

export interface DisbursementExecution {
  disbursedAt: string;
  disbursedBy: string;
  disburserId: string;
  branch: string;
  nomorAkad: string;
  tanggalAkad: string;
  tanggalPencairan: string;
  nominalDicairkan: number;
  metodePencairan: 'Transfer Rekening Bank' | 'Kas Tunai Kantor Cabang' | 'Pemindahbukuan Tabungan BMT';
  nomorRekeningTujuan?: string;
  namaBankTujuan?: string;
  namaPenerima?: string;
  notarisPelaksana: string;
  nomorAktaNotaris?: string;
  catatanAdminCabang: string;
  // Foto dokumentasi wajib
  fotoAkadBasah: string; // Foto fisik akad basah bertandatangan
  fotoBuktiPencairan: string; // Foto bukti transfer / kwitansi pencairan
  fotoDokumentasiAkad: string; // Foto sesi akad bersama debitur di cabang
  fotoAgunanFisik?: string; // Foto fisik dokumen agunan di brankas
  // Validasi Branch Manager
  status: 'pending_bm_validation' | 'validated' | 'revision';
  bmValidation?: {
    validatedBy: string;
    validatorId: string;
    validatedAt: string;
    status: 'valid' | 'revision';
    notes: string;
  };
}

export interface AdminReview {
  reviewedBy: string;
  reviewerId: string;
  reviewedAt: string;
  decision: 'approved' | 'rejected' | 'conditional_approval' | 'need_reverification';
  approvedPlafon: number;
  approvedTenor: number;
  notes: string;
  conditions?: string[];
  signatureName?: string;
  committeeDoc?: CommitteeDocumentation;
}

export type BranchValidationStatus = 'pending' | 'valid' | 'revision' | 'rejected';

export interface BranchManagerValidation {
  validatedBy: string;
  validatorId: string;
  validatedAt: string;
  status: BranchValidationStatus;
  notes: string;
  revisiNotes?: string;
  rekomendasiPlafonBM?: number;
  rekomendasiTenorBM?: number;
}

export interface ManagementAttentionNote {
  notedBy: string;
  noterId: string;
  notedAt: string;
  notes: string;
  isAttention: boolean; // Tanda perhatian khusus
}

export type AnalystCheckStatus = 'pending' | 'revision_to_bm' | 'verified_scheduled';

export interface CommitteeScheduleInfo {
  noAgenda: string;
  waktuSidang: string;
  lokasiSidang: string;
  catatanPenjadwalan?: string;
  scheduledBy: string;
  scheduledAt: string;
}

export interface AnalystVerificationAndSchedule {
  status: AnalystCheckStatus;
  checkedBy: string;
  checkerId: string;
  checkedAt: string;
  notes: string;
  revalidatedByBmAt?: string;
  committeeSchedule?: CommitteeScheduleInfo;
}

export type RiskVerificationStatus = 'verified' | 'need_correction';

export interface RiskManagementVerification {
  verifiedBy: string;
  verifierId: string;
  verifiedAt: string;
  status: RiskVerificationStatus;
  notes: string;
  verificationCode: string;
}

export interface SurveyApplication {
  id: string;
  applicationNumber: string;
  // Debitur Info
  namaDebitur: string;
  nik: string;
  noKk: string;
  noHp: string;
  alamatKtp: string;
  alamatDomisili: string;
  jenisUsaha: string;
  lamaUsahaBulan: number;
  statusPernikahan: 'Menikah' | 'Belum Menikah' | 'Cerai';
  namaPasangan?: string;
  // Submission Info
  marketingId: string;
  marketingName: string;
  cabang: string;
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  // Branch Manager Validation
  branchValidation?: BranchManagerValidation;
  // Analyst Verification, Revision Request to BM, & Committee Schedule
  analystCheck?: AnalystVerificationAndSchedule;
  // Management Attention & Note
  managementNote?: ManagementAttentionNote;
  // 68 Questions Answers
  checklistAnswers: ChecklistAnswer[];
  financial: FinancialCapacityData;
  collateral: CollateralData;
  collaterals?: CollateralData[];
  evidence: SurveyEvidence;
  fraudEvaluation: FraudEvaluation;
  scoring: ScoringResult;
  // Admin Review
  adminReview?: AdminReview;
  // Risk Management Verification (after Analis/Komite review & scheduling)
  riskVerification?: RiskManagementVerification;
  // Perintah & Realisasi Pencairan (Disbursement)
  disbursementInstruction?: DisbursementInstruction;
  disbursementExecution?: DisbursementExecution;
}

export interface AuditLog {
  id: string;
  applicationId?: string;
  applicationNumber?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type:
    | 'survey_submitted'
    | 'survey_reviewed'
    | 'fraud_alert'
    | 'user_created'
    | 'bm_validation'
    | 'bm_revision'
    | 'analyst_revision'
    | 'committee_scheduled'
    | 'management_attention'
    | 'risk_verification'
    | 'disbursement_order'
    | 'disbursement_submitted'
    | 'disbursement_validated'
    | 'disbursement_revision';
  applicationId?: string;
  applicationNumber?: string;
  targetRole?: UserRole | 'all';
  targetBranch?: string;
  timestamp: string;
  read: boolean;
}

export type AppTheme = 'dark' | 'light';

export type AppColorTheme = 'emerald' | 'teal' | 'navy' | 'amber' | 'indigo' | 'slate';

export interface OfficeAoEntry {
  id: string;
  officeName: string;
  aoNames: string[];
}

export interface AppSettings {
  // 1. Identitas & Branding Aplikasi
  appName: string;
  appSubtitle: string;
  institutionName: string;
  institutionTagline: string;
  institutionLegalNumber: string;
  institutionAddress: string;
  institutionPhone: string;
  institutionEmail: string;
  institutionWebsite: string;

  // 2. Tema & Tampilan Visual
  colorTheme: AppColorTheme;
  defaultMode: 'dark' | 'light';
  brandBadgeText: string;
  showWatermarkOnPrint: boolean;

  // 3. Kop Surat & Cetak Berkas
  printHeaderTitle: string;
  printHeaderSubtitle: string;
  printLegalFooterNotice: string;
  defaultCityDecision: string;

  // 4. Batasan & Parameter Operasional Lembaga
  defaultMarginRatePa: number;
  maxLoanPlafon: number;
  maxTenorMonths: number;
  minNikKkDigits: number;
  minPhoneDigits: number;
  requireSpouseKtpWhenMarried: boolean;
  requireParentKtpWhenSingle: boolean;
  maxCollateralsCount: number;

  // 5. Master Data Pilihan Kantor & Nama AO (Super Admin)
  officeAoCatalog?: OfficeAoEntry[];

  // 6. Metadata
  updatedAt?: string;
  updatedBy?: string;
}
