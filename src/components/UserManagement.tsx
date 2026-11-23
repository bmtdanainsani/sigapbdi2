import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  Trash2,
  Lock,
  Building,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit3,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const {
    users,
    createUser,
    updateUserStatus,
    deleteUser,
    currentUser,
    setActiveTab,
    adminUpdateUserCredentials,
    restoreDefaultRoleAccounts,
  } = useApp();

  // Access Guard: Kelola Staf & Peran is strictly for Super Admin
  if (currentUser.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 max-w-lg w-full space-y-4 shadow-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-400 mx-auto">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Menu Data Staf Dibatasi</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Menu Manajemen Staf & Peran hanya dapat diakses oleh <strong className="text-white">Super Administrator</strong>.
          </p>
          <p className="text-[11px] text-slate-400 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            Peran Anda saat ini adalah <strong className="text-white">{currentUser.roleTitle}</strong> ({currentUser.branch}). Sesuai kebijakan keamanan, user manajemen maupun staf operasional lain tidak diizinkan mengubah konfigurasi akun pengguna.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </div>
    );
  }

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('marketing');
  const [department, setDepartment] = useState('Marketing & Financing Survey');
  const [branch, setBranch] = useState('Cabang Pasar Minggu');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('BMT2026!');
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);

  // Table credentials reveal & copy state
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Super Admin Edit / Reset Credential modal state
  const [editingCredUser, setEditingCredUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const generateSuggestedUsername = (inputName: string, selectedRole: UserRole) => {
    const cleanName = inputName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .trim()
      .split(/\s+/)[0] || 'staf';
    const prefix =
      selectedRole === 'marketing'
        ? 'ao'
        : selectedRole === 'branch_manager'
        ? 'bm'
        : selectedRole === 'branch_admin'
        ? 'adm'
        : selectedRole === 'admin'
        ? 'analis'
        : selectedRole === 'risk_management'
        ? 'risk'
        : selectedRole === 'management'
        ? 'direksi'
        : 'admin';
    return `${prefix}.${cleanName}`;
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'super_admin') {
      setDepartment('Manajemen Risiko & Operasional');
    } else if (newRole === 'management') {
      setDepartment('Direksi & Dewan Manajemen');
    } else if (newRole === 'risk_management') {
      setDepartment('Divisi Manajemen Risiko');
    } else if (newRole === 'branch_manager') {
      setDepartment('Operasional & Supervisi Cabang');
    } else if (newRole === 'branch_admin') {
      setDepartment('Administrasi Pencairan & Legal Cabang');
    } else if (newRole === 'admin') {
      setDepartment('Credit Committee & Risk Review');
    } else {
      setDepartment('Marketing & Financing Survey');
    }

    if (name) {
      setUsername(generateSuggestedUsername(name, newRole));
    }
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (
      !username ||
      username.startsWith('ao.') ||
      username.startsWith('bm.') ||
      username.startsWith('adm.') ||
      username.startsWith('analis.') ||
      username.startsWith('risk.') ||
      username.startsWith('direksi.') ||
      username.startsWith('admin.')
    ) {
      setUsername(generateSuggestedUsername(newName, role));
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Nama dan email wajib diisi.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase() || generateSuggestedUsername(name, role);
    const cleanPassword = password.trim() || 'BMT2026!';

    // Check duplicate username
    const isDuplicate = users.some((u) => u.username.toLowerCase() === cleanUsername);
    if (isDuplicate) {
      alert(`Username "${cleanUsername}" sudah digunakan oleh staf lain. Silakan pilih username lain.`);
      return;
    }

    const roleTitle =
      role === 'super_admin'
        ? 'Super Administrator & Kadiv Operasional'
        : role === 'management'
        ? 'Dewan Pengurus & Manajemen Eksekutif'
        : role === 'risk_management'
        ? 'Manajemen Risiko (Risk Review & Verifikasi)'
        : role === 'branch_manager'
        ? 'Branch Manager / Kepala Cabang'
        : role === 'branch_admin'
        ? 'Admin Cabang (Pencairan & Legal)'
        : role === 'admin'
        ? 'Komite Pembiayaan & Analis Kredit'
        : 'Account Officer / Surveyor Lapangan';

    createUser({
      name,
      email,
      role,
      roleTitle,
      department,
      branch,
      phone: phone || '081200000000',
      status: 'active',
      username: cleanUsername,
      initialUsername: cleanUsername,
      password: cleanPassword,
      initialPassword: cleanPassword,
    });

    setName('');
    setEmail('');
    setPhone('');
    setUsername('');
    setPassword('BMT2026!');
    setIsAddUserModalOpen(false);
  };

  const toggleRevealPassword = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const copyCredentials = (u: User) => {
    const text = `Kredensial Login BMT Dana Insani:\nNama: ${u.name}\nPeran: ${u.roleTitle}\nCabang: ${u.branch}\nUsername: ${u.username}\nPassword: ${u.password}`;
    navigator.clipboard.writeText(text);
    setCopiedUserId(u.id);
    setTimeout(() => setCopiedUserId(null), 2500);
  };

  const openEditCredModal = (u: User) => {
    setEditingCredUser(u);
    setEditUsername(u.username);
    setEditPassword(u.password);
    setShowEditPassword(false);
    setEditErrorMsg('');
  };

  const handleSaveEditCred = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCredUser) return;
    setEditErrorMsg('');

    const res = adminUpdateUserCredentials(
      editingCredUser.id,
      editUsername,
      editPassword ? editPassword : undefined
    );

    if (!res.success) {
      setEditErrorMsg(res.message || 'Gagal mengubah kredensial.');
      return;
    }

    setEditingCredUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-400" />
            <span>Manajemen Staf & Hak Akses (Super Admin)</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Kelola izin pengguna, daftarkan staf operasional baru, dan pantau status otentikasi peran (RBAC).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => restoreDefaultRoleAccounts()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors shadow-sm"
            title="Pastikan setiap dari 7 peran operasional memiliki akun default aktif"
          >
            <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
            <span>Sinkronkan Akun Default</span>
          </button>
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Daftar Akun Staf Baru</span>
          </button>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Super Admin Card */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-1"> 
            <Shield className="h-4 w-4" />
            <span>Super Admin</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Akses Penuh Sistem</p>
          <ul className="mt-2 space-y-1 text-[10px] text-slate-400">
            <li>· Kelola akun seluruh staf</li>
            <li>· Hak akses monitoring & audit</li>
            <li>· Reset data & konfigurasi</li>
          </ul>
        </div>

        {/* Dewan Manajemen Card */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
            <Building className="h-4 w-4" />
            <span>Manajemen</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Pengawasan Makro</p>
          <ul className="mt-2 space-y-1 text-[10px] text-slate-400">
            <li>· Dasbor analitik cabang</li>
            <li>· Pantau realisasi & valid</li>
            <li>· Catatan atensi dewan</li>
          </ul>
        </div>

        {/* Branch Manager Card */}
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase mb-1">
            <Building className="h-4 w-4" />
            <span>Branch Manager</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Supervisi Cabang</p>
          <ul className="mt-2 space-y-1 text-[10px] text-slate-400">
            <li>· Validasi survey AO</li>
            <li>· Validasi akhir pencairan</li>
            <li>· Otorisasi akad cabang</li>
          </ul>
        </div>

        {/* Admin Cabang Card */}
        <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3.5">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase mb-1">
            <Shield className="h-4 w-4" />
            <span>Admin Cabang</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Pencairan & Legal</p>
          <ul className="mt-2 space-y-1 text-[10px] text-slate-400">
            <li>· Terima instruksi analis</li>
            <li>· Pengikatan fidusia/APHT</li>
            <li>· Unggah foto bukti fisik</li>
          </ul>
        </div>

        {/* Admin Reviewer Card */}
        <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3.5">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase mb-1">
            <Shield className="h-4 w-4" />
            <span>Komite / Analis</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Putusan Kredit</p>
          <ul className="mt-2 space-y-1 text-[10px] text-slate-400">
            <li>· Sidang komite berkas BM</li>
            <li>· Penetapan limit & akad</li>
            <li>· Terbitkan perintah cair</li>
          </ul>
        </div>

        {/* Manajemen Risiko Card */}
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Manajemen Risiko</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Verifikasi &amp; Koreksi Komite</p>
          <ul className="mt-2 space-y-1 text-[10px] text-slate-400">
            <li>· Koreksi pasca-jadwal Analis</li>
            <li>· Beri tanda verifikasi &amp; catatan</li>
            <li>· Read-only data lain (tampil di komite)</li>
          </ul>
        </div>

        {/* Marketing Surveyor Card */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase mb-1">
            <Shield className="h-4 w-4" />
            <span>Marketing / AO</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Survey Lapangan</p>
          <ul className="mt-2 space-y-1 text-[10px] text-slate-400">
            <li>· Form survey 5C mobile</li>
            <li>· Kalkulator DSR instan</li>
            <li>· Bukti foto & geotagging</li>
          </ul>
        </div>
      </div>

      {/* Staff Accounts Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-xs">
        <div className="border-b border-slate-800 px-5 py-3.5 bg-slate-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Daftar Akun & Kredensial Pengguna ({users.length} Staf)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Super Admin memiliki hak akses penuh untuk memantau username, melihat password, dan mereset kredensial seluruh staf operasional.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Staf</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Kredensial Login (Username & Password)</th>
                <th className="py-3 px-4">Departemen & Cabang</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const isCurrentActive = u.id === currentUser.id;
                const isPassRevealed = revealedPasswords[u.id];
                const isCopied = copiedUserId === u.id;
                const hasModifiedUsername = u.initialUsername && u.initialUsername !== u.username;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {u.name} {isCurrentActive && <span className="text-[10px] text-emerald-400 font-normal">(Anda)</span>}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.role === 'super_admin'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                            : u.role === 'management'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                            : u.role === 'branch_manager'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                            : u.role === 'branch_admin'
                            ? 'bg-teal-950/80 text-teal-300 border border-teal-500/30'
                            : u.role === 'risk_management'
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                            : u.role === 'admin'
                            ? 'bg-sky-950/80 text-sky-400 border border-sky-500/30'
                            : 'bg-indigo-950/80 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {u.role === 'super_admin'
                          ? 'Super Admin'
                          : u.role === 'management'
                          ? 'Dewan Manajemen'
                          : u.role === 'risk_management'
                          ? 'Manajemen Risiko'
                          : u.role === 'branch_manager'
                          ? 'Branch Manager'
                          : u.role === 'branch_admin'
                          ? 'Admin Cabang'
                          : u.role === 'admin'
                          ? 'Admin Reviewer'
                          : 'Marketing Surveyor'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{u.roleTitle}</p>
                    </td>

                    {/* Kredensial Login (Username & Password - Akses Penuh Super Admin) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-emerald-400 font-bold text-[11px]">
                            @{u.username}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => copyCredentials(u)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Salin Kredensial Login (Username & Password)"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditCredModal(u)}
                              className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              title="Edit / Reset Kredensial Akun (Super Admin)"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {hasModifiedUsername && (
                          <p className="text-[9px] text-amber-400/90 font-mono">
                            Awal dibuat: @{u.initialUsername}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5 font-mono text-[10px]">
                            <Key className="h-3 w-3 text-slate-500" />
                            <span className={isPassRevealed ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                              {isPassRevealed ? u.password : '••••••••'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleRevealPassword(u.id)}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5"
                            title={isPassRevealed ? 'Sembunyikan Password' : 'Lihat Password'}
                          >
                            {isPassRevealed ? (
                              <EyeOff className="h-3 w-3 text-amber-400" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="text-slate-300">{u.department}</p>
                      <p className="text-[11px] text-slate-500">{u.branch}</p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.status === 'active' ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <XCircle className="h-3.5 w-3.5" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => updateUserStatus(u.id, u.status === 'active' ? 'inactive' : 'active')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[10px]"
                        >
                          {u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>

                        <button
                          onClick={() => openEditCredModal(u)}
                          className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title="Reset Password / Ganti Username"
                        >
                          <Key className="h-3.5 w-3.5" />
                        </button>

                        {users.length > 1 && !isCurrentActive && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus akun ${u.name}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User (Dengan Setting Akun Login & Tipe Peran) */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Daftarkan Akun & Kredensial Staf Baru
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Super Admin menetapkan tipe peran dan kredensial login awal.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Contoh: Farhan Ardiansyah, S.E."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Staf <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama.staf@bmtdanainsani.id"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tipe Peran (Hak Akses) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden font-medium"
                  >
                    <option value="marketing">Marketing / Surveyor Lapangan</option>
                    <option value="branch_manager">Branch Manager / Kepala Cabang</option>
                    <option value="branch_admin">Admin Cabang (Pencairan & Legal)</option>
                    <option value="admin">Admin / Komite Pembiayaan</option>
                    <option value="risk_management">Manajemen Risiko (Verifikasi &amp; Koreksi Komite)</option>
                    <option value="management">Dewan Manajemen (Executive Read-Only)</option>
                    <option value="super_admin">Super Administrator</option>
                  </select>
                </div>
              </div>

              {/* Setting Kredensial Login (Username Awal & Password) */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" />
                    <span>Konfigurasi Kredensial Login Awal</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (name) setUsername(generateSuggestedUsername(name, role));
                    }}
                    className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Saran Username</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Username Awal Login <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-500 font-mono">@</span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="username.staf"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-6 pr-2 py-1.5 text-white font-mono focus:border-emerald-500 focus:outline-hidden text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Password Akun <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswordInModal ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password akun"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 pr-8 text-white font-mono focus:border-emerald-500 focus:outline-hidden text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-white"
                      >
                        {showPasswordInModal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  💡 <strong>Catatan:</strong> Username awal dibuat oleh Super Admin dan dapat diubah sendiri oleh staf di menu profil akun. Namun, Super Admin tetap dapat memantau dan melihat username serta password tersebut sewaktu-waktu.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kantor Cabang
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Contoh: Cabang Pasar Minggu"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nomor HP / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                >
                  Daftarkan Akun & Kredensial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit / Reset Kredensial oleh Super Admin */}
      {editingCredUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Kelola Kredensial Akun Staf
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingCredUser.name} ({editingCredUser.roleTitle})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCredUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editErrorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/50 p-2.5 text-xs text-rose-300">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditCred} className="space-y-3.5 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Nama:</span>
                  <strong className="text-white">{editingCredUser.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Cabang:</span>
                  <span className="text-slate-300">{editingCredUser.branch}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Username Awal Dibuat:</span>
                  <span className="text-amber-400">@{editingCredUser.initialUsername || editingCredUser.username}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Username Aktif
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500 font-mono">@</span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-6 pr-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Password Akun Baru / Reset
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 pr-10 text-white font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Password akan langsung aktif untuk login staf tersebut.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCredUser(null)}
                  className="rounded-xl px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-500 shadow-sm"
                >
                  Simpan Kredensial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
