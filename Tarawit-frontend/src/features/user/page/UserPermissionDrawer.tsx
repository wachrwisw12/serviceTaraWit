import { X } from "lucide-react";
import { useState } from "react";
import PermissionTabs from "./PermissionTabs";

interface Props {
  open: boolean;
  onClose: () => void;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export default function UserPermissionDrawer({ open, onClose, user }: Props) {
  const [activeTab, setActiveTab] = useState<"role" | "extra" | "all">("role");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* drawer */}
      <div
        className="
          absolute right-0 top-0
          h-full w-full max-w-xl
          bg-white dark:bg-gray-900
          shadow-xl
          flex flex-col
        "
      >
        {/* Header */}
        <div
          className="
          flex items-center justify-between
          border-b px-6 py-4
        "
        >
          <div>
            <h2 className="text-lg font-semibold">จัดการสิทธิ์ผู้ใช้</h2>

            <p className="text-sm text-gray-500">
              {user?.first_name} {user?.last_name}
            </p>
          </div>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Tabs */}
        <PermissionTabs value={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "role" && <div>Role Tab</div>}

          {activeTab === "extra" && <div>Extra Permission Tab</div>}

          {activeTab === "all" && <div>Effective Permission Tab</div>}
        </div>
      </div>
    </div>
  );
}
