// pages/MyEvaluationResultsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ClipboardCheck,
  Hourglass,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  CalendarClock,
  Sparkles,
  RefreshCw,
  X,
  Users,
  Play,
  Square,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { usePermission } from "../../../store/hooks/usePermission";
import { useDialog } from "../../../components/dialog";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import { fetchMyInstance } from "../api/MyInstanceSlice";
import {
  closeEvaluationInstance,
  startEvaluationInstance,
} from "../api/createdEvaluationSlice";
import type {
  MyAssignmentInfo,
  MyEvaluationAssignment,
} from "../types/EvaluationSectionForm_type";

const ACCENT = "var(--color-primary)";

const KNOWN_STATUS_META: Record<
  string,
  { label: string; badge: string; icon: typeof Hourglass }
> = {
  DRAFT: {
    label: "ฉบับร่าง",
    badge: "bg-gray-100 text-gray-600",
    icon: Hourglass,
  },
  OPEN: {
    label: "เปิดประเมิน",
    badge: "bg-amber-50 text-amber-600",
    icon: Hourglass,
  },
  CLOSED: {
    label: "เสร็จสิ้น",
    badge: "bg-primary/10 text-primary-dark",
    icon: CheckCircle2,
  },
};

const FALLBACK_STATUS_META = {
  badge: "bg-gray-100 text-gray-600",
  icon: Hourglass,
};

function getStatusMeta(status: string) {
  return (
    KNOWN_STATUS_META[status] ?? { label: status, ...FALLBACK_STATUS_META }
  );
}

const PAGE_SIZE = 8;

function SummaryCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: typeof Layers;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 sm:gap-4 sm:p-5">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-gray-500 sm:text-sm">{label}</p>
        <p className="mt-0.5 text-base font-bold text-gray-900 sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

/**
 * Modal เลือกผู้ถูกประเมินก่อนเข้า form ให้คะแนน
 * - รายการที่ยังไม่ได้ให้คะแนน (รอให้คะแนน) ขึ้นก่อน
 * - คลิกชื่อ → ไปหน้า /evaluation/score/:assignmentId
 */
