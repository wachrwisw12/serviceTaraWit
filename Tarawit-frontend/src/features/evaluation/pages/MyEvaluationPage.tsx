// pages/MyEvaluationResultsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ClipboardCheck,
  Hourglass,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchMyInstance } from "../api/MyInstanceSlice";
import type { MyEvaluationAssignment } from "../types/EvaluationSectionForm_type";

const ACCENT = "#2fae60";

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
    badge: "bg-sky-50 text-sky-600",
    icon: Hourglass,
  },
  CLOSED: {
    label: "เสร็จสิ้น",
    badge: "bg-emerald-50 text-emerald-600",
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
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function EvaluatorsCell({ item }: { item: MyEvaluationAssignment }) {
  if (!item.evaluators || item.evaluators.length === 0) {
    return <span className="text-xs text-gray-300">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {item.evaluators.map((e) => (
        <span
          key={e.user_id}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 max-w-full"
          title={
            e.position_snapshort
              ? `${e.name_snapshort} · ${e.position_snapshort}`
              : e.name_snapshort
          }
        >
          <span className="truncate">{e.name_snapshort}</span>
          {e.position_snapshort && (
            <span className="text-gray-400 shrink-0">
              · {e.position_snapshort}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function MyEvaluationPage() {
  const dispatch = useAppDispatch();
  const { myinstance, listLoading, listError } = useAppSelector(
    (state) => state.myInstance,
  );

  useEffect(() => {
    dispatch(fetchMyInstance());
  }, [dispatch]);

  const results = myinstance;
  const loading = listLoading;
  const error = listError;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(() => {
    return results.filter((item) => {
      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;
      const matchSearch = item.template_name
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [results, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, statusFilter]);

  // --- summary metrics ---
  const totalCount = results.length;
  const closedCount = results.filter((r) => r.status === "CLOSED").length;
  const latestYear = useMemo(() => {
    if (results.length === 0) return "-";
    return results
      .map((r) => r.academic_year)
      .sort((a, b) => Number(b) - Number(a))[0];
  }, [results]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          รายการที่ฉันถูกประเมิน
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          ติดตามผลการประเมินและความคืบหน้าของผู้ประเมินแต่ละรอบ
        </p>
      </div>

      {/* summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Layers}
          iconBg="rgba(47,174,96,0.1)"
          iconColor={ACCENT}
          label="รายการทั้งหมด"
          value={`${totalCount} รายการ`}
        />
        <SummaryCard
          icon={CheckCircle2}
          iconBg="#ecfdf5"
          iconColor="#059669"
          label="ประเมินเสร็จสิ้นแล้ว"
          value={`${closedCount} ครั้ง`}
        />
        <SummaryCard
          icon={CalendarClock}
          iconBg="#fffbeb"
          iconColor="#d97706"
          label="ปีการศึกษาล่าสุด"
          value={latestYear}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
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

          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อรายการประเมิน..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#2fae60] focus:ring-1 focus:ring-[#2fae60]/30"
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3 font-medium">รายการประเมิน</th>
                    <th className="px-4 py-3 font-medium">ปีการศึกษา</th>
                    <th className="px-4 py-3 font-medium">รอบ</th>
                    <th className="px-4 py-3 font-medium">สถานะ</th>
                    <th className="px-4 py-3 font-medium">ผู้ประเมิน</th>
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
                                backgroundColor: "rgba(47,174,96,0.1)",
                                color: ACCENT,
                              }}
                            >
                              <ClipboardCheck size={16} strokeWidth={2} />
                            </div>
                            <span className="font-medium text-gray-900">
                              {item.template_name}
                            </span>
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
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badge}`}
                          >
                            <StatusIcon size={12} strokeWidth={2.5} />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <EvaluatorsCell item={item} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            to={`/my/evaluation-results-detail/${item.id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#2fae60]"
                          >
                            ดูการประเมิน
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-gray-500">
                หน้า {page} จาก {totalPages} · ทั้งหมด {filtered.length} รายการ
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

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
    </div>
  );
}
