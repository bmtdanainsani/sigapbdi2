import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QuestionDefinition } from '../data/surveyQuestions';
import { SurveyCategory } from '../types';
import {
  ListChecks,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Shield,
  Layers,
  Check,
  X,
} from 'lucide-react';

const CATEGORY_OPTIONS: SurveyCategory[] = [
  'Identitas & Domisili',
  'Tujuan Pembiayaan',
  'Character',
  'Usaha/Pekerjaan',
  'Capacity',
  'Capital',
  'Jaminan',
  'Bukti Survey',
  'Fraud Red Flag',
  'Kesimpulan Survey',
];

export const ChecklistManagement: React.FC = () => {
  const {
    questions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    toggleQuestionActive,
    resetQuestionsToDefault,
    currentUser,
    setActiveTab,
  } = useApp();

  // Access Guard: Kelola Checklist is strictly for Super Admin
  if (currentUser.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 max-w-lg w-full space-y-4 shadow-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-400 mx-auto">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Menu Master Checklist Dibatasi</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Menu konfigurasi master pertanyaan checklist survey 5C hanya dapat diakses dan diubah oleh <strong className="text-white">Super Administrator</strong>.
          </p>
          <p className="text-[11px] text-slate-400 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            Peran Anda saat ini adalah <strong className="text-white">{currentUser.roleTitle}</strong> ({currentUser.branch}). Menu master data ini tidak tersedia untuk peran Anda.
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionDefinition | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<SurveyCategory>('Character');
  const [formQuestion, setFormQuestion] = useState('');
  const [formEvidenceGuide, setFormEvidenceGuide] = useState('');
  const [formDimension, setFormDimension] = useState<QuestionDefinition['dimension5C']>('Character');
  const [formCriticality, setFormCriticality] = useState<QuestionDefinition['criticality']>('high');
  const [formIsRedFlag, setFormIsRedFlag] = useState(false);

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormCode('C' + (questions.length + 1));
    setFormCategory('Character');
    setFormQuestion('');
    setFormEvidenceGuide('');
    setFormDimension('Character');
    setFormCriticality('high');
    setFormIsRedFlag(false);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (q: QuestionDefinition) => {
    setEditingQuestion(q);
    setFormCode(q.code);
    setFormCategory(q.category);
    setFormQuestion(q.question);
    setFormEvidenceGuide(q.evidenceGuide);
    setFormDimension(q.dimension5C);
    setFormCriticality(q.criticality);
    setFormIsRedFlag(!!q.isRedFlagTrigger);
    setIsModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formCode.trim()) {
      alert('Kode dan teks pertanyaan wajib diisi.');
      return;
    }

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, {
        code: formCode,
        category: formCategory,
        question: formQuestion,
        evidenceGuide: formEvidenceGuide,
        dimension5C: formDimension,
        criticality: formCriticality,
        isRedFlagTrigger: formIsRedFlag,
      });
    } else {
      addQuestion({
        code: formCode,
        category: formCategory,
        question: formQuestion,
        evidenceGuide: formEvidenceGuide,
        dimension5C: formDimension,
        criticality: formCriticality,
        isRedFlagTrigger: formIsRedFlag,
        isActive: true,
      });
    }

    setIsModalOpen(false);
  };

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const qText = q.question.toLowerCase();
    const qCode = q.code.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = qText.includes(query) || qCode.includes(query) || q.category.toLowerCase().includes(query);
    if (!matchesSearch) return false;

    if (selectedCategory !== 'all' && q.category !== selectedCategory) {
      return false;
    }

    if (statusFilter === 'active' && q.isActive === false) return false;
    if (statusFilter === 'inactive' && q.isActive !== false) return false;

    return true;
  });

  const totalQuestions = questions.length;
  const activeQuestionsCount = questions.filter((q) => q.isActive !== false).length;
  const inactiveQuestionsCount = totalQuestions - activeQuestionsCount;
  const criticalQuestionsCount = questions.filter((q) => q.criticality === 'critical').length;
  const redFlagQuestionsCount = questions.filter((q) => q.isRedFlagTrigger).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-emerald-400" />
            <span>Kelola Checklist Survey Lapangan (Super Admin)</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Hapus, kurangi butir yang tidak diperlukan, atau sesuaikan pertanyaan verifikasi 5C dan panduan bukti evidence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Kembalikan seluruh checklist survey ke 68 parameter standar awal?')) {
                resetQuestionsToDefault();
              }
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
            <span>Reset ke 68 Default</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Parameter Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
          <span className="text-[11px] text-slate-400 font-medium">Total Parameter</span>
          <p className="font-mono text-xl font-bold text-white mt-1 tabular-nums">{totalQuestions}</p>
          <span className="text-[10px] text-slate-500">Dalam database</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
          <span className="text-[11px] text-emerald-400 font-medium">Parameter Aktif</span>
          <p className="font-mono text-xl font-bold text-emerald-400 mt-1 tabular-nums">{activeQuestionsCount}</p>
          <span className="text-[10px] text-slate-500">Tampil di formulir</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
          <span className="text-[11px] text-slate-400 font-medium">Dinonaktifkan (Kurangi)</span>
          <p className="font-mono text-xl font-bold text-slate-400 mt-1 tabular-nums">{inactiveQuestionsCount}</p>
          <span className="text-[10px] text-slate-500">Dilewati saat survey</span>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5">
          <span className="text-[11px] text-rose-400 font-medium">Syarat Kritis</span>
          <p className="font-mono text-xl font-bold text-rose-400 mt-1 tabular-nums">{criticalQuestionsCount}</p>
          <span className="text-[10px] text-slate-500">Bobot tertinggi</span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3.5">
          <span className="text-[11px] text-amber-400 font-medium">Trigger Red Flag</span>
          <p className="font-mono text-xl font-bold text-amber-400 mt-1 tabular-nums">{redFlagQuestionsCount}</p>
          <span className="text-[10px] text-slate-500">Deteksi fraud</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan kode, bunyi pertanyaan, atau cara verifikasi..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">Semua Kategori ({totalQuestions})</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif Saja</option>
            <option value="inactive">Nonaktif Saja</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-14 text-center">#No</th>
                <th className="py-3 px-3 w-20">Kode</th>
                <th className="py-3 px-3 w-36">Kategori</th>
                <th className="py-3 px-4">Pertanyaan & Cara Verifikasi Evidence</th>
                <th className="py-3 px-3 w-28 text-center">Dimensi 5C</th>
                <th className="py-3 px-3 w-24 text-center">Status</th>
                <th className="py-3 px-4 w-28 text-center">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Tidak ditemukan butir checklist yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => {
                  const isActive = q.isActive !== false;
                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        !isActive ? 'opacity-50 bg-slate-950/40' : ''
                      }`}
                    >
                      {/* ID Number */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        #{q.id}
                      </td>

                      {/* Code */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                          {q.code}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-slate-300 font-medium text-[11px]">{q.category}</span>
                      </td>

                      {/* Question & Evidence Guide */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-white leading-relaxed">{q.question}</p>
                          {q.criticality === 'critical' && (
                            <span className="text-[10px] text-rose-400 font-semibold bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-500/30 shrink-0">
                              Kritis
                            </span>
                          )}
                          {q.isRedFlagTrigger && (
                            <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">
                              Red Flag
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <HelpCircle className="h-3 w-3 text-slate-500 shrink-0" />
                          <span>Evidence: {q.evidenceGuide}</span>
                        </p>
                      </td>

                      {/* 5C Dimension */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                          {q.dimension5C}
                        </span>
                      </td>

                      {/* Status Active / Inactive Toggle */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleQuestionActive(q.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            isActive
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/60'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
                          }`}
                          title={isActive ? 'Klik untuk menonaktifkan / kurangi butir ini' : 'Klik untuk mengaktifkan kembali'}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(q)}
                            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Butir Pertanyaan"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Yakin ingin MENGHAPUS PERMANEN butir #${q.id} [${q.code}]: "${q.question}"?`)) {
                                deleteQuestion(q.id);
                              }
                            }}
                            className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Hapus Permanen Butir Ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Question */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingQuestion ? `Edit Butir Checklist #${editingQuestion.id}` : 'Tambah Parameter Survey Baru'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tentukan bunyi pertanyaan, cara verifikasi evidence, serta klasifikasi 5C.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Kode Parameter <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Contoh: C7 / CA8 / BR5"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Area / Kategori <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Bunyi Pertanyaan / Pernyataan Verifikasi <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="Tuliskan butir yang harus diverifikasi oleh marketing saat survey..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Cara Verifikasi / Bukti Fisik (Evidence Guide)
                </label>
                <textarea
                  rows={2}
                  value={formEvidenceGuide}
                  onChange={(e) => setFormEvidenceGuide(e.target.value)}
                  placeholder="Contoh: Cek KTP asli; bandingkan stok toko; mutasi rekening..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Dimensi 5C</label>
                  <select
                    value={formDimension}
                    onChange={(e) => setFormDimension(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="Character">Character (Integritas)</option>
                    <option value="Capacity">Capacity (Kapasitas Keuangan)</option>
                    <option value="Capital">Capital (Modal)</option>
                    <option value="Collateral">Collateral (Agunan)</option>
                    <option value="Condition">Condition (Kondisi Pasar/Usaha)</option>
                    <option value="RedFlag">RedFlag (Risiko Fraud)</option>
                    <option value="Governance">Governance (Kepatuhan Audit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tingkat Kritis</label>
                  <select
                    value={formCriticality}
                    onChange={(e) => setFormCriticality(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="critical">Kritis (Critical Requirement)</option>
                    <option value="high">Tinggi (High Priority)</option>
                    <option value="medium">Sedang (Medium Priority)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="form-is-red-flag"
                  checked={formIsRedFlag}
                  onChange={(e) => setFormIsRedFlag(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="form-is-red-flag" className="text-slate-300 cursor-pointer select-none">
                  Trigger Fraud Red Flag (Jika jawaban survey &apos;Tidak Sesuai&apos;, picu alarm risiko tinggi)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                >
                  {editingQuestion ? 'Simpan Perubahan' : 'Tambahkan ke Form Survey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
