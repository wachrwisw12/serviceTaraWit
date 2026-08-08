// ⬇️ แก้ไข: เอา ScoringDrawer ออกจากตรงนี้ — ยกไปไว้ระดับบนสุดของหน้าแทน (ตัวเดียวใช้ร่วมกันทุกแถว)

import type {
  BatchTarget,
  TargetInstanceStatus,
} from "../../api/batchtargetSlice";
import { StatusBadge } from "./StatusBadge";

// เพราะเดิมแต่ละแถวมี drawer ของตัวเอง ทำให้ไล่ให้คะแนนข้ามคนไม่ได้ต้องปิดแล้วไปเปิดแถวถัดไปเอง
export function InstanceDetail({
  target,
  activeInstanceId,
  onScore,
}: {
  target: BatchTarget;
  activeInstanceId?: number | string;
  onScore: (target: BatchTarget, instance: TargetInstanceStatus) => void;
}) {
  return (
    <div className="bg-gray-50 px-6 py-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400">
            <th className="py-2">รายการประเมิน</th>
            <th>ผู้ประเมิน</th>
            <th>สถานะ</th>
            <th className="text-right">ดำเนินการ</th>
          </tr>
        </thead>

        <tbody>
          {target.instances.map((inst) => {
            const me = inst.my_assignment_id;
            // ⬇️ ใหม่: ไฮไลต์แถวที่กำลังให้คะแนนอยู่ตอนนี้ (มาจากคิวหรือคลิกเอง)
            const isActive = activeInstanceId === inst.instance_id;

            return (
              <tr
                key={inst.instance_id}
                className={`border-t border-gray-100 transition-colors ${
                  isActive ? "bg-emerald-50" : ""
                }`}
              >
                <td className="py-3 font-medium text-gray-800">
                  {inst.template_name}
                </td>

                <td>
                  <div className="flex flex-wrap gap-1">
                    {inst.evaluators.map((e) => (
                      <span
                        key={e.evaluator_id}
                        className={`rounded-full px-2 py-1 text-xs ${
                          e.is_me
                            ? "bg-blue-50 text-blue-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {e.name}
                      </span>
                    ))}
                  </div>
                </td>

                <td>
                  <StatusBadge status={inst.my_status ?? undefined} />
                </td>

                <td className="text-right">
                  {me ? (
                    <button
                      onClick={() => onScore(target, inst)}
                      className="rounded-lg bg-[#2fae60] px-3 py-1.5 text-xs text-white hover:bg-[#218a4a]"
                    >
                      {inst.my_status === "submitted"
                        ? "แก้ไขคะแนน"
                        : "ให้คะแนน"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">
                      ไม่ใช่ผู้ประเมิน
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
