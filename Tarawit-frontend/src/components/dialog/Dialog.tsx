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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        <div className="p-6">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${current.bg}`}
          >
            <Icon className={`h-8 w-8 ${current.color}`} />
          </div>

          <h2 className="text-center text-lg font-semibold text-gray-900">
            {dialog.title}
          </h2>

          <p className="mt-3 whitespace-pre-line text-center text-sm text-gray-500">
            {dialog.message}
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {dialog.mode === "confirm" && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              {dialog.cancelText ?? "ยกเลิก"}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm text-white ${current.button}`}
          >
            {dialog.confirmText ?? "ตกลง"}
          </button>
        </div>
      </div>
    </div>
  );
}
