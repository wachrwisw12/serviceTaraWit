import { useEffect, useState } from "react";
// ปรับ path ให้ตรงกับตำแหน่งจริงของไฟล์ openAttachment ในโปรเจกต์
import { openAttachment } from "../../../utils/functions";
import FilePreviewPanel from "./Filepreviewpanel";

type Props = {
  instanceId: number;
  targetId: number;
  attachmentIds: number[];
};

export default function AttachmentViewer({
  instanceId,
  targetId,
  attachmentIds,
}: Props) {
  const [active, setActive] = useState(0);
  const [file, setFile] = useState<{ url: string; type: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setActive(0);
    setError(false);
  }, [instanceId, targetId]);

  useEffect(() => {
    if (!attachmentIds.length) {
      setFile(null);
      setError(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    setFile(null);
    setError(false);

    openAttachment(instanceId, targetId, attachmentIds[active])
      .then((f) => {
        if (cancelled) {
          URL.revokeObjectURL(f.url);
          return;
        }
        objectUrl = f.url;
        setFile(f);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, targetId, active, attachmentIds.length]);

  if (!attachmentIds.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        ไม่มีเอกสารแนบ
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        ไม่สามารถโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <FilePreviewPanel
          fileUrl={file?.url ?? null}
          fileType={file?.type ?? ""}
          fileName={`เอกสารแนบ ${active + 1}`}
        />
      </div>

      {attachmentIds.length > 1 && (
        <div className="flex justify-center gap-2 border-t border-gray-100 py-2">
          {attachmentIds.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-2 w-2 rounded-full transition ${
                i === active ? "bg-primary" : "bg-gray-300"
              }`}
              aria-label={`เอกสารแนบ ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
