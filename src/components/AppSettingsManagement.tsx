import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppColorTheme, AppSettings } from '../types';
import {
  Settings,
  Building2,
  Palette,
  FileText,
  SlidersHorizontal,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  Check,
  Globe,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Info,
  Layers,
  FileCheck,
} from 'lucide-react';

export const AppSettingsManagement: React.FC = () => {
  const {
    currentUser,
    appSettings,
    updateAppSettings,
    resetAppSettings,
    theme,
    setTheme,
    applications,
    deleteAllApplications,
  } = useApp();

  const [form, setForm] = useState<AppSettings>(appSettings);
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'theme' | 'print' | 'rules' | 'maintenance'>('branding');
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Sync state if external changes happen
  useEffect(() => {
    setForm(appSettings);
  }, [appSettings]);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateAppSettings(form);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan seluruh pengaturan aplikasi & identitas lembaga ke nilai bawaan standar BMT?')) {
      resetAppSettings();
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);
    }
  };

  const COLOR_THEMES: {
    id: AppColorTheme;
    name: string;
    description: string;
    primaryHex: string;
    accentClass: string;
    bgClass: string;
  }[] = [
    {
      id: 'emerald',
      name: 'Hijau Zamrud Syariah',
      description: 'Karakter keuangan syariah klasik, menyejukkan, terpercaya & barakah.',
      primaryHex: '#059669',
      accentClass: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40',
      bgClass: 'bg-emerald-600',
    },
    {
      id: 'teal',
      name: 'Toska Bahari',
      description: 'Nuansa segar, dinamis, bersahabat untuk pembiayaan mikro & UMKM.',
      primaryHex: '#0d9488',
      accentClass: 'text-teal-400 border-teal-500/50 bg-teal-950/40',
      bgClass: 'bg-teal-600',
    },
    {
      id: 'navy',
      name: 'Biru Korporat Lembaga',
      description: 'Karakter perbankan formal, solid, kokoh, dan stabilitas tinggi.',
      primaryHex: '#0284c7',
      accentClass: 'text-sky-400 border-sky-500/50 bg-sky-950/40',
      bgClass: 'bg-sky-600',
    },
    {
      id: 'amber',
      name: 'Emas Barakah & Sukuk',
      description: 'Aksen prestisius, kemitraan syariah, dan kemakmuran bersama.',
      primaryHex: '#d97706',
      accentClass: 'text-amber-400 border-amber-500/50 bg-amber-950/40',
      bgClass: 'bg-amber-600',
    },
    {
      id: 'indigo',
      name: 'Indigo Modern Finansial',
      description: 'Teknologi modern fintech, presisi tinggi, dan efisiensi analitik.',
      primaryHex: '#4f46e5',
      accentClass: 'text-indigo-400 border-indigo-500/50 bg-indigo-950/40',
      bgClass: 'bg-indigo-600',
    },
    {
      id: 'slate',
      name: 'Obsidian Monokrom',
      description: 'Gaya visual elegan, minimalis, dan kontras tinggi untuk visualisasi data.',
      primaryHex: '#475569',
      accentClass: 'text-slate-300 border-slate-500/50 bg-slate-900',
      bgClass: 'bg-slate-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xs">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Pengaturan Aplikasi & Lembaga</h2>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kustomisasi identitas aplikasi, sub-judul, tema visual warna, kop cetak dokumen, dan kebijakan operasional.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Bawaan</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            {isSavedRecently ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('branding')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all ${
            activeSubTab === 'branding'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Identitas & Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('theme')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all ${
            activeSubTab === 'theme'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>Tema & Warna</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('print')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all ${
            activeSubTab === 'print'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Kop Surat & Cetak Berkas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rules')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all ${
            activeSubTab === 'rules'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Kebijakan Operasional</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('maintenance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all ${
            activeSubTab === 'maintenance'
              ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Trash2 className="h-4 w-4" />
          <span>Pemeliharaan Data ({applications.length})</span>
        </button>
      </div>

      {/* Tab 1: Identitas & Branding */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informasi Aplikasi */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Informasi Aplikasi & Tagline</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Aplikasi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.appName}
                    onChange={(e) => handleChange('appName', e.target.value)}
                    placeholder="Contoh: BMT Dana Insani"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ditampilkan pada header utama, tab browser, dan bilah navigasi kiri.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sub-Judul / Deskripsi Singkat <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.appSubtitle}
                    onChange={(e) => handleChange('appSubtitle', e.target.value)}
                    placeholder="Contoh: Sistem Credit Scoring 5C & Komite Pembiayaan"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Teks Label Badge Sistem
                  </label>
                  <input
                    type="text"
                    value={form.brandBadgeText}
                    onChange={(e) => handleChange('brandBadgeText', e.target.value)}
                    placeholder="Contoh: Sistem Terintegrasi v3.5"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Informasi Legal Lembaga */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Identitas Lembaga / Koperasi</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Resmi Lembaga / BMT / KSPPS <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.institutionName}
                    onChange={(e) => handleChange('institutionName', e.target.value)}
                    placeholder="Contoh: KSPPS BMT DANA INSANI"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white uppercase font-bold focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Slogan / Motto Lembaga
                  </label>
                  <input
                    type="text"
                    value={form.institutionTagline}
                    onChange={(e) => handleChange('institutionTagline', e.target.value)}
                    placeholder="Contoh: Mitra Usaha Syariah Terpercaya, Barakah & Bertumbuh Bersama"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nomor Izin Kemenkop / SK Hukum Resmi
                  </label>
                  <input
                    type="text"
                    value={form.institutionLegalNumber}
                    onChange={(e) => handleChange('institutionLegalNumber', e.target.value)}
                    placeholder="Contoh: AHU-0004123.AH.01.26.TAHUN 2021"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Kontak & Alamat Lembaga */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Alamat & Kontak Operasional Kantor</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-3">
                <label className="block text-slate-300 font-semibold mb-1">
                  Alamat Lengkap Kantor Pusat / Layanan
                </label>
                <input
                  type="text"
                  value={form.institutionAddress}
                  onChange={(e) => handleChange('institutionAddress', e.target.value)}
                  placeholder="Contoh: Jl. Raya Condet No. 88, Pasar Minggu, Jakarta Selatan, DKI Jakarta 12510"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Telepon / WhatsApp Layanan
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={form.institutionPhone}
                    onChange={(e) => handleChange('institutionPhone', e.target.value)}
                    placeholder="(021) 7888-2345 / 0812-xxxx"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alamat Email Resmi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="email"
                    value={form.institutionEmail}
                    onChange={(e) => handleChange('institutionEmail', e.target.value)}
                    placeholder="operasional@lembaga.bmt.co.id"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Website Lembaga
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={form.institutionWebsite}
                    onChange={(e) => handleChange('institutionWebsite', e.target.value)}
                    placeholder="https://lembaga.bmt.co.id"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tema Warna & Visual */}
      {activeSubTab === 'theme' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Palette className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Palet Warna Utama Aplikasi</h3>
              </div>
              <span className="text-xs text-slate-400">
                Tema aktif: <strong className="text-emerald-400 capitalize">{form.colorTheme}</strong>
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Pilih karakter warna yang mencerminkan identitas resmi lembaga atau koperasi Anda. Warna ini digunakan pada aksen tombol, badge status, kartu aktif, dan indikator navigasi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {COLOR_THEMES.map((themeOption) => {
                const isSelected = form.colorTheme === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    type="button"
                    onClick={() => {
                      handleChange('colorTheme', themeOption.id);
                      document.documentElement.setAttribute('data-color-theme', themeOption.id);
                    }}
                    className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? `${themeOption.accentClass} ring-2 ring-emerald-500/50 shadow-md`
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-4 w-4 rounded-full shadow-xs"
                          style={{ backgroundColor: themeOption.primaryHex }}
                        />
                        <span className="text-xs font-bold text-white">
                          {themeOption.name}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {themeOption.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Tampilan Gelap / Terang */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Mode Tampilan Bawaan (Light / Dark)</h3>
              </div>
              <span className="text-xs text-slate-400">
                Mode saat ini: <strong className="text-emerald-400 uppercase">{theme}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'border-emerald-500 bg-slate-950 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-xs font-bold text-white">🌙 Dark Mode (Standar Operasional)</strong>
                  {theme === 'dark' && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Latar gelap berkelas untuk kenyamanan visual saat bekerja intensif di laptop kantor dan lapangan.
                </p>
              </div>

              <div
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  theme === 'light'
                    ? 'border-emerald-500 bg-slate-100 text-slate-900 shadow-md'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-xs font-bold text-slate-900">☀️ High-Contrast Light Mode</strong>
                  {theme === 'light' && <Check className="h-4 w-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-600">
                  Latar terang kontras tinggi untuk ruangan berlimpah cahaya atau presentasi layar proyektor.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Format Kop Surat & Cetak Berkas */}
      {activeSubTab === 'print' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Kop Cetak */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Konfigurasi Kop Dokumen Cetak</h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Judul Utama Kop Surat (Header)
                  </label>
                  <input
                    type="text"
                    value={form.printHeaderTitle}
                    onChange={(e) => handleChange('printHeaderTitle', e.target.value)}
                    placeholder="KSPPS BMT DANA INSANI - DIVISI MANAJEMEN RISIKO"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white uppercase font-bold focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sub-Judul Dokumen Berita Acara
                  </label>
                  <input
                    type="text"
                    value={form.printHeaderSubtitle}
                    onChange={(e) => handleChange('printHeaderSubtitle', e.target.value)}
                    placeholder="BERITA ACARA KEPUTUSAN KOMITE PEMBIAYAAN & HASIL SURVEY ON-SITE"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kota Penetapan Keputusan Sidang Komite
                  </label>
                  <input
                    type="text"
                    value={form.defaultCityDecision}
                    onChange={(e) => handleChange('defaultCityDecision', e.target.value)}
                    placeholder="Contoh: Jakarta Selatan, Surabaya, Yogyakarta"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ditampilkan pada bagian tanda tangan & tanggal putusan risalah komite pembiayaan.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Catatan Kerahasiaan & Disclaimer Hukum (Footer)
                  </label>
                  <textarea
                    rows={3}
                    value={form.printLegalFooterNotice}
                    onChange={(e) => handleChange('printLegalFooterNotice', e.target.value)}
                    placeholder="Dokumen ini merupakan rahasia lembaga..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3 text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Live Paper Preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Pratinjau Lembar Kop Surat</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Kertas Putih A4</span>
                </div>

                {/* Simulated Paper */}
                <div className="mt-4 rounded-xl border border-slate-300 bg-white p-5 text-slate-900 shadow-sm text-left">
                  <div className="border-b-2 border-slate-900 pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-tight text-slate-900">
                          {form.printHeaderTitle || form.institutionName || 'LEMBAGA BMT SYARIAH'}
                        </h4>
                        <p className="text-[9px] font-semibold text-slate-700 mt-0.5">
                          {form.printHeaderSubtitle || 'BERITA ACARA KEPUTUSAN KOMITE'}
                        </p>
                        <p className="text-[8px] text-slate-500">
                          {form.institutionAddress || 'Alamat Kantor Lembaga'} · Telp: {form.institutionPhone || '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 border border-slate-400 rounded">
                          SRV-2026-0001
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-4 space-y-1 text-[9px] text-slate-600">
                    <p className="font-bold text-slate-800">I. RINGKASAN REKOMENDASI HASIL SIDANG KOMITE</p>
                    <p>Nama Mitra / Debitur: Bpk. / Ibu Pemohon Pembiayaan</p>
                    <p>Status Putusan: <strong className="text-emerald-700">DISETUJUI PENUH (GRADE A)</strong></p>
                  </div>

                  <div className="border-t border-slate-300 pt-2 text-[8px] text-slate-500 flex justify-between">
                    <span>{form.defaultCityDecision || 'Jakarta'}, {new Date().toLocaleDateString('id-ID')}</span>
                    <span>Tanda Tangan Komite Pembiayaan</span>
                  </div>

                  <p className="text-[7px] text-slate-400 mt-2 italic border-t border-dashed border-slate-200 pt-1">
                    {form.printLegalFooterNotice}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic mt-3">
                Format kop di atas akan langsung teraplikasi pada tombol cetak PDF seluruh berkas pengajuan survey debitur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Kebijakan Operasional */}
      {activeSubTab === 'rules' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Parameter & Validasi Operasional Lembaga</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Standar Persentase Bagi Hasil / Margin Lembaga (% p.a.)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={form.defaultMarginRatePa}
                    onChange={(e) => handleChange('defaultMarginRatePa', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-2.5 text-slate-400 font-semibold">%</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Menjadi nilai default pada formulir kalkulator kapasitas finansial surveyor AO.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Plafon Pembiayaan Maksimal (Rupiah)
                </label>
                <input
                  type="number"
                  min="1000000"
                  step="1000000"
                  value={form.maxLoanPlafon}
                  onChange={(e) => handleChange('maxLoanPlafon', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nilai: Rp {form.maxLoanPlafon.toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tenor Maksimal Pengajuan (Bulan)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={form.maxTenorMonths}
                  onChange={(e) => handleChange('maxTenorMonths', parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Standar mikro: 12-60 bulan (5 tahun).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Maksimal Jumlah Agunan / Jaminan yang Dapat Diinput
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.maxCollateralsCount}
                  onChange={(e) => handleChange('maxCollateralsCount', parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  AO dapat melampirkan hingga {form.maxCollateralsCount} agunan kombinasi (SHM, BPKB, AJB, dsb.).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Validasi Minimal Digit NIK & KK
                </label>
                <input
                  type="number"
                  min="12"
                  max="20"
                  value={form.minNikKkDigits}
                  onChange={(e) => handleChange('minNikKkDigits', parseInt(e.target.value, 10) || 16)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Standar Disdukcapil RI: 16 digit angka. Sistem akan menolak jika kurang dari angka ini.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Validasi Minimal Digit No. Handphone / WhatsApp
                </label>
                <input
                  type="number"
                  min="8"
                  max="15"
                  value={form.minPhoneDigits}
                  onChange={(e) => handleChange('minPhoneDigits', parseInt(e.target.value, 10) || 10)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Standar nomor seluler Indonesia: minimal {form.minPhoneDigits} digit angka.
                </p>
              </div>
            </div>
          </div>

          {/* Persyaratan Dokumen Pendamping */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Kewajiban Lampiran KTP Pendamping Calon Debitur
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 cursor-pointer hover:bg-slate-800/70">
                <input
                  type="checkbox"
                  checked={form.requireSpouseKtpWhenMarried}
                  onChange={(e) => handleChange('requireSpouseKtpWhenMarried', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <strong className="text-white block font-semibold">
                    Wajib Foto KTP Pasangan (Istri / Suami) jika Status Menikah
                  </strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Memastikan persetujuan pasangan sah terhadap fasilitas pembiayaan & jaminan harta bersama.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 cursor-pointer hover:bg-slate-800/70">
                <input
                  type="checkbox"
                  checked={form.requireParentKtpWhenSingle}
                  onChange={(e) => handleChange('requireParentKtpWhenSingle', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <strong className="text-white block font-semibold">
                    Wajib Foto KTP Orang Tua jika Status Belum Menikah
                  </strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Memastikan penjaminan wali keluarga atas calon debitur yang belum berkeluarga.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Pemeliharaan Data & Reset */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-rose-500/20 pb-3">
              <Trash2 className="h-5 w-5 text-rose-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Pembersihan Seluruh Berkas Survey Uji Coba</h3>
                <p className="text-[11px] text-rose-300">
                  Tindakan ini akan mengosongkan seluruh data pengajuan survey secara permanen.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-xs">
              <div>
                <p className="font-bold text-white">
                  Total Berkas Saat Ini: <span className="font-mono text-rose-300">{applications.length} berkas</span>
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {applications.length === 0
                    ? 'Database pengajuan sudah dalam keadaan bersih (0 berkas uji coba). Siap untuk input nasabah riil.'
                    : 'Disarankan dibersihkan sebelum aplikasi diserahkan atau dipakai staf Account Officer secara resmi.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                disabled={applications.length === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                  applications.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                <span>Bersihkan Semua Data Pengajuan</span>
              </button>
            </div>
          </div>

          {/* Audit trail metadata */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2 text-xs">
            <h4 className="font-bold text-white">Status Metadata Konfigurasi</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
              <p>Terakhir diperbarui: <span className="text-white font-mono">{form.updatedAt ? new Date(form.updatedAt).toLocaleString('id-ID') : '-'}</span></p>
              <p>Diperbarui oleh: <span className="text-emerald-400 font-semibold">{form.updatedBy || 'Super Administrator'}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing Applications */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Konfirmasi Pembersihan Data</h3>
                <p className="text-[11px] text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Anda akan menghapus secara permanen <strong>{applications.length} berkas permohonan survey</strong> dari sistem. Akun staf, peran, checklist, dan konfigurasi lembaga akan tetap aman.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAllApplications();
                  setIsConfirmDeleteOpen(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Ya, Bersihkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
