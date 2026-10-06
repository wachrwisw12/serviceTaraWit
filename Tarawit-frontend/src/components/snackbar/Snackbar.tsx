import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type SnackbarType = "success" | "error" | "warning" | "info";

interface SnackbarProps {
  open: boolean;
  message: string;
  type: SnackbarType;
  duration?: number;
  onClose: () => void;
}

const colors = {
  success: "bg-primary",
  error: "bg-red-600",
  warning: "bg-yellow-500 text-black",
  info: "bg-blue-600",
};

const icons = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

export default function Snackbar({
  open,
  message,
  type,
  duration = 3000,
  onClose,
}: SnackbarProps) {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(onClose, duration);

    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        open
          ? "translate-y-0 opacity-100"
          : "translate-y-5 opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-lg px-5 py-3 shadow-xl text-white ${colors[type]}`}
      >
        {icons[type]}

        <span className="text-sm">{message}</span>

        <button onClick={onClose}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
