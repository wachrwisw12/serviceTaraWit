import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  Users,
  Timer,
  CheckCircle2,
  AlertTriangle,
  DoorOpen,
  History,
  Pencil,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchAllRecords } from "../api/attendanceSlice";
import type { AttendanceStatus } from "../attendanceType";
import type { AttendanceRecordWithUser } from "../attendanceType";
import AttendanceEditDialog from "../components/AttendanceEditDialog";

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

function SummaryCard({
  icon: Icon,
  label,
  value,
  textClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  textClass: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-dark">
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${textClass}`}>{value}</p>
      </div>
    </div>
  );
}

export default function AttendanceManagePage() {
  const dispatch = useAppDispatch();
  const { allRecords, allSummary, loadingRecords } = useAppSelector(
    (state) => state.attendance,
  );

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [recordDialog, setRecordDialog] = useState<{
    record: AttendanceRecordWithUser;
    tab: "edit" | "history";
  } | null>(null);

  useEffect(() => {
    dispatch(fetchAllRecords(month));
  }, [dispatch, month]);

  const records = useMemo(() => allRecords ?? [], [allRecords]);

  const uniqueUsers = useMemo(() => {
    const seen = new Set<number>();
    for (const r of records) seen.add(r.user_id);
    return seen.size;
  }, [records]);

  function handleExport() {
    const rows: (string | number)[][] = [
      ["สรุปการลงเวลาปฏิบัติงาน", ""],
      ["เดือน", month],
      [],
      ["#", "วันที่", "ชื่อ-นามสกุล", "เวลาเข้า", "เวลาออก", "รวมเวลาทำงาน", "สถานะ", "พื้นที่"],
    ];

    records.forEach((r, i) => {
      rows.push([
        i + 1,
        formatDate(r.record_date),
        `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.username,
        formatTime(r.check_in_at),
        formatTime(r.check_out_at),
        formatDuration(r.work_minutes),
        STATUS_CONFIG[r.status]?.label ?? r.status,
        r.check_in_inside_area == null ? "ไม่ได้ตรวจ" : r.check_in_inside_area ? "ในพื้นที่" : "นอกพื้นที่ (ได้รับสิทธิ์)",
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 28 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "การลงเวลา");
    XLSX.writeFile(workbook, `สรุปการลงเวลา-${month}.xlsx`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            สรุปการลงเวลาปฏิบัติงาน
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            ดูการลงเวลาของบุคลากรทุกคนและส่งออกเป็น Excel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleExport}
            disabled={records.length === 0 || loadingRecords}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            ส่งออก Excel
          </button>
        </div>
      </div>

      {/* การ์ดสรุป */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <SummaryCard
          icon={Users}
          label="ผู้ที่ลงเวลาทั้งหมด"
          value={uniqueUsers}
          textClass="text-gray-900"
        />
        <SummaryCard
          icon={Timer}
          label="ทำงานอยู่"
          value={allSummary?.working ?? 0}
          textClass="text-amber-600"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="มาตรงเวลา"
          value={allSummary?.present ?? 0}
          textClass="text-primary-dark"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="มาสาย"
          value={allSummary?.late ?? 0}
          textClass="text-orange-600"
        />
        <SummaryCard
          icon={DoorOpen}
          label="ออกก่อนเวลา"
          value={allSummary?.early_leave ?? 0}
          textClass="text-blue-600"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="ลืมลงเวลาออก"
          value={allSummary?.missed_checkout ?? 0}
          textClass="text-red-600"
        />
      </div>

      {/* ตาราง */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <Timer className="h-4 w-4 text-primary-dark" />
            บันทึกการลงเวลาทั้งหมด
          </h2>
          <span className="text-xs text-gray-400">{records.length} รายการ</span>
        </div>

        {loadingRecords ? (
          <p className="py-10 text-center text-sm text-gray-400">กำลังโหลด...</p>
        ) : records.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            ไม่มีบันทึกการลงเวลาในเดือนนี้
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">วันที่</th>
                  <th className="px-6 py-3">ผู้ใช้งาน</th>
                  <th className="px-6 py-3">เวลาเข้า</th>
                  <th className="px-6 py-3">เวลาออก</th>
                  <th className="px-6 py-3">รวมเวลาทำงาน</th>
                  <th className="px-6 py-3">สถานะ</th>
                  <th className="px-6 py-3">พื้นที่</th>
                  <th className="px-6 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="whitespace-nowrap px-6 py-3.5 font-medium text-gray-800">
                      {formatDate(r.record_date)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-gray-800">
                        {r.first_name} {r.last_name}
                      </div>
                      <div className="text-xs text-gray-400">{r.username}</div>
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
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${STATUS_CONFIG[r.status]?.badge ?? "bg-gray-100 text-gray-600"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[r.status]?.dot ?? "bg-gray-400"}`}
                        />
                        {STATUS_CONFIG[r.status]?.label ?? r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-xs">
                      {r.check_in_inside_area == null ? (
                        <span className="text-gray-400">ไม่ได้ตรวจ</span>
                      ) : r.check_in_inside_area ? (
                        <span className="font-medium text-emerald-700">ในพื้นที่ · {Math.round(r.check_in_distance_m ?? 0)} ม.</span>
                      ) : (
                        <span className="font-medium text-blue-700">นอกพื้นที่ · ได้รับสิทธิ์</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      <button onClick={() => setRecordDialog({ record: r, tab: "edit" })} title="แก้ไข" className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary-dark"><Pencil size={15} /></button>
                      <button onClick={() => setRecordDialog({ record: r, tab: "history" })} title="ประวัติการแก้ไข" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><History size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {recordDialog && (
        <AttendanceEditDialog
          record={recordDialog.record}
          initialTab={recordDialog.tab}
          onClose={() => setRecordDialog(null)}
          onSaved={() => dispatch(fetchAllRecords(month))}
        />
      )}
    </div>
  );
}
