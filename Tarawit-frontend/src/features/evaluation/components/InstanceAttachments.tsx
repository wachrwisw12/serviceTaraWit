import { useEffect, useRef, useState, useCallback } from "react";
import {
  Paperclip,
  Upload,
  Trash2,
  FileText,
  Loader2,
  Eye,
  Film,
  Music,
  Image,
  AlertCircle,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import api from "../../../api/axios";

import {
  uploadInstanceAttachment,
  deleteInstanceAttachment,
} from "../api/MyInstanceSlice";

import { openAttachment } from "../../../utils/functions";
import FilePreviewDialog from "./FilePreviewDialog";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getFileIcon(fileName: string, size: number = 15) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  
  // Video
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
    return <Film size={size} className="shrink-0 text-purple-400" />;
  }
  // Audio
  if (["mp3", "wav", "m4a", "ogg"].includes(ext)) {
    return <Music size={size} className="shrink-0 text-pink-400" />;
  }
  // Image
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return <Image size={size} className="shrink-0 text-green-400" />;
  }
  // Document
  return <FileText size={size} className="shrink-0 text-gray-400" />;
}

function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
}

function isVideoFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ["mp4", "mov", "avi", "mkv", "webm"].includes(ext);
}

function isAudioFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ["mp3", "wav", "m4a", "ogg"].includes(ext);
}

function getMaxFileSize(fileName: string): number {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  
  // Video: 200 MB
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
    return 200 * 1024 * 1024;
  }
  // Audio: 50 MB
  if (["mp3", "wav", "m4a", "ogg"].includes(ext)) {
    return 50 * 1024 * 1024;
  }
  // Others: 20 MB
  return 20 * 1024 * 1024;
}

function getAcceptedTypes(): string {
  return ".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.m4a,.ogg";
}

