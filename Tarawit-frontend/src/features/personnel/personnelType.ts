export interface Personnel {
  id: number;
  username: string;
  nickname: string | null;
  cid: string | null;
  prefix_id: number | null;
  prefix_name: string | null;
  prefix_code: string | null;
  first_name: string | null;
  last_name: string | null;
  department_id: number | null;
  department_code: string | null;
  department_name: string | null;
  person_type_id: number | null;
  person_type_code: string | null;
  person_type_name: string | null;
  position_id: number | null;
  position_code: string | null;
  position_name: string | null;
  email: string | null;
  phone: string | null;
  person_level: number | null;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Position {
  id: number;
  code: string;
  name_th: string;
  level: number;
  created_at: string;
}

export interface OptionItem {
  id: number;
  code: string;
  name_th: string;
}

export interface PersonnelListFilter {
  search?: string;
  person_type_id?: number;
  position_id?: number;
  is_active?: string;
  page?: number;
  limit?: number;
}

export interface CreatePersonnelPayload {
  username: string;
  password: string;
  nickname?: string | null;
  department_id?: number | null;
  cid?: string | null;
  prefix_id?: number | null;
  first_name?: string | null;
  last_name?: string | null;
  person_type_id?: number | null;
  position_id?: number | null;
  email?: string | null;
  phone?: string | null;
  person_level?: number | null;
}

export interface UpdatePersonnelPayload {
  nickname?: string | null;
  department_id?: number | null;
  cid?: string | null;
  prefix_id?: number | null;
  first_name?: string | null;
  last_name?: string | null;
  person_type_id?: number | null;
  position_id?: number | null;
  email?: string | null;
  phone?: string | null;
  person_level?: number | null;
  is_active?: boolean;
}

export interface PositionPayload {
  code: string;
  name_th: string;
  level: number;
}
