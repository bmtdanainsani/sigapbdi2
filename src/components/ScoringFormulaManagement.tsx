import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ScoringFormulaConfig, CreditRatingGrade, ChecklistAnswer } from '../types';
import { DEFAULT_SCORING_FORMULA_CONFIG } from '../data/seedData';
import { calculateFinancialMetrics, evaluateCreditScore } from '../utils/scoringEngine';
import {
  Sliders,
  Scale,
  Award,
  DollarSign,
  AlertOctagon,
  ShieldAlert,
  Building,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  Info,
  HelpCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingDown,
  Check,
} from 'lucide-react';

export const ScoringFormulaManagement: React.FC = () => {
  const { scoringConfig, updateScoringConfig, resetScoringConfig, currentUser } = useApp();

  // Local draft state for editing
  const [draftConfig, setDraftConfig] = useState<ScoringFormulaConfig>(() => ({
    ...scoringConfig,
  }));

  const [activeSubTab, setActiveSubTab] = useState<'weights' | 'grades' | 'financial' | 'fraud' | 'collateral' | 'simulator'>('weights');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Live Simulator state
  const [simOmzet, setSimOmzet] = useState(40000000);
  const [simHpp, setSimHpp] = useState(24000000);
  const [simBiayaOps, setSimBiayaOps] = useState(4000000);
  const [simKebutuhanRt, setSimKebutuhanRt] = useState(4000000);
  const [simAngsuranLain, setSimAngsuranLain] = useState(0);
  const [simPlafon, setSimPlafon] = useState(30000000);
  const [simTenor, setSimTenor] = useState(12);
  const [simNilaiAgunan, setSimNilaiAgunan] = useState(25000000);
  const [simJenisAgunan, setSimJenisAgunan] = useState<'BPKB Motor' | 'BPKB Mobil' | 'SHM'>('BPKB Motor');
  const [simChecklistScore, setSimChecklistScore] = useState(85);
  const [simRedFlagsCount, setSimRedFlagsCount] = useState(0);

  // Calculate 5C weights sum
  const weightsSum = useMemo(() => {
    const w = draftConfig.weights5C;
    return w.capacity + w.character + w.collateral + w.capital + w.condition;
  }, [draftConfig.weights5C]);

  const isWeightsValid = weightsSum === 100;

  // Auto-normalize 5C weights to exactly 100%
  const handleNormalizeWeights = () => {
    const w = draftConfig.weights5C;
    const currentTotal = w.capacity + w.character + w.collateral + w.capital + w.condition;
    if (currentTotal === 0) return;

    const normCapacity = Math.round((w.capacity / currentTotal) * 100);
    const normCharacter = Math.round((w.character / currentTotal) * 100);
    const normCollateral = Math.round((w.collateral / currentTotal) * 100);
    const normCapital = Math.round((w.capital / currentTotal) * 100);
    const normCondition = 100 - (normCapacity + normCharacter + normCollateral + normCapital);

    setDraftConfig((prev) => ({
      ...prev,
      weights5C: {
        capacity: normCapacity,
        character: normCharacter,
        collateral: normCollateral,
        capital: normCapital,
        condition: normCondition,
      },
    }));
  };

  // Preset profiles
  const applyPreset = (type: 'konservatif' | 'standar' | 'ekspansif') => {
    if (type === 'konservatif') {
      setDraftConfig((prev) => ({
        ...prev,
        policyName: 'Kebijakan Scoring Konservatif & Ketat',
        policyVersion: `v${new Date().getFullYear()}.K-Strict`,
        weights5C: {
          capacity: 35,
          character: 25,
          collateral: 20,
          capital: 10,
          condition: 10,
        },
        gradeThresholds: {
          minScoreGradeA: 85,
          maxDsrGradeA: 30,
          minScoreGradeB: 70,
          maxDsrGradeB: 38,
          minScoreGradeC: 55,
          maxDsrGradeC: 45,
          maxRedFlagsGradeC: 0,
        },
        financialSettings: {
          annualMarginRate: 0.12,
          safeDsrLimit: 30,
          criticalDsrLimit: 40,
          stressTestDropPct: 25,
          safeCashflowMultiplier: 0.55,
        },
        fraudSettings: {
          criticalPenaltyPoints: 20,
          highPenaltyPoints: 12,
          autoRejectRedFlagCount: 1,
        },
      }));
    } else if (type === 'standar') {
      setDraftConfig({
        ...DEFAULT_SCORING_FORMULA_CONFIG,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name,
      });
    } else if (type === 'ekspansif') {
      setDraftConfig((prev) => ({
        ...prev,
        policyName: 'Kebijakan Scoring Pertumbuhan Mikro UMKM',
        policyVersion: `v${new Date().getFullYear()}.UMKM-Growth`,
        weights5C: {
          capacity: 25,
          character: 30,
          collateral: 15,
          capital: 15,
          condition: 15,
        },
        gradeThresholds: {
          minScoreGradeA: 75,
          maxDsrGradeA: 38,
          minScoreGradeB: 60,
          maxDsrGradeB: 45,
          minScoreGradeC: 45,
          maxDsrGradeC: 55,
          maxRedFlagsGradeC: 1,
        },
        financialSettings: {
          annualMarginRate: 0.11,
          safeDsrLimit: 38,
          criticalDsrLimit: 48,
          stressTestDropPct: 15,
          safeCashflowMultiplier: 0.70,
        },
        fraudSettings: {
          criticalPenaltyPoints: 15,
          highPenaltyPoints: 8,
          autoRejectRedFlagCount: 2,
        },
      }));
    }
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightsValid) {
      alert(`Total bobot 5C saat ini adalah ${weightsSum}%. Total harus tepat 100% sebelum disimpan.`);
      return;
    }

    const payload: ScoringFormulaConfig = {
      ...draftConfig,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name || 'Super Administrator',
    };

    updateScoringConfig(payload);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
  };

  // Reset to default factory
  const handleReset = () => {
    if (window.confirm('Kembalikan seluruh rumus scoring, bobot 5C, dan batasan risiko ke standar bawaan lembaga?')) {
      resetScoringConfig();
      setDraftConfig({ ...DEFAULT_SCORING_FORMULA_CONFIG });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 4000);
    }
  };

  // Run simulation using draftConfig
  const simResults = useMemo(() => {
    const financialMetrics = calculateFinancialMetrics(
      simOmzet,
      simHpp,
      simBiayaOps,
      simKebutuhanRt,
      simAngsuranLain,
      simPlafon,
      simTenor,
      draftConfig
    );

    // Mock dummy answers mapped to simChecklistScore & red flags
    const mockAnswers: ChecklistAnswer[] = [
      { questionId: 1, code: 'CHR-01', status: 'sesuai' },
      { questionId: 2, code: 'CHR-02', status: 'sesuai' },
      { questionId: 3, code: 'CAP-01', status: 'sesuai' },
      { questionId: 4, code: 'COL-01', status: 'sesuai' },
      { questionId: 5, code: 'CPT-01', status: 'sesuai' },
      { questionId: 6, code: 'CND-01', status: 'sesuai' },
    ];

    if (simRedFlagsCount > 0) {
      mockAnswers.push({ questionId: 7, code: 'FRD-01', status: 'tidak_sesuai' });
    }
    if (simRedFlagsCount > 1) {
      mockAnswers.push({ questionId: 8, code: 'FRD-02', status: 'tidak_sesuai' });
    }

    const fullFinancial = {
      omzetBulanan: simOmzet,
      biayaHppUsaha: simHpp,
      biayaOperasionalUsaha: simBiayaOps,
      kebutuhanRumahTangga: simKebutuhanRt,
      angsuranLainSaatIni: simAngsuranLain,
      plafonDiajukan: simPlafon,
      tenorBulanDiajukan: simTenor,
      sumberPembayaran: 'Simulasi usaha',
      ...financialMetrics,
    };

    const fullCollateral = {
      jenisJaminan: simJenisAgunan,
      nomorDokumen: 'DOC-SIMULASI-01',
      atasNama: 'Debitur Simulasi',
      hubunganPemilik: 'Calon Kreditur' as const,
      nilaiPasarTaksasi: simNilaiAgunan,
      nilaiLikuidasi: Math.round(simNilaiAgunan * (draftConfig.collateralSettings.haircutLiquidationRate / 100)),
      persentaseLtv: simNilaiAgunan > 0 ? Math.round((simPlafon / simNilaiAgunan) * 100) : 0,
      keterangan: 'Simulasi jaminan',
    };

    const scoring = evaluateCreditScore(mockAnswers, fullFinancial, fullCollateral, undefined, draftConfig);

    return {
      financialMetrics,
      scoring,
      fullCollateral,
    };
  }, [
    simOmzet,
    simHpp,
    simBiayaOps,
    simKebutuhanRt,
    simAngsuranLain,
    simPlafon,
    simTenor,
    simNilaiAgunan,
    simJenisAgunan,
    simChecklistScore,
    simRedFlagsCount,
    draftConfig,
  ]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 backdrop-blur-md relative overflow-hidden shadow-xl">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Sliders className="h-3.5 w-3.5" />
              <span>Pengaturan Lembaga (Super Administrator)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Kustomisasi Rumus & Parameter Skoring Risiko
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Sesuaikan bobot 5C, ambang batas peringkat kelayakan (Grade A-D), batasan DSR, penalti risiko fraud, dan parameter agunan agar selaras dengan profil risiko serta regulasi BMT.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="text-slate-500">Kebijakan:</span> {draftConfig.policyName}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                {draftConfig.policyVersion}
              </span>
              <span>·</span>
              <span className="text-slate-400">
                Terakhir Diperbarui: {new Date(draftConfig.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} oleh {draftConfig.updatedBy}
              </span>
            </div>
          </div>

          {/* Action Buttons & Presets */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!isWeightsValid}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isWeightsValid
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>Simpan Perubahan Rumus</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold text-slate-300">Preset Kebijakan Lembaga:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyPreset('konservatif')}
              className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 font-semibold transition-colors"
            >
              🛡️ Konservatif & Ketat
            </button>
            <button
              type="button"
              onClick={() => applyPreset('standar')}
              className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-semibold transition-colors"
            >
              ⚖️ Standar BMT Dana Insani
            </button>
            <button
              type="button"
              onClick={() => applyPreset('ekspansif')}
              className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-semibold transition-colors"
            >
              🚀 Ekspansif UMKM Mikro
            </button>
          </div>
        </div>

        {/* Save Notice */}
        {saveSuccessNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Perubahan rumus berhasil disimpan ke sistem. Form survey dan evaluasi komite kini menggunakan rumus terbaru.</span>
            </div>
            <button onClick={() => setSaveSuccessNotice(false)} className="text-emerald-400 hover:text-white font-bold ml-2">
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveSubTab('weights')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeSubTab === 'weights'
              ? 'border-emerald-500 bg-slate-900 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>1. Bobot Dimensi 5C</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              isWeightsValid ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30 animate-pulse'
            }`}
          >
            {weightsSum}%
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('grades')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeSubTab === 'grades'
              ? 'border-emerald-500 bg-slate-900 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>2. Ambang Batas Grade (A - D)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('financial')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeSubTab === 'financial'
              ? 'border-emerald-500 bg-slate-900 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>3. Rasio DSR & Keuangan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('fraud')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeSubTab === 'fraud'
              ? 'border-emerald-500 bg-slate-900 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>4. Mitigasi Fraud & Penalti</span>
        </button>

        <button
          onClick={() => setActiveSubTab('collateral')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeSubTab === 'collateral'
              ? 'border-emerald-500 bg-slate-900 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>5. Batasan Agunan & LTV</span>
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeSubTab === 'simulator'
              ? 'border-indigo-500 bg-indigo-950/40 text-indigo-400'
              : 'border-transparent text-indigo-300 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Play className="h-4 w-4 text-indigo-400" />
          <span>🧪 Simulator Rumus</span>
        </button>
      </div>

      {/* Tab 1: Bobot Dimensi 5C */}
      {activeSubTab === 'weights' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-400" />
                  <span>Komposisi Bobot Dimensi 5C (Prinsip Kehati-hatian)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tentukan persentase pengaruh setiap pilar 5C terhadap skor total akhir pembiayaan (Total wajib 100%).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${
                    isWeightsValid
                      ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-950/70 border-rose-500/40 text-rose-400'
                  }`}
                >
                  <span>Total Bobot:</span>
                  <span className="text-sm">{weightsSum}%</span>
                  {isWeightsValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-400 animate-bounce" />
                  )}
                </div>

                {!isWeightsValid && (
                  <button
                    type="button"
                    onClick={handleNormalizeWeights}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                  >
                    Auto-Normalize 100%
                  </button>
                )}
              </div>
            </div>

            {/* Weights Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* 1. Capacity */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Capacity (Kapasitas Kas)</h4>
                    <p className="text-[11px] text-slate-400">Kemampuan bayar riil & rasio DSR</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/20">
                    {draftConfig.weights5C.capacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={draftConfig.weights5C.capacity}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      weights5C: { ...prev.weights5C, capacity: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 leading-tight">
                  Pilar paling krusial untuk memastikan debitur tidak gagal bayar saat angsuran berjalan.
                </p>
              </div>

              {/* 2. Character */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Character (Karakter)</h4>
                    <p className="text-[11px] text-slate-400">Integritas, kejujuran & referensi warga</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/20">
                    {draftConfig.weights5C.character}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={draftConfig.weights5C.character}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      weights5C: { ...prev.weights5C, character: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 leading-tight">
                  Mengevaluasi itikad baik (willingness to pay), kebiasaan hidup, dan rekam jejak lingkungan.
                </p>
              </div>

              {/* 3. Collateral */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Collateral (Agunan / Jaminan)</h4>
                    <p className="text-[11px] text-slate-400">Nilai pasar, likuiditas & legalitas dokumen</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/20">
                    {draftConfig.weights5C.collateral}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={draftConfig.weights5C.collateral}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      weights5C: { ...prev.weights5C, collateral: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 leading-tight">
                  Jaring pengaman sekunder (second way out) bila terjadi force majeure pada usaha debitur.
                </p>
              </div>

              {/* 4. Capital */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Capital (Modal Sendiri)</h4>
                    <p className="text-[11px] text-slate-400">Kekuatan aset bersih & perputaran modal</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/20">
                    {draftConfig.weights5C.capital}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={draftConfig.weights5C.capital}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      weights5C: { ...prev.weights5C, capital: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 leading-tight">
                  Menilai seberapa besar komitmen ekuitas dan cadangan tabungan pribadi debitur.
                </p>
              </div>

              {/* 5. Condition */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Condition (Kondisi Makro)</h4>
                    <p className="text-[11px] text-slate-400">Tren pasar, persaingan & regulasi lokasi</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/20">
                    {draftConfig.weights5C.condition}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={draftConfig.weights5C.condition}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      weights5C: { ...prev.weights5C, condition: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 leading-tight">
                  Ketahanan komoditas dan persaingan lingkungan usaha terhadap perubahan musiman.
                </p>
              </div>
            </div>

            {/* Visual Weight Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Distribusi Visual Bobot 5C</span>
                <span className="font-mono">{weightsSum}% dari 100% target</span>
              </div>
              <div className="h-4 w-full rounded-full bg-slate-800 flex overflow-hidden p-0.5 border border-slate-700">
                <div style={{ width: `${draftConfig.weights5C.capacity}%` }} className="h-full bg-emerald-500 rounded-l-full transition-all" title={`Capacity: ${draftConfig.weights5C.capacity}%`} />
                <div style={{ width: `${draftConfig.weights5C.character}%` }} className="h-full bg-teal-500 transition-all" title={`Character: ${draftConfig.weights5C.character}%`} />
                <div style={{ width: `${draftConfig.weights5C.collateral}%` }} className="h-full bg-sky-500 transition-all" title={`Collateral: ${draftConfig.weights5C.collateral}%`} />
                <div style={{ width: `${draftConfig.weights5C.capital}%` }} className="h-full bg-indigo-500 transition-all" title={`Capital: ${draftConfig.weights5C.capital}%`} />
                <div style={{ width: `${draftConfig.weights5C.condition}%` }} className="h-full bg-purple-500 rounded-r-full transition-all" title={`Condition: ${draftConfig.weights5C.condition}%`} />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Capacity ({draftConfig.weights5C.capacity}%)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Character ({draftConfig.weights5C.character}%)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Collateral ({draftConfig.weights5C.collateral}%)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Capital ({draftConfig.weights5C.capital}%)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Condition ({draftConfig.weights5C.condition}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Ambang Batas Grade (A - D) */}
      {activeSubTab === 'grades' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                <span>Ambang Batas Skor & Penentuan Grade Kelayakan</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Atur kriteria minimum total skor 5C dan batas maksimal DSR untuk setiap level keputusan komite.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Grade A */}
              <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                      GRADE A
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">Sangat Layak (Setujui Penuh)</h4>
                      <p className="text-[11px] text-emerald-300">Fast-track komite, risiko rendah</p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Min. Skor Total 5C (0-100)
                    </label>
                    <input
                      type="number"
                      min="60"
                      max="95"
                      value={draftConfig.gradeThresholds.minScoreGradeA}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          gradeThresholds: { ...prev.gradeThresholds, minScoreGradeA: Number(e.target.value) },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Standar BMT: &ge; 80</p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Maks. DSR Rasio (%)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="50"
                      value={draftConfig.gradeThresholds.maxDsrGradeA}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          gradeThresholds: { ...prev.gradeThresholds, maxDsrGradeA: Number(e.target.value) },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Standar BMT: &le; 35%</p>
                  </div>
                </div>
              </div>

              {/* Grade B */}
              <div className="p-5 rounded-xl border border-sky-500/30 bg-sky-950/20 space-y-4">
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs border border-sky-500/30">
                      GRADE B
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">Layak Bersyarat (Conditional)</h4>
                      <p className="text-[11px] text-sky-300">Setujui dengan mitigasi dokumen/tenor</p>
                    </div>
                  </div>
                  <Info className="h-5 w-5 text-sky-400" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Min. Skor Total 5C (0-100)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="80"
                      value={draftConfig.gradeThresholds.minScoreGradeB}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          gradeThresholds: { ...prev.gradeThresholds, minScoreGradeB: Number(e.target.value) },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Standar BMT: &ge; 65</p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Maks. DSR Rasio (%)
                    </label>
                    <input
                      type="number"
                      min="25"
                      max="55"
                      value={draftConfig.gradeThresholds.maxDsrGradeB}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          gradeThresholds: { ...prev.gradeThresholds, maxDsrGradeB: Number(e.target.value) },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Standar BMT: &le; 42%</p>
                  </div>
                </div>
              </div>

              {/* Grade C */}
              <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
                      GRADE C
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">Perlu Komite Khusus (Review)</h4>
                      <p className="text-[11px] text-amber-300">Penyesuaian plafon atau jaminan tambahan</p>
                    </div>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Min. Skor Total
                    </label>
                    <input
                      type="number"
                      min="40"
                      max="65"
                      value={draftConfig.gradeThresholds.minScoreGradeC}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          gradeThresholds: { ...prev.gradeThresholds, minScoreGradeC: Number(e.target.value) },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Standar: &ge; 50</p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Maks. DSR Rasio (%)
                    </label>
                    <input
                      type="number"
                      min="35"
                      max="65"
                      value={draftConfig.gradeThresholds.maxDsrGradeC}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          gradeThresholds: { ...prev.gradeThresholds, maxDsrGradeC: Number(e.target.value) },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Standar: &le; 50%</p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Maks. Red Flag
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      value={draftConfig.gradeThresholds.maxRedFlagsGradeC}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          gradeThresholds: { ...prev.gradeThresholds, maxRedFlagsGradeC: Number(e.target.value) },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Standar: Max 1</p>
                  </div>
                </div>
              </div>

              {/* Grade D */}
              <div className="p-5 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-4">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30">
                      GRADE D
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">Tidak Layak (Ditolak Langsung)</h4>
                      <p className="text-[11px] text-rose-300">Di bawah batas aman / indikasi fraud</p>
                    </div>
                  </div>
                  <AlertOctagon className="h-5 w-5 text-rose-400" />
                </div>

                <div className="text-xs text-slate-300 space-y-2">
                  <p className="leading-relaxed">
                    Pengajuan otomatis digolongkan sebagai <strong className="text-rose-400">Grade D (Tolak)</strong> apabila memenuhi salah satu kondisi berikut:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li>Total skor 5C di bawah <strong>{draftConfig.gradeThresholds.minScoreGradeC} poin</strong></li>
                    <li>Sisa cashflow bebas per bulan <strong>&le; Rp 0</strong> (defisit)</li>
                    <li>Temuan red flag fraud &ge; <strong>{draftConfig.fraudSettings.autoRejectRedFlagCount} temuan</strong></li>
                    <li>DSR melebihi ambang toleransi kritis</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Rasio DSR & Keuangan */}
      {activeSubTab === 'financial' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <span>Parameter Keuangan, Margin & Perhitungan DSR</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfigurasi suku bunga/margin perhitungan angsuran, batasan aman DSR, serta faktor ketahanan stress test.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Annual Margin */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <label className="block text-xs font-bold text-white">
                  Suku Margin / Nisbah Lembaga (% p.a.)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="35"
                    value={Math.round(draftConfig.financialSettings.annualMarginRate * 100 * 10) / 10}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        financialSettings: {
                          ...prev.financialSettings,
                          annualMarginRate: Number(e.target.value) / 100,
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-mono">% / thn</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Digunakan untuk menghitung estimasi angsuran baru: <br />
                  <code className="text-emerald-400 font-mono">Plafon + (Plafon &times; Margin &times; Tenor/12)</code>
                </p>
              </div>

              {/* Safe DSR Limit */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <label className="block text-xs font-bold text-white">
                  Batas Aman DSR (Debt Service Ratio)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="50"
                    value={draftConfig.financialSettings.safeDsrLimit}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        financialSettings: {
                          ...prev.financialSettings,
                          safeDsrLimit: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-mono">%</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  DSR di bawah angka ini mendapat skor kuantitatif maksimal (skor keuangan 88 - 98 poin).
                </p>
              </div>

              {/* Critical DSR Limit */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <label className="block text-xs font-bold text-white">
                  Batas Kritis DSR (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="30"
                    max="65"
                    value={draftConfig.financialSettings.criticalDsrLimit}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        financialSettings: {
                          ...prev.financialSettings,
                          criticalDsrLimit: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-mono">%</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  DSR melebihi ambang ini memicu penalti berat pada skor kapasitas kas (skor drop ke 20-50).
                </p>
              </div>

              {/* Stress Test Drop Pct */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <label className="block text-xs font-bold text-white">
                  Stress Test: Penurunan Omzet (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="45"
                    value={draftConfig.financialSettings.stressTestDropPct}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        financialSettings: {
                          ...prev.financialSettings,
                          stressTestDropPct: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-mono">% drop</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Simulasi penurunan pendapatan usaha saat kondisi krisis/musim sepi. Jika defisit, skor dikurangi 12 poin.
                </p>
              </div>

              {/* Safe Cashflow Multiplier */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <label className="block text-xs font-bold text-white">
                  Pengali Plafon Aman Cashflow
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0.3"
                    max="0.9"
                    value={draftConfig.financialSettings.safeCashflowMultiplier}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        financialSettings: {
                          ...prev.financialSettings,
                          safeCashflowMultiplier: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-mono">x cashflow</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Maksimal persentase sisa kas bebas yang dialokasikan untuk angsuran rekomendasi (default 65%).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Mitigasi Fraud & Penalti */}
      {activeSubTab === 'fraud' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
                <span>Pengaturan Penalti & Red Flag Indikasi Fraud</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfigurasi pengurangan poin skor dan aturan auto-reject jika surveyor menemukan ketidaksesuaian kritis di lapangan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-3">
                <label className="block text-xs font-bold text-white">
                  Penalti Poin: Temuan Kritis (Critical)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="35"
                    value={draftConfig.fraudSettings.criticalPenaltyPoints}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        fraudSettings: {
                          ...prev.fraudSettings,
                          criticalPenaltyPoints: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                  />
                  <span className="text-xs text-rose-400 font-mono font-bold">Poin</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Contoh: NIK tidak terdaftar, usaha fiktif, agunan ganda. Skor total dipotong per temuan kritis.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-3">
                <label className="block text-xs font-bold text-white">
                  Penalti Poin: Temuan Tinggi (High)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={draftConfig.fraudSettings.highPenaltyPoints}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        fraudSettings: {
                          ...prev.fraudSettings,
                          highPenaltyPoints: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                  />
                  <span className="text-xs text-amber-400 font-mono font-bold">Poin</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Contoh: Rekening koran tidak sinkron, omzet fisik berbeda signifikan dari klaim awal.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <label className="block text-xs font-bold text-white">
                  Ambang Auto-Reject (Batas Temuan)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={draftConfig.fraudSettings.autoRejectRedFlagCount}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        fraudSettings: {
                          ...prev.fraudSettings,
                          autoRejectRedFlagCount: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                  />
                  <span className="text-xs text-slate-300 font-mono font-bold">Temuan</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Bila ditemukan red flag &ge; angka ini, aplikasi otomatis ditolak (Grade D) tanpa memandang skor keuangan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Batasan Agunan & LTV */}
      {activeSubTab === 'collateral' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-400" />
                <span>Plafon Agunan Maksimal (LTV) & Faktor Likuidasi</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Maksimal Loan-to-Value (LTV) berdasarkan jenis sertifikat / bukti kepemilikan agunan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* SHM */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">SHM (Sertifikat Hak Milik)</span>
                  <span className="text-emerald-400 font-mono font-bold">{draftConfig.collateralSettings.shmMaxLtv}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={draftConfig.collateralSettings.shmMaxLtv}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      collateralSettings: { ...prev.collateralSettings, shmMaxLtv: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500">Kategori legalitas tertinggi & risiko terendah</p>
              </div>

              {/* BPKB Mobil */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">BPKB Mobil / Roda 4</span>
                  <span className="text-emerald-400 font-mono font-bold">{draftConfig.collateralSettings.bpkbMobilMaxLtv}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="85"
                  value={draftConfig.collateralSettings.bpkbMobilMaxLtv}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      collateralSettings: { ...prev.collateralSettings, bpkbMobilMaxLtv: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500">Maksimal taksasi kendaraan operasional</p>
              </div>

              {/* BPKB Motor */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">BPKB Motor / Roda 2</span>
                  <span className="text-emerald-400 font-mono font-bold">{draftConfig.collateralSettings.bpkbMotorMaxLtv}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="80"
                  value={draftConfig.collateralSettings.bpkbMotorMaxLtv}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      collateralSettings: { ...prev.collateralSettings, bpkbMotorMaxLtv: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500">Depresiasi kendaraan cepat</p>
              </div>

              {/* AJB */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">AJB / Girik / Adat</span>
                  <span className="text-emerald-400 font-mono font-bold">{draftConfig.collateralSettings.ajbMaxLtv}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="75"
                  value={draftConfig.collateralSettings.ajbMaxLtv}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      collateralSettings: { ...prev.collateralSettings, ajbMaxLtv: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500">Perlu surat keterangan bebas sengketa lurah</p>
              </div>

              {/* Deposito */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Deposito / Tabungan BMT</span>
                  <span className="text-emerald-400 font-mono font-bold">{draftConfig.collateralSettings.depositoMaxLtv}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="100"
                  value={draftConfig.collateralSettings.depositoMaxLtv}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      collateralSettings: { ...prev.collateralSettings, depositoMaxLtv: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500">Cash collateral (risiko likuiditas nol)</p>
              </div>

              {/* Haircut */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Nilai Likuidasi Cepat (%)</span>
                  <span className="text-amber-400 font-mono font-bold">{draftConfig.collateralSettings.haircutLiquidationRate}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={draftConfig.collateralSettings.haircutLiquidationRate}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      collateralSettings: { ...prev.collateralSettings, haircutLiquidationRate: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-slate-500">Perkiraan harga jual paksa saat eksekusi lelang</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Simulator Rumus Interaktif */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-5 sm:p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-2">
                <Play className="h-3.5 w-3.5" />
                <span>Sandbox Evaluasi Rumus Real-Time</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Simulator Kalkulasi Kasus Calon Debitur
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Uji langsung bagaimana rumus yang sedang Anda atur mengevaluasi kasus sampel debitur sebelum diterapkan ke seluruh cabang.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Sample Inputs */}
              <div className="lg:col-span-6 space-y-4 text-xs">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
                  Input Sampel Calon Debitur
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Omzet Bulanan (Rp)</label>
                    <input
                      type="number"
                      step="1000000"
                      value={simOmzet}
                      onChange={(e) => setSimOmzet(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">HPP Usaha (Rp)</label>
                    <input
                      type="number"
                      step="1000000"
                      value={simHpp}
                      onChange={(e) => setSimHpp(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Biaya Operasional (Rp)</label>
                    <input
                      type="number"
                      step="500000"
                      value={simBiayaOps}
                      onChange={(e) => setSimBiayaOps(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kebutuhan Rumah Tangga (Rp)</label>
                    <input
                      type="number"
                      step="500000"
                      value={simKebutuhanRt}
                      onChange={(e) => setSimKebutuhanRt(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Plafon Diajukan (Rp)</label>
                    <input
                      type="number"
                      step="1000000"
                      value={simPlafon}
                      onChange={(e) => setSimPlafon(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tenor (Bulan)</label>
                    <input
                      type="number"
                      min="3"
                      max="60"
                      value={simTenor}
                      onChange={(e) => setSimTenor(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Taksasi Nilai Pasar Agunan (Rp)</label>
                    <input
                      type="number"
                      step="1000000"
                      value={simNilaiAgunan}
                      onChange={(e) => setSimNilaiAgunan(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Jumlah Red Flag Terdeteksi</label>
                    <select
                      value={simRedFlagsCount}
                      onChange={(e) => setSimRedFlagsCount(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    >
                      <option value="0">0 (Bersih / Tidak ada temuan)</option>
                      <option value="1">1 Temuan Red Flag</option>
                      <option value="2">2 Temuan (Ambang Auto-Reject)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Output based on Custom Formula */}
              <div className="lg:col-span-6 rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span>Hasil Skoring & Rekomendasi Rumus</span>
                  </h4>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black border ${
                      simResults.scoring.ratingGrade.startsWith('A')
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                        : simResults.scoring.ratingGrade.startsWith('B')
                        ? 'bg-sky-950 text-sky-400 border-sky-500/40'
                        : simResults.scoring.ratingGrade.startsWith('C')
                        ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                        : 'bg-rose-950 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {simResults.scoring.ratingGrade}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Total Skor 5C</span>
                    <span className="text-xl font-black text-white font-mono">
                      {simResults.scoring.totalScore}
                      <span className="text-xs text-slate-500 font-normal"> / 100</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Rasio DSR Aktual</span>
                    <span
                      className={`text-xl font-black font-mono ${
                        simResults.financialMetrics.dsrRatio <= draftConfig.financialSettings.safeDsrLimit
                          ? 'text-emerald-400'
                          : simResults.financialMetrics.dsrRatio <= draftConfig.financialSettings.criticalDsrLimit
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {simResults.financialMetrics.dsrRatio}%
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Rasio Agunan (LTV)</span>
                    <span className="text-xl font-black text-white font-mono">
                      {simResults.fullCollateral.persentaseLtv}%
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Est. Angsuran / Bln</span>
                    <span className="text-xs font-bold text-white font-mono">
                      Rp {simResults.financialMetrics.estimasiAngsuranDiajukan.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Cashflow Bebas</span>
                    <span
                      className={`text-xs font-bold font-mono ${
                        simResults.financialMetrics.availableCashflow > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      Rp {simResults.financialMetrics.availableCashflow.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Rekomendasi Plafon</span>
                    <span className="text-xs font-bold text-indigo-400 font-mono">
                      Rp {simResults.scoring.plafonDisarankan.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Keputusan Rekomendasi Sistem:
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        simResults.scoring.recommendation === 'SETUJUI_PENUH'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : simResults.scoring.recommendation === 'SETUJUI_DENGAN_SYARAT'
                          ? 'bg-sky-500/20 text-sky-400'
                          : simResults.scoring.recommendation === 'TINJAUAN_KOMITE'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {simResults.scoring.recommendation}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed italic">
                    "{simResults.scoring.summaryRemarks}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
