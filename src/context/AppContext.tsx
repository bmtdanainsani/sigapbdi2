import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  googleAuthProvider,
  db,
  handleFirestoreError,
  OperationType,
  removeUndefinedFields,
} from '../firebase';
import {
  User,
  SurveyApplication,
  AuditLog,
  AppNotification,
  AdminReview,
  ManagementAttentionNote,
  RiskVerificationStatus,
  RiskManagementVerification,
  DisbursementInstruction,
  DisbursementExecution,
  ScoringFormulaConfig,
  AppSettings,
} from '../types';
import {
  DEFAULT_SUPERADMIN,
  INITIAL_USERS,
  INITIAL_APPLICATIONS,
  INITIAL_LOGS,
  INITIAL_NOTIFICATIONS,
  DEFAULT_SCORING_FORMULA_CONFIG,
  DEFAULT_APP_SETTINGS,
} from '../data/seedData';
import { SURVEY_QUESTIONS, QuestionDefinition } from '../data/surveyQuestions';
import { evaluateCreditScore, detectFraudRedFlags } from '../utils/scoringEngine';
import { DatabaseBackupPayload } from '../utils/exportUtils';

export type AppTabId =
  | 'dashboard'
  | 'survey_form'
  | 'applications_list'
  | 'committee'
  | 'risk_workspace'
  | 'checklist_management'
  | 'user_management'
  | 'audit_log'
  | 'branch_workspace'
  | 'disbursement_workspace'
  | 'scoring_formula'
  | 'app_settings'
  | 'office_ao_management'
  | 'backup_restore';

