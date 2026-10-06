import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImageOff, Loader2, Printer } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import api from "../../../api/axios";
import { openAttachment } from "../../../utils/functions";
import type { InstanceAttachment } from "../types/EvaluationSectionForm_type";
import { printEvaluationReport } from "../helper/printWithFonts";

type PrintableImage = {
  id: number;
  targetId: number;
  fileName: string;
  url: string;
};

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

function isImageAttachment(attachment: InstanceAttachment): boolean {
  if (attachment.mime_type?.startsWith("image/")) return true;
  const extension = attachment.file_name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(extension);
}

async function loadPrintableImage(
  instanceId: number,
  targetId: number,
  attachment: InstanceAttachment,
): Promise<PrintableImage | null> {
  try {
    const file = await openAttachment(instanceId, targetId, attachment.id);
    if (!file.type.startsWith("image/")) {
      URL.revokeObjectURL(file.url);
      return null;
    }
    return {
      id: attachment.id,
      targetId,
      fileName: attachment.file_name,
      url: file.url,
    };
  } catch {
    return null;
  }
}

export default function AttachmentImagePrintPage() {
  const { id } = useParams<{ id: string }>();
  const instanceId = Number(id);
  const [searchParams] = useSearchParams();
  const targetIds = useMemo(
    () =>
      (searchParams.get("target_ids") ?? "")
        .split(",")
        .map(Number)
        .filter(
          (value, index, values) =>
            Number.isInteger(value) && value > 0 && values.indexOf(value) === index,
        ),
    [searchParams],
  );
  const [images, setImages] = useState<PrintableImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];

    const load = async () => {
      try {
        const attachmentRequests = targetIds.map(async (targetId) => {
          const response = await api.get<InstanceAttachment[]>(
            `/evaluation/instances/${instanceId}/targets/${targetId}/attachments`,
          );
          return { targetId, attachments: response.data ?? [] };
        });

        const attachmentLists = await Promise.all(attachmentRequests);
        const loadedImages = (
          await Promise.all(
            attachmentLists.map(async ({ targetId, attachments }) => {
              return (
                await Promise.all(
                  attachments
                    .filter(isImageAttachment)
                    .map((attachment) =>
                      loadPrintableImage(instanceId, targetId, attachment),
                    ),
                )
              ).filter((image): image is PrintableImage => image !== null);
            }),
          )
        ).flat();
        objectUrls.push(...loadedImages.map((image) => image.url));

        if (!active) {
          for (const url of objectUrls) URL.revokeObjectURL(url);
          return;
        }
        setImages(loadedImages);
      } catch {
        if (active) setError("ไม่สามารถโหลดรูปภาพสำหรับพิมพ์ได้");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
      for (const url of objectUrls) URL.revokeObjectURL(url);
    };
  }, [instanceId, targetIds]);

  const totalImages = images.length;

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        กำลังเตรียมรูปภาพสำหรับพิมพ์...
      </div>
    );
  }

  if (error) {
    return <div className="p-12 text-center text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="attachment-image-print-shell min-h-screen bg-slate-100 px-4 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <Link
          to={`/evaluation/my-created/${instanceId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> กลับหน้าสรุป
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{totalImages} รูป</span>
          <button
            type="button"
            disabled={totalImages === 0}
            onClick={printEvaluationReport}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Printer className="h-4 w-4" /> พิมพ์ / บันทึก PDF
          </button>
        </div>
      </div>

      {totalImages === 0 ? (
        <div className="no-print mx-auto flex max-w-[210mm] flex-col items-center rounded-2xl bg-white px-6 py-20 text-center shadow-sm">
          <ImageOff className="h-10 w-10 text-gray-300" />
          <h1 className="mt-4 font-semibold text-gray-800">ไม่พบรูปภาพที่แนบไว้</h1>
          <p className="mt-1 text-sm text-gray-500">
            รายการที่เลือกอาจมีไฟล์ชนิดอื่น แต่ไม่มีไฟล์รูปภาพสำหรับพิมพ์
          </p>
        </div>
      ) : (
        <div className="print:space-y-0">
          {images.map((image) => (
            <article
              key={`${image.targetId}-${image.id}`}
              className="attachment-print-page mx-auto bg-white shadow-sm"
            >
              <img
                src={image.url}
                alt={image.fileName}
                loading="eager"
                className="attachment-print-image"
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
