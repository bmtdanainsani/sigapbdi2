import React from 'react';
import { useApp } from '../context/AppContext';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import { Printer, X, AlertTriangle } from 'lucide-react';

export const PrintableReport: React.FC = () => {
  const { selectedApplication, isPrintReportOpen, setIsPrintReportOpen, currentUser, appSettings } = useApp();

  if (!isPrintReportOpen || !selectedApplication) return null;

  const app = selectedApplication;

  // Account Officer Ownership Guard
  if (
    currentUser.role === 'marketing' &&
    app.marketingId !== currentUser.id &&
    app.marketingName !== currentUser.name
  ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
        <div className="rounded-2xl border border-rose-500/40 bg-slate-900 p-6 max-w-md w-full text-center shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-400 mx-auto mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Cetak Berkas Dibatasi</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Anda hanya diizinkan mencetak laporan survey atas nasabah yang Anda input sendiri.
          </p>
          <button
            onClick={() => setIsPrintReportOpen(false)}
            className="mt-5 w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const answerMap = new Map(app.checklistAnswers.map((a) => [a.questionId, a]));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-xs flex flex-col items-center p-4 sm:p-8">
      {/* Top Floating Action Bar (hidden in print) */}
      <div className="no-print w-full max-w-4xl mb-4 flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800 p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">
            Pratinjau Cetak / PDF: {app.applicationNumber}
          </span>
          <span className="text-xs text-slate-400">({app.namaDebitur})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak / Simpan PDF Sekarang</span>
          </button>
          <button
            onClick={() => setIsPrintReportOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* The Printable Document Paper (White Sheet) */}
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-lg shadow-2xl p-8 sm:p-12 print:p-0 print:shadow-none print:w-full print:max-w-none text-xs leading-relaxed font-sans">
        {/* Kop Surat Resmi */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                {appSettings.printHeaderTitle || appSettings.institutionName || 'BMT DANA INSANI - DIVISI MANAJEMEN RISIKO'}
              </h1>
              <p className="text-[11px] text-slate-600 font-medium">
                {appSettings.printHeaderSubtitle || 'LEMBAR HASIL SURVEY MARKETING & REKOMENDASI CREDIT SCORING 5C'}
              </p>
              <p className="text-[10px] text-slate-500">
                {appSettings.institutionAddress || 'Operasional Pembiayaan Mikro & UKM'} {appSettings.institutionPhone ? `· Telp: ${appSettings.institutionPhone}` : ''}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold px-2.5 py-1 border border-slate-400 rounded">
                {app.applicationNumber}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Tgl Survey: {app.evidence.tanggalSurvey || new Date(app.createdAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* 1. Identitas Debitur & Fasilitas Pembiayaan */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2">
            I. IDENTITAS CALON DEBITUR & FASILITAS YANG DIAJUKAN
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
            <div>
              <span className="text-slate-500 w-36 inline-block">Nama Debitur:</span>
              <strong className="text-slate-900">{app.namaDebitur}</strong>
            </div>
            <div>
              <span className="text-slate-500 w-36 inline-block">Plafon Diajukan:</span>
              <strong className="font-mono text-slate-900">Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}</strong>
            </div>
            <div>
              <span className="text-slate-500 w-36 inline-block">Nomor KTP (NIK):</span>
              <span className="font-mono text-slate-800">{app.nik}</span>
            </div>
            <div>
              <span className="text-slate-500 w-36 inline-block">Nomor Kartu Keluarga:</span>
              <span className="font-mono text-slate-800">{app.noKk}</span>
            </div>
            <div>
              <span className="text-slate-500 w-36 inline-block">Tenor Pengajuan:</span>
              <span className="font-mono text-slate-800">{app.financial.tenorBulanDiajukan} Bulan</span>
            </div>
            <div>
              <span className="text-slate-500 w-36 inline-block">No. Telepon / WhatsApp:</span>
              <span className="font-mono text-slate-800">{app.noHp}</span>
            </div>
            <div>
              <span className="text-slate-500 w-36 inline-block">Tujuan Pembiayaan:</span>
              <span className="text-slate-800">Modal Kerja & Operasional Usaha</span>
            </div>
            <div>
              <span className="text-slate-500 w-36 inline-block">Bidang Usaha:</span>
              <span className="text-slate-800">{app.jenisUsaha} ({app.lamaUsahaBulan} bln)</span>
            </div>
            <div>
              <span className="text-slate-500 w-36 inline-block">Status Pernikahan:</span>
              <span className="text-slate-800">{app.statusPernikahan} {app.namaPasangan ? `(Pasangan: ${app.namaPasangan})` : ''}</span>
            </div>
            <div>
              <span className="text-slate-500 w-36 inline-block">Status e-KTP Debitur:</span>
              <span className={`font-semibold ${app.evidence.fotoKtpStatus === 'fotocopy' ? 'text-amber-700' : 'text-emerald-700'}`}>
                {app.evidence.fotoKtpStatus === 'fotocopy' ? 'Fotocopy / Cetak Kertas' : 'e-KTP Fisik Asli'}
              </span>
              {app.evidence.fotoKtpStatus === 'fotocopy' && app.evidence.fotoKtpCatatanSurveyor && (
                <p className="text-[10px] text-amber-900 mt-0.5 italic">
                  Catatan AO: "{app.evidence.fotoKtpCatatanSurveyor}"
                </p>
              )}
            </div>
            {app.evidence.fotoKtpPendamping && (
              <div>
                <span className="text-slate-500 w-36 inline-block">
                  KTP {app.evidence.fotoKtpPendampingLabel || (app.statusPernikahan === 'Menikah' ? 'Istri / Pasangan' : 'Orang Tua')}:
                </span>
                <span className={`font-semibold ${app.evidence.fotoKtpPendampingStatus === 'fotocopy' ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {app.evidence.fotoKtpPendampingStatus === 'fotocopy' ? 'Fotocopy / Cetak Kertas' : 'e-KTP Fisik Asli'}
                </span>
                {app.evidence.fotoKtpPendampingStatus === 'fotocopy' && app.evidence.fotoKtpPendampingCatatanSurveyor && (
                  <p className="text-[10px] text-amber-900 mt-0.5 italic">
                    Catatan AO: "{app.evidence.fotoKtpPendampingCatatanSurveyor}"
                  </p>
                )}
              </div>
            )}
            <div className="col-span-2">
              <span className="text-slate-500 w-36 inline-block">Alamat Domisili Survey:</span>
              <span className="text-slate-800">{app.alamatDomisili}</span>
            </div>
          </div>
        </div>

        {/* 2. Analisis Kapasitas Keuangan & DSR */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2">
            II. ANALISIS KAPASITAS KEUANGAN, BAGI HASIL & CASHFLOW (CAPACITY)
          </h2>
          <div className="grid grid-cols-4 gap-2 mb-2 p-2 bg-slate-50 border border-slate-200 rounded text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">Plafon Pokok:</span>
              <strong className="font-mono text-slate-900">Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Bagi Hasil ({app.financial.persentaseBasil ?? 12}% p.a.):</span>
              <strong className="font-mono text-slate-900">Rp {(app.financial.totalBagiHasil ?? Math.round(app.financial.plafonDiajukan * (((app.financial.persentaseBasil ?? 12) / 100) * (app.financial.tenorBulanDiajukan / 12)))).toLocaleString('id-ID')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Total Kewajiban:</span>
              <strong className="font-mono text-slate-900">Rp {(app.financial.totalKewajiban ?? (app.financial.plafonDiajukan + (app.financial.totalBagiHasil ?? 0))).toLocaleString('id-ID')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Nominal Angsuran:</span>
              <strong className="font-mono text-emerald-700">Rp {(app.financial.nominalAngsuran || app.financial.estimasiAngsuranDiajukan).toLocaleString('id-ID')}/bln</strong>
            </div>
          </div>
          <table className="w-full text-left text-[11px] border border-slate-300 mb-2">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300">
                <th className="p-1.5">Omzet Bulanan</th>
                <th className="p-1.5">Biaya Usaha Total</th>
                <th className="p-1.5">Biaya Rumah Tangga</th>
                <th className="p-1.5">Hutang Lain</th>
                <th className="p-1.5 font-bold">Available Cashflow</th>
                <th className="p-1.5 font-bold">Rasio DSR</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1.5 font-mono">Rp {app.financial.omzetBulanan.toLocaleString('id-ID')}</td>
                <td className="p-1.5 font-mono">Rp {(app.financial.biayaHppUsaha + app.financial.biayaOperasionalUsaha).toLocaleString('id-ID')}</td>
                <td className="p-1.5 font-mono">Rp {app.financial.kebutuhanRumahTangga.toLocaleString('id-ID')}</td>
                <td className="p-1.5 font-mono">Rp {app.financial.angsuranLainSaatIni.toLocaleString('id-ID')}</td>
                <td className="p-1.5 font-mono font-bold text-slate-900">Rp {app.financial.availableCashflow.toLocaleString('id-ID')}</td>
                <td className="p-1.5 font-mono font-bold text-slate-900">{app.financial.dsrRatio}%</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-slate-600">
            Sumber Pembayaran Angsuran: <em>{app.financial.sumberPembayaran}</em>. Hasil Stress Test penurunan pendapatan 20%: Sisa kas tetap <strong>Rp {app.financial.stressTestCashflow.toLocaleString('id-ID')}</strong>.
          </p>
        </div>

        {/* 3. Agunan & Jaminan */}
        <div className="mb-6">
          <div className="flex items-center justify-between bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider">
              III. ANALISIS JAMINAN & AGUNAN (COLLATERAL)
            </h2>
            <span className="text-[10px] font-mono text-slate-600 font-bold">
              Total {app.collaterals?.length || 1} Agunan Terdaftar
            </span>
          </div>

          {app.collaterals && app.collaterals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] border border-slate-300 mb-2">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                    <th className="p-1.5 w-6 text-center">No</th>
                    <th className="p-1.5">Jenis Agunan</th>
                    <th className="p-1.5">Bukti Kepemilikan</th>
                    <th className="p-1.5">Atas Nama / Hub</th>
                    <th className="p-1.5 text-right">Taksasi Pasar</th>
                    <th className="p-1.5 text-right">Nilai Likuidasi</th>
                    <th className="p-1.5">Deskripsi / Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {app.collaterals.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-slate-50">
                      <td className="p-1.5 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="p-1.5 font-semibold text-slate-900">{c.jenisJaminan}</td>
                      <td className="p-1.5 font-mono text-slate-800">{c.nomorDokumen || '-'}</td>
                      <td className="p-1.5">{c.atasNama} <span className="text-slate-500">({c.hubunganPemilik})</span></td>
                      <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                        Rp {c.nilaiPasarTaksasi.toLocaleString('id-ID')}
                      </td>
                      <td className="p-1.5 text-right font-mono text-slate-800">
                        Rp {c.nilaiLikuidasi.toLocaleString('id-ID')}
                      </td>
                      <td className="p-1.5 text-slate-600">
                        {c.keterangan || 'Fisik & dokumen lengkap'} · LTV {c.persentaseLtv}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {(() => {
                    const totalTaksasi = app.collaterals.reduce((s, c) => s + (c.nilaiPasarTaksasi || 0), 0);
                    const totalLikuidasi = app.collaterals.reduce((s, c) => s + (c.nilaiLikuidasi || 0), 0);
                    const ltvAgregat = totalTaksasi > 0 ? Math.round((app.financial.plafonDiajukan / totalTaksasi) * 100) : 0;
                    return (
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                        <td colSpan={4} className="p-1.5 text-right uppercase">
                          Total Agregat Portfolio Agunan ({app.collaterals.length} Item):
                        </td>
                        <td className="p-1.5 text-right font-mono font-black text-slate-900">
                          Rp {totalTaksasi.toLocaleString('id-ID')}
                        </td>
                        <td className="p-1.5 text-right font-mono font-black text-slate-900">
                          Rp {totalLikuidasi.toLocaleString('id-ID')}
                        </td>
                        <td className="p-1.5 font-mono font-black text-emerald-800">
                          LTV Agregat: {ltvAgregat}%
                        </td>
                      </tr>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-500 w-36 inline-block">Jenis Agunan:</span>
                <strong className="text-slate-900">{app.collateral.jenisJaminan}</strong>
              </div>
              <div>
                <span className="text-slate-500 w-36 inline-block">Nilai Taksasi Pasar:</span>
                <strong className="font-mono text-slate-900">Rp {app.collateral.nilaiPasarTaksasi.toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span className="text-slate-500 w-36 inline-block">Nomor Bukti Hak:</span>
                <span className="font-mono text-slate-800">{app.collateral.nomorDokumen}</span>
              </div>
              <div>
                <span className="text-slate-500 w-36 inline-block">Nilai Likuidasi Cepat:</span>
                <span className="font-mono text-slate-800">Rp {app.collateral.nilaiLikuidasi.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-slate-500 w-36 inline-block">Atas Nama Pemilik:</span>
                <span className="text-slate-800">{app.collateral.atasNama} ({app.collateral.hubunganPemilik})</span>
              </div>
              <div>
                <span className="text-slate-500 w-36 inline-block">Loan to Value (LTV):</span>
                <span className="font-mono font-bold text-slate-900">{app.collateral.persentaseLtv}%</span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Rekapitulasi Scoring 5C & Rekomendasi */}
        <div className="mb-6 page-break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2">
            IV. REKAPITULASI CREDIT SCORING 5C & KEPUTUSAN SISTEM
          </h2>
          <div className="border border-slate-300 p-3 rounded mb-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total Skor Risiko:</span>
                <p className="font-mono text-2xl font-black text-slate-900">{app.scoring.totalScore} / 100</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Grade Rating:</span>
                <p className="text-base font-bold text-slate-900">{app.scoring.ratingGrade}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Plafon Rekomendasi:</span>
                <p className="font-mono text-lg font-bold text-slate-900">
                  Rp {app.scoring.plafonDisarankan.toLocaleString('id-ID')} ({app.scoring.tenorDisarankan} Bln)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center border-t border-slate-200 pt-2 text-[10px]">
              <div>
                <span className="text-slate-500">Character (25%)</span>
                <p className="font-mono font-bold text-slate-900">{app.scoring.characterScore}</p>
              </div>
              <div>
                <span className="text-slate-500">Capacity (30%)</span>
                <p className="font-mono font-bold text-slate-900">{app.scoring.capacityScore}</p>
              </div>
              <div>
                <span className="text-slate-500">Capital (15%)</span>
                <p className="font-mono font-bold text-slate-900">{app.scoring.capitalScore}</p>
              </div>
              <div>
                <span className="text-slate-500">Collateral (15%)</span>
                <p className="font-mono font-bold text-slate-900">{app.scoring.collateralScore}</p>
              </div>
              <div>
                <span className="text-slate-500">Condition (15%)</span>
                <p className="font-mono font-bold text-slate-900">{app.scoring.conditionScore}</p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-800">
            <strong>Catatan Rekomendasi Sistem: </strong>{app.scoring.summaryRemarks}
          </p>
        </div>

        {/* 5. Dokumentasi Bukti Fisik Survey (KTP & Bukti Lapangan) */}
        <div className="mb-6 page-break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2">
            V. DOKUMENTASI BUKTI FISIK SURVEY LAPANGAN (VERIFIKASI FISIK & DOKUMEN)
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {/* Foto KTP Debitur */}
            <div className="border border-slate-300 p-2 rounded">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-900 uppercase">1. KTP Debitur</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  app.evidence.fotoKtpStatus === 'fotocopy' 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {app.evidence.fotoKtpStatus === 'fotocopy' ? 'Fotocopy' : 'e-KTP Fisik Asli'}
                </span>
              </div>
              <div className="aspect-[1.58/1] w-full rounded bg-slate-100 overflow-hidden border border-slate-200">
                <img
                  src={app.evidence.fotoKtp || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80'}
                  alt="Foto KTP Debitur"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                NIK: {app.nik} ({app.namaDebitur})
              </p>
              {app.evidence.fotoKtpDeteksiInfo && (
                <p className="text-[8px] text-slate-400 italic">
                  Deteksi: {app.evidence.fotoKtpDeteksiInfo}
                </p>
              )}
              {app.evidence.fotoKtpCatatanSurveyor && (
                <div className="mt-1 bg-amber-50 p-1 border border-amber-200 rounded text-[9px] text-amber-900">
                  <strong>Catatan Surveyor: </strong>{app.evidence.fotoKtpCatatanSurveyor}
                </div>
              )}
            </div>

            {/* Foto KTP Pendamping (Istri / Orang Tua) */}
            {app.evidence.fotoKtpPendamping ? (
              <div className="border border-slate-300 p-2 rounded">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-900 uppercase truncate">
                    2. KTP {app.evidence.fotoKtpPendampingLabel || (app.statusPernikahan === 'Menikah' ? 'Istri/Pasangan' : 'Orang Tua')}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    app.evidence.fotoKtpPendampingStatus === 'fotocopy' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {app.evidence.fotoKtpPendampingStatus === 'fotocopy' ? 'Fotocopy' : 'e-KTP Fisik Asli'}
                  </span>
                </div>
                <div className="aspect-[1.58/1] w-full rounded bg-slate-100 overflow-hidden border border-slate-200">
                  <img
                    src={app.evidence.fotoKtpPendamping}
                    alt="Foto KTP Pendamping"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">
                  Pendamping: {app.statusPernikahan === 'Menikah' ? (app.namaPasangan || 'Pasangan Sah') : 'Orang Tua Kandung'}
                </p>
                {app.evidence.fotoKtpPendampingDeteksiInfo && (
                  <p className="text-[8px] text-slate-400 italic">
                    Deteksi: {app.evidence.fotoKtpPendampingDeteksiInfo}
                  </p>
                )}
                {app.evidence.fotoKtpPendampingCatatanSurveyor && (
                  <div className="mt-1 bg-amber-50 p-1 border border-amber-200 rounded text-[9px] text-amber-900">
                    <strong>Catatan Surveyor: </strong>{app.evidence.fotoKtpPendampingCatatanSurveyor}
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 p-2 rounded flex flex-col items-center justify-center text-center bg-slate-50">
                <span className="text-[10px] font-bold text-slate-400">2. KTP Pendamping</span>
                <span className="text-[9px] text-slate-400 mt-1">Tidak dilampirkan</span>
              </div>
            )}

            {/* Foto Bukti Penghasilan / Usaha */}
            <div className="border border-slate-300 p-2 rounded">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-900 uppercase">3. Bukti Usaha / Kas</span>
                <span className="text-[9px] font-mono text-slate-500">Slip / Mutasi</span>
              </div>
              <div className="aspect-[1.58/1] w-full rounded bg-slate-100 overflow-hidden border border-slate-200">
                <img
                  src={app.evidence.fotoBuktiPenghasilan || app.evidence.fotoRumahUsaha || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'}
                  alt="Bukti Pendapatan"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                Laba Bersih: Rp {app.financial.labaUsahaBersih.toLocaleString('id-ID')}/bln · DSR {app.financial.dsrRatio}%.
              </p>
            </div>
          </div>
        </div>

        {/* 6. Keputusan & Dokumentasi Komite Pembiayaan */}
        <div className="mb-6 border border-slate-900 p-3 rounded page-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider">
              VI. KEPUTUSAN KOMITE PEMBIAYAAN / REVIEWER
            </h2>
            {(app.adminReview?.committeeDoc?.noNotulen || app.analystCheck?.committeeSchedule?.noAgenda) && (
              <span className="font-mono text-[10px] text-slate-700 font-bold">
                {app.adminReview?.committeeDoc?.noNotulen || app.analystCheck?.committeeSchedule?.noAgenda}
              </span>
            )}
          </div>
          {app.analystCheck?.committeeSchedule && (
            <div className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 rounded p-2 mb-2 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Jadwal Sidang Analis:</strong>{' '}
                {app.analystCheck.committeeSchedule.waktuSidang.replace('T', ' ')} ·{' '}
                {app.analystCheck.committeeSchedule.lokasiSidang}
              </span>
              <span>
                <strong>Verifikator Analis:</strong> {app.analystCheck.checkedBy}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-[11px] mb-2">
            <div>
              <span className="text-slate-500">Status Keputusan: </span>
              <strong className="uppercase">
                {app.adminReview?.decision === 'approved'
                  ? 'DISETUJUI PENUH (APPROVED)'
                  : app.adminReview?.decision === 'conditional_approval'
                  ? 'DISETUJUI BERSYARAT (CONDITIONAL)'
                  : app.adminReview?.decision === 'rejected'
                  ? 'DITOLAK (REJECTED)'
                  : 'MENUNGGU VERIFIKASI / REVIEW'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Plafon Disetujui: </span>
              <strong className="font-mono">
                Rp {(app.adminReview?.approvedPlafon || app.scoring.plafonDisarankan).toLocaleString('id-ID')}
              </strong>{' '}
              ({app.adminReview?.approvedTenor || app.scoring.tenorDisarankan} Bulan)
            </div>
          </div>
          {app.adminReview?.committeeDoc?.skemaAkad && (
            <p className="text-[11px] text-slate-800 mb-1">
              <strong>Skema & Margin: </strong> {app.adminReview.committeeDoc.skemaAkad} (Margin: {app.adminReview.committeeDoc.marginBagiHasil || 12}% p.a.)
            </p>
          )}
          <p className="text-[11px] text-slate-800 mb-2">
            <strong>Catatan & Pertimbangan Komite: </strong>
            {app.adminReview?.notes || 'Menunggu verifikasi dan catatan komite pembiayaan.'}
          </p>
          {app.adminReview?.conditions && app.adminReview.conditions.length > 0 && (
            <div className="text-[10px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 mb-2">
              <span className="font-bold text-slate-900 block mb-0.5">Syarat-Syarat Putusan Komite:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {app.adminReview.conditions.map((cond, i) => (
                  <li key={i}>{cond}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Susunan Anggota Komite Sidang */}
          {(app.adminReview?.committeeDoc?.anggotaKomiteDetail && app.adminReview.committeeDoc.anggotaKomiteDetail.length > 0) ? (
            <div className="mb-2">
              <span className="text-[10px] font-bold text-slate-800 uppercase block mb-1">
                Susunan Anggota Komite Sidang ({app.adminReview.committeeDoc.anggotaKomiteDetail.length} Orang):
              </span>
              <table className="w-full text-left text-[10px] border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 font-semibold border-b border-slate-300">
                    <th className="p-1 w-6 text-center">No</th>
                    <th className="p-1">Nama Anggota</th>
                    <th className="p-1">Jabatan / Peran</th>
                    <th className="p-1 text-center">Suara Putusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {app.adminReview.committeeDoc.anggotaKomiteDetail.map((a, idx) => (
                    <tr key={idx}>
                      <td className="p-1 text-center font-mono">{idx + 1}</td>
                      <td className="p-1 font-semibold text-slate-900">{a.nama || '-'}</td>
                      <td className="p-1 text-slate-600">{a.role}</td>
                      <td className="p-1 text-center font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                          a.status === 'Setuju Penuh' ? 'text-emerald-800 bg-emerald-100' :
                          a.status === 'Setuju Bersyarat' ? 'text-amber-800 bg-amber-100' :
                          'text-slate-800 bg-slate-100'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : app.adminReview?.committeeDoc?.anggotaKomiteHadir && app.adminReview.committeeDoc.anggotaKomiteHadir.length > 0 ? (
            <div className="mb-2">
              <span className="text-[10px] font-bold text-slate-800 uppercase block mb-0.5">
                Anggota Komite Hadir:
              </span>
              <p className="text-[10px] text-slate-700">
                {app.adminReview.committeeDoc.anggotaKomiteHadir.join(' · ')}
              </p>
            </div>
          ) : null}

          {/* Perintah Pengikatan & Instruksi Notaris */}
          {app.disbursementInstruction && (
            <div className="text-[10px] text-slate-700 bg-teal-50/70 p-2 rounded border border-teal-300 mb-2">
              <span className="font-bold text-teal-950 block mb-0.5 uppercase">
                Perintah Pengikatan Agunan & Notaris Pelaksana:
              </span>
              <p><strong className="text-slate-900">Jenis Pengikatan: </strong>{app.disbursementInstruction.jenisPengikatan}</p>
              <p><strong className="text-slate-900">Notaris / PPAT Ditunjuk: </strong>{app.disbursementInstruction.notarisPpats}</p>
            </div>
          )}

          {/* Lampiran Foto Dokumentasi Sidang Komite (jika ada) */}
          {(app.adminReview?.committeeDoc?.fotoRisalah || app.adminReview?.committeeDoc?.fotoSidangKomite || app.adminReview?.committeeDoc?.fotoPengesahan) && (
            <div className="mt-3 pt-2 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-900 block mb-1.5 uppercase">
                Dokumentasi Fisik Hasil Sidang Komite:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {app.adminReview.committeeDoc.fotoRisalah && (
                  <div className="border border-slate-300 p-1.5 rounded">
                    <span className="text-[9px] font-bold block mb-1">Risalah Berita Acara</span>
                    <div className="aspect-[4/3] rounded overflow-hidden bg-slate-100">
                      <img
                        src={app.adminReview.committeeDoc.fotoRisalah}
                        alt="Risalah"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
                {app.adminReview.committeeDoc.fotoSidangKomite && (
                  <div className="border border-slate-300 p-1.5 rounded">
                    <span className="text-[9px] font-bold block mb-1">Dokumentasi Sidang</span>
                    <div className="aspect-[4/3] rounded overflow-hidden bg-slate-100">
                      <img
                        src={app.adminReview.committeeDoc.fotoSidangKomite}
                        alt="Sidang"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
                {app.adminReview.committeeDoc.fotoPengesahan && (
                  <div className="border border-slate-300 p-1.5 rounded">
                    <span className="text-[9px] font-bold block mb-1">Pengesahan Basah</span>
                    <div className="aspect-[4/3] rounded overflow-hidden bg-slate-100">
                      <img
                        src={app.adminReview.committeeDoc.fotoPengesahan}
                        alt="Pengesahan"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Verifikasi & Catatan Koreksi Manajemen Risiko */}
          <div
            className={`mt-3 p-2.5 rounded border page-break-inside-avoid ${
              app.riskVerification?.status === 'verified'
                ? 'border-emerald-600 bg-emerald-50/70'
                : app.riskVerification?.status === 'need_correction'
                ? 'border-amber-600 bg-amber-50/70'
                : 'border-dashed border-slate-300 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-300/80 pb-1 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-900">
                Tanda Verifikasi &amp; Koreksi Manajemen Risiko (Pasca-Analis Komite)
              </span>
              {app.riskVerification ? (
                <span
                  className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${
                    app.riskVerification.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                      : 'bg-amber-100 text-amber-900 border-amber-500'
                  }`}
                >
                  {app.riskVerification.status === 'verified'
                    ? `✓ TERVERIFIKASI SAH · ${app.riskVerification.verificationCode}`
                    : `! CATATAN KOREKSI RISIKO · ${app.riskVerification.verificationCode}`}
                </span>
              ) : (
                <span className="font-mono text-[9px] font-semibold text-slate-500 px-2 py-0.5 rounded border border-slate-300 bg-white">
                  MENUNGGU VERIFIKASI MANAJEMEN RISIKO
                </span>
              )}
            </div>

            {app.riskVerification ? (
              <div className="text-[10px] text-slate-800 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>Pejabat Manajemen Risiko:</strong> {app.riskVerification.verifiedBy}
                  </span>
                  <span className="font-mono text-slate-600">
                    Waktu Verifikasi: {new Date(app.riskVerification.verifiedAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="italic text-slate-900 bg-white/80 p-1.5 rounded border border-slate-200">
                  <strong>Catatan Koreksi / Mitigasi Risiko: </strong>
                  &ldquo;{app.riskVerification.notes || 'Tidak ada catatan tambahan.'}&rdquo;
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic">
                Belum terdapat tanda verifikasi dari Divisi Manajemen Risiko. Verifikasi dilakukan setelah berkas dikoreksi dan dijadwalkan komite oleh Analis.
              </p>
            )}
          </div>
        </div>

        {/* 5b. Validasi & Catatan Supervisi Branch Manager */}
        {app.branchValidation && (
          <div className="border border-slate-300 rounded p-3 mb-6 bg-slate-50 page-break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
              <span className="font-bold text-[11px] text-slate-900 uppercase">
                Validasi Supervisi Kantor Cabang (Branch Manager)
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-700">
                Status: {app.branchValidation.status === 'valid' ? 'VALID / DISETUJUI' : app.branchValidation.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <p><span className="text-slate-500">Pejabat Validator:</span> <strong>{app.branchValidation.validatedBy || '-'}</strong></p>
                <p><span className="text-slate-500">Kantor Cabang:</span> {app.cabang}</p>
                {app.branchValidation.validatedAt && (
                  <p><span className="text-slate-500">Waktu Validasi:</span> {new Date(app.branchValidation.validatedAt).toLocaleString('id-ID')}</p>
                )}
              </div>
              <div>
                <p><span className="text-slate-500">Rekomendasi Plafon BM:</span> <strong>Rp {app.branchValidation.rekomendasiPlafonBM ? app.branchValidation.rekomendasiPlafonBM.toLocaleString('id-ID') : '-'}</strong></p>
                <p><span className="text-slate-500">Rekomendasi Tenor BM:</span> {app.branchValidation.rekomendasiTenorBM ? `${app.branchValidation.rekomendasiTenorBM} Bulan` : '-'}</p>
              </div>
            </div>
            {app.branchValidation.notes && (
              <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-700 italic">
                Catatan Kepala Cabang: "{app.branchValidation.notes}"
              </div>
            )}
          </div>
        )}

        {/* 5c. Catatan & Atensi Dewan Manajemen */}
        {app.managementNote && (
          <div className="border border-slate-300 rounded p-3 mb-6 bg-amber-50/50 page-break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
              <span className="font-bold text-[11px] text-slate-900 uppercase">
                Catatan & Arahan Dewan Pengurus / Manajemen Eksekutif
              </span>
              <span className="font-mono text-[10px] font-bold text-amber-800">
                {app.managementNote.isAttention ? 'ATENSI KHUSUS DIREKSI' : 'SUPERVISI MANAJEMEN'}
              </span>
            </div>
            <div className="text-[11px]">
              <p><span className="text-slate-500">Pejabat Manajemen:</span> <strong>{app.managementNote.notedBy}</strong></p>
              <p className="mt-1"><span className="text-slate-500">Waktu Catatan:</span> {new Date(app.managementNote.notedAt).toLocaleString('id-ID')}</p>
              <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-800 italic">
                "{app.managementNote.notes}"
              </div>
            </div>
          </div>
        )}

        {/* 6. Tanda Tangan Pengesahan & Verifikasi (4 Kolom) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center page-break-inside-avoid mt-8 pt-4 border-t border-slate-300">
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Petugas Survey / AO</p>
            <div className="h-16 flex items-center justify-center font-mono text-[10px] text-slate-400">
              (Terverifikasi Digital)
            </div>
            <p className="font-bold underline text-slate-900 text-xs">{app.marketingName}</p>
            <p className="text-[10px] text-slate-500">{app.cabang}</p>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase">Kepala Cabang / BM</p>
            <div className="h-16 flex items-center justify-center font-mono text-[10px] text-slate-400">
              {app.branchValidation?.status === 'valid' ? '(Validasi Sah Digital)' : '(Menunggu Otorisasi)'}
            </div>
            <p className="font-bold underline text-slate-900 text-xs">
              {app.branchValidation?.validatedBy || 'Branch Manager'}
            </p>
            <p className="text-[10px] text-slate-500">{app.cabang}</p>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase">Komite &amp; Analis Kredit</p>
            <div className="h-16 flex items-center justify-center font-mono text-[10px] text-slate-400">
              {app.adminReview ? '(Putusan Komite Sah)' : '(Agenda Sidang)'}
            </div>
            <p className="font-bold underline text-slate-900 text-xs">
              {app.adminReview?.reviewedBy || 'Siti Nurhaliza, M.Ak.'}
            </p>
            <p className="text-[10px] text-slate-500">Komite Pembiayaan</p>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase">Manajemen Risiko</p>
            <div className="h-16 flex flex-col items-center justify-center font-mono text-[10px]">
              {app.riskVerification ? (
                <>
                  <span
                    className={`px-2 py-0.5 rounded border font-bold text-[9px] ${
                      app.riskVerification.status === 'verified'
                        ? 'border-emerald-600 text-emerald-800 bg-emerald-50'
                        : 'border-amber-600 text-amber-800 bg-amber-50'
                    }`}
                  >
                    {app.riskVerification.status === 'verified' ? 'TERVERIFIKASI SAH' : 'KOREKSI RISIKO'}
                  </span>
                  <span className="text-[8px] text-slate-500 mt-0.5">
                    {app.riskVerification.verificationCode}
                  </span>
                </>
              ) : (
                <span className="text-slate-400">(Menunggu Verifikasi)</span>
              )}
            </div>
            <p className="font-bold underline text-slate-900 text-xs">
              {app.riskVerification?.verifiedBy || 'Hendra Wijaya, S.E.'}
            </p>
            <p className="text-[10px] text-slate-500">Divisi Manajemen Risiko</p>
          </div>
        </div>

        {/* Footer Audit Code */}
        <div className="mt-8 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[9px] text-slate-400 font-mono">
          <span>{appSettings.printLegalFooterNotice || 'Dihasilkan secara otomatis oleh Aplikasi Credit Scoring & Survey Terintegrasi'}</span>
          <span>Geotagging: {app.evidence.lokasiGps} · ID: {app.id}</span>
        </div>
      </div>
    </div>
  );
};
