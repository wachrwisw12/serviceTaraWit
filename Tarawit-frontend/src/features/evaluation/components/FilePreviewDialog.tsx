import { Download, X } from "lucide-react";

type Props = {
  open: boolean;
  fileUrl: string | null;
  fileType: string;
  fileName: string;
  onClose: () => void;
};

export default function FilePreviewDialog({
  open,
  fileUrl,
  fileType,
  fileName,
  onClose,
}: Props) {
  if (!open || !fileUrl) return null;

  const canPreview = fileType.includes("pdf") || fileType.startsWith("image/");

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h3 className="font-semibold">{fileName}</h3>

            <p className="text-xs text-gray-500">{fileType}</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download={fileName}
              className="rounded-lg border px-3 py-2 hover:bg-gray-50"
            >
              <Download size={18} />
            </a>

            <button
              onClick={onClose}
              className="rounded-lg border p-2 hover:bg-gray-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview */}

        <div className="flex-1 overflow-hidden bg-gray-100">
          {canPreview ? (
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
                className="rounded-lg bg-[#2fae60] px-4 py-2 text-white"
              >
                ดาวน์โหลดไฟล์
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
