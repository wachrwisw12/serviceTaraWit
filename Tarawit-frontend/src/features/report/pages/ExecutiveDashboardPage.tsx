import { useEffect } from "react";
import {
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Layers,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import ModuleHero from "../../../components/ModuleHero";
import {
  DonutChart,
  HBarList,
  StackedBarChart,
} from "../components/charts";
import { fetchExecutiveDashboard } from "../api/reportSlice";

const ATT_COLORS = {
  present: "#10b981",
  late: "#f59e0b",
  working: "#3b82f6",
  early_leave: "#f97316",
  absent: "#9ca3af",
};

const PALETTE = [
  "#1d4ed8",
  "#0d9488",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#65a30d",
  "#0891b2",
  "#b45309",
];

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
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
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
  right,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          <Icon size={18} className="text-gray-400" />
          {title}
        </h2>
        {right}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function ExecutiveDashboardPage() {
  const dispatch = useAppDispatch();
  const { executive, loading, error } = useAppSelector((state) => state.report);

  useEffect(() => {
    dispatch(fetchExecutiveDashboard());
  }, [dispatch]);

  if (loading && !executive) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-2xl bg-gray-200/60" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-gray-200/60"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl bg-gray-200/60"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && !executive) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!executive) {
    return null;
  }

  const p = executive.personnel;
  const a = executive.attendance;
  const e = executive.evaluation;
  const t = executive.template;

  const todayChecked =
    a.today.present + a.today.late + a.today.working + a.today.early_leave;
  const todayTotal = p.active > 0 ? p.active : 1;
  const checkInPercent = Math.round((todayChecked / todayTotal) * 100);
  const completionPercent = Math.round(e.assignments.completion_percent ?? 0);
  const avgPercent = Math.round(e.avg_percent ?? 0);

  const todayDonut = [
    { label: "ตรงเวลา", value: a.today.present, color: ATT_COLORS.present },
    { label: "มาสาย", value: a.today.late, color: ATT_COLORS.late },
    { label: "กำลังทำงาน", value: a.today.working, color: ATT_COLORS.working },
    { label: "ออกก่อนเวลา", value: a.today.early_leave, color: ATT_COLORS.early_leave },
    { label: "ยังไม่ลงเวลา", value: a.today.absent, color: ATT_COLORS.absent },
  ].filter((s) => s.value > 0);

  const trendData = a.trend.map((t) => ({
    label: t.label,
    values: [
      { key: "present", value: t.present, color: ATT_COLORS.present },
      { key: "late", value: t.late, color: ATT_COLORS.late },
      { key: "working", value: t.working, color: ATT_COLORS.working },
      { key: "early", value: t.early_leave, color: ATT_COLORS.early_leave },
    ],
  }));

  const typeDonut = p.by_type.map((t, i) => ({
    label: t.name,
    value: t.count,
    color: PALETTE[i % PALETTE.length],
  }));

  const instDonut = [
    { label: "กำลังดำเนินการ", value: e.instances.open, color: "#f59e0b" },
    { label: "แบบร่าง", value: e.instances.draft, color: "#9ca3af" },
    { label: "เสร็จสิ้น", value: e.instances.closed, color: "#10b981" },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <ModuleHero
        icon={<BarChart3 size={26} />}
        title="แดชบอร์ดผู้บริหาร"
        description="ภาพรวมข้ามโมดูล — การลงเวลา ผลการประเมิน และข้อมูลบุคลากร"
        accent="from-[#0f4c5c] to-[#1d7a8c]"
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard
          icon={Users}
          label="บุคลากรทั้งหมด"
          value={`${p.active}`}
          sub={`ใช้งาน ${p.active} / ทั้งหมด ${p.total}`}
          accent="bg-blue-50 text-blue-600"
        />
        <KpiCard
          icon={CalendarCheck2}
          label="ลงเวลาวันนี้"
          value={`${todayChecked}/${p.active}`}
          sub={`${checkInPercent}% ของบุคลากร`}
          accent="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          icon={Clock}
          label="มาสายวันนี้"
          value={`${a.today.late}`}
          sub={`ยังไม่ลงเวลา ${a.today.absent} คน`}
          accent="bg-amber-50 text-amber-600"
        />
        <KpiCard
          icon={ClipboardList}
          label="รายการประเมิน"
          value={`${e.instances.total}`}
          sub={`เปิดอยู่ ${e.instances.open} รายการ`}
          accent="bg-violet-50 text-violet-600"
        />
        <KpiCard
          icon={CheckCircle2}
          label="ส่งการประเมินแล้ว"
          value={`${e.assignments.submitted}/${e.assignments.total}`}
          sub={`ครบ ${completionPercent}%`}
          accent="bg-teal-50 text-teal-600"
        />
        <KpiCard
          icon={UserCheck}
          label="คะแนนเฉลี่ยรวม"
          value={avgPercent > 0 ? `${avgPercent}%` : "—"}
          sub="จากการประเมินที่ส่งแล้ว"
          accent="bg-rose-50 text-rose-600"
        />
        <KpiCard
          icon={FileText}
          label="เทมเพลตประเมิน"
          value={`${t.active}`}
          sub={`ใช้งาน ${t.active} / ร่าง ${t.draft} / ปิด ${t.inactive}`}
          accent="bg-sky-50 text-sky-600"
        />
      </div>

      {/* แถวที่ 1: การลงเวลา */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="แนวโน้มการลงเวลา 6 เดือนล่าสุด"
          icon={BarChart3}
          right={
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ATT_COLORS.present }} />
                ตรงเวลา
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ATT_COLORS.late }} />
                สาย
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ATT_COLORS.working }} />
                กำลังทำงาน
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ATT_COLORS.early_leave }} />
                ออกก่อน
              </span>
            </div>
          }
        >
          {trendData.length === 0 ? (
            <p className="py-10 text-center text-gray-400">
              ยังไม่มีข้อมูลการลงเวลา
            </p>
          ) : (
            <StackedBarChart data={trendData} />
          )}
        </Card>

        <Card title="การลงเวลาวันนี้" icon={CalendarCheck2}>
          {todayDonut.length === 0 ? (
            <p className="py-10 text-center text-gray-400">
              ยังไม่มีข้อมูลการลงเวลาวันนี้
            </p>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
              <DonutChart segments={todayDonut} />
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-500">เข้างานแล้ว</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {todayChecked}
                  <span className="text-base font-medium text-gray-400">
                    {" "}
                    / {p.active} คน
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {checkInPercent}% ของบุคลากรที่ใช้งาน
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* แถวที่ 2: บุคลากร + การประเมิน */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="สัดส่วนบุคลากรตามประเภท" icon={UserRound}>
          {typeDonut.length === 0 ? (
            <p className="py-10 text-center text-gray-400">ไม่มีข้อมูล</p>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
              <DonutChart segments={typeDonut} />
              <div className="w-full max-w-56">
                <HBarList
                  items={p.by_type.map((t) => ({ name: t.name, value: t.count }))}
                  color="#1d4ed8"
                />
              </div>
            </div>
          )}
        </Card>

        <Card
          title="คะแนนเฉลี่ยรายแม่แบบ"
          icon={ClipboardList}
          right={
            <a
              href="/reports/evaluation"
              className="text-xs font-semibold text-primary-dark hover:underline"
            >
              ดูรายงานทั้งหมด
            </a>
          }
        >
          {e.avg_by_template.length === 0 ? (
            <p className="py-10 text-center text-gray-400">
              ยังไม่มีผลการประเมินที่ส่งแล้ว
            </p>
          ) : (
            <HBarList
              items={e.avg_by_template.map((t) => ({
                name: t.template_name,
                value: Math.round(t.avg_percent ?? 0),
                suffix: "%",
              }))}
              color="#0d9488"
            />
          )}
        </Card>
      </div>

      {/* แถวที่ 3: ภาพรวมการประเมิน + เทมเพลต */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="ภาพรวมการประเมิน" icon={Layers}>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
            {instDonut.length === 0 ? (
              <p className="py-10 text-center text-gray-400">ไม่มีรายการประเมิน</p>
            ) : (
              <DonutChart segments={instDonut} />
            )}
            <div className="w-full max-w-56 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-500">ความครบถ้วน</span>
                  <span className="font-semibold tabular-nums">
                    {completionPercent}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                ส่งแล้ว {e.assignments.submitted} จาก {e.assignments.total}{" "}
                รายการ
              </p>
            </div>
          </div>
        </Card>

        <Card title="เทมเพลตประเมิน" icon={FileText}>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-sky-50 p-4 text-center">
              <p className="text-3xl font-bold text-sky-600 tabular-nums">{t.active}</p>
              <p className="mt-1 text-sm text-gray-500">ใช้งานอยู่</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-3xl font-bold text-gray-500 tabular-nums">{t.draft}</p>
              <p className="mt-1 text-sm text-gray-500">ฉบับร่าง</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-3xl font-bold text-slate-400 tabular-nums">{t.inactive}</p>
              <p className="mt-1 text-sm text-gray-500">ปิดใช้งาน</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <p className="text-3xl font-bold text-blue-600 tabular-nums">{t.total}</p>
              <p className="mt-1 text-sm text-gray-500">ทั้งหมด</p>
            </div>
          </div>
        </Card>
      </div>

      {/* แถวที่ 4: บุคลากรตามตำแหน่ง */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="บุคลากรตามตำแหน่ง" icon={Users}>
          {p.by_position.length === 0 ? (
            <p className="py-10 text-center text-gray-400">ไม่มีข้อมูล</p>
          ) : (
            <HBarList
              items={p.by_position.slice(0, 6).map((x) => ({
                name: x.name,
                value: x.count,
              }))}
              color="#7c3aed"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
