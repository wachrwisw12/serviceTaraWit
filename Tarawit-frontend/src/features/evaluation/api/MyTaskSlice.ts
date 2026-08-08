import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../../../api/axios";

export type MyEvaluationTask = {
  batch_id: string;
  title: string;
  academic_year: number;
  round: string;

  total_target: number;
  completed_target: number;

  status: "draft" | "open" | "closed";

  evaluator_id: number;
};

export type AllEvaluationTask = {
  batch_id: string;
  title: string;
  academic_year: number;
  round: string;

  total_target: number;
  completed_target: number;

  status: "draft" | "open" | "closed";
};

type EvaluationTaskState = {
  tasks: MyEvaluationTask[];
  loading: boolean;
  error: string | null;

  // Added: holds EVERY evaluation batch in the system, used by the
  // "การประเมินทั้งหมด" page to separate "mine" vs "others".
  allTasks: MyEvaluationTask[];
  allLoading: boolean;
  allError: string | null;
};

const initialState: EvaluationTaskState = {
  tasks: [],
  loading: false,
  error: null,

  allTasks: [],
  allLoading: false,
  allError: null,
};

export const fetchMyEvaluationTasks = createAsyncThunk(
  "evaluationTask/fetchMyEvaluationTasks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/evaluation/my-tasks");

      return response.data.data as MyEvaluationTask[];
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "โหลดรายการประเมินไม่สำเร็จ",
      );
    }
  },
);

// Matches GET /evaluation/tasks -> handler.GetAllTasks (added to the Go
// backend router/handler/service/repository layers).
export const fetchAllEvaluationTasks = createAsyncThunk(
  "evaluationTask/fetchAllEvaluationTasks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/evaluation/tasks");

      return response.data.data as MyEvaluationTask[];
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "โหลดรายการประเมินทั้งหมดไม่สำเร็จ",
      );
    }
  },
);

const evaluationTaskSlice = createSlice({
  name: "evaluationTask",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder

      .addCase(fetchMyEvaluationTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchMyEvaluationTasks.fulfilled, (state, action) => {
        state.loading = false;

        state.tasks = action.payload ?? [];
      })

      .addCase(fetchMyEvaluationTasks.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload as string;
      })

      .addCase(fetchAllEvaluationTasks.pending, (state) => {
        state.allLoading = true;
        state.allError = null;
      })

      .addCase(fetchAllEvaluationTasks.fulfilled, (state, action) => {
        state.allLoading = false;

        state.allTasks = action.payload ?? [];
      })

      .addCase(fetchAllEvaluationTasks.rejected, (state, action) => {
        state.allLoading = false;

        state.allError = action.payload as string;
      });
  },
});

export default evaluationTaskSlice.reducer;
