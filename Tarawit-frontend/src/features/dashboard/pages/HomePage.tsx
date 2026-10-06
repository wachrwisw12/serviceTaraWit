import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  Sparkles,
  UsersRound,
} from "lucide-react";

import schoolCampus from "../../../assets/images/school-campus-hero.jpg";
import ErrorBoundary from "../../../components/ErrorBoundary";
import { pages } from "../../../constants/menu.config";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { Permission } from "../../../store/hooks/permission";
import { filterPagesByPermission } from "../../../utils/menu";
import type { User } from "../../auth/authType";
import { fetchMyInstance } from "../../evaluation/api/MyInstanceSlice";
import type { MyEvaluationAssignment } from "../../evaluation/types/EvaluationSectionForm_type";
import { fetchExecutiveDashboard } from "../../report/api/reportSlice";
import { fetchMyModules } from "../../setting/api/moduleSettings";
import MainMenuSection from "../components/MainMenuSection";

type RoleProfile = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: { label: string; path: string };
};

type DashboardStat = {
  label: string;
  value: number;
  suffix: string;
  icon: typeof UsersRound;
  tone: "blue" | "cyan" | "violet" | "emerald" | "rose" | "amber";
};

const ROLE_PROFILES: Record<string, RoleProfile> = {
  SUPER_ADMIN: {
    eyebrow: "ศูนย์ควบคุมระบบ",
    title: "พร้อมดูแลทุกระบบงานของโรงเรียน",
    description: "ตรวจสอบผู้ใช้ สิทธิ์ และความพร้อมของแต่ละโมดูลได้จากหน้าเดียว",
    primaryAction: { label: "ตรวจบทบาทและสิทธิ์", path: "/roles" },
  },
  ADMIN: {
    eyebrow: "งานดูแลระบบวันนี้",
    title: "จัดการข้อมูลโรงเรียนได้อย่างเป็นระบบ",
    description: "เข้าถึงผู้ใช้ บุคลากร และการตั้งค่าที่สำคัญได้อย่างรวดเร็ว",
    primaryAction: { label: "จัดการบัญชีผู้ใช้", path: "/user/manage" },
  },
  DIRECTOR: {
    eyebrow: "ภาพรวมสำหรับผู้บริหาร",
    title: "เห็นภาพรวม ติดตามงาน ตัดสินใจได้ทันเวลา",
    description: "ติดตามบุคลากร การลงเวลา และผลการประเมินจากข้อมูลล่าสุด",
    primaryAction: { label: "ดูแดชบอร์ดผู้บริหาร", path: "/reports" },
  },
  ADMIN_INSTANCE: {
    eyebrow: "ระบบนิเทศและประเมิน",
    title: "วางแผนและติดตามงานประเมินให้ครบทุกขั้นตอน",
    description: "ตรวจงานค้าง เปิดรอบใหม่ และติดตามความคืบหน้าได้จากจุดเดียว",
    primaryAction: { label: "สร้างรายการประเมิน", path: "/evaluation/instance/create" },
  },
  TECHER: {
    eyebrow: "พื้นที่ทำงานของคุณ",
    title: "เริ่มวันทำงานจากรายการที่สำคัญ",
    description: "ดูงานนิเทศที่ได้รับมอบหมาย ติดตามผล และเข้าถึงระบบที่ใช้ประจำ",
    primaryAction: { label: "ดูงานประเมินของฉัน", path: "/my/evaluation" },
  },
};

const DEFAULT_PROFILE = ROLE_PROFILES.TECHER;
const ROLE_PRIORITY = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "ADMIN_INSTANCE", "TECHER"];
const STAT_TONES: Record<DashboardStat["tone"], string> = {
  blue: "bg-blue-50 text-blue-600",
  cyan: "bg-cyan-50 text-cyan-600",
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
};

function isEvaluator(item: MyEvaluationAssignment) {
  return item.role === "evaluator" || item.role === "both";
}

function isTarget(item: MyEvaluationAssignment) {
  return item.role === "target" || item.role === "both";
}

function needsAction(item: MyEvaluationAssignment) {
  if (item.status !== "OPEN") return false;
  return Boolean((isEvaluator(item) && item.my_pending_assignment_id) || isTarget(item));
}

function getRoleCodes(user: User | null): string[] {
  return user?.roles.map((role) => {
    if (role.role_code) return role.role_code;
    const name = role.role_name.toLowerCase();
    if (name.includes("super")) return "SUPER_ADMIN";
    if (name.includes("admin ระบบประเมิน")) return "ADMIN_INSTANCE";
    if (name === "admin" || name.includes("ผู้ดูแลระบบ")) return "ADMIN";
    if (name.includes("ผู้บริหาร") || name.includes("ผู้อำนวยการ")) return "DIRECTOR";
    if (name.includes("ครู")) return "TECHER";
    return "";
  }) ?? [];
}

