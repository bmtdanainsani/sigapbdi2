import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  surveyApplications,
  auditLogs,
  notifications,
  scoringConfigs,
  appSettingsTable,
  surveyQuestionsTable,
} from './schema.ts';
import type {
  SurveyApplication,
  AuditLog,
  AppNotification,
  ScoringFormulaConfig,
  AppSettings,
} from '../types.ts';
import type { QuestionDefinition } from '../data/surveyQuestions.ts';

// --- Survey Applications ---
export async function listApplications(): Promise<SurveyApplication[]> {
  try {
    const rows = await db
      .select()
      .from(surveyApplications)
      .orderBy(desc(surveyApplications.createdAt));

    return rows.map((row) => ({
      id: row.id,
      applicationNumber: row.applicationNumber,
      namaDebitur: row.namaDebitur,
      nik: row.nik,
      noKk: row.noKk,
      noHp: row.noHp,
      alamatKtp: row.alamatKtp,
      alamatDomisili: row.alamatDomisili,
      jenisUsaha: row.jenisUsaha,
      lamaUsahaBulan: row.lamaUsahaBulan,
      statusPernikahan: row.statusPernikahan as SurveyApplication['statusPernikahan'],
      namaPasangan: row.namaPasangan || undefined,
      marketingId: row.marketingId,
      marketingName: row.marketingName,
      cabang: row.cabang,
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString(),
      status: row.status as SurveyApplication['status'],
      checklistAnswers: row.checklistAnswers as SurveyApplication['checklistAnswers'],
      financial: row.financial as SurveyApplication['financial'],
      collateral: row.collateral as SurveyApplication['collateral'],
      collaterals: (row.collaterals as SurveyApplication['collaterals']) || undefined,
      evidence: row.evidence as SurveyApplication['evidence'],
      fraudEvaluation: row.fraudEvaluation as SurveyApplication['fraudEvaluation'],
      scoring: row.scoring as SurveyApplication['scoring'],
      branchValidation: (row.branchValidation as SurveyApplication['branchValidation']) || undefined,
      analystCheck: (row.analystCheck as SurveyApplication['analystCheck']) || undefined,
      managementNote: (row.managementNote as SurveyApplication['managementNote']) || undefined,
      adminReview: (row.adminReview as SurveyApplication['adminReview']) || undefined,
      riskVerification: (row.riskVerification as SurveyApplication['riskVerification']) || undefined,
      disbursementInstruction:
        (row.disbursementInstruction as SurveyApplication['disbursementInstruction']) || undefined,
      disbursementExecution:
        (row.disbursementExecution as SurveyApplication['disbursementExecution']) || undefined,
    }));
  } catch (error) {
    console.error('Database query failed (listApplications):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertApplication(appData: SurveyApplication, createdByUid?: string) {
  try {
    const result = await db
      .insert(surveyApplications)
      .values({
        id: appData.id,
        applicationNumber: appData.applicationNumber,
        namaDebitur: appData.namaDebitur,
        nik: appData.nik,
        noKk: appData.noKk,
        noHp: appData.noHp,
        alamatKtp: appData.alamatKtp,
        alamatDomisili: appData.alamatDomisili,
        jenisUsaha: appData.jenisUsaha,
        lamaUsahaBulan: appData.lamaUsahaBulan,
        statusPernikahan: appData.statusPernikahan,
        namaPasangan: appData.namaPasangan || null,
        marketingId: appData.marketingId,
        marketingName: appData.marketingName,
        cabang: appData.cabang,
        status: appData.status,
        checklistAnswers: appData.checklistAnswers,
        financial: appData.financial,
        collateral: appData.collateral,
        collaterals: appData.collaterals || null,
        evidence: appData.evidence,
        fraudEvaluation: appData.fraudEvaluation,
        scoring: appData.scoring,
        branchValidation: appData.branchValidation || null,
        analystCheck: appData.analystCheck || null,
        managementNote: appData.managementNote || null,
        adminReview: appData.adminReview || null,
        riskVerification: appData.riskVerification || null,
        disbursementInstruction: appData.disbursementInstruction || null,
        disbursementExecution: appData.disbursementExecution || null,
        createdByUid: createdByUid || null,
        createdAt: appData.createdAt ? new Date(appData.createdAt) : new Date(),
        updatedAt: appData.updatedAt ? new Date(appData.updatedAt) : new Date(),
      })
      .onConflictDoUpdate({
        target: surveyApplications.id,
        set: {
          applicationNumber: appData.applicationNumber,
          namaDebitur: appData.namaDebitur,
          nik: appData.nik,
          noKk: appData.noKk,
          noHp: appData.noHp,
          alamatKtp: appData.alamatKtp,
          alamatDomisili: appData.alamatDomisili,
          jenisUsaha: appData.jenisUsaha,
          lamaUsahaBulan: appData.lamaUsahaBulan,
          statusPernikahan: appData.statusPernikahan,
          namaPasangan: appData.namaPasangan || null,
          status: appData.status,
          checklistAnswers: appData.checklistAnswers,
          financial: appData.financial,
          collateral: appData.collateral,
          collaterals: appData.collaterals || null,
          evidence: appData.evidence,
          fraudEvaluation: appData.fraudEvaluation,
          scoring: appData.scoring,
          branchValidation: appData.branchValidation || null,
          analystCheck: appData.analystCheck || null,
          managementNote: appData.managementNote || null,
          adminReview: appData.adminReview || null,
          riskVerification: appData.riskVerification || null,
          disbursementInstruction: appData.disbursementInstruction || null,
          disbursementExecution: appData.disbursementExecution || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed (upsertApplication):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function deleteApplicationById(id: string) {
  try {
    await db.delete(surveyApplications).where(eq(surveyApplications.id, id));
  } catch (error) {
    console.error('Database query failed (deleteApplicationById):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function deleteAllApplicationsInDb() {
  try {
    await db.delete(surveyApplications);
  } catch (error) {
    console.error('Database query failed (deleteAllApplicationsInDb):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// --- Audit Logs ---
export async function listAuditLogs(): Promise<AuditLog[]> {
  try {
    const rows = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt));

    return rows.map((row) => ({
      id: row.id,
      applicationId: row.applicationId || undefined,
      applicationNumber: row.applicationNumber || undefined,
      userId: row.userId,
      userName: row.userName,
      userRole: row.userRole as AuditLog['userRole'],
      action: row.action,
      details: row.details,
      timestamp: row.timestamp,
    }));
  } catch (error) {
    console.error('Database query failed (listAuditLogs):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function insertAuditLog(logData: AuditLog) {
  try {
    const result = await db
      .insert(auditLogs)
      .values({
        id: logData.id,
        applicationId: logData.applicationId || null,
        applicationNumber: logData.applicationNumber || null,
        userId: logData.userId,
        userName: logData.userName,
        userRole: logData.userRole,
        action: logData.action,
        details: logData.details,
        timestamp: logData.timestamp,
      })
      .onConflictDoNothing({ target: auditLogs.id })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed (insertAuditLog):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// --- Notifications ---
export async function listNotifications(): Promise<AppNotification[]> {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type as AppNotification['type'],
      applicationId: row.applicationId || undefined,
      applicationNumber: row.applicationNumber || undefined,
      targetRole: (row.targetRole as AppNotification['targetRole']) || undefined,
      targetBranch: row.targetBranch || undefined,
      timestamp: row.timestamp,
      read: row.read,
    }));
  } catch (error) {
    console.error('Database query failed (listNotifications):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertNotification(notifData: AppNotification) {
  try {
    const result = await db
      .insert(notifications)
      .values({
        id: notifData.id,
        title: notifData.title,
        message: notifData.message,
        type: notifData.type,
        applicationId: notifData.applicationId || null,
        applicationNumber: notifData.applicationNumber || null,
        targetRole: notifData.targetRole || null,
        targetBranch: notifData.targetBranch || null,
        timestamp: notifData.timestamp,
        read: notifData.read,
      })
      .onConflictDoUpdate({
        target: notifications.id,
        set: {
          read: notifData.read,
          title: notifData.title,
          message: notifData.message,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed (upsertNotification):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function deleteNotificationById(id: string) {
  try {
    await db.delete(notifications).where(eq(notifications.id, id));
  } catch (error) {
    console.error('Database query failed (deleteNotificationById):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// --- Scoring Config ---
export async function getScoringConfigById(id = 'scoring-config-bmt'): Promise<ScoringFormulaConfig | null> {
  try {
    const rows = await db
      .select()
      .from(scoringConfigs)
      .where(eq(scoringConfigs.id, id));
    if (!rows.length) return null;
    return rows[0].configData as ScoringFormulaConfig;
  } catch (error) {
    console.error('Database query failed (getScoringConfigById):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertScoringConfig(config: ScoringFormulaConfig) {
  try {
    const id = config.id || 'scoring-config-bmt';
    const result = await db
      .insert(scoringConfigs)
      .values({
        id,
        policyName: config.policyName,
        policyVersion: config.policyVersion,
        configData: config,
        updatedAt: config.updatedAt || new Date().toISOString(),
        updatedBy: config.updatedBy || 'Super Administrator',
      })
      .onConflictDoUpdate({
        target: scoringConfigs.id,
        set: {
          policyName: config.policyName,
          policyVersion: config.policyVersion,
          configData: config,
          updatedAt: config.updatedAt || new Date().toISOString(),
          updatedBy: config.updatedBy || 'Super Administrator',
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed (upsertScoringConfig):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// --- App Settings ---
export async function getAppSettingsById(id = 'app_config'): Promise<AppSettings | null> {
  try {
    const rows = await db
      .select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.id, id));
    if (!rows.length) return null;
    return rows[0].settingsData as AppSettings;
  } catch (error) {
    console.error('Database query failed (getAppSettingsById):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertAppSettings(settings: AppSettings, id = 'app_config') {
  try {
    const result = await db
      .insert(appSettingsTable)
      .values({
        id,
        settingsData: settings,
        updatedAt: settings.updatedAt || new Date().toISOString(),
        updatedBy: settings.updatedBy || 'Super Administrator',
      })
      .onConflictDoUpdate({
        target: appSettingsTable.id,
        set: {
          settingsData: settings,
          updatedAt: settings.updatedAt || new Date().toISOString(),
          updatedBy: settings.updatedBy || 'Super Administrator',
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed (upsertAppSettings):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// --- Survey Questions ---
export async function listQuestions(): Promise<QuestionDefinition[]> {
  try {
    const rows = await db.select().from(surveyQuestionsTable);
    return rows
      .sort((a, b) => a.id - b.id)
      .map((r) => r.questionData as QuestionDefinition);
  } catch (error) {
    console.error('Database query failed (listQuestions):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function replaceQuestions(questionsList: QuestionDefinition[]) {
  try {
    await db.delete(surveyQuestionsTable);
    if (questionsList.length === 0) return [];
    const values = questionsList.map((q) => ({
      id: q.id,
      code: q.code,
      category: q.category,
      question: q.question,
      isActive: q.isActive !== false,
      questionData: q,
    }));
    return await db.insert(surveyQuestionsTable).values(values).returning();
  } catch (error) {
    console.error('Database query failed (replaceQuestions):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
