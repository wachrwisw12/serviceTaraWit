import { useEffect, useState } from "react";
import { History, Save, X } from "lucide-react";

import { getAttendanceAuditLogs, updateAttendanceRecord } from "../api/attendanceAdminApi";
import type { AttendanceAuditLog, AttendanceRecordWithUser, AttendanceStatus } from "../attendanceType";

type Props = {
  record: AttendanceRecordWithUser;
  initialTab: "edit" | "history";
  onClose: () => void;
  onSaved: () => void;
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function displayAuditTime(value: unknown) {
  if (typeof value !== "string" || !value) return "—";
  return new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function errorMessage(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "บันทึกการแก้ไขไม่สำเร็จ";
}

export default function AttendanceEditDialog({ record, initialTab, onClose, onSaved }: Props) {
  const [tab, setTab] = useState(initialTab);
  const [checkIn, setCheckIn] = useState(toLocalInput(record.check_in_at));
  const [checkOut, setCheckOut] = useState(toLocalInput(record.check_out_at));
  const [status, setStatus] = useState<AttendanceStatus>(record.status);
  const [note, setNote] = useState(record.note ?? "");
  const [reason, setReason] = useState("");
  const [logs, setLogs] = useState<AttendanceAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "history") return;
    setLoadingLogs(true);
    getAttendanceAuditLogs(record.id)
      .then(setLogs)
      .catch(() => setError("โหลดประวัติการแก้ไขไม่สำเร็จ"))
      .finally(() => setLoadingLogs(false));
  }, [record.id, tab]);

  async function handleSave() {
    if (reason.trim().length < 3 || !checkIn) return;
    setSaving(true); setError(null);
    try {
      await updateAttendanceRecord(record.id, {
        check_in_at: new Date(checkIn).toISOString(),
        check_out_at: checkOut ? new Date(checkOut).toISOString() : null,
        status,
        note: note.trim() || null,
        reason: reason.trim(),
      });
      onSaved(); onClose();
    } catch (err) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  }

  const person = `${record.first_name ?? ""} ${record.last_name ?? ""}`.trim() || record.username;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="แก้ไขบันทึกการลงเวลา">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-dark">Attendance record</p><h2 className="mt-1 text-xl font-bold text-slate-900">{person}</h2><p className="mt-1 text-sm text-slate-500">{new Date(`${record.record_date}T00:00:00`).toLocaleDateString("th-TH", { dateStyle: "full" })}</p></div>
          <button onClick={onClose} aria-label="ปิด" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button>
        </header>

        <div className="flex border-b border-slate-100 px-6">
          <button onClick={() => setTab("edit")} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === "edit" ? "border-primary text-primary-dark" : "border-transparent text-slate-400"}`}>แก้ไขข้อมูล</button>
          <button onClick={() => setTab("history")} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === "history" ? "border-primary text-primary-dark" : "border-transparent text-slate-400"}`}>ประวัติการแก้ไข ({logs.length})</button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-6">
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {tab === "edit" ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">เวลาเข้างาน<input type="datetime-local" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label>
                <label className="text-sm font-medium text-slate-700">เวลาออกงาน<input type="datetime-local" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label>
              </div>
              <label className="block text-sm font-medium text-slate-700">สถานะ<select value={status} onChange={(event) => setStatus(event.target.value as AttendanceStatus)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="working">ทำงานอยู่</option><option value="present">มาตรงเวลา</option><option value="late">มาสาย</option><option value="early_leave">ออกก่อนเวลา</option><option value="missed_checkout">ลืมลงเวลาออก</option></select></label>
              <label className="block text-sm font-medium text-slate-700">หมายเหตุ<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><label className="block text-sm font-semibold text-amber-900">เหตุผลการแก้ไข <span className="text-red-600">*</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="เช่น ผู้ใช้งานลืมลงเวลาออก และแนบหลักฐานยืนยันแล้ว" className="mt-2 w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm" /></label><p className="mt-2 text-xs text-amber-700">เหตุผลและค่าก่อน–หลังจะถูกบันทึกถาวรในประวัติ</p></div>
            </div>
          ) : loadingLogs ? <p className="py-10 text-center text-sm text-slate-400">กำลังโหลดประวัติ...</p> : logs.length === 0 ? <div className="py-12 text-center"><History className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-sm text-slate-500">รายการนี้ยังไม่เคยถูกแก้ไข</p></div> : (
            <div className="space-y-3">{logs.map((log) => <article key={log.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-800">{log.editor_name}</p><time className="text-xs text-slate-400">{new Date(log.edited_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</time></div><p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{log.reason}</p><div className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><div><span className="text-slate-400">เวลาเข้าก่อนแก้</span><p className="font-medium text-slate-700">{displayAuditTime(log.old_data.check_in_at)}</p></div><div><span className="text-slate-400">เวลาเข้าหลังแก้</span><p className="font-medium text-slate-700">{displayAuditTime(log.new_data.check_in_at)}</p></div><div><span className="text-slate-400">เวลาออกก่อนแก้</span><p className="font-medium text-slate-700">{displayAuditTime(log.old_data.check_out_at)}</p></div><div><span className="text-slate-400">เวลาออกหลังแก้</span><p className="font-medium text-slate-700">{displayAuditTime(log.new_data.check_out_at)}</p></div></div></article>)}</div>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4"><button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">ปิด</button>{tab === "edit" && <button disabled={saving || !checkIn || reason.trim().length < 3} onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} />{saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button>}</footer>
      </div>
    </div>
  );
}
