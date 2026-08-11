import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../../../api/axios";

export type MyCreatedEvaluation = {
  id: number;
  batch_id: string;

  template_id: number;
  template_name: string;
  instance_name: string;

  academic_year: number;
  round: string;

  status: "draft" | "open" | "closed";

  target_count: number;
  evaluator_count: number;
  assignment_count: number;

  completed_count: number;
};

interface State {
  items: MyCreatedEvaluation[];

  loading: boolean;
  error: string | null;

  startingId: number | null;
}

const initialState: State = {
  items: [],
  loading: false,
  error: null,

  startingId: null,
};

export const fetchMyCreatedEvaluations = createAsyncThunk<
  MyCreatedEvaluation[],
  void,
  { rejectValue: string }
>(
  "createdEvaluation/fetch",

  async (_, thunkAPI) => {
    try {
      const response = await api.get(
        "/evaluation/evaluation-instances/my-created",
      );

      return response.data.data ?? [];
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(
        (
          error as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        ).response?.data?.message ?? "โหลดรายการไม่สำเร็จ",
      );
    }
  },
);

export const startEvaluationInstance = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  "createdEvaluation/start",

  async (instanceId, thunkAPI) => {
    try {
      await api.patch(`/evaluation/evaluation-instances/${instanceId}/start`);

      return instanceId;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(
        (
          error as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        ).response?.data?.message ?? "เริ่มการประเมินไม่สำเร็จ",
      );
    }
  },
);

const createdEvaluationReducer = createSlice({
  name: "createdEvaluation",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder

      .addCase(fetchMyCreatedEvaluations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchMyCreatedEvaluations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })

      .addCase(fetchMyCreatedEvaluations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
      })

      .addCase(startEvaluationInstance.pending, (state, action) => {
        state.startingId = action.meta.arg;
      })

      .addCase(startEvaluationInstance.fulfilled, (state, action) => {
        state.startingId = null;

        const item = state.items.find((row) => row.id === action.payload);

        if (item) {
          item.status = "open";
        }
      })

      .addCase(startEvaluationInstance.rejected, (state) => {
        state.startingId = null;
      });
  },
});

export default createdEvaluationReducer.reducer;
