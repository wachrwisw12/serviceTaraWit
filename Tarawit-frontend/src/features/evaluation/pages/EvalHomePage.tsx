import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileEdit,
  FilePlus2,
  History,
  LayoutTemplate,
  Send,
  UserRound,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { Permission } from "../../../store/hooks/permission";
import {
  fetchAllEvaluationTasks,
  type MyEvaluationTask,
} from "../api/MyTaskSlice";
import { fetchMyInstance } from "../api/MyInstanceSlice";
import type { MyEvaluationAssignment } from "../types/EvaluationSectionForm_type";

const STATUS_CONFIG = {
  closed: {
    label: "เสร็จสิ้น",
    icon: CheckCircle2,
    className: "bg-primary/10 text-primary-dark",
  },
  open: {
    label: "กำลังดำเนินการ",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700",
  },
  draft: {
    label: "แบบร่าง",
    icon: FileEdit,
    className: "bg-gray-100 text-gray-600",
  },
} as const;

const TOOLS = [
  {
    title: "งานนิเทศของฉัน",
    description: "รายการที่ต้องตอบ ให้คะแนน และติดตามผล",
    path: "/my/evaluation",
    permission: Permission.INSTANCE_VIEW,
    icon: ClipboardList,
  },
  {
    title: "รายการที่ฉันสร้าง",
    description: "สร้างและติดตามรายการนิเทศ",
    path: "/evaluation/my-created",
    permission: Permission.INSTANCE_CREATE,
    icon: FilePlus2,
  },
  {
    title: "แม่แบบนิเทศ",
    description: "จัดการแม่แบบนิเทศและแบบสอบถาม",
    path: "/evaluation/templates",
    permission: Permission.TEMPLATE_VIEW,
    icon: LayoutTemplate,
  },
  {
    title: "รอบการนิเทศ",
    description: "ดูรอบตามปีการศึกษาและสถานะ",
    path: "/evaluation/rounds",
    permission: Permission.EVALUATION_ROUND_VIEW,
    icon: CalendarRange,
  },
  {
    title: "รายการรอส่ง",
    description: "ตรวจและส่งรายการที่ได้รับมอบหมาย",
    path: "/evaluation/submit",
    permission: Permission.EVALUATION_SUBMIT,
    icon: Send,
  },
  {
    title: "ผลรายบุคคล",
    description: "ดูผลการนิเทศของแต่ละบุคคล",
    path: "/results/person",
    permission: Permission.RESULT_PERSON_VIEW,
    icon: UserRound,
  },
  {
    title: "สรุปผล",
    description: "สรุปผลแยกตามปีและรอบ",
    path: "/results/summary",
    permission: Permission.RESULT_SUMMARY_VIEW,
    icon: BarChart3,
  },
  {
    title: "ประวัติผลนิเทศ",
    description: "ค้นหาและดูผลย้อนหลัง",
    path: "/results/history",
    permission: Permission.RESULT_HISTORY_VIEW,
    icon: History,
  },
];

function EvaluationRow({
  item,
  onOpen,
}: {
  item: MyEvaluationTask;
  onOpen: (batchId: string) => void;
}) {
  const total = item.total_target ?? 0;
  const completed = item.completed_target ?? 0;
  const remaining = Math.max(total - completed, 0);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const status = item.status in STATUS_CONFIG ? item.status : "open";
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen(item.batch_id)}
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-slate-100 px-4 py-4 text-left transition-colors last:border-0 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_140px_90px_auto] sm:px-5"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">    { item.title || "รายการนิเทศ"}
          </p>
          <span
            className={`hidden items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium xs:inline-flex ${config.className}`}
          >
            <StatusIcon size={11} />
            {config.label}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          ปี {item.academic_year || "-"} · รอบ {item.round || "-"}
        </p>
      </div>

      <div className="hidden sm:block">
        <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
          <span>ความคืบหน้า</span>
          <span>{completed}/{total}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-slate-800">{remaining}</p>
        <p className="text-[11px] text-slate-400">คงเหลือ</p>
      </div>

      <ChevronRight
        size={18}
        className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
      />
    </button>
  );
}

