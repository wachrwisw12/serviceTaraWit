import { useEffect, useState } from "react";
import type {
  BatchTarget,
  TargetInstanceStatus,
} from "../../api/batchtargetSlice";
import { ChevronDown, ChevronRight } from "lucide-react";
import { InstanceDetail } from "./InstanceDetail";

export function TargetRow({
  target,
  forceOpen,
  activeInstanceId,
  onScore,
}: {
  target: BatchTarget;
  forceOpen?: boolean;
  activeInstanceId?: number | string;
  onScore: (target: BatchTarget, instance: TargetInstanceStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  // ⬇️ ใหม่: เปิดแถวอัตโนมัติเมื่อคิวพาเรามาที่คนนี้ (เช่น กด "ถัดไป" ข้ามไปอีกคน)
  // ไม่ auto-collapse ตอน forceOpen เป็น false เพื่อไม่ให้แถวที่ผู้ใช้เปิดเองอยู่ปิดโดยไม่ตั้งใจ
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const percent = target.total_instances
    ? Math.round((target.completed_count / target.total_instances) * 100)
    : 0;

  return (
    <>
      <tr
        className={`border-b border-gray-100 hover:bg-gray-50 ${
          forceOpen ? "bg-emerald-50/40" : ""
        }`}
      >
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(!open)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"
            >
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            <div>
              <p className="font-medium text-gray-900">{target.name}</p>

              <p className="text-xs text-gray-500">{target.position}</p>
            </div>
          </div>
        </td>

        <td className="px-4">{target.total_instances} รายการ</td>

        <td className="px-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="
h-full
bg-[#2fae60]
"
                style={{
                  width: `${percent}%`,
                }}
              />
            </div>

            <span className="text-xs text-gray-500">
              {target.completed_count}/{target.total_instances}
            </span>
          </div>
        </td>

        <td className="px-4">
          {percent === 100 ? (
            <span className="text-xs text-green-600">ครบแล้ว</span>
          ) : (
            <span className="text-xs text-orange-500">กำลังดำเนินการ</span>
          )}
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={4}>
            <InstanceDetail
              target={target}
              activeInstanceId={activeInstanceId}
              onScore={onScore}
            />
          </td>
        </tr>
      )}
    </>
  );
}
