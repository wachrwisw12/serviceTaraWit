import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from "./tokenStorage";

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE,
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  headers: { "X-Client-Platform": "web" },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================== AUTO-REFRESH (single-flight) ================== */

type RefreshResult =
  | { ok: true; token: string }
  | { ok: false; rateLimited: boolean };

/** promise กลางสำหรับ refresh — request หลายตัวที่ 401 พร้อมกันจะใช้คิวเดียวกัน */
let refreshPromise: Promise<RefreshResult> | null = null;

async function refreshAccessToken(): Promise<RefreshResult> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return { ok: false, rateLimited: false };
  }
  try {
    // ใช้ api โดยตรง — ถ้า /auth/refresh ตอบ 401 จะโดน interceptor ข้าม (จัดการเองที่นี่)
    const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
    const newToken: string | undefined = res.data?.token;
    if (!newToken) {
      return { ok: false, rateLimited: false };
    }
    // เก็บตามที่เก็บ access token เดิม (จดจำฉันไว้ หรือไม่)
    const remember = !!window.localStorage.getItem("access_token");
    setToken(newToken, remember);
    if (res.data?.refresh_token) {
      setRefreshToken(res.data.refresh_token, remember);
    }
    return { ok: true, token: newToken };
  } catch (err) {
    // 429 = โดน rate limiter ชั่วคราว — ไม่ใช่ session หมดอายุ อย่าเพิ่งลบ token
    const status = (err as AxiosError)?.response?.status;
    return { ok: false, rateLimited: status === 429 };
  }
}

function forceLogout() {
  clearToken();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";

    // 401 จาก auth call — จัดการเองที่จุดนั้น:
    // - /auth/signin = รหัสผ่านผิด ต้องอยู่หน้า login เพื่อแสดง error
    // - /auth/refresh = ล้มเหลว (refreshAccessToken จัดการ catch เอง)
    // - /auth/logout = เพิกถอนแล้ว ไม่ต้อง retry
    const isAuthCall = url.includes("/auth/signin") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    if (status === 401 && !isAuthCall) {
      // ลอง refresh หนึ่งครั้ง (single-flight: ขอ refresh พร้อมกันหลายตัวใช้คิวเดียว)
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const result = await refreshPromise;

      if (result.ok) {
        const config = error.config as RetriableConfig | undefined;
        // retry request เดิมด้วย token ใหม่ (กัน loop ด้วย _retried)
        if (config && !config._retried) {
          config._retried = true;
          config.headers.Authorization = `Bearer ${result.token}`;
          return api(config);
        }
      } else if (result.rateLimited) {
        // โดน rate limit ชั่วคราว — ไม่ใช่ session หมดอายุ
        // ปล่อยให้ request เดิมล้มเหลว แต่อย่าลบ refresh token ที่ยัง valid
        return Promise.reject(error);
      }

      // refresh ไม่สำเร็จ (token ถูกเพิกถอน/หมดอายุ/บัญชีถูกปิด) → ล็อกเอาต์
      forceLogout();
    }

    // แสดง toast สำหรับ server error (500+) ที่ไม่ใช่ auth call
    if (status && status >= 500 && !isAuthCall) {
      window.dispatchEvent(
        new CustomEvent("api-error", {
          detail: {
            status,
            message: `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${status})`,
          },
        }),
      );
    }

    return Promise.reject(error);
  },
);

export default api;
