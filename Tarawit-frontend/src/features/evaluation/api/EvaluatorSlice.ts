import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../api/axios";
import type { EvaluationSectionForm } from "../types/EvaluationSectionForm_type";

interface EvaluatorState {
  detail: EvaluationSectionForm | null;
  loading: boolean;
  error: string | null;
}

const initialState: EvaluatorState = {
  detail: null,
  loading: false,
  error: null,
};

export const fetchEvaluatorDetail = createAsyncThunk<
  EvaluationSectionForm,
  number,
  { rejectValue: string }
>("evaluator/detail", async (assignmentId, thunkAPI) => {
  try {
    const res = await api.get<EvaluationSectionForm>(
      `/evaluation/evaluator/assignments/${assignmentId}`,
    );

    return res.data;
  } catch (err: unknown) {
    return thunkAPI.rejectWithValue(
      (err as { response?: { data?: { message?: string } } }).response?.data
        ?.message ?? "โหลดข้อมูลไม่สำเร็จ",
    );
  }
});

const evaluatorSlice = createSlice({
  name: "evaluator",
  initialState,
  reducers: {
    clearEvaluatorDetail(state) {
      state.detail = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvaluatorDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvaluatorDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
      })
      .addCase(fetchEvaluatorDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "เกิดข้อผิดพลาด";
      });
  },
});

export const { clearEvaluatorDetail } = evaluatorSlice.actions;
export default evaluatorSlice.reducer;
