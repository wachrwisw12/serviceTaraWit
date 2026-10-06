import { Download, X, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import OfficePreview, { detectOfficeKind } from "./OfficePreview";

type AttachmentItem = {
  id: number;
  file_name: string;
  file_size: number;
};

type Props = {
  open: boolean;
  fileUrl: string | null;
  fileType: string;
  fileName: string;
  attachments?: AttachmentItem[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  onClose: () => void;
};

function isVideoFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ["mp4", "mov", "avi", "mkv", "webm"].includes(ext);
}

function isAudioFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ["mp3", "wav", "m4a", "ogg"].includes(ext);
}

export default function FilePreviewDialog({
  open,
  fileUrl,
  fileType,
  fileName,
  attachments = [],
  currentIndex = 0,
  onNavigate,
  onClose,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasMultipleFiles = attachments.length > 1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < attachments.length - 1;

  // Reset播放状态 เมื่อเปลี่ยนไฟล์
  useEffect(() => {
    setIsPlaying(false);
  }, [currentIndex, fileUrl]);

  // Keyboard navigation
  useEffect(() => {
    if (!open || !hasMultipleFiles) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && canGoPrev && onNavigate) {
        onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && canGoNext && onNavigate) {
        onNavigate(currentIndex + 1);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasMultipleFiles, canGoPrev, canGoNext, currentIndex, onNavigate, onClose]);

  if (!open || !fileUrl) return null;

  const canPreview =
    fileType.includes("pdf") || fileType.startsWith("image/");
  const officeKind = detectOfficeKind(fileName, fileType);
  const isVideo = isVideoFile(fileName);
  const isAudio = isAudioFile(fileName);

  const togglePlay = () => {
    if (isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (isAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePrev = () => {
    if (canGoPrev && onNavigate) {
      setIsPlaying(false);
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext && onNavigate) {
      setIsPlaying(false);
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{fileName}</h3>
              {hasMultipleFiles && (
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {currentIndex + 1} / {attachments.length}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{fileType}</p>
          </div>

          <div className="flex items-center gap-2">
            {isVideo && (
              <button
                onClick={togglePlay}
                className="rounded-lg border px-3 py-2 hover:bg-gray-50"
                title={isPlaying ? "หยุดชั่วคราว" : "เล่น"}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
            )}

            <a
              href={fileUrl}
              download={fileName}
              className="rounded-lg border px-3 py-2 hover:bg-gray-50"
              title="ดาวน์โหลด"
            >
              <Download size={18} />
            </a>

            <button
              onClick={() => {
                setIsPlaying(false);
                onClose();
              }}
              className="rounded-lg border p-2 hover:bg-gray-50"
              title="ปิด"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview with Navigation */}
        <div className="relative flex-1 overflow-hidden bg-gray-100">
          {/* Previous button */}
          {hasMultipleFiles && (
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-30"
              title="ไฟล์ก่อนหน้า"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Next button */}
          {hasMultipleFiles && (
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-30"
              title="ไฟล์ถัดไป"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* File preview */}
          {isVideo ? (
            <div className="flex h-full items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={fileUrl}
                controls
                className="max-h-full max-w-full"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <track kind="captions" />
                Browser ของคุณไม่รองรับการเล่นวิดีโอ
              </video>
            </div>
          ) : isAudio ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-pink-50 to-purple-50">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-white shadow-xl">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              <audio
                ref={audioRef}
                src={fileUrl}
                controls
                className="w-full max-w-md"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <track kind="captions" />
                Browser ของคุณไม่รองรับการเล่นเสียง
              </audio>
              <p className="text-sm text-gray-500">{fileName}</p>
            </div>
          ) : officeKind ? (
            <OfficePreview
              fileUrl={fileUrl}
              fileName={fileName}
              fileType={fileType}
            />
          ) : canPreview ? (
            fileType.startsWith("image/") ? (
              <img
                src={fileUrl}
                alt={fileName}
                className="h-full w-full object-contain"
              />
            ) : (
              <iframe
                src={fileUrl}
                title={fileName}
                className="h-full w-full"
              />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <p className="text-gray-500">
                ไม่สามารถแสดงตัวอย่างไฟล์ชนิดนี้ได้
              </p>
              <a
                href={fileUrl}
                download={fileName}
                className="rounded-lg bg-primary px-4 py-2 text-white"
              >
                ดาวน์โหลดไฟล์
              </a>
            </div>
          )}
        </div>

        {/* Thumbnail strip (ถ้ามีหลายไฟล์) */}
        {hasMultipleFiles && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-center gap-2 overflow-x-auto">
              {attachments.map((att, index) => (
                <button
                  key={att.id}
                  onClick={() => {
                    setIsPlaying(false);
                    onNavigate?.(index);
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                    index === currentIndex
                      ? "border-primary bg-primary/10 text-primary-dark"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate max-w-[120px]">{att.file_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
