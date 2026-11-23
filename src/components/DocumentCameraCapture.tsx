import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  Check,
  Upload,
  AlertCircle,
  FileText,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

interface DocumentCameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  documentType: 'ktp' | 'income' | 'general';
  documentTitle: string;
  documentDescription?: string;
}

export const DocumentCameraCapture: React.FC<DocumentCameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  documentType,
  documentTitle,
  documentDescription,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Use ref for active MediaStream so startCamera/stopCamera maintain stable references
  // and never re-trigger useEffect in an infinite camera restart loop (which shakes mobile screens).
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<number>(0);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Stop camera tracks cleanly without triggering React re-render loops
  const stopCamera = useCallback(() => {
    sessionIdRef.current += 1;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {
        // ignore video cleanup error
      }
    }
    setIsVideoReady(false);
  }, []);

  // Start device camera with progressive constraint fallback for mobile compatibility
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    // Stop any previous stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    const currentSessionId = ++sessionIdRef.current;
    setIsInitializing(true);
    setIsVideoReady(false);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser atau perangkat tidak mendukung akses kamera langsung.');
      }

      const constraintCandidates: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: facing,
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let newStream: MediaStream | null = null;
      let lastError: any = null;

      for (const constraints of constraintCandidates) {
        try {
          newStream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err: any) {
          lastError = err;
          // If permission was explicitly denied, do not retry fallback constraints
          if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
            throw err;
          }
        }
      }

      if (!newStream) {
        throw lastError || new Error('Kamera tidak tersedia.');
      }

      // If modal closed or another camera request superseded this one while waiting, release immediately
      if (sessionIdRef.current !== currentSessionId) {
        newStream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = newStream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = newStream;
        video.setAttribute('playsinline', 'true');
        video.muted = true;

        try {
          await video.play();
        } catch {
          // Some mobile browsers defer play until metadata is loaded
        }

        if (video.readyState >= 2 && video.videoWidth > 0) {
          setIsVideoReady(true);
        }
      }
    } catch (err: any) {
      if (sessionIdRef.current !== currentSessionId) return;
      console.warn('Camera access error:', err);
      let errorMsg = 'Tidak dapat mengakses kamera perangkat.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errorMsg =
          'Izin kamera ditolak. Berikan izin kamera di browser Anda atau gunakan tombol Kamera HP / Galeri di bawah.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        errorMsg = 'Kamera tidak terdeteksi pada perangkat ini. Silakan gunakan tombol Kamera HP / Galeri.';
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        errorMsg =
          'Kamera sedang digunakan aplikasi lain atau terkunci sementara. Tutup aplikasi lain atau gunakan tombol Kamera HP.';
      }
      setCameraError(errorMsg);
    } finally {
      if (sessionIdRef.current === currentSessionId) {
        setIsInitializing(false);
      }
    }
  }, []);

  // Lifecycle when modal opens/closes or facingMode changes
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera(facingMode);
    } else {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  // Toggle front/back camera cleanly via state change (effect handles restart once)
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Helper to downscale and compress image for fast upload & Firestore 1MB optimization
  const compressImage = (dataUrl: string, maxDim = 720, quality = 0.58): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Capture snapshot from live video stream
  const handleCaptureSnapshot = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      // Fallback: if live stream frame isn't ready yet, open native mobile camera / file picker
      fileInputRef.current?.click();
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const compressed = await compressImage(rawDataUrl, 720, 0.58);
    setCapturedImage(compressed);

    // Pause stream while reviewing captured photo
    stopCamera();
  };

  // Native mobile camera / file picker upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so selecting the same photo or retaking works every time
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;
      const compressed = await compressImage(rawDataUrl, 720, 0.58);
      setCapturedImage(compressed);
      setCameraError(null);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  const canSnap = !isInitializing && !cameraError && isVideoReady;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95">
      {/* Hidden file input for native mobile camera / gallery fallback */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Container */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              {documentType === 'ktp' ? (
                <CreditCard className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">{documentTitle}</h3>
              <p className="text-[11px] text-slate-400 truncate">
                {documentDescription ||
                  (documentType === 'ktp'
                    ? 'Posisikan KTP di dalam bingkai panduan'
                    : 'Pastikan bukti dokumen terlihat jelas')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Tutup Kamera"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Body with fixed stable height on mobile to avoid layout jitter */}
        <div className="relative w-full h-[54vh] min-h-[300px] max-h-[480px] sm:h-[440px] bg-black overflow-hidden flex items-center justify-center">
          {/* Active Live Video Stream */}
          {!capturedImage && !cameraError && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => setIsVideoReady(true)}
                onCanPlay={() => setIsVideoReady(true)}
                onPlaying={() => setIsVideoReady(true)}
                className="w-full h-full object-cover"
              />

              {/* Document Alignment Overlay (Viewfinder) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 sm:p-6">
                {documentType === 'ktp' ? (
                  <div className="w-full max-w-md aspect-[1.58/1] rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative flex flex-col justify-between p-3 sm:p-4">
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                    <div className="flex items-center justify-between opacity-50">
                      <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
                        REPUBLIK INDONESIA - KTP
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="bg-black/65 px-2.5 py-1 rounded text-[10px] sm:text-[11px] font-medium text-emerald-300">
                        Sesuaikan batas fisik KTP ke bingkai hijau
                      </span>
                    </div>

                    <div className="flex justify-between items-end opacity-40 text-[9px] font-mono text-emerald-200">
                      <span>[ NIK & NAMA ]</span>
                      <span>[ PAS FOTO ]</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-md aspect-[4/3] rounded-xl border-2 border-sky-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative flex flex-col justify-between p-3 sm:p-4">
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-sky-400" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-sky-400" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-sky-400" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-sky-400" />

                    <div className="text-center mt-2">
                      <span className="bg-black/65 px-2.5 py-1 rounded text-[10px] sm:text-[11px] font-medium text-sky-300">
                        Posisikan dokumen di dalam bingkai biru
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status / Loading Badge */}
              {(isInitializing || !isVideoReady) && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/85 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  <span>Menyiapkan kamera...</span>
                </div>
              )}
            </>
          )}

          {/* Captured Image Review State */}
          {capturedImage && (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 relative">
              <img
                src={capturedImage}
                alt="Pratinjau Hasil Foto"
                className="max-h-full w-auto max-w-full rounded-lg object-contain border border-slate-700 shadow-xl"
              />
              <div className="absolute top-3 right-3 bg-emerald-950/85 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-md text-xs font-semibold">
                Foto Berhasil Diambil
              </div>
            </div>
          )}

          {/* Error / Fallback State */}
          {cameraError && !capturedImage && (
            <div className="p-5 text-center max-w-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Akses Kamera Langsung Terkendala</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{cameraError}</p>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                >
                  <Upload className="h-4 w-4" />
                  <span>Buka Kamera HP / Pilih Galeri</span>
                </button>

                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Coba Lagi Kamera Browser</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="border-t border-slate-800 bg-slate-900 px-4 sm:px-5 py-3.5 shrink-0">
          {!capturedImage ? (
            <div className="flex items-center justify-between gap-2">
              {/* Native Mobile Camera / Gallery Button (always labeled on mobile) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-[11px] sm:text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
                title="Ambil Foto dengan Kamera Bawaan HP atau Pilih dari Galeri"
              >
                <Upload className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Kamera HP</span>
              </button>

              {/* Big Circular Shutter Button */}
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={!canSnap}
                className="group relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-300 bg-white shadow-lg active:scale-90 transition-transform disabled:opacity-40 shrink-0"
                aria-label="Ambil Foto Dokumen"
              >
                <div className="h-12 w-12 rounded-full bg-slate-900 transition-transform group-hover:scale-95 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>

              {/* Flip Camera Button */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                disabled={isInitializing}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-[11px] sm:text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
                title="Putar Kamera Depan/Belakang"
              >
                <RotateCcw className="h-4 w-4 text-slate-300 shrink-0" />
                <span>{facingMode === 'environment' ? 'Belakang' : 'Depan'}</span>
              </button>
            </div>
          ) : (
            /* Review Actions */
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Foto Ulang</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 sm:px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md"
              >
                <Check className="h-4 w-4" />
                <span>Gunakan Foto Ini</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
