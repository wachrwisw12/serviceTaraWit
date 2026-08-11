import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../api/axios";

import type { EvaluationSectionForm } from "../types/EvaluationSectionForm_type";

interface EvaluatorState {
  detail: EvaluationSectionForm | null;

  loading: boolean;
  error: string | null;

  submitting: boolean;
  submitError: string | null;
}

const initialState: EvaluatorState = {
  detail: null,

  loading: false,
  error: null,

  submitting: false,
  submitError: null,
};

export type SubmitEvaluationAnswerItem = {
  question_id: number;
  score: number | null;
  answer_text?: string | null;
};

export type SubmitEvaluationAnswersPayload = {
  assignment_id: number;
  answers: SubmitEvaluationAnswerItem[];
};

export const fetchEvaluatorDetail = createAsyncThunk<
  EvaluationSectionForm,
  number,
  { rejectValue: string }
>(
  "evaluator/detail",

  async (assignmentId, thunkAPI) => {
    try {
      const res = await api.get(
        `/evaluation/evaluator/assignments/${assignmentId}`,
      );
      console.log("resdata", res.data);
      return res.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(
        (
          err as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        ).response?.data?.message ?? "โหลดข้อมูลไม่สำเร็จ",
      );
    }
  },
);

export const submitEvaluationAnswers = createAsyncThunk<
  unknown,
  SubmitEvaluationAnswersPayload,
  { rejectValue: string }
>(
  "evaluator/submitAnswers",

  async (payload, thunkAPI) => {
    try {
      const res = await api.post(
        `/evaluation/evaluator/assignments/${payload.assignment_id}/submit`,
        {
          answers: payload.answers,
        },
      );

      return res.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(
        (
          err as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        ).response?.data?.message ?? "บันทึกคะแนนไม่สำเร็จ",
      );
    }
  },
);

const evaluatorSlice = createSlice({
  name: "evaluator",

  initialState,

  reducers: {
    clearEvaluatorDetail(state) {
      state.detail = null;
      state.error = null;
      state.submitError = null;
    },

    clearSubmitError(state) {
      state.submitError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // --------------------------------
      // Fetch detail
      // --------------------------------

      .addCase(fetchEvaluatorDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.detail = null;
      })

      .addCase(fetchEvaluatorDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
      })

      .addCase(fetchEvaluatorDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "เกิดข้อผิดพลาด";
      })

      // --------------------------------
      // Submit answers
      // --------------------------------

      .addCase(submitEvaluationAnswers.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })

      .addCase(submitEvaluationAnswers.fulfilled, (state) => {
        state.submitting = false;
        state.submitError = null;
      })

      .addCase(submitEvaluationAnswers.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload ?? "บันทึกคะแนนไม่สำเร็จ";
      });
  },
});

export const { clearEvaluatorDetail, clearSubmitError } =
  evaluatorSlice.actions;

export default evaluatorSlice.reducer;
