import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Play,
  Users,
  UserCheck,
  Eye,
  Plus,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";

import { useDialog } from "../../../components/dialog";

import {
  fetchMyCreatedEvaluations,
  startEvaluationInstance,
} from "../api/createdEvaluationSlice";

const ACCENT = "#2fae60";

export default function MyCreatedEvaluationsPage() {
  const dispatch = useAppDispatch();

  const { confirm, alert } = useDialog();

  const { items, loading, startingId } = useAppSelector(
    (state) => state.createdEvaluation,
  );

  useEffect(() => {
    dispatch(fetchMyCreatedEvaluations());
  }, [dispatch]);

  const handleStart = async (instanceId: number, name: string) => {
    const confirmed = await confirm({
      type: "warning",
      title: "เริ่มการประเมิน?",
      message:
        `คุณกำลังจะเปิด "${name}"\n` +
        "หลังจากเริ่มแล้ว ผู้ประเมินจะสามารถเข้ามาให้คะแนนได้",
      confirmText: "เริ่มการประเมิน",
      cancelText: "ยกเลิก",
    });

    if (!confirmed) return;

    try {
      await dispatch(startEvaluationInstance(instanceId)).unwrap();

      await alert({
        type: "success",
        title: "เริ่มการประเมินแล้ว",
        message: "ผู้ประเมินสามารถเข้ามาดำเนินการประเมินได้แล้ว",
      });
    } catch (error) {
      await alert({
        type: "error",
        title: "ไม่สามารถเริ่มได้",
        message: typeof error === "string" ? error : "เกิดข้อผิดพลาด",
      });
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            การประเมินที่ฉันสร้าง
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            จัดการรอบการประเมินและติดตามความคืบหน้า
          </p>
        </div>

        <Link
          to="/evaluation/instance/create"
          className="
            flex shrink-0 items-center gap-2
            rounded-lg
            px-4 py-2.5
            text-sm font-medium
            text-white
            transition-opacity
            hover:opacity-90
          "
          style={{ backgroundColor: ACCENT }}
        >
          <Plus className="h-4 w-4" />
          สร้างการประเมิน
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 font-medium text-gray-500">
                  แม่แบบ / รอบการประเมิน
                </th>
                <th className="px-5 py-3 font-medium text-gray-500">
                  ปีการศึกษา
                </th>
                <th className="px-5 py-3 font-medium text-gray-500">รอบ</th>
                <th className="px-5 py-3 font-medium text-gray-500">
                  ผู้ถูกประเมิน
                </th>
                <th className="px-5 py-3 font-medium text-gray-500">
                  ผู้ประเมิน
                </th>
                <th className="px-5 py-3 font-medium text-gray-500">
                  ความคืบหน้า
                </th>
                <th className="px-5 py-3 font-medium text-gray-500">สถานะ</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const isStarting = startingId === item.id;

                const progressPct =
                  item.assignment_count > 0
                    ? Math.round(
                        (item.completed_count / item.assignment_count) * 100,
                      )
                    : 0;

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-gray-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                          <ClipboardCheck className="h-4.5 w-4.5 text-emerald-600" />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {item.template_name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {item.instance_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {item.academic_year}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      รอบ {item.round}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <Users className="h-4 w-4 text-gray-400" />
                        {item.target_count} คน
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        {item.evaluator_count} คน
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {item.status !== "draft" ? (
                        <div className="w-32">
                          <div className="mb-1 flex justify-between text-xs text-gray-500">
                            <span>{progressPct}%</span>
                            <span>
                              {item.completed_count}/{item.assignment_count}
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${progressPct}%`,
                                backgroundColor: ACCENT,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          ยังไม่เริ่ม
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="ดูรายละเอียด"
                          className="
                            flex items-center gap-1.5
                            rounded-lg px-3 py-1.5
                            text-xs font-medium text-gray-600
                            hover:bg-gray-100
                          "
                        >
                          <Eye className="h-3.5 w-3.5" />
                          ดูรายละเอียด
                        </button>

                        {item.status === "draft" && (
                          <button
                            type="button"
                            disabled={isStarting}
                            onClick={() =>
                              handleStart(item.id, item.template_name)
                            }
                            className="
                              flex items-center gap-1.5
                              rounded-lg
                              px-3 py-1.5
                              text-xs font-medium
                              text-white
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                            style={{ backgroundColor: ACCENT }}
                          >
                            <Play className="h-3.5 w-3.5" />
                            {isStarting ? "กำลังเริ่ม..." : "เริ่มการประเมิน"}
                          </button>
                        )}

                        {item.status === "open" && (
                          <button
                            type="button"
                            className="
                              rounded-lg
                              bg-gray-900
                              px-3 py-1.5
                              text-xs font-medium
                              text-white
                            "
                          >
                            ดูความคืบหน้า
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center text-sm text-gray-400"
                  >
                    ยังไม่มีรายการที่คุณสร้าง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "draft" | "open" | "closed" }) {
  if (status === "open") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        กำลังประเมิน
      </span>
    );
  }

  if (status === "closed") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
        ปิดแล้ว
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
      ฉบับร่าง
    </span>
  );
}
