// src/utils/ws.ts
export const getWSUrl = () => {
  const base = import.meta.env.VITE_WS_URL;

  const protocol = location.protocol === "https:" ? "wss" : "ws";

  return `${protocol}://${location.host}${base}`;
};