// Component สำหรับแสดง thumbnail ของรูปภาพ
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadThumbnail = async () => {
      try {
        const file = await openAttachment(instanceId, targetId, attachmentId);
        if (!cancelled) {
          setThumbnailUrl(file.url);
        }
      } catch {
        if (!cancelled) {
          setThumbnailUrl(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      cancelled = true;
    };
  }, [instanceId, targetId, attachmentId]);

  useEffect(() => {
    return () => {
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
  }, [thumbnailUrl]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!thumbnailUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <Image size={32} className="text-gray-300" />
      </div>
    );
  }

  return (
    <img
      src={thumbnailUrl}
      alt={fileName}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  );
}

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Drag & Drop state
  const [isDragging, setIsDragging] = useState(false);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  // Upload ผ่าน Pre-Signed URL (ถ้า MinIO พร้อม)
  const uploadWithPresignedURL = async (file: File): Promise<boolean> => {
    try {
      // 1. ขอ Pre-Signed URL จาก Backend
      const { data } = await api.post("/evaluation/upload/presigned-url", {
        file_name: file.name,
        content_type: file.type,
      });

      const presignedUrl = data.url;

      // 2. อัปโหลดไฟล์ตรงไป MinIO พร้อม Progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      // 3. บันทึก metadata ลง DB (ผ่าน API เดิม)
      await dispatch(
        uploadInstanceAttachment({
          instanceId,
          targetId,
          file,
        }),
      ).unwrap();

      return true;
    } catch (err) {
      console.error("Pre-signed URL upload failed:", err);
      return false;
    }
  };

  // Upload ปกติ (Fallback ถ้า MinIO ไม่พร้อม)
  const uploadDirect = async (file: File): Promise<boolean> => {
    try {
      await dispatch(
        uploadInstanceAttachment({
          instanceId,
          targetId,
          file,
        }),
      ).unwrap();
      return true;
    } catch (err) {
      console.error("Direct upload failed:", err);
      return false;
    }
  };

  const handleUploadFile = async (file: File): Promise<boolean> => {
    const maxSize = getMaxFileSize(file.name);
    if (file.size > maxSize) {
      setError(`${file.name}: ไฟล์ต้องมีขนาดไม่เกิน ${formatFileSize(maxSize)}`);
      return false;
    }

    try {
      // ลอง Pre-Signed URL ก่อน
      let success = await uploadWithPresignedURL(file);

      // Fallback: ถ้า Pre-Signed URL ไม่สำเร็จ
      if (!success) {
        success = await uploadDirect(file);
      }

      return success;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    const failedFiles: string[] = [];

    // อัปโหลดทีละไฟล์ (sequential)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.round(((i) / files.length) * 100));

      const success = await handleUploadFile(file);
      if (!success) {
        failedFiles.push(file.name);
      }
    }

    setUploadProgress(100);

    if (failedFiles.length > 0) {
      if (failedFiles.length === files.length) {
        setError("อัปโหลดไฟล์ทั้งหมดไม่สำเร็จ กรุณาลองใหม่");
      } else {
        setError(`อัปโหลดไม่สำเร็จ: ${failedFiles.join(", ")}`);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!canUpload) return;

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      // สร้าง synthetic event สำหรับ handleUpload
      const syntheticEvent = {
        target: { files },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      handleUpload(syntheticEvent);
    },
    [canUpload],
  );

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

  const handlePreview = async (att: (typeof attachments)[number], index: number) => {
    setError(null);
    setPreviewLoadingId(att.id);
    setPreviewIndex(index);

    try {
      const file = await openAttachment(instanceId, targetId, att.id);
      setPreviewUrl(file.url);
      setPreviewType(file.type);
      setPreviewName(att.file_name);
      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
      setError("เปิดไฟล์ไม่สำเร็จ");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handleNavigatePreview = async (index: number) => {
    if (index < 0 || index >= attachments.length) return;

    const att = attachments[index];
    setError(null);
    setPreviewLoadingId(att.id);
    setPreviewIndex(index);

    try {
      // Revoke old URL
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      const file = await openAttachment(instanceId, targetId, att.id);
      setPreviewUrl(file.url);
      setPreviewType(file.type);
      setPreviewName(att.file_name);
    } catch (err) {
      console.error(err);
      setError("เปิดไฟล์ไม่สำเร็จ");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewOpen(false);
    setPreviewUrl("");
    setPreviewType("");
    setPreviewName("");
    setPreviewIndex(0);
  };

  return (
    <div className="mt-6">
      <div className="mb-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Paperclip size={15} />
          ไฟล์ประกอบการนิเทศ (สูงสุด 200 MB สำหรับวิดีโอ)
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={getAcceptedTypes()}
        multiple
        onChange={handleUpload}
        disabled={uploading}
      />

      {error && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Progress bar */}
      {uploading && uploadProgress > 0 && (
        <div className="mb-2">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>กำลังอัปโหลด...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Drag & Drop zone / Click to upload */}
      {canUpload && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => {
            if (inputRef.current && !uploading) {
              inputRef.current.value = "";
              inputRef.current.click();
            }
          }}
          className={`mb-3 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-gray-300 bg-gray-50/60 hover:border-primary hover:bg-primary/5"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={28} className="mx-auto mb-2 animate-spin text-primary" />
              <p className="text-sm font-medium text-primary">กำลังอัปโหลด...</p>
            </>
          ) : (
            <>
              <Upload
                size={28}
                className={`mx-auto mb-2 ${isDragging ? "text-primary" : "text-gray-400"}`}
              />
              <p className="text-sm text-gray-600">
                {isDragging ? "วางไฟล์ที่นี่" : "คลิกหรือลากวางไฟล์ที่นี่"}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                รูป, เอกสาร, วิดีโอ (.mp4, .mov), เสียง (.mp3, .wav)
              </p>
              <p className="mt-2 text-[10px] text-gray-400">
                ขนาดสูงสุด: รูป/เอกสาร 20MB · เสียง 50MB · วิดีโอ 200MB
              </p>
            </>
          )}
        </div>
      )}

      {/* File list */}
      {attachments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/40 px-4 py-3 text-center text-sm text-gray-400">
          ยังไม่มีไฟล์แนบ
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                {isImageFile(att.file_name) ? (
                  <AttachmentThumbnail
                    instanceId={instanceId}
                    targetId={targetId}
                    attachmentId={att.id}
                    fileName={att.file_name}
                  />
                ) : isVideoFile(att.file_name) ? (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/90 text-white shadow-lg">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-purple-600">คลิกเพื่อดูวิดีโอ</span>
                    </div>
                  </div>
                ) : isAudioFile(att.file_name) ? (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-pink-50 to-pink-100">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-500/90 text-white shadow-lg">
                        <Music size={24} />
                      </div>
                      <span className="text-xs font-medium text-pink-600">คลิกเพื่อฟังเสียง</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-50">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                        {getFileIcon(att.file_name, 24)}
                      </div>
                      <span className="text-xs font-medium text-gray-500">คลิกเพื่อดูไฟล์</span>
                    </div>
                  </div>
                )}

                {/* Preview overlay */}
                <button
                  type="button"
                  onClick={() => handlePreview(att, attachments.indexOf(att))}
                  disabled={previewLoadingId === att.id}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/10"
                >
                  {previewLoadingId === att.id ? (
                    <Loader2 size={24} className="animate-spin text-white" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 opacity-0 transition-opacity group-hover:opacity-100">
                      <Eye size={18} />
                    </div>
                  )}
                </button>
              </div>

              {/* File info */}
              <div className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-700">{att.file_name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(att.file_size)}</p>
                </div>

                {canUpload && (
                  <button
                    type="button"
                    onClick={() => handleDelete(att.id)}
                    className="ml-2 shrink-0 rounded p-1.5 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <FilePreviewDialog
        open={previewOpen}
        fileUrl={previewUrl || null}
        fileType={previewType}
        fileName={previewName}
        attachments={attachments.map((att) => ({
          id: att.id,
          file_name: att.file_name,
          file_size: att.file_size,
        }))}
        currentIndex={previewIndex}
        onNavigate={handleNavigatePreview}
        onClose={closePreview}
      />
    </div>
  );
}
