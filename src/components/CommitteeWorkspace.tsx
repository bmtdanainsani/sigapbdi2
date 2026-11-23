import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SurveyApplication,
  AdminReview,
  CommitteeDocumentation,
  JenisPengikatanAgunan,
  DisbursementInstruction,
} from '../types';
import {
  Gavel,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Camera,
  Upload,
  UserCheck,
  Calendar,
  Building,
  DollarSign,
  Printer,
  ChevronRight,
  ShieldAlert,
  FileText,
  Clock,
  Plus,
  Trash2,
  ZoomIn,
  X,
  Sparkles,
  Percent,
  Lock,
  Flag,
  Landmark,
  Scale,
  FileSignature,
  Banknote,
  Send,
  Check,
  Edit2,
  Users,
  CheckSquare,
  Square,
  RotateCcw,
  BadgeCheck,
  ShieldCheck,
} from 'lucide-react';
import { DocumentCameraCapture } from './DocumentCameraCapture';

export const CommitteeWorkspace: React.FC = () => {
  const {
    applications,
    currentUser,
    reviewApplication,
    requestRevisionFromAnalystToBM,
    verifyAndScheduleCommitteeByAnalyst,
    viewApplicationDetails,
    printApplicationReport,
    selectedApplication,
    setSelectedApplication,
  } = useApp();

  // Strictly enforce: before Branch Manager gives validation, surveys DO NOT appear for Komite & Analis
  // (except applications Analis itself returned to BM for revision tracking).
  const committeeEligibleApplications = React.useMemo(() => {
    if (currentUser.role === 'admin') {
      return applications.filter(
        (a) => a.branchValidation?.status === 'valid' || a.analystCheck?.status === 'revision_to_bm'
      );
    }
    // Super admin can see all
    return applications;
  }, [applications, currentUser.role]);

  // Selected application to review
  const [selectedAppId, setSelectedAppId] = useState<string>(() => {
    if (
      selectedApplication &&
      (currentUser.role !== 'admin' ||
        selectedApplication.branchValidation?.status === 'valid' ||
        selectedApplication.analystCheck?.status === 'revision_to_bm')
    ) {
      return selectedApplication.id;
    }
    const pending = committeeEligibleApplications.find(
      (a) => a.branchValidation?.status === 'valid' && (a.status === 'submitted' || a.status === 'under_review')
    );
    return pending ? pending.id : committeeEligibleApplications[0]?.id || '';
  });

  const selectedApp = committeeEligibleApplications.find((a) => a.id === selectedAppId);

  // Analyst Pre-Committee Check & Scheduling Form State
  const [analystMode, setAnalystMode] = useState<'schedule' | 'revision'>('schedule');
  const [scheduleNoAgenda, setScheduleNoAgenda] = useState('');
  const [scheduleWaktuSidang, setScheduleWaktuSidang] = useState(new Date().toISOString().slice(0, 16));
  const [scheduleLokasiSidang, setScheduleLokasiSidang] = useState('Ruang Rapat Komite Pembiayaan - Lantai 2');
  const [analystCheckNotes, setAnalystCheckNotes] = useState('');
  const [analystRevisionNotes, setAnalystRevisionNotes] = useState('');
  const [analystFormError, setAnalystFormError] = useState('');

  // Form State for Committee Decision
  const [noNotulen, setNoNotulen] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'conditional_approval' | 'need_reverification'>('approved');
  const [approvedPlafon, setApprovedPlafon] = useState<number>(30000000);
  const [approvedTenor, setApprovedTenor] = useState<number>(12);
  const [marginBagiHasil, setMarginBagiHasil] = useState<number>(12.0); // % p.a.
  const [skemaAkad, setSkemaAkad] = useState('Murabahah (Jual Beli Modal Kerja/Barang)');
  const [rekomendasiAgunan, setRekomendasiAgunan] = useState('Pengikatan hak tanggungan/APHT/Fidusia sah, simpan fisik asli di khazanah kantor.');
  const [notes, setNotes] = useState('');
  const [rekomendasiMitigasi, setRekomendasiMitigasi] = useState('');
  
  // 5C Committee Analysis
  const [analisaCharacter, setAnalisaCharacter] = useState('Debitur kooperatif, reputasi bisnis baik, tidak ada catatan negatif di SLIK/sistem.');
  const [analisaCapacity, setAnalisaCapacity] = useState('Arus kas stabil, DSR di bawah 35%, pendapatan bulanan terverifikasi mampu menanggung angsuran.');
  const [analisaCapital, setAnalisaCapital] = useState('Modal sendiri mendominasi lebih dari 60% struktur permodalan usaha.');
  const [analisaCollateral, setAnalisaCollateral] = useState('Agunan memiliki sertifikat/BPKB asli yang sah dan nilai taksasi likuidasi di atas 120% plafon.');
  const [analisaCondition, setAnalisaCondition] = useState('Sektor usaha kebutuhan pokok/jasa esensial dengan prospek pasar stabil dan minim risiko musiman.');

  // Conditions
  const [syaratPreseden, setSyaratPreseden] = useState<string[]>([
    'Penyerahan dokumen jaminan asli dan pengecekan keabsahan dokumen',
    'Penandatanganan persetujuan pasangan (suami/istri) secara sah',
    'Pembukaan rekening tabungan penampungan atas nama calon kreditur sendiri',
  ]);
  const [newSyaratPreseden, setNewSyaratPreseden] = useState('');

  const [syaratSubsequen, setSyaratSubsequen] = useState<string[]>([
    'Monitoring lapangan rutin oleh Account Officer setiap 2 bulan sekali',
    'Kewajiban pelaporan ringkasan omzet usaha setiap triwulan',
  ]);
  const [newSyaratSubsequen, setNewSyaratSubsequen] = useState('');

  // Committee Members State (Bisa diisi manual Nama & Jabatan, dan bisa lebih dari 4 orang)
  interface AnggotaKomiteItem {
    id: string;
    nama: string;
    role: string;
    status: string;
  }

  const [anggotaKomite, setAnggotaKomite] = useState<AnggotaKomiteItem[]>([
    { id: 'kom-1', nama: 'Siti Nurhaliza, M.Ak.', role: 'Analis Kredit / Reviewer', status: 'Setuju Penuh' },
    { id: 'kom-2', nama: 'Ahmad Rizky, S.E.', role: 'Ketua Komite / Kepala Cabang', status: 'Setuju Penuh' },
    { id: 'kom-3', nama: 'Hendra Wijaya, S.E.', role: 'Risk & Compliance Officer', status: 'Setuju Penuh' },
    { id: 'kom-4', nama: 'Drs. Budi Santoso', role: 'Komite Pembiayaan Independen', status: 'Setuju Bersyarat' },
  ]);

  const handleAddAnggota = () => {
    setAnggotaKomite((prev) => [
      ...prev,
      {
        id: `kom-${Date.now()}-${prev.length + 1}`,
        nama: '',
        role: 'Anggota Komite',
        status: 'Setuju Penuh',
      },
    ]);
  };

  const handleRemoveAnggota = (index: number) => {
    if (anggotaKomite.length <= 1) return;
    setAnggotaKomite((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateAnggota = (index: number, field: 'nama' | 'role' | 'status', value: string) => {
    setAnggotaKomite((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Documentation / Photos
  const [fotoRisalah, setFotoRisalah] = useState('https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80');
  const [fotoSidangKomite, setFotoSidangKomite] = useState('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80');
  const [fotoPengesahan, setFotoPengesahan] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80');
  const [waktuSidang, setWaktuSidang] = useState(new Date().toISOString().slice(0, 16));
  const [lokasiSidang, setLokasiSidang] = useState('Ruang Rapat Komite Pembiayaan - Lantai 2');

  // Disbursement Instruction State for Admin Cabang (Instruksi Pencairan)
  // Jenis Pengikatan Agunan (bisa memilih lebih dari 1 sesuai jumlah dan agunan yang dijaminkan)
  const [selectedJenisPengikatan, setSelectedJenisPengikatan] = useState<string[]>(['APHT']);
  const [selectedJenisAgunan, setSelectedJenisAgunan] = useState<string[]>(['SHM / Tanah Bangunan']);
  const [customJenisAgunan, setCustomJenisAgunan] = useState('');
  
  const toggleJenisPengikatan = (key: string) => {
    setSelectedJenisPengikatan((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // Minimal 1 jenis pengikatan harus tetap dipilih
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // Quick Pick Presets Notaris / PPAT (Bisa diedit atau dihapus pengguna)
  const DEFAULT_NOTARIS_PRESETS = [
    'Notaris & PPAT Siti Rahmawati, S.H., M.Kn.',
    'Notaris & PPAT Hendra Kurniawan, S.H., M.Kn.',
    'Notaris & PPAT Bambang Sudiro, S.H.',
  ];

  const [notarisPresets, setNotarisPresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bmt_notaris_presets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_NOTARIS_PRESETS;
  });

  const [notarisPpats, setNotarisPpats] = useState('Notaris & PPAT Siti Rahmawati, S.H., M.Kn.');
  const [editingPresetIdx, setEditingPresetIdx] = useState<number | null>(null);
  const [editingPresetVal, setEditingPresetVal] = useState('');
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetVal, setNewPresetVal] = useState('');

  const saveNotarisPresets = (newList: string[]) => {
    setNotarisPresets(newList);
    try {
      localStorage.setItem('bmt_notaris_presets_v2', JSON.stringify(newList));
    } catch (e) {
      // ignore
    }
  };

  const handleDeletePreset = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = notarisPresets.filter((_, idx) => idx !== index);
    saveNotarisPresets(updated);
  };

  const handleStartEditPreset = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPresetIdx(index);
    setEditingPresetVal(notarisPresets[index]);
  };

  const handleSaveEditPreset = () => {
    if (editingPresetIdx === null) return;
    const trimmed = editingPresetVal.trim();
    if (trimmed) {
      const oldVal = notarisPresets[editingPresetIdx];
      const updated = [...notarisPresets];
      updated[editingPresetIdx] = trimmed;
      saveNotarisPresets(updated);
      if (notarisPpats === oldVal) {
        setNotarisPpats(trimmed);
      }
    }
    setEditingPresetIdx(null);
    setEditingPresetVal('');
  };

  const handleAddPreset = () => {
    const trimmed = newPresetVal.trim();
    if (trimmed) {
      if (!notarisPresets.includes(trimmed)) {
        const updated = [...notarisPresets, trimmed];
        saveNotarisPresets(updated);
      }
      setNotarisPpats(trimmed);
      setNewPresetVal('');
      setIsAddingPreset(false);
    }
  };

  const handleResetNotarisPresets = () => {
    saveNotarisPresets(DEFAULT_NOTARIS_PRESETS);
  };

  const [pengantarPencairan, setPengantarPencairan] = useState(
    'Debitur wajib hadir bersama pasangan sah di hadapan Notaris rekanan. Lakukan verifikasi fisik keabsahan dokumen agunan asli sebelum dana ditransfer ke rekening debitur.'
  );

  // Camera Capture Modal State
  const [cameraConfig, setCameraConfig] = useState<{
    isOpen: boolean;
    targetField: 'risalah' | 'sidang' | 'pengesahan';
    title: string;
    description: string;
  }>({
    isOpen: false,
    targetField: 'risalah',
    title: 'Foto Berita Acara Komite',
    description: 'Posisikan lembar fisik notulen komite dengan tanda tangan lengkap.',
  });

  // Image Zoom Modal Preview
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Sync state whenever selected application or its schedule updates
  React.useEffect(() => {
    if (selectedApp) {
      setSelectedApplication(selectedApp);
      const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '/');
      const defaultNotulen = `BA-KOM/${yearMonth}/${selectedApp.applicationNumber}`;
      const existingSchedule = selectedApp.analystCheck?.committeeSchedule;

      setAnalystFormError('');
      setAnalystMode(selectedApp.analystCheck?.status === 'revision_to_bm' ? 'revision' : 'schedule');
      setScheduleNoAgenda(existingSchedule?.noAgenda || defaultNotulen);
      setScheduleWaktuSidang(existingSchedule?.waktuSidang || new Date().toISOString().slice(0, 16));
      setScheduleLokasiSidang(existingSchedule?.lokasiSidang || 'Ruang Rapat Komite Pembiayaan - Lantai 2');
      setAnalystCheckNotes(
        selectedApp.analystCheck?.status === 'verified_scheduled'
          ? selectedApp.analystCheck.notes
          : `Data survey, legalitas, dan validasi cabang ${selectedApp.cabang} atas nama ${selectedApp.namaDebitur} telah diverifikasi lengkap dan siap disidangkan.`
      );
      setAnalystRevisionNotes(
        selectedApp.analystCheck?.status === 'revision_to_bm' ? selectedApp.analystCheck.notes : ''
      );

      if (selectedApp.adminReview) {
        setDecision(selectedApp.adminReview.decision);
        setApprovedPlafon(selectedApp.adminReview.approvedPlafon);
        setApprovedTenor(selectedApp.adminReview.approvedTenor);
        setNotes(selectedApp.adminReview.notes);

        if (selectedApp.adminReview.committeeDoc) {
          const doc = selectedApp.adminReview.committeeDoc;
          setNoNotulen(doc.noNotulen || existingSchedule?.noAgenda || defaultNotulen);
          if (doc.fotoRisalah) setFotoRisalah(doc.fotoRisalah);
          if (doc.fotoSidangKomite) setFotoSidangKomite(doc.fotoSidangKomite);
          if (doc.fotoPengesahan) setFotoPengesahan(doc.fotoPengesahan);
          if (doc.waktuSidang) setWaktuSidang(doc.waktuSidang);
          if (doc.lokasiSidang) setLokasiSidang(doc.lokasiSidang);
          if (doc.skemaAkad) setSkemaAkad(doc.skemaAkad);
          if (doc.marginBagiHasil) setMarginBagiHasil(doc.marginBagiHasil);
          if (doc.rekomendasiAgunan) setRekomendasiAgunan(doc.rekomendasiAgunan);
          if (doc.rekomendasiMitigasi) setRekomendasiMitigasi(doc.rekomendasiMitigasi);
          if (doc.syaratPreseden) setSyaratPreseden(doc.syaratPreseden);
          if (doc.syaratSubsequen) setSyaratSubsequen(doc.syaratSubsequen);
          if (doc.analisa5CDeskripsi) {
            setAnalisaCharacter(doc.analisa5CDeskripsi.character);
            setAnalisaCapacity(doc.analisa5CDeskripsi.capacity);
            setAnalisaCapital(doc.analisa5CDeskripsi.capital);
            setAnalisaCollateral(doc.analisa5CDeskripsi.collateral);
            setAnalisaCondition(doc.analisa5CDeskripsi.condition);
          }
          if (doc.anggotaKomiteDetail && doc.anggotaKomiteDetail.length > 0) {
            setAnggotaKomite(
              doc.anggotaKomiteDetail.map((a, i) => ({
                id: a.id || `kom-${i + 1}`,
                nama: a.nama || '',
                role: a.role || 'Anggota Komite',
                status: a.status || 'Setuju Penuh',
              }))
            );
          }
        }

        const colls = selectedApp.collaterals && selectedApp.collaterals.length > 0
          ? selectedApp.collaterals
          : [selectedApp.collateral];

        if (selectedApp.disbursementInstruction) {
          const inst = selectedApp.disbursementInstruction;
          if (inst.jenisPengikatanList && inst.jenisPengikatanList.length > 0) {
            setSelectedJenisPengikatan(inst.jenisPengikatanList);
          } else if (inst.jenisPengikatan) {
            const parts = inst.jenisPengikatan.split(/[+&,]/).map((s) => s.trim()).filter(Boolean);
            setSelectedJenisPengikatan(parts.length > 0 ? parts : [inst.jenisPengikatan]);
          }
          setSelectedJenisAgunan(inst.jenisAgunan || colls.map(c => `${c.jenisJaminan} (${c.nomorDokumen || '-'})`));
          setNotarisPpats(inst.notarisPpats || notarisPresets[0] || 'Notaris & PPAT Siti Rahmawati, S.H., M.Kn.');
          setPengantarPencairan(inst.pengantarPencairan || '');
        } else {
          // Auto-detect recommended pengikatan based on all collaterals
          const detectedPengikatan: string[] = [];
          colls.forEach((c) => {
            const j = c.jenisJaminan || '';
            if (j.includes('SHM') || j.includes('AJB')) {
              if (!detectedPengikatan.includes('APHT')) detectedPengikatan.push('APHT');
            } else if (j.includes('BPKB')) {
              if (!detectedPengikatan.includes('Fidusia')) detectedPengikatan.push('Fidusia');
            } else if (j.includes('Tabungan') || j.includes('Deposito')) {
              if (!detectedPengikatan.includes('Internal BMT (Gadai Syariah / Rahn)')) detectedPengikatan.push('Internal BMT (Gadai Syariah / Rahn)');
            }
          });
          if (detectedPengikatan.length === 0) detectedPengikatan.push('APHT');

          setSelectedJenisPengikatan(detectedPengikatan);
          setSelectedJenisAgunan(colls.map((c, i) => `#${i + 1} ${c.jenisJaminan} (${c.nomorDokumen || '-'}) a/n ${c.atasNama}`));
          setNotarisPpats(notarisPresets[0] || 'Notaris & PPAT Siti Rahmawati, S.H., M.Kn.');
          
          const agunanListStr = colls.map((c, i) => `#${i + 1} ${c.jenisJaminan} (${c.nomorDokumen || '-'}) a/n ${c.atasNama}`).join(', ');
          setPengantarPencairan(
            `Lakukan pengikatan ${detectedPengikatan.join(' + ')} melalui Notaris/PPAT yang ditunjuk untuk agunan: ${agunanListStr}. Pastikan debitur & pasangan hadir, periksa keaslian dokumen di kantor cabang, dan cairkan dana sesuai nominal yang disepakati komite Rp ${(selectedApp.adminReview?.approvedPlafon || selectedApp.scoring.plafonDisarankan || selectedApp.financial.plafonDiajukan).toLocaleString('id-ID')}.`
          );
        }
      } else {
        // Defaults from Analyst schedule (if created) and system scoring recommendation
        setNoNotulen(existingSchedule?.noAgenda || defaultNotulen);
        if (existingSchedule?.waktuSidang) setWaktuSidang(existingSchedule.waktuSidang);
        if (existingSchedule?.lokasiSidang) setLokasiSidang(existingSchedule.lokasiSidang);
        setApprovedPlafon(selectedApp.branchValidation?.rekomendasiPlafonBM || selectedApp.scoring.plafonDisarankan || selectedApp.financial.plafonDiajukan);
        setApprovedTenor(selectedApp.branchValidation?.rekomendasiTenorBM || selectedApp.scoring.tenorDisarankan || selectedApp.financial.tenorBulanDiajukan);
        setNotes(selectedApp.scoring.summaryRemarks);
        setRekomendasiMitigasi(selectedApp.scoring.mitigasiUtama.join('. '));
        setMarginBagiHasil(12.0);
        
        const colls = selectedApp.collaterals && selectedApp.collaterals.length > 0
          ? selectedApp.collaterals
          : [selectedApp.collateral];
        const totalTaksasi = colls.reduce((s, c) => s + (c.nilaiPasarTaksasi || 0), 0);
        setRekomendasiAgunan(`Pengikatan portofolio ${colls.length} agunan debitur senilai total Rp ${totalTaksasi.toLocaleString('id-ID')} dengan status dokumen sah.`);
        
        // Auto-detect based on all collaterals
        const detectedPengikatan: string[] = [];
        colls.forEach((c) => {
          const j = c.jenisJaminan || '';
          if (j.includes('SHM') || j.includes('AJB')) {
            if (!detectedPengikatan.includes('APHT')) detectedPengikatan.push('APHT');
          } else if (j.includes('BPKB')) {
            if (!detectedPengikatan.includes('Fidusia')) detectedPengikatan.push('Fidusia');
          } else if (j.includes('Tabungan') || j.includes('Deposito')) {
            if (!detectedPengikatan.includes('Internal BMT (Gadai Syariah / Rahn)')) detectedPengikatan.push('Internal BMT (Gadai Syariah / Rahn)');
          }
        });
        if (detectedPengikatan.length === 0) detectedPengikatan.push('APHT');

        setSelectedJenisPengikatan(detectedPengikatan);
        setSelectedJenisAgunan(colls.map((c, i) => `#${i + 1} ${c.jenisJaminan} (${c.nomorDokumen || '-'}) a/n ${c.atasNama}`));
        setNotarisPpats(notarisPresets[0] || 'Notaris & PPAT Siti Rahmawati, S.H., M.Kn.');

        const agunanListStr = colls.map((c, i) => `#${i + 1} ${c.jenisJaminan} (${c.nomorDokumen || '-'}) a/n ${c.atasNama}`).join(', ');
        setPengantarPencairan(
          `Lakukan pengikatan ${detectedPengikatan.join(' + ')} melalui Notaris/PPAT yang ditunjuk untuk agunan: ${agunanListStr}. Pastikan debitur & pasangan hadir, periksa keaslian dokumen di kantor cabang, dan cairkan dana sesuai nominal yang disepakati komite Rp ${(selectedApp.scoring.plafonDisarankan || selectedApp.financial.plafonDiajukan).toLocaleString('id-ID')}.`
        );

        setDecision(
          selectedApp.scoring.recommendation === 'SETUJUI_PENUH'
            ? 'approved'
            : selectedApp.scoring.recommendation === 'SETUJUI_DENGAN_SYARAT'
            ? 'conditional_approval'
            : selectedApp.scoring.recommendation === 'TINJAUAN_KOMITE'
            ? 'conditional_approval'
            : 'rejected'
        );
      }
    }
  }, [selectedAppId]);

  const handleRequestBmRevision = () => {
    if (!selectedApp) return;
    if (!analystRevisionNotes.trim()) {
      setAnalystFormError('Harap tuliskan poin kekurangan / instruksi revisi untuk Pimpinan Cabang.');
      return;
    }
    setAnalystFormError('');
    requestRevisionFromAnalystToBM(selectedApp.id, analystRevisionNotes);
  };

  const handleVerifyAndScheduleCommittee = () => {
    if (!selectedApp) return;
    if (!scheduleWaktuSidang || !scheduleLokasiSidang.trim()) {
      setAnalystFormError('Waktu dan lokasi pelaksanaan Sidang Komite wajib diisi.');
      return;
    }
    setAnalystFormError('');
    verifyAndScheduleCommitteeByAnalyst(selectedApp.id, {
      noAgenda: scheduleNoAgenda,
      waktuSidang: scheduleWaktuSidang,
      lokasiSidang: scheduleLokasiSidang,
      notes: analystCheckNotes,
    });
    setNoNotulen(scheduleNoAgenda.trim() || noNotulen);
    setWaktuSidang(scheduleWaktuSidang);
    setLokasiSidang(scheduleLokasiSidang.trim());
  };

  const handleAddSyaratPreseden = () => {
    if (newSyaratPreseden.trim()) {
      setSyaratPreseden((prev) => [...prev, newSyaratPreseden.trim()]);
      setNewSyaratPreseden('');
    }
  };

  const handleRemoveSyaratPreseden = (index: number) => {
    setSyaratPreseden((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSyaratSubsequen = () => {
    if (newSyaratSubsequen.trim()) {
      setSyaratSubsequen((prev) => [...prev, newSyaratSubsequen.trim()]);
      setNewSyaratSubsequen('');
    }
  };

  const handleRemoveSyaratSubsequen = (index: number) => {
    setSyaratSubsequen((prev) => prev.filter((_, i) => i !== index));
  };

  // Image file upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'risalah' | 'sidang' | 'pengesahan') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (target === 'risalah') {
        setFotoRisalah(dataUrl);
      } else if (target === 'sidang') {
        setFotoSidangKomite(dataUrl);
      } else {
        setFotoPengesahan(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Camera for specific committee document
  const openCamera = (targetField: 'risalah' | 'sidang' | 'pengesahan', title: string, description: string) => {
    setCameraConfig({
      isOpen: true,
      targetField,
      title,
      description,
    });
  };

  const handleCameraCaptureConfirm = (imageDataUrl: string) => {
    if (cameraConfig.targetField === 'risalah') {
      setFotoRisalah(imageDataUrl);
    } else if (cameraConfig.targetField === 'sidang') {
      setFotoSidangKomite(imageDataUrl);
    } else if (cameraConfig.targetField === 'pengesahan') {
      setFotoPengesahan(imageDataUrl);
    }
  };

  // Calculate estimated monthly installment based on approved ceiling, tenor, and margin
  const estimasiAngsuranKomite = React.useMemo(() => {
    const tenor = Math.max(1, approvedTenor);
    const totalMargin = approvedPlafon * ((marginBagiHasil / 100) * (tenor / 12));
    return Math.round((approvedPlafon + totalMargin) / tenor);
  }, [approvedPlafon, approvedTenor, marginBagiHasil]);

  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') return;

    const committeeDoc: CommitteeDocumentation = {
      noNotulen: noNotulen.trim() || `BA-KOM/2026/${selectedApp.applicationNumber}`,
      fotoRisalah,
      fotoSidangKomite,
      fotoPengesahan,
      waktuSidang,
      lokasiSidang,
      anggotaKomiteHadir: anggotaKomite.map((a) => `${a.nama} (${a.role}) - [${a.status}]`),
      anggotaKomiteDetail: anggotaKomite,
      analisa5CDeskripsi: {
        character: analisaCharacter,
        capacity: analisaCapacity,
        capital: analisaCapital,
        collateral: analisaCollateral,
        condition: analisaCondition,
      },
      syaratPreseden,
      syaratSubsequen,
      skemaAkad,
      marginBagiHasil,
      rekomendasiAgunan,
      rekomendasiMitigasi,
    };

    const review: AdminReview = {
      reviewedBy: currentUser.name,
      reviewerId: currentUser.id,
      reviewedAt: new Date().toISOString(),
      decision,
      approvedPlafon,
      approvedTenor,
      notes,
      conditions: [...syaratPreseden, ...syaratSubsequen],
      signatureName: currentUser.name,
      committeeDoc,
    };

    const disbursementInstruction: DisbursementInstruction | undefined =
      decision === 'approved' || decision === 'conditional_approval'
        ? {
            orderIssuedAt: new Date().toISOString(),
            orderIssuedBy: currentUser.name,
            orderIssuerId: currentUser.id,
            nominalDisetujui: approvedPlafon,
            tenorDisetujui: approvedTenor,
            marginUjrah: marginBagiHasil,
            estimasiAngsuran: estimasiAngsuranKomite,
            jenisAgunan:
              selectedJenisAgunan.length > 0
                ? selectedJenisAgunan
                : [selectedApp.collateral.jenisJaminan],
            jenisPengikatan: selectedJenisPengikatan.join(' + ') || 'APHT',
            jenisPengikatanList: selectedJenisPengikatan,
            notarisPpats:
              notarisPpats.trim() || 'Notaris & PPAT Siti Rahmawati, S.H., M.Kn.',
            pengantarPencairan:
              pengantarPencairan.trim() ||
              'Harap segera tindaklanjuti proses pengikatan notaris dan pencairan dana sesuai nominal yang disepakati komite.',
            syaratSebelumCair: syaratPreseden,
          }
        : undefined;

    reviewApplication(selectedApp.id, review, disbursementInstruction);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Gavel className="h-6 w-6 text-emerald-400" />
            <span>Menu Sidang Komite Pembiayaan & Analisa Risiko</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Standar operasional komite: evaluasi 5C, penetapan limit & tenor putusan, syarat preseden & subsequen, serta upload dokumentasi risalah fisik.
          </p>
        </div>

        {selectedApp && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => viewApplicationDetails(selectedApp)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Lihat Berkas Survey</span>
            </button>
            <button
              onClick={() => printApplicationReport(selectedApp)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Printer className="h-4 w-4 text-sky-400" />
              <span>Cetak Berita Acara Sidang</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Applications (Sidebar queue) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Berkas Analis &amp; Sidang Komite ({committeeEligibleApplications.length})
              </span>
              <span className="text-[11px] font-mono text-emerald-400">Pilih Berkas</span>
            </div>

            <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
              {committeeEligibleApplications.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  <p className="font-semibold text-slate-400">Belum Ada Berkas Divalidasi</p>
                  <p className="text-[11px] mt-1 text-slate-500">
                    Berkas baru akan muncul setelah disetujui oleh Branch Manager.
                  </p>
                </div>
              ) : (
                committeeEligibleApplications.map((app) => {
                const isSelected = app.id === selectedAppId;
                const isApproved = app.status === 'approved' || app.status === 'conditional_approval';
                const isRejected = app.status === 'rejected';
                const isReturnedToBm =
                  app.analystCheck?.status === 'revision_to_bm' && app.branchValidation?.status !== 'valid';
                const isScheduledByAnalyst = app.analystCheck?.status === 'verified_scheduled';

                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`w-full text-left rounded-lg p-3 border transition-colors flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/30'
                        : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {app.applicationNumber}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {app.namaDebitur}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {app.jenisUsaha} · Plafon: Rp {app.financial.plafonDiajukan.toLocaleString('id-ID')}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.2 rounded">
                          Skor: {app.scoring.totalScore}
                        </span>
                        <span>{app.scoring.ratingGrade.split(' ')[0]}</span>
                        <span>· {app.marketingName}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 mt-0.5 flex flex-col items-end gap-1">
                      {isReturnedToBm ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/70 px-2 py-0.5 rounded border border-rose-500/30">
                          <RotateCcw className="h-3 w-3" />
                          <span>Revisi ke BM</span>
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Diputus</span>
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/20">
                          <span>Ditolak</span>
                        </span>
                      ) : isScheduledByAnalyst ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-950/70 px-2 py-0.5 rounded border border-sky-500/30">
                          <Calendar className="h-3 w-3" />
                          <span>Terjadwal Komite</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          <span>Cek Analis</span>
                        </span>
                      )}
                      {app.riskVerification && (
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            app.riskVerification.status === 'verified'
                              ? 'text-cyan-300 bg-cyan-950/70 border-cyan-500/30'
                              : 'text-amber-300 bg-amber-950/70 border-amber-500/30'
                          }`}
                        >
                          <BadgeCheck className="h-2.5 w-2.5" />
                          <span>{app.riskVerification.status === 'verified' ? 'Verif Risk' : 'Koreksi Risk'}</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              }))}
            </div>
          </div>
        </div>

        {/* Right Column: Analyst Pre-Check / Scheduling + Active Committee Review */}
        <div className="lg:col-span-8 space-y-6">
          {selectedApp && selectedApp.analystCheck?.status === 'revision_to_bm' && selectedApp.branchValidation?.status !== 'valid' ? (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      Berkas Dikembalikan ke Pimpinan Cabang ({selectedApp.cabang})
                    </h3>
                    <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-rose-950 border border-rose-500/40 text-rose-300 font-bold">
                      Menunggu Revisi &amp; Validasi Ulang BM
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {selectedApp.applicationNumber} · <strong>{selectedApp.namaDebitur}</strong> ({selectedApp.jenisUsaha})
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-rose-500/30 bg-slate-950/70 p-4 text-xs space-y-1.5">
                <p className="font-bold text-rose-300">
                  Catatan Kekurangan dari Analis ({selectedApp.analystCheck.checkedBy}):
                </p>
                <p className="text-slate-100 italic leading-relaxed">
                  &ldquo;{selectedApp.analystCheck.notes}&rdquo;
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  Dikirim pada: {new Date(selectedApp.analystCheck.checkedAt).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200">
                <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  Penjadwalan Sidang Komite dan penetapan putusan dikunci sementara hingga Pimpinan Cabang ({selectedApp.cabang}) menyelesaikan perbaikan dan melakukan validasi ulang.
                </span>
              </div>
            </div>
          ) : selectedApp ? (
            <>
              {/* PRE-COMMITTEE STAGE: ANALYST VERIFICATION & COMMITTEE SCHEDULING OR BM REVISION REQUEST */}
              <div className="rounded-xl border border-sky-500/35 bg-slate-900/75 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Tahap Pemeriksaan Analis Kredit &amp; Penjadwalan Sidang Komite
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Periksa kelengkapan data pasca-validasi BM. Minta revisi ke Pimpinan Cabang bila kurang, atau verifikasi &amp; jadwalkan komite agar Manajemen Risiko dapat memverifikasi.
                      </p>
                    </div>
                  </div>

                  {selectedApp.analystCheck?.status === 'verified_scheduled' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Terverifikasi &amp; Terjadwal Komite</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-[11px] font-bold text-amber-300 shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Menunggu Cek &amp; Jadwal Analis</span>
                    </span>
                  )}
                </div>

                {selectedApp.analystCheck?.revalidatedByBmAt && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-200 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>
                        Pimpinan Cabang telah menindaklanjuti permintaan revisi &amp; memvalidasi ulang berkas ini.
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-300 shrink-0">
                      {new Date(selectedApp.analystCheck.revalidatedByBmAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {/* Mode Switcher Tabs */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAnalystMode('schedule');
                      setAnalystFormError('');
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all ${
                      analystMode === 'schedule'
                        ? 'border-sky-500 bg-sky-950/60 text-sky-300 ring-1 ring-sky-500/30'
                        : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Verifikasi Data &amp; Jadwalkan Komite</span>
                  </button>

                  {!selectedApp.adminReview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAnalystMode('revision');
                        setAnalystFormError('');
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all ${
                        analystMode === 'revision'
                          ? 'border-rose-500 bg-rose-950/60 text-rose-300 ring-1 ring-rose-500/30'
                          : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:text-white'
                      }`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Minta Revisi ke Pimpinan Cabang (BM)</span>
                    </button>
                  )}
                </div>

                {analystMode === 'schedule' ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">No. Agenda / Notulen Sidang</label>
                        <input
                          type="text"
                          value={scheduleNoAgenda}
                          onChange={(e) => setScheduleNoAgenda(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Jadwal Waktu Sidang Komite</label>
                        <input
                          type="datetime-local"
                          value={scheduleWaktuSidang}
                          onChange={(e) => setScheduleWaktuSidang(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Lokasi / Media Sidang</label>
                        <input
                          type="text"
                          value={scheduleLokasiSidang}
                          onChange={(e) => setScheduleLokasiSidang(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-sky-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Catatan Verifikasi &amp; Penjadwalan Analis Kredit</label>
                      <textarea
                        rows={2}
                        value={analystCheckNotes}
                        onChange={(e) => setAnalystCheckNotes(e.target.value)}
                        placeholder="Tuliskan hasil pemeriksaan kelengkapan berkas & catatan pengantar untuk Manajemen Risiko dan Sidang Komite..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-sky-500 focus:outline-hidden"
                      />
                    </div>

                    {analystFormError && (
                      <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-xs text-rose-300">
                        {analystFormError}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-slate-400">
                        {selectedApp.analystCheck?.committeeSchedule
                          ? `Terjadwal oleh ${selectedApp.analystCheck.committeeSchedule.scheduledBy} pada ${new Date(
                              selectedApp.analystCheck.committeeSchedule.scheduledAt
                            ).toLocaleString('id-ID')}`
                          : 'Setelah dijadwalkan, notifikasi langsung dikirim ke Manajemen Risiko untuk proses verifikasi.'}
                      </span>
                      <button
                        type="button"
                        onClick={handleVerifyAndScheduleCommittee}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {selectedApp.analystCheck?.status === 'verified_scheduled'
                            ? 'Perbarui Jadwal Sidang Komite'
                            : 'Verifikasi Berkas & Jadwalkan Komite'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
                    <div>
                      <label className="block text-rose-300 font-bold mb-1">
                        Catatan Kekurangan / Permintaan Revisi ke Pimpinan Cabang ({selectedApp.cabang}) *
                      </label>
                      <textarea
                        rows={3}
                        value={analystRevisionNotes}
                        onChange={(e) => setAnalystRevisionNotes(e.target.value)}
                        placeholder="Contoh: Dokumen taksasi agunan belum melampirkan pembanding pasar, mohon Pimpinan Cabang melengkapi catatan nilai likuidasi dan verifikasi ulang omzet..."
                        className="w-full rounded-lg border border-rose-500/40 bg-slate-900 p-2.5 text-white focus:border-rose-400 focus:outline-hidden"
                      />
                    </div>

                    {analystFormError && (
                      <div className="rounded-lg border border-rose-500/40 bg-rose-950/60 px-3 py-2 text-xs text-rose-200">
                        {analystFormError}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] text-rose-200/80">
                        Berkas akan dikembalikan ke antrean Branch Manager {selectedApp.cabang} dan terkunci dari komite sampai BM memvalidasi ulang.
                      </p>
                      <button
                        type="button"
                        onClick={handleRequestBmRevision}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Kirim Permintaan Revisi ke Pimpinan Cabang</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            <form onSubmit={handleSaveDecision} className="space-y-6">
              {/* Card 1: Debitur Overview & Scoring Basis */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                {/* Catatan & Atensi Khusus Dewan Manajemen */}
                {selectedApp.managementNote && (
                  <div className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 text-xs ${
                    selectedApp.managementNote.isAttention
                      ? 'border-amber-500/40 bg-amber-950/40 text-amber-200'
                      : 'border-slate-700 bg-slate-900/80 text-slate-300'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
                        <Flag className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            Atensi Khusus Dewan Manajemen
                          </span>
                          {selectedApp.managementNote.isAttention && (
                            <span className="font-mono text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 animate-pulse">
                              Prioritas Perhatian
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            ({selectedApp.managementNote.notedBy})
                          </span>
                        </div>
                        <p className="text-slate-200 text-[11px] mt-1 italic leading-relaxed">
                          "{selectedApp.managementNote.notes}"
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(selectedApp.managementNote.notedAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                )}

                {/* Branch Manager Validation Seal Badge */}
                {selectedApp.branchValidation && selectedApp.branchValidation.status === 'valid' && (
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3.5 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/30">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            Telah Divalidasi Sah oleh Branch Manager
                          </span>
                          <span className="font-mono text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/20">
                            {selectedApp.branchValidation.validatedBy} ({selectedApp.cabang})
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                          "{selectedApp.branchValidation.notes}"
                        </p>
                        {selectedApp.branchValidation.rekomendasiPlafonBM && selectedApp.branchValidation.rekomendasiPlafonBM > 0 && (
                          <p className="text-indigo-300 text-[11px] font-mono mt-1 font-semibold">
                            Rekomendasi Plafon BM: Rp {selectedApp.branchValidation.rekomendasiPlafonBM.toLocaleString('id-ID')} · Tenor: {selectedApp.branchValidation.rekomendasiTenorBM || 12} Bulan
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(selectedApp.branchValidation.validatedAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                )}

                {/* Risk Management Verification Stamp Banner on Committee Sheet */}
                {selectedApp.riskVerification ? (
                  <div
                    className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 text-xs ${
                      selectedApp.riskVerification.status === 'verified'
                        ? 'border-cyan-500/40 bg-cyan-950/35'
                        : 'border-amber-500/40 bg-amber-950/35'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 mt-0.5 border ${
                          selectedApp.riskVerification.status === 'verified'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        <BadgeCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {selectedApp.riskVerification.status === 'verified'
                              ? 'Tanda Verifikasi Manajemen Risiko: SAH / TERVERIFIKASI'
                              : 'Catatan Koreksi Manajemen Risiko (Perlu Perhatian Komite)'}
                          </span>
                          <span className="font-mono text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded bg-slate-950/80 border border-cyan-500/30">
                            {selectedApp.riskVerification.verificationCode}
                          </span>
                          <span className="text-[10px] text-slate-300">
                            ({selectedApp.riskVerification.verifiedBy})
                          </span>
                        </div>
                        <p className="text-slate-200 text-[11px] mt-1 italic leading-relaxed">
                          &ldquo;{selectedApp.riskVerification.notes}&rdquo;
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(selectedApp.riskVerification.verifiedAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                ) : (selectedApp.analystCheck?.status === 'verified_scheduled' || selectedApp.adminReview) ? (
                  <div className="rounded-xl border border-dashed border-cyan-500/35 bg-cyan-950/15 px-3.5 py-2.5 flex items-center justify-between gap-2 text-[11px] text-cyan-300">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>
                        Jadwal Sidang Komite telah diterbitkan Analis ({selectedApp.analystCheck?.committeeSchedule?.noAgenda || selectedApp.adminReview?.committeeDoc?.noNotulen || '-'}). Berkas sedang/siap diperiksa &amp; diberi tanda verifikasi oleh Divisi Manajemen Risiko.
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-cyan-400 shrink-0 font-bold">Menunggu Verifikasi Risk</span>
                  </div>
                ) : null}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      {selectedApp.applicationNumber}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                      {selectedApp.namaDebitur}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {selectedApp.jenisUsaha} · Alamat: {selectedApp.alamatDomisili}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400">Rekomendasi Sistem Skoring 5C:</span>
                    <p className="font-bold text-sm text-emerald-400">
                      {selectedApp.scoring.ratingGrade} ({selectedApp.scoring.totalScore}/100)
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Plafon Rekom: Rp {selectedApp.scoring.plafonDisarankan.toLocaleString('id-ID')} · Tenor: {selectedApp.scoring.tenorDisarankan} Bln
                    </p>
                  </div>
                </div>

                {/* Key Ratios */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-[11px] text-slate-400">Plafon Pengajuan:</span>
                    <p className="font-mono font-bold text-white mt-0.5">
                      Rp {selectedApp.financial.plafonDiajukan.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Arus Kas Bebas:</span>
                    <p className="font-mono font-bold text-emerald-400 mt-0.5">
                      Rp {selectedApp.financial.availableCashflow.toLocaleString('id-ID')}/bln
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Rasio DSR Usaha:</span>
                    <p className={`font-mono font-bold mt-0.5 ${selectedApp.financial.dsrRatio <= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {selectedApp.financial.dsrRatio}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Taksasi Agunan:</span>
                    <p className="font-mono font-bold text-emerald-400 mt-0.5">
                      Rp {selectedApp.collateral.nilaiPasarTaksasi.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Putusan Pokok Sidang Komite Pembiayaan */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Gavel className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      1. Keputusan Pokok & Struktur Pembiayaan Komite
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Matriks Persetujuan Sidang</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nomor Berita Acara / Notulen Komite
                    </label>
                    <input
                      type="text"
                      value={noNotulen}
                      onChange={(e) => setNoNotulen(e.target.value)}
                      placeholder="BA-KOM/2026/09/CRD-xxx"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono font-semibold focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Keputusan Sidang Komite <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={decision}
                      onChange={(e) => setDecision(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-bold focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="approved">Setujui Penuh (Approved)</option>
                      <option value="conditional_approval">Setujui Bersyarat (Conditional Approval)</option>
                      <option value="need_reverification">Perlu Verifikasi Lapangan Ulang / Banding</option>
                      <option value="rejected">Tolak Pengajuan (Rejected)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Plafon Putusan Komite (Rp) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step={500000}
                      value={approvedPlafon}
                      onChange={(e) => setApprovedPlafon(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Tenor Putusan (Bulan) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={approvedTenor}
                      onChange={(e) => setApprovedTenor(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Tingkat Margin / Bunga (% p.a.)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step={0.25}
                        min={0}
                        max={40}
                        value={marginBagiHasil}
                        onChange={(e) => setMarginBagiHasil(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 focus:outline-hidden pr-8"
                      />
                      <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Live installment calculation preview */}
                <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/30 p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Estimasi Angsuran Putusan Komite:</span>
                    <p className="font-mono font-extrabold text-base text-emerald-400">
                      Rp {estimasiAngsuranKomite.toLocaleString('id-ID')} / bulan
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Kapasitas Kas Bebas Debitur:</span>
                    <p className="font-mono text-white text-[11px]">
                      Rp {selectedApp.financial.availableCashflow.toLocaleString('id-ID')} (Aman ~{Math.round((estimasiAngsuranKomite / (selectedApp.financial.availableCashflow || 1)) * 100)}%)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Skema Akad Pembiayaan Syariah / Jenis Kredit
                    </label>
                    <select
                      value={skemaAkad}
                      onChange={(e) => setSkemaAkad(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="Murabahah (Jual Beli Modal Kerja/Barang)">Murabahah (Jual Beli Modal Kerja/Barang)</option>
                      <option value="Musyarakah (Bagi Hasil Kemitraan Usaha)">Musyarakah (Bagi Hasil Kemitraan Usaha)</option>
                      <option value="Mudharabah (Penyertaan Modal Produktif)">Mudharabah (Penyertaan Modal Produktif)</option>
                      <option value="Ijarah (Sewa / Manfaat Jasa)">Ijarah (Sewa / Manfaat Jasa)</option>
                      <option value="Qardh (Talangan Produktif Kebajikan)">Qardh (Talangan Produktif Kebajikan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Rekomendasi Pengikatan Agunan Komite
                    </label>
                    <input
                      type="text"
                      value={rekomendasiAgunan}
                      onChange={(e) => setRekomendasiAgunan(e.target.value)}
                      placeholder="Contoh: Pengikatan APHT Notaris, Cek Fisik ke Samsat, Blokir Tabungan..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Form Susunan Anggota Komite Pembiayaan (Bisa diisi manual Nama & Jabatan, dan bisa lebih dari 4 orang) */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-400" />
                      <div>
                        <label className="block text-slate-200 font-bold text-xs">
                          Susunan Anggota Komite Pembiayaan & Suara Putusan:
                        </label>
                        <p className="text-[10px] text-slate-400">
                          Nama & jabatan dapat diisi/diedit manual. Dapat ditambahkan lebih dari 4 orang sesuai susunan sidang komite.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-slate-800 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded-full font-bold">
                        {anggotaKomite.length} Anggota Komite
                      </span>
                      <button
                        type="button"
                        onClick={handleAddAnggota}
                        className="inline-flex items-center gap-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Anggota</span>
                      </button>
                    </div>
                  </div>

                  {/* Datalist rekomendasi jabatan komite */}
                  <datalist id="roles-komite-list">
                    <option value="Ketua Komite / Kepala Cabang" />
                    <option value="Analis Kredit / Reviewer" />
                    <option value="Risk & Compliance Officer" />
                    <option value="Komite Pembiayaan Independen" />
                    <option value="Dewan Pengawas Syariah (DPS)" />
                    <option value="Branch Manager / Kepala Cabang" />
                    <option value="Direktur Operasional" />
                    <option value="Anggota Komite Sidang" />
                  </datalist>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {anggotaKomite.map((a, idx) => (
                      <div
                        key={a.id || idx}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            Anggota #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={a.status}
                              onChange={(e) => handleUpdateAnggota(idx, 'status', e.target.value)}
                              className={`rounded border px-2 py-1 text-[11px] font-semibold transition-colors ${
                                a.status === 'Setuju Penuh'
                                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                                  : a.status === 'Setuju Bersyarat'
                                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                                  : a.status === 'Tolak'
                                  ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-200'
                              }`}
                            >
                              <option value="Setuju Penuh">Setuju Penuh</option>
                              <option value="Setuju Bersyarat">Setuju Bersyarat</option>
                              <option value="Catatan Khusus">Catatan Khusus</option>
                              <option value="Tolak">Tolak</option>
                            </select>
                            {anggotaKomite.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAnggota(idx)}
                                title="Hapus anggota komite ini"
                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Nama Anggota:</span>
                            <input
                              type="text"
                              value={a.nama}
                              onChange={(e) => handleUpdateAnggota(idx, 'nama', e.target.value)}
                              placeholder="Nama lengkap dan gelar..."
                              className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Jabatan / Peran:</span>
                            <input
                              type="text"
                              list="roles-komite-list"
                              value={a.role}
                              onChange={(e) => handleUpdateAnggota(idx, 'role', e.target.value)}
                              placeholder="Ketik atau pilih jabatan komite..."
                              className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAnggota}
                    className="w-full py-2 border border-dashed border-slate-700 hover:border-emerald-500/60 rounded-lg text-slate-300 hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-900/30 hover:bg-slate-900/60 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Tambah Anggota Komite Sidang (Bisa Diisi Lebih Dari 4 Orang)</span>
                  </button>
                </div>
              </div>

              {/* 2. Hasil Analisa 5C Komite Pembiayaan (Standar Perbankan) */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-white">
                      2. Resume Hasil Analisa Komite 5C (Prinsip Kehati-hatian)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Pertimbangan Kualitatif Komite</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      A. Analisa Character (Integritas, Kejujuran, & Reputasi)
                    </label>
                    <textarea
                      rows={2}
                      value={analisaCharacter}
                      onChange={(e) => setAnalisaCharacter(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      B. Analisa Capacity (Kemampuan Pembayaran & Arus Kas Riil)
                    </label>
                    <textarea
                      rows={2}
                      value={analisaCapacity}
                      onChange={(e) => setAnalisaCapacity(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      C. Analisa Capital (Kecukupan Modal Sendiri & Kekayaan Bersih)
                    </label>
                    <textarea
                      rows={2}
                      value={analisaCapital}
                      onChange={(e) => setAnalisaCapital(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      D. Analisa Collateral (Kelayakan, Legalitas, & Nilai Pasar Jaminan)
                    </label>
                    <textarea
                      rows={2}
                      value={analisaCollateral}
                      onChange={(e) => setAnalisaCollateral(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      E. Analisa Condition of Economy (Prospek Usaha & Risiko Pasar)
                    </label>
                    <textarea
                      rows={2}
                      value={analisaCondition}
                      onChange={(e) => setAnalisaCondition(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Syarat Preseden, Subsequen & Catatan Komite */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">
                      3. Syarat Pencairan (Preseden) & Monitoring (Subsequen)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Ketentuan & Covenants</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Syarat Preseden (Sebelum Pencairan) */}
                  <div className="space-y-2">
                    <label className="block text-slate-300 font-semibold">
                      Syarat Preseden (Wajib Dipenuhi Sebelum Realisasi Kas)
                    </label>
                    <div className="space-y-1.5">
                      {syaratPreseden.map((syarat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 rounded bg-slate-800/80 border border-slate-700/80 px-2.5 py-1.5"
                        >
                          <span className="text-slate-200 text-[11px] leading-tight">
                            {idx + 1}. {syarat}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSyaratPreseden(idx)}
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newSyaratPreseden}
                        onChange={(e) => setNewSyaratPreseden(e.target.value)}
                        placeholder="Tambah syarat preseden..."
                        className="flex-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddSyaratPreseden}
                        className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Syarat Subsequen (Monitoring) */}
                  <div className="space-y-2">
                    <label className="block text-slate-300 font-semibold">
                      Syarat Subsequen (Kewajiban Setelah Realisasi Pembiayaan)
                    </label>
                    <div className="space-y-1.5">
                      {syaratSubsequen.map((syarat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 rounded bg-slate-800/80 border border-slate-700/80 px-2.5 py-1.5"
                        >
                          <span className="text-slate-200 text-[11px] leading-tight">
                            {idx + 1}. {syarat}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSyaratSubsequen(idx)}
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newSyaratSubsequen}
                        onChange={(e) => setNewSyaratSubsequen(e.target.value)}
                        placeholder="Tambah syarat monitoring..."
                        className="flex-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddSyaratSubsequen}
                        className="rounded bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-500"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Catatan Akhir Komite & Rangkuman Pertimbangan Khusus Pembiayaan
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tuliskan pertimbangan final komite, mitigasi jika ada penurunan kondisi usaha..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-3 text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 4. Perintah & Instruksi Pencairan untuk Admin Cabang (Disbursement Order) */}
              {(decision === 'approved' || decision === 'conditional_approval') && (
                <div className="rounded-xl border border-teal-500/40 bg-teal-950/20 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-teal-500/30 pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-teal-400" />
                      <h3 className="text-sm font-bold text-white">
                        4. Perintah & Instruksi Pencairan untuk Admin Cabang
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-500/30">
                      Penerima Perintah: Admin Cabang
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Perintah ini akan diteruskan ke <strong className="text-white">Admin Cabang</strong> untuk menindaklanjuti proses pengikatan agunan notaris dan realisasi pencairan dana ke debitur sesuai nominal yang disepakati di komite.
                  </p>

                  <div className="space-y-4 text-xs">
                    {/* 1. Nominal yang Disepakati di Komite */}
                    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-0.5">
                            Nominal yang Disepakati di Komite (Plafon Cair):
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Disinkronkan dengan putusan sidang komite pembiayaan.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-extrabold text-emerald-400 font-mono">
                            Rp {approvedPlafon.toLocaleString('id-ID')}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Tenor {approvedTenor} Bulan · Margin {marginBagiHasil}% p.a. (Rp {estimasiAngsuranKomite.toLocaleString('id-ID')}/bln)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Pilihan Jenis Agunan */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-slate-300 font-semibold">
                          Pilihan Jenis Agunan yang Diikat: <span className="text-rose-400">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Dari data survey: <strong className="text-teal-400">{selectedApp.collateral.jenisJaminan}</strong> (No: {selectedApp.collateral.nomorDokumen || '-'})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          'Tanah & Bangunan (SHM / SHGB)',
                          'Kendaraan Bermotor (BPKB Motor)',
                          'Kendaraan Bermotor (BPKB Mobil)',
                          'AJB / Girik / Letter C',
                          'Deposito / Tabungan Berjangka',
                          'Mesin / Peralatan Usaha',
                        ].map((agunan) => {
                          const isChecked = selectedJenisAgunan.includes(agunan);
                          return (
                            <button
                              key={agunan}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedJenisAgunan((prev) =>
                                    prev.filter((item) => item !== agunan)
                                  );
                                } else {
                                  setSelectedJenisAgunan((prev) => [...prev, agunan]);
                                }
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                                isChecked
                                  ? 'border-teal-500 bg-teal-950/60 text-teal-200'
                                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              <span className="text-[11px] font-medium">{agunan}</span>
                              {isChecked && <Check className="h-3.5 w-3.5 text-teal-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom input jika ada jenis agunan lain */}
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={customJenisAgunan}
                          onChange={(e) => setCustomJenisAgunan(e.target.value)}
                          placeholder="Tambah jenis agunan spesifik lainnya..."
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customJenisAgunan.trim() && !selectedJenisAgunan.includes(customJenisAgunan.trim())) {
                              setSelectedJenisAgunan((prev) => [...prev, customJenisAgunan.trim()]);
                              setCustomJenisAgunan('');
                            }
                          }}
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 transition-colors"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>

                    {/* 3. Pilihan Jenis Pengikatan Agunan (Bisa Memilih Lebih dari 1 Sesuai Agunan) */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <label className="block text-slate-200 font-semibold text-xs">
                          Pilihan Jenis Pengikatan Agunan (Bisa Pilih Lebih dari 1): <span className="text-rose-400">*</span>
                        </label>
                        <span className="text-[10px] text-teal-300 font-mono bg-teal-950/70 border border-teal-500/30 px-2 py-0.5 rounded">
                          Terpilih: {selectedJenisPengikatan.join(' + ')}
                        </span>
                      </div>

                      {/* Info Portofolio Agunan Debitur untuk Membantu Pengikatan */}
                      {selectedApp.collaterals && selectedApp.collaterals.length > 0 && (
                        <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Portofolio Agunan Debitur ({selectedApp.collaterals.length} Agunan):
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {selectedApp.collaterals.map((c, i) => (
                                <span
                                  key={c.id || i}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700"
                                >
                                  <strong>#{i + 1}</strong> {c.jenisJaminan} ({c.nomorDokumen || '-'})
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const autoDetected: string[] = [];
                              selectedApp.collaterals?.forEach((c) => {
                                const j = c.jenisJaminan || '';
                                if (j.includes('SHM') || j.includes('AJB')) {
                                  if (!autoDetected.includes('APHT')) autoDetected.push('APHT');
                                } else if (j.includes('BPKB')) {
                                  if (!autoDetected.includes('Fidusia')) autoDetected.push('Fidusia');
                                } else if (j.includes('Tabungan') || j.includes('Deposito')) {
                                  if (!autoDetected.includes('Internal BMT (Gadai Syariah / Rahn)')) {
                                    autoDetected.push('Internal BMT (Gadai Syariah / Rahn)');
                                  }
                                }
                              });
                              if (autoDetected.length > 0) {
                                setSelectedJenisPengikatan(autoDetected);
                              }
                            }}
                            className="shrink-0 text-[10px] font-semibold text-teal-300 hover:text-teal-200 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-500/30 px-2 py-1 rounded transition-colors"
                          >
                            ⚡ Sinkron Otomatis Semua Agunan
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {[
                          {
                            key: 'APHT',
                            title: 'APHT (Hak Tanggungan)',
                            desc: 'Akta Pemberian Hak Tanggungan untuk tanah & bangunan (SHM/HGB) via PPAT.',
                            badge: 'Rekomendasi Tanah/SHM',
                          },
                          {
                            key: 'Fidusia',
                            title: 'Jaminan Fidusia',
                            desc: 'Pengikatan benda bergerak (BPKB kendaraan, mesin usaha) terdaftar Kemenkumham.',
                            badge: 'Rekomendasi BPKB/Mesin',
                          },
                          {
                            key: 'SKMHT',
                            title: 'SKMHT',
                            desc: 'Surat Kuasa Membebankan Hak Tanggungan sebelum didaftarkan APHT penuh.',
                            badge: 'Proses Bertahap',
                          },
                          {
                            key: 'Bawah Tangan & Legalisasi Notaris',
                            title: 'Bawah Tangan & Legalisasi',
                            desc: 'Perjanjian pengikatan dengan legalisasi / waarmerking notaris rekanan.',
                            badge: 'Plafon Mikro',
                          },
                          {
                            key: 'Internal BMT (Gadai Syariah / Rahn)',
                            title: 'Gadai Syariah (Rahn BMT)',
                            desc: 'Penyimpanan fisik asli di khazanah BMT tanpa akta notaris luar.',
                            badge: 'Internal BMT',
                          },
                          {
                            key: 'Cessie & Surat Kuasa Menjual',
                            title: 'Cessie / Kuasa Menjual',
                            desc: 'Pengalihan piutang / kuasa jual notariil sebagai agunan pendamping.',
                            badge: 'Agunan Tambahan',
                          },
                        ].map((option) => {
                          const isSelected = selectedJenisPengikatan.includes(option.key);
                          return (
                            <div
                              key={option.key}
                              onClick={() => toggleJenisPengikatan(option.key)}
                              className={`cursor-pointer rounded-xl border p-3 transition-all flex flex-col justify-between select-none ${
                                isSelected
                                  ? 'border-teal-500 bg-teal-950/60 shadow-sm ring-1 ring-teal-500/40'
                                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isSelected ? (
                                      <CheckSquare className="h-4 w-4 text-teal-400 shrink-0" />
                                    ) : (
                                      <Square className="h-4 w-4 text-slate-500 shrink-0" />
                                    )}
                                    <span className={`font-bold text-xs ${isSelected ? 'text-teal-300' : 'text-white'}`}>
                                      {option.title}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <span className="text-[9px] font-bold text-teal-400 bg-teal-950 px-1 rounded border border-teal-500/30">
                                      Terpilih
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug pl-6">
                                  {option.desc}
                                </p>
                              </div>
                              <div className="pl-6 mt-2">
                                <span className="inline-block font-mono text-[9px] text-teal-400 bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-500/20 w-fit">
                                  {option.badge}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Pilihan Isian Notaris yang Dipakai (Pilihan Cepat Bisa Diedit atau Dihapus) */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <label className="text-slate-300 font-semibold text-xs">
                            Notaris / PPAT yang Dipakai: <span className="text-rose-400">*</span>
                          </label>
                          <span className="text-[10px] text-slate-400 block">
                            Pilihan cepat dapat di-klik untuk memilih, di-edit namanya, atau dihapus jika tidak digunakan.
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsAddingPreset((prev) => !prev)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-300 bg-teal-950/80 border border-teal-500/30 px-2 py-0.5 rounded hover:bg-teal-900/80 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Tambah Notaris Cepat</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleResetNotarisPresets}
                            title="Reset daftar pilihan cepat notaris ke default"
                            className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Reset</span>
                          </button>
                        </div>
                      </div>

                      {/* Form Tambah Notaris Cepat Baru */}
                      {isAddingPreset && (
                        <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-teal-500/30">
                          <input
                            type="text"
                            value={newPresetVal}
                            onChange={(e) => setNewPresetVal(e.target.value)}
                            placeholder="Ketik nama Notaris/PPAT rekanan baru..."
                            className="flex-1 rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-hidden"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddPreset();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleAddPreset}
                            className="rounded bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-500 transition-colors"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingPreset(false);
                              setNewPresetVal('');
                            }}
                            className="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Batal
                          </button>
                        </div>
                      )}

                      {/* Quick Pick Presets with Edit & Delete */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-mono">Pilih Cepat:</span>
                        {notarisPresets.length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic">
                            Belum ada notaris tersimpan. Klik "+ Tambah Notaris Cepat" di atas.
                          </span>
                        ) : (
                          notarisPresets.map((notarisName, idx) => {
                            const isSelected = notarisPpats.trim().toLowerCase() === notarisName.trim().toLowerCase();
                            const isEditingThis = editingPresetIdx === idx;

                            if (isEditingThis) {
                              return (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-1 bg-slate-900 border border-teal-500/40 rounded px-1.5 py-0.5"
                                >
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editingPresetVal}
                                    onChange={(e) => setEditingPresetVal(e.target.value)}
                                    className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[11px] text-white w-48 focus:border-teal-400 focus:outline-hidden"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveEditPreset();
                                      } else if (e.key === 'Escape') {
                                        setEditingPresetIdx(null);
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleSaveEditPreset}
                                    title="Simpan perubahan nama notaris"
                                    className="p-1 rounded text-teal-400 hover:bg-teal-950"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPresetIdx(null)}
                                    title="Batal edit"
                                    className="p-1 rounded text-slate-400 hover:bg-slate-800"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={idx}
                                className={`inline-flex items-center rounded text-[10px] border transition-colors ${
                                  isSelected
                                    ? 'bg-teal-950 text-teal-300 border-teal-500/50 shadow-xs'
                                    : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setNotarisPpats(notarisName)}
                                  className="px-2 py-1 text-left hover:text-white flex items-center gap-1 font-medium"
                                  title={`Pilih ${notarisName}`}
                                >
                                  {isSelected && <Check className="h-3 w-3 text-teal-400 shrink-0" />}
                                  <span>{notarisName.split(',')[0]}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleStartEditPreset(idx, e)}
                                  title="Edit nama pilihan cepat ini"
                                  className="px-1 py-1 text-slate-400 hover:text-amber-300 hover:bg-slate-700/60 border-l border-slate-700 transition-colors"
                                >
                                  <Edit2 className="h-2.5 w-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeletePreset(idx, e)}
                                  title="Hapus pilihan cepat ini"
                                  className="px-1 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 border-l border-slate-700 transition-colors"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        value={notarisPpats}
                        onChange={(e) => setNotarisPpats(e.target.value)}
                        placeholder="Ketik nama dan alamat kantor Notaris/PPAT yang ditunjuk..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-hidden text-xs"
                      />
                    </div>

                    {/* 5. Catatan / Pengantar Penting Terkait Pencairan */}
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Pengantar Penting Terkait Pencairan (Instruksi untuk Admin Cabang): <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={pengantarPencairan}
                        onChange={(e) => setPengantarPencairan(e.target.value)}
                        placeholder="Contoh: Debitur wajib hadir bersama pasangan sah di hadapan Notaris rekanan. Lakukan verifikasi fisik keabsahan dokumen agunan asli sebelum dana ditransfer ke rekening debitur..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white focus:border-teal-500 focus:outline-hidden leading-relaxed"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Catatan ini akan langsung ditampilkan secara menonjol pada workspace Admin Cabang saat menerima berkas pencairan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Upload Foto Dokumentasi Hasil Sidang Komite (File & Camera Support) */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      4. Dokumentasi Foto Sidang Komite & Berita Acara Fisik
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Bukti Verifikasi & Arsip Resmi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Foto 1: Risalah Rapat Komite */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-white">1. Risalah / Berita Acara</p>
                        <span className="text-[10px] text-emerald-400 font-mono">Lampiran A</span>
                      </div>
                      <div
                        onClick={() => fotoRisalah && setPreviewImage({ url: fotoRisalah, title: 'Foto Risalah / Berita Acara Komite' })}
                        className="aspect-[4/3] w-full rounded-md bg-slate-800 overflow-hidden relative border border-slate-700 cursor-pointer group"
                      >
                        {fotoRisalah ? (
                          <>
                            <img
                              src={fotoRisalah}
                              alt="Foto Risalah Komite"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500 text-xs">
                            Belum Ada Foto
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openCamera('risalah', 'Ambil Foto Risalah Sidang', 'Arahkan kamera ke lembar fisik Berita Acara Rapat Komite yang telah ditandatangani.')}
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Kamera</span>
                        </button>

                        <input
                          type="file"
                          accept="image/*"
                          id="upload-risalah"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, 'risalah')}
                        />
                        <label
                          htmlFor="upload-risalah"
                          className="flex-1 flex items-center justify-center gap-1 cursor-pointer rounded bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload</span>
                        </label>
                      </div>

                      {fotoRisalah && (
                        <button
                          type="button"
                          onClick={() => setFotoRisalah('')}
                          className="w-full text-center text-[10px] text-slate-500 hover:text-rose-400 py-0.5"
                        >
                          Hapus Foto Ini
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Foto 2: Sidang Komite / Peserta */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-white">2. Sidang / Peserta Rapat</p>
                        <span className="text-[10px] text-sky-400 font-mono">Lampiran B</span>
                      </div>
                      <div
                        onClick={() => fotoSidangKomite && setPreviewImage({ url: fotoSidangKomite, title: 'Foto Dokumentasi Sidang Komite' })}
                        className="aspect-[4/3] w-full rounded-md bg-slate-800 overflow-hidden relative border border-slate-700 cursor-pointer group"
                      >
                        {fotoSidangKomite ? (
                          <>
                            <img
                              src={fotoSidangKomite}
                              alt="Foto Sidang Komite"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500 text-xs">
                            Belum Ada Foto
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openCamera('sidang', 'Ambil Foto Sidang Komite', 'Potret suasana fisik rapat komite atau peserta komite pembiayaan yang hadir.')}
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-sky-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-sky-500 transition-colors"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Kamera</span>
                        </button>

                        <input
                          type="file"
                          accept="image/*"
                          id="upload-sidang"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, 'sidang')}
                        />
                        <label
                          htmlFor="upload-sidang"
                          className="flex-1 flex items-center justify-center gap-1 cursor-pointer rounded bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload</span>
                        </label>
                      </div>

                      {fotoSidangKomite && (
                        <button
                          type="button"
                          onClick={() => setFotoSidangKomite('')}
                          className="w-full text-center text-[10px] text-slate-500 hover:text-rose-400 py-0.5"
                        >
                          Hapus Foto Ini
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Foto 3: Pengesahan & Tanda Tangan Basah */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-white">3. Tanda Tangan Basah</p>
                        <span className="text-[10px] text-amber-400 font-mono">Lampiran C</span>
                      </div>
                      <div
                        onClick={() => fotoPengesahan && setPreviewImage({ url: fotoPengesahan, title: 'Foto Lembar Tanda Tangan Pengesahan Basah' })}
                        className="aspect-[4/3] w-full rounded-md bg-slate-800 overflow-hidden relative border border-slate-700 cursor-pointer group"
                      >
                        {fotoPengesahan ? (
                          <>
                            <img
                              src={fotoPengesahan}
                              alt="Foto Pengesahan"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500 text-xs">
                            Belum Ada Foto
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openCamera('pengesahan', 'Ambil Foto Tanda Tangan Basah', 'Posisikan kamera ke kolom tanda tangan basah dan cap stempel resmi komite.')}
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-amber-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-amber-500 transition-colors"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Kamera</span>
                        </button>

                        <input
                          type="file"
                          accept="image/*"
                          id="upload-pengesahan"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, 'pengesahan')}
                        />
                        <label
                          htmlFor="upload-pengesahan"
                          className="flex-1 flex items-center justify-center gap-1 cursor-pointer rounded bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload</span>
                        </label>
                      </div>

                      {fotoPengesahan && (
                        <button
                          type="button"
                          onClick={() => setFotoPengesahan('')}
                          className="w-full text-center text-[10px] text-slate-500 hover:text-rose-400 py-0.5"
                        >
                          Hapus Foto Ini
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Waktu Pelaksanaan Sidang</label>
                    <input
                      type="datetime-local"
                      value={waktuSidang}
                      onChange={(e) => setWaktuSidang(e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Lokasi Ruang Sidang</label>
                    <input
                      type="text"
                      value={lokasiSidang}
                      onChange={(e) => setLokasiSidang(e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Verifikasi Manajemen Risiko pada Form Saat Sidang Komite Berlangsung */}
              <div
                className={`rounded-xl border p-4 space-y-2.5 ${
                  selectedApp.riskVerification
                    ? selectedApp.riskVerification.status === 'verified'
                      ? 'border-cyan-500/45 bg-cyan-950/30'
                      : 'border-amber-500/45 bg-amber-950/30'
                    : 'border-dashed border-slate-700 bg-slate-900/50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BadgeCheck
                      className={`h-5 w-5 ${
                        selectedApp.riskVerification
                          ? selectedApp.riskVerification.status === 'verified'
                            ? 'text-cyan-400'
                            : 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <h4 className="text-xs sm:text-sm font-extrabold text-white">
                      Status Verifikasi &amp; Catatan Koreksi Manajemen Risiko (Form Sidang Komite)
                    </h4>
                  </div>

                  {selectedApp.riskVerification ? (
                    <span
                      className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                        selectedApp.riskVerification.status === 'verified'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {selectedApp.riskVerification.status === 'verified'
                        ? `✓ TERVERIFIKASI SAH · ${selectedApp.riskVerification.verificationCode}`
                        : `! CATATAN KOREKSI RISIKO · ${selectedApp.riskVerification.verificationCode}`}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      BELUM DIVERIFIKASI MANAJEMEN RISIKO
                    </span>
                  )}
                </div>

                {selectedApp.riskVerification ? (
                  <div className="text-xs text-slate-200 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                      <span>
                        Pejabat Manajemen Risiko:{' '}
                        <strong className="text-white">{selectedApp.riskVerification.verifiedBy}</strong>
                      </span>
                      <span className="font-mono text-slate-400">
                        Diverifikasi: {new Date(selectedApp.riskVerification.verifiedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[11px] italic text-slate-100 leading-relaxed">
                      &ldquo;{selectedApp.riskVerification.notes || 'Tidak ada catatan tambahan.'}&rdquo;
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {selectedApp.analystCheck?.status === 'verified_scheduled'
                      ? 'Berkas sudah dijadwalkan komite. Menunggu Divisi Manajemen Risiko melakukan pemeriksaan read-only dan memberikan tanda verifikasi agar stempel verifikasi tampil di lembar komite ini.'
                      : 'Jadwalkan sidang komite terlebih dahulu pada panel Tahap Pemeriksaan Analis di atas agar Divisi Manajemen Risiko dapat memeriksa data dan memberikan tanda verifikasi.'}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-5 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Sahkan Putusan Sidang Komite Pembiayaan</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Keputusan resmi akan langsung mengupdate status berkas, menerbitkan Berita Acara Komite, dan memicu notifikasi ke marketing.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => printApplicationReport(selectedApp)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Printer className="h-4 w-4 text-sky-400" />
                    <span>Cetak PDF</span>
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Simpan & Sahkan Putusan</span>
                  </button>
                </div>
              </div>
            </form>
            </>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500 text-xs">
              Pilih salah satu berkas pengajuan kredit di bilah kiri untuk membuka ruang sidang komite pembiayaan.
            </div>
          )}
        </div>
      </div>

      {/* Camera Capture Modal */}
      <DocumentCameraCapture
        isOpen={cameraConfig.isOpen}
        onClose={() => setCameraConfig((prev) => ({ ...prev, isOpen: false }))}
        onCapture={handleCameraCaptureConfirm}
        documentType="general"
        documentTitle={cameraConfig.title}
        documentDescription={cameraConfig.description}
      />

      {/* Image Preview Zoom Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950">
              <span className="text-xs font-bold text-white">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center flex-1 bg-black/60">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
