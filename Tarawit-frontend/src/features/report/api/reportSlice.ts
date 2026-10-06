import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import axios from "../../../api/axios";
import type { ExecutiveDashboardData } from "../reportType";

interface ReportState {
  executive: ExecutiveDashboardData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  executive: null,
  loading: false,
  error: null,
};

export const fetchExecutiveDashboard = createAsyncThunk(
  "report/fetchExecutiveDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/dashboard/executive");
      return res.data.data as ExecutiveDashboardData;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ";
      return rejectWithValue(message);
    }
  },
);

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExecutiveDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExecutiveDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.executive = action.payload;
      })
      .addCase(fetchExecutiveDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "เกิดข้อผิดพลาด";
      });
  },
});

export default reportSlice.reducer;
