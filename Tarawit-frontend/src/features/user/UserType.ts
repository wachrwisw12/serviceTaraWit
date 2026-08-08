export interface UserListResponse {
  email: string;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  position: string;
  person_type_code: string;
  person_type_name: string;
  roles: Role[];
  is_active: boolean;
}

// // เรียกตอนกด "จัดการ" เท่านั้น
// export interface UserDetailApiResponse extends UserListItem {
//   email: string;
//   organization: string;
//   roles: Role[];
//   permissions: Permission[];
// }

export interface Role {
  role_id: number;
  role_code: string;
  role_name: string;
}
export interface Permission {
  permission_id: number;
  permission_code: string;
  permission_name: string;
  module: string;
}

export interface UserDetailResponse {
  id: number;
  prefixes: string;
  username: string;
  position: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;

  person_type_id: string;
  person_type_name: string;
  roles: Role[];
  permissions: Permission[];
  PersonType: PersonType;
}
export interface PersonType {
  id: number;
  code: string;
  name_th: string;
}
