import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { SurveyForm } from './components/SurveyForm';
import { SurveyList } from './components/SurveyList';
import { UserManagement } from './components/UserManagement';
import { AuditLogView } from './components/AuditLogView';
import { CommitteeWorkspace } from './components/CommitteeWorkspace';
import { RiskManagementWorkspace } from './components/RiskManagementWorkspace';
import { BranchWorkspace } from './components/BranchWorkspace';
import { ChecklistManagement } from './components/ChecklistManagement';
import { DisbursementWorkspace } from './components/DisbursementWorkspace';
import { ScoringFormulaManagement } from './components/ScoringFormulaManagement';
import { AppSettingsManagement } from './components/AppSettingsManagement';
import { OfficeAoManagement } from './components/OfficeAoManagement';
import { BackupRestoreWorkspace } from './components/BackupRestoreWorkspace';
import { SurveyDetailModal } from './components/SurveyDetailModal';
import { PrintableReport } from './components/PrintableReport';
import { NotificationModal } from './components/NotificationModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { LoginModal, LoginPage } from './components/LoginModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastBanner: React.FC = () => {
  const { toastMessage, clearToast } = useApp();
  if (!toastMessage) return null;
  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300 px-2 sm:px-0">
      <div
        className={`rounded-xl border p-4 shadow-xl flex items-start gap-3 backdrop-blur-md ${
          toastMessage.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200'
            : toastMessage.type === 'alert'
            ? 'border-rose-500/30 bg-rose-950/90 text-rose-200'
            : 'border-sky-500/30 bg-slate-900/90 text-sky-200'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : toastMessage.type === 'alert' ? (
            <AlertCircle className="h-5 w-5 text-rose-400" />
          ) : (
            <Info className="h-5 w-5 text-sky-400" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white">{toastMessage.title}</h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastMessage.desc}</p>
        </div>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { activeTab, theme, appSettings, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <>
        <ToastBanner />
        <LoginPage />
      </>
    );
  }

  return (
    <div
      data-theme={theme}
      data-color-theme={appSettings.colorTheme || 'emerald'}
      className={`min-h-screen ${
        theme === 'light'
          ? 'theme-light bg-slate-100 text-slate-900'
          : 'theme-dark bg-slate-950 text-slate-100'
      } flex font-sans transition-colors duration-200`}
    >
      {/* 1. Left Sidebar Navigation Menu */}
      <Sidebar />

      {/* 2. Right Main Column (Header + Page Content) */}
      <div className="flex-1 flex flex-col md:pl-72 min-w-0 transition-all duration-300">
        {/* Top Navbar */}
        <Header />

        {/* Real-time Toast Alert */}
        <ToastBanner />

        {/* Main Content Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && <DashboardAnalytics />}
          {activeTab === 'branch_workspace' && <BranchWorkspace />}
          {activeTab === 'survey_form' && <SurveyForm />}
          {activeTab === 'applications_list' && <SurveyList />}
          {activeTab === 'committee' && <CommitteeWorkspace />}
          {activeTab === 'risk_workspace' && <RiskManagementWorkspace />}
          {activeTab === 'checklist_management' && <ChecklistManagement />}
          {activeTab === 'disbursement_workspace' && <DisbursementWorkspace />}
          {activeTab === 'user_management' && <UserManagement />}
          {activeTab === 'scoring_formula' && <ScoringFormulaManagement />}
          {activeTab === 'app_settings' && <AppSettingsManagement />}
          {activeTab === 'office_ao_management' && <OfficeAoManagement />}
          {activeTab === 'backup_restore' && <BackupRestoreWorkspace />}
          {activeTab === 'audit_log' && <AuditLogView />}
        </main>
      </div>

      {/* Modals & Overlays */}
      <SurveyDetailModal />
      <PrintableReport />
      <NotificationModal />
      <AccountSettingsModal />
      <LoginModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
