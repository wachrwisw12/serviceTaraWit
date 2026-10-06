import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Hourglass,
  Play,
  Square,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchMyInstance } from "../../evaluation/api/MyInstanceSlice";
import { usePermission } from "../../../store/hooks/usePermission";
import type { MyEvaluationAssignment } from "../../evaluation/types/EvaluationSectionForm_type";

const ACCENT = "var(--color-primary)";

const STATUS_META: Record<
  string,
  { label: string; badge: string; icon: typeof Hourglass; sort: number }
> = {
  OPEN: {
    label: "เปิดประเมิน",
    badge: "bg-amber-50 text-amber-600",
    icon: Clock,
    sort: 0,
  },
  DRAFT: {
    label: "ฉบับร่าง",
    badge: "bg-gray-100 text-gray-600",
    icon: Hourglass,
    sort: 1,
  },
  CLOSED: {
    label: "เสร็จสิ้น",
    badge: "bg-emerald-50 text-emerald-600",
    icon: CheckCircle2,
    sort: 2,
  },
};

/* ─────────── Helpers ─────────── */
function isEvaluator(item: MyEvaluationAssignment) {
  return item.role === "evaluator" || item.role === "both";
}
function isTarget(item: MyEvaluationAssignment) {
  return item.role === "target" || item.role === "both";
}
function isSurvey(item: MyEvaluationAssignment) {
  return item.template_type === "SURVEY";
}

function getStatusMeta(status: string) {
  return STATUS_META[status] ?? STATUS_META.DRAFT;
}

