import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../api/axios";
import type { EvaluationSummary } from "../types/evaluationSummaryType";

interface EvaluationSummaryState {
  summary: EvaluationSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: EvaluationSummaryState = {
  summary: null,
  loading: false,
  error: null,
};

export const fetchEvaluationSummary = createAsyncThunk<
  EvaluationSummary,
  { academicYear?: number } | void,
  { rejectValue: string }
>("evaluationSummary/fetch", async (params, { rejectWithValue }) => {
  try {
    const yearParam =
      params && "academicYear" in params && params.academicYear
        ? `?academic_year=${params.academicYear}`
        : "";
    const res = await api.get<{ success: boolean; data: EvaluationSummary }>(
      `/evaluation/summary${yearParam}`,
    );
    return res.data.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลสรุปการประเมินได้");
  }
});

const evaluationSummarySlice = createSlice({
  name: "evaluationSummary",
  initialState,
  reducers: {
    clearEvaluationSummary: (state) => {
      state.summary = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvaluationSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvaluationSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchEvaluationSummary.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? action.error.message ?? "เกิดข้อผิดพลาด";
      });
  },
});

export const { clearEvaluationSummary } = evaluationSummarySlice.actions;
export default evaluationSummarySlice.reducer;
