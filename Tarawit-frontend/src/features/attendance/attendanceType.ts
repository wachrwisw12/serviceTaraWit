export type AttendanceStatus = "working" | "present" | "late" | "early_leave" | "missed_checkout";

export interface AttendanceRecord {
  id: number;
  user_id: number;
  record_date: string; // YYYY-MM-DD
  check_in_at: string | null;
  check_out_at: string | null;
  status: AttendanceStatus;
  work_minutes: number | null;
  note: string | null;
}

export interface AttendanceAuditLog {
  id: number;
  attendance_record_id: number;
  edited_by: number;
  editor_name: string;
  reason: string;
  old_data: Record<string, unknown>;
  new_data: Record<string, unknown>;
  edited_at: string;
}

export interface MonthSummary {
  working: number;
  present: number;
  late: number;
  early_leave: number;
  missed_checkout: number;
}

export interface MyRecordsResponse {
  records: AttendanceRecord[];
  summary: MonthSummary;
}

export interface AttendanceRecordWithUser {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  record_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: AttendanceStatus;
  work_minutes: number | null;
  note: string | null;
  check_in_distance_m?: number | null;
  check_in_inside_area?: boolean | null;
  check_in_outside_allowed: boolean;
  check_out_distance_m?: number | null;
  check_out_inside_area?: boolean | null;
  check_out_outside_allowed: boolean;
}

export interface AllRecordsResponse {
  records: AttendanceRecordWithUser[];
  summary: MonthSummary;
}
