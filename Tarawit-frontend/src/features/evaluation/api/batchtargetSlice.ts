import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../../../api/axios";

export type EvaluatorStatus = {
  evaluator_id: number;
  name: string;
  position: string;
  status: "pending" | "submitted" | string;
  is_me: boolean;
};

export type TargetInstanceStatus = {
  instance_id: number;
  instance_status: "DRAFT" | "OPEN" | "CLOSED" | string;
  template_name: string;
  attachment_ids: number[];
  my_assignment_id: number | null;
  my_status: "pending" | "submitted" | null;
  evaluators: EvaluatorStatus[];
};

export type BatchTarget = {
  user_id: number;
  name: string;
  position: string;
  total_instances: number;
  completed_count: number;
  instances: TargetInstanceStatus[];
};

type BatchTargetState = {
  targets: BatchTarget[];
  loading: boolean;
  error: string | null;
};

const initialState: BatchTargetState = {
  targets: [],
  loading: false,
  error: null,
};

export const fetchBatchTargets = createAsyncThunk(
  "batchTarget/fetchBatchTargets",
  async (batchId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/evaluation/batches/${batchId}/targets`,
      );

      return response.data.data as BatchTarget[];
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "โหลดรายชื่อไม่สำเร็จ",
      );
    }
  },
);

const batchTargetSlice = createSlice({
  name: "batchTarget",

  initialState,

  reducers: {
    clearBatchTargets: (state) => {
      state.targets = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchBatchTargets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchBatchTargets.fulfilled, (state, action) => {
        state.loading = false;

        state.targets = action.payload ?? [];
      })

      .addCase(fetchBatchTargets.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload as string;
      });
  },
});

export const { clearBatchTargets } = batchTargetSlice.actions;

export default batchTargetSlice.reducer;
