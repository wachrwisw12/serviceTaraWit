/**
 * จัดเก็บ token แบบแยกตามตัวเลือก "จดจำฉันไว้":
 * - ติ๊กจดจำ → localStorage (อยู่ต่อหลังปิดแท็บ/เบราว์เซอร์)
 * - ไม่ติ๊ก   → sessionStorage (หมดอายุเมื่อปิดแท็บ)
 *
 * เก็บทั้ง access token และ refresh token ไว้ที่เดียวกันเสมอ
 * (อ่านเช็คทั้งสองที่ เผื่อ token เก่าอยู่ในที่เดิม)
 */
const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

function pickStorage(remember: boolean): Storage {
  return remember ? window.localStorage : window.sessionStorage;
}

function readFrom(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return (
    window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
  );
}

function writeTo(key: string, value: string, remember: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  const storage = pickStorage(remember);
  storage.setItem(key, value);
  // ล้างอีกตัวเพื่อไม่ให้มี token เก่าค้างอยู่ 2 ที่
  if (remember) {
    window.sessionStorage.removeItem(key);
  } else {
    window.localStorage.removeItem(key);
  }
}

/* ================== ACCESS TOKEN ================== */

export function getToken(): string | null {
  return readFrom(ACCESS_KEY);
}

export function setToken(token: string, remember: boolean): void {
  writeTo(ACCESS_KEY, token, remember);
}

/* ================== REFRESH TOKEN ================== */

export function getRefreshToken(): string | null {
  return readFrom(REFRESH_KEY);
}

export function setRefreshToken(token: string, remember: boolean): void {
  writeTo(REFRESH_KEY, token, remember);
}

/* ================== CLEAR ================== */

export function clearToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(ACCESS_KEY);
  window.sessionStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.sessionStorage.removeItem(REFRESH_KEY);
}
