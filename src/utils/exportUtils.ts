import * as XLSX from 'xlsx';
import {
  AppNotification,
  AppSettings,
  AuditLog,
  ScoringFormulaConfig,
  SurveyApplication,
  User,
} from '../types';
import { QuestionDefinition, SURVEY_QUESTIONS } from '../data/surveyQuestions';

export function exportApplicationsToExcel(applications: SurveyApplication[], fileName = 'Laporan_Credit_Scoring_Survey.xlsx') {
  // 1. Master Sheet: Ringkasan Pengajuan & Scoring
  const masterData = applications.map((app, index) => {
    return {
      'No': index + 1,
      'No. Pengajuan': app.applicationNumber,
      'Tanggal Survey': app.evidence.tanggalSurvey || app.createdAt,
      'Nama Debitur': app.namaDebitur,
      'NIK': app.nik,
      'No. HP': app.noHp,
      'Alamat Domisili': app.alamatDomisili,
      'Jenis Usaha': app.jenisUsaha,
      'Lama Usaha (Bulan)': app.lamaUsahaBulan,
      'Cabang': app.cabang,
      'Surveyor / Marketing': app.marketingName,
      'Plafon Diajukan (Rp)': app.financial.plafonDiajukan,
      'Tenor (Bulan)': app.financial.tenorBulanDiajukan,
      'Omzet Bulanan (Rp)': app.financial.omzetBulanan,
      'Biaya Usaha Total (Rp)': app.financial.biayaHppUsaha + app.financial.biayaOperasionalUsaha,
      'Kebutuhan RT (Rp)': app.financial.kebutuhanRumahTangga,
      'Angsuran Lain (Rp)': app.financial.angsuranLainSaatIni,
      'Available Cashflow (Rp)': app.financial.availableCashflow,
      'DSR (%)': app.financial.dsrRatio,
      'Jenis Jaminan': app.collateral.jenisJaminan,
      'Nilai Pasar Jaminan (Rp)': app.collateral.nilaiPasarTaksasi,
      'Skor Total (0-100)': app.scoring.totalScore,
      'Skor Character': app.scoring.characterScore,
      'Skor Capacity': app.scoring.capacityScore,
      'Skor Capital': app.scoring.capitalScore,
      'Skor Collateral': app.scoring.collateralScore,
      'Skor Condition': app.scoring.conditionScore,
      'Grade Rating': app.scoring.ratingGrade,
      'Rekomendasi Sistem': app.scoring.recommendation,
      'Plafon Disarankan (Rp)': app.scoring.plafonDisarankan,
      'Status Approval': formatStatusText(app.status),
      'Status Validasi BM': formatBMValidation(app.branchValidation?.status),
      'Validator BM': app.branchValidation?.validatedBy || '-',
      'Catatan Supervisi BM': app.branchValidation?.notes || '-',
      'Plafon Rekomendasi BM (Rp)': app.branchValidation?.rekomendasiPlafonBM || '-',
      'Plafon Disetujui Admin (Rp)': app.adminReview?.approvedPlafon || '-',
      'Tenor Disetujui Admin': app.adminReview?.approvedTenor ? `${app.adminReview.approvedTenor} Bln` : '-',
      'Reviewer / Admin': app.adminReview?.reviewedBy || '-',
      'Catatan Komite / Admin': app.adminReview?.notes || '-',
      'Status Verifikasi Risk':
        app.riskVerification?.status === 'verified'
          ? 'Terverifikasi Sah'
          : app.riskVerification?.status === 'need_correction'
          ? 'Catatan Koreksi Risiko'
          : app.adminReview
          ? 'Menunggu Verifikasi Risk'
          : '-',
      'Kode Verifikasi Risk': app.riskVerification?.verificationCode || '-',
      'Verifikator Manajemen Risiko': app.riskVerification?.verifiedBy || '-',
      'Tanggal Verifikasi Risk': app.riskVerification?.verifiedAt
        ? new Date(app.riskVerification.verifiedAt).toLocaleString('id-ID')
        : '-',
      'Catatan Manajemen Risiko': app.riskVerification?.notes || '-',
    };
  });

  const workbook = XLSX.utils.book_new();
  const masterSheet = XLSX.utils.json_to_sheet(masterData);
  XLSX.utils.book_append_sheet(workbook, masterSheet, 'Ringkasan Scoring');

  // If exporting a single application or top items, let's include detail sheet of 68 Checklist parameters
  if (applications.length === 1) {
    const app = applications[0];
    const answerMap = new Map(app.checklistAnswers.map((a) => [a.questionId, a]));

    const checklistData = SURVEY_QUESTIONS.map((q) => {
      const ans = answerMap.get(q.id);
      return {
        'No': q.id,
        'Kode': q.code,
        'Area / Kategori': q.category,
        'Pertanyaan / Verifikasi': q.question,
        'Panduan Bukti / Evidence': q.evidenceGuide,
        'Dimensi 5C': q.dimension5C,
        'Status Jawaban': ans ? formatAnswerStatus(ans.status) : 'Belum Diisi',
        'Catatan Lapangan Surveyor': ans?.notes || '-',
      };
    });

    const detailSheet = XLSX.utils.json_to_sheet(checklistData);
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Checklist 68 Parameter');
  }

  XLSX.writeFile(workbook, fileName);
}

