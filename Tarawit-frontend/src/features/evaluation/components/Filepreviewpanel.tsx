import { Download } from "lucide-react";
import OfficePreview, { detectOfficeKind } from "./OfficePreview";

type Props = {
  fileUrl: string | null;
  fileType: string;
  fileName: string;
};

export default function FilePreviewPanel({
  fileUrl,
  fileType,
  fileName,
}: Props) {
  if (!fileUrl) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        ไม่มีเอกสารแนบ
      </div>
    );
  }

  const canPreview = fileType.includes("pdf") || fileType.startsWith("image/");
  const officeKind = detectOfficeKind(fileName, fileType);
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const isVideo =
    fileType.startsWith("video/") ||
    ["mp4", "mov", "avi", "mkv", "webm"].includes(extension);
  const isAudio =
    fileType.startsWith("audio/") ||
    ["mp3", "wav", "m4a", "ogg"].includes(extension);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {fileName}
          </p>
          <p className="text-xs text-gray-500">{fileType}</p>
        </div>

        <a
          href={fileUrl}
          download={fileName}
          aria-label={`ดาวน์โหลด ${fileName}`}
          className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
        >
          <Download size={16} />
        </a>
      </div>

      <div className="min-h-0 flex-1 touch-pan-y overflow-auto overscroll-contain bg-gray-100 [-webkit-overflow-scrolling:touch]">
        {isVideo ? (
          <div className="flex h-full items-center justify-center bg-black">
            <video src={fileUrl} controls className="max-h-full max-w-full">
              <track kind="captions" />
              เบราว์เซอร์ไม่รองรับการเล่นวิดีโอ
            </video>
          </div>
        ) : isAudio ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-pink-50 to-purple-50 px-4">
            <audio src={fileUrl} controls className="w-full max-w-sm">
              <track kind="captions" />
              เบราว์เซอร์ไม่รองรับการเล่นเสียง
            </audio>
            <p className="max-w-full truncate text-sm text-gray-500">
              {fileName}
            </p>
          </div>
        ) : officeKind ? (
          <OfficePreview
            fileUrl={fileUrl}
            fileName={fileName}
            fileType={fileType}
          />
        ) : canPreview ? (
          fileType.startsWith("image/") ? (
            <div className="flex min-h-full min-w-full items-start justify-center overflow-auto p-2">
              <img
                src={fileUrl}
                alt={fileName}
                className="h-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <iframe
              src={fileUrl}
              title={fileName}
              scrolling="yes"
              className="h-full min-h-[28rem] w-full touch-pan-y border-0 bg-white"
            />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <p className="text-sm text-gray-500">
              ไม่สามารถแสดงตัวอย่างไฟล์ชนิดนี้ได้
            </p>

            <a
              href={fileUrl}
              download={fileName}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
            >
              ดาวน์โหลดไฟล์
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
