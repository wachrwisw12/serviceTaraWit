import { Download } from "lucide-react";

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

  return (
    <div className="flex h-full flex-col">
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
          className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
        >
          <Download size={16} />
        </a>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-100">
        {canPreview ? (
          fileType.startsWith("image/") ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="h-full w-full object-contain"
            />
          ) : (
            <iframe src={fileUrl} title={fileName} className="h-full w-full" />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <p className="text-sm text-gray-500">
              ไม่สามารถแสดงตัวอย่างไฟล์ชนิดนี้ได้
            </p>

            <a
              href={fileUrl}
              download={fileName}
              className="rounded-lg bg-[#2fae60] px-4 py-2 text-sm text-white"
            >
              ดาวน์โหลดไฟล์
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