// ============================================================
// Full Database Backup & Restore via Excel (.xlsx)
// ============================================================
export interface DatabaseBackupMeta {
  backupVersion: string;
  exportedAt: string;
  exportedBy: string;
  institutionName: string;
  counts: {
    applications: number;
    users: number;
    questions: number;
    auditLogs: number;
    notifications: number;
  };
}

export interface DatabaseBackupPayload {
  meta: DatabaseBackupMeta;
  applications?: SurveyApplication[];
  users?: User[];
  questions?: QuestionDefinition[];
  auditLogs?: AuditLog[];
  notifications?: AppNotification[];
  scoringConfig?: ScoringFormulaConfig;
  appSettings?: AppSettings;
}

const EXCEL_CELL_CHUNK_SIZE = 30000; // Safely below Excel's 32,767 character limit per cell

interface RestoreChunkRow {
  collection: string;
  docId: string;
  chunkIndex: number;
  totalChunks: number;
  payloadChunk: string;
}

function pushChunkedDoc(rows: RestoreChunkRow[], collection: string, docId: string, obj: unknown) {
  const json = JSON.stringify(obj);
  const totalChunks = Math.max(1, Math.ceil(json.length / EXCEL_CELL_CHUNK_SIZE));
  for (let i = 0; i < totalChunks; i++) {
    rows.push({
      collection,
      docId,
      chunkIndex: i,
      totalChunks,
      payloadChunk: json.slice(i * EXCEL_CELL_CHUNK_SIZE, (i + 1) * EXCEL_CELL_CHUNK_SIZE),
    });
  }
}

