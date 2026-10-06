import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Timer,
  DoorOpen,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchToday,
  fetchMyRecords,
  checkInAction,
  checkOutAction,
} from "../api/attendanceSlice";
import type { AttendanceStatus } from "../attendanceType";
import { Permission } from "../../../store/hooks/permission";
import ModuleCard from "../../../components/ModuleCard";

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; badge: string; dot: string }
> = {
  working: {
    label: "ทำงานอยู่",
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  present: {
    label: "มาตรงเวลา",
    badge: "bg-primary/10 text-primary-dark",
    dot: "bg-primary",
  },
  late: {
    label: "มาสาย",
    badge: "bg-orange-50 text-orange-600",
    dot: "bg-orange-500",
  },
  early_leave: {
    label: "ออกก่อนเวลา",
    badge: "bg-blue-50 text-blue-600",
    dot: "bg-blue-500",
  },
  missed_checkout: {
    label: "ลืมลงเวลาออก",
    badge: "bg-red-50 text-red-600",
    dot: "bg-red-500",
  },
};

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} นาที`;
  return `${h} ชม. ${m} นาที`;
}

function SummaryChip({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
      <p className={`text-2xl font-bold ${className}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ModuleLinks() {
  const permissionList = useAppSelector(
    (state) =>
      new Set(state.auth.user?.permissions.map((p) => p.permission_name) ?? []),
  );

  if (!permissionList.has(Permission.ATTENDANCE_MANAGE)) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
        <Clock className="h-4 w-4 text-primary-dark" />
        เมนูของโมดูล
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard
          icon={<DoorOpen size={22} />}
          title="สรุปการลงเวลาทั้งหมด"
          description="ดูการลงเวลาของบุคลากรทุกคนและส่งออกเป็น Excel"
          to="/attendance/manage"
          accent="blue"
        />
      </div>
    </section>
  );
}

export default function AttendancePage() {
  const dispatch = useAppDispatch();
  const {
    today,
    records: rawRecords,
    summary,
    loadingToday,
    loadingRecords,
    actionLoading,
    error,
  } = useAppSelector((state) => state.attendance);

  const records = rawRecords ?? [];

  const [now, setNow] = useState(() => new Date());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    dispatch(fetchToday());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMyRecords(month));
  }, [dispatch, month]);

  const clockTime = now.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateText = now.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasCheckedIn = !!today?.check_in_at;
  const hasCheckedOut = !!today?.check_out_at;

  async function handleCheckIn() {
    const res = await dispatch(checkInAction());
    if (checkInAction.fulfilled.match(res)) {
      dispatch(fetchMyRecords(month));
    }
  }

  async function handleCheckOut() {
    const res = await dispatch(checkOutAction());
    if (checkOutAction.fulfilled.match(res)) {
      dispatch(fetchMyRecords(month));
    }
  }

  const summaryCards = useMemo(
    () => [
      { key: "working", label: "ทำงานอยู่", value: summary?.working ?? 0, cls: "text-amber-600" },
      { key: "present", label: "มาตรงเวลา", value: summary?.present ?? 0, cls: "text-primary-dark" },
      { key: "late", label: "มาสาย", value: summary?.late ?? 0, cls: "text-orange-600" },
      { key: "early_leave", label: "ออกก่อนเวลา", value: summary?.early_leave ?? 0, cls: "text-blue-600" },
      { key: "missed_checkout", label: "ลืมลงเวลาออก", value: summary?.missed_checkout ?? 0, cls: "text-red-600" },
    ],
    [summary],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">ลงเวลาปฏิบัติงาน</h1>
        <p className="mt-1 text-sm text-gray-500">
          บันทึกเวลาเข้างาน-ออกงานประจำวัน
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* การ์ดหลัก: นาฬิกา + ปุ่มลงเวลา */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1b365d] to-[#2c5aa0] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm text-blue-200">{dateText}</p>
            <p className="mt-1 font-mono text-5xl font-bold tabular-nums sm:text-6xl">
              {clockTime}
            </p>
            <p className="mt-2 text-sm text-blue-200">
              {hasCheckedOut
                ? "ลงเวลาออกงานแล้ว วันนี้ครบถ้วนแล้ว 🎉"
                : hasCheckedIn
                  ? "ลงเวลาเข้างานแล้ว อย่าลืมกดออกงานเมื่อเลิกงาน"
                  : "ยังไม่ได้ลงเวลาวันนี้"}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <button
              onClick={handleCheckIn}
              disabled={hasCheckedIn || actionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn className="h-5 w-5" />
              ลงเวลาเข้างาน
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!hasCheckedIn || hasCheckedOut || actionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#1b365d] shadow-lg transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-5 w-5" />
              ลงเวลาออกงาน
            </button>
          </div>
        </div>
      </div>

      {/* บันทึกวันนี้ */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <Clock className="h-4 w-4 text-primary-dark" />
          บันทึกวันนี้
        </h2>

        {loadingToday ? (
          <p className="py-4 text-center text-sm text-gray-400">กำลังโหลด...</p>
        ) : !today ? (
          <p className="py-4 text-center text-sm text-gray-400">
            ยังไม่มีบันทึกการลงเวลาวันนี้
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-500">เวลาเข้า</p>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {formatTime(today.check_in_at)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-500">เวลาออก</p>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {formatTime(today.check_out_at)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-500">รวมเวลาทำงาน</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatDuration(today.work_minutes)}
              </p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-gray-50 p-4">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_CONFIG[today.status].badge}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[today.status].dot}`}
                />
                {STATUS_CONFIG[today.status].label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* สรุปเดือน */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((c) => (
          <SummaryChip key={c.key} label={c.label} value={c.value} className={c.cls} />
        ))}
      </div>

      {/* เมนูของโมดูล */}
      <ModuleLinks />

      {/* ตารางรายเดือน */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <Timer className="h-4 w-4 text-primary-dark" />
            ประวัติการลงเวลา
          </h2>
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {loadingRecords ? (
          <p className="py-8 text-center text-sm text-gray-400">กำลังโหลด...</p>
        ) : records.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            ไม่มีบันทึกการลงเวลาในเดือนนี้
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">วันที่</th>
                  <th className="px-6 py-3">เวลาเข้า</th>
                  <th className="px-6 py-3">เวลาออก</th>
                  <th className="px-6 py-3">รวมเวลาทำงาน</th>
                  <th className="px-6 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-800">
                      {formatDate(r.record_date)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {formatTime(r.check_in_at)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {formatTime(r.check_out_at)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {formatDuration(r.work_minutes)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${STATUS_CONFIG[r.status].badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[r.status].dot}`}
                        />
                        {STATUS_CONFIG[r.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* คำอธิบายสถานะ */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> มาตรงเวลา = เข้าก่อนเวลากำหนด
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" /> มาสาย = เข้าหลังเวลา 08:15
        </span>
        <span className="flex items-center gap-1.5">
          <DoorOpen className="h-3.5 w-3.5" /> ออกก่อนเวลา = ออกก่อน 16:30
        </span>
      </div>
    </div>
  );
}
