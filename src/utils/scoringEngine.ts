import {
  ChecklistAnswer,
  FinancialCapacityData,
  CollateralData,
  ScoringResult,
  FraudEvaluation,
  CreditRatingGrade,
  ScoringFormulaConfig,
} from '../types';
import { SURVEY_QUESTIONS, QuestionDefinition } from '../data/surveyQuestions';
import { DEFAULT_SCORING_FORMULA_CONFIG } from '../data/seedData';

export function calculateFinancialMetrics(
  omzet: number,
  biayaHpp: number,
  biayaOperasional: number,
  kebutuhanRt: number,
  angsuranLain: number,
  plafonDiajukan: number,
  tenorBulan: number,
  config?: ScoringFormulaConfig,
  customBasilPct?: number,
  customNominalAngsuran?: number
): {
  pendapatanKotor: number;
  labaUsahaBersih: number;
  availableCashflow: number;
  dsrRatio: number;
  stressTestCashflow: number;
  estimasiAngsuranDiajukan: number;
  plafonRekomendasiMaksimal: number;
  persentaseBasil: number;
  nominalAngsuran: number;
  totalBagiHasil: number;
  totalKewajiban: number;
} {
  const cfg = config || DEFAULT_SCORING_FORMULA_CONFIG;
  const pendapatanKotor = Math.max(0, omzet);
  const totalBiayaUsaha = Math.max(0, biayaHpp) + Math.max(0, biayaOperasional);
  const labaUsahaBersih = Math.max(0, pendapatanKotor - totalBiayaUsaha);
  
  // Available Cashflow = Laba Usaha Bersih - Kebutuhan RT - Angsuran Lain saat ini
  const availableCashflow = labaUsahaBersih - Math.max(0, kebutuhanRt) - Math.max(0, angsuranLain);

  // Tenor dan margin bagi hasil tahunan (default dari konfigurasi jika tidak diset manual)
  const tenor = Math.max(1, tenorBulan);
  const marginPerTahun =
    customBasilPct !== undefined && !isNaN(customBasilPct) && customBasilPct >= 0
      ? customBasilPct / 100
      : cfg.financialSettings.annualMarginRate;
  const persentaseBasil = Math.round(marginPerTahun * 10000) / 100;

  // Perhitungan total margin/bagi hasil dan total kewajiban
  const totalBagiHasil = Math.round(plafonDiajukan * (marginPerTahun * (tenor / 12)));
  const totalKewajiban = plafonDiajukan + totalBagiHasil;
  const angsuranDihitung = Math.round(totalKewajiban / tenor);

  // Nominal angsuran: jika ada input nominal manual > 0 gunakan itu, jika tidak gunakan angsuran dari rumus basil
  const nominalAngsuran =
    customNominalAngsuran !== undefined && !isNaN(customNominalAngsuran) && customNominalAngsuran > 0
      ? Math.round(customNominalAngsuran)
      : angsuranDihitung;

  const estimasiAngsuranDiajukan = nominalAngsuran;

  // Total angsuran (angsuran lama + angsuran baru yang dievaluasi)
  const totalSemuaAngsuran = angsuranLain + estimasiAngsuranDiajukan;
  
  // DSR = Total Semua Angsuran / Laba Usaha Bersih (%)
  const dsrRatio = labaUsahaBersih > 0 ? Math.round((totalSemuaAngsuran / labaUsahaBersih) * 100) : 100;

  // Stress test: skenario penurunan omzet berbasis konfigurasi (default 20%)
  const dropPct = cfg.financialSettings.stressTestDropPct / 100;
  const omzetStress = pendapatanKotor * (1 - dropPct);
  const labaUsahaStress = Math.max(0, omzetStress - totalBiayaUsaha);
  const stressTestCashflow = labaUsahaStress - kebutuhanRt - totalSemuaAngsuran;

  // Recommended safe loan ceiling based on safe multiplier of available cashflow (default 65%)
  const multiplier = cfg.financialSettings.safeCashflowMultiplier;
  const angsuranMaksimalAman = Math.max(0, availableCashflow * multiplier);
  const plafonRekomendasiMaksimal = Math.round((angsuranMaksimalAman * tenor) / (1 + marginPerTahun * (tenor / 12)));

  return {
    pendapatanKotor,
    labaUsahaBersih,
    availableCashflow,
    dsrRatio,
    stressTestCashflow,
    estimasiAngsuranDiajukan,
    plafonRekomendasiMaksimal,
    persentaseBasil,
    nominalAngsuran,
    totalBagiHasil,
    totalKewajiban,
  };
}

