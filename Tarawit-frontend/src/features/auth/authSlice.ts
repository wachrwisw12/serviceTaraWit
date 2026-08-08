import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { User } from "./authType";

/* ================== TYPES ================== */

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  status: "checking" | "authenticated" | "unauthenticated";
  error: string | null;
};

/* ================== INITIAL STATE ================== */
const tokenFromStorage = localStorage.getItem("access_token");

const initialState: AuthState = {
  user: null,
  token: tokenFromStorage,
  loading: false,
  status: "checking",
  error: null,
};

/* ================== LOGIN ================== */
export const loginThunk = createAsyncThunk<
  { user: User; token: string },
  { username: string; password: string },
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post("/auth/signin", payload);

    return {
      user: res.data.user,
      token: res.data.token,
    };
  } catch {
    return rejectWithValue("เข้าสู่ระบบไม่สำเร็จ");
  }
});

/* ================== VERIFY TOKEN ================== */
export const verifyTokenThunk = createAsyncThunk<
  User,
  void,
  { rejectValue: null }
>("auth/verify", async (_, { rejectWithValue }) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return rejectWithValue(null);
  }
  try {
    const res = await api.get("/auth/me");
    return res.data.user; // backend ควรคืน user
  } catch {
    return rejectWithValue(null);
  }
});

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

      localStorage.removeItem("access_token");
    },
    setStatus(state, action: PayloadAction<AuthState["status"]>) {
      state.status = action.payload;
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
        localStorage.setItem("access_token", action.payload.token);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload ?? "login error";
        state.user = null;
        state.token = null;
        localStorage.removeItem("access_token");
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
        state.status = "unauthenticated";

        state.token = null;
        localStorage.removeItem("access_token");
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
