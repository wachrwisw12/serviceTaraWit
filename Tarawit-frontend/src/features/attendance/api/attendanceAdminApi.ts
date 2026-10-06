import api from "../../../api/axios";
import type { AttendanceAuditLog, AttendanceRecord, AttendanceStatus } from "../attendanceType";

export interface UpdateAttendanceRecordPayload {
  check_in_at: string;
  check_out_at: string | null;
  status: AttendanceStatus;
  note: string | null;
  reason: string;
}

export async function updateAttendanceRecord(id: number, payload: UpdateAttendanceRecordPayload) {
  return (await api.put<{ message: string; record: AttendanceRecord }>(`/attendance/records/${id}`, payload)).data;
}

export async function getAttendanceAuditLogs(id: number) {
  return (await api.get<AttendanceAuditLog[]>(`/attendance/records/${id}/audit-logs`)).data;
}
