import api from "../api/axios";

export async function searchVillage(q: string) {
  console.log("track", q);
  const res = await api.post(`/init/search-village`, {
    message: q,
  });
  return res.data;
}