export default function HomePage() {
  useDocumentTitle("หน้าหลัก");
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { executive, loading: executiveLoading } = useAppSelector((state) => state.report);
  const { myinstance, listLoading, listError } = useAppSelector((state) => state.myInstance);
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => new Date());

  const permissionList = useMemo(
    () => new Set(user?.permissions.map((permission) => permission.permission_name) ?? []),
    [user],
  );
  const roleCodes = useMemo(() => getRoleCodes(user), [user]);
  const profile =
    ROLE_PRIORITY.map((code) => (roleCodes.includes(code) ? ROLE_PROFILES[code] : null)).find(Boolean) ??
    DEFAULT_PROFILE;
  const canViewReport = permissionList.has(Permission.REPORT_VIEW);

  useEffect(() => {
    dispatch(fetchMyInstance());
    if (canViewReport) dispatch(fetchExecutiveDashboard());
    fetchMyModules()
      .then((items) => {
        setEnabledModules(
          new Set(
            items
              .filter((item) => item.enabled && item.show_on_web)
              .map((item) => item.key),
          ),
        );
      })
      .catch(() => setEnabledModules(new Set()));
  }, [canViewReport, dispatch]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const menuItems = useMemo(
    () =>
      filterPagesByPermission(pages, user?.permissions ?? [], enabledModules)
        .filter((item) => item.id !== "home")
        .slice(0, 9),
    [enabledModules, user?.permissions],
  );
  const actionItems = useMemo(() => myinstance.filter(needsAction), [myinstance]);
  const openCount = myinstance.filter((item) => item.status === "OPEN").length;
  const completedCount = myinstance.filter((item) => item.status === "CLOSED").length;
  const greeting = now.getHours() < 12 ? "สวัสดีตอนเช้า" : now.getHours() < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";
  const displayName = user?.first_name || "ผู้ใช้งาน";

  const stats: DashboardStat[] = executive
    ? [
        { label: "บุคลากรที่ใช้งาน", value: executive.personnel.active, suffix: "คน", icon: UsersRound, tone: "blue" },
        { label: "มาปฏิบัติงานวันนี้", value: executive.attendance.today.present, suffix: "คน", icon: Clock3, tone: "cyan" },
        { label: "รอบประเมินที่เปิด", value: executive.evaluation.instances.open, suffix: "รอบ", icon: ClipboardCheck, tone: "violet" },
        { label: "ส่งการประเมินแล้ว", value: Math.round(executive.evaluation.assignments.completion_percent), suffix: "%", icon: CheckCircle2, tone: "emerald" },
      ]
    : [
        { label: "ระบบที่ใช้งานได้", value: menuItems.length, suffix: "ระบบ", icon: Sparkles, tone: "blue" },
        { label: "งานที่ต้องทำ", value: actionItems.length, suffix: "รายการ", icon: ClipboardCheck, tone: "rose" },
        { label: "รายการกำลังเปิด", value: openCount, suffix: "รายการ", icon: Clock3, tone: "amber" },
        { label: "รายการเสร็จสิ้น", value: completedCount, suffix: "รายการ", icon: CheckCircle2, tone: "emerald" },
      ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 pb-8 sm:space-y-5">
      <section className="relative min-h-[270px] overflow-hidden bg-[#0b2948] shadow-[0_22px_50px_rgba(20,64,109,0.18)]">
        <img src={schoolCampus} alt="โรงเรียนท่าแร่วิทยา" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,25,45,0.92)_0%,rgba(5,31,54,0.72)_42%,rgba(5,28,50,0.18)_76%,rgba(5,25,45,0.38)_100%)]" />
        <div className="relative flex min-h-[270px] flex-col justify-between gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:p-9">
          <div className="max-w-2xl self-center lg:self-end">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{profile.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold leading-[1.25] text-white drop-shadow-sm sm:text-4xl">{profile.title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50/85 sm:text-base">{profile.description}</p>
            <Link to={profile.primaryAction.path} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0f5fc2] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              {profile.primaryAction.label}<ArrowRight size={16} />
            </Link>
          </div>

          <div className="w-full rounded-2xl border border-white/15 bg-[#061b31]/75 p-4 text-white shadow-xl backdrop-blur-md sm:w-[250px]">
            <p className="text-xs text-blue-100/80">{now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">{now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p>
            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="text-sm font-semibold">{greeting} คุณ{displayName}</p>
              <p className="mt-1 truncate text-xs text-blue-100/70">{user?.roles?.[0]?.role_name || "ผู้ใช้งานระบบ"}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="สถิติสำคัญ" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex min-h-[104px] items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-[0_10px_30px_rgba(38,85,135,0.07)]">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] ${STAT_TONES[stat.tone]}`}><Icon size={21} /></span>
              <span className="min-w-0">
                <span className="block text-xs text-slate-500">{stat.label}</span>
                <span className="mt-1 block text-2xl font-bold tabular-nums text-[#132b47]">{executiveLoading && !executive ? "—" : stat.value} <small className="text-xs font-medium text-slate-400">{stat.suffix}</small></span>
              </span>
            </div>
          );
        })}
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-5">
        <MainMenuSection items={menuItems} />
        <ErrorBoundary label="งานนิเทศของฉัน">
          <TaskPanel items={myinstance} loading={listLoading} error={listError} onRetry={() => dispatch(fetchMyInstance())} />
        </ErrorBoundary>
      </div>

      {canViewReport && executive ? (
        <section className="flex flex-col gap-4 rounded-[22px] border border-white/80 bg-[linear-gradient(120deg,#0c3157,#1267bb)] p-5 text-white shadow-[0_16px_40px_rgba(17,82,145,0.15)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/12"><BarChart3 size={23} /></span>
            <div><h2 className="font-semibold">ภาพรวมข้อมูลสำหรับผู้บริหาร</h2><p className="mt-1 text-sm text-blue-100/75">คะแนนประเมินเฉลี่ย {executive.evaluation.avg_percent == null ? "ยังไม่มีข้อมูล" : `${executive.evaluation.avg_percent.toFixed(1)}%`} · บุคลากรทั้งหมด {executive.personnel.total} คน</p></div>
          </div>
          <Link to="/reports" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0f5fc2] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">ดูรายงานทั้งหมด<ArrowRight size={16} /></Link>
        </section>
      ) : null}
    </div>
  );
}

