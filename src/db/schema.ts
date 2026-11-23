import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (linked to Firebase Auth UID + staff profile fields)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  appUserId: text('app_user_id').unique(),
  name: text('name').notNull().default(''),
  email: text('email').notNull(),
  role: text('role').notNull().default('marketing'),
  roleTitle: text('role_title').notNull().default('Account Officer / Surveyor Lapangan'),
  department: text('department').notNull().default('Marketing & Financing Survey'),
  branch: text('branch').notNull().default('Kantor Pusat'),
  avatarUrl: text('avatar_url'),
  phone: text('phone').notNull().default(''),
  status: text('status').notNull().default('active'),
  username: text('username').notNull().default(''),
  initialUsername: text('initial_username').notNull().default(''),
  password: text('password').notNull().default(''),
  initialPassword: text('initial_password'),
  lastModifiedCredentialsAt: text('last_modified_credentials_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Survey applications table
export const surveyApplications = pgTable('survey_applications', {
  id: text('id').primaryKey(),
  applicationNumber: text('application_number').notNull().unique(),
  namaDebitur: text('nama_debitur').notNull(),
  nik: text('nik').notNull(),
  noKk: text('no_kk').notNull(),
  noHp: text('no_hp').notNull(),
  alamatKtp: text('alamat_ktp').notNull(),
  alamatDomisili: text('alamat_domisili').notNull(),
  jenisUsaha: text('jenis_usaha').notNull(),
  lamaUsahaBulan: integer('lama_usaha_bulan').notNull().default(0),
  statusPernikahan: text('status_pernikahan').notNull(),
  namaPasangan: text('nama_pasangan'),
  marketingId: text('marketing_id').notNull(),
  marketingName: text('marketing_name').notNull(),
  cabang: text('cabang').notNull(),
  status: text('status').notNull().default('submitted'),
  checklistAnswers: jsonb('checklist_answers').notNull(),
  financial: jsonb('financial').notNull(),
  collateral: jsonb('collateral').notNull(),
  collaterals: jsonb('collaterals'),
  evidence: jsonb('evidence').notNull(),
  fraudEvaluation: jsonb('fraud_evaluation').notNull(),
  scoring: jsonb('scoring').notNull(),
  branchValidation: jsonb('branch_validation'),
  analystCheck: jsonb('analyst_check'),
  managementNote: jsonb('management_note'),
  adminReview: jsonb('admin_review'),
  riskVerification: jsonb('risk_verification'),
  disbursementInstruction: jsonb('disbursement_instruction'),
  disbursementExecution: jsonb('disbursement_execution'),
  createdByUid: text('created_by_uid').references(() => users.uid),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  applicationId: text('application_id'),
  applicationNumber: text('application_number'),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  timestamp: text('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  applicationId: text('application_id'),
  applicationNumber: text('application_number'),
  targetRole: text('target_role'),
  targetBranch: text('target_branch'),
  timestamp: text('timestamp').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Scoring formula configs table
export const scoringConfigs = pgTable('scoring_configs', {
  id: text('id').primaryKey(),
  policyName: text('policy_name').notNull(),
  policyVersion: text('policy_version').notNull(),
  configData: jsonb('config_data').notNull(),
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by').notNull(),
});

// Application settings table
export const appSettingsTable = pgTable('app_settings', {
  id: text('id').primaryKey(),
  settingsData: jsonb('settings_data').notNull(),
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by').notNull(),
});

// Survey checklist questions table
export const surveyQuestionsTable = pgTable('survey_questions', {
  id: integer('id').primaryKey(),
  code: text('code').notNull(),
  category: text('category').notNull(),
  question: text('question').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  questionData: jsonb('question_data').notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(surveyApplications),
}));

export const surveyApplicationsRelations = relations(surveyApplications, ({ one }) => ({
  creator: one(users, {
    fields: [surveyApplications.createdByUid],
    references: [users.uid],
  }),
}));
