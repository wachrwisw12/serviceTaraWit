import { useEffect, useRef, useState } from "react";

type OfficeKind = "pptx" | "docx";

export function detectOfficeKind(
  fileName: string,
  fileType: string,
): OfficeKind | null {
  const name = fileName.toLowerCase();
  const type = fileType.toLowerCase();

  if (
    /\.(pptx|pptm)$/.test(name) ||
    type.includes("presentation") ||
    type.includes("vnd.openxmlformats-officedocument.presentationml")
  ) {
    return "pptx";
  }

  if (
    /\.(docx|docm)$/.test(name) ||
    type.includes("wordprocessingml") ||
    type.includes("vnd.openxmlformats-officedocument.wordprocessingml")
  ) {
    return "docx";
  }

  return null;
}

type Props = {
  fileUrl: string | null;
  fileName: string;
  fileType: string;
};

export default function OfficePreview({ fileUrl, fileName, fileType }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !fileUrl) return;

    const kind = detectOfficeKind(fileName, fileType);
    if (!kind) return;

    let cancelled = false;
    let pptxViewer: {
      destroy: () => void;
      preview: (file: ArrayBuffer) => Promise<unknown>;
    } | null = null;

    setStatus("loading");
    setErrorMessage(null);

    const render = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("ไม่สามารถโหลดไฟล์ได้");
        const buffer = await response.arrayBuffer();

        if (cancelled) return;

        if (kind === "pptx") {
          const { init } = await import("pptx-preview");

          const width = Math.max(container.clientWidth - 32, 480);
          const height = Math.round((width * 9) / 16);

          pptxViewer = init(container, {
            width,
            height,
            mode: "list",
          });

          await pptxViewer.preview(buffer);
        } else {
          const { renderAsync } = await import("docx-preview");

          await renderAsync(buffer, container, undefined, {
            inWrapper: true,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
          });
        }

        if (!cancelled) setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "ไม่สามารถแสดงไฟล์นี้ได้",
          );
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
      pptxViewer?.destroy();
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, fileName, fileType]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={containerRef}
        tabIndex={0}
        aria-label={`ตัวอย่างเอกสาร ${fileName}`}
        className="min-h-0 flex-1 touch-pan-y overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      />

      {status === "loading" && (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-gray-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
          กำลังโหลดไฟล์...
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          {errorMessage ?? "ไม่สามารถแสดงไฟล์นี้ได้"}
        </div>
      )}
    </div>
  );
}
