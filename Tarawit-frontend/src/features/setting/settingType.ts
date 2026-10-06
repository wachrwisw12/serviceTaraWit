export interface SchoolInfo {
  id: number;
  code: string | null;
  name: string;
  type: string | null;
  province: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  director_name: string | null;
  system_name: string | null;
  system_short_name: string | null;
}

export interface UpdateSchoolPayload {
  code?: string | null;
  name?: string | null;
  type?: string | null;
  province?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  director_name?: string | null;
  system_name?: string | null;
  system_short_name?: string | null;
}

export interface AcademicYear {
  id: number;
  year: number;
  is_current: boolean;
  created_at: string;
}

export interface ScoreLevel {
  id: number;
  score: number;
  label: string;
  color: string;
  text_color: string;
  is_active: boolean;
  sort_order: number;
}

export interface UpdateScoreLevelPayload {
  label?: string;
  color?: string;
  text_color?: string;
  sort_order?: number;
  is_active?: boolean;
}
