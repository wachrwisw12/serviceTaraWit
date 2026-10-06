import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../../api/axios";
import {
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from "../../api/tokenStorage";
import type { User } from "./authType";

/* ================== TYPES ================== */

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  status: "checking" | "authenticated" | "unauthenticated";
  error: string | null;
  /** ผู้ใช้ติ๊ก "จดจำฉันไว้" หรือไม่ — ใช้ตอนบันทึก token */
  remember: boolean;
};

/* ================== INITIAL STATE ================== */
const tokenFromStorage = getToken();

const initialState: AuthState = {
  user: null,
  token: tokenFromStorage,
  loading: false,
  status: "checking",
  error: null,
  remember: false,
};

/** ดึงข้อความ error จริงจาก backend (เช่น "รหัสผ่านไม่ถูกต้อง") */
function extractErrorMessage(err: unknown): string {
  const status = (err as { response?: { status?: number } })?.response?.status;
  const data = (err as { response?: { data?: { error?: string } } })?.response
    ?.data;
  // 429 จาก login limiter (พยายามเกิน 5 ครั้ง/นาทีต่อ IP)
  if (status === 429) {
    return "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
  }
  return data?.error ?? "เข้าสู่ระบบไม่สำเร็จ";
}

/* ================== LOGIN ================== */
export const loginThunk = createAsyncThunk<
  {
    user: User;
    token: string;
    refreshToken: string | null;
    remember: boolean;
  },
  { username: string; password: string; remember: boolean },
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post("/auth/signin", {
      username: payload.username,
      password: payload.password,
    });

    return {
      user: res.data.user,
      token: res.data.token,
      refreshToken: res.data.refresh_token ?? null,
      remember: payload.remember,
    };
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

/* ================== VERIFY TOKEN ================== */
// ตรวจ session ตอนเปิดแอป — ถ้า access token หมดอายุ axios interceptor
// จะ refresh (ด้วย refresh token) + retry ให้อัตโนมัติ แล้วค่อยได้ user กลับมา
export const verifyTokenThunk = createAsyncThunk<
  User,
  void,
  { rejectValue: null }
>("auth/verify", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/auth/me");
    return res.data.user; // backend คืน user
  } catch {
    return rejectWithValue(null);
  }
});

/* ================== LOGOUT (เพิกถอน refresh token ฝั่ง server) ================== */
export const logoutThunk = createAsyncThunk<void, void, { rejectValue: null }>(
  "auth/logout",
  async (_, { dispatch }) => {
    // best-effort: เพิกถอน refresh token ฝั่ง server ก่อนเคลียร์เครื่อง
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      } catch {
        // ไม่เป็นไร — ยังต้องออกจากระบบฝั่ง client เสมอ
      }
    }
    dispatch(logout());
  },
);

/* ================== SLICE ================== */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.status = "unauthenticated";
      state.user = null;
      state.token = null;
      state.error = null;

      clearToken();
    },
    setStatus(state, action: PayloadAction<AuthState["status"]>) {
      state.status = action.payload;
    },
    setAvatarUrl(state, action: PayloadAction<string | null>) {
      if (state.user) state.user.avatar_url = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      /* ===== LOGIN ===== */
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.status = "unauthenticated";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "authenticated";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.remember = action.payload.remember;
        setToken(action.payload.token, action.payload.remember);
        if (action.payload.refreshToken) {
          setRefreshToken(action.payload.refreshToken, action.payload.remember);
        }
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload ?? "เข้าสู่ระบบไม่สำเร็จ";
        state.user = null;
        state.token = null;
        clearToken();
      })

      /* ===== VERIFY ===== */
      .addCase(verifyTokenThunk.pending, (state) => {
        state.status = "checking";
      })
      .addCase(verifyTokenThunk.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(verifyTokenThunk.rejected, (state) => {
        // อย่าลบ token ที่นี่ — การลบ token (ทั้ง access + refresh) เป็นหน้าที่ของ
        // axios interceptor (forceLogout) เมื่อ session ตายจริงเท่านั้น
        // ไม่งั้น refresh ที่ล้มเหลวชั่วคราว (เช่น 429 rate limit) จะทำลาย refresh token ที่ยัง valid
        state.status = "unauthenticated";
        state.token = null;
      });
  },
});

export const { logout, setAvatarUrl } = authSlice.actions;
export default authSlice.reducer;
