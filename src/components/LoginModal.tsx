import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import {
  LogIn,
  Key,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  Building2,
  Sun,
  Moon,
  Cloud,
} from 'lucide-react';

const ROLE_ORDER: UserRole[] = [
  'super_admin',
  'management',
  'branch_manager',
  'branch_admin',
  'admin',
  'risk_management',
  'marketing',
];

const ROLE_LABELS: Record<UserRole, { label: string; badgeClass: string }> = {
  super_admin: {
    label: 'Super Admin',
    badgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30',
  },
  management: {
    label: 'Dewan Manajemen',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
  },
  branch_manager: {
    label: 'Branch Manager',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
  },
  branch_admin: {
    label: 'Admin Cabang',
    badgeClass: 'bg-teal-950/80 text-teal-300 border-teal-500/30',
  },
  admin: {
    label: 'Komite / Analis',
    badgeClass: 'bg-sky-950/80 text-sky-400 border-sky-500/30',
  },
  risk_management: {
    label: 'Manajemen Risiko',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
  },
  marketing: {
    label: 'Marketing / AO',
    badgeClass: 'bg-indigo-950/80 text-indigo-400 border-indigo-500/30',
  },
};

interface AuthFormCardProps {
  mode: 'page' | 'modal';
  onClose?: () => void;
}

