import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Paperclip,
  Upload,
  Camera,
  Trash2,
  FileText,
  Loader2,
  Eye,
  Film,
  Music,
  Image,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import api from "../../../api/axios";
import { useDialog } from "../../../components/dialog";
import { openAttachment } from "../../../utils/functions";
import type { InstanceAttachment } from "../types/EvaluationSectionForm_type";

const CameraCapture = lazy(() => import("./CameraCapture"));
const FilePreviewDialog = lazy(() => import("./FilePreviewDialog"));
const FilePreviewPanel = lazy(() => import("./Filepreviewpanel"));

/* ─── helpers ─── */
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getFileIcon(fileName: string, size: number = 15) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
    return <Film size={size} className="shrink-0 text-purple-400" />;
  if (["mp3", "wav", "m4a", "ogg"].includes(ext))
    return <Music size={size} className="shrink-0 text-pink-400" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return <Image size={size} className="shrink-0 text-green-400" />;
  return <FileText size={size} className="shrink-0 text-gray-400" />;
}

function isImageFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
}



function getMaxFileSize(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
    return 200 * 1024 * 1024;
  if (["mp3", "wav", "m4a", "ogg"].includes(ext)) return 50 * 1024 * 1024;
  return 20 * 1024 * 1024;
}

function getAcceptedTypes() {
  return ".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.m4a,.ogg";
}

