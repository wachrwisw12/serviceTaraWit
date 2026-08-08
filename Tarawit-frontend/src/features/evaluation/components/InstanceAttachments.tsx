// pages/media-supervision/components/InstanceAttachments.tsx

import { useRef, useState } from "react";
import { Paperclip, Upload, Trash2, FileText, Loader2 } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";

import {
  uploadInstanceAttachment,
  deleteInstanceAttachment,
} from "../api/MyInstanceSlice";

import { openAttachment } from "../../../utils/functions";
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function InstanceAttachments({
  instanceId,
  targetId,
  canUpload,
}: {
  instanceId: number;
  targetId: number;
  canUpload: boolean;
}) {
  const dispatch = useAppDispatch();

  const { attachments } = useAppSelector((state) => state.myInstance);

  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [previewName, setPreviewName] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("ไฟล์ต้องมีขนาดไม่เกิน 20 MB");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    setError(null);
    setUploading(true);

    try {
      await dispatch(
        uploadInstanceAttachment({
          instanceId,
          targetId,
          file,
        }),
      ).unwrap();
    } catch (err) {
      console.error(err);

      setError(
        typeof err === "string" ? err : "อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (attachmentId: number) => {
    setError(null);

    try {
      await dispatch(
        deleteInstanceAttachment({
          instanceId,
          targetId,
          attachmentId,
        }),
      ).unwrap();
    } catch (err) {
      console.error(err);

      setError("ลบไฟล์ไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handlePreview = async (att: (typeof attachments)[number]) => {
    try {
      const file = await openAttachment(instanceId, targetId, att.id);

      setPreviewUrl(file.url);
      setPreviewType(file.type);
      setPreviewName(att.file_name);
      setPreviewOpen(true);
    } catch (err) {
      console.error(err);

      setError("เปิดไฟล์ไม่สำเร็จ");
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewOpen(false);
    setPreviewUrl("");
    setPreviewType("");
    setPreviewName("");
  };

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Paperclip size={15} />
          ไฟล์ประกอบการนิเทศ (ขนาดไม่เกิน 20 MB)
        </p>

        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx"
              onChange={handleUpload}
              disabled={uploading}
            />

            <button
              type="button"
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.value = "";
                  inputRef.current.click();
                }
              }}
              disabled={uploading}
              className="
                flex items-center gap-1
                rounded-lg
                bg-[#2fae60]
                px-3 py-1.5
                text-xs font-medium
                text-white
                hover:bg-[#279653]
                disabled:opacity-60
              "
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}

              {uploading ? "กำลังอัปโหลด..." : "แนบไฟล์"}
            </button>
          </>
        )}
      </div>

      {error && (
        <div
          className="
            mb-2
            rounded-lg
            border border-red-200
            bg-red-50
            px-3 py-2
            text-xs
            text-red-600
          "
        >
          {error}
        </div>
      )}

      {attachments.length === 0 ? (
        <div
          className="
            rounded-lg
            border border-dashed
            border-gray-200
            bg-gray-50/40
            px-4 py-3
            text-center
            text-sm
            text-gray-400
          "
        >
          ยังไม่มีไฟล์แนบ
        </div>
      ) : (
        <ul
          className="
            divide-y
            divide-gray-100
            rounded-lg
            border
            border-gray-200
          "
        >
          {attachments.map((att) => (
            <li
              key={att.id}
              className="
                flex
                items-center
                justify-between
                px-3 py-2
                text-sm
              "
            >
              <button
                type="button"
                onClick={() => handlePreview(att)}
                className="
                  flex
                  flex-1
                  items-center
                  gap-2
                  text-left
                  text-gray-700
                  transition-colors
                  hover:text-[#2fae60]
                "
              >
                <FileText size={15} className="shrink-0 text-gray-400" />

                <span className="truncate">{att.file_name}</span>

                <span className="shrink-0 text-xs text-gray-400">
                  ({formatFileSize(att.file_size)})
                </span>
              </button>

              {canUpload && (
                <button
                  type="button"
                  onClick={() => handleDelete(att.id)}
                  className="
                    ml-3
                    shrink-0
                    text-gray-300
                    hover:text-red-500
                  "
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {previewOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
          onClick={closePreview}
        >
          <div
            className="
              max-h-[90vh]
              max-w-5xl
              overflow-auto
              rounded-lg
              bg-white
              p-4
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 text-sm font-medium">{previewName}</div>

            {previewType.startsWith("image/") ? (
              <img
                src={previewUrl}
                alt={previewName}
                className="max-h-[70vh]"
              />
            ) : previewType === "application/pdf" ? (
              <iframe src={previewUrl} className="h-[70vh] w-[80vw]" />
            ) : (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#2fae60]"
              >
                เปิดไฟล์
              </a>
            )}

            <button
              type="button"
              onClick={closePreview}
              className="
                mt-4
                rounded-lg
                bg-gray-100
                px-3 py-1.5
                text-sm
              "
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