export function exportFullDatabaseBackupToExcel(
  payload: DatabaseBackupPayload,
  fileName?: string
) {
  const workbook = XLSX.utils.book_new();
  const apps = payload.applications || [];
  const staff = payload.users || [];
  const qs = payload.questions || [];
  const logs = payload.auditLogs || [];
  const notifs = payload.notifications || [];

  // Sheet 1: Info_Backup (Human-readable summary)
  const infoRows = [
    { Parameter: 'Versi Format Backup', Nilai: payload.meta.backupVersion },
    { Parameter: 'Waktu Backup', Nilai: new Date(payload.meta.exportedAt).toLocaleString('id-ID') },
    { Parameter: 'Waktu Backup (ISO)', Nilai: payload.meta.exportedAt },
    { Parameter: 'Dibuat Oleh', Nilai: payload.meta.exportedBy },
    { Parameter: 'Nama Lembaga', Nilai: payload.meta.institutionName },
    { Parameter: 'Jumlah Berkas Survey', Nilai: apps.length },
    { Parameter: 'Jumlah Akun Staf', Nilai: staff.length },
    { Parameter: 'Jumlah Butir Checklist', Nilai: qs.length },
    { Parameter: 'Jumlah Log Audit', Nilai: logs.length },
    { Parameter: 'Jumlah Notifikasi', Nilai: notifs.length },
    { Parameter: 'Rumus Scoring Disertakan', Nilai: payload.scoringConfig ? 'Ya' : 'Tidak' },
    { Parameter: 'Pengaturan Lembaga Disertakan', Nilai: payload.appSettings ? 'Ya' : 'Tidak' },
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(infoRows), 'Info_Backup');

  // Sheet 2: Ringkasan_Pengajuan
  const appSummaryRows = apps.map((app, index) => ({
    No: index + 1,
    'ID Dokumen': app.id,
    'No. Pengajuan': app.applicationNumber,
    'Tanggal Survey': app.evidence?.tanggalSurvey || app.createdAt,
    'Nama Debitur': app.namaDebitur,
    NIK: app.nik,
    'No. KK': app.noKk,
    'No. HP': app.noHp,
    Cabang: app.cabang,
    Surveyor: app.marketingName,
    'Plafon Diajukan (Rp)': app.financial?.plafonDiajukan || 0,
    'Tenor (Bln)': app.financial?.tenorBulanDiajukan || 0,
    'Skor 5C': app.scoring?.totalScore || 0,
    Grade: app.scoring?.ratingGrade || '-',
    'Status Validasi BM': formatBMValidation(app.branchValidation?.status),
    'Status Pengajuan': formatStatusText(app.status),
    'Verifikasi Risk': app.riskVerification?.status || '-',
  }));
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      appSummaryRows.length > 0 ? appSummaryRows : [{ Info: 'Tidak ada data pengajuan survey' }]
    ),
    'Ringkasan_Pengajuan'
  );

  // Sheet 3: Data_Staf
  const staffRows = staff.map((u, idx) => ({
    No: idx + 1,
    ID: u.id,
    Nama: u.name,
    Username: u.username,
    Email: u.email,
    Peran: u.role,
    Jabatan: u.roleTitle,
    Cabang: u.branch,
    Status: u.status,
  }));
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(staffRows.length > 0 ? staffRows : [{ Info: 'Tidak ada data staf' }]),
    'Data_Staf'
  );

  // Sheet 4: Checklist_5C
  const questionRows = qs.map((q) => ({
    ID: q.id,
    Kode: q.code,
    Kategori: q.category,
    Dimensi_5C: q.dimension5C,
    Kritis: q.criticality,
    Aktif: q.isActive !== false ? 'Ya' : 'Tidak',
    Pertanyaan: q.question,
  }));
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(questionRows.length > 0 ? questionRows : [{ Info: 'Tidak ada checklist' }]),
    'Checklist_5C'
  );

  // Sheet 5: Log_Audit
  const logRows = logs.map((l, idx) => ({
    No: idx + 1,
    Waktu: l.timestamp,
    Pengguna: l.userName,
    Peran: l.userRole,
    Aksi: l.action,
    'No. Pengajuan': l.applicationNumber || '-',
    Detail: l.details.slice(0, 30000),
  }));
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(logRows.length > 0 ? logRows : [{ Info: 'Tidak ada log audit' }]),
    'Log_Audit'
  );

  // Sheet 6: _DB_RESTORE_DATA (Lossless chunked JSON for 100% accurate restore)
  const chunkRows: RestoreChunkRow[] = [];
  pushChunkedDoc(chunkRows, 'meta', 'backup_meta', payload.meta);

  apps.forEach((app) => pushChunkedDoc(chunkRows, 'applications', app.id, app));
  staff.forEach((u) => pushChunkedDoc(chunkRows, 'users', u.id, u));
  if (qs.length > 0) {
    pushChunkedDoc(chunkRows, 'questions', 'survey_questions', qs);
  }
  logs.forEach((l) => pushChunkedDoc(chunkRows, 'auditLogs', l.id, l));
  notifs.forEach((n) => pushChunkedDoc(chunkRows, 'notifications', n.id, n));
  if (payload.scoringConfig) {
    pushChunkedDoc(chunkRows, 'scoringConfig', payload.scoringConfig.id || 'scoring-config-bmt', payload.scoringConfig);
  }
  if (payload.appSettings) {
    pushChunkedDoc(chunkRows, 'appSettings', 'app_config', payload.appSettings);
  }

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(chunkRows), '_DB_RESTORE_DATA');

  const dateStamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const finalName = fileName || `Backup_Database_BMT_${dateStamp}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}

export async function parseDatabaseBackupFromExcel(file: File): Promise<DatabaseBackupPayload> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const restoreSheet = workbook.Sheets['_DB_RESTORE_DATA'];
  if (!restoreSheet) {
    throw new Error(
      'File Excel tidak memiliki sheet "_DB_RESTORE_DATA". Pastikan Anda memilih file hasil Backup Database dari aplikasi ini.'
    );
  }

  const rawRows = XLSX.utils.sheet_to_json<RestoreChunkRow>(restoreSheet);
  if (!rawRows || rawRows.length === 0) {
    throw new Error('Sheet "_DB_RESTORE_DATA" kosong dan tidak berisi data backup.');
  }

  // Group chunks by collection + docId
  const grouped = new Map<string, { collection: string; docId: string; chunks: RestoreChunkRow[] }>();
  for (const row of rawRows) {
    if (!row.collection || !row.docId || typeof row.payloadChunk !== 'string') continue;
    const key = `${row.collection}::${row.docId}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.chunks.push(row);
    } else {
      grouped.set(key, {
        collection: String(row.collection),
        docId: String(row.docId),
        chunks: [row],
      });
    }
  }

  let meta: DatabaseBackupMeta | null = null;
  const applications: SurveyApplication[] = [];
  const users: User[] = [];
  let questions: QuestionDefinition[] | undefined;
  const auditLogs: AuditLog[] = [];
  const notifications: AppNotification[] = [];
  let scoringConfig: ScoringFormulaConfig | undefined;
  let appSettings: AppSettings | undefined;

  for (const entry of grouped.values()) {
    entry.chunks.sort((a, b) => Number(a.chunkIndex) - Number(b.chunkIndex));
    const jsonString = entry.chunks.map((c) => c.payloadChunk).join('');
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error(`Data korup pada koleksi "${entry.collection}" (ID: ${entry.docId}).`);
    }

    if (entry.collection === 'meta') {
      meta = parsed as DatabaseBackupMeta;
    } else if (entry.collection === 'applications') {
      applications.push(parsed as SurveyApplication);
    } else if (entry.collection === 'users') {
      users.push(parsed as User);
    } else if (entry.collection === 'questions' && Array.isArray(parsed)) {
      questions = parsed as QuestionDefinition[];
    } else if (entry.collection === 'auditLogs') {
      auditLogs.push(parsed as AuditLog);
    } else if (entry.collection === 'notifications') {
      notifications.push(parsed as AppNotification);
    } else if (entry.collection === 'scoringConfig') {
      scoringConfig = parsed as ScoringFormulaConfig;
    } else if (entry.collection === 'appSettings') {
      appSettings = parsed as AppSettings;
    }
  }

  if (!meta) {
    meta = {
      backupVersion: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'Super Admin',
      institutionName: appSettings?.institutionName || 'BMT Dana Insani',
      counts: {
        applications: applications.length,
        users: users.length,
        questions: questions?.length || 0,
        auditLogs: auditLogs.length,
        notifications: notifications.length,
      },
    };
  }

  return {
    meta,
    applications: applications.length > 0 || meta.counts.applications === 0 ? applications : undefined,
    users: users.length > 0 ? users : undefined,
    questions,
    auditLogs: auditLogs.length > 0 ? auditLogs : undefined,
    notifications: notifications.length > 0 ? notifications : undefined,
    scoringConfig,
    appSettings,
  };
}

function formatStatusText(status: string): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'submitted':
      return 'Menunggu Review Admin';
    case 'under_review':
      return 'Sedang Ditinjau';
    case 'approved':
      return 'Disetujui Penuh';
    case 'conditional_approval':
      return 'Disetujui Bersyarat';
    case 'rejected':
      return 'Ditolak';
    default:
      return status;
  }
}

function formatAnswerStatus(status: string): string {
  switch (status) {
    case 'sesuai':
      return 'Sesuai / Valid';
    case 'cukup':
      return 'Cukup / Ragu';
    case 'tidak_sesuai':
      return 'Tidak Sesuai / Red Flag';
    case 'na':
      return 'N/A (Tidak Berlaku)';
    default:
      return status;
  }
}

function formatBMValidation(status?: string): string {
  switch (status) {
    case 'valid':
      return 'Valid (Diteruskan ke Komite)';
    case 'revision':
      return 'Perlu Revisi AO';
    case 'rejected':
      return 'Ditolak di Cabang';
    case 'pending':
    default:
      return 'Menunggu Validasi BM';
  }
}

