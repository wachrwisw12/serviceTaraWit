import axios from "axios";

console.log(import.meta.env);
console.log("API_BASE =", import.meta.env.VITE_API_BASE);

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE,
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
