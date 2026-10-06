export interface UserRole {
  role_name: string;
  role_code?: string;
}

export interface Permission {
  permission_name: string;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  prefixes?: string;
  prefix_code?: string;
  loading: boolean;
  email?: string | null;
  roles: UserRole[];
  permissions: Permission[];
}
