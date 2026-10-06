import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api/axios";
import type {
  IQAStandardTree,
  IQAQualityLevel,
  IQACycle,
  IQAAssessmentDetail,
  IQASchoolSummary,
  IQAAssessment,
  CreateCyclePayload,
  ScoreItem,
} from "../types/iqaTypes";

interface IQAState {
  tree: IQAStandardTree[];
  qualityLevels: IQAQualityLevel[];
  cycles: IQACycle[];
  currentCycle: IQACycle | null;
  assessments: IQAAssessment[];
  myAssessment: IQAAssessmentDetail | null;
  schoolSummary: IQASchoolSummary[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: IQAState = {
  tree: [],
  qualityLevels: [],
  cycles: [],
  currentCycle: null,
  assessments: [],
  myAssessment: null,
  schoolSummary: [],
  loading: false,
  saving: false,
  error: null,
};

function errMsg(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } }).response?.data
      ?.message ?? fallback
  );
}

// ─── Tree ───
export const fetchTree = createAsyncThunk<
  IQAStandardTree[],
  void,
  { rejectValue: string }
>("iqa/fetchTree", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<IQAStandardTree[]>("/iqa/tree");
    return res.data ?? [];
  } catch {
    return rejectWithValue("โหลดข้อมูลมาตรฐานไม่สำเร็จ");
  }
});

// ─── Quality Levels ───
export const fetchQualityLevels = createAsyncThunk<
  IQAQualityLevel[],
  void,
  { rejectValue: string }
>("iqa/fetchQualityLevels", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<IQAQualityLevel[]>("/iqa/quality-levels");
    return res.data ?? [];
  } catch {
    return rejectWithValue("โหลดระดับคุณภาพไม่สำเร็จ");
  }
});

// ─── Cycles ───
export const fetchCycles = createAsyncThunk<
  IQACycle[],
  void,
  { rejectValue: string }
>("iqa/fetchCycles", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<IQACycle[]>("/iqa/cycles");
    return res.data ?? [];
  } catch {
    return rejectWithValue("โหลดรายการรอบไม่สำเร็จ");
  }
});

export const createCycle = createAsyncThunk<
  { id: number },
  CreateCyclePayload,
  { rejectValue: string }
>("iqa/createCycle", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post<{ id: number }>("/iqa/cycles", payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(errMsg(err, "สร้างรอบไม่สำเร็จ"));
  }
});

export const updateCycleStatus = createAsyncThunk<
  void,
  { id: number; status: string },
  { rejectValue: string }
>("iqa/updateCycleStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    await api.patch(`/iqa/cycles/${id}/status`, { status });
  } catch (err) {
    return rejectWithValue(errMsg(err, "เปลี่ยนสถานะไม่สำเร็จ"));
  }
});

// ─── Assessments ───
export const fetchAssessments = createAsyncThunk<
  IQAAssessment[],
  number,
  { rejectValue: string }
>("iqa/fetchAssessments", async (cycleId, { rejectWithValue }) => {
  try {
    const res = await api.get<IQAAssessment[]>(
      `/iqa/cycles/${cycleId}/assessments`,
    );
    return res.data ?? [];
  } catch {
    return rejectWithValue("โหลดรายการประกันคุณภาพไม่สำเร็จ");
  }
});

export const getOrCreateAssessment = createAsyncThunk<
  IQAAssessment,
  number,
  { rejectValue: string }
>("iqa/getOrCreateAssessment", async (cycleId, { rejectWithValue }) => {
  try {
    const res = await api.post<IQAAssessment>(
      `/iqa/cycles/${cycleId}/assessments`,
    );
    return res.data;
  } catch (err) {
    return rejectWithValue(errMsg(err, "เปิดแบบประเมินไม่สำเร็จ"));
  }
});

// ─── Assessment Detail ───
export const fetchAssessmentDetail = createAsyncThunk<
  IQAAssessmentDetail,
  number,
  { rejectValue: string }
>("iqa/fetchAssessmentDetail", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get<IQAAssessmentDetail>(`/iqa/assessments/${id}`);
    return res.data;
  } catch {
    return rejectWithValue("โหลดรายละเอียดไม่สำเร็จ");
  }
});

export const saveScores = createAsyncThunk<
  void,
  { assessmentId: number; scores: ScoreItem[] },
  { rejectValue: string }
>("iqa/saveScores", async ({ assessmentId, scores }, { rejectWithValue }) => {
  try {
    await api.put(`/iqa/assessments/${assessmentId}/scores`, { scores });
  } catch (err) {
    return rejectWithValue(errMsg(err, "บันทึกคะแนนไม่สำเร็จ"));
  }
});

export const submitAssessment = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>("iqa/submitAssessment", async (assessmentId, { rejectWithValue }) => {
  try {
    await api.post(`/iqa/assessments/${assessmentId}/submit`);
  } catch (err) {
    return rejectWithValue(errMsg(err, "ส่งผลประเมินไม่สำเร็จ"));
  }
});

// ─── School Summary ───
export const fetchSchoolSummary = createAsyncThunk<
  IQASchoolSummary[],
  number,
  { rejectValue: string }
>("iqa/fetchSchoolSummary", async (cycleId, { rejectWithValue }) => {
  try {
    const res = await api.get<IQASchoolSummary[]>(
      `/iqa/cycles/${cycleId}/summary`,
    );
    return res.data ?? [];
  } catch {
    return rejectWithValue("โหลดสรุปผลไม่สำเร็จ");
  }
});

// ═══════════ Slice ═══════════

const iqaSlice = createSlice({
  name: "iqa",
  initialState,
  reducers: {
    clearMyAssessment(state) {
      state.myAssessment = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Tree
      .addCase(fetchTree.fulfilled, (state, action) => {
        state.tree = action.payload;
      })
      // Quality Levels
      .addCase(fetchQualityLevels.fulfilled, (state, action) => {
        state.qualityLevels = action.payload;
      })
      // Cycles
      .addCase(fetchCycles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCycles.fulfilled, (state, action) => {
        state.loading = false;
        state.cycles = action.payload;
      })
      .addCase(fetchCycles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })
      .addCase(createCycle.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateCycleStatus.fulfilled, (state) => {
        state.saving = false;
      })
      // Assessments
      .addCase(fetchAssessments.fulfilled, (state, action) => {
        state.assessments = action.payload;
      })
      .addCase(getOrCreateAssessment.fulfilled, (state, action) => {
        state.myAssessment = {
          assessment: action.payload,
          scores: [],
          evidence: [],
        };
      })
      // Assessment Detail
      .addCase(fetchAssessmentDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssessmentDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.myAssessment = action.payload;
      })
      .addCase(fetchAssessmentDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })
      // Save Scores
      .addCase(saveScores.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveScores.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveScores.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })
      // Submit
      .addCase(submitAssessment.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(submitAssessment.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(submitAssessment.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })
      // School Summary
      .addCase(fetchSchoolSummary.fulfilled, (state, action) => {
        state.schoolSummary = action.payload;
      });
  },
});

export const { clearMyAssessment, clearError } = iqaSlice.actions;
export default iqaSlice.reducer;