function TargetPickerModal({
  item,
  onClose,
  onPick,
}: {
  item: MyEvaluationAssignment;
  onClose: () => void;
  onPick: (assignmentId: number) => void;
}) {
  const [query, setQuery] = useState("");

  const assignments = useMemo(
    () => item.my_assignments ?? [],
    [item.my_assignments],
  );

  // จำนวนรวมทั้งสองกลุ่ม (ใช้ใน footer — ไม่เปลี่ยนตามการค้นหา)
  const totalPending = assignments.filter((a) => a.status !== "submitted");
  const totalDone = assignments.filter((a) => a.status === "submitted");

  /*
   * รายชื่อแยกตามกลุ่มสถานะ (รองรับการค้นหา — กรองในแต่ละกลุ่ม)
   * เพื่อแสดงหัวข้อพร้อมจำนวน: "รอให้คะแนน (N)" / "ให้คะแนนแล้ว (M)"
   */
  const pending = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = assignments.filter((a) => a.status !== "submitted");
    return q
      ? items.filter((a) => a.target_name.toLowerCase().includes(q))
      : items;
  }, [assignments, query]);

  const done = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = assignments.filter((a) => a.status === "submitted");
    return q
      ? items.filter((a) => a.target_name.toLowerCase().includes(q))
      : items;
  }, [assignments, query]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:px-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="เลือกผู้ถูกประเมิน"
        onMouseDown={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-h-[80vh] sm:rounded-2xl sm:pb-0"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-200 sm:hidden" />
        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">
              เลือกผู้ถูกประเมิน
            </h2>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {item.template_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 sm:h-8 sm:w-8"
          >
            <X size={16} />
          </button>
        </header>

        {/* Search */}
        <div className="shrink-0 border-b border-gray-100 px-4 py-3 sm:px-5">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อ..."
              autoFocus
              className="h-12 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-auto sm:py-2 sm:text-sm"
            />
          </div>
        </div>

        {/* List — จัดกลุ่มตามสถานะ พร้อมจำนวนแต่ละกลุ่ม */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {pending.length === 0 && done.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">
              ไม่พบรายชื่อที่ตรงกับเงื่อนไข
            </p>
          )}

          {pending.length > 0 && (
            <>
              <p className="sticky top-0 z-10 bg-white px-3 pb-1.5 pt-2 text-xs font-semibold text-amber-600">
                รอให้คะแนน ({pending.length})
              </p>
              {pending.map((a) => (
                <AssignmentRow
                  key={a.assignment_id}
                  assignment={a}
                  onPick={onPick}
                />
              ))}
            </>
          )}

          {done.length > 0 && (
            <>
              <p className="sticky top-0 z-10 bg-white px-3 pb-1.5 pt-2 text-xs font-semibold text-emerald-600">
                ให้คะแนนแล้ว ({done.length})
              </p>
              {done.map((a) => (
                <AssignmentRow
                  key={a.assignment_id}
                  assignment={a}
                  onPick={onPick}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-5 py-3 text-xs text-gray-500">
          {totalPending.length > 0
            ? `ยังรอให้คะแนน ${totalPending.length} คน · ให้แล้ว ${totalDone.length} คน`
            : "ให้คะแนนครบทุกคนแล้ว"}
        </footer>
      </div>
    </div>
  );
}

/**
 * แถวรายชื่อผู้ถูกประเมินใน modal เลือกชื่อ (แสดงชื่อ/ตำแหน่ง/ป้ายสถานะ)
 */
function AssignmentRow({
  assignment,
  onPick,
}: {
  assignment: MyAssignmentInfo;
  onPick: (assignmentId: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(assignment.assignment_id)}
      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 sm:min-h-0 sm:py-2.5"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {assignment.target_name}
        </p>
        {assignment.target_position && (
          <p className="truncate text-xs text-gray-500">
            {assignment.target_position}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
          assignment.status === "submitted"
            ? "bg-emerald-50 text-emerald-600"
            : "bg-amber-50 text-amber-600"
        }`}
      >
        {assignment.status === "submitted"
          ? "ให้คะแนนแล้ว"
          : "รอให้คะแนน"}
      </span>
    </button>
  );
}

function isEvaluator(item: MyEvaluationAssignment) {
  return item.role === "evaluator" || item.role === "both";
}

function isScorer(item: MyEvaluationAssignment) {
  return isEvaluator(item) && item.my_can_score !== false;
}

function isSignerOnly(item: MyEvaluationAssignment) {
  return isEvaluator(item) && item.my_requires_signature && !isScorer(item);
}

function isTarget(item: MyEvaluationAssignment) {
  return item.role === "target" || item.role === "both";
}

/** แบบสอบถาม — ผู้ตอบตอบเอง (template_type จาก backend) */
function isSurvey(item: MyEvaluationAssignment) {
  return item.template_type === "SURVEY";
}

function RoleBadge({ item }: { item: MyEvaluationAssignment }) {
  // แบบสอบถาม — ไม่มีแนวคิด "ผู้นิเทศ/ถูกประเมิน" แบบเดิม
  if (isSurvey(item)) {
    return (
      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
        แบบสอบถาม
      </span>
    );
  }

  if (!item.role || item.role === "both") {
    return (
      <>
        {item.role === "both" && (
          <>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              ผู้นิเทศ
            </span>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
              ถูกประเมิน
            </span>
          </>
        )}
      </>
    );
  }
  if (isSignerOnly(item)) {
    return (
      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
        ผู้ลงนาม
      </span>
    );
  }
  return isEvaluator(item) ? (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
      ผู้นิเทศ
    </span>
  ) : (
    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
      ถูกประเมิน
    </span>
  );
}

function EvaluatorsCell({ item }: { item: MyEvaluationAssignment }) {
  if (!item.evaluators || item.evaluators.length === 0) {
    return <span className="text-xs text-gray-300">—</span>;
  }
  const visibleEvaluators = item.evaluators.slice(0, 3);
  const remaining = item.evaluators.length - visibleEvaluators.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleEvaluators.map((e) => (
        <span
          key={e.user_id}
          className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
            e.submitted
              ? "bg-emerald-50 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
              : "bg-gray-100 text-gray-600"
          }`}
          title={e.name_snapshort}
        >
          {e.submitted && (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          )}
          <span className="truncate">{e.name_snapshort}</span>
        </span>
      ))}
      {remaining > 0 && (
        <span
          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
          title={item.evaluators
            .slice(visibleEvaluators.length)
            .map((e) => e.name_snapshort)
            .join(", ")}
        >
          +{remaining} คน
        </span>
      )}
    </div>
  );
}

/** ความคืบหน้าการให้คะแนนของรายการที่ตัวเองเป็นผู้นิเทศ */
function EvaluatorProgressCell({ item }: { item: MyEvaluationAssignment }) {
  const total = item.my_assignment_count ?? 0;
  const done = item.my_submitted_count ?? 0;

  if (total === 0) {
    return <span className="text-xs text-gray-300">—</span>;
  }

  const percent = Math.min(100, Math.round((done / total) * 100));

  return (
    <div className="min-w-[150px]">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-gray-600">ผู้ถูกประเมิน {total} คน</span>
        <span className="font-medium text-gray-900">
          {done}/{total}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** ความคืบหน้าของผู้รับการประเมินคนปัจจุบัน */
function TargetProgressCell({ item }: { item: MyEvaluationAssignment }) {
  const total = item.target_evaluator_count ?? 0;
  const done = item.target_submitted_count ?? 0;

  if (total === 0) {
    return <span className="text-xs text-gray-300">ยังไม่มีผู้ประเมิน</span>;
  }

  const percent = Math.min(100, Math.round((done / total) * 100));

  return (
    <div className="min-w-[145px]">
      <div className="flex items-center gap-2 text-xs">
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-gray-500">
          <span className="font-medium text-gray-900">
            {done}/{total}
          </span>{" "}
          ผู้ประเมินแล้ว
        </span>
      </div>
    </div>
  );
}

export default function MyEvaluationPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { confirm } = useDialog();
  const { showSnackbar } = useSnackbar();
  const { hasPermission } = usePermission();
  const { myinstance, listLoading, listError } = useAppSelector(
    (state) => state.myInstance,
  );

  /** ผู้ใช้มีสิทธิ์เปิด/ปิดการประเมิน (instance.create — ตรงกับ backend) */
  const canManage = hasPermission("instance.create");

  /** instance ที่กำลังเปิด/ปิดอยู่ (สำหรับ disable ปุ่ม + ข้อความกำลังทำ) */
  const [transitioningId, setTransitioningId] = useState<number | null>(null);

  /** รายการที่กำลังเปิด modal เลือกผู้ถูกประเมิน (null = ปิด) */
  const [pickerItem, setPickerItem] = useState<MyEvaluationAssignment | null>(
    null,
  );

  /*
   * เปิดการประเมิน (DRAFT → OPEN) — หลังเปิด ผู้ประเมินกลับมาให้คะแนนได้
   */
  const handleStart = async (item: MyEvaluationAssignment) => {
    const confirmed = await confirm({
      type: "warning",
      title: "เปิดการนิเทศ?",
      message:
        `คุณกำลังจะเปิด "${item.template_name}"\n` +
        "หลังจากเปิดแล้ว ผู้ประเมินจะเข้ามาให้คะแนนได้ทันที",
      confirmText: "เปิดการนิเทศ",
      cancelText: "ยกเลิก",
    });

    if (!confirmed) return;

    setTransitioningId(item.id);

    try {
      await dispatch(startEvaluationInstance(item.id)).unwrap();

      showSnackbar(`เปิดการนิเทศ "${item.template_name}" แล้ว`, "success");

      dispatch(fetchMyInstance());
    } catch (error) {
      showSnackbar(
        typeof error === "string" ? error : "เปิดการนิเทศไม่สำเร็จ",
        "error",
      );
    } finally {
      setTransitioningId(null);
    }
  };

  /*
   * ปิดการประเมิน (OPEN → CLOSED) — หลังปิด ให้คะแนนไม่ได้อีก
   */
  const handleClose = async (item: MyEvaluationAssignment) => {
    const confirmed = await confirm({
      type: "warning",
      title: "ปิดการนิเทศ?",
      message:
        `คุณกำลังจะปิด "${item.template_name}"\n` +
        "หลังจากปิดแล้ว ผู้ประเมินจะไม่สามารถให้คะแนนได้อีกต่อไป",
      confirmText: "ปิดการนิเทศ",
      cancelText: "ยกเลิก",
    });

    if (!confirmed) return;

    setTransitioningId(item.id);

    try {
      await dispatch(closeEvaluationInstance(item.id)).unwrap();

      showSnackbar(`ปิดการนิเทศ "${item.template_name}" แล้ว`, "success");

      dispatch(fetchMyInstance());
    } catch (error) {
      showSnackbar(
        typeof error === "string" ? error : "ปิดการนิเทศไม่สำเร็จ",
        "error",
      );
    } finally {
      setTransitioningId(null);
    }
  };

  useEffect(() => {
    dispatch(fetchMyInstance());
  }, [dispatch]);

  const results = myinstance;
  const loading = listLoading;
  const error = listError;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "evaluator" | "target">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  /**
   * โหมดของการ์ดสรุป "ยังไม่ปิด / มาใหม่"
   * - open   → แสดงจำนวนรายการที่ยังไม่ปิด (status !== CLOSED)
   * - latest → แสดงรายการประเมินล่าสุด
   * คลิกที่การ์ดเพื่อสลับ
   */
  const [cardMode, setCardMode] = useState<"open" | "latest">("open");

  const statusTabs = useMemo(() => {
    const distinct = Array.from(new Set(results.map((item) => item.status)));
    return [
      { value: "all", label: "ทั้งหมด" },
      ...distinct.map((status) => ({
        value: status,
        label: getStatusMeta(status).label,
      })),
    ];
  }, [results]);

  const roleTabs = [
    { value: "all", label: "ทั้งหมด" },
    { value: "evaluator", label: "เป็นผู้นิเทศ" },
    { value: "target", label: "ถูกประเมิน" },
  ] as const;

  const filtered = useMemo(() => {
    return results.filter((item) => {
      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "evaluator" ? isEvaluator(item) : isTarget(item));
      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;
      const matchSearch = item.template_name
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      return matchRole && matchStatus && matchSearch;
    });
  }, [results, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  // --- summary metrics ---
  const evaluatorCount = results.filter(isEvaluator).length;
  const openCount = results.filter((r) => r.status !== "CLOSED").length;
  const latestYear = useMemo(() => {
    if (results.length === 0) return "-";
    return results
      .map((r) => r.academic_year)
      .sort((a, b) => Number(b) - Number(a))[0];
  }, [results]);

  /** รายการประเมินล่าสุด (จัดเรียงตาม updated_at/start_date) */
  const latestItem = useMemo(() => {
    if (results.length === 0) return null;
    return [...results].sort((a, b) => {
      const at = a.updated_at ?? a.start_date ?? "";
      const bt = b.updated_at ?? b.start_date ?? "";
      return bt.localeCompare(at) || b.id - a.id;
    })[0];
  }, [results]);

  return (
    <div className="mx-auto max-w-6xl px-3 pb-24 pt-5 sm:px-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold text-gray-900">งานนิเทศของฉัน</h1>
        <p className="mt-1 text-sm text-gray-500">
          ติดตามผลการนิเทศและความคืบหน้าของผู้นิเทศแต่ละรอบ
        </p>
      </div>

      {/* summary cards */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-6 sm:grid-cols-3 sm:gap-4">
        <SummaryCard
          icon={Layers}
          iconBg="var(--color-primary-soft)"
          iconColor={ACCENT}
          label="เป็นผู้นิเทศ"
          value={`${evaluatorCount} รายการ`}
        />
        <button
          type="button"
          onClick={() =>
            setCardMode((mode) => (mode === "open" ? "latest" : "open"))
          }
          title={
            cardMode === "open"
              ? "คลิกเพื่อดูรายการนิเทศล่าสุด"
              : "คลิกเพื่อดูจำนวนที่ยังไม่ปิด"
          }
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-gray-50/60 sm:gap-4 sm:p-5"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12"
            style={{
              backgroundColor: cardMode === "open" ? "#fffbeb" : "#f0f9ff",
              color: cardMode === "open" ? "#d97706" : "#0284c7",
            }}
          >
            {cardMode === "open" ? (
              <Hourglass size={22} strokeWidth={2} />
            ) : (
              <Sparkles size={22} strokeWidth={2} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-gray-500 sm:text-sm">
              {cardMode === "open" ? "ยังไม่ปิด" : "มาใหม่"}
            </p>
            <p
              className="mt-0.5 truncate text-base font-bold text-gray-900 sm:text-xl"
              title={
                cardMode === "latest" && latestItem
                  ? latestItem.template_name
                  : undefined
              }
            >
              {cardMode === "open"
                ? `${openCount} รายการ`
                : latestItem?.template_name ?? "ไม่มีรายการ"}
            </p>
          </div>
          <RefreshCw
            size={14}
            className="shrink-0 text-gray-300 transition-colors group-hover:text-gray-500"
          />
        </button>
        <div className="col-span-2 sm:col-span-1">
          <SummaryCard
            icon={CalendarClock}
            iconBg="#fffbeb"
            iconColor="#d97706"
            label="ปีการศึกษาล่าสุด"
            value={latestYear}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white sm:rounded-xl">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* กรองตามบทบาท: ผู้นิเทศ / ถูกประเมิน */}
            <div>
              <p className="mb-1 text-[11px] font-medium text-gray-400">บทบาท</p>
              <div className="grid w-full grid-cols-3 rounded-xl bg-gray-100 p-1 text-sm font-medium sm:flex sm:w-fit sm:rounded-lg">
                {roleTabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setRoleFilter(tab.value)}
                    className={`min-h-10 rounded-lg px-2 py-1.5 transition-colors sm:min-h-0 sm:rounded-md sm:px-3 ${
                      roleFilter === tab.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[11px] font-medium text-gray-400">สถานะ</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={`min-h-10 shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:min-h-0 ${
                      statusFilter === tab.value
                        ? "text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    style={
                      statusFilter === tab.value
                        ? { backgroundColor: ACCENT }
                        : undefined
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อรายการนิเทศ..."
              className="h-12 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-auto sm:rounded-lg sm:py-2 sm:pl-9 sm:text-sm sm:focus:ring-1"
            />
          </div>
        </div>

        {loading && (
          <p className="py-16 text-center text-sm text-gray-400">
            กำลังโหลดข้อมูล...
          </p>
        )}

        {error && !loading && (
          <p className="py-16 text-center text-sm text-red-500">
            เกิดข้อผิดพลาด: {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-gray-400">
            ไม่พบรายการที่ตรงกับเงื่อนไข
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="divide-y divide-gray-100 md:hidden">
              {paginated.map((item) => {
                const config = getStatusMeta(item.status);
                const StatusIcon = config.icon;
                const total = isScorer(item)
                  ? item.my_assignment_count ?? 0
                  : item.target_evaluator_count ?? 0;
                const done = isScorer(item)
                  ? item.my_submitted_count ?? 0
                  : item.target_submitted_count ?? 0;
                const progress = total > 0
                  ? Math.min(100, Math.round((done / total) * 100))
                  : 0;

                return (
                  <article key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-dark">
                        <ClipboardCheck size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="line-clamp-2 text-[15px] font-semibold leading-5 text-gray-900">
                            {item.template_name}
                          </h2>
                          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${config.badge}`}>
                            <StatusIcon size={11} />
                            {config.label}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                          <span>ปี {item.academic_year}</span>
                          <span aria-hidden="true">·</span>
                          <span>รอบ {item.round}</span>
                          <RoleBadge item={item} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {isSignerOnly(item)
                            ? "ผู้ร่วมลงนามในรายงาน"
                            : isScorer(item)
                              ? "ให้คะแนนผู้รับการนิเทศ"
                              : "ผู้ประเมินส่งผลแล้ว"}
                        </span>
                        <span className="font-semibold text-gray-800">{done}/{total} คน</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-primary transition-[width]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {isTarget(item) && !isSurvey(item) && (
                        <Link
                          to={`/my/evaluation-results-detail/${item.id}`}
                          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 active:bg-gray-50"
                        >
                          ดูการนิเทศ
                        </Link>
                      )}
                      {isSignerOnly(item) && !isTarget(item) && (
                        <Link
                          to={`/my/evaluation-results-detail/${item.id}`}
                          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-violet-200 px-3 text-sm font-medium text-violet-700 active:bg-violet-50"
                        >
                          ดูผล / รายชื่อผู้ลงนาม
                        </Link>
                      )}
                      {item.status === "OPEN" && item.my_pending_assignment_id && (
                        <button
                          type="button"
                          onClick={() => isSurvey(item)
                            ? navigate(`/evaluation/score/${item.my_pending_assignment_id}`)
                            : setPickerItem(item)}
                          className="flex h-12 flex-[1.35] items-center justify-center gap-1 rounded-xl bg-primary px-4 text-sm font-semibold text-white active:bg-primary-dark"
                        >
                          {isSurvey(item) ? "ตอบแบบสอบถาม" : "ให้คะแนนต่อ"}
                          <ChevronRight size={16} />
                        </button>
                      )}
                      {isEvaluator(item) && item.status === "DRAFT" && canManage && (
                        <button
                          type="button"
                          disabled={transitioningId === item.id}
                          onClick={() => handleStart(item)}
                          className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          <Play size={16} />
                          {transitioningId === item.id ? "กำลังเปิด..." : "เปิดประเมิน"}
                        </button>
                      )}
                      {!item.my_pending_assignment_id && item.batch_id && isScorer(item) && (
                        <Link
                          to={`/evaluation/batches/${item.batch_id}`}
                          className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 active:bg-gray-50"
                        >
                          ดูรายชื่อ
                          <ChevronRight size={16} />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3 font-medium">รายการนิเทศ</th>
                    <th className="px-4 py-3 font-medium">ปีการศึกษา</th>
                    <th className="px-4 py-3 font-medium">รอบ</th>
                    <th className="px-4 py-3 font-medium">สถานะ</th>
                    <th className="px-4 py-3 font-medium">
                      {roleFilter === "evaluator"
                        ? "ผู้ถูกประเมิน"
                        : roleFilter === "target"
                          ? "ผู้ประเมิน"
                          : "ผู้ประเมิน / ผู้ถูกประเมิน"}
                    </th>
                    <th className="px-4 py-3 font-medium">ความคืบหน้า</th>
                    <th className="px-4 py-3 font-medium text-right">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => {
                    const config = getStatusMeta(item.status);
                    const StatusIcon = config.icon;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                      >
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
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="max-w-[230px] truncate font-medium text-gray-900" title={item.template_name}>
                                {item.template_name}
                              </span>
                              <RoleBadge item={item} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          {item.academic_year}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          รอบ {item.round}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex whitespace-nowrap items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badge}`}
                          >
                            <StatusIcon size={12} strokeWidth={2.5} />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            {isScorer(item) && (
                              <span className="text-xs text-gray-600">
                                ผู้ถูกประเมิน {item.my_assignment_count ?? 0} คน
                              </span>
                            )}
                            {isTarget(item) && <EvaluatorsCell item={item} />}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {isTarget(item) && !isSurvey(item) ? (
                            <TargetProgressCell item={item} />
                          ) : isScorer(item) ? (
                            <EvaluatorProgressCell item={item} />
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isTarget(item) && !isSurvey(item) && (
                              <Link
                                to={`/my/evaluation-results-detail/${item.id}`}
                                className="inline-flex whitespace-nowrap items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary"
                              >
                                ดูการนิเทศ
                                <ChevronRight size={14} />
                              </Link>
                            )}
                            {isSignerOnly(item) && !isTarget(item) && (
                              <Link
                                to={`/my/evaluation-results-detail/${item.id}`}
                                className="inline-flex whitespace-nowrap items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50"
                              >
                                ดูผล / ลงนาม
                                <ChevronRight size={14} />
                              </Link>
                            )}
                            {isSurvey(item) &&
                              item.my_pending_assignment_id &&
                              item.status === "OPEN" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/evaluation/score/${item.my_pending_assignment_id}`,
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                                >
                                  ตอบแบบสอบถาม
                                  <ChevronRight size={14} />
                                </button>
                              )}
                            {isSurvey(item) &&
                              !item.my_pending_assignment_id &&
                              item.status !== "DRAFT" && (
                                <Link
                                  to={`/my/evaluation-results-detail/${item.id}`}
                                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary"
                                >
                                  ดูผลแบบสอบถาม
                                  <ChevronRight size={14} />
                                </Link>
                              )}
                            {isScorer(item) &&
                              item.my_pending_assignment_id &&
                              item.status === "OPEN" && (
                                <button
                                  type="button"
                                  onClick={() => setPickerItem(item)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                                >
                                  ไปให้คะแนน
                                  <ChevronRight size={14} />
                                </button>
                              )}
                            {isEvaluator(item) && item.status === "DRAFT" &&
                              (canManage ? (
                                <button
                                  type="button"
                                  disabled={transitioningId === item.id}
                                  onClick={() => handleStart(item)}                                   title="เปิดการนิเทศ (DRAFT → OPEN)"
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Play size={14} />
                                  {transitioningId === item.id
                                    ? "กำลังเปิด..."
                                    : "เปิดประเมิน"}
                                </button>
                              ) : (
                                <span
                                  title="รายการยังอยู่ในสถานะฉบับร่าง — ยังไม่เปิดให้คะแนน"
                                  className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-400"
                                >
                                  รอเปิดประเมิน
                                </span>
                              ))}
                            {isEvaluator(item) &&
                              item.status === "OPEN" &&
                              canManage && (
                                <button
                                  type="button"
                                  disabled={transitioningId === item.id}
                                  onClick={() => handleClose(item)}                                   title="ปิดการนิเทศ (OPEN → CLOSED)"
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Square size={14} />
                                  {transitioningId === item.id
                                    ? "กำลังปิด..."                                     : "ปิดการนิเทศ"}
                                </button>
                              )}
                            {isScorer(item) &&
                              !item.my_pending_assignment_id &&
                              item.batch_id && (
                                <Link
                                  to={`/evaluation/batches/${item.batch_id}`}
                                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary"
                                >
                                  ดูรายชื่อ
                                  <ChevronRight size={14} />
                                </Link>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-gray-100 p-3 sm:p-4">
              <span className="text-sm text-gray-500">
                หน้า {page} จาก {totalPages} · ทั้งหมด {filtered.length} รายการ
              </span>
              <div className="hidden items-center gap-2 text-xs text-gray-400 lg:flex">
                <Users size={14} />
                กด "ไปให้คะแนน" เพื่อเลือกรายชื่อผู้ถูกประเมิน
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="hidden items-center gap-1.5 sm:flex">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .map((p, idx, arr) => (
                    <div key={p} className="flex items-center gap-1.5">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-gray-300">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(p)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? "text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                        style={
                          p === page ? { backgroundColor: ACCENT } : undefined
                        }
                      >
                        {p}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal เลือกผู้ถูกประเมิน */}
      {pickerItem && (
        <TargetPickerModal
          item={pickerItem}
          onClose={() => setPickerItem(null)}
          onPick={(assignmentId) =>
            navigate(`/evaluation/score/${assignmentId}`)
          }
        />
      )}
    </div>
  );
}
