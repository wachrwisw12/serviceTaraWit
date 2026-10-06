import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  Hourglass,
  Users,
  XCircle,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchEvaluationInstances } from "../../evaluation/api/evaluationinstanceSlice";
import { fetchExecutiveDashboard } from "../api/reportSlice";
import type { EvaluationInstanceListItem } from "../../evaluation/types/instance_type";

type StatusFilter = "all" | "draft" | "open" | "closed";

const STATUS_CONFIG = {
  draft: {
    label: "ฉบับร่าง",
    icon: FileText,
    className: "bg-gray-100 text-gray-600",
  },
  open: {
    label: "กำลังประเมิน",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700",
  },
  closed: {
    label: "ปิดแล้ว",
    icon: CheckCircle2,
    className: "bg-primary/10 text-primary-dark",
  },
} as const;

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function InstanceRow({ item }: { item: EvaluationInstanceListItem }) {
  const status = item.status in STATUS_CONFIG ? item.status : "open";
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  const progressPct =
    item.assignment_count > 0
      ? Math.round(
          (((item as EvaluationInstanceListItem & { completed_count?: number })
            .completed_count ?? 0) /
            item.assignment_count) *
            100,
        )
      : 0;

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
      <td className="px-5 py-4">
        <div className="font-semibold text-gray-900">{item.template_name}</div>
        <div className="mt-0.5 text-xs text-gray-400">
          ปีการศึกษา {item.academic_year} · รอบ {item.round}
        </div>
      </td>
      <td className="text-center">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
        >
          <StatusIcon size={12} />
          {config.label}
        </span>
      </td>
      <td className="text-center text-sm text-gray-600">{item.target_count}</td>
      <td className="text-center text-sm text-gray-600">
        {item.evaluator_count}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {item.assignment_count > 0 ? `${progressPct}%` : "—"}
          </span>
        </div>
      </td>
      <td className="text-center">
        <Link
          to={`/evaluation/my-created/${item.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary-dark"
        >
          <Eye size={14} />
          ดูรายละเอียด
        </Link>
      </td>
    </tr>
  );
}

export default function EvaluationReportPage() {
  const dispatch = useAppDispatch();
  const { instances, listLoading, listError } = useAppSelector(
    (state) => state.evaluationInstance,
  );
  const { executive } = useAppSelector((state) => state.report);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchEvaluationInstances());
    if (!executive) {
      dispatch(fetchExecutiveDashboard());
    }
  }, [dispatch, executive]);

  const filteredInstances = useMemo(() => {
    return instances
      .filter((item) => {
        const matchStatus =
          statusFilter === "all" || item.status === statusFilter;
        const matchSearch =
          searchQuery.trim() === "" ||
          item.template_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchSearch;
      })
      .sort((a, b) => {
        // เรียง open ขึ้นก่อน, ตามด้วย draft, แล้ว closed
        const order = { open: 0, draft: 1, closed: 2 };
        return (
          (order[a.status as keyof typeof order] ?? 3) -
          (order[b.status as keyof typeof order] ?? 3)
        );
      });
  }, [instances, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = instances.length;
    const open = instances.filter((i) => i.status === "open").length;
    const draft = instances.filter((i) => i.status === "draft").length;
    const closed = instances.filter((i) => i.status === "closed").length;
    const totalTargets = instances.reduce((sum, i) => sum + i.target_count, 0);
    const totalEvaluators = instances.reduce(
      (sum, i) => sum + i.evaluator_count,
      0,
    );
    return { total, open, draft, closed, totalTargets, totalEvaluators };
  }, [instances]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/reports"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                รายงานผลการประเมิน
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                ดูผลการประเมินทั้งหมด พร้อมรายละเอียดคะแนนและสถานะ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          icon={ClipboardList}
          label="รายการประเมินทั้งหมด"
          value={stats.total}
          accent="bg-violet-50 text-violet-600"
        />
        <KpiCard
          icon={Clock3}
          label="กำลังประเมิน"
          value={stats.open}
          accent="bg-amber-50 text-amber-600"
        />
        <KpiCard
          icon={Hourglass}
          label="ฉบับร่าง"
          value={stats.draft}
          accent="bg-gray-100 text-gray-600"
        />
        <KpiCard
          icon={CheckCircle2}
          label="ปิดแล้ว"
          value={stats.closed}
          accent="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          icon={Users}
          label="ผู้ถูกประเมินรวม"
          value={stats.totalTargets}
          accent="bg-blue-50 text-blue-600"
        />
      </div>

      {/* ตัวกรอง */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาชื่อแม่แบบ..."
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex gap-2">
          {(["all", "open", "draft", "closed"] as StatusFilter[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  statusFilter === status
                    ? "bg-primary text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {status === "all" ? "ทั้งหมด" : STATUS_CONFIG[status].label}
              </button>
            ),
          )}
        </div>
      </div>

      {/* ตารางรายการประเมิน */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">ชื่อแม่แบบ / รอบ</th>
                <th className="px-5 py-3 text-center">สถานะ</th>
                <th className="px-5 py-3 text-center">ผู้ถูกประเมิน</th>
                <th className="px-5 py-3 text-center">ผู้ประเมิน</th>
                <th className="px-5 py-3">ความคืบหน้า</th>
                <th className="px-5 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {listLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
                  </td>
                </tr>
              )}

              {!listLoading && listError && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-sm text-red-500">{listError}</p>
                  </td>
                </tr>
              )}

              {!listLoading && !listError && filteredInstances.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <XCircle size={32} className="text-gray-300" />
                      <p className="text-sm">
                        ไม่พบรายการประเมินที่ตรงกับเงื่อนไข
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!listLoading &&
                !listError &&
                filteredInstances.map((item) => (
                  <InstanceRow key={item.id} item={item} />
                ))}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-500">
            แสดง {filteredInstances.length} จาก {instances.length} รายการ
          </p>
        </div>
      </div>
    </div>
  );
}