const AuthFormCard: React.FC<AuthFormCardProps> = ({ mode, onClose }) => {
  const {
    users,
    currentUser,
    isAuthenticated,
    loginWithCredentials,
    signInWithGoogle,
    appSettings,
    sessionExpiredNotice,
    clearSessionExpiredNotice,
  } = useApp();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showDefaultAccounts, setShowDefaultAccounts] = useState(false);

  // Pick one representative active account per role in logical workflow order
  const defaultRoleAccounts: User[] = ROLE_ORDER.map(
    (role) =>
      users.find((u) => u.role === role && u.status === 'active') ||
      users.find((u) => u.role === role)
  ).filter((u): u is User => Boolean(u));

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    clearSessionExpiredNotice();

    if (!usernameInput.trim()) {
      setErrorMessage('Username atau email wajib diisi.');
      return;
    }
    if (!passwordInput) {
      setErrorMessage('Password wajib diisi.');
      return;
    }

    const res = loginWithCredentials(usernameInput, passwordInput);
    if (!res.success) {
      setErrorMessage(res.message || 'Login gagal.');
      return;
    }

    setUsernameInput('');
    setPasswordInput('');
    onClose?.();
  };

  const handleFillAccount = (u: User) => {
    setErrorMessage('');
    setUsernameInput(u.username);
    setPasswordInput(u.password);
  };

  const handleQuickLogin = (u: User) => {
    setErrorMessage('');
    clearSessionExpiredNotice();
    const res = loginWithCredentials(u.username, u.password);
    if (!res.success) {
      setErrorMessage(res.message || 'Login gagal.');
      return;
    }
    setUsernameInput('');
    setPasswordInput('');
    onClose?.();
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    clearSessionExpiredNotice();
    setIsGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setErrorMessage(res.message || 'Login Google gagal.');
        return;
      }
      onClose?.();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            {mode === 'page' ? <Building2 className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white truncate">
              {mode === 'page'
                ? appSettings.appName || 'Credit Scoring & Survey Lapangan'
                : 'Ganti / Masuk Akun Pengguna'}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {appSettings.institutionName || 'BMT Dana Insani'} · Silakan login dengan akun Anda
            </p>
          </div>
        </div>
        {mode === 'modal' && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Session Timeout Warning Notice (60 minutes idle) */}
      {mode === 'page' && sessionExpiredNotice && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-950/50 p-3 text-xs text-amber-200 animate-in fade-in duration-200">
          <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{sessionExpiredNotice}</div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/50 p-3 text-xs text-rose-300 animate-in fade-in duration-200">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Username atau Email <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              required
              autoComplete="username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Contoh: superadmin, direksi.abdullah, ao.budi"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2.5 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Password Akun <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Masukkan password akun Anda"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-10 py-2.5 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="pt-1 space-y-2.5">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <LogIn className="h-4 w-4" />
            <span>Masuk ke Aplikasi</span>
          </button>

          <button
            type="button"
            disabled={isGoogleLoading}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-900/50 transition-colors disabled:opacity-60"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.72-2.46 1.15-4.22 1.15-3.24 0-5.99-2.19-6.97-5.13H1.02v3.14C3.03 21.14 7.21 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.03 14.01c-.25-.74-.39-1.53-.39-2.34s.14-1.6.39-2.34V6.19H1.02A11.98 11.98 0 0 0 0 11.67c0 1.93.46 3.76 1.02 5.48l4.01-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.03 2.86 1.02 7.01l4.01 3.14c.98-2.94 3.73-5.4 6.97-5.4Z"
              />
            </svg>
            <span>
              {isGoogleLoading ? 'Menghubungkan Google Cloud...' : 'Masuk dengan Akun Google (Sinkron Cloud)'}
            </span>
          </button>

          <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-400 leading-relaxed">
            <Cloud className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Gunakan <strong className="text-slate-200">Akun Google</strong> agar seluruh perubahan data tersimpan di Cloud Firestore dan otomatis muncul saat dibuka di gadget lain.
            </span>
          </div>
        </div>
      </form>

      {/* Daftar Akun Default Setiap Peran */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDefaultAccounts(!showDefaultAccounts)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span>Akun Default Setiap Peran ({defaultRoleAccounts.length} Peran)</span>
          </span>
          {showDefaultAccounts ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showDefaultAccounts && (
          <div className="border-t border-slate-800 p-2.5 space-y-1.5 max-h-56 overflow-y-auto">
            <p className="text-[10px] text-slate-400 px-1 pb-1">
              Klik akun untuk mengisi username & password, atau tekan{' '}
              <strong className="text-emerald-400">Masuk</strong> untuk login langsung.
            </p>
            {defaultRoleAccounts.map((u) => {
              const roleMeta = ROLE_LABELS[u.role];
              const isActiveSession = isAuthenticated && u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  onClick={() => handleFillAccount(u)}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition-colors ${
                    isActiveSession
                      ? 'border-emerald-500/40 bg-emerald-950/30'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold ${roleMeta.badgeClass}`}
                      >
                        {roleMeta.label}
                      </span>
                      <span className="text-[11px] font-semibold text-white truncate">
                        {u.name}
                      </span>
                      {isActiveSession && (
                        <span className="text-[9px] font-semibold text-emerald-400">(Aktif)</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="text-emerald-400">@{u.username}</span>
                      <span>·</span>
                      <span className="truncate">{u.branch}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(u);
                    }}
                    className="shrink-0 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
                  >
                    Masuk
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Keamanan & Auto-Logout 60 Menit */}
      <div className="border-t border-slate-800 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70 shrink-0" />
          <span>Sesi diawasi audit trail internal</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="h-3.5 w-3.5 text-amber-400/80 shrink-0" />
          <span>Auto-logout setelah 60 menit tidak aktif</span>
        </div>
      </div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { theme, toggleTheme, appSettings } = useApp();

  return (
    <div
      data-theme={theme}
      data-color-theme={appSettings.colorTheme || 'emerald'}
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 relative ${
        theme === 'light'
          ? 'theme-light bg-slate-100 text-slate-900'
          : 'theme-dark bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top-right Theme Toggle */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 transition-colors text-xs font-semibold"
          title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-amber-400" />
              <span>Mode Terang</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-600" />
              <span>Mode Gelap</span>
            </>
          )}
        </button>
      </div>

      <AuthFormCard mode="page" />

      <p className="mt-4 text-center text-[11px] text-slate-500">
        {appSettings.institutionName || 'BMT Dana Insani'} · {appSettings.appSubtitle || 'Sistem Penilaian Kredit & Survey Lapangan'}
      </p>
    </div>
  );
};

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen } = useApp();

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg my-8">
        <AuthFormCard mode="modal" onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </div>
  );
};
