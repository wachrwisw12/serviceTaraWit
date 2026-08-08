export interface UserRole {
  role_name: string;
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
  loading: boolean;
  email?: string | null;
  roles: UserRole[];
  permissions: Permission[];
}
