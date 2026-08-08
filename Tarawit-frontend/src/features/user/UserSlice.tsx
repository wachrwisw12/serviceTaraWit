import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import type { UserListResponse, UserDetailResponse } from "../user/UserType";
import api from "../../api/axios";

/* ================== STATE ================== */

type UserState = {
  user: UserListResponse[];
  userDetail: UserDetailResponse | null;
  loading: boolean;
  error: string | null;
};

const initialState: UserState = {
  user: [],
  userDetail: null,
  loading: false,
  error: null,
};

/* ================== GET USER ================== */

export const fetchUser = createAsyncThunk<
  UserListResponse[],
  void,
  { rejectValue: string }
>("user/getAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<UserListResponse[]>("/user/GetAlluser");

    // keep the original API response shape to satisfy UserApiResponse
    const users: UserListResponse[] = res.data;

    return users;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลได้");
  }
});

export const fetchUserById = createAsyncThunk<
  UserDetailResponse,
  number,
  { rejectValue: string }
>("user/getById", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get<UserDetailResponse>(`/user/GetUserById/${id}`);

    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
  }
});
export const updateUserRole = createAsyncThunk<
  UserDetailResponse,
  {
    id: number;
    person_type_id: number | null;
    role_ids: number[];
  },
  {
    rejectValue: string;
  }
>(
  "user/updateUserRole",

  async (data, { rejectWithValue }) => {
    console.log("data", data);
    try {
      const res = await api.put<UserDetailResponse>(
        `/user/${data.id}/roles`,
        data,
      );

      return res.data;
    } catch (err: unknown) {
      return rejectWithValue(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "บันทึกสิทธิ์ไม่สำเร็จ",
      );
    }
  },
);
/* ================== SLICE ================== */

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      // GET ALL
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })

      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })

      // GET BY ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.userDetail = null;
      })

      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.userDetail = action.payload;
      })

      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })

      // UPDATE ROLE
      .addCase(updateUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload) {
          state.userDetail = action.payload;
        }
      })

      .addCase(updateUserRole.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload ?? "บันทึกสิทธิ์ไม่สำเร็จ";
      });
  },
});

export default userSlice.reducer;
