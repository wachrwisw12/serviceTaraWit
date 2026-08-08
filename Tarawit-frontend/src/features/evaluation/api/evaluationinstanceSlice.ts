import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api/axios";
import type {
  EvaluationInstanceListItem,
  EvaluationInstanceState,
  RoundCountArgs,
} from "../types/instance_type";

/* ================== TYPES ================== */

// ⚠️ path/param ด้านล่างเป็นค่าที่ "สมมติไว้" ให้สอดคล้องกับ pattern ของ templateSlice.ts
// (prefix /evaluation/... ผ่าน api instance) — ถ้า backend จริงใช้ path อื่น แก้แค่ในไฟล์นี้ที่เดียว

export type CreateEvaluationInstancePayload = {
  batch_id: string;
  template_id: number;
  instance_name: string;
  academic_year: number;
  round: string;
  instance_type: "EVALUATION" | "SURVEY";
  target_member_ids: string[];
  evaluator_member_ids: string[];
  show_score_to_visibility: boolean;
};

export type CreateEvaluationInstanceResponse = {
  id: number;
};

const initialState: EvaluationInstanceState = {
  roundCount: null,
  roundCountLoading: false,
  roundCountError: null,
  loading: false,
  error: "",
  creating: false,
  createError: null,

  instances: [],
  listLoading: false,
  listError: null,

  closingId: null,
  closeError: null,
};

/* ================== นับรอบที่เคยสร้างไปแล้ว ================== */

export const fetchEvaluationRoundCount = createAsyncThunk<
  number,
  RoundCountArgs,
  { rejectValue: string }
>(
  "evaluationInstance/fetchRoundCount",
  async ({ templateId, academicYear }, { rejectWithValue }) => {
    try {
      const res = await api.get<{ count: number }>(
        "/evaluation/evaluation-instances/count",
        {
          params: {
            template_id: templateId,
            academic_year: academicYear,
          },
        },
      );
      return res.data.count;
    } catch {
      return rejectWithValue("ไม่สามารถคำนวณรอบที่ได้");
    }
  },
);

/* ================== สร้างรอบการประเมิน ================== */

export const createEvaluationInstance = createAsyncThunk<
  CreateEvaluationInstanceResponse,
  CreateEvaluationInstancePayload,
  { rejectValue: string }
>("evaluationInstance/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post<CreateEvaluationInstanceResponse>(
      "/evaluation/evaluation-instances/create",
      payload,
    );

    return res.data;
  } catch {
    return rejectWithValue("สร้างการประเมินไม่สำเร็จ ลองใหม่อีกครั้ง");
  }
});

/* ================== ดึงรายการรอบการประเมินทั้งหมด (หน้า list) ================== */

export const fetchEvaluationInstances = createAsyncThunk<
  EvaluationInstanceListItem[],
  void,
  { rejectValue: string }
>("evaluationInstance/fetchList", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<EvaluationInstanceListItem[]>(
      "/evaluation/evaluation-instances/list",
    );
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดรายการการประเมินได้");
  }
});

/* ================== ปิดรอบการประเมิน ================== */

export const closeEvaluationInstance = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: string }
>("evaluationInstance/close", async (id, { rejectWithValue }) => {
  try {
    await api.post(`/evaluation/evaluation-instances/${id}/close`);
    return { id };
  } catch {
    return rejectWithValue("ปิดการประเมินไม่สำเร็จ ลองใหม่อีกครั้ง");
  }
});

/* ================== SLICE ================== */

const evaluationInstanceSlice = createSlice({
  name: "evaluationInstance",
  initialState,
  reducers: {
    resetCreateState: (state) => {
      state.creating = false;
      state.createError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ---- fetchEvaluationRoundCount ----
      .addCase(fetchEvaluationRoundCount.pending, (state) => {
        state.roundCountLoading = true;
        state.roundCountError = null;
      })
      .addCase(fetchEvaluationRoundCount.fulfilled, (state, action) => {
        state.roundCountLoading = false;
        state.roundCount = action.payload;
      })
      .addCase(fetchEvaluationRoundCount.rejected, (state, action) => {
        state.roundCountLoading = false;
        state.roundCountError = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
        state.roundCount = null;
      })

      // ---- createEvaluationInstance ----
      .addCase(createEvaluationInstance.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createEvaluationInstance.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createEvaluationInstance.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload ?? "สร้างการประเมินไม่สำเร็จ";
      })

      // ---- fetchEvaluationInstances (list) ----
      .addCase(fetchEvaluationInstances.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchEvaluationInstances.fulfilled, (state, action) => {
        state.listLoading = false;
        state.instances = action.payload;
      })
      .addCase(fetchEvaluationInstances.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload ?? "โหลดรายการไม่สำเร็จ";
      })

      // ---- closeEvaluationInstance ----
      .addCase(closeEvaluationInstance.pending, (state, action) => {
        state.closingId = action.meta.arg;
        state.closeError = null;
      })
      .addCase(closeEvaluationInstance.fulfilled, (state, action) => {
        state.closingId = null;
        const target = state.instances.find((i) => i.id === action.payload.id);
        if (target) {
          target.status = "closed";
          target.closed_at = new Date().toISOString();
        }
      })
      .addCase(closeEvaluationInstance.rejected, (state, action) => {
        state.closingId = null;
        state.closeError = action.payload ?? "ปิดการประเมินไม่สำเร็จ";
      });
  },
});

export const { resetCreateState } = evaluationInstanceSlice.actions;
export default evaluationInstanceSlice.reducer;
