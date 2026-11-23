import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCheck, AlertTriangle, FileText, UserPlus, CheckCircle2, ShieldCheck } from 'lucide-react';

export const NotificationModal: React.FC = () => {
  const {
    notifications,
    isNotificationPanelOpen,
    setIsNotificationPanelOpen,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    currentUser,
    viewApplicationDetails,
    applications,
  } = useApp();

  if (!isNotificationPanelOpen) return null;

  // Filter relevant notifications
  const userNotifications = notifications.filter((n) => {
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
  });

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    if (notif.applicationId) {
      const app = applications.find((a) => a.id === notif.applicationId);
      if (app) {
        setIsNotificationPanelOpen(false);
        viewApplicationDetails(app);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 sm:p-6 sm:pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsNotificationPanelOpen(false)}
      />

      {/* Popover Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl ring-1 ring-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Notifikasi Real-Time</h3>
            <span className="text-xs text-slate-400">({userNotifications.length})</span>
          </div>
          {userNotifications.some((n) => !n.read) && (
            <button
              onClick={markAllNotificationsAsRead}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tandai Dibaca
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-800/60">
          {userNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs">Belum ada notifikasi baru</p>
            </div>
          ) : (
            userNotifications.map((notif) => {
              const isUnread = !notif.read;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`cursor-pointer p-4 transition-colors hover:bg-slate-800/50 ${
                    isUnread ? 'bg-slate-800/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'management_attention' ? (
                        <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      ) : notif.type === 'fraud_alert' || notif.type === 'analyst_revision' ? (
                        <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      ) : notif.type === 'survey_submitted' ? (
                        <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <FileText className="h-4 w-4" />
                        </div>
                      ) : notif.type === 'risk_verification' || notif.type === 'committee_scheduled' ? (
                        <div className="p-1.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                      ) : notif.type === 'survey_reviewed' ? (
                        <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <UserPlus className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-semibold ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                          {notif.title}
                        </p>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {new Date(notif.timestamp).toLocaleDateString('id-ID')}</span>
                        {notif.applicationNumber && (
                          <span className="font-mono text-emerald-400/80 hover:underline">
                            Lihat Pengajuan &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-4 py-2.5 bg-slate-900/90 text-center">
          <button
            onClick={() => setIsNotificationPanelOpen(false)}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
