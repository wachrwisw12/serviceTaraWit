import api from "../api/axios";

export async function openAttachment(
  instanceId: number,
  targetId: number,
  attachmentId: number,
) {
  const res = await api.get(
    `/evaluation/instances/${instanceId}/targets/${targetId}/attachments/${attachmentId}/view`,
    {
      responseType: "blob",
    },
  );

  const type =
    typeof res.headers["content-type"] === "string"
      ? res.headers["content-type"]
      : "application/octet-stream";

  const blob = new Blob([res.data], { type });

  return {
    url: URL.createObjectURL(blob),
    type,
  };
}
