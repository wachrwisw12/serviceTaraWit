export interface AttendanceLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  is_active: boolean;
}

export interface GeofenceConfig {
  enabled: boolean;
  max_location_accuracy_m: number;
  locations: AttendanceLocation[];
  check_in_open: string;
  check_in_close: string;
  check_out_open: string;
  check_out_close: string;
}

export interface AttendanceGroup {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  member_ids: number[];
}

export interface AttendanceUserOption {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface OutsideAccess {
  user_ids: number[];
  group_ids: number[];
}
