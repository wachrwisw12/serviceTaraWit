export interface CountByName {
  id: number;
  name: string;
  count: number;
}

export interface AttendanceDay {
  working: number;
  present: number;
  late: number;
  early_leave: number;
  absent: number;
}

export interface MonthTrend {
  month: string;
  label: string;
  working: number;
  present: number;
  late: number;
  early_leave: number;
}

export interface InstanceStats {
  total: number;
  draft: number;
  open: number;
  closed: number;
}

export interface AssignmentStats {
  total: number;
  submitted: number;
  completion_percent: number;
}

export interface TemplateAvg {
  template_name: string;
  assignments: number;
  avg_percent: number | null;
}

export interface TemplateStats {
  total: number;
  active: number;
  draft: number;
  inactive: number;
}

export interface ExecutiveDashboardData {
  personnel: {
    total: number;
    active: number;
    inactive: number;
    by_type: CountByName[];
    by_position: CountByName[];
  };
  attendance: {
    today: AttendanceDay;
    month: AttendanceDay;
    trend: MonthTrend[];
  };
  evaluation: {
    instances: InstanceStats;
    assignments: AssignmentStats;
    avg_percent: number | null;
    avg_by_template: TemplateAvg[];
  };
  template: TemplateStats;
}
