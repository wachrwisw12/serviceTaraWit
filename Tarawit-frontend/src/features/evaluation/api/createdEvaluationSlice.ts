import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../../../api/axios";

export type MyCreatedEvaluation = {
  id: number;
  batch_id: string;

  template_id: number;
  template_name: string;
  template_type: "EVALUATION" | "SURVEY";
  instance_name: string;

  academic_year: number;
  round: string;

  status: "draft" | "open" | "closed";

  target_count: number;
  evaluator_count: number;
  assignment_count: number;

  completed_count: number;
};

export type EvaluatorProgress = {
  user_id: number;
  name_snapshot: string;
  position_snapshot: string;

  assignment_count: number;
  completed_count: number;
  complete: boolean;
};

export type TargetProgress = {
  target_id: number;
  user_id: number;
  name: string;
  position: string | null;

  assignment_count: number;
  completed_count: number;
  average_score: number | null;
};

export type SectionScoreSummary = {
  section_id: number;
  name: string;
  sort_order: number;
  average_score: number | null;
  max_possible_score: number | null;
};

export type MyCreatedEvaluationSummary = {
  id: number;
  batch_id: string | null;
  template_id: number;
  template_name: string;
  template_type: "EVALUATION" | "SURVEY";
  instance_name: string;
  academic_year: number;
  round: string;
  status: "draft" | "open" | "closed";

  target_count: number;
  evaluator_count: number;
  assignment_count: number;
  completed_count: number;

  average_score: number | null;
  max_possible_score: number | null;

  evaluators: EvaluatorProgress[];
  targets: TargetProgress[];
  sections: SectionScoreSummary[];
};

interface State {
  items: MyCreatedEvaluation[];

  loading: boolean;
  error: string | null;

  startingId: number | null;

  summary: MyCreatedEvaluationSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;

  closingId: number | null;

  editDetail: InstanceEditDetail | null;
  editLoading: boolean;
  editError: string | null;
  editSaving: boolean;
  editSaveError: string | null;

  auditLogs: AuditLogEntry[];
  auditLoading: boolean;
}

export type InstanceEditMember = {
  user_id: number;
  name: string;
  position: string | null;
  has_submitted: boolean;
  assignment_count: number;
  completed_count: number;
  can_score: boolean;
  requires_signature: boolean;
  signature_order: number;
  signature_role: string;
};

export type EvaluatorSetting = {
  user_id: string;
  can_score: boolean;
  requires_signature: boolean;
  signature_order: number;
  signature_role: string;
};

export type InstanceEditDetail = {
  id: number;
  template_name: string;
  template_type: "EVALUATION" | "SURVEY";
  instance_name: string;
  academic_year: number;
  round: string;
  status: "draft" | "open" | "closed";
  targets: InstanceEditMember[];
  evaluators: InstanceEditMember[];
};

export type UpdateMembersPayload = {
  add_user_ids: string[];
  remove_user_ids: string[];
  evaluator_settings?: EvaluatorSetting[];
};

export type UpdateMembersResponse = {
  success: boolean;
  message: string;
  target_count: number;
  evaluator_count: number;
};

export type AuditLogEntry = {
  id: number;
  instance_id: number;
  actor_user_id: number;
  actor_name: string;
  action: string;
  target_user_id: number;
  target_name: string;
  detail: string;
  created_at: string;
};

const initialState: State = {
  items: [],

  loading: false,
  error: null,

  startingId: null,

  summary: null,
  summaryLoading: true,
  summaryError: null,

  closingId: null,

  editDetail: null,
  editLoading: false,
  editError: null,
  editSaving: false,
  editSaveError: null,

  auditLogs: [],
  auditLoading: false,
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

export const fetchMyCreatedEvaluationSummary = createAsyncThunk<
  MyCreatedEvaluationSummary,
  number,
  { rejectValue: string }
>(
  "createdEvaluation/fetchSummary",

  async (instanceId, thunkAPI) => {
    try {
      const response = await api.get(
        `/evaluation/evaluation-instances/${instanceId}/summary`,
      );

      return (response.data.data ?? null) as MyCreatedEvaluationSummary;
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
        ).response?.data?.message ?? "โหลดสรุปการประเมินไม่สำเร็จ",
      );
    }
  },
);

