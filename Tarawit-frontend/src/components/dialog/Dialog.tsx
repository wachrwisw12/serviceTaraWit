import { useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import type { DialogState } from "./types";

interface DialogProps {
  dialog: DialogState;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function Dialog({ dialog, onConfirm, onCancel }: DialogProps) {
  useEffect(() => {
    if (!dialog.open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // ป้องกัน background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [dialog.open, onCancel]);

  if (!dialog.open) return null;

  const config = {
    info: {
      icon: AlertCircle,
      color: "text-blue-500",
      bg: "bg-blue-100",
      button: "bg-blue-600 hover:bg-blue-700",
    },

    success: {
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-100",
      button: "bg-green-600 hover:bg-green-700",
    },

    warning: {
      icon: AlertTriangle,
      color: "text-yellow-500",
      bg: "bg-yellow-100",
      button: "bg-yellow-600 hover:bg-yellow-700",
    },

    error: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-100",
      button: "bg-red-600 hover:bg-red-700",
    },
  };

  const current = config[dialog.type ?? "info"];
  const Icon = current.icon;

  return (
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-black/40
        px-4
        backdrop-blur-[2px]
        animate-in fade-in duration-150
      "
      onMouseDown={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-dialog-title"
        aria-describedby="global-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
        className="
          w-full max-w-md
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
          animate-in
          fade-in
          zoom-in-95
          duration-200
        "
      >
        {/* Content */}
        <div className="px-6 pb-6 pt-7">
          {/* Icon */}
          <div
            className={`
              mx-auto mb-4
              flex h-14 w-14
              items-center justify-center
              rounded-full
              ${current.bg}
            `}
          >
            <Icon className={`h-7 w-7 ${current.color}`} />
          </div>

          {/* Title */}
          <h2
            id="global-dialog-title"
            className="text-center text-lg font-semibold text-gray-900"
          >
            {dialog.title}
          </h2>

          {/* Message */}
          <p
            id="global-dialog-description"
            className="
              mt-2
              whitespace-pre-line
              text-center
              text-sm
              leading-6
              text-gray-500
            "
          >
            {dialog.message}
          </p>
        </div>

        {/* Footer */}
        <div
          className="
            flex justify-end gap-3
            border-t border-gray-100
            bg-gray-50/50
            px-6 py-4
          "
        >
          {dialog.mode === "confirm" && (
            <button
              type="button"
              onClick={onCancel}
              className="
                rounded-lg
                border border-gray-300
                bg-white
                px-4 py-2
                text-sm font-medium
                text-gray-700
                transition-colors
                hover:bg-gray-50
                focus:outline-none
                focus:ring-2
                focus:ring-gray-300
              "
            >
              {dialog.cancelText ?? "ยกเลิก"}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`
              rounded-lg
              px-4 py-2
              text-sm font-medium
              text-white
              transition-colors
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              ${current.button}
            `}
          >
            {dialog.confirmText ?? "ตกลง"}
          </button>
        </div>
      </div>
    </div>
  );
}
