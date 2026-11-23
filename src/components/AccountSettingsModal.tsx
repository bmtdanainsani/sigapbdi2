import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Key,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Shield,
  AlertTriangle,
  Building,
  UserCheck,
} from 'lucide-react';

export const AccountSettingsModal: React.FC = () => {
  const {
    currentUser,
    isAccountSettingsOpen,
    setIsAccountSettingsOpen,
    updateMyCredentials,
  } = useApp();

  const [username, setUsername] = useState(currentUser.username || '');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAccountSettingsOpen) return null;

  const handleClose = () => {
    setErrorMsg('');
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
    setIsAccountSettingsOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setErrorMsg('Username tidak boleh kosong.');
      return;
    }

    // If changing password, validate
    if (newPassword || confirmPassword || currentPasswordInput) {
      if (currentPasswordInput !== currentUser.password) {
        setErrorMsg('Password saat ini tidak sesuai.');
        return;
      }
      if (newPassword.length < 5) {
        setErrorMsg('Password baru minimal 5 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi password baru tidak cocok.');
        return;
      }
    }

    const res = updateMyCredentials(cleanUser, newPassword ? newPassword : undefined);
    if (!res.success) {
      setErrorMsg(res.message || 'Gagal memperbarui kredensial.');
      return;
    }

    handleClose();
  };

  const isUsernameChanged = username.trim().toLowerCase() !== (currentUser.username || '').toLowerCase();
  const hasInitialUsername = currentUser.initialUsername && currentUser.initialUsername !== currentUser.username;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pengaturan Akun & Kredensial Saya</h3>
              <p className="text-[11px] text-slate-400">
                {currentUser.name} · {currentUser.roleTitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Card Summary */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Nama Lengkap:</span>
            <span className="font-semibold text-white">{currentUser.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Kantor Cabang:</span>
            <span className="text-emerald-400 font-medium">{currentUser.branch}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Departemen / Divisi:</span>
            <span className="text-slate-300">{currentUser.department}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Username Awal (Dibuat Super Admin):</span>
            <span className="font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              @{currentUser.initialUsername || currentUser.username}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Username Field */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Username Aktif untuk Login <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-mono">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="username_anda"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-7 pr-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Anda dapat mengubah username ini sesuai keinginan untuk login sehari-hari.
            </p>
            {hasInitialUsername && (
              <p className="text-[10px] text-amber-400/90 mt-0.5">
                ℹ️ Username awal yang dibuatkan Super Admin: <strong>@{currentUser.initialUsername}</strong>
              </p>
            )}
          </div>

          {/* Ganti Password Section */}
          <div className="border-t border-slate-800 pt-3 space-y-3">
            <p className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ubah Password Akun (Opsional)</span>
            </p>
            <p className="text-[11px] text-slate-400 -mt-1">
              Kosongkan bagian ini jika Anda hanya ingin mengubah username.
            </p>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Password Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Masukkan password saat ini untuk verifikasi"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 pr-10 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 5 karakter"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 pr-10 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Super Admin Access Notice */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-[11px] text-amber-300/90 leading-relaxed">
            <Shield className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Pemberitahuan Otoritas Super Admin:</strong>
              <p className="mt-0.5 text-slate-300">
                Sesuai kebijakan kepatuhan BMT Dana Insani, Super Administrator memiliki wewenang untuk melihat kredensial login aktif Anda dan dapat membantu melakukan reset password sewaktu-waktu jika diperlukan.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl px-4 py-2 font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
            >
              <Check className="h-4 w-4" />
              <span>Simpan Perubahan Kredensial</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