export const closeEvaluationInstance = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  "createdEvaluation/close",

  async (instanceId, thunkAPI) => {
    try {
      await api.patch(`/evaluation/evaluation-instances/${instanceId}/close`);

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
        ).response?.data?.message ?? "ปิดการประเมินไม่สำเร็จ",
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

export const fetchInstanceEditDetail = createAsyncThunk<
  InstanceEditDetail,
  number,
  { rejectValue: string }
>(
  "createdEvaluation/fetchEditDetail",
  async (instanceId, thunkAPI) => {
    try {
      const response = await api.get(
        `/evaluation/evaluation-instances/${instanceId}/edit-detail`,
      );
      return (response.data.data ?? null) as InstanceEditDetail;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(
        (
          error as {
            response?: { data?: { message?: string } };
          }
        ).response?.data?.message ?? "โหลดข้อมูลไม่สำเร็จ",
      );
    }
  },
);

export const updateInstanceTargets = createAsyncThunk<
  { targets: InstanceEditMember[] },
  { instanceId: number; payload: UpdateMembersPayload },
  { rejectValue: string }
>(
  "createdEvaluation/updateTargets",
  async ({ instanceId, payload }, thunkAPI) => {
    try {
      await api.put(
        `/evaluation/evaluation-instances/${instanceId}/targets`,
        payload,
      );
      // Re-fetch to get updated list with computed fields
      const detailRes = await api.get(
        `/evaluation/evaluation-instances/${instanceId}/edit-detail`,
      );
      return { targets: detailRes.data.data?.targets ?? [] };
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(
        (
          error as {
            response?: { data?: { message?: string } };
          }
        ).response?.data?.message ?? "อัปเดตไม่สำเร็จ",
      );
    }
  },
);

export const updateInstanceEvaluators = createAsyncThunk<
  { evaluators: InstanceEditMember[] },
  { instanceId: number; payload: UpdateMembersPayload },
  { rejectValue: string }
>(
  "createdEvaluation/updateEvaluators",
  async ({ instanceId, payload }, thunkAPI) => {
    try {
      await api.put(
        `/evaluation/evaluation-instances/${instanceId}/evaluators`,
        payload,
      );
      // Re-fetch to get updated list with computed fields
      const detailRes = await api.get(
        `/evaluation/evaluation-instances/${instanceId}/edit-detail`,
      );
      return { evaluators: detailRes.data.data?.evaluators ?? [] };
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(
        (
          error as {
            response?: { data?: { message?: string } };
          }
        ).response?.data?.message ?? "อัปเดตไม่สำเร็จ",
      );
    }
  },
);

export const fetchInstanceAuditLogs = createAsyncThunk<
  AuditLogEntry[],
  { instanceId: number; limit?: number },
  { rejectValue: string }
>(
  "createdEvaluation/fetchAuditLogs",
  async ({ instanceId, limit }, thunkAPI) => {
    try {
      const response = await api.get(
        `/evaluation/evaluation-instances/${instanceId}/audit-log`,
        { params: { limit: limit ?? 50 } },
      );
      return (response.data.data ?? []) as AuditLogEntry[];
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(
        (
          error as {
            response?: { data?: { message?: string } };
          }
        ).response?.data?.message ?? "โหลด audit log ไม่สำเร็จ",
      );
    }
  },
);

const createdEvaluationReducer = createSlice({
  name: "createdEvaluation",

  initialState,

  reducers: {
    resetEditState: (state) => {
      state.editDetail = null;
      state.editLoading = false;
      state.editError = null;
      state.editSaving = false;
      state.editSaveError = null;
    },
    resetAuditLogs: (state) => {
      state.auditLogs = [];
      state.auditLoading = false;
    },
  },

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
      })

      .addCase(fetchMyCreatedEvaluationSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })

      .addCase(fetchMyCreatedEvaluationSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })

      .addCase(fetchMyCreatedEvaluationSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
      })

      .addCase(closeEvaluationInstance.pending, (state, action) => {
        state.closingId = action.meta.arg;
      })

      .addCase(closeEvaluationInstance.fulfilled, (state, action) => {
        state.closingId = null;

        if (state.summary && state.summary.id === action.payload) {
          state.summary.status = "closed";
        }

        const item = state.items.find((row) => row.id === action.payload);

        if (item) {
          item.status = "closed";
        }
      })

      .addCase(closeEvaluationInstance.rejected, (state) => {
        state.closingId = null;
      })

      // ---- fetchInstanceEditDetail ----
      .addCase(fetchInstanceEditDetail.pending, (state) => {
        state.editLoading = true;
        state.editError = null;
      })
      .addCase(fetchInstanceEditDetail.fulfilled, (state, action) => {
        state.editLoading = false;
        state.editDetail = action.payload;
      })
      .addCase(fetchInstanceEditDetail.rejected, (state, action) => {
        state.editLoading = false;
        state.editError = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
      })

      // ---- updateInstanceTargets ----
      .addCase(updateInstanceTargets.pending, (state) => {
        state.editSaving = true;
        state.editSaveError = null;
      })
      .addCase(updateInstanceTargets.fulfilled, (state, action) => {
        state.editSaving = false;
        if (state.editDetail) {
          state.editDetail.targets = action.payload.targets;
        }
      })
      .addCase(updateInstanceTargets.rejected, (state, action) => {
        state.editSaving = false;
        state.editSaveError = action.payload ?? "อัปเดตไม่สำเร็จ";
      })

      // ---- updateInstanceEvaluators ----
      .addCase(updateInstanceEvaluators.pending, (state) => {
        state.editSaving = true;
        state.editSaveError = null;
      })
      .addCase(updateInstanceEvaluators.fulfilled, (state, action) => {
        state.editSaving = false;
        if (state.editDetail) {
          state.editDetail.evaluators = action.payload.evaluators;
        }
      })
      .addCase(updateInstanceEvaluators.rejected, (state, action) => {
        state.editSaving = false;
        state.editSaveError = action.payload ?? "อัปเดตไม่สำเร็จ";
      })

      // ---- fetchInstanceAuditLogs ----
      .addCase(fetchInstanceAuditLogs.pending, (state) => {
        state.auditLoading = true;
      })
      .addCase(fetchInstanceAuditLogs.fulfilled, (state, action) => {
        state.auditLoading = false;
        state.auditLogs = action.payload;
      })
      .addCase(fetchInstanceAuditLogs.rejected, (state) => {
        state.auditLoading = false;
      });
  },
});

export const { resetEditState, resetAuditLogs } = createdEvaluationReducer.actions;

export default createdEvaluationReducer.reducer;
