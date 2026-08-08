import { CheckCircle2, Clock3 } from "lucide-react";

export function StatusBadge({ status }: { status?: string }) {
  if (status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-600">
        <CheckCircle2 size={12} />
        เสร็จแล้ว
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs text-orange-600">
      <Clock3 size={12} />
      รอดำเนินการ
    </span>
  );
}