function MyTargetRow({ item }: { item: MyEvaluationAssignment }) {
  const status = item.status?.toUpperCase();
  const statusLabel =
    status === "OPEN"
      ? "ต้องดำเนินการ"
      : status === "CLOSED"
        ? "เสร็จสิ้น"
        : "ยังไม่เปิด";
  const statusClass =
    status === "OPEN"
      ? "bg-amber-50 text-amber-700"
      : status === "CLOSED"
        ? "bg-primary/10 text-primary-dark"
        : "bg-slate-100 text-slate-500";

  return (
    <Link
      to={`/my/evaluation-results-detail/${item.id}`}
      className="group flex items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-0 hover:bg-slate-50 sm:px-5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-dark">
        <ClipboardList size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">
            {item.template_name}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
            {statusLabel}
          </span>
        </span>
        <span className="mt-1 block text-xs text-slate-500">
          ปี {item.academic_year || "-"} · รอบ {item.round || "-"}
        </span>
      </span>
      <span className="hidden text-xs font-semibold text-primary-dark sm:block">
        {status === "OPEN" ? "เปิดรายการ" : "ดูรายละเอียด"}
      </span>
      <ChevronRight size={18} className="text-slate-300 group-hover:text-primary" />
    </Link>
  );
}

export default function EvalHomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { allTasks, allLoading, allError } = useAppSelector(
    (state) => state.evaluationTask,
  );
  const { myinstance, listLoading, listError } = useAppSelector(
    (state) => state.myInstance,
  );
  const permissionList = useAppSelector(
    (state) =>
      new Set(
        state.auth.user?.permissions.map(
          (permission) => permission.permission_name,
        ) ?? [],
      ),
  );
  const canViewInstance = permissionList.has(Permission.INSTANCE_VIEW);
  const canCreateInstance = permissionList.has(Permission.INSTANCE_CREATE);
  const canManageEvaluation =
    canCreateInstance ||
    permissionList.has(Permission.EVALUATION_ROUND_VIEW) ||
    permissionList.has(Permission.TEMPLATE_VIEW);
  const visibleTools = TOOLS.filter((tool) =>
    permissionList.has(tool.permission),
  );

  useEffect(() => {
    if (canViewInstance) {
      dispatch(fetchMyInstance());
      if (canManageEvaluation) dispatch(fetchAllEvaluationTasks());
    }
  }, [dispatch, canViewInstance, canManageEvaluation]);

  const tasks = useMemo(() => {
    const order = { open: 0, draft: 1, closed: 2 };
    return [...(allTasks ?? [])].sort(
      (a, b) =>
        (order[a.status as keyof typeof order] ?? 3) -
        (order[b.status as keyof typeof order] ?? 3),
    );
  }, [allTasks]);
  const openCount = tasks.filter((task) => task.status === "open").length;
  const draftCount = tasks.filter((task) => task.status === "draft").length;
  const closedCount = tasks.filter((task) => task.status === "closed").length;
  const targetItems = useMemo(
    () =>
      myinstance
        .filter((item) => item.role === "target" || item.role === "both")
        .sort((a, b) => {
          const order = { OPEN: 0, DRAFT: 1, CLOSED: 2 };
          return (
            (order[a.status as keyof typeof order] ?? 3) -
            (order[b.status as keyof typeof order] ?? 3)
          );
        }),
    [myinstance],
  );
  const targetOpenCount = targetItems.filter(
    (item) => item.status === "OPEN",
  ).length;
  const primaryAction = canCreateInstance
    ? { label: "สร้างรายการนิเทศ", path: "/evaluation/instance/create" }
    : { label: "ดูงานนิเทศของฉัน", path: "/my/evaluation" };
  const heroTitle = canManageEvaluation
    ? "จัดการงานนิเทศจากจุดเดียว"
    : "ติดตามงานนิเทศของฉัน";
  const heroDescription = canManageEvaluation
    ? "เตรียมรายการ เปิดรอบ ติดตามผู้ประเมิน และตรวจผลตามลำดับงาน"
    : "เตรียมข้อมูล ติดตามผู้ประเมิน และดูผลเมื่อจบรอบนิเทศ";

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="h-1 bg-primary" />
        <div className="grid gap-5 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-dark">
              ศูนย์งานนิเทศ
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {heroTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {heroDescription}
            </p>
          </div>
          <Link
            to={primaryAction.path}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {primaryAction.label}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {visibleTools.length > 0 && (
        <section aria-labelledby="evaluation-tools-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2
                id="evaluation-tools-heading"
                className="font-semibold text-slate-900"
              >
                เมนูระบบนิเทศ
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                เลือกงานที่ต้องการดำเนินการ
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {visibleTools.length} เมนู
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className="group relative flex min-h-24 items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform group-hover:scale-x-100 group-focus-visible:scale-x-100" />
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-dark">
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">
                      {tool.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {tool.description}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {canViewInstance && (
        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                รายการที่ฉันต้องรับการนิเทศ
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                รายการที่เปิดอยู่จะแสดงก่อน · ต้องดำเนินการ {targetOpenCount} รายการ
              </p>
            </div>
            <Link
              to="/my/evaluation"
              className="text-xs font-semibold text-primary-dark hover:underline"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {listLoading && (
              <p className="px-5 py-10 text-center text-sm text-slate-400">
                กำลังโหลดรายการของคุณ...
              </p>
            )}
            {listError && !listLoading && (
              <p className="px-5 py-10 text-center text-sm text-red-500">
                โหลดรายการของคุณไม่สำเร็จ กรุณาลองใหม่
              </p>
            )}
            {!listLoading && !listError && targetItems.length === 0 && (
              <div className="px-5 py-10 text-center">
                <CheckCircle2 size={28} className="mx-auto text-primary" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  ตอนนี้ยังไม่มีรายการที่ต้องรับการนิเทศ
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  รายการใหม่จะแสดงที่นี่เมื่อคุณได้รับมอบหมาย
                </p>
              </div>
            )}
            {!listLoading &&
              !listError &&
              targetItems
                .slice(0, 5)
                .map((item) => <MyTargetRow key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {canManageEvaluation && (
        <section>
          <div className="mb-3">
            <h2 className="font-semibold text-slate-900">สถานะการนิเทศ</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              ภาพรวมของรอบที่อยู่ในระบบขณะนี้
            </p>
          </div>
          <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-4">
            <div className="border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">
              <p className="text-xs text-slate-500">ทั้งหมด</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{tasks.length}</p>
            </div>
            <div className="border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">
              <p className="text-xs text-slate-500">กำลังดำเนินการ</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{openCount}</p>
            </div>
            <div className="border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">
              <p className="text-xs text-slate-500">แบบร่าง</p>
              <p className="mt-1 text-2xl font-bold text-slate-700">{draftCount}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500">เสร็จสิ้น</p>
              <p className="mt-1 text-2xl font-bold text-primary-dark">{closedCount}</p>
            </div>
          </div>
        </section>
      )}

      {canManageEvaluation && (
        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                รายการนิเทศล่าสุด
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                รายการที่กำลังดำเนินการจะแสดงก่อน
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {tasks.length} รายการ
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {allLoading && (
              <p className="px-5 py-10 text-center text-sm text-slate-400">
                กำลังโหลดรายการ...
              </p>
            )}
            {allError && !allLoading && (
              <p className="px-5 py-10 text-center text-sm text-red-500">
                โหลดรายการไม่สำเร็จ กรุณาลองใหม่
              </p>
            )}
            {!allLoading && !allError && tasks.length === 0 && (
              <div className="px-5 py-10 text-center">
                <CheckCircle2 size={28} className="mx-auto text-primary" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  ยังไม่มีรายการนิเทศ
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {canCreateInstance
                    ? "เริ่มต้นโดยสร้างรายการนิเทศใหม่"
                    : "รายการใหม่จะแสดงเมื่อคุณได้รับมอบหมาย"}
                </p>
              </div>
            )}
            {!allLoading &&
              !allError &&
              tasks.slice(0, 6).map((item) => (
                <EvaluationRow
                  key={item.batch_id}
                  item={item}
                  onOpen={(batchId) =>
                    navigate(`/evaluation/batches/${batchId}`)
                  }
                />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
