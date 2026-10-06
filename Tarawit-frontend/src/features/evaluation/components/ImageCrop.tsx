import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCw, Crop, X, Check } from "lucide-react";

interface Props {
  imageFile: File;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
}

/**
 * ImageCrop — crop & rotate image ก่อนบันทึก
 *
 * features:
 *  - หมุน 90° ตามเข็ม
 *  - Crop area ลาก/ปรับขนาดได้
 *  - Responsive: ไม่ต้อง lib เพิ่ม (ใช้ canvas + pointer events)
 */
export default function ImageCrop({ imageFile, onConfirm, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgUrl, setImgUrl] = useState<string>("");
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  // Crop box ใน viewport coordinates
  const [cropBox, setCropBox] = useState({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });

  // Rendered image dimensions in viewport
  const [renderedImg, setRenderedImg] = useState({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    naturalW: 0,
    naturalH: 0,
  });

  // Dragging
  const [dragging, setDragging] = useState<
    null | "move" | "nw" | "ne" | "sw" | "se"
  >(null);
  const dragStart = useRef({ x: 0, y: 0, box: cropBox });

  /* ─── Load image ─── */
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  /* ─── Fit image to container & init crop ─── */
  const recalcLayout = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const isRotated = rotation === 90 || rotation === 270;
    const naturalW = isRotated ? img.naturalHeight : img.naturalWidth;
    const naturalH = isRotated ? img.naturalWidth : img.naturalHeight;

    const scale = Math.min(cw / naturalW, ch / naturalH, 1);
    const w = naturalW * scale;
    const h = naturalH * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    setRenderedImg({ x, y, w, h, naturalW, naturalH });

    // Init crop box = full image
    setCropBox({ x, y, w, h });
  }, [rotation]);

  useEffect(() => {
    if (!imgUrl) return;

    const img = new Image();
    img.src = imgUrl;
    imgRef.current = img;

    img.onload = () => recalcLayout();
  }, [imgUrl, recalcLayout]);

  useEffect(() => {
    recalcLayout();
  }, [rotation, recalcLayout]);

  /* ─── Rotate ─── */
  const rotate = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  /* ─── Pointer events for drag ─── */
  const handlePointerDown = useCallback(
    (
      e: React.PointerEvent,
      mode: "move" | "nw" | "ne" | "sw" | "se",
    ) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setDragging(mode);
      dragStart.current = { x: e.clientX, y: e.clientY, box: { ...cropBox } };
    },
    [cropBox],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const prev = dragStart.current.box;
      const minSize = 40;

      let newX = prev.x;
      let newY = prev.y;
      let newW = prev.w;
      let newH = prev.h;

      if (dragging === "move") {
        newX = Math.max(
          renderedImg.x,
          Math.min(prev.x + dx, renderedImg.x + renderedImg.w - prev.w),
        );
        newY = Math.max(
          renderedImg.y,
          Math.min(prev.y + dy, renderedImg.y + renderedImg.h - prev.h),
        );
      } else {
        // Corner resize
        let left = prev.x;
        let top = prev.y;
        let right = prev.x + prev.w;
        let bottom = prev.y + prev.h;

        if (dragging.includes("w")) {
          left = Math.max(renderedImg.x, Math.min(left + dx, right - minSize));
        }
        if (dragging.includes("e") || dragging === "ne" || dragging === "se") {
          right = Math.min(
            renderedImg.x + renderedImg.w,
            Math.max(right + dx, left + minSize),
          );
        }
        if (dragging === "nw" || dragging === "ne" || dragging.includes("n")) {
          top = Math.max(
            renderedImg.y,
            Math.min(top + dy, bottom - minSize),
          );
        }
        if (dragging === "sw" || dragging === "se" || dragging.includes("s")) {
          bottom = Math.min(
            renderedImg.y + renderedImg.h,
            Math.max(bottom + dy, top + minSize),
          );
        }

        // รักษา aspect ratio 1:1 (สี่เหลี่ยมจัตุรัส)
        const size = Math.min(right - left, bottom - top);
        right = left + size;
        bottom = top + size;

        newX = left;
        newY = top;
        newW = size;
        newH = size;
      }

      setCropBox({ x: newX, y: newY, w: newW, h: newH });
    },
    [dragging, renderedImg],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  /* ─── Crop & export ─── */
  const confirmCrop = useCallback(async () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // คำนวณ source coordinates จาก crop box + rotation
    const { naturalW, naturalH } = renderedImg;

    // crop box → แปลงเป็น natural image coords
    const scaleX = naturalW / renderedImg.w;
    const scaleY = naturalH / renderedImg.h;

    const sx = (cropBox.x - renderedImg.x) * scaleX;
    const sy = (cropBox.y - renderedImg.y) * scaleY;
    const sw = cropBox.w * scaleX;
    const sh = cropBox.h * scaleY;

    // Output size = square crop
    const outSize = Math.round(Math.min(sw, sh));

    canvas.width = outSize;
    canvas.height = outSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, outSize, outSize);
    ctx.save();

    // หมุน canvas แล้ววาด
    const rad = (rotation * Math.PI) / 180;
    ctx.translate(outSize / 2, outSize / 2);
    ctx.rotate(rad);

    // คำนวณ offset สำหรับ rotation
    let drawX = -outSize / 2;
    let drawY = -outSize / 2;

    if (rotation === 90) {
      drawX = -outSize / 2;
      drawY = -(naturalH - (sx + sw / 2)) + outSize / 2;
      ctx.drawImage(
        img,
        sx,
        sy,
        sw,
        sh,
        drawX,
        drawY - outSize / 2 + sw / 2 - sh / 2,
        outSize,
        outSize,
      );
    } else if (rotation === 180) {
      ctx.drawImage(
        img,
        sx,
        sy,
        sw,
        sh,
        -outSize / 2,
        -outSize / 2,
        outSize,
        outSize,
      );
    } else if (rotation === 270) {
      ctx.drawImage(
        img,
        sx,
        sy,
        sw,
        sh,
        -outSize / 2,
        -outSize / 2,
        outSize,
        outSize,
      );
    } else {
      ctx.drawImage(
        img,
        sx,
        sy,
        sw,
        sh,
        drawX,
        drawY,
        outSize,
        outSize,
      );
    }

    ctx.restore();

    // Export
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", 0.92),
    );

    if (!blob) return;

    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

    const file = new File([blob], `camera_${ts}.jpg`, { type: "image/jpeg" });
    onConfirm(file);
  }, [cropBox, renderedImg, rotation, onConfirm]);

  /* ─── Crop overlay: dark areas outside crop box ─── */
  // overlayPath intentionally unused - using SVG mask instead

  const handleSize = 14;

  return (
    <div className="fixed inset-0 z-[210] flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between bg-gray-950 px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="flex items-center gap-2 text-sm font-medium text-white">
          <Crop className="h-4 w-4" />
          ตัด/หมุนรูป
        </h3>

        <button
          type="button"
          onClick={confirmCrop}
          className="flex h-10 items-center gap-1.5 rounded-full bg-green-500 px-4 text-sm font-medium text-white transition-colors hover:bg-green-600 active:scale-95"
        >
          <Check className="h-4 w-4" />
          ยืนยัน
        </button>
      </header>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative flex-1 touch-none select-none overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Image */}
        {imgUrl && (
          <img
            src={imgUrl}
            alt="crop"
            draggable={false}
            className="pointer-events-none absolute transition-transform duration-200"
            style={{
              left: renderedImg.x,
              top: renderedImg.y,
              width: renderedImg.w,
              height: renderedImg.h,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          />
        )}

        {/* Dark overlay with cutout */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ filter: "drop-shadow(0 0 0 black)" }}
        >
          <defs>
            <mask id="crop-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={cropBox.x}
                y={cropBox.y}
                width={cropBox.w}
                height={cropBox.h}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#crop-mask)"
          />
        </svg>

        {/* Crop border */}
        <div
          className="pointer-events-none absolute border-2 border-white"
          style={{
            left: cropBox.x,
            top: cropBox.y,
            width: cropBox.w,
            height: cropBox.h,
          }}
        >
          {/* Grid lines (rule of thirds) */}
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
          <div className="absolute top-1/3 left-0 h-px w-full bg-white/30" />
          <div className="absolute top-2/3 left-0 h-px w-full bg-white/30" />
        </div>

        {/* Move handle (center) */}
        <div
          className="absolute cursor-grab active:cursor-grabbing"
          style={{
            left: cropBox.x,
            top: cropBox.y,
            width: cropBox.w,
            height: cropBox.h,
          }}
          onPointerDown={(e) => handlePointerDown(e, "move")}
        />

        {/* Corner handles */}
        {(
          [
            ["nw", "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize"],
            ["ne", "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize"],
            ["sw", "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize"],
            ["se", "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize"],
          ] as const
        ).map(([pos, cls]) => (
          <div
            key={pos}
            className={`absolute z-10 rounded-full bg-white shadow-lg ${cls}`}
            style={{ width: handleSize, height: handleSize }}
            onPointerDown={(e) =>
              handlePointerDown(e, pos as "nw" | "ne" | "sw" | "se")
            }
          />
        ))}
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-center gap-6 bg-gray-950 px-6 pb-6 pt-4">
        <button
          type="button"
          onClick={rotate}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          <RotateCw className="h-5 w-5" />
        </button>
      </footer>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
