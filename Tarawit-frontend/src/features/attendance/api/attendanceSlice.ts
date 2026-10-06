import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import api from "../../../api/axios";
import type {
  AllRecordsResponse,
  AttendanceRecord,
  AttendanceRecordWithUser,
  MonthSummary,
  MyRecordsResponse,
} from "../attendanceType";

interface AttendanceState {
  today: AttendanceRecord | null;
  records: AttendanceRecord[];
  summary: MonthSummary | null;
  allRecords: AttendanceRecordWithUser[];
  allSummary: MonthSummary | null;
  loadingToday: boolean;
  loadingRecords: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  today: null,
  records: [],
  summary: null,
  allRecords: [],
  allSummary: null,
  loadingToday: false,
  loadingRecords: false,
  actionLoading: false,
  error: null,
};

function extractMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } }).response?.data
      ?.message ?? fallback
  );
}

export const fetchToday = createAsyncThunk<AttendanceRecord | null, void>(
  "attendance/fetchToday",
  async () => {
    const res = await api.get<AttendanceRecord | null>("/attendance/today");
    return res.data;
  },
);

export const fetchMyRecords = createAsyncThunk<MyRecordsResponse, string>(
  "attendance/fetchMyRecords",
  async (month) => {
    const res = await api.get<MyRecordsResponse>(
      `/attendance/my?month=${month}`,
    );
    return res.data;
  },
);

export const fetchAllRecords = createAsyncThunk<
  AllRecordsResponse,
  string
>("attendance/fetchAllRecords", async (month) => {
  const res = await api.get<AllRecordsResponse>(
    `/attendance/records?month=${month}`,
  );
  return res.data;
});

export const checkInAction = createAsyncThunk<
  AttendanceRecord,
  void,
  { rejectValue: string }
>("attendance/checkIn", async (_, { rejectWithValue }) => {
  try {
    const res = await api.post<AttendanceRecord>("/attendance/check-in");
    return res.data;
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "ลงเวลาเข้างานไม่สำเร็จ"));
  }
});

export const checkOutAction = createAsyncThunk<
  AttendanceRecord,
  void,
  { rejectValue: string }
>("attendance/checkOut", async (_, { rejectWithValue }) => {
  try {
    const res = await api.post<AttendanceRecord>("/attendance/check-out");
    return res.data;
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "ลงเวลาออกงานไม่สำเร็จ"));
  }
});

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchToday.pending, (state) => {
        state.loadingToday = true;
      })
      .addCase(fetchToday.fulfilled, (state, action) => {
        state.loadingToday = false;
        state.today = action.payload;
      })
      .addCase(fetchToday.rejected, (state) => {
        state.loadingToday = false;
      })

      .addCase(fetchMyRecords.pending, (state) => {
        state.loadingRecords = true;
      })
      .addCase(fetchMyRecords.fulfilled, (state, action) => {
        state.loadingRecords = false;
        state.records = action.payload.records;
        state.summary = action.payload.summary;
      })
      .addCase(fetchMyRecords.rejected, (state) => {
        state.loadingRecords = false;
      })

      .addCase(fetchAllRecords.pending, (state) => {
        state.loadingRecords = true;
      })
      .addCase(fetchAllRecords.fulfilled, (state, action) => {
        state.loadingRecords = false;
        state.allRecords = action.payload.records;
        state.allSummary = action.payload.summary;
      })
      .addCase(fetchAllRecords.rejected, (state) => {
        state.loadingRecords = false;
      })

      .addCase(checkInAction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(checkInAction.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.today = action.payload;
      })
      .addCase(checkInAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload ?? null;
      })

      .addCase(checkOutAction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(checkOutAction.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.today = action.payload;
      })
      .addCase(checkOutAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload ?? null;
      });
  },
});

export default attendanceSlice.reducer;
