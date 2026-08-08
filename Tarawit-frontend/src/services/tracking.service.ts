import api from "../api/axios";

export async function trackingSearch(trackingcode: string) {
  const res = await api.post(`/v1/track`, {
    tracking_code: trackingcode,
  });
  return res.data;
}