export function evaluateCreditScore(
  answers: ChecklistAnswer[],
  financial: FinancialCapacityData,
  collateral: CollateralData,
  customQuestions?: QuestionDefinition[],
  config?: ScoringFormulaConfig
): ScoringResult {
  const cfg = config || DEFAULT_SCORING_FORMULA_CONFIG;
  const activeQuestions = (customQuestions || SURVEY_QUESTIONS).filter((q) => q.isActive !== false);
  const answerMap = new Map<number, ChecklistAnswer>();
  answers.forEach((ans) => answerMap.set(ans.questionId, ans));

  // 1. Group questions by 5C dimension
  const getDimensionScore = (dimension: QuestionDefinition['dimension5C']) => {
    const relevantQuestions = activeQuestions.filter((q) => q.dimension5C === dimension);
    if (relevantQuestions.length === 0) return 80;

    let pointsEarned = 0;
    let totalPossible = 0;

    relevantQuestions.forEach((q) => {
      const weight = q.criticality === 'critical' ? 3 : q.criticality === 'high' ? 2 : 1;
      totalPossible += weight * 100;

      const ans = answerMap.get(q.id);
      if (!ans) {
        pointsEarned += weight * 70; // default neutral if unselected
      } else if (ans.status === 'sesuai') {
        pointsEarned += weight * 100;
      } else if (ans.status === 'cukup') {
        pointsEarned += weight * 60;
      } else if (ans.status === 'tidak_sesuai') {
        pointsEarned += weight * 10;
      } else if (ans.status === 'na') {
        pointsEarned += weight * 80;
      }
    });

    return totalPossible > 0 ? Math.round((pointsEarned / totalPossible) * 100) : 80;
  };

  // Base 5C scores from checklist responses
  let characterScore = getDimensionScore('Character');
  let capacityChecklistScore = getDimensionScore('Capacity');
  let capitalScore = getDimensionScore('Capital');
  let collateralChecklistScore = getDimensionScore('Collateral');
  let conditionScore = getDimensionScore('Condition');

  // 2. Quantitative Financial Capacity Adjustments (DSR & Cashflow Buffer)
  let financialQuantitativeScore = 75;
  const safeDsr = cfg.financialSettings.safeDsrLimit;
  const critDsr = cfg.financialSettings.criticalDsrLimit;

  if (financial.dsrRatio <= Math.round(safeDsr * 0.7)) {
    financialQuantitativeScore = 98;
  } else if (financial.dsrRatio <= safeDsr) {
    financialQuantitativeScore = 88;
  } else if (financial.dsrRatio <= critDsr) {
    financialQuantitativeScore = 70;
  } else if (financial.dsrRatio <= critDsr + 8) {
    financialQuantitativeScore = 52;
  } else {
    financialQuantitativeScore = 20; // High debt burden
  }

  // Cashflow buffer penalty / reward
  if (financial.availableCashflow <= 0) {
    financialQuantitativeScore = Math.min(financialQuantitativeScore, 25);
  } else if (financial.stressTestCashflow < 0) {
    financialQuantitativeScore -= 12;
  } else {
    financialQuantitativeScore = Math.min(100, financialQuantitativeScore + 5);
  }

  // Blended Capacity Score: 50% checklist + 50% quantitative financial math
  const capacityScore = Math.round(capacityChecklistScore * 0.45 + financialQuantitativeScore * 0.55);

  // 3. Quantitative Collateral Adjustment (LTV)
  let collateralScore = collateralChecklistScore;
  if (collateral.nilaiPasarTaksasi > 0) {
    const ltv = (financial.plafonDiajukan / collateral.nilaiPasarTaksasi) * 100;
    if (ltv <= 50) {
      collateralScore = Math.round(collateralChecklistScore * 0.5 + 50);
    } else if (ltv <= 70) {
      collateralScore = Math.round(collateralChecklistScore * 0.5 + 45);
    } else if (ltv <= 85) {
      collateralScore = Math.round(collateralChecklistScore * 0.5 + 35);
    } else if (ltv <= 100) {
      collateralScore = Math.round(collateralChecklistScore * 0.5 + 25);
    } else {
      collateralScore = Math.round(collateralChecklistScore * 0.5 + 10); // Under-collateralized
    }
  }

  // 4. Fraud Red Flag Detection & Custom Penalties
  const redFlagQuestions = SURVEY_QUESTIONS.filter((q) => q.isRedFlagTrigger);
  const detectedFlags: string[] = [];
  let fraudDeduction = 0;

  redFlagQuestions.forEach((q) => {
    const ans = answerMap.get(q.id);
    if (ans && ans.status === 'tidak_sesuai') {
      detectedFlags.push(`[${q.code}] ${q.question}`);
      fraudDeduction += q.criticality === 'critical' ? cfg.fraudSettings.criticalPenaltyPoints : cfg.fraudSettings.highPenaltyPoints;
    }
  });

  // Calculate Weighted Total Score (0 - 100) using custom 5C weights
  const w = cfg.weights5C;
  const totalWeight = (w.capacity + w.character + w.collateral + w.capital + w.condition) || 100;
  let rawWeightedScore =
    (capacityScore * w.capacity +
      characterScore * w.character +
      collateralScore * w.collateral +
      capitalScore * w.capital +
      conditionScore * w.condition) /
    totalWeight;

  let totalScore = Math.max(0, Math.min(100, Math.round(rawWeightedScore - fraudDeduction)));

  // 5. Determine Rating Grade & Recommendation using Configurable Thresholds
  let ratingGrade: CreditRatingGrade;
  let recommendation: ScoringResult['recommendation'];
  let summaryRemarks = '';

  const criticalRedFlagsCount = detectedFlags.length;
  const gt = cfg.gradeThresholds;

  if (
    criticalRedFlagsCount >= cfg.fraudSettings.autoRejectRedFlagCount ||
    totalScore < gt.minScoreGradeC ||
    financial.availableCashflow <= 0
  ) {
    ratingGrade = 'D (Tidak Layak/Ditolak)';
    recommendation = 'TOLAK';
    summaryRemarks =
      criticalRedFlagsCount >= cfg.fraudSettings.autoRejectRedFlagCount
        ? `Ditolak karena terdeteksi ${criticalRedFlagsCount} indikasi risiko fraud kritis pada proses survey (Maksimal diperbolehkan: ${cfg.fraudSettings.autoRejectRedFlagCount - 1}).`
        : totalScore < gt.minScoreGradeC
        ? `Ditolak karena total skor 5C (${totalScore}) berada di bawah ambang batas minimal Grade C (${gt.minScoreGradeC}).`
        : 'Ditolak karena kapasitas kas bersih (cashflow) defisit untuk angsuran.';
  } else if (
    criticalRedFlagsCount > gt.maxRedFlagsGradeC ||
    totalScore < gt.minScoreGradeB ||
    financial.dsrRatio > gt.maxDsrGradeC
  ) {
    ratingGrade = 'C (Perlu Komite Khusus)';
    recommendation = 'TINJAUAN_KOMITE';
    summaryRemarks =
      'Membutuhkan persetujuan khusus Komite Pembiayaan. Plafon wajib disesuaikan dengan kapasitas riil atau jaminan tambahan.';
  } else if (
    totalScore < gt.minScoreGradeA ||
    financial.dsrRatio > gt.maxDsrGradeB
  ) {
    ratingGrade = 'B (Layak Bersyarat)';
    recommendation = 'SETUJUI_DENGAN_SYARAT';
    summaryRemarks =
      'Layak untuk disetujui dengan mitigasi syarat dokumen, pemenuhan pengikatan agunan, atau penyesuaian tenor.';
  } else {
    ratingGrade = 'A (Sangat Layak)';
    recommendation = 'SETUJUI_PENUH';
    summaryRemarks =
      'Profil risiko sangat baik. Karakter kooperatif, kapasitas cashflow sehat, dan rasio jaminan mencukupi.';
  }

  // 6. Plafon & Tenor Disarankan
  let plafonDisarankan = financial.plafonDiajukan;
  let tenorDisarankan = financial.tenorBulanDiajukan;

  if (recommendation === 'TOLAK') {
    plafonDisarankan = 0;
    tenorDisarankan = 0;
  } else if (recommendation === 'TINJAUAN_KOMITE') {
    // Recommend safe ceiling or 70% of requested
    const haircutFactor = cfg.collateralSettings.haircutLiquidationRate / 100;
    plafonDisarankan = Math.min(
      financial.plafonDiajukan * 0.7,
      financial.plafonRekomendasiMaksimal,
      collateral.nilaiLikuidasi > 0 ? collateral.nilaiLikuidasi * haircutFactor : financial.plafonDiajukan
    );
    plafonDisarankan = Math.round(plafonDisarankan / 500000) * 500000;
  } else if (recommendation === 'SETUJUI_DENGAN_SYARAT') {
    plafonDisarankan = Math.min(
      financial.plafonDiajukan,
      financial.plafonRekomendasiMaksimal,
      collateral.nilaiPasarTaksasi > 0 ? collateral.nilaiPasarTaksasi * 0.8 : financial.plafonDiajukan
    );
    plafonDisarankan = Math.round(plafonDisarankan / 500000) * 500000;
  }

  // 7. Qualitative Highlights (Kekuatan & Risiko Kunci & Mitigasi)
  const kekuatanKredit: string[] = [];
  const risikoKunci: string[] = [];
  const mitigasiUtama: string[] = [];

  if (characterScore >= 80) kekuatanKredit.push('Riwayat pembayaran dan reputasi debitur konsisten & terbuka.');
  if (financial.dsrRatio <= cfg.financialSettings.safeDsrLimit) kekuatanKredit.push(`Beban hutang relatif aman (DSR ${financial.dsrRatio}% <= Batas Aman ${cfg.financialSettings.safeDsrLimit}%).`);
  if (financial.availableCashflow > 3000000) kekuatanKredit.push('Sisa cashflow bulanan mencukupi untuk angsuran.');
  if (collateralScore >= 80) kekuatanKredit.push('Agunan memiliki bukti kepemilikan sah & nilai pasar memadai.');

  if (financial.dsrRatio > cfg.financialSettings.criticalDsrLimit) risikoKunci.push(`Rasio angsuran terhadap pendapatan tinggi (${financial.dsrRatio}% > Batas Kritis ${cfg.financialSettings.criticalDsrLimit}%).`);
  if (financial.stressTestCashflow < 0) risikoKunci.push(`Uji ketahanan penurunan omzet ${cfg.financialSettings.stressTestDropPct}% menunjukkan potensi defisit kas.`);
  if (detectedFlags.length > 0) risikoKunci.push(`Terdapat ${detectedFlags.length} indikator Fraud Red Flag terdeteksi.`);
  if (collateralScore < 60) risikoKunci.push('Kualitas atau likuiditas jaminan perlu verifikasi tambahan.');

  if (detectedFlags.length > 0) mitigasiUtama.push('Wajib konfirmasi rekening atas nama sendiri sebelum pencairan.');
  if (financial.dsrRatio > 35) mitigasiUtama.push('Pemberlakuan autodebet tabungan atau tanggal angsuran disesuaikan siklus kas.');
  if (collateral.jenisJaminan) mitigasiUtama.push(`Pengikatan jaminan resmi (${collateral.jenisJaminan}) secara sempurna.`);
  mitigasiUtama.push('Monitoring berkala oleh marketing minimal 1x setiap 2 bulan.');

  return {
    totalScore,
    characterScore,
    capacityScore,
    capitalScore,
    collateralScore,
    conditionScore,
    fraudDeduction,
    ratingGrade,
    recommendation,
    summaryRemarks,
    plafonDisarankan,
    tenorDisarankan,
    mitigasiUtama,
    kekuatanKredit,
    risikoKunci,
  };
}

export function detectFraudRedFlags(
  answers: ChecklistAnswer[],
  customQuestions?: QuestionDefinition[]
): FraudEvaluation {
  const activeQuestions = (customQuestions || SURVEY_QUESTIONS).filter((q) => q.isActive !== false);
  const answerMap = new Map<number, ChecklistAnswer>();
  answers.forEach((ans) => answerMap.set(ans.questionId, ans));

  const detectedFlags: string[] = [];
  const redFlagQuestions = activeQuestions.filter((q) => q.isRedFlagTrigger);

  redFlagQuestions.forEach((q) => {
    const ans = answerMap.get(q.id);
    if (ans && ans.status === 'tidak_sesuai') {
      detectedFlags.push(`[${q.code}] ${q.question}`);
    }
  });

  const count = detectedFlags.length;
  let riskSeverity: FraudEvaluation['riskSeverity'] = 'low';

  if (count >= 3) {
    riskSeverity = 'critical';
  } else if (count >= 2) {
    riskSeverity = 'high';
  } else if (count === 1) {
    riskSeverity = 'medium';
  }

  return {
    hasRedFlags: count > 0,
    detectedFlags,
    riskSeverity,
  };
}
