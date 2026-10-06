import api from "../../../api/axios";
import type {
  AttendanceGroup,
  AttendanceLocation,
  AttendanceUserOption,
  GeofenceConfig,
  OutsideAccess,
} from "../geofenceType";

export async function getGeofenceConfig() {
  return (await api.get<GeofenceConfig>("/attendance/geofence-config")).data;
}

export async function updateGeofenceConfig(enabled: boolean, accuracy: number, checkInOpen: string, checkInClose: string, checkOutOpen: string, checkOutClose: string) {
  await api.put("/attendance/geofence-config", {
    enabled,
    max_location_accuracy_m: accuracy,
    check_in_open: checkInOpen,
    check_in_close: checkInClose,
    check_out_open: checkOutOpen,
    check_out_close: checkOutClose,
  });
}

export async function saveLocation(location: Omit<AttendanceLocation, "id"> & { id?: number }) {
  const { id, ...body } = location;
  if (id) return (await api.put(`/attendance/locations/${id}`, body)).data;
  return (await api.post("/attendance/locations", body)).data;
}

export async function deleteLocation(id: number) {
  await api.delete(`/attendance/locations/${id}`);
}

export async function getAttendanceUsers() {
  return (await api.get<AttendanceUserOption[]>("/attendance/users")).data;
}

export async function getAttendanceGroups() {
  return (await api.get<AttendanceGroup[]>("/attendance/groups")).data;
}

export async function saveGroup(group: Pick<AttendanceGroup, "name" | "description" | "is_active"> & { id?: number }) {
  if (group.id) return (await api.put(`/attendance/groups/${group.id}`, group)).data;
  return (await api.post("/attendance/groups", group)).data;
}

export async function replaceGroupMembers(groupId: number, userIds: number[]) {
  await api.put(`/attendance/groups/${groupId}/members`, { user_ids: userIds });
}

export async function deleteGroup(id: number) {
  await api.delete(`/attendance/groups/${id}`);
}

export async function getOutsideAccess() {
  return (await api.get<OutsideAccess>("/attendance/outside-access")).data;
}

export async function replaceOutsideAccess(access: OutsideAccess) {
  await api.put("/attendance/outside-access", access);
}