function TaskPanel({ items, loading, error, onRetry }: { items: MyEvaluationAssignment[]; loading: boolean; error: string | null; onRetry: () => void }) {
  const activeItems = items.filter((item) => item.status === "OPEN").slice(0, 4);

  return (
    <section className="overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_14px_40px_rgba(38,85,135,0.08)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">รายการล่าสุด</p><h2 className="mt-1 font-bold text-[#132b47]">งานที่ต้องดำเนินการ</h2></div>
        <span className="grid min-w-7 place-items-center rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">{items.filter(needsAction).length}</span>
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-400"><RefreshCw size={16} className="animate-spin" />กำลังโหลดงาน...</div>
      ) : error ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center"><p className="text-sm text-rose-600">{error}</p><button type="button" onClick={onRetry} className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">ลองใหม่</button></div>
      ) : activeItems.length > 0 ? (
        <div className="divide-y divide-slate-100 px-5">
          {activeItems.map((item) => {
            const pending = needsAction(item);
            const submitted = item.my_submitted_count ?? item.target_submitted_count ?? 0;
            const total = item.my_assignment_count ?? item.target_evaluator_count ?? 0;
            return (
              <Link key={item.id} to={item.my_pending_assignment_id ? `/evaluation/score/${item.my_pending_assignment_id}` : `/my/evaluation-results-detail/${item.id}`} className="group flex gap-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400">
                <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${pending ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}><ClipboardCheck size={17} /></span>
                <span className="min-w-0 flex-1"><span className="flex items-start gap-2"><span className="line-clamp-2 flex-1 text-sm font-semibold leading-5 text-[#18324f] group-hover:text-blue-600">{item.template_name}</span><ChevronRight size={15} className="mt-0.5 shrink-0 text-slate-300 group-hover:text-blue-500" /></span><span className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-400"><span>ปี {item.academic_year} · รอบ {item.round}</span><span className={pending ? "font-medium text-amber-600" : "text-slate-400"}>{total > 0 ? `${submitted}/${total}` : pending ? "รอดำเนินการ" : "ดูรายละเอียด"}</span></span></span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={23} /></span><p className="mt-3 text-sm font-semibold text-slate-700">ไม่มีงานค้างในขณะนี้</p><p className="mt-1 text-xs text-slate-400">งานใหม่จะปรากฏที่นี่เมื่อได้รับมอบหมาย</p></div>
      )}

      <Link to="/my/evaluation" className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-3.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50">ดูงานนิเทศทั้งหมด<ArrowRight size={14} /></Link>
    </section>
  );
}