interface AppContextType {
  currentUser: User;
  users: User[];
  applications: SurveyApplication[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  questions: QuestionDefinition[];
  isCloudConnected: boolean;
  activeTab: AppTabId;
  setActiveTab: (tab: AppTabId) => void;
  selectedApplication: SurveyApplication | null;
  setSelectedApplication: (app: SurveyApplication | null) => void;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (open: boolean) => void;
  isPrintReportOpen: boolean;
  setIsPrintReportOpen: (open: boolean) => void;
  isNotificationPanelOpen: boolean;
  setIsNotificationPanelOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isAccountSettingsOpen: boolean;
  setIsAccountSettingsOpen: (open: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  sessionExpiredNotice: string | null;
  clearSessionExpiredNotice: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  toastMessage: { title: string; desc: string; type: 'info' | 'success' | 'alert' } | null;
  clearToast: () => void;
  
  // User Actions
  switchUser: (userId: string) => void;
  loginWithCredentials: (username: string, password: string) => { success: boolean; message?: string };
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  connectGoogleCloudSync: () => Promise<{ success: boolean; message?: string }>;
  logout: (reason?: 'manual' | 'inactivity') => void;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUserStatus: (userId: string, status: 'active' | 'inactive') => void;
  deleteUser: (userId: string) => void;
  updateMyCredentials: (newUsername: string, newPassword?: string) => { success: boolean; message?: string };
  adminUpdateUserCredentials: (userId: string, newUsername: string, newPassword?: string) => { success: boolean; message?: string };
  restoreDefaultRoleAccounts: () => number;
  
  // Application Actions
  submitSurveyApplication: (appData: {
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
    checklistAnswers: SurveyApplication['checklistAnswers'];
    financial: SurveyApplication['financial'];
    collateral: SurveyApplication['collateral'];
    collaterals?: SurveyApplication['collaterals'];
    evidence: SurveyApplication['evidence'];
    selectedCabang?: string;
    selectedAoName?: string;
  }) => SurveyApplication;
  reviewApplication: (applicationId: string, review: AdminReview, disbursementInstruction?: DisbursementInstruction) => void;
  submitDisbursementExecution: (
    applicationId: string,
    executionData: Omit<DisbursementExecution, 'status' | 'bmValidation'>
  ) => void;
  validateDisbursementByBM: (
    applicationId: string,
    status: 'valid' | 'revision',
    notes: string
  ) => void;
  validateApplicationByBM: (
    applicationId: string,
    validationData: {
      status: 'valid' | 'revision' | 'rejected';
      notes: string;
      revisiNotes?: string;
      rekomendasiPlafonBM?: number;
      rekomendasiTenorBM?: number;
    }
  ) => void;
  batchValidateByBM: (
    applicationIds: string[],
    validationData: {
      status: 'valid' | 'revision' | 'rejected';
      notes: string;
      revisiNotes?: string;
    }
  ) => void;
  addManagementNote: (applicationId: string, note: string, isAttention: boolean) => void;
  batchAddManagementNote: (applicationIds: string[], note: string, isAttention: boolean) => void;
  requestRevisionFromAnalystToBM: (applicationId: string, revisionNotes: string) => void;
  verifyAndScheduleCommitteeByAnalyst: (
    applicationId: string,
    scheduleData: {
      noAgenda: string;
      waktuSidang: string;
      lokasiSidang: string;
      notes: string;
    }
  ) => void;
  verifyApplicationByRiskManagement: (
    applicationId: string,
    data: { status: RiskVerificationStatus; notes: string }
  ) => void;
  batchReviewApplications: (
    applicationIds: string[],
    decision: 'approved' | 'conditional_approval' | 'rejected',
    notes: string
  ) => void;
  deleteApplication: (applicationId: string) => void;

  // Checklist Survey Management (Super Admin)
  addQuestion: (newQ: Omit<QuestionDefinition, 'id'>) => void;
  updateQuestion: (id: number, updatedQ: Partial<QuestionDefinition>) => void;
  deleteQuestion: (id: number) => void;
  toggleQuestionActive: (id: number) => void;
  resetQuestionsToDefault: () => void;

  // Scoring & Risk Engine Formula Configuration (Super Admin)
  scoringConfig: ScoringFormulaConfig;
  updateScoringConfig: (newConfig: ScoringFormulaConfig) => void;
  resetScoringConfig: () => void;

  // Application & Institution Settings (Super Admin)
  appSettings: AppSettings;
  updateAppSettings: (newSettings: Partial<AppSettings>) => void;
  resetAppSettings: () => void;
  
  // Notifications
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Navigation / Modal Shortcuts
  viewApplicationDetails: (app: SurveyApplication) => void;
  printApplicationReport: (app: SurveyApplication) => void;
  deleteAllApplications: () => void;
  resetAllData: () => void;

  // Backup & Restore Database (Super Admin)
  recordDatabaseBackup: (counts: {
    applications: number;
    users: number;
    questions: number;
    auditLogs: number;
    notifications: number;
  }) => void;
  restoreDatabaseFromBackup: (
    backup: DatabaseBackupPayload,
    mode: 'merge' | 'replace'
  ) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users state with localStorage fallback
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('credit_scoring_users');
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: User[] = JSON.parse(saved);
      const mapped: User[] = parsed.map((u, idx) => {
        const seed = INITIAL_USERS.find((init) => init.id === u.id);
        const defaultUsername = seed?.username || u.username || u.email.split('@')[0] || `user${idx + 1}`;
        const defaultPassword = seed?.password || u.password || 'BMT2026!';
        return {
          ...u,
          username: u.username || defaultUsername,
          initialUsername: u.initialUsername || seed?.initialUsername || defaultUsername,
          password: u.password || defaultPassword,
          initialPassword: u.initialPassword || seed?.initialPassword || defaultPassword,
        };
      });
      INITIAL_USERS.forEach((seedUser) => {
        if (!mapped.some((u) => u.role === seedUser.role)) {
          mapped.push(seedUser);
        }
      });
      return mapped;
    } catch {
      return INITIAL_USERS;
    }
  });

  const AUTH_USER_STORAGE_KEY = 'credit_scoring_active_user_id';
  const AUTH_LAST_ACTIVITY_KEY = 'credit_scoring_last_activity_at';
  const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 menit

  // Evaluate initial session validity synchronously so first open or expired sessions land on Login page
  const [initialSessionCheck] = useState<{
    authenticated: boolean;
    user: User;
    expiredNotice: string | null;
    lastActivityAt: number;
  }>(() => {
    const fallbackUser = users[0] || DEFAULT_SUPERADMIN;
    try {
      const savedId = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      const savedLastActRaw = localStorage.getItem(AUTH_LAST_ACTIVITY_KEY);
      const savedLastAct = savedLastActRaw ? Number(savedLastActRaw) : 0;
      const found = savedId ? users.find((u) => u.id === savedId && u.status !== 'inactive') : undefined;

      if (!savedId || !found) {
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
        return { authenticated: false, user: fallbackUser, expiredNotice: null, lastActivityAt: Date.now() };
      }

      if (!savedLastAct || Number.isNaN(savedLastAct) || Date.now() - savedLastAct >= INACTIVITY_TIMEOUT_MS) {
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
        return {
          authenticated: false,
          user: fallbackUser,
          expiredNotice: 'Sesi login Anda berakhir otomatis karena tidak digunakan selama 60 menit. Silakan login kembali.',
          lastActivityAt: Date.now(),
        };
      }

      return {
        authenticated: true,
        user: found,
        expiredNotice: null,
        lastActivityAt: savedLastAct,
      };
    } catch {
      return { authenticated: false, user: fallbackUser, expiredNotice: null, lastActivityAt: Date.now() };
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialSessionCheck.authenticated);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(initialSessionCheck.expiredNotice);
  const [currentUser, setCurrentUser] = useState<User>(initialSessionCheck.user);
  const lastActivityRef = useRef<number>(initialSessionCheck.lastActivityAt);
  const isAuthenticatedRef = useRef<boolean>(initialSessionCheck.authenticated);
  const firebaseIdTokenRef = useRef<string | null>(null);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const clearSessionExpiredNotice = () => setSessionExpiredNotice(null);

  const getInMemoryIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        firebaseIdTokenRef.current = token;
        return token;
      } catch {
        return firebaseIdTokenRef.current;
      }
    }
    return firebaseIdTokenRef.current;
  };

  const syncToCloudSql = async (endpoint: string, method: 'POST' | 'PUT' | 'DELETE', payload?: unknown) => {
    const token = await getInMemoryIdToken();
    if (!token) return;
    try {
      await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: payload !== undefined ? JSON.stringify(payload) : undefined,
      });
    } catch (err) {
      console.warn(`[Cloud SQL sync skipped] ${method} ${endpoint}:`, err);
    }
  };

  const [applications, setApplications] = useState<SurveyApplication[]>(() => {
    const saved = localStorage.getItem('credit_scoring_apps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SurveyApplication[];
        // Filter out trial records starting with app-init-
        return parsed.filter((a) => !a.id.startsWith('app-init-'));
      } catch (e) {
        return [];
      }
    }
    return INITIAL_APPLICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('credit_scoring_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('credit_scoring_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [questions, setQuestions] = useState<QuestionDefinition[]>(() => {
    const saved = localStorage.getItem('credit_scoring_questions');
    return saved ? JSON.parse(saved) : SURVEY_QUESTIONS;
  });

  const [scoringConfig, setScoringConfig] = useState<ScoringFormulaConfig>(() => {
    const saved = localStorage.getItem('credit_scoring_formula_config');
    return saved ? JSON.parse(saved) : DEFAULT_SCORING_FORMULA_CONFIG;
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('credit_scoring_app_settings');
    return saved ? JSON.parse(saved) : DEFAULT_APP_SETTINGS;
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AppTabId>('dashboard');
  const [selectedApplication, setSelectedApplication] = useState<SurveyApplication | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'info' | 'success' | 'alert' } | null>(null);

  // Global Theme (Dark Theme vs High-Contrast Light Theme)
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('credit_scoring_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    localStorage.setItem('credit_scoring_theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      root.setAttribute('data-theme', 'light');
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }
    root.setAttribute('data-color-theme', appSettings.colorTheme || 'emerald');
  }, [theme, appSettings.colorTheme]);

  const pendingAppIdsRef = useRef<Set<string>>(new Set());
  const unsyncedLocalAppIdsRef = useRef<Set<string>>(new Set());
  const hasClearedAppsExplicitlyRef = useRef<boolean>(false);
  const isCloudAdminRef = useRef<boolean>(false);
  const isCloudStaffRef = useRef<boolean>(false);
  const localSyncNoticeAtRef = useRef<number>(0);

  const compressDataUrlForFirestore = (
    dataUrl: string,
    maxDim: number,
    quality: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      if (typeof document === 'undefined' || !dataUrl.startsWith('data:image/')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const recompressImagesInObject = async (
    value: any,
    maxDim: number,
    quality: number
  ): Promise<any> => {
    if (typeof value === 'string') {
      if (value.startsWith('data:image/') && value.length > 25000) {
        return compressDataUrlForFirestore(value, maxDim, quality);
      }
      return value;
    }
    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => recompressImagesInObject(item, maxDim, quality)));
    }
    if (value !== null && typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = await recompressImagesInObject(v, maxDim, quality);
      }
      return result;
    }
    return value;
  };

  const preparePayloadForFirestore = async (raw: any): Promise<any> => {
    let payload = removeUndefinedFields(raw);
    if (!payload) return null;

    const getByteSize = (obj: any) => new TextEncoder().encode(JSON.stringify(obj)).length;
    if (getByteSize(payload) <= 850000) return payload;

    payload = await recompressImagesInObject(payload, 520, 0.45);
    if (getByteSize(payload) <= 850000) return payload;

    payload = await recompressImagesInObject(payload, 360, 0.35);
    return payload;
  };

  const syncStaffAccessEntry = async (targetUser: User, activeOverride?: boolean) => {
    const activeFbUser = auth.currentUser;
    if (!activeFbUser || !activeFbUser.emailVerified || !isCloudAdminRef.current) return;
    const emailLower = (targetUser.email || '').trim().toLowerCase();
    if (!emailLower || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return;
    try {
      await setDoc(doc(db, 'staffAccess', emailLower), {
        email: emailLower,
        role: targetUser.role,
        branch: targetUser.branch || 'Kantor Pusat',
        active: activeOverride !== undefined ? activeOverride : targetUser.status !== 'inactive',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`[Firestore staffAccess sync warning] ${emailLower}:`, err);
    }
  };

  const removeStaffAccessEntry = async (email?: string) => {
    const activeFbUser = auth.currentUser;
    if (!activeFbUser || !activeFbUser.emailVerified || !isCloudAdminRef.current) return;
    const emailLower = (email || '').trim().toLowerCase();
    if (!emailLower || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return;
    try {
      await deleteDoc(doc(db, 'staffAccess', emailLower));
    } catch (err) {
      console.warn(`[Firestore staffAccess delete warning] ${emailLower}:`, err);
    }
  };

  const ensureWorkspaceCloudRole = async (
    fbUser: FirebaseUser
  ): Promise<{
    isAdminUser: boolean;
    isStaffUser: boolean;
    isWorkspaceOwner: boolean;
    staffRole?: User['role'];
  }> => {
    const emailLower = (fbUser.email || '').trim().toLowerCase();
    const isSeedAdminEmail = emailLower === 'bmtdanainsani@gmail.com';
    const nowIso = new Date().toISOString();

    try {
      const ownerRef = doc(db, 'workspaceMeta', 'owner');
      const ownerSnap = await getDoc(ownerRef);

      if (!ownerSnap.exists()) {
        const batch = writeBatch(db);
        batch.set(ownerRef, {
          ownerUid: fbUser.uid,
          ownerEmail: fbUser.email || `${fbUser.uid}@firebase.local`,
          claimedAt: nowIso,
        });
        batch.set(doc(db, 'admins', fbUser.uid), {
          uid: fbUser.uid,
          email: fbUser.email || `${fbUser.uid}@firebase.local`,
          grantedAt: nowIso,
        });
        if (emailLower && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
          batch.set(doc(db, 'staffAccess', emailLower), {
            email: emailLower,
            role: 'super_admin',
            branch: 'Kantor Pusat',
            active: true,
            updatedAt: nowIso,
          });
        }
        await batch.commit();
        return {
          isAdminUser: true,
          isStaffUser: true,
          isWorkspaceOwner: true,
          staffRole: 'super_admin',
        };
      }

      const ownerData = ownerSnap.data() as { ownerUid?: string } | undefined;
      const isWorkspaceOwner = ownerData?.ownerUid === fbUser.uid;

      const adminRef = doc(db, 'admins', fbUser.uid);
      const adminSnap = await getDoc(adminRef);

      let staffData: { role?: User['role']; active?: boolean } | null = null;
      if (emailLower && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        try {
          const staffSnap = await getDoc(doc(db, 'staffAccess', emailLower));
          if (staffSnap.exists()) {
            staffData = staffSnap.data() as { role?: User['role']; active?: boolean };
          }
        } catch (err) {
          console.warn('[Firestore staffAccess check warning]:', err);
        }
      }

      const isPromotedSuperAdmin = Boolean(staffData?.active && staffData?.role === 'super_admin');
      let isAdminUser = isSeedAdminEmail || isWorkspaceOwner || adminSnap.exists() || isPromotedSuperAdmin;

      if ((isWorkspaceOwner || isSeedAdminEmail || isPromotedSuperAdmin) && !adminSnap.exists()) {
        try {
          await setDoc(adminRef, {
            uid: fbUser.uid,
            email: fbUser.email || `${fbUser.uid}@firebase.local`,
            grantedAt: nowIso,
          });
          isAdminUser = true;
        } catch (err) {
          console.warn('[Firestore admin bootstrap warning]:', err);
        }
      }

      const isStaffUser = isAdminUser || Boolean(staffData?.active);
      return {
        isAdminUser,
        isStaffUser,
        isWorkspaceOwner,
        staffRole: isAdminUser ? 'super_admin' : staffData?.active ? staffData.role : undefined,
      };
    } catch (err) {
      console.warn('[Firestore workspace role resolution warning]:', err);
      return {
        isAdminUser: isSeedAdminEmail,
        isStaffUser: isSeedAdminEmail,
        isWorkspaceOwner: false,
      };
    }
  };

  // Helper to persist documents to Cloud Firestore & Cloud SQL with size guard and auth check
  const persistFirestoreDoc = async (colName: string, docId: string, data: any): Promise<boolean> => {
    if (colName === 'applications') {
      pendingAppIdsRef.current.add(docId);
    }
    if (colName === 'users') {
      void syncToCloudSql(`/api/users/${encodeURIComponent(docId)}`, 'PUT', data);
    } else if (colName === 'applications') {
      void syncToCloudSql(`/api/applications/${encodeURIComponent(docId)}`, 'PUT', data);
    } else if (colName === 'auditLogs') {
      void syncToCloudSql('/api/audit-logs', 'POST', data);
    } else if (colName === 'notifications') {
      void syncToCloudSql(`/api/notifications/${encodeURIComponent(docId)}`, 'PUT', data);
    } else if (colName === 'scoringConfig') {
      void syncToCloudSql('/api/scoring-config', 'PUT', data);
    } else if (colName === 'settings') {
      void syncToCloudSql('/api/app-settings', 'PUT', data);
    } else if (colName === 'checklistConfig') {
      void syncToCloudSql('/api/questions', 'PUT', { questions: data?.questions || [] });
    }

    const activeFbUser = auth.currentUser;
    if (!activeFbUser || !activeFbUser.emailVerified) {
      setIsCloudConnected(false);
      if (colName === 'applications') {
        pendingAppIdsRef.current.delete(docId);
        unsyncedLocalAppIdsRef.current.add(docId);
      }
      if (
        colName === 'applications' ||
        colName === 'users' ||
        colName === 'scoringConfig' ||
        colName === 'settings' ||
        colName === 'checklistConfig'
      ) {
        const nowMs = Date.now();
        if (nowMs - localSyncNoticeAtRef.current > 20000) {
          localSyncNoticeAtRef.current = nowMs;
          window.setTimeout(() => {
            setToastMessage({
              title: 'Tersimpan Lokal (Belum Sinkron Cloud)',
              desc: 'Agar data tersimpan ke Cloud & muncul di gadget lain, klik "Hubungkan Cloud (Google)" di bagian atas.',
              type: 'alert',
            });
          }, 400);
        }
      }
      return false;
    }

    const enriched = { ...data };
    if (colName === 'applications' || colName === 'auditLogs' || colName === 'notifications') {
      if (!enriched.ownerUid) {
        enriched.ownerUid = activeFbUser.uid;
      }
    } else if (colName === 'users') {
      if (!enriched.uid && enriched.email?.toLowerCase() === activeFbUser.email?.toLowerCase()) {
        enriched.uid = activeFbUser.uid;
      }
    }

    try {
      const sanitized = await preparePayloadForFirestore(enriched);
      if (!sanitized) return false;
      await setDoc(doc(db, colName, docId), sanitized);
      setIsCloudConnected(true);
      if (colName === 'applications') {
        pendingAppIdsRef.current.delete(docId);
        unsyncedLocalAppIdsRef.current.delete(docId);
      }
      return true;
    } catch (err: any) {
      console.error(`[Firestore sync error] ${colName}/${docId}:`, err);
      if (colName === 'applications') {
        pendingAppIdsRef.current.delete(docId);
      }
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('network')) {
        setIsCloudConnected(false);
      }
      if (
        colName === 'applications' ||
        colName === 'users' ||
        colName === 'scoringConfig' ||
        colName === 'settings' ||
        colName === 'checklistConfig'
      ) {
        setToastMessage({
          title: 'Sinkronisasi Cloud Gagal',
          desc: `Data tersimpan lokal, namun gagal sinkron ke Cloud Firestore (${errMsg.slice(0, 120)}).`,
          type: 'alert',
        });
      }
      return false;
    }
  };

  const removeFirestoreDoc = (colName: string, docId: string) => {
    if (colName === 'applications') {
      pendingAppIdsRef.current.delete(docId);
      unsyncedLocalAppIdsRef.current.delete(docId);
      void syncToCloudSql(`/api/applications/${encodeURIComponent(docId)}`, 'DELETE');
    } else if (colName === 'users') {
      void syncToCloudSql(`/api/users/${encodeURIComponent(docId)}`, 'DELETE');
    } else if (colName === 'notifications') {
      void syncToCloudSql(`/api/notifications/${encodeURIComponent(docId)}`, 'DELETE');
    }

    const activeFbUser = auth.currentUser;
    if (!activeFbUser || !activeFbUser.emailVerified) {
      return;
    }

    deleteDoc(doc(db, colName, docId)).catch((err) => {
      console.warn(`[Firestore delete warning] ${colName}/${docId}:`, err);
    });
  };

  // Firebase Auth listener + optional Cloud SQL bootstrap
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        firebaseIdTokenRef.current = null;
        isCloudAdminRef.current = false;
        isCloudStaffRef.current = false;
        setIsCloudConnected(false);
        return;
      }
      try {
        const token = await fbUser.getIdToken();
        firebaseIdTokenRef.current = token;
        const res = await fetch('/api/bootstrap', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.cloudSqlEnabled) return;

        if (Array.isArray(data.users) && data.users.length > 0) {
          setUsers((prev) => {
            const map = new Map<string, User>();
            prev.forEach((u) => map.set(u.id, u));
            data.users.forEach((u: User) => map.set(u.id, u));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(data.applications) && data.applications.length > 0) {
          setApplications((prev) => {
            const map = new Map<string, SurveyApplication>();
            prev.forEach((a) => map.set(a.id, a));
            data.applications.forEach((a: SurveyApplication) => map.set(a.id, a));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
          });
        }
        if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
          setAuditLogs((prev) => {
            const map = new Map<string, AuditLog>();
            prev.forEach((l) => map.set(l.id, l));
            data.auditLogs.forEach((l: AuditLog) => map.set(l.id, l));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
          });
        }
        if (Array.isArray(data.notifications) && data.notifications.length > 0) {
          setNotifications((prev) => {
            const map = new Map<string, AppNotification>();
            prev.forEach((n) => map.set(n.id, n));
            data.notifications.forEach((n: AppNotification) => map.set(n.id, n));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
          });
        }
        if (data.scoringConfig && data.scoringConfig.weights5C) {
          setScoringConfig(data.scoringConfig);
        }
        if (data.appSettings && data.appSettings.appName) {
          setAppSettings(data.appSettings);
        }
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
        }
      } catch (err) {
        console.warn('[Bootstrap warning]:', err);
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time synchronization with Cloud Firestore (when Firebase Auth user is verified)
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) {
      setIsCloudConnected(false);
      isCloudAdminRef.current = false;
      isCloudStaffRef.current = false;
      return;
    }

    let cancelled = false;
    const unsubs: Array<() => void> = [];

    const setupFirestoreListeners = async () => {
      const roleInfo = await ensureWorkspaceCloudRole(firebaseUser);
      if (cancelled) return;

      isCloudAdminRef.current = roleInfo.isAdminUser;
      isCloudStaffRef.current = roleInfo.isStaffUser;
      const isAdminUser = roleInfo.isAdminUser;
      const canViewWorkspaceData = roleInfo.isAdminUser || roleInfo.isStaffUser;

      const usersRef = isAdminUser
        ? collection(db, 'users')
        : query(collection(db, 'users'), where('email', '==', firebaseUser.email || ''));
      const appsRef = canViewWorkspaceData
        ? collection(db, 'applications')
        : query(collection(db, 'applications'), where('ownerUid', '==', firebaseUser.uid));
      const logsRef = canViewWorkspaceData
        ? collection(db, 'auditLogs')
        : query(collection(db, 'auditLogs'), where('ownerUid', '==', firebaseUser.uid));
      const notifsRef = canViewWorkspaceData
        ? collection(db, 'notifications')
        : query(collection(db, 'notifications'), where('ownerUid', '==', firebaseUser.uid));

      // 1. Users sync
      unsubs.push(
        onSnapshot(
          usersRef,
          (snapshot) => {
            setIsCloudConnected(true);
            if (snapshot.empty) {
              if (isAdminUser && !snapshot.metadata.fromCache) {
                INITIAL_USERS.forEach((u) => {
                  void persistFirestoreDoc('users', u.id, u);
                  void syncStaffAccessEntry(u);
                });
                setUsers(INITIAL_USERS);
              }
            } else {
              const firestoreUsers = snapshot.docs.map((d) => d.data() as User);
              if (isAdminUser) {
                if (!snapshot.metadata.fromCache) {
                  INITIAL_USERS.forEach((seedUser) => {
                    if (!firestoreUsers.some((u) => u.role === seedUser.role)) {
                      void persistFirestoreDoc('users', seedUser.id, seedUser);
                      firestoreUsers.push(seedUser);
                    }
                  });
                  firestoreUsers.forEach((u) => {
                    void syncStaffAccessEntry(u);
                  });
                }
                setUsers(firestoreUsers);
              } else {
                setUsers((prev) => {
                  const map = new Map<string, User>();
                  prev.forEach((u) => map.set(u.id, u));
                  firestoreUsers.forEach((u) => map.set(u.id, u));
                  return Array.from(map.values());
                });
              }
            }
          },
          (error) => {
            try {
              handleFirestoreError(error, OperationType.LIST, 'users');
            } catch (err) {
              console.warn('[Firestore users sync warning]:', err);
            }
          }
        )
      );

      // 2. Applications sync (propagates remote creates, updates, AND deletions cleanly)
      unsubs.push(
        onSnapshot(
          appsRef,
          (snapshot) => {
            setIsCloudConnected(true);
            if (snapshot.empty) {
              if (hasClearedAppsExplicitlyRef.current) {
                hasClearedAppsExplicitlyRef.current = false;
                unsyncedLocalAppIdsRef.current.clear();
                setApplications([]);
                try {
                  localStorage.setItem('credit_scoring_apps', JSON.stringify([]));
                } catch {
                  // ignore storage errors
                }
                return;
              }

              setApplications((prevLocal) => {
                const pendingOrUnsynced = prevLocal.filter(
                  (a) =>
                    !a.id.startsWith('app-init-') &&
                    (pendingAppIdsRef.current.has(a.id) || unsyncedLocalAppIdsRef.current.has(a.id))
                );
                if (!snapshot.metadata.fromCache && pendingOrUnsynced.length > 0) {
                  pendingOrUnsynced.forEach((localApp) => {
                    void persistFirestoreDoc('applications', localApp.id, localApp);
                  });
                }
                return pendingOrUnsynced;
              });
            } else {
              hasClearedAppsExplicitlyRef.current = false;
              const firestoreApps = snapshot.docs.map((d) => d.data() as SurveyApplication);
              const nonTrialApps = firestoreApps.filter((a) => !a.id.startsWith('app-init-'));

              setApplications((prevLocal) => {
                const map = new Map<string, SurveyApplication>();
                // Keep only in-flight or locally unsynced apps created prior to connecting cloud
                prevLocal
                  .filter(
                    (a) =>
                      !a.id.startsWith('app-init-') &&
                      (pendingAppIdsRef.current.has(a.id) || unsyncedLocalAppIdsRef.current.has(a.id))
                  )
                  .forEach((a) => {
                    if (unsyncedLocalAppIdsRef.current.has(a.id) && !pendingAppIdsRef.current.has(a.id)) {
                      void persistFirestoreDoc('applications', a.id, a);
                    }
                    map.set(a.id, a);
                  });
                nonTrialApps.forEach((a) => {
                  pendingAppIdsRef.current.delete(a.id);
                  unsyncedLocalAppIdsRef.current.delete(a.id);
                  map.set(a.id, a);
                });
                const merged = Array.from(map.values());
                merged.sort(
                  (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                );
                return merged;
              });
            }
          },
          (error) => {
            console.warn('[Firestore applications sync warning]:', error);
            setIsCloudConnected(false);
          }
        )
      );

      // 3. Audit Logs sync
      unsubs.push(
        onSnapshot(
          logsRef,
          (snapshot) => {
            setIsCloudConnected(true);
            const firestoreLogs = snapshot.docs.map((d) => d.data() as AuditLog);
            firestoreLogs.sort(
              (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
            if (firestoreLogs.length > 0) {
              setAuditLogs(firestoreLogs);
            } else if (isAdminUser && !snapshot.metadata.fromCache) {
              INITIAL_LOGS.forEach((log) => void persistFirestoreDoc('auditLogs', log.id, log));
            }
          },
          (error) => {
            console.warn('[Firestore auditLogs sync warning]:', error);
          }
        )
      );

      // 4. Notifications sync
      unsubs.push(
        onSnapshot(
          notifsRef,
          (snapshot) => {
            setIsCloudConnected(true);
            const firestoreNotifs = snapshot.docs.map((d) => d.data() as AppNotification);
            firestoreNotifs.sort(
              (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
            if (firestoreNotifs.length > 0) {
              setNotifications(firestoreNotifs);
            } else if (isAdminUser && !snapshot.metadata.fromCache) {
              INITIAL_NOTIFICATIONS.forEach((n) => void persistFirestoreDoc('notifications', n.id, n));
            }
          },
          (error) => {
            console.warn('[Firestore notifications sync warning]:', error);
          }
        )
      );

      // 5. Scoring Formula Config sync
      unsubs.push(
        onSnapshot(
          doc(db, 'scoringConfig', 'scoring-config-bmt'),
          (snapshot) => {
            setIsCloudConnected(true);
            if (snapshot.exists()) {
              const remoteCfg = snapshot.data() as ScoringFormulaConfig;
              if (remoteCfg && remoteCfg.weights5C) {
                setScoringConfig(remoteCfg);
                try {
                  localStorage.setItem('credit_scoring_formula_config', JSON.stringify(remoteCfg));
                } catch (e) {
                  console.warn(e);
                }
              }
            } else if (isAdminUser && !snapshot.metadata.fromCache) {
              void persistFirestoreDoc('scoringConfig', 'scoring-config-bmt', DEFAULT_SCORING_FORMULA_CONFIG);
            }
          },
          (error) => {
            console.warn('[Firestore scoringConfig sync warning]:', error);
          }
        )
      );

      // 6. Application Settings & Office/AO Catalog sync
      unsubs.push(
        onSnapshot(
          doc(db, 'settings', 'app_config'),
          (snapshot) => {
            setIsCloudConnected(true);
            if (snapshot.exists()) {
              const remoteSettings = snapshot.data() as AppSettings;
              if (remoteSettings && remoteSettings.appName) {
                const normalizedSettings: AppSettings = {
                  ...DEFAULT_APP_SETTINGS,
                  ...remoteSettings,
                  officeAoCatalog: Array.isArray(remoteSettings.officeAoCatalog)
                    ? remoteSettings.officeAoCatalog
                    : DEFAULT_APP_SETTINGS.officeAoCatalog,
                };
                setAppSettings(normalizedSettings);
                try {
                  localStorage.setItem('credit_scoring_app_settings', JSON.stringify(normalizedSettings));
                } catch (e) {
                  console.warn(e);
                }
              }
            } else if (isAdminUser && !snapshot.metadata.fromCache) {
              void persistFirestoreDoc('settings', 'app_config', DEFAULT_APP_SETTINGS);
            }
          },
          (error) => {
            console.warn('[Firestore settings sync warning]:', error);
          }
        )
      );

      // 7. Survey Checklist Questions Catalog sync
      unsubs.push(
        onSnapshot(
          doc(db, 'checklistConfig', 'default-checklist'),
          (snapshot) => {
            setIsCloudConnected(true);
            if (snapshot.exists()) {
              const remoteChecklist = snapshot.data() as { questions?: QuestionDefinition[] };
              if (Array.isArray(remoteChecklist?.questions) && remoteChecklist.questions.length > 0) {
                setQuestions(remoteChecklist.questions);
                try {
                  localStorage.setItem('credit_scoring_questions', JSON.stringify(remoteChecklist.questions));
                } catch (e) {
                  console.warn(e);
                }
              }
            } else if (isAdminUser && !snapshot.metadata.fromCache) {
              void persistFirestoreDoc('checklistConfig', 'default-checklist', {
                id: 'default-checklist',
                questions: SURVEY_QUESTIONS,
                updatedAt: new Date().toISOString(),
                updatedBy: 'System Initialization',
              });
            }
          },
          (error) => {
            console.warn('[Firestore checklistConfig sync warning]:', error);
          }
        )
      );
    };

    void setupFirestoreListeners();

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, [firebaseUser]);

  // Sync state to local storage with quota protection
  useEffect(() => {
    try {
      localStorage.setItem('credit_scoring_users', JSON.stringify(users));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for users:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('credit_scoring_apps', JSON.stringify(applications));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for applications, saving compact cache:', e);
      try {
        const compactApps = applications.map((app, index) => {
          if (index < 3) return app;
          return {
            ...app,
            evidence: {
              ...app.evidence,
              fotoKtp: app.evidence?.fotoKtp ? '[cached-in-cloud]' : '',
              fotoKtpPendamping: app.evidence?.fotoKtpPendamping ? '[cached-in-cloud]' : undefined,
              fotoDebitur: app.evidence?.fotoDebitur ? '[cached-in-cloud]' : '',
              fotoRumahUsaha: app.evidence?.fotoRumahUsaha ? '[cached-in-cloud]' : '',
              fotoStokAset: app.evidence?.fotoStokAset ? '[cached-in-cloud]' : '',
              fotoBuktiPenghasilan: app.evidence?.fotoBuktiPenghasilan ? '[cached-in-cloud]' : undefined,
            },
          };
        });
        localStorage.setItem('credit_scoring_apps', JSON.stringify(compactApps));
      } catch (innerErr) {
        console.warn('LocalStorage compact fallback failed:', innerErr);
      }
    }
  }, [applications]);

  useEffect(() => {
    try {
      localStorage.setItem('credit_scoring_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for audit logs:', e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('credit_scoring_notifs', JSON.stringify(notifications));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for notifications:', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('credit_scoring_questions', JSON.stringify(questions));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for questions:', e);
    }
  }, [questions]);

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, currentUser.id);
    } catch (e) {
      console.warn('LocalStorage quota exceeded for active user id:', e);
    }
  }, [currentUser, isAuthenticated]);

  const clearToast = () => setToastMessage(null);

  const addLog = (action: string, details: string, applicationId?: string, applicationNumber?: string) => {
    const newLog: Record<string, any> = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || 'super_admin',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    if (applicationId && typeof applicationId === 'string' && applicationId.trim() !== '' && applicationId !== 'undefined') {
      newLog.applicationId = applicationId.trim();
    }
    if (applicationNumber && typeof applicationNumber === 'string' && applicationNumber.trim() !== '' && applicationNumber !== 'undefined') {
      newLog.applicationNumber = applicationNumber.trim();
    }
    setAuditLogs((prev) => [newLog as AuditLog, ...prev]);
    persistFirestoreDoc('auditLogs', newLog.id, newLog);
  };

  const persistChecklistConfig = (nextQuestions: QuestionDefinition[]) => {
    void persistFirestoreDoc('checklistConfig', 'default-checklist', {
      id: 'default-checklist',
      questions: nextQuestions,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Super Administrator',
    });
  };

  // Super Admin: Checklist Survey Management Methods
  const addQuestion = (newQ: Omit<QuestionDefinition, 'id'>) => {
    const newId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    const created: QuestionDefinition = {
      ...newQ,
      id: newId,
      isActive: true,
    };
    const nextQuestions = [...questions, created];
    setQuestions(nextQuestions);
    persistChecklistConfig(nextQuestions);
    addLog(
      'ADD_CHECKLIST_QUESTION',
      `Super Admin ${currentUser.name} menambahkan butir checklist baru #${newId} [${created.code}] (${created.category}): "${created.question}"`
    );
    setToastMessage({
      title: 'Checklist Berhasil Ditambahkan',
      desc: `Butir #${newId} telah aktif di form survey lapangan.`,
      type: 'success',
    });
  };

  const updateQuestion = (id: number, updatedQ: Partial<QuestionDefinition>) => {
    const nextQuestions = questions.map((q) => (q.id === id ? { ...q, ...updatedQ } : q));
    setQuestions(nextQuestions);
    persistChecklistConfig(nextQuestions);
    addLog(
      'UPDATE_CHECKLIST_QUESTION',
      `Super Admin ${currentUser.name} memperbarui parameter butir checklist #${id}`
    );
    setToastMessage({
      title: 'Checklist Diperbarui',
      desc: `Perubahan butir #${id} berhasil disimpan.`,
      type: 'info',
    });
  };

  const deleteQuestion = (id: number) => {
    const target = questions.find((q) => q.id === id);
    const nextQuestions = questions.filter((q) => q.id !== id);
    setQuestions(nextQuestions);
    persistChecklistConfig(nextQuestions);
    addLog(
      'DELETE_CHECKLIST_QUESTION',
      `Super Admin ${currentUser.name} menghapus butir checklist #${id} (${target?.category}): "${target?.question}"`
    );
    setToastMessage({
      title: 'Checklist Dihapus',
      desc: `Butir survey #${id} telah dihapus dari sistem.`,
      type: 'alert',
    });
  };

  const toggleQuestionActive = (id: number) => {
    const nextQuestions = questions.map((q) => {
      if (q.id === id) {
        const newStatus = q.isActive === false ? true : false;
        addLog(
          'TOGGLE_CHECKLIST_STATUS',
          `Super Admin mengubah status butir checklist #${id} menjadi ${newStatus ? 'AKTIF' : 'NONAKTIF'}`
        );
        return { ...q, isActive: newStatus };
      }
      return q;
    });
    setQuestions(nextQuestions);
    persistChecklistConfig(nextQuestions);
  };

  const resetQuestionsToDefault = () => {
    setQuestions(SURVEY_QUESTIONS);
    localStorage.setItem('credit_scoring_questions', JSON.stringify(SURVEY_QUESTIONS));
    persistChecklistConfig(SURVEY_QUESTIONS);
    addLog('RESET_CHECKLIST_QUESTIONS', `Super Admin mereset seluruh checklist survey ke 68 parameter standar acuan.`);
    setToastMessage({
      title: 'Checklist Direset',
      desc: 'Seluruh 68 butir survey lapangan dikembalikan ke default acuan.',
      type: 'info',
    });
  };

  // Super Admin: Scoring & Risk Engine Formula Configuration Management
  const updateScoringConfig = (newConfig: ScoringFormulaConfig) => {
    setScoringConfig(newConfig);
    try {
      localStorage.setItem('credit_scoring_formula_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('LocalStorage error for scoring config:', e);
    }
    persistFirestoreDoc('scoringConfig', newConfig.id || 'scoring-config-bmt', newConfig);
    addLog(
      'UPDATE_SCORING_FORMULA',
      `Super Administrator ${currentUser.name} memperbarui rumus scoring & mitigasi risiko: ${newConfig.policyName} (${newConfig.policyVersion}). Bobot 5C: Cap ${newConfig.weights5C.capacity}%, Chr ${newConfig.weights5C.character}%, Col ${newConfig.weights5C.collateral}%, Cpt ${newConfig.weights5C.capital}%, Cnd ${newConfig.weights5C.condition}%.`
    );
    setToastMessage({
      title: 'Rumus Scoring Diperbarui',
      desc: `Kebijakan ${newConfig.policyName} (${newConfig.policyVersion}) aktif dan berlaku untuk seluruh proses survey.`,
      type: 'success',
    });
  };

  const resetScoringConfig = () => {
    const defaultConfig: ScoringFormulaConfig = {
      ...DEFAULT_SCORING_FORMULA_CONFIG,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name || 'Super Administrator',
    };
    setScoringConfig(defaultConfig);
    try {
      localStorage.setItem('credit_scoring_formula_config', JSON.stringify(defaultConfig));
    } catch (e) {
      console.warn('LocalStorage error for scoring config:', e);
    }
    persistFirestoreDoc('scoringConfig', 'scoring-config-bmt', defaultConfig);
    addLog(
      'RESET_SCORING_FORMULA',
      `Super Administrator ${currentUser.name} mereset rumus scoring & risiko ke konfigurasi standar bawaan lembaga.`
    );
    setToastMessage({
      title: 'Rumus Scoring Direset ke Default',
      desc: 'Seluruh parameter bobot 5C, ambang batas grade, dan DSR dikembalikan ke standar awal.',
      type: 'info',
    });
  };

  const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    const merged: AppSettings = {
      ...appSettings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name || 'Super Administrator',
    };
    setAppSettings(merged);
    try {
      localStorage.setItem('credit_scoring_app_settings', JSON.stringify(merged));
    } catch (e) {
      console.warn('LocalStorage error for app settings:', e);
    }
    persistFirestoreDoc('settings', 'app_config', merged);
    addLog(
      'UPDATE_APP_SETTINGS',
      `Super Administrator ${currentUser.name} memperbarui pengaturan aplikasi & lembaga: ${merged.appName} / ${merged.institutionName} (Tema: ${merged.colorTheme}).`
    );
    setToastMessage({
      title: 'Pengaturan Berhasil Disimpan',
      desc: 'Konfigurasi identitas lembaga, tema warna, kop surat, dan parameter operasional berhasil diperbarui.',
      type: 'success',
    });
  };

  const resetAppSettings = () => {
    const resetConfig: AppSettings = {
      ...DEFAULT_APP_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name || 'Super Administrator',
    };
    setAppSettings(resetConfig);
    try {
      localStorage.setItem('credit_scoring_app_settings', JSON.stringify(resetConfig));
    } catch (e) {
      console.warn('LocalStorage error for app settings:', e);
    }
    persistFirestoreDoc('settings', 'app_config', resetConfig);
    addLog(
      'RESET_APP_SETTINGS',
      `Super Administrator ${currentUser.name} mereset pengaturan aplikasi ke nilai standar awal bawaan.`
    );
    setToastMessage({
      title: 'Pengaturan Direset ke Default',
      desc: 'Seluruh identitas aplikasi, tema visual, dan kop surat dikembalikan ke bawaan BMT Dana Insani.',
      type: 'info',
    });
  };

  const logout = (reason: 'manual' | 'inactivity' = 'manual') => {
    if (isAuthenticatedRef.current) {
      addLog(
        reason === 'inactivity' ? 'USER_SESSION_TIMEOUT' : 'USER_LOGOUT',
        reason === 'inactivity'
          ? `Sesi pengguna ${currentUser.name} (@${currentUser.username}) otomatis ter-logout karena tidak ada aktivitas selama 60 menit.`
          : `Pengguna ${currentUser.name} (@${currentUser.username}) keluar (logout) dari sistem.`
      );
    }

    setIsAuthenticated(false);
    isAuthenticatedRef.current = false;
    firebaseIdTokenRef.current = null;
    if (auth.currentUser) {
      void signOut(auth).catch((err) => console.warn('Firebase signOut warning:', err));
    }
    setIsDetailModalOpen(false);
    setIsPrintReportOpen(false);
    setIsNotificationPanelOpen(false);
    setIsSidebarOpen(false);
    setIsAccountSettingsOpen(false);
    setIsLoginModalOpen(false);

    try {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
    } catch (e) {
      console.warn('LocalStorage clear session error:', e);
    }

    if (reason === 'inactivity') {
      setSessionExpiredNotice(
        'Sesi login Anda otomatis ter-logout karena aplikasi tidak digunakan selama 60 menit. Silakan login kembali.'
      );
      setToastMessage({
        title: 'Sesi Berakhir Otomatis',
        desc: 'Anda telah keluar otomatis setelah 60 menit tanpa aktivitas.',
        type: 'alert',
      });
    } else {
      setSessionExpiredNotice(null);
      setToastMessage({
        title: 'Berhasil Keluar',
        desc: 'Anda telah logout dari aplikasi. Silakan login kembali untuk masuk.',
        type: 'info',
      });
    }
  };

  // Keep a ref to latest logout so the inactivity watcher never hits stale closures
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  });

  // 60-minute inactivity auto-logout watcher
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastSavedAt = 0;

    const recordActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastSavedAt >= 5000) {
        lastSavedAt = now;
        try {
          localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));
        } catch {
          // ignore storage write failure
        }
      }
    };

    const checkInactivity = () => {
      if (!isAuthenticatedRef.current) return;
      let storedLast = 0;
      try {
        const raw = localStorage.getItem(AUTH_LAST_ACTIVITY_KEY);
        storedLast = raw ? Number(raw) : 0;
      } catch {
        storedLast = 0;
      }
      const effectiveLastActivity = Math.max(
        lastActivityRef.current,
        Number.isFinite(storedLast) ? storedLast : 0
      );
      if (effectiveLastActivity > 0 && Date.now() - effectiveLastActivity >= INACTIVITY_TIMEOUT_MS) {
        logoutRef.current('inactivity');
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, recordActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    const intervalId = window.setInterval(checkInactivity, 15000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, recordActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      const now = Date.now();
      lastActivityRef.current = now;
      setCurrentUser(found);
      setIsAuthenticated(true);
      isAuthenticatedRef.current = true;
      setSessionExpiredNotice(null);
      try {
        localStorage.setItem(AUTH_USER_STORAGE_KEY, found.id);
        localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }

      // Auto-redirect if current activeTab is not permitted for the new role
      if (found.role === 'management') {
        if (['survey_form', 'branch_workspace', 'committee', 'risk_workspace', 'checklist_management', 'user_management', 'office_ao_management', 'scoring_formula', 'app_settings', 'backup_restore'].includes(activeTab)) {
          setActiveTab('dashboard');
        }
      } else if (found.role === 'branch_admin') {
        if (['survey_form', 'committee', 'risk_workspace', 'checklist_management', 'user_management', 'office_ao_management', 'scoring_formula', 'app_settings', 'backup_restore'].includes(activeTab)) {
          setActiveTab('disbursement_workspace');
        }
      } else if (found.role === 'branch_manager') {
        if (['survey_form', 'committee', 'risk_workspace', 'checklist_management', 'user_management', 'office_ao_management', 'scoring_formula', 'app_settings', 'backup_restore'].includes(activeTab)) {
          setActiveTab('branch_workspace');
        }
      } else if (found.role === 'admin') {
        if (['survey_form', 'branch_workspace', 'risk_workspace', 'checklist_management', 'user_management', 'office_ao_management', 'scoring_formula', 'app_settings', 'backup_restore'].includes(activeTab)) {
          setActiveTab('committee');
        }
      } else if (found.role === 'risk_management') {
        if (['survey_form', 'branch_workspace', 'committee', 'disbursement_workspace', 'checklist_management', 'user_management', 'office_ao_management', 'scoring_formula', 'app_settings', 'backup_restore'].includes(activeTab)) {
          setActiveTab('risk_workspace');
        }
      } else if (found.role === 'marketing') {
        if (['branch_workspace', 'committee', 'risk_workspace', 'checklist_management', 'user_management', 'office_ao_management', 'scoring_formula', 'app_settings', 'backup_restore'].includes(activeTab)) {
          setActiveTab('dashboard');
        }
      }

      setToastMessage({
        title: 'Beralih Akun',
        desc: `Anda sekarang aktif sebagai ${found.name} (${found.roleTitle})`,
        type: 'info',
      });
      addLog('SWITCH_USER', `Pengguna beralih ke sesi akun ${found.name} [${found.role}]`);
    }
  };

  const loginWithCredentials = (inputUsername: string, inputPass: string) => {
    const cleanUser = inputUsername.trim().toLowerCase();
    const cleanPass = inputPass.trim();

    const found = users.find(
      (u) =>
        (u.username?.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser) &&
        u.password === cleanPass
    );

    if (!found) {
      return { success: false, message: 'Username atau password yang Anda masukkan tidak sesuai.' };
    }

    if (found.status === 'inactive') {
      return { success: false, message: 'Akun ini berstatus nonaktif. Silakan hubungi Super Administrator BMT Dana Insani.' };
    }

    const now = Date.now();
    lastActivityRef.current = now;
    setCurrentUser(found);
    setIsAuthenticated(true);
    isAuthenticatedRef.current = true;
    setSessionExpiredNotice(null);
    try {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, found.id);
      localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));
    } catch (e) {
      console.warn('LocalStorage error on login:', e);
    }

    // Redirect to each role's primary home view on fresh login
    if (found.role === 'management') {
      setActiveTab('dashboard');
    } else if (found.role === 'branch_admin') {
      setActiveTab('disbursement_workspace');
    } else if (found.role === 'branch_manager') {
      setActiveTab('branch_workspace');
    } else if (found.role === 'admin') {
      setActiveTab('committee');
    } else if (found.role === 'risk_management') {
      setActiveTab('risk_workspace');
    } else if (found.role === 'marketing') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard');
    }

    addLog('USER_LOGIN', `Pengguna ${found.name} (${found.roleTitle}) berhasil login ke sistem dengan username @${found.username}`);

    const hasCloudSession = Boolean(auth.currentUser && auth.currentUser.emailVerified);
    setToastMessage(
      hasCloudSession
        ? {
            title: 'Login Berhasil (Cloud Aktif)',
            desc: `Selamat datang kembali, ${found.name} (${found.roleTitle}). Sinkronisasi Cloud aktif.`,
            type: 'success',
          }
        : {
            title: 'Login Berhasil (Mode Lokal)',
            desc: `Masuk sebagai ${found.name}. Klik "Hubungkan Cloud" (Akun Google) di header agar perubahan data sinkron antar gadget.`,
            type: 'info',
          }
    );

    return { success: true };
  };

  const connectGoogleCloudSync = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const token = await fbUser.getIdToken();
      firebaseIdTokenRef.current = token;
      setFirebaseUser(fbUser);

      // Best-effort backend token sync (non-blocking when Cloud SQL is absent)
      void fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => undefined);

      const roleInfo = await ensureWorkspaceCloudRole(fbUser);
      isCloudAdminRef.current = roleInfo.isAdminUser;
      isCloudStaffRef.current = roleInfo.isStaffUser;
      setIsCloudConnected(true);

      setToastMessage({
        title: 'Cloud Firestore Terhubung',
        desc: `Akun Google ${fbUser.email || ''} aktif. Data sekarang tersinkron otomatis antar perangkat.`,
        type: 'success',
      });
      return { success: true };
    } catch (error: any) {
      const msg = error?.message || 'Gagal menghubungkan akun Google untuk sinkronisasi cloud.';
      setToastMessage({
        title: 'Gagal Menghubungkan Cloud',
        desc: msg,
        type: 'alert',
      });
      return { success: false, message: msg };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const token = await fbUser.getIdToken();
      firebaseIdTokenRef.current = token;
      setFirebaseUser(fbUser);

      // Best-effort server token sync (never blocks Firebase Firestore login when Cloud SQL is absent)
      try {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (syncErr) {
        console.warn('[Auth sync fallback]:', syncErr);
      }

      const roleInfo = await ensureWorkspaceCloudRole(fbUser);
      isCloudAdminRef.current = roleInfo.isAdminUser;
      isCloudStaffRef.current = roleInfo.isStaffUser;
      setIsCloudConnected(true);

      const emailLower = (fbUser.email || '').trim().toLowerCase();

      // Load remote users first so Gadget 2 sees the exact role/profile saved on Gadget 1
      let candidateUsers: User[] = [...users];
      try {
        const remoteUsersSnap = roleInfo.isAdminUser
          ? await getDocs(collection(db, 'users'))
          : await getDocs(query(collection(db, 'users'), where('email', '==', fbUser.email || '')));
        if (!remoteUsersSnap.empty) {
          const map = new Map<string, User>();
          candidateUsers.forEach((u) => map.set(u.id, u));
          remoteUsersSnap.docs.forEach((d) => {
            const u = d.data() as User;
            if (u && u.id) map.set(u.id, u);
          });
          candidateUsers = Array.from(map.values());
          setUsers(candidateUsers);
        }
      } catch (err) {
        console.warn('[Firestore user lookup during Google login]:', err);
      }

      let matchedUser = candidateUsers.find(
        (u) => u.email.toLowerCase() === emailLower && u.status !== 'inactive'
      );

      if (!matchedUser) {
        const nowIso = new Date().toISOString();
        const usernameBase = emailLower.split('@')[0] || `user.${fbUser.uid.slice(0, 6)}`;
        const resolvedRole: User['role'] = roleInfo.isAdminUser
          ? 'super_admin'
          : roleInfo.staffRole || 'marketing';
        const resolvedRoleTitle =
          resolvedRole === 'super_admin'
            ? 'Super Administrator & Kadiv Operasional'
            : resolvedRole === 'branch_manager'
            ? 'Branch Manager / Kepala Cabang'
            : resolvedRole === 'branch_admin'
            ? 'Admin Cabang (Pencairan & Legal)'
            : resolvedRole === 'admin'
            ? 'Komite Pembiayaan & Analis Kredit'
            : resolvedRole === 'risk_management'
            ? 'Manajemen Risiko (Risk Review & Verifikasi)'
            : resolvedRole === 'management'
            ? 'Dewan Pengurus & Manajemen Eksekutif'
            : 'Account Officer / Surveyor Lapangan';

        matchedUser = {
          id: `usr-${fbUser.uid}`,
          name: fbUser.displayName || (resolvedRole === 'super_admin' ? 'Super Administrator' : usernameBase),
          email: fbUser.email || `${usernameBase}@danainsani.bmt`,
          role: resolvedRole,
          roleTitle: resolvedRoleTitle,
          department:
            resolvedRole === 'super_admin'
              ? 'Kantor Pusat & Manajemen Risiko'
              : 'Marketing & Financing Survey',
          branch: resolvedRole === 'super_admin' ? 'Kantor Pusat' : 'Cabang Pasar Minggu',
          avatarUrl: fbUser.photoURL || undefined,
          phone: '',
          createdAt: nowIso,
          status: 'active',
          username: usernameBase,
          initialUsername: usernameBase,
          password: 'GoogleAuthUser!',
          initialPassword: 'GoogleAuthUser!',
        };
        setUsers((prev) => {
          if (prev.some((u) => u.id === matchedUser!.id)) return prev;
          return [matchedUser!, ...prev];
        });
        void persistFirestoreDoc('users', matchedUser.id, { ...matchedUser, uid: fbUser.uid });
        void syncStaffAccessEntry(matchedUser);
      }

      const now = Date.now();
      lastActivityRef.current = now;
      setCurrentUser(matchedUser);
      setIsAuthenticated(true);
      isAuthenticatedRef.current = true;
      setSessionExpiredNotice(null);
      try {
        localStorage.setItem(AUTH_USER_STORAGE_KEY, matchedUser.id);
        localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));
      } catch (e) {
        console.warn('LocalStorage error on Google login:', e);
      }

      if (matchedUser.role === 'branch_admin') {
        setActiveTab('disbursement_workspace');
      } else if (matchedUser.role === 'branch_manager') {
        setActiveTab('branch_workspace');
      } else if (matchedUser.role === 'admin') {
        setActiveTab('committee');
      } else if (matchedUser.role === 'risk_management') {
        setActiveTab('risk_workspace');
      } else {
        setActiveTab('dashboard');
      }

      addLog(
        'USER_GOOGLE_LOGIN',
        `Pengguna ${matchedUser.name} (${matchedUser.email}) berhasil login melalui Google Sign-In.`
      );
      setToastMessage({
        title: 'Login Google & Cloud Aktif',
        desc: `Selamat datang, ${matchedUser.name} (${matchedUser.roleTitle}).`,
        type: 'success',
      });
      return { success: true };
    } catch (error: any) {
      const msg = error?.message || 'Gagal melakukan login dengan Google.';
      return { success: false, message: msg };
    }
  };

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const username = userData.username?.trim().toLowerCase() || `staf.${Date.now().toString().slice(-4)}`;
    const password = userData.password || 'BMT2026!';
    const initialUsername = userData.initialUsername || username;
    const initialPassword = userData.initialPassword || password;

    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      username,
      initialUsername,
      password,
      initialPassword,
    };
    setUsers((prev) => [newUser, ...prev]);
    void persistFirestoreDoc('users', newUser.id, newUser);
    void syncStaffAccessEntry(newUser);

    // Add log
    addLog(
      'CREATE_USER',
      `Super Admin ${currentUser.name} mendaftarkan akun baru: ${newUser.name} (${newUser.roleTitle}) dengan Username awal: @${newUser.username}`
    );

    // Add notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Akun Staf Baru Didaftarkan',
      message: `Pengguna baru ${newUser.name} didaftarkan sebagai ${newUser.roleTitle} di ${newUser.branch}. Username awal: @${newUser.username}`,
      type: 'user_created',
      targetRole: 'super_admin',
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    persistFirestoreDoc('notifications', newNotif.id, newNotif);

    setToastMessage({
      title: 'Akun Login Berhasil Dibuat',
      desc: `${newUser.name} (@${newUser.username}) siap login dengan hak akses ${newUser.roleTitle}.`,
      type: 'success',
    });
  };

  const updateMyCredentials = (newUsername: string, newPassword?: string) => {
    const cleanUsername = newUsername.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'Username tidak boleh kosong.' };
    }

    // Check duplicate
    const duplicate = users.find(
      (u) => u.id !== currentUser.id && u.username.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      return { success: false, message: `Username "${newUsername}" sudah digunakan oleh staf lain. Silakan pilih username lain.` };
    }

    const now = new Date().toISOString();
    const updatedUser: User = {
      ...currentUser,
      username: cleanUsername,
      password: newPassword && newPassword.trim() ? newPassword.trim() : currentUser.password,
      lastModifiedCredentialsAt: now,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    persistFirestoreDoc('users', updatedUser.id, updatedUser);

    addLog(
      'UPDATE_CREDENTIALS',
      `Pengguna ${currentUser.name} memperbarui kredensial login mandiri (Username aktif: @${cleanUsername}). Username awal: @${currentUser.initialUsername || currentUser.username}.`
    );

    // Notify Super Admin that user updated credentials
    const adminNotif: AppNotification = {
      id: `notif-${Date.now()}-cred`,
      title: 'Kredensial Pengguna Diperbarui',
      message: `${currentUser.name} (${currentUser.roleTitle}) telah mengubah username akun menjadi @${cleanUsername}. Password tersimpan dan dapat diakses Super Admin.`,
      type: 'user_created',
      targetRole: 'super_admin',
      timestamp: now,
      read: false,
    };
    setNotifications((prev) => [adminNotif, ...prev]);
    persistFirestoreDoc('notifications', adminNotif.id, adminNotif);

    setToastMessage({
      title: 'Kredensial Berhasil Diperbarui',
      desc: `Username aktif Anda kini adalah @${cleanUsername}. Password berhasil disimpan.`,
      type: 'success',
    });

    return { success: true };
  };

  const adminUpdateUserCredentials = (userId: string, newUsername: string, newPassword?: string) => {
    const cleanUsername = newUsername.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'Username tidak boleh kosong.' };
    }

    const duplicate = users.find(
      (u) => u.id !== userId && u.username.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      return { success: false, message: `Username "${newUsername}" sudah digunakan oleh staf lain.` };
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const now = new Date().toISOString();
    const updatedUser: User = {
      ...targetUser,
      username: cleanUsername,
      password: newPassword && newPassword.trim() ? newPassword.trim() : targetUser.password,
      lastModifiedCredentialsAt: now,
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    if (currentUser.id === userId) {
      setCurrentUser(updatedUser);
    }
    persistFirestoreDoc('users', updatedUser.id, updatedUser);

    addLog(
      'ADMIN_UPDATE_CREDENTIALS',
      `Super Admin ${currentUser.name} memperbarui/mereset kredensial akun ${targetUser.name} (Username: @${cleanUsername}).`
    );

    setToastMessage({
      title: 'Kredensial Staf Diperbarui',
      desc: `Kredensial login untuk ${targetUser.name} (@${cleanUsername}) berhasil diperbarui oleh Super Admin.`,
      type: 'success',
    });

    return { success: true };
  };

  const updateUserStatus = (userId: string, status: 'active' | 'inactive') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status } : u))
    );
    const target = users.find((u) => u.id === userId);
    if (target) {
      const updated = { ...target, status };
      void persistFirestoreDoc('users', userId, updated);
      void syncStaffAccessEntry(updated, status === 'active');
    }
    addLog('UPDATE_USER_STATUS', `Status pengguna ${target?.name} diubah menjadi ${status}`);
  };

  const deleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      removeFirestoreDoc('users', userId);
      void removeStaffAccessEntry(target.email);
      addLog('DELETE_USER', `Menghapus akun staf: ${target.name} (${target.email})`);
    }
  };

  const restoreDefaultRoleAccounts = (): number => {
    let addedCount = 0;
    const nextUsers = [...users];
    INITIAL_USERS.forEach((seedUser) => {
      if (!nextUsers.some((u) => u.role === seedUser.role)) {
        const freshUser: User = {
          ...seedUser,
          createdAt: new Date().toISOString(),
        };
        nextUsers.push(freshUser);
        void persistFirestoreDoc('users', freshUser.id, freshUser);
        void syncStaffAccessEntry(freshUser);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setUsers(nextUsers);
      addLog(
        'RESTORE_DEFAULT_ACCOUNTS',
        `Super Admin ${currentUser.name} membuat/memulihkan ${addedCount} akun default peran yang belum tersedia.`
      );
      setToastMessage({
        title: 'Akun Default Peran Dibuat',
        desc: `${addedCount} akun default peran berhasil dibuat dan disinkronkan ke Cloud Firestore.`,
        type: 'success',
      });
    } else {
      setToastMessage({
        title: 'Seluruh Akun Default Lengkap',
        desc: 'Semua 7 peran operasional sudah memiliki akun terdaftar di sistem.',
        type: 'info',
      });
    }
    return addedCount;
  };

  // Submit survey application
  const submitSurveyApplication = (appData: {
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
    checklistAnswers: SurveyApplication['checklistAnswers'];
    financial: SurveyApplication['financial'];
    collateral: SurveyApplication['collateral'];
    collaterals?: SurveyApplication['collaterals'];
    evidence: SurveyApplication['evidence'];
    selectedCabang?: string;
    selectedAoName?: string;
  }): SurveyApplication => {
    const appSeq = String(applications.length + 1).padStart(3, '0');
    const yearMonth = new Date().toISOString().slice(0, 7);
    const applicationNumber = `CRD-${yearMonth}-${appSeq}`;

    const scoring = evaluateCreditScore(appData.checklistAnswers, appData.financial, appData.collateral, questions, scoringConfig);
    const fraudEvaluation = detectFraudRedFlags(appData.checklistAnswers, questions);

    const { selectedCabang, selectedAoName, ...restAppData } = appData;
    const resolvedCabang = (selectedCabang || currentUser?.branch || 'Cabang Pasar Minggu').trim();
    const resolvedAoName = (selectedAoName || currentUser?.name || 'Budi Santoso, S.E.').trim();
    const matchedAoUser = users.find(
      (u) => u.name.trim().toLowerCase() === resolvedAoName.toLowerCase()
    );
    const resolvedMarketingId =
      currentUser?.role === 'marketing'
        ? currentUser.id
        : matchedAoUser?.id || currentUser?.id || 'usr-marketing-ao';

    const newApp: SurveyApplication = {
      ...restAppData,
      evidence: {
        ...restAppData.evidence,
        surveyorName: resolvedAoName,
      },
      id: `app-${Date.now()}`,
      applicationNumber,
      marketingId: resolvedMarketingId,
      marketingName: resolvedAoName,
      cabang: resolvedCabang,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'submitted',
      branchValidation: {
        validatedBy: '',
        validatorId: '',
        validatedAt: '',
        status: 'pending',
        notes: '',
      },
      scoring,
      fraudEvaluation,
    };

    setApplications((prev) => [newApp, ...prev]);
    persistFirestoreDoc('applications', newApp.id, newApp);

    // Add Audit Log
    addLog(
      'SUBMIT_SURVEY',
      `AO ${resolvedAoName} (${resolvedCabang}) menyelesaikan checklist survey & kalkulasi scoring debitur ${newApp.namaDebitur} (Skor: ${scoring.totalScore} - ${scoring.ratingGrade}). Berkas diteruskan ke Branch Manager ${resolvedCabang} untuk validasi.`,
      newApp.id,
      newApp.applicationNumber
    );

    // Create Real-Time Notification for Branch Manager (and Super Admin)
    // NOTE: Komite & Analis will NOT be notified or see this until Branch Manager validates it!
    const bmNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Survey Baru Masuk: Perlu Validasi BM',
      message: `AO ${resolvedAoName} telah mengirim hasil survey ${newApp.applicationNumber} (${newApp.namaDebitur}) di ${resolvedCabang}. Menunggu validasi Kepala Cabang sebelum masuk ke Sidang Komite.`,
      type: fraudEvaluation.hasRedFlags ? 'fraud_alert' : 'survey_submitted',
      applicationId: newApp.id,
      applicationNumber: newApp.applicationNumber,
      targetRole: 'branch_manager',
      targetBranch: resolvedCabang,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [bmNotif, ...prev]);
    persistFirestoreDoc('notifications', bmNotif.id, bmNotif);

    setToastMessage({
      title: 'Survey Terkirim ke Kepala Cabang',
      desc: `Hasil skoring: ${scoring.totalScore}/100 (${scoring.ratingGrade}). Berkas menunggu validasi Branch Manager ${resolvedCabang} sebelum diteruskan ke Komite & Analis.`,
      type: 'success',
    });

    return newApp;
  };

  // Branch Manager Validation
  const validateApplicationByBM = (
    applicationId: string,
    validationData: {
      status: 'valid' | 'revision' | 'rejected';
      notes: string;
      revisiNotes?: string;
      rekomendasiPlafonBM?: number;
      rekomendasiTenorBM?: number;
    }
  ) => {
    const targetApp = applications.find((a) => a.id === applicationId);
    const now = new Date().toISOString();

    if (targetApp) {
      const nextAnalystCheck =
        validationData.status === 'valid' && targetApp.analystCheck?.status === 'revision_to_bm'
          ? {
              ...targetApp.analystCheck,
              status: 'pending' as const,
              revalidatedByBmAt: now,
            }
          : targetApp.analystCheck;

      const updatedApp: SurveyApplication = {
        ...targetApp,
        updatedAt: now,
        branchValidation: {
          validatedBy: currentUser.name,
          validatorId: currentUser.id,
          validatedAt: now,
          ...validationData,
        },
        ...(nextAnalystCheck ? { analystCheck: nextAnalystCheck } : {}),
      };
      persistFirestoreDoc('applications', applicationId, updatedApp);
    }

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === applicationId) {
          const nextAnalystCheck =
            validationData.status === 'valid' && app.analystCheck?.status === 'revision_to_bm'
              ? {
                  ...app.analystCheck,
                  status: 'pending' as const,
                  revalidatedByBmAt: now,
                }
              : app.analystCheck;

          return {
            ...app,
            updatedAt: now,
            branchValidation: {
              validatedBy: currentUser.name,
              validatorId: currentUser.id,
              validatedAt: now,
              ...validationData,
            },
            ...(nextAnalystCheck ? { analystCheck: nextAnalystCheck } : {}),
          };
        }
        return app;
      })
    );

    const appNumber = targetApp?.applicationNumber || applicationId;
    const debitur = targetApp?.namaDebitur || 'Debitur';
    const cabang = targetApp?.cabang || currentUser.branch;

    if (validationData.status === 'valid') {
      const wasAnalystRevision = targetApp?.analystCheck?.status === 'revision_to_bm';
      addLog(
        'BM_VALIDATION_APPROVED',
        wasAnalystRevision
          ? `Branch Manager ${currentUser.name} menyelesaikan revisi & memvalidasi ulang pengajuan ${appNumber} (${debitur}) dari ${cabang} untuk diperiksa kembali oleh Analis Kredit. Catatan BM: ${validationData.notes}`
          : `Branch Manager ${currentUser.name} memvalidasi & menyetujui pengajuan survey ${appNumber} (${debitur}) dari ${cabang}. Berkas kini resmi diteruskan ke Komite Pembiayaan & Analis Kredit. Catatan BM: ${validationData.notes}`,
        applicationId,
        appNumber
      );

      // 1. Notify Admin / Analis: The application is now unlocked / re-validated!
      const adminNotif: AppNotification = {
        id: `notif-${Date.now()}-adm`,
        title: wasAnalystRevision
          ? 'Revisi BM Selesai - Siap Dicek Ulang Analis'
          : 'Berkas Lolos Validasi BM - Siap Dicek Analis',
        message: wasAnalystRevision
          ? `Branch Manager ${currentUser.name} (${cabang}) telah memperbaiki & memvalidasi ulang berkas ${appNumber} (${debitur}). Silakan cek kembali & jadwalkan komite.`
          : `Branch Manager ${currentUser.name} (${cabang}) telah menyetujui survey ${appNumber} (${debitur}). Berkas siap dicek Analis & dijadwalkan Sidang Komite.`,
        type: 'bm_validation',
        applicationId,
        applicationNumber: appNumber,
        targetRole: 'admin',
        timestamp: new Date().toISOString(),
        read: false,
      };

      // 2. Notify Marketing / AO
      const aoNotif: AppNotification = {
        id: `notif-${Date.now()}-ao`,
        title: 'Survey Anda Divalidasi Kepala Cabang',
        message: `Branch Manager ${currentUser.name} telah menyetujui survey ${appNumber} (${debitur}). Berkas telah diteruskan ke meja Analis & Komite Pembiayaan.`,
        type: 'bm_validation',
        applicationId,
        applicationNumber: appNumber,
        targetRole: 'marketing',
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [adminNotif, aoNotif, ...prev]);
      persistFirestoreDoc('notifications', adminNotif.id, adminNotif);
      persistFirestoreDoc('notifications', aoNotif.id, aoNotif);

      setToastMessage({
        title: wasAnalystRevision ? 'Revisi & Validasi Ulang BM Berhasil' : 'Validasi BM Berhasil',
        desc: `Berkas ${appNumber} telah disetujui dan diteruskan ke Analis Kredit untuk verifikasi & penjadwalan komite.`,
        type: 'success',
      });
    } else if (validationData.status === 'revision') {
      addLog(
        'BM_REQUEST_REVISION',
        `Branch Manager ${currentUser.name} mengembalikan berkas survey ${appNumber} (${debitur}) untuk perbaikan AO. Catatan: ${validationData.revisiNotes || validationData.notes}`,
        applicationId,
        appNumber
      );

      const aoNotif: AppNotification = {
        id: `notif-${Date.now()}-rev`,
        title: 'Permintaan Revisi dari Branch Manager',
        message: `Kepala Cabang meminta revisi pada survey ${appNumber} (${debitur}): "${validationData.revisiNotes || validationData.notes}". Silakan lengkapi data.`,
        type: 'bm_revision',
        applicationId,
        applicationNumber: appNumber,
        targetRole: 'marketing',
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [aoNotif, ...prev]);
      void persistFirestoreDoc('notifications', aoNotif.id, aoNotif);

      setToastMessage({
        title: 'Permintaan Revisi Terkirim',
        desc: `Catatan perbaikan telah diteruskan ke Account Officer ${targetApp?.marketingName}.`,
        type: 'alert',
      });
    } else if (validationData.status === 'rejected') {
      addLog(
        'BM_VALIDATION_REJECTED',
        `Branch Manager ${currentUser.name} menolak berkas survey ${appNumber} (${debitur}) di tingkat kantor cabang. Alasan: ${validationData.notes}`,
        applicationId,
        appNumber
      );

      const aoNotif: AppNotification = {
        id: `notif-${Date.now()}-rej`,
        title: 'Pengajuan Ditolak di Tingkat Cabang',
        message: `Branch Manager ${currentUser.name} menolak survey ${appNumber} (${debitur}): "${validationData.notes}".`,
        type: 'bm_revision',
        applicationId,
        applicationNumber: appNumber,
        targetRole: 'marketing',
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [aoNotif, ...prev]);
      void persistFirestoreDoc('notifications', aoNotif.id, aoNotif);

      setToastMessage({
        title: 'Pengajuan Ditolak di Cabang',
        desc: `Berkas ${appNumber} ditolak di tingkat supervisi Branch Manager.`,
        type: 'alert',
      });
    }
  };

  // Branch Manager Batch Validation
  const batchValidateByBM = (
    applicationIds: string[],
    validationData: {
      status: 'valid' | 'revision' | 'rejected';
      notes: string;
      revisiNotes?: string;
    }
  ) => {
    if (applicationIds.length === 0) return;
    const now = new Date().toISOString();

    setApplications((prev) =>
      prev.map((app) => {
        if (applicationIds.includes(app.id)) {
          return {
            ...app,
            updatedAt: now,
            branchValidation: {
              validatedBy: currentUser.name,
              validatorId: currentUser.id,
              validatedAt: now,
              status: validationData.status,
              notes: validationData.notes,
              revisiNotes: validationData.revisiNotes,
            },
          };
        }
        return app;
      })
    );

    const matchedApps = applications.filter((a) => applicationIds.includes(a.id));
    const newNotifs: AppNotification[] = [];

    matchedApps.forEach((targetApp, idx) => {
      const appNumber = targetApp.applicationNumber;
      const debitur = targetApp.namaDebitur;
      const cabang = targetApp.cabang || currentUser.branch;

      const updatedApp: SurveyApplication = {
        ...targetApp,
        updatedAt: now,
        branchValidation: {
          validatedBy: currentUser.name,
          validatorId: currentUser.id,
          validatedAt: now,
          status: validationData.status,
          notes: validationData.notes,
          revisiNotes: validationData.revisiNotes,
        },
      };
      persistFirestoreDoc('applications', targetApp.id, updatedApp);

      if (validationData.status === 'valid') {
        addLog(
          'BM_VALIDATION_APPROVED',
          `Branch Manager ${currentUser.name} memvalidasi & menyetujui (batch) berkas survey ${appNumber} (${debitur}) dari ${cabang}. Berkas diteruskan ke Komite Pembiayaan & Analis Kredit. Catatan BM: ${validationData.notes}`,
          targetApp.id,
          appNumber
        );

        newNotifs.push({
          id: `notif-${Date.now()}-${idx}-adm`,
          title: 'Berkas Lolos Validasi BM - Siap Sidang Komite',
          message: `Branch Manager ${currentUser.name} (${cabang}) menyetujui survey ${appNumber} (${debitur}). Berkas kini siap diproses Komite & Analis Pembiayaan.`,
          type: 'bm_validation',
          applicationId: targetApp.id,
          applicationNumber: appNumber,
          targetRole: 'admin',
          timestamp: now,
          read: false,
        });

        newNotifs.push({
          id: `notif-${Date.now()}-${idx}-ao`,
          title: 'Survey Anda Divalidasi Kepala Cabang',
          message: `Branch Manager ${currentUser.name} telah menyetujui survey ${appNumber} (${debitur}). Berkas telah diteruskan ke meja Komite Pembiayaan.`,
          type: 'bm_validation',
          applicationId: targetApp.id,
          applicationNumber: appNumber,
          targetRole: 'marketing',
          timestamp: now,
          read: false,
        });
      } else if (validationData.status === 'revision') {
        addLog(
          'BM_REQUEST_REVISION',
          `Branch Manager ${currentUser.name} mengembalikan (batch) berkas survey ${appNumber} (${debitur}) untuk perbaikan AO. Catatan: ${validationData.revisiNotes || validationData.notes}`,
          targetApp.id,
          appNumber
        );

        newNotifs.push({
          id: `notif-${Date.now()}-${idx}-rev`,
          title: 'Permintaan Revisi dari Branch Manager',
          message: `Kepala Cabang meminta revisi pada survey ${appNumber} (${debitur}): "${validationData.revisiNotes || validationData.notes}". Silakan lengkapi data.`,
          type: 'bm_revision',
          applicationId: targetApp.id,
          applicationNumber: appNumber,
          targetRole: 'marketing',
          timestamp: now,
          read: false,
        });
      } else {
        addLog(
          'BM_VALIDATION_REJECTED',
          `Branch Manager ${currentUser.name} menolak (batch) berkas survey ${appNumber} (${debitur}) di tingkat cabang. Alasan: ${validationData.notes}`,
          targetApp.id,
          appNumber
        );

        newNotifs.push({
          id: `notif-${Date.now()}-${idx}-rej`,
          title: 'Pengajuan Ditolak di Tingkat Cabang',
          message: `Branch Manager ${currentUser.name} menolak survey ${appNumber} (${debitur}): "${validationData.notes}".`,
          type: 'bm_revision',
          applicationId: targetApp.id,
          applicationNumber: appNumber,
          targetRole: 'marketing',
          timestamp: now,
          read: false,
        });
      }
    });

    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev]);
      newNotifs.forEach((n) => persistFirestoreDoc('notifications', n.id, n));
    }

    setToastMessage({
      title: `Validasi Batch Selesai (${applicationIds.length} Berkas)`,
      desc: `${applicationIds.length} pengajuan telah diproses dengan status: ${
        validationData.status === 'valid'
          ? 'Sah / Disetujui Cabang'
          : validationData.status === 'revision'
          ? 'Permintaan Revisi AO'
          : 'Ditolak Cabang'
      }.`,
      type: validationData.status === 'valid' ? 'success' : 'alert',
    });
  };

  // Catatan & Tanda Perhatian Dewan Manajemen
  const addManagementNote = (applicationId: string, note: string, isAttention: boolean) => {
    const targetApp = applications.find((a) => a.id === applicationId);
    if (!targetApp) return;

    const managementData = {
      notedBy: currentUser.name,
      noterId: currentUser.id,
      notedAt: new Date().toISOString(),
      notes: note,
      isAttention,
    };

    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? { ...app, managementNote: managementData, updatedAt: new Date().toISOString() }
          : app
      )
    );
    persistFirestoreDoc('applications', applicationId, {
      ...targetApp,
      managementNote: managementData,
      updatedAt: new Date().toISOString(),
    });

    if (selectedApplication && selectedApplication.id === applicationId) {
      setSelectedApplication({
        ...selectedApplication,
        managementNote: managementData,
        updatedAt: new Date().toISOString(),
      });
    }

    addLog(
      'MANAGEMENT_NOTE',
      `Dewan Manajemen ${currentUser.name} memberikan ${isAttention ? 'TANDA PERHATIAN & CATATAN KHUSUS' : 'catatan supervisi'} pada pengajuan ${targetApp.applicationNumber} (${targetApp.namaDebitur}): "${note}"`,
      applicationId,
      targetApp.applicationNumber
    );

    // Kirim notifikasi ke Branch Manager & Analis Pembiayaan / Komite
    const bmNotif: AppNotification = {
      id: `notif-${Date.now()}-bm-att`,
      title: isAttention ? '⚠️ Atensi Khusus Dewan Manajemen' : 'Catatan Supervisi Dewan Manajemen',
      message: `${currentUser.name} (Dewan Manajemen) memberikan ${isAttention ? 'tanda perhatian khusus' : 'catatan pengawasan'} pada berkas survey ${targetApp.applicationNumber} (${targetApp.namaDebitur}, ${targetApp.cabang}): "${note}"`,
      type: 'management_attention',
      applicationId,
      applicationNumber: targetApp.applicationNumber,
      targetRole: 'branch_manager',
      targetBranch: targetApp.cabang,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const adminNotif: AppNotification = {
      id: `notif-${Date.now()}-adm-att`,
      title: isAttention ? '⚠️ Atensi Khusus Dewan Manajemen' : 'Catatan Supervisi Dewan Manajemen',
      message: `${currentUser.name} (Dewan Manajemen) memberikan ${isAttention ? 'tanda perhatian khusus' : 'catatan pengawasan'} pada berkas survey ${targetApp.applicationNumber} (${targetApp.namaDebitur}, ${targetApp.cabang}): "${note}"`,
      type: 'management_attention',
      applicationId,
      applicationNumber: targetApp.applicationNumber,
      targetRole: 'admin',
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [bmNotif, adminNotif, ...prev]);
    persistFirestoreDoc('notifications', bmNotif.id, bmNotif);
    persistFirestoreDoc('notifications', adminNotif.id, adminNotif);

    setToastMessage({
      title: isAttention ? 'Tanda Perhatian & Catatan Terkirim' : 'Catatan Manajemen Disimpan',
      desc: `Notifikasi langsung diteruskan ke Branch Manager (${targetApp.cabang}) dan Analis Pembiayaan.`,
      type: isAttention ? 'alert' : 'info',
    });
  };

  // Batch Management Note & Attention
  const batchAddManagementNote = (applicationIds: string[], note: string, isAttention: boolean) => {
    if (applicationIds.length === 0) return;
    const now = new Date().toISOString();

    const managementData: ManagementAttentionNote = {
      notedBy: currentUser.name,
      noterId: currentUser.id,
      notedAt: now,
      notes: note,
      isAttention,
    };

    setApplications((prev) =>
      prev.map((app) =>
        applicationIds.includes(app.id)
          ? { ...app, managementNote: managementData, updatedAt: now }
          : app
      )
    );

    const matchedApps = applications.filter((a) => applicationIds.includes(a.id));
    const newNotifs: AppNotification[] = [];

    matchedApps.forEach((targetApp, idx) => {
      persistFirestoreDoc('applications', targetApp.id, {
        ...targetApp,
        managementNote: managementData,
        updatedAt: now,
      });

      addLog(
        'MANAGEMENT_NOTE',
        `Dewan Manajemen ${currentUser.name} menyematkan ${isAttention ? 'TANDA PERHATIAN & CATATAN KHUSUS (BATCH)' : 'catatan supervisi (batch)'} pada pengajuan ${targetApp.applicationNumber} (${targetApp.namaDebitur}): "${note}"`,
        targetApp.id,
        targetApp.applicationNumber
      );

      newNotifs.push({
        id: `notif-${Date.now()}-${idx}-bm-att`,
        title: isAttention ? '⚠️ Atensi Khusus Dewan Manajemen' : 'Catatan Supervisi Dewan Manajemen',
        message: `${currentUser.name} (Dewan Manajemen) memberikan ${isAttention ? 'tanda perhatian khusus' : 'catatan pengawasan'} pada berkas ${targetApp.applicationNumber} (${targetApp.namaDebitur}, ${targetApp.cabang}): "${note}"`,
        type: 'management_attention',
        applicationId: targetApp.id,
        applicationNumber: targetApp.applicationNumber,
        targetRole: 'branch_manager',
        targetBranch: targetApp.cabang,
        timestamp: now,
        read: false,
      });

      newNotifs.push({
        id: `notif-${Date.now()}-${idx}-adm-att`,
        title: isAttention ? '⚠️ Atensi Khusus Dewan Manajemen' : 'Catatan Supervisi Dewan Manajemen',
        message: `${currentUser.name} (Dewan Manajemen) memberikan ${isAttention ? 'tanda perhatian khusus' : 'catatan pengawasan'} pada berkas ${targetApp.applicationNumber} (${targetApp.namaDebitur}, ${targetApp.cabang}): "${note}"`,
        type: 'management_attention',
        applicationId: targetApp.id,
        applicationNumber: targetApp.applicationNumber,
        targetRole: 'admin',
        timestamp: now,
        read: false,
      });
    });

    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev]);
      newNotifs.forEach((n) => persistFirestoreDoc('notifications', n.id, n));
    }

    setToastMessage({
      title: isAttention
        ? `Tanda Perhatian Terpasang (${applicationIds.length} Berkas)`
        : `Catatan Manajemen Disimpan (${applicationIds.length} Berkas)`,
      desc: `Catatan berhasil disimpan ke ${applicationIds.length} pengajuan terpilih dan notifikasi langsung dikirim ke Branch Manager dan Analis.`,
      type: isAttention ? 'alert' : 'info',
    });
  };

  // Analyst: Permintaan Revisi ke Pimpinan Cabang (Branch Manager) jika ditemukan kekurangan pasca-validasi BM
  const requestRevisionFromAnalystToBM = (applicationId: string, revisionNotes: string) => {
    const targetApp = applications.find((a) => a.id === applicationId);
    if (!targetApp) return;
    const trimmedNotes = revisionNotes.trim();
    if (!trimmedNotes) return;

    const now = new Date().toISOString();
    const updatedApp: SurveyApplication = {
      ...targetApp,
      updatedAt: now,
      status: 'submitted',
      branchValidation: {
        validatedBy: targetApp.branchValidation?.validatedBy || `Branch Manager ${targetApp.cabang}`,
        validatorId: targetApp.branchValidation?.validatorId || '',
        validatedAt: targetApp.branchValidation?.validatedAt || now,
        status: 'pending',
        notes: targetApp.branchValidation?.notes || '',
        revisiNotes: trimmedNotes,
        rekomendasiPlafonBM: targetApp.branchValidation?.rekomendasiPlafonBM,
        rekomendasiTenorBM: targetApp.branchValidation?.rekomendasiTenorBM,
      },
      analystCheck: {
        status: 'revision_to_bm',
        checkedBy: currentUser.name,
        checkerId: currentUser.id,
        checkedAt: now,
        notes: trimmedNotes,
      },
    };

    setApplications((prev) => prev.map((app) => (app.id === applicationId ? updatedApp : app)));
    persistFirestoreDoc('applications', applicationId, updatedApp);

    if (selectedApplication && selectedApplication.id === applicationId) {
      setSelectedApplication(updatedApp);
    }

    addLog(
      'ANALYST_REQUEST_BM_REVISION',
      `Analis Kredit ${currentUser.name} meminta revisi kepada Pimpinan Cabang (${targetApp.cabang}) atas berkas ${targetApp.applicationNumber} (${targetApp.namaDebitur}). Kekurangan/Catatan: "${trimmedNotes}"`,
      applicationId,
      targetApp.applicationNumber
    );

    const bmNotif: AppNotification = {
      id: `notif-${Date.now()}-anl-rev`,
      title: `Permintaan Revisi Analis ke Pimpinan Cabang: ${targetApp.applicationNumber}`,
      message: `Analis ${currentUser.name} mengembalikan berkas ${targetApp.namaDebitur} (${targetApp.cabang}) ke Pimpinan Cabang untuk revisi: "${trimmedNotes}"`,
      type: 'analyst_revision',
      applicationId,
      applicationNumber: targetApp.applicationNumber,
      targetRole: 'branch_manager',
      targetBranch: targetApp.cabang,
      timestamp: now,
      read: false,
    };

    setNotifications((prev) => [bmNotif, ...prev]);
    persistFirestoreDoc('notifications', bmNotif.id, bmNotif);

    setToastMessage({
      title: 'Permintaan Revisi Dikirim ke Pimpinan Cabang',
      desc: `Berkas ${targetApp.applicationNumber} dikembalikan ke Branch Manager ${targetApp.cabang} untuk dilengkapi.`,
      type: 'alert',
    });
  };

  // Analyst: Verifikasi Kelengkapan Data & Penjadwalan Sidang Komite (Membuka antrean Manajemen Risiko)
  const verifyAndScheduleCommitteeByAnalyst = (
    applicationId: string,
    scheduleData: {
      noAgenda: string;
      waktuSidang: string;
      lokasiSidang: string;
      notes: string;
    }
  ) => {
    const targetApp = applications.find((a) => a.id === applicationId);
    if (!targetApp) return;

    if (targetApp.branchValidation?.status !== 'valid') {
      setToastMessage({
        title: 'Validasi BM Belum Lengkap',
        desc: 'Berkas harus berstatus Valid dari Branch Manager sebelum dapat dijadwalkan sidang komite.',
        type: 'alert',
      });
      return;
    }

    const now = new Date().toISOString();
    const yearMonth = now.slice(0, 7).replace('-', '/');
    const noAgenda = scheduleData.noAgenda.trim() || `BA-KOM/${yearMonth}/${targetApp.applicationNumber}`;
    const lokasiSidang = scheduleData.lokasiSidang.trim() || 'Ruang Rapat Komite Pembiayaan - Lantai 2';
    const waktuSidang = scheduleData.waktuSidang || now.slice(0, 16);
    const notes = scheduleData.notes.trim() || 'Berkas telah diverifikasi lengkap oleh Analis Kredit dan dijadwalkan untuk Sidang Komite.';

    const updatedApp: SurveyApplication = {
      ...targetApp,
      updatedAt: now,
      status: targetApp.adminReview ? targetApp.status : 'under_review',
      analystCheck: {
        status: 'verified_scheduled',
        checkedBy: currentUser.name,
        checkerId: currentUser.id,
        checkedAt: now,
        notes,
        revalidatedByBmAt: targetApp.analystCheck?.revalidatedByBmAt,
        committeeSchedule: {
          noAgenda,
          waktuSidang,
          lokasiSidang,
          catatanPenjadwalan: notes,
          scheduledBy: currentUser.name,
          scheduledAt: now,
        },
      },
    };

    setApplications((prev) => prev.map((app) => (app.id === applicationId ? updatedApp : app)));
    persistFirestoreDoc('applications', applicationId, updatedApp);

    if (selectedApplication && selectedApplication.id === applicationId) {
      setSelectedApplication(updatedApp);
    }

    addLog(
      'ANALYST_SCHEDULE_COMMITTEE',
      `Analis Kredit ${currentUser.name} memverifikasi kelengkapan data dan menjadwalkan Sidang Komite (${noAgenda}) untuk ${targetApp.applicationNumber} (${targetApp.namaDebitur}) pada ${waktuSidang.replace('T', ' ')} di ${lokasiSidang}. Berkas siap diperiksa & diverifikasi oleh Manajemen Risiko.`,
      applicationId,
      targetApp.applicationNumber
    );

    const riskNotif: AppNotification = {
      id: `notif-${Date.now()}-sched-risk`,
      title: `Jadwal Komite Siap Verifikasi Risiko: ${targetApp.applicationNumber}`,
      message: `Analis ${currentUser.name} telah memverifikasi & menjadwalkan komite (${noAgenda}) untuk ${targetApp.namaDebitur} (${targetApp.cabang}). Silakan tinjau data & berikan Tanda Verifikasi Manajemen Risiko sebelum/saat sidang berlangsung.`,
      type: 'committee_scheduled',
      applicationId,
      applicationNumber: targetApp.applicationNumber,
      targetRole: 'risk_management',
      timestamp: now,
      read: false,
    };

    const bmNotif: AppNotification = {
      id: `notif-${Date.now()}-sched-bm`,
      title: `Jadwal Sidang Komite Diterbitkan: ${targetApp.applicationNumber}`,
      message: `Analis ${currentUser.name} memverifikasi berkas ${targetApp.namaDebitur} dan menjadwalkan Sidang Komite (${noAgenda}) pada ${waktuSidang.replace('T', ' ')} di ${lokasiSidang}.`,
      type: 'committee_scheduled',
      applicationId,
      applicationNumber: targetApp.applicationNumber,
      targetRole: 'branch_manager',
      targetBranch: targetApp.cabang,
      timestamp: now,
      read: false,
    };

    setNotifications((prev) => [riskNotif, bmNotif, ...prev]);
    persistFirestoreDoc('notifications', riskNotif.id, riskNotif);
    persistFirestoreDoc('notifications', bmNotif.id, bmNotif);

    setToastMessage({
      title: 'Berkas Diverifikasi & Komite Dijadwalkan',
      desc: `Agenda ${noAgenda} diterbitkan. Divisi Manajemen Risiko kini dapat memeriksa data dan menyematkan tanda verifikasi.`,
      type: 'success',
    });
  };

  // Risk Management: Pemeriksaan Ulang, Catatan Koreksi & Tanda Verifikasi Lembar Komite (Hanya lihat, koreksi & catatan)
  const verifyApplicationByRiskManagement = (
    applicationId: string,
    data: { status: RiskVerificationStatus; notes: string }
  ) => {
    const targetApp = applications.find((a) => a.id === applicationId);
    if (!targetApp) return;
    const isScheduledOrReviewedByAnalyst =
      targetApp.analystCheck?.status === 'verified_scheduled' ||
      Boolean(targetApp.analystCheck?.committeeSchedule) ||
      Boolean(targetApp.adminReview);

    if (!isScheduledOrReviewedByAnalyst) {
      setToastMessage({
        title: 'Belum Dapat Diverifikasi Risiko',
        desc: 'Berkas harus diverifikasi dan dijadwalkan sidang komite oleh Analis terlebih dahulu.',
        type: 'alert',
      });
      return;
    }

    const now = new Date().toISOString();
    const datePart = now.slice(2, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const verificationData: RiskManagementVerification = {
      verifiedBy: currentUser.name,
      verifierId: currentUser.id,
      verifiedAt: now,
      status: data.status,
      notes: data.notes.trim(),
      verificationCode: `RISK-${datePart}-${suffix}`,
    };

    const updatedApp: SurveyApplication = {
      ...targetApp,
      updatedAt: now,
      riskVerification: verificationData,
    };

    setApplications((prev) =>
      prev.map((app) => (app.id === applicationId ? updatedApp : app))
    );
    persistFirestoreDoc('applications', applicationId, updatedApp);

    if (selectedApplication && selectedApplication.id === applicationId) {
      setSelectedApplication(updatedApp);
    }

    const isVerified = data.status === 'verified';
    addLog(
      isVerified ? 'RISK_VERIFICATION_VERIFIED' : 'RISK_VERIFICATION_CORRECTION',
      `Manajemen Risiko ${currentUser.name} memberikan ${
        isVerified ? 'TANDA VERIFIKASI SAH' : 'CATATAN KOREKSI RISIKO'
      } (${verificationData.verificationCode}) pada lembar komite ${targetApp.applicationNumber} (${targetApp.namaDebitur}). Catatan: ${verificationData.notes || '-'}`,
      applicationId,
      targetApp.applicationNumber
    );

    const adminNotif: AppNotification = {
      id: `notif-${Date.now()}-risk-adm`,
      title: isVerified
        ? `✓ Verifikasi Manajemen Risiko: ${targetApp.applicationNumber}`
        : `! Catatan Koreksi Risiko: ${targetApp.applicationNumber}`,
      message: `${currentUser.name} (Manajemen Risiko) telah ${
        isVerified ? 'menyematkan tanda verifikasi pada lembar komite' : 'memberikan catatan koreksi risiko untuk'
      } ${targetApp.namaDebitur}. Catatan: "${verificationData.notes || 'Sesuai analisa komite'}"`,
      type: 'risk_verification',
      applicationId,
      applicationNumber: targetApp.applicationNumber,
      targetRole: 'admin',
      timestamp: now,
      read: false,
    };

    const bmNotif: AppNotification = {
      id: `notif-${Date.now()}-risk-bm`,
      title: isVerified
        ? `✓ Lembar Komite Diverifikasi Risk: ${targetApp.applicationNumber}`
        : `! Koreksi Manajemen Risiko: ${targetApp.applicationNumber}`,
      message: `${currentUser.name} (Manajemen Risiko) ${
        isVerified ? 'memverifikasi' : 'memberi catatan koreksi pada'
      } berkas ${targetApp.namaDebitur} (${targetApp.cabang}). Catatan: "${verificationData.notes || '-'}"`,
      type: 'risk_verification',
      applicationId,
      applicationNumber: targetApp.applicationNumber,
      targetRole: 'branch_manager',
      targetBranch: targetApp.cabang,
      timestamp: now,
      read: false,
    };

    setNotifications((prev) => [adminNotif, bmNotif, ...prev]);
    persistFirestoreDoc('notifications', adminNotif.id, adminNotif);
    persistFirestoreDoc('notifications', bmNotif.id, bmNotif);

    setToastMessage({
      title: isVerified ? 'Tanda Verifikasi Risiko Disematkan' : 'Catatan Koreksi Risiko Disimpan',
      desc: `Lembar komite ${targetApp.applicationNumber} kini memuat ${
        isVerified ? 'stempel verifikasi resmi' : 'catatan koreksi'
      } Manajemen Risiko (${verificationData.verificationCode}).`,
      type: isVerified ? 'success' : 'info',
    });
  };

  // Batch Admin/Komite Review
  const batchReviewApplications = (
    applicationIds: string[],
    decision: 'approved' | 'conditional_approval' | 'rejected',
    notes: string
  ) => {
    if (applicationIds.length === 0) return;
    const now = new Date().toISOString();

    setApplications((prev) =>
      prev.map((app) => {
        if (applicationIds.includes(app.id)) {
          const review: AdminReview = {
            reviewedBy: currentUser.name,
            reviewerId: currentUser.id,
            reviewedAt: now,
            decision,
            approvedPlafon: app.scoring.plafonDisarankan || app.financial.plafonDiajukan,
            approvedTenor: app.scoring.tenorDisarankan || app.financial.tenorBulanDiajukan,
            notes,
          };
          return {
            ...app,
            status: decision,
            updatedAt: now,
            adminReview: review,
          };
        }
        return app;
      })
    );

    const matchedApps = applications.filter((a) => applicationIds.includes(a.id));
    const newNotifs: AppNotification[] = [];

    matchedApps.forEach((targetApp, idx) => {
      const review: AdminReview = {
        reviewedBy: currentUser.name,
        reviewerId: currentUser.id,
        reviewedAt: now,
        decision,
        approvedPlafon: targetApp.scoring.plafonDisarankan || targetApp.financial.plafonDiajukan,
        approvedTenor: targetApp.scoring.tenorDisarankan || targetApp.financial.tenorBulanDiajukan,
        notes,
      };
      const updatedApp: SurveyApplication = {
        ...targetApp,
        status: decision,
        updatedAt: now,
        adminReview: review,
      };
      persistFirestoreDoc('applications', targetApp.id, updatedApp);

      addLog(
        `REVIEW_${decision.toUpperCase()}`,
        `Komite / Admin ${currentUser.name} menetapkan keputusan batch ${decision} untuk ${targetApp.applicationNumber} (${targetApp.namaDebitur}). Catatan: ${notes}`,
        targetApp.id,
        targetApp.applicationNumber
      );

      newNotifs.push({
        id: `notif-${Date.now()}-${idx}-rev`,
        title: `Hasil Sidang Komite: ${targetApp.applicationNumber}`,
        message: `${currentUser.name} telah menetapkan status ${decision} pada pengajuan ${targetApp.namaDebitur}.`,
        type: 'survey_reviewed',
        applicationId: targetApp.id,
        applicationNumber: targetApp.applicationNumber,
        targetRole: 'marketing',
        timestamp: now,
        read: false,
      });

      newNotifs.push({
        id: `notif-${Date.now()}-${idx}-risk`,
        title: `Siap Verifikasi Manajemen Risiko: ${targetApp.applicationNumber}`,
        message: `Analis/Komite ${currentUser.name} telah memproses lembar komite ${targetApp.namaDebitur}. Menunggu koreksi & tanda verifikasi Manajemen Risiko.`,
        type: 'survey_reviewed',
        applicationId: targetApp.id,
        applicationNumber: targetApp.applicationNumber,
        targetRole: 'risk_management',
        timestamp: now,
        read: false,
      });
    });

    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev]);
      newNotifs.forEach((n) => persistFirestoreDoc('notifications', n.id, n));
    }

    setToastMessage({
      title: `Keputusan Komite Berhasil (${applicationIds.length} Berkas)`,
      desc: `Status ${applicationIds.length} berkas berhasil diperbarui menjadi ${
        decision === 'approved'
          ? 'Disetujui Penuh'
          : decision === 'conditional_approval'
          ? 'Disetujui Bersyarat'
          : 'Ditolak'
      }.`,
      type: 'success',
    });
  };

  // Admin Review
  const reviewApplication = (
    applicationId: string,
    review: AdminReview,
    disbursementInstruction?: DisbursementInstruction
  ) => {
    const app = applications.find((a) => a.id === applicationId);
    const now = new Date().toISOString();

    const updatedStatus = review.decision === 'approved'
      ? 'approved'
      : review.decision === 'rejected'
      ? 'rejected'
      : review.decision === 'conditional_approval'
      ? 'conditional_approval'
      : 'under_review';

    const updatedApp: SurveyApplication | undefined = app
      ? {
          ...app,
          status: updatedStatus,
          updatedAt: now,
          adminReview: review,
          ...(disbursementInstruction ? { disbursementInstruction } : {}),
        }
      : undefined;

    if (updatedApp) {
      persistFirestoreDoc('applications', applicationId, updatedApp);
    }

    setApplications((prev) =>
      prev.map((a) => {
        if (a.id === applicationId) {
          return {
            ...a,
            status: updatedStatus,
            updatedAt: now,
            adminReview: review,
            ...(disbursementInstruction ? { disbursementInstruction } : {}),
          };
        }
        return a;
      })
    );

    const decisionLabel =
      review.decision === 'approved'
        ? 'Disetujui Penuh'
        : review.decision === 'rejected'
        ? 'Ditolak'
        : review.decision === 'conditional_approval'
        ? 'Disetujui Bersyarat'
        : 'Verifikasi Lanjutan';

    // Log
    addLog(
      `REVIEW_${review.decision.toUpperCase()}`,
      `Admin/Komite ${review.reviewedBy} memutuskan status ${decisionLabel} untuk ${app?.applicationNumber} (${app?.namaDebitur}). Plafon disetujui: Rp ${review.approvedPlafon.toLocaleString('id-ID')}. ${disbursementInstruction ? `Perintah pencairan diterbitkan untuk Admin Cabang (${disbursementInstruction.jenisPengikatan} - ${disbursementInstruction.notarisPpats}).` : ''} Catatan: ${review.notes}`,
      applicationId,
      app?.applicationNumber
    );

    // Notify Marketing & Risk Management
    const marketingNotif: AppNotification = {
      id: `notif-${Date.now()}-ao`,
      title: `Hasil Review Komite: ${app?.applicationNumber}`,
      message: `Komite & Analis ${review.reviewedBy} telah memproses pengajuan ${app?.namaDebitur}: ${decisionLabel} (Plafon: Rp ${review.approvedPlafon.toLocaleString('id-ID')}).`,
      type: 'survey_reviewed',
      applicationId,
      applicationNumber: app?.applicationNumber,
      targetRole: 'marketing',
      timestamp: now,
      read: false,
    };

    const riskNotif: AppNotification = {
      id: `notif-${Date.now()}-risk`,
      title: `Siap Verifikasi Manajemen Risiko: ${app?.applicationNumber}`,
      message: `Analis/Komite ${review.reviewedBy} telah mengoreksi & menjadwalkan komite untuk ${app?.namaDebitur} (${review.committeeDoc?.noNotulen || decisionLabel}). Menunggu pemeriksaan & tanda verifikasi Manajemen Risiko.`,
      type: 'survey_reviewed',
      applicationId,
      applicationNumber: app?.applicationNumber,
      targetRole: 'risk_management',
      timestamp: now,
      read: false,
    };

    setNotifications((prev) => [riskNotif, marketingNotif, ...prev]);
    persistFirestoreDoc('notifications', marketingNotif.id, marketingNotif);
    persistFirestoreDoc('notifications', riskNotif.id, riskNotif);

    // If approved, notify Branch Admin (Admin Cabang) with the disbursement order
    if (review.decision === 'approved' || review.decision === 'conditional_approval') {
      const branchAdminNotif: AppNotification = {
        id: `notif-${Date.now()}-badmin`,
        title: `Perintah Pencairan: ${app?.applicationNumber}`,
        message: `Komite & Analis telah menyetujui pembiayaan ${app?.namaDebitur} (Rp ${review.approvedPlafon.toLocaleString('id-ID')}). Harap segera menindaklanjuti pengikatan ${disbursementInstruction?.jenisPengikatan || 'Agunan'} dan pencairan dana.`,
        type: 'disbursement_order',
        applicationId,
        applicationNumber: app?.applicationNumber,
        targetRole: 'branch_admin',
        targetBranch: app?.cabang,
        timestamp: now,
        read: false,
      };

      setNotifications((prev) => [branchAdminNotif, ...prev]);
      persistFirestoreDoc('notifications', branchAdminNotif.id, branchAdminNotif);
    }

    setToastMessage({
      title: 'Keputusan Review Disimpan',
      desc: `Status pengajuan berhasil diperbarui menjadi ${decisionLabel}${disbursementInstruction ? ' & perintah pencairan diteruskan ke Admin Cabang' : ''}.`,
      type: 'success',
    });
  };

  // Branch Admin: Submit Disbursement & Collateral Binding Execution
  const submitDisbursementExecution = (
    applicationId: string,
    executionData: Omit<DisbursementExecution, 'status' | 'bmValidation'>
  ) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;
    const now = new Date().toISOString();

    const fullExecution: DisbursementExecution = {
      ...executionData,
      status: 'pending_bm_validation',
    };

    const updatedApp: SurveyApplication = {
      ...app,
      updatedAt: now,
      disbursementExecution: fullExecution,
    };

    setApplications((prev) => prev.map((a) => (a.id === applicationId ? updatedApp : a)));
    persistFirestoreDoc('applications', applicationId, updatedApp);

    addLog(
      'SUBMIT_DISBURSEMENT',
      `Admin Cabang ${currentUser.name} telah melaksanakan pencairan & pengikatan jaminan untuk ${app.applicationNumber} (${app.namaDebitur}) sebesar Rp ${fullExecution.nominalDicairkan.toLocaleString('id-ID')} via ${fullExecution.metodePencairan} (${fullExecution.notarisPelaksana}). Berkas diteruskan ke Branch Manager untuk validasi akhir.`,
      applicationId,
      app.applicationNumber
    );

    // Notify Branch Manager for final validation
    const bmNotif: AppNotification = {
      id: `notif-${Date.now()}-bm-disb`,
      title: `Validasi Pencairan: ${app.applicationNumber}`,
      message: `Admin Cabang ${currentUser.name} telah menyelesaikan berkas pencairan & pengikatan agunan ${app.namaDebitur} (Akad: ${fullExecution.nomorAkad}). Menunggu validasi akhir Branch Manager.`,
      type: 'disbursement_submitted',
      applicationId,
      applicationNumber: app.applicationNumber,
      targetRole: 'branch_manager',
      targetBranch: app.cabang,
      timestamp: now,
      read: false,
    };

    setNotifications((prev) => [bmNotif, ...prev]);
    persistFirestoreDoc('notifications', bmNotif.id, bmNotif);

    setToastMessage({
      title: 'Berkas Pencairan Berhasil Dikirim',
      desc: `Pencairan dana dan dokumentasi fisik berhasil diunggah. Menunggu validasi akhir Branch Manager.`,
      type: 'success',
    });
  };

  // Branch Manager: Validate Final Disbursement Execution
  const validateDisbursementByBM = (
    applicationId: string,
    status: 'valid' | 'revision',
    notes: string
  ) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app || !app.disbursementExecution) return;
    const now = new Date().toISOString();

    const updatedExecution: DisbursementExecution = {
      ...app.disbursementExecution,
      status: status === 'valid' ? 'validated' : 'revision',
      bmValidation: {
        validatedBy: currentUser.name,
        validatorId: currentUser.id,
        validatedAt: now,
        status,
        notes,
      },
    };

    const updatedApp: SurveyApplication = {
      ...app,
      updatedAt: now,
      disbursementExecution: updatedExecution,
    };

    setApplications((prev) => prev.map((a) => (a.id === applicationId ? updatedApp : a)));
    persistFirestoreDoc('applications', applicationId, updatedApp);

    if (status === 'valid') {
      addLog(
        'BM_VALIDATE_DISBURSEMENT_VALID',
        `Branch Manager ${currentUser.name} telah memvalidasi & mengesahkan pencairan & pengikatan agunan ${app.applicationNumber} (${app.namaDebitur}). Realisasi pembiayaan resmi tuntas. Catatan BM: ${notes}`,
        applicationId,
        app.applicationNumber
      );

      const notifs: AppNotification[] = [
        {
          id: `notif-${Date.now()}-adm-cair`,
          title: `Pencairan Disahkan BM: ${app.applicationNumber}`,
          message: `Branch Manager ${currentUser.name} telah mengesahkan berkas pencairan & pengikatan ${app.namaDebitur}.`,
          type: 'disbursement_validated',
          applicationId,
          applicationNumber: app.applicationNumber,
          targetRole: 'branch_admin',
          targetBranch: app.cabang,
          timestamp: now,
          read: false,
        },
        {
          id: `notif-${Date.now()}-analis-cair`,
          title: `Realisasi Pencairan Selesai: ${app.applicationNumber}`,
          message: `Pembiayaan ${app.namaDebitur} (Rp ${app.disbursementExecution.nominalDicairkan.toLocaleString('id-ID')}) di ${app.cabang} telah dicairkan dan divalidasi sah oleh Branch Manager.`,
          type: 'disbursement_validated',
          applicationId,
          applicationNumber: app.applicationNumber,
          targetRole: 'admin',
          timestamp: now,
          read: false,
        },
      ];

      setNotifications((prev) => [...notifs, ...prev]);
      notifs.forEach((n) => persistFirestoreDoc('notifications', n.id, n));

      setToastMessage({
        title: 'Pencairan Divalidasi Sah',
        desc: `Pencairan dana dan pengikatan agunan resmi disahkan. Analis dan Manajemen dapat melihat hasil akhirnya.`,
        type: 'success',
      });
    } else {
      addLog(
        'BM_VALIDATE_DISBURSEMENT_REVISION',
        `Branch Manager ${currentUser.name} meminta revisi dokumen pencairan ${app.applicationNumber} (${app.namaDebitur}) kepada Admin Cabang. Catatan: ${notes}`,
        applicationId,
        app.applicationNumber
      );

      const revNotif: AppNotification = {
        id: `notif-${Date.now()}-disb-rev`,
        title: `Revisi Dokumen Pencairan: ${app.applicationNumber}`,
        message: `Branch Manager ${currentUser.name} meminta perbaikan berkas/dokumentasi pencairan: "${notes}". Harap perbaiki segera.`,
        type: 'disbursement_revision',
        applicationId,
        applicationNumber: app.applicationNumber,
        targetRole: 'branch_admin',
        targetBranch: app.cabang,
        timestamp: now,
        read: false,
      };

      setNotifications((prev) => [revNotif, ...prev]);
      persistFirestoreDoc('notifications', revNotif.id, revNotif);

      setToastMessage({
        title: 'Instruksi Revisi Dikirim',
        desc: `Permintaan revisi pencairan telah dikirim ke Admin Cabang.`,
        type: 'alert',
      });
    }
  };

  const deleteApplication = (applicationId: string) => {
    const target = applications.find((a) => a.id === applicationId);
    if (target) {
      if (applications.length <= 1) {
        hasClearedAppsExplicitlyRef.current = true;
      }
      pendingAppIdsRef.current.delete(applicationId);
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      removeFirestoreDoc('applications', applicationId);
      addLog('DELETE_APPLICATION', `Menghapus data survey ${target.applicationNumber} atas nama ${target.namaDebitur}`, applicationId, target.applicationNumber);
      setToastMessage({
        title: 'Data Dihapus',
        desc: `Pengajuan ${target.applicationNumber} telah dihapus.`,
        type: 'info',
      });
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const targetNotif = notifications.find((n) => n.id === id);
    if (targetNotif) {
      persistFirestoreDoc('notifications', id, { ...targetNotif, read: true });
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notifications.forEach((n) => {
      persistFirestoreDoc('notifications', n.id, { ...n, read: true });
    });
  };

  const unreadNotificationsCount = notifications.filter((n) => {
    if (n.read) return false;
    if (currentUser.role === 'super_admin' || currentUser.role === 'management') return true;

    // Special handling for management attention notifications
    if (n.type === 'management_attention') {
      if (currentUser.role === 'admin') return true;
      if (currentUser.role === 'branch_manager') {
        if (n.targetBranch && n.targetBranch.toLowerCase() !== currentUser.branch.toLowerCase()) {
          return false;
        }
        return true;
      }
    }

    if (currentUser.role === 'branch_manager') {
      if (n.applicationId) {
        const app = applications.find((a) => a.id === n.applicationId);
        if (app && app.cabang.toLowerCase() !== currentUser.branch.toLowerCase()) {
          return false;
        }
      }
      return n.targetRole === 'branch_manager' || n.targetRole === 'all';
    }
    if (currentUser.role === 'marketing') {
      if (n.applicationId) {
        const app = applications.find((a) => a.id === n.applicationId);
        if (app && app.marketingId !== currentUser.id && app.marketingName !== currentUser.name) {
          return false;
        }
      }
      return n.targetRole === 'marketing' || n.targetRole === 'all';
    }
    if (currentUser.role === 'admin') {
      // Komite & Analis only see notifications for applications validated by BM (unless it's management attention)
      if (n.applicationId && n.type !== 'management_attention') {
        const app = applications.find((a) => a.id === n.applicationId);
        if (app && app.branchValidation?.status !== 'valid') {
          return false;
        }
      }
      return n.targetRole === 'admin' || n.targetRole === 'all';
    }
    if (currentUser.role === 'risk_management') {
      if (n.applicationId && n.type !== 'management_attention') {
        const app = applications.find((a) => a.id === n.applicationId);
        if (app && app.branchValidation?.status !== 'valid') {
          return false;
        }
      }
      return n.targetRole === 'risk_management' || n.targetRole === 'all';
    }
    if (n.targetRole === 'all') return true;
    return n.targetRole === currentUser.role;
  }).length;

  const viewApplicationDetails = (app: SurveyApplication) => {
    setSelectedApplication(app);
    setIsDetailModalOpen(true);
  };

  const printApplicationReport = (app: SurveyApplication) => {
    setSelectedApplication(app);
    setIsPrintReportOpen(true);
  };

  const deleteAllApplications = () => {
    hasClearedAppsExplicitlyRef.current = true;
    pendingAppIdsRef.current.clear();
    void syncToCloudSql('/api/applications', 'DELETE');
    // Delete all current applications from Firestore
    applications.forEach((app) => {
      removeFirestoreDoc('applications', app.id);
    });
    setApplications([]);
    try {
      localStorage.removeItem('credit_scoring_apps');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    addLog(
      'DELETE_ALL_APPLICATIONS',
      `Super Administrator ${currentUser.name} telah menghapus seluruh berkas survey uji coba.`
    );
    setToastMessage({
      title: 'Semua Data Uji Coba Dihapus',
      desc: 'Database pengajuan survey telah dikosongkan. Sistem siap digunakan untuk data riil.',
      type: 'success',
    });
  };

  const resetAllData = () => {
    hasClearedAppsExplicitlyRef.current = true;
    pendingAppIdsRef.current.clear();
    // Delete all applications from Firestore
    applications.forEach((app) => {
      removeFirestoreDoc('applications', app.id);
    });
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setCurrentUser(DEFAULT_SUPERADMIN);
    setApplications([]);
    setAuditLogs(INITIAL_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setActiveTab('dashboard');
    INITIAL_USERS.forEach((u) => persistFirestoreDoc('users', u.id, u));
    setToastMessage({
      title: 'Data Uji Coba Dikosongkan',
      desc: 'Seluruh data survey uji coba telah dibersihkan. Sistem bersih untuk produksi.',
      type: 'info',
    });
  };

  const recordDatabaseBackup = (counts: {
    applications: number;
    users: number;
    questions: number;
    auditLogs: number;
    notifications: number;
  }) => {
    addLog(
      'BACKUP_DATABASE',
      `Super Administrator ${currentUser.name} mengunduh backup database Excel (.xlsx): ${counts.applications} pengajuan, ${counts.users} akun staf, ${counts.questions} parameter checklist, ${counts.auditLogs} log audit, ${counts.notifications} notifikasi.`
    );
    setToastMessage({
      title: 'Backup Database Berhasil Diunduh',
      desc: `File Excel backup (${counts.applications} pengajuan, ${counts.users} staf, ${counts.questions} checklist) siap disimpan untuk pemulihan.`,
      type: 'success',
    });
  };

  const restoreDatabaseFromBackup = async (
    backup: DatabaseBackupPayload,
    mode: 'merge' | 'replace'
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const restoredParts: string[] = [];

      // 1. Applications
      if (backup.applications !== undefined) {
        const incomingApps = backup.applications.filter((a) => a && a.id && !a.id.startsWith('app-init-'));
        let nextApps: SurveyApplication[] = [];

        if (mode === 'replace') {
          const incomingIds = new Set(incomingApps.map((a) => a.id));
          applications.forEach((existing) => {
            if (!incomingIds.has(existing.id)) {
              removeFirestoreDoc('applications', existing.id);
            }
          });
          hasClearedAppsExplicitlyRef.current = incomingApps.length === 0;
          pendingAppIdsRef.current.clear();
          nextApps = [...incomingApps];
        } else {
          const map = new Map<string, SurveyApplication>();
          applications.forEach((a) => map.set(a.id, a));
          incomingApps.forEach((a) => map.set(a.id, a));
          nextApps = Array.from(map.values());
        }

        nextApps.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setApplications(nextApps);
        await Promise.all(incomingApps.map((app) => persistFirestoreDoc('applications', app.id, app)));
        restoredParts.push(`${incomingApps.length} pengajuan`);
      }

      // 2. Users (always keep active Super Admin session intact)
      if (Array.isArray(backup.users) && backup.users.length > 0) {
        let nextUsers: User[] = [];
        if (mode === 'replace') {
          const map = new Map<string, User>();
          backup.users.forEach((u) => {
            if (u && u.id) map.set(u.id, u);
          });
          if (!map.has(currentUser.id)) {
            map.set(currentUser.id, currentUser);
          }
          users.forEach((existing) => {
            if (!map.has(existing.id)) {
              removeFirestoreDoc('users', existing.id);
            }
          });
          nextUsers = Array.from(map.values());
        } else {
          const map = new Map<string, User>();
          users.forEach((u) => map.set(u.id, u));
          backup.users.forEach((u) => {
            if (u && u.id) map.set(u.id, u);
          });
          nextUsers = Array.from(map.values());
        }
        setUsers(nextUsers);
        await Promise.all(nextUsers.map((u) => persistFirestoreDoc('users', u.id, u)));
        restoredParts.push(`${backup.users.length} staf`);
      }

      // 3. Survey Checklist Questions
      if (Array.isArray(backup.questions) && backup.questions.length > 0) {
        setQuestions(backup.questions);
        try {
          localStorage.setItem('credit_scoring_questions', JSON.stringify(backup.questions));
        } catch (e) {
          console.warn('LocalStorage error for questions restore:', e);
        }
        await persistFirestoreDoc('checklistConfig', 'default-checklist', {
          id: 'default-checklist',
          questions: backup.questions,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.name || 'Super Administrator',
        });
        restoredParts.push(`${backup.questions.length} parameter checklist`);
      }

      // 4. Scoring Formula Config
      if (backup.scoringConfig && backup.scoringConfig.weights5C) {
        setScoringConfig(backup.scoringConfig);
        try {
          localStorage.setItem('credit_scoring_formula_config', JSON.stringify(backup.scoringConfig));
        } catch (e) {
          console.warn('LocalStorage error for scoringConfig restore:', e);
        }
        await persistFirestoreDoc(
          'scoringConfig',
          backup.scoringConfig.id || 'scoring-config-bmt',
          backup.scoringConfig
        );
        restoredParts.push('rumus scoring 5C');
      }

      // 5. App Settings
      if (backup.appSettings && backup.appSettings.appName) {
        setAppSettings(backup.appSettings);
        try {
          localStorage.setItem('credit_scoring_app_settings', JSON.stringify(backup.appSettings));
        } catch (e) {
          console.warn('LocalStorage error for appSettings restore:', e);
        }
        await persistFirestoreDoc('settings', 'app_config', backup.appSettings);
        restoredParts.push('pengaturan lembaga');
      }

      // 6. Notifications
      if (backup.notifications !== undefined) {
        const incomingNotifs = backup.notifications.filter((n) => n && n.id);
        let nextNotifs: AppNotification[] = [];
        if (mode === 'replace') {
          const incomingIds = new Set(incomingNotifs.map((n) => n.id));
          notifications.forEach((existing) => {
            if (!incomingIds.has(existing.id)) {
              removeFirestoreDoc('notifications', existing.id);
            }
          });
          nextNotifs = [...incomingNotifs];
        } else {
          const map = new Map<string, AppNotification>();
          notifications.forEach((n) => map.set(n.id, n));
          incomingNotifs.forEach((n) => map.set(n.id, n));
          nextNotifs = Array.from(map.values());
        }
        nextNotifs.sort(
          (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
        setNotifications(nextNotifs);
        await Promise.all(incomingNotifs.map((n) => persistFirestoreDoc('notifications', n.id, n)));
        restoredParts.push(`${incomingNotifs.length} notifikasi`);
      }

      // 7. Audit Logs (auditLogs Firestore rule allows create only, disallowing update/delete)
      if (Array.isArray(backup.auditLogs) && backup.auditLogs.length > 0) {
        const existingIds = new Set(auditLogs.map((l) => l.id));
        const logMap = new Map<string, AuditLog>();
        if (mode === 'merge') {
          auditLogs.forEach((l) => logMap.set(l.id, l));
        }
        backup.auditLogs.forEach((l) => {
          if (l && l.id) logMap.set(l.id, l);
        });
        const nextLogs = Array.from(logMap.values()).sort(
          (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
        setAuditLogs(nextLogs);

        const logsToCreate = backup.auditLogs.filter((l) => l && l.id && !existingIds.has(l.id));
        const activeFbUser = auth.currentUser;
        await Promise.all(
          logsToCreate.map(async (log) => {
            void syncToCloudSql('/api/audit-logs', 'POST', log);
            if (!activeFbUser || !activeFbUser.emailVerified) return;
            try {
              const ref = doc(db, 'auditLogs', log.id);
              const snap = await getDoc(ref);
              if (!snap.exists()) {
                const sanitized = removeUndefinedFields({
                  ...log,
                  ownerUid: activeFbUser.uid,
                });
                if (sanitized) {
                  await setDoc(ref, sanitized);
                }
              }
            } catch (err) {
              console.warn(`[Firestore auditLog restore skip] ${log.id}:`, err);
            }
          })
        );
        restoredParts.push(`${backup.auditLogs.length} log audit`);
      }

      const summary = restoredParts.length > 0 ? restoredParts.join(', ') : 'seluruh koleksi';
      addLog(
        'RESTORE_DATABASE',
        `Super Administrator ${currentUser.name} memulihkan database dari file backup Excel (mode: ${
          mode === 'replace' ? 'Timpa Penuh' : 'Gabung/Merge'
        }): ${summary}.`
      );

      setToastMessage({
        title: 'Restore Database Berhasil',
        desc: `Berhasil memulihkan ${summary} (Mode: ${
          mode === 'replace' ? 'Ganti Penuh' : 'Gabung Data'
        }).`,
        type: 'success',
      });

      return {
        success: true,
        message: `Berhasil memulihkan ${summary}.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setToastMessage({
        title: 'Restore Database Gagal',
        desc: msg,
        type: 'alert',
      });
      return {
        success: false,
        message: msg,
      };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        applications,
        auditLogs,
        notifications,
        questions,
        isCloudConnected,
        activeTab,
        setActiveTab,
        selectedApplication,
        setSelectedApplication,
        isDetailModalOpen,
        setIsDetailModalOpen,
        isPrintReportOpen,
        setIsPrintReportOpen,
        isNotificationPanelOpen,
        setIsNotificationPanelOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        isAccountSettingsOpen,
        setIsAccountSettingsOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isAuthenticated,
        firebaseUser,
        sessionExpiredNotice,
        clearSessionExpiredNotice,
        theme,
        setTheme,
        toggleTheme,
        toastMessage,
        clearToast,
        switchUser,
        loginWithCredentials,
        signInWithGoogle,
        connectGoogleCloudSync,
        logout,
        createUser,
        updateUserStatus,
        deleteUser,
        updateMyCredentials,
        adminUpdateUserCredentials,
        restoreDefaultRoleAccounts,
        submitSurveyApplication,
        reviewApplication,
        submitDisbursementExecution,
        validateDisbursementByBM,
        validateApplicationByBM,
        batchValidateByBM,
        addManagementNote,
        batchAddManagementNote,
        requestRevisionFromAnalystToBM,
        verifyAndScheduleCommitteeByAnalyst,
        verifyApplicationByRiskManagement,
        batchReviewApplications,
        deleteApplication,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        toggleQuestionActive,
        resetQuestionsToDefault,
        scoringConfig,
        updateScoringConfig,
        resetScoringConfig,
        appSettings,
        updateAppSettings,
        resetAppSettings,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        viewApplicationDetails,
        printApplicationReport,
        deleteAllApplications,
        resetAllData,
        recordDatabaseBackup,
        restoreDatabaseFromBackup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
