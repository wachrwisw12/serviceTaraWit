import api from "../../../api/axios";

export type SystemModule = {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  show_on_web: boolean;
  show_on_mobile: boolean;
  sort_order: number;
  maintenance_message: string | null;
};

export async function fetchMyModules() {
  const { data } = await api.get<SystemModule[]>("/modules/my", { params: { channel: "web" } });
  return data;
}

export async function fetchAllModules() {
  const { data } = await api.get<SystemModule[]>("/modules/");
  return data;
}

export async function updateModule(item: SystemModule) {
  const { data } = await api.put<SystemModule>(`/modules/${item.key}`, {
    enabled: item.enabled,
    show_on_web: item.show_on_web,
    show_on_mobile: item.show_on_mobile,
    maintenance_message: item.maintenance_message,
  });
  return data;
}
