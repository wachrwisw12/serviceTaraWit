import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw, Check, Loader2, SwitchCamera, Crop } from "lucide-react";
import ImageCrop from "./ImageCrop";

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

/**
 * CameraCapture — เปิดกล้องอุปกรณ์ ถ่ายรูป และส่ง File กลับ
 *
 * ปรับ responsive สำหรับมือถือ:
 *  - ปุ่มใหญ่足够นิ้วโป้ง (min 48px touch target)
 *  - ใช้ safe-area-inset สำหรับจอตัด
 *  - Video constraints ปรับตามขนาดจอ
 *  - ซ่อน grid lines บนจอเล็ก
 *  - ปุ่มสลับกล้องหน้า/หลัง
 */
export default function CameraCapture({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<"live" | "preview" | "sending">("live");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");

  // crop mode
  const [cropMode, setCropMode] = useState(false);

  // ─── ขนาดจอ ───
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const check = () => setIsSmallScreen(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── เริ่มกล้อง ───
  const startCamera = useCallback(
    async (facingMode?: "environment" | "user") => {
      setError(null);
      setPhase("live");
      setPreviewUrl(null);

      const mode = facingMode ?? facing;

      // ปรับ constraints ตามขนาดจอ
      const widthConstraint = isSmallScreen
        ? { ideal: 1280 }
        : { ideal: 1920 };
      const heightConstraint = isSmallScreen
        ? { ideal: 720 }
        : { ideal: 1080 };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: widthConstraint,
            height: heightConstraint,
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setFacing(mode);
      } catch {
        // ลองกล้องอีกฝั่ง
        const fallback = mode === "environment" ? "user" : "environment";

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: fallback,
              width: widthConstraint,
              height: heightConstraint,
            },
            audio: false,
          });

          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }

          setFacing(fallback);
        } catch {
          setError(
            "ไม่สามารถเข้าถึงกล้องได้\nกรุณาตรวจสอบสิทธิ์กล้องในการตั้งค่าเบราว์เซอร์",
          );
        }
      }
    },
    [facing, isSmallScreen],
  );

  // ─── หยุดกล้อง ───
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ─── สลับกล้อง ───
  const switchCamera = useCallback(() => {
    stopCamera();
    const newFacing = facing === "environment" ? "user" : "environment";
    startCamera(newFacing);
  }, [facing, startCamera, stopCamera]);

  // ─── เปิด/ปิด ───
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setPhase("live");
      setPreviewUrl(null);
      setError(null);
    }

    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // ─── ถ่ายรูป ───
  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        // สร้างชื่อไฟล์ timestamp
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

        const file = new File([blob], `camera_${ts}.jpg`, {
          type: "image/jpeg",
        });

        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPhase("preview");

        // เก็บ file ไว้ใน data attribute ชั่วคราว
        // เราจะใช้ closure แทน
        (window as unknown as Record<string, unknown>).__cameraCapturedFile = file;
      },
      "image/jpeg",
      0.92,
    );
  }, []);

  // ─── ยืนยันส่ง ───
  const confirmCapture = useCallback(async () => {
    const file = (window as unknown as Record<string, unknown>).__cameraCapturedFile as
      | File
      | undefined;

    if (!file) return;

    setPhase("sending");

    // เล็กน้อยให้ UI update
    await new Promise((r) => setTimeout(r, 100));

    onCapture(file);

    // cleanup
    delete (window as unknown as Record<string, unknown>).__cameraCapturedFile;
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPhase("live");
    setPreviewUrl(null);
  }, [onCapture, previewUrl]);

  // ─── ถ่ายใหม่ ───
  const retake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhase("live");

    delete (window as unknown as Record<string, unknown>).__cameraCapturedFile;
  }, [previewUrl]);

  // ─── ปิด ───
  const handleClose = useCallback(() => {
    delete (window as unknown as Record<string, unknown>).__cameraCapturedFile;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onClose();
  }, [onClose, previewUrl]);

  // ─── ยืนยัน crop ───
  const handleCropConfirm = useCallback(
    (croppedFile: File) => {
      setCropMode(false);

      // ลบตัวเก่า
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      delete (window as unknown as Record<string, unknown>).__cameraCapturedFile;

      // ใช้ไฟล์ crop ใหม่
      const url = URL.createObjectURL(croppedFile);
      setPreviewUrl(url);
      (window as unknown as Record<string, unknown>).__cameraCapturedFile = croppedFile;
    },
    [previewUrl],
  );

  const handleCropCancel = useCallback(() => {
    setCropMode(false);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black">
      {/* Header */}
      <header
        className="flex items-center justify-between bg-black/80 px-4 py-3 backdrop-blur-sm sm:px-6"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <h3 className="text-sm font-medium text-white sm:text-base">
          {phase === "live" && "เปิดกล้อง"}
          {phase === "preview" && "ดูตัวอย่าง"}
          {phase === "sending" && "กำลังแนบไฟล์..."}
        </h3>

        <div className="flex items-center gap-2">
          {/* ปุ่มสลับกล้อง - แสดงเฉพาะตอน live */}
          {phase === "live" && (
            <button
              type="button"
              onClick={switchCamera}
              aria-label="สลับกล้อง"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30 sm:h-9 sm:w-9"
            >
              <SwitchCamera className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            disabled={phase === "sending"}
            aria-label="ปิดกล้อง"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30 disabled:opacity-50 sm:h-9 sm:w-9"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 sm:h-16 sm:w-16">
              <Camera className="h-10 w-10 text-gray-500 sm:h-8 sm:w-8" />
            </div>
            <p className="max-w-xs whitespace-pre-line text-sm leading-relaxed text-gray-300">
              {error}
            </p>
            <button
              type="button"
              onClick={() => startCamera()}
              className="mt-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20 active:bg-white/30"
            >
              ลองใหม่
            </button>
          </div>
        ) : phase === "live" ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {/* Grid lines - ซ่อนบนจอเล็ก */}
            <div className="pointer-events-none absolute inset-0 hidden sm:block">
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
              <div className="absolute top-1/3 left-0 h-px w-full bg-white/20" />
              <div className="absolute top-2/3 left-0 h-px w-full bg-white/20" />
            </div>
            {/* Corner guides สำหรับมือถือ */}
            <div className="absolute inset-4 sm:hidden">
              <div className="absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2 border-white/40" />
              <div className="absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 border-white/40" />
              <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-white/40" />
              <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white/40" />
            </div>
          </>
        ) : (
          /* preview / sending */
          previewUrl && (
            <img
              src={previewUrl}
              alt="ตัวอย่างรูปที่ถ่าย"
              className="h-full w-full object-contain"
            />
          )
        )}

        {/* hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* ImageCrop overlay */}
      {cropMode && previewUrl && (
        <ImageCrop
          imageFile={
            ((window as unknown as Record<string, unknown>).__cameraCapturedFile as File) ??
            new File([], "unknown.jpg", { type: "image/jpeg" })
          }
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* Footer */}
      <footer
        className="flex items-center justify-center gap-8 bg-black/80 px-6 pb-6 pt-4 backdrop-blur-sm sm:gap-10 sm:pb-8 sm:pt-5"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        {phase === "live" && (
          <button
            type="button"
            onClick={capture}
            disabled={!!error}
            aria-label="ถ่ายรูป"
            className="group relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-white transition-all active:scale-95 disabled:opacity-40 sm:h-16 sm:w-16 sm:border-4"
          >
            <div className="h-[60px] w-[60px] rounded-full bg-white transition-transform group-hover:scale-95 group-active:scale-90 sm:h-12 sm:w-12" />
          </button>
        )}

        {phase === "preview" && (
          <>
            <button
              type="button"
              onClick={retake}
              aria-label="ถ่ายใหม่"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30 sm:h-[60px] sm:w-[60px]"
            >
              <RotateCcw className="h-6 w-6" />
            </button>

            {/* ปุ่ม crop */}
            <button
              type="button"
              onClick={() => setCropMode(true)}
              aria-label="ตัด/หมุนรูป"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30 sm:h-[60px] sm:w-[60px]"
            >
              <Crop className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={confirmCapture}
              aria-label="ยืนยัน"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 transition-all hover:bg-green-600 active:scale-95 sm:h-[60px] sm:w-[60px]"
            >
              <Check className="h-6 w-6" />
            </button>
          </>
        )}

        {phase === "sending" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-white sm:h-8 sm:w-8" />
            <p className="text-xs text-white/60">กำลังบันทึก...</p>
          </div>
        )}
      </footer>
    </div>
  );
}
