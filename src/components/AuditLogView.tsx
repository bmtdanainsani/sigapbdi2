import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ScrollText, Search, Filter, ShieldCheck, Clock, User, UserCheck, Lock } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, currentUser, applications } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const isAccountOfficer = currentUser.role === 'marketing';

  // Set of application IDs submitted by this Account Officer
  const myApplicationIds = useMemo(() => {
    return new Set(
      applications
        .filter((a) => a.marketingId === currentUser.id || a.marketingName === currentUser.name)
        .map((a) => a.id)
    );
  }, [applications, currentUser]);

  // Scoped logs: AO only sees logs for their user or their own applications
  const scopedLogs = useMemo(() => {
    if (isAccountOfficer) {
      return auditLogs.filter(
        (log) =>
          log.userId === currentUser.id ||
          log.userName === currentUser.name ||
          (log.applicationId && myApplicationIds.has(log.applicationId))
      );
    }
    return auditLogs;
  }, [auditLogs, isAccountOfficer, currentUser, myApplicationIds]);

  const filteredLogs = scopedLogs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(term) ||
      log.userName.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      (log.applicationNumber && log.applicationNumber.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterAction !== 'all') {
      if (!log.action.includes(filterAction)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Account Officer Privacy Mode Notice */}
      {isAccountOfficer && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">
              Log Audit Pribadi Account Officer ({currentUser.name} · {currentUser.branch})
            </p>
            <p className="text-[11px] text-emerald-400/90 mt-0.5 leading-relaxed">
              Anda hanya melihat riwayat aktivitas dan pembaruan status atas pengajuan survey milik Anda. Aktivitas surveyor lain tidak ditampilkan.
            </p>
          </div>
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded border border-emerald-500/20 text-[11px] shrink-0">
            {scopedLogs.length} Log Anda
          </span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-emerald-400" />
          <span>{isAccountOfficer ? `Log Aktivitas Survey Anda` : 'Log Aktivitas & Jejak Audit Transparan'}</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {isAccountOfficer
            ? `Riwayat pengajuan survey dan keputusan komite atas nasabah yang Anda survey.`
            : 'Memantau riwayat pengajuan survey, perubahan status penilaian, dan tindakan operasional staf secara real-time.'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari log berdasarkan nama staf, no. pengajuan, atau rincian tindakan..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">Semua Jenis Aksi</option>
            <option value="SUBMIT_SURVEY">Pengiriman Survey Baru</option>
            <option value="REVIEW">Keputusan Review Admin</option>
            <option value="RISK_VERIFICATION">Verifikasi Manajemen Risiko</option>
            <option value="USER">Manajemen Pengguna</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Tidak ada log aktivitas yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isReview = log.action.startsWith('REVIEW');
              const isRisk = log.action.startsWith('RISK_VERIFICATION');
              const isSubmit = log.action.startsWith('SUBMIT');

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3.5 border-b border-slate-800/70 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="mt-1 shrink-0">
                    {isSubmit ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                    ) : isRisk ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                    ) : isReview ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {log.userName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          [{log.userRole.toUpperCase()}]
                        </span>
                        {log.applicationNumber && (
                          <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {log.applicationNumber}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')} · {new Date(log.timestamp).toLocaleDateString('id-ID')}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      {log.details}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span>Aksi: {log.action}</span>
                      <span>·</span>
                      <span>Log ID: {log.id}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