/* ─────────── Main Component ─────────── */
export default function EvaluationSummarySection() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { myinstance, listLoading, listError } = useAppSelector(
    (state) => state.myInstance,
  );
  const { hasPermission } = usePermission();
  const canManage = hasPermission("instance.create");
  const [showCompleted, setShowCompleted] = useState(false);

  const load = useCallback(() => {
    dispatch(fetchMyInstance());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const items = myinstance ?? [];

  // เรียงตาม status (OPEN → DRAFT → CLOSED)
  const sorted = [...items].sort(
    (a, b) =>
      (STATUS_META[a.status]?.sort ?? 9) - (STATUS_META[b.status]?.sort ?? 9),
  );
  const visibleItems = showCompleted
    ? sorted
    : sorted.filter((item) => item.status !== "CLOSED");
  const completedCount = items.filter(
    (item) => item.status === "CLOSED",
  ).length;

  // สิ่งที่ต้องทำ (action required)
  const actionItems = items.filter(
    (i) =>
      (isTarget(i) && i.status === "OPEN") ||
      (isSurvey(i) && i.my_pending_assignment_id && i.status === "OPEN") ||
      (isEvaluator(i) && i.my_pending_assignment_id && i.status === "OPEN"),
  );

  if (listLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <RefreshCw size={16} className="animate-spin" />
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  if (listError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <div className="flex flex-col items-center text-center">
          <AlertCircle size={20} className="text-red-400" />
          <p className="mt-2 text-sm font-medium text-red-700">{listError}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 transition-colors hover:bg-gray-50"
          >
            <RefreshCw size={14} />
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">งานนิเทศของฉัน</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            รายการที่ต้องดำเนินการและความคืบหน้าล่าสุด
          </p>
        </div>
        {completedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowCompleted((value) => !value)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-primary-dark"
          >
            {showCompleted
              ? "ซ่อนรายการเสร็จสิ้น"
              : `ดูรายการเสร็จสิ้น (${completedCount})`}
          </button>
        )}
      </div>
      {/* ─── สิ่งที่ต้องทำ (เตือนด้านบน) ─── */}
      {actionItems.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-amber-500" />
            <p className="text-sm font-medium text-amber-800">
              คุณมี {actionItems.length} รายการที่ต้องดำเนินการ
            </p>
            <button
              type="button"
              onClick={() => navigate("/my/evaluation")}
              className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              ดูทั้งหมด
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Data Table ─── */}
      {visibleItems.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">รายการนิเทศ</th>
                  <th className="px-4 py-3 font-medium">ปีการศึกษา</th>
                  <th className="px-4 py-3 font-medium">รอบ</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">บทบาทของคุณ</th>
                  <th className="px-4 py-3 font-medium">ความคืบหน้า</th>
                  <th className="px-4 py-3 font-medium text-right">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => {
                  const config = getStatusMeta(item.status);
                  const StatusIcon = config.icon;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                    >
                      {/* รายการนิเทศ */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: "var(--color-primary-soft)",
                              color: ACCENT,
                            }}
                          >
                            <ClipboardCheck size={16} strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate font-medium text-gray-900">
                              {item.template_name}
                            </span>
                            {isSurvey(item) && (
                              <span className="mt-0.5 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                                แบบสอบถาม
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ปีการศึกษา */}
                      <td className="px-4 py-3.5 text-gray-600">
                        {item.academic_year}
                      </td>

                      {/* รอบ */}
                      <td className="px-4 py-3.5 text-gray-600">
                        รอบ {item.round}
                      </td>

                      {/* สถานะ */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badge}`}
                        >
                          <StatusIcon size={12} strokeWidth={2.5} />
                          {config.label}
                        </span>
                      </td>

                      {/* บทบาท */}
                      <td className="px-4 py-3.5">
                        <RoleBadge item={item} />
                      </td>

                      {/* ความคืบหน้า */}
                      <td className="px-4 py-3.5">
                        {isTarget(item) && !isSurvey(item) ? (
                          <TargetProgressCell item={item} />
                        ) : isEvaluator(item) &&
                          item.my_assignment_count != null ? (
                          <ProgressCell item={item} />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* การดำเนินการ */}
                      <td className="px-4 py-3.5 text-right">
                        <ActionCell
                          item={item}
                          navigate={navigate}
                          canManage={canManage}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── ว่างเปล่า ─── */
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <ClipboardCheck size={32} className="mx-auto text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">
            ยังไม่มีรายการประเมิน
          </p>
          <p className="mt-1 text-xs text-gray-400">
            รายการใหม่จะปรากฏที่นี่เมื่อมีการสร้างรอบประเมิน
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────── Role Badge ─────────── */
function RoleBadge({ item }: { item: MyEvaluationAssignment }) {
  if (item.role === "both") {
    return (
      <div className="flex items-center gap-1">
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          ผู้นิเทศ
        </span>
        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
          ถูกประเมิน
        </span>
      </div>
    );
  }
  if (isEvaluator(item)) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
        ผู้นิเทศ
      </span>
    );
  }
  if (isTarget(item)) {
    return (
      <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700">
        ถูกประเมิน
      </span>
    );
  }
  return <span className="text-xs text-gray-400">—</span>;
}

/* ─────────── Progress Cell ─────────── */
function ProgressCell({ item }: { item: MyEvaluationAssignment }) {
  const submitted = item.my_submitted_count ?? 0;
  const total = item.my_assignment_count ?? 0;
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-xs text-gray-500">
        {submitted}/{total}
      </span>
    </div>
  );
}

function TargetProgressCell({ item }: { item: MyEvaluationAssignment }) {
  const submitted = item.target_submitted_count ?? 0;
  const total = item.target_evaluator_count ?? 0;

  if (total === 0) {
    return <span className="text-xs text-gray-400">ยังไม่มีผู้ประเมิน</span>;
  }

  const pct = Math.min(100, Math.round((submitted / total) * 100));

  return (
    <div className="flex min-w-[145px] items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-xs text-gray-500">
        <span className="font-medium text-gray-700">
          {submitted}/{total}
        </span>{" "}
        ผู้ประเมินแล้ว
      </span>
    </div>
  );
}

/* ─────────── Action Cell ─────────── */
function ActionCell({
  item,
  navigate,
  canManage,
}: {
  item: MyEvaluationAssignment;
  navigate: ReturnType<typeof useNavigate>;
  canManage: boolean;
}) {
  // ผู้นิเทศ — ไปให้คะแนน
  if (
    isEvaluator(item) &&
    item.my_pending_assignment_id &&
    item.status === "OPEN"
  ) {
    return (
      <Link
        to="/my/evaluation"
        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
      >
        ไปให้คะแนน
        <ChevronRight size={14} />
      </Link>
    );
  }

  // ผู้นิเทศ — DRAFT + canManage → เปิดประเมิน
  if (isEvaluator(item) && item.status === "DRAFT" && canManage) {
    return (
      <Link
        to="/my/evaluation"
        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
      >
        <Play size={14} />
        เปิดประเมิน
      </Link>
    );
  }

  // ผู้นิเทศ — DRAFT + !canManage
  if (isEvaluator(item) && item.status === "DRAFT" && !canManage) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-400">
        รอเปิดประเมิน
      </span>
    );
  }

  // ผู้นิเทศ — OPEN + canManage → ปิดการนิเทศ
  if (isEvaluator(item) && item.status === "OPEN" && canManage) {
    return (
      <Link
        to="/my/evaluation"
        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
      >
        <Square size={14} />
        ปิดการนิเทศ
      </Link>
    );
  }

  // แบบสอบถาม — ตอบแบบสอบถาม
  if (
    isSurvey(item) &&
    item.my_pending_assignment_id &&
    item.status === "OPEN"
  ) {
    return (
      <button
        type="button"
        onClick={() =>
          navigate(`/evaluation/score/${item.my_pending_assignment_id}`)
        }
        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
      >
        ตอบแบบสอบถาม
        <ChevronRight size={14} />
      </button>
    );
  }

  // แบบสอบถาม — เสร็จแล้ว → ดูผล
  if (
    isSurvey(item) &&
    !item.my_pending_assignment_id &&
    item.status !== "DRAFT"
  ) {
    return (
      <Link
        to={`/my/evaluation-results-detail/${item.id}`}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary"
      >
        ดูผล
        <ChevronRight size={14} />
      </Link>
    );
  }

  // ผู้ถูกประเมิน — ดูการนิเทศ
  if (isTarget(item) && !isSurvey(item)) {
    return (
      <Link
        to={`/my/evaluation-results-detail/${item.id}`}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary"
      >
        ดูการนิเทศ
        <ChevronRight size={14} />
      </Link>
    );
  }

  return <span className="text-xs text-gray-400">—</span>;
}