/* ─── Thumbnail ─── */
function AttachmentThumbnail({
  instanceId,
  targetId,
  attachmentId,
  fileName,
}: {
  instanceId: number;
  targetId: number;
  attachmentId: number;
  fileName: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    openAttachment(instanceId, targetId, attachmentId)
      .then((f) => {
        if (!cancelled) setUrl(f.url);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [instanceId, targetId, attachmentId]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (loading)
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );

  if (!url)
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <Image size={32} className="text-gray-300" />
      </div>
    );

  return (
    <img
      src={url}
      alt={fileName}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   Props
   ══════════════════════════════════════════════════════════════════ */
interface Props {
  instanceId: number;
  targetId: number;
  /** true = อัปโหลดและลบได้, false = อ่านอย่างเดียว */
  canUpload: boolean;
  title?: string;
  description?: string;
  emptyMessage?: string;
  fillAvailable?: boolean;
  onCountChange?: (count: number) => void;
  onCollapse?: () => void;
  previewMode?: "dialog" | "inline";
  currentUserId?: number;
  uploadLabel?: string;
}

/* ══════════════════════════════════════════════════════════════════
   EvaluatorAttachmentUpload
   ══════════════════════════════════════════════════════════════════ */
export default function EvaluatorAttachmentUpload({
  instanceId,
  targetId,
  canUpload,
  title = "ไฟล์แนบ / หลักฐาน",
  description,
  emptyMessage = "ยังไม่มีไฟล์แนบจากผู้รับการประเมิน",
  fillAvailable = false,
  onCountChange,
  onCollapse,
  previewMode = "dialog",
  currentUserId,
  uploadLabel = "เพิ่มหลักฐานของคุณ",
}: Props) {
  const { confirm } = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<InstanceAttachment[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // camera
  const [cameraOpen, setCameraOpen] = useState(false);

  // preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);

  /* ─── โหลดรายการไฟล์แนบ ─── */
  const loadAttachments = useCallback(async () => {
    setListLoading(true);
    setListError(false);
    try {
      const res = await api.get<InstanceAttachment[]>(
        `/evaluation/instances/${instanceId}/targets/${targetId}/attachments`,
      );
      const nextAttachments = res.data ?? [];
      setAttachments(nextAttachments);
      onCountChange?.(nextAttachments.length);
    } catch {
      setListError(true);
    } finally {
      setListLoading(false);
    }
  }, [instanceId, targetId, onCountChange]);

  useEffect(() => {
    // โหลดข้อมูลภายนอกเมื่อเปลี่ยนผู้รับการประเมิน
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAttachments();
  }, [loadAttachments]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* ─── อัปโหลดไฟล์ตรงไปยัง API พร้อมแสดงความคืบหน้า ─── */
  const uploadFile = async (file: File): Promise<boolean> => {
    const maxSize = getMaxFileSize(file.name);
    if (file.size > maxSize) {
      setError(
        `${file.name}: ไฟล์ต้องมีขนาดไม่เกิน ${formatFileSize(maxSize)}`,
      );
      return false;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(
        `/evaluation/instances/${instanceId}/targets/${targetId}/attachments`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;
            setUploadProgress(
              Math.round((progressEvent.loaded / progressEvent.total) * 100),
            );
          },
        },
      );

      return true;
    } catch {
      return false;
    }
  };

  /* ─── handle upload from file input ─── */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setSuccessMessage(null);
    setUploading(true);
    setUploadProgress(0);

    const failed: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(Math.round((i / files.length) * 100));
      const ok = await uploadFile(files[i]);
      if (!ok) failed.push(files[i].name);
    }

    setUploadProgress(100);
    if (failed.length > 0) {
      setError(
        failed.length === files.length
          ? "อัปโหลดไฟล์ทั้งหมดไม่สำเร็จ"
          : `อัปโหลดไม่สำเร็จ: ${failed.join(", ")}`,
      );
    }
    const successCount = files.length - failed.length;
    if (successCount > 0) {
      await loadAttachments();
      setSuccessMessage(`เพิ่มหลักฐานแล้ว ${successCount} ไฟล์`);
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ─── handle camera capture ─── */
  const handleCameraCapture = async (file: File) => {
    setCameraOpen(false);
    setError(null);
    setSuccessMessage(null);
    setUploading(true);
    setUploadProgress(0);

    const ok = await uploadFile(file);
    if (ok) {
      await loadAttachments();
      setSuccessMessage("เพิ่มรูปถ่ายเป็นหลักฐานแล้ว");
    } else {
      setError("บันทึกรูปจากกล้องไม่สำเร็จ");
    }

    setUploading(false);
    setUploadProgress(0);
  };

  /* ─── ลบไฟล์ ─── */
  const handleDelete = async (id: number) => {
    const attachment = attachments.find((item) => item.id === id);
    if (!attachment || attachment.uploaded_by !== currentUserId) return;

    const confirmed = await confirm({
      type: "warning",
      title: "ลบหลักฐานที่คุณแนบ?",
      message: `ไฟล์ “${attachment.file_name}” จะถูกลบออกจากรายการประเมินนี้`,
      confirmText: "ลบไฟล์",
      cancelText: "เก็บไว้",
    });

    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);
    try {
      await api.delete(
        `/evaluation/instances/${instanceId}/targets/${targetId}/attachments/${id}`,
      );
      setAttachments((previous) => {
        const nextAttachments = previous.filter((attachment) => attachment.id !== id);
        onCountChange?.(nextAttachments.length);
        return nextAttachments;
      });
      setSuccessMessage("ลบหลักฐานของคุณแล้ว");
    } catch {
      setError("ลบไฟล์ไม่สำเร็จ");
    }
  };

  /* ─── preview ─── */
  const openPreview = async (att: InstanceAttachment, index: number) => {
    setError(null);
    setPreviewLoadingId(att.id);
    setPreviewIndex(index);
    try {
      const file = await openAttachment(instanceId, targetId, att.id);
      setPreviewUrl(file.url);
      setPreviewType(file.type);
      setPreviewName(att.file_name);
      setPreviewOpen(true);
    } catch {
      setError("เปิดไฟล์ไม่สำเร็จ");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const navigatePreview = async (index: number) => {
    if (index < 0 || index >= attachments.length) return;
    const att = attachments[index];
    setError(null);
    setPreviewLoadingId(att.id);
    setPreviewIndex(index);
    try {
      const file = await openAttachment(instanceId, targetId, att.id);
      setPreviewUrl(file.url);
      setPreviewType(file.type);
      setPreviewName(att.file_name);
    } catch {
      setError("เปิดไฟล์ไม่สำเร็จ");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl("");
    setPreviewType("");
    setPreviewName("");
  };

  /* ─── render ─── */
  return (
    <section
      className={
        fillAvailable ? "flex h-full min-h-0 flex-col" : undefined
      }
      aria-label={title}
    >
      {/* ─── Collapsible header ─── */}
      <div className="shrink-0 border-b border-gray-200">
        <button
          type="button"
          onClick={() => {
            if (expanded && onCollapse) {
              onCollapse();
              return;
            }
            setExpanded((value) => !value);
          }}
          aria-expanded={expanded}
          aria-label={expanded ? `ย่อ ${title}` : `ขยาย ${title}`}
          className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                attachments.length > 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {attachments.length > 0 ? (
                <CheckCircle2 size={17} />
              ) : (
                <Paperclip size={17} />
              )}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span className="truncate">{title}</span>
                {attachments.length > 0 && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {attachments.length} ไฟล์
                  </span>
                )}
              </span>
              {description && (
                <span className="mt-0.5 block truncate text-xs font-normal text-gray-500">
                  {description}
                </span>
              )}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500">
            <span className="hidden sm:inline">
              {expanded ? "ย่อ" : "ขยาย"}
            </span>
            {expanded ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </span>
        </button>
      </div>

      {/* ─── Content ─── */}
      {expanded && (
        <div
          className={
            fillAvailable
              ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [-webkit-overflow-scrolling:touch] sm:px-4"
              : "px-4 py-3"
          }
        >
          {/* error */}
          {error && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
            >
              <CheckCircle2 size={14} />
              {successMessage}
            </div>
          )}

          {/* progress */}
          {uploading && uploadProgress > 0 && (
            <div className="mb-2">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>กำลังอัปโหลด...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* action buttons */}
          {canUpload && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <p className="mb-2 text-xs font-semibold text-emerald-800">
                {uploadLabel}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* ปุ่มกล้อง */}
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  disabled={uploading}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
                >
                  <Camera size={18} />
                  ถ่ายรูป
                </button>

                {/* ปุ่มเลือกไฟล์ */}
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={uploading}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  <Upload size={18} />
                  เลือกไฟล์
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={getAcceptedTypes()}
            multiple
            onChange={handleUpload}
            disabled={uploading}
          />

          {previewMode === "inline" &&
            !listLoading &&
            !listError &&
            attachments.length > 0 && (
              <div className="relative mb-3 h-[min(52dvh,34rem)] min-h-64 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-inner md:h-[min(62vh,640px)]">
                {previewOpen && previewUrl ? (
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
                        <Loader2 size={18} className="animate-spin text-primary" />
                        กำลังเตรียมตัวดูไฟล์...
                      </div>
                    }
                  >
                    <FilePreviewPanel
                      fileUrl={previewUrl}
                      fileType={previewType}
                      fileName={previewName}
                    />
                  </Suspense>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                    <Eye size={24} className="text-emerald-500" />
                    <p className="mt-2 text-sm font-medium text-gray-700">
                      เลือกไฟล์เพื่อดูในหน้านี้
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      แบบให้คะแนนจะยังเปิดอยู่ ไม่ต้องปิดหน้าต่างสลับไปมา
                    </p>
                  </div>
                )}

                {previewLoadingId !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-600 shadow-sm">
                      <Loader2 size={16} className="animate-spin text-primary" />
                      กำลังเปิดไฟล์...
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* file list */}
          {listLoading ? (
            <div className="flex items-center justify-center py-4 text-xs text-gray-400">
              <Loader2 size={14} className="mr-1 animate-spin" />
              กำลังโหลดหลักฐาน...
            </div>
          ) : listError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
              <p className="text-sm font-medium text-amber-800">
                โหลดรายการหลักฐานไม่สำเร็จ
              </p>
              <button
                type="button"
                onClick={loadAttachments}
                className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-amber-700 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <RefreshCw size={15} />
                ลองอีกครั้ง
              </button>
            </div>
          ) : attachments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-6 text-center">
              <Paperclip size={22} className="mx-auto text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-500">
                {emptyMessage}
              </p>
              {!canUpload && (
                <p className="mt-1 text-xs text-gray-400">
                  เมื่อมีการแนบไฟล์ หลักฐานจะแสดงที่นี่โดยอัตโนมัติ
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((att, idx) => (
                <div
                  key={att.id}
                  className={`group flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-colors ${
                    previewOpen && previewIndex === idx
                      ? "border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-100"
                      : "border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openPreview(att, idx)}
                    disabled={previewLoadingId === att.id}
                    aria-label={`เปิดดู ${att.file_name}`}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {/* thumbnail / icon */}
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {isImageFile(att.file_name) ? (
                        <AttachmentThumbnail
                          instanceId={instanceId}
                          targetId={targetId}
                          attachmentId={att.id}
                          fileName={att.file_name}
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center">
                          {getFileIcon(att.file_name, 18)}
                        </span>
                      )}
                    </span>

                    {/* info */}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-gray-700">
                        {att.file_name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-400">
                        <span>{formatFileSize(att.file_size)}</span>
                        {att.uploaded_by === currentUserId && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700">
                            แนบโดยคุณ
                          </span>
                        )}
                      </span>
                    </span>

                    <span className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-gray-500 group-hover:bg-white group-hover:text-emerald-700">
                      {previewLoadingId === att.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Eye size={14} />
                      )}
                      <span className="hidden sm:inline">
                        {previewMode === "inline" ? "ดูในแผง" : "เปิดดู"}
                      </span>
                    </span>
                  </button>

                  {canUpload && att.uploaded_by === currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id)}
                      aria-label={`ลบ ${att.file_name}`}
                      className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* โหลดกล้องเมื่อผู้ใช้เปิดจริงเท่านั้น เพื่อลดภาระบนมือถือ */}
      {canUpload && cameraOpen && (
        <Suspense fallback={null}>
          <CameraCapture
            open={cameraOpen}
            onClose={() => setCameraOpen(false)}
            onCapture={handleCameraCapture}
          />
        </Suspense>
      )}

      {/* โหลดตัวดูเอกสารขนาดใหญ่เมื่อเปิดไฟล์จริงเท่านั้น */}
      {previewMode === "dialog" && previewOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50">
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-gray-600 shadow-xl">
                <Loader2 size={18} className="animate-spin text-primary" />
                กำลังเปิดไฟล์...
              </div>
            </div>
          }
        >
          <FilePreviewDialog
            open={previewOpen}
            fileUrl={previewUrl || null}
            fileType={previewType}
            fileName={previewName}
            attachments={attachments.map((a) => ({
              id: a.id,
              file_name: a.file_name,
              file_size: a.file_size,
            }))}
            currentIndex={previewIndex}
            onNavigate={navigatePreview}
            onClose={closePreview}
          />
        </Suspense>
      )}
    </section>
  );
}
