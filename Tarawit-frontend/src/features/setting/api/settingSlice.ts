import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import api from "../../../api/axios";
import type {
  AcademicYear,
  SchoolInfo,
  ScoreLevel,
  UpdateSchoolPayload,
  UpdateScoreLevelPayload,
} from "../settingType";

interface SettingState {
  school: SchoolInfo | null;
  academicYears: AcademicYear[];
  scoreLevels: ScoreLevel[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  scoreLevelsLoaded: boolean;
}

const initialState: SettingState = {
  school: null,
  academicYears: [],
  scoreLevels: [],
  loading: false,
  saving: false,
  error: null,
  scoreLevelsLoaded: false,
};

function extractMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } }).response?.data
      ?.message ?? fallback
  );
}

/* ================== ข้อมูลโรงเรียน ================== */

export const fetchSchool = createAsyncThunk<
  SchoolInfo,
  void,
  { rejectValue: string }
>("setting/fetchSchool", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<SchoolInfo>("/settings/school");
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลโรงเรียนได้");
  }
});

export const updateSchool = createAsyncThunk<
  void,
  UpdateSchoolPayload,
  { rejectValue: string }
>("setting/updateSchool", async (payload, { rejectWithValue }) => {
  try {
    await api.put("/settings/school", payload);
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "บันทึกข้อมูลโรงเรียนไม่สำเร็จ"));
  }
});

/* ================== ปีการศึกษา ================== */

export const fetchAcademicYears = createAsyncThunk<
  AcademicYear[],
  void,
  { rejectValue: string }
>("setting/fetchAcademicYears", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<AcademicYear[]>("/settings/academic-years");
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดปีการศึกษาได้");
  }
});

export const createAcademicYear = createAsyncThunk<
  { id: number },
  { year: number },
  { rejectValue: string }
>("setting/createAcademicYear", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post<{ id: number }>("/settings/academic-years", payload);
    return res.data;
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "เพิ่มปีการศึกษาไม่สำเร็จ"));
  }
});

export const updateAcademicYear = createAsyncThunk<
  void,
  { id: number; year: number },
  { rejectValue: string }
>("setting/updateAcademicYear", async ({ id, year }, { rejectWithValue }) => {
  try {
    await api.put(`/settings/academic-years/${id}`, { year });
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "บันทึกปีการศึกษาไม่สำเร็จ"));
  }
});

export const setCurrentYear = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>("setting/setCurrentYear", async (id, { rejectWithValue }) => {
  try {
    await api.patch(`/settings/academic-years/${id}/current`);
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "ตั้งปีปัจจุบันไม่สำเร็จ"));
  }
});

export const deleteAcademicYear = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>("setting/deleteAcademicYear", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/settings/academic-years/${id}`);
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "ลบปีการศึกษาไม่สำเร็จ"));
  }
});

/* ================== ระดับคะแนน ================== */

export const fetchScoreLevels = createAsyncThunk<
  ScoreLevel[],
  void,
  { rejectValue: string }
>("setting/fetchScoreLevels", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<ScoreLevel[]>("/settings/score-levels");
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดระดับคะแนนได้");
  }
});

export const updateScoreLevel = createAsyncThunk<
  void,
  { id: number; data: UpdateScoreLevelPayload },
  { rejectValue: string }
>("setting/updateScoreLevel", async ({ id, data }, { rejectWithValue }) => {
  try {
    await api.put(`/settings/score-levels/${id}`, data);
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "บันทึกระดับคะแนนไม่สำเร็จ"));
  }
});

const settingSlice = createSlice({
  name: "setting",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchool.fulfilled, (state, action) => {
        state.loading = false;
        state.school = action.payload;
      })
      .addCase(fetchSchool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })

      .addCase(fetchAcademicYears.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload;
      })
      .addCase(fetchAcademicYears.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })

      .addCase(fetchScoreLevels.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchScoreLevels.fulfilled, (state, action) => {
        state.scoreLevels = action.payload;
        state.scoreLevelsLoaded = true;
      })
      .addCase(fetchScoreLevels.rejected, (state, action) => {
        state.error = action.payload ?? null;
      })

      .addCase(updateSchool.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateSchool.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateSchool.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(createAcademicYear.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createAcademicYear.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createAcademicYear.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(updateAcademicYear.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateAcademicYear.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateAcademicYear.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(setCurrentYear.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(setCurrentYear.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(setCurrentYear.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(deleteAcademicYear.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteAcademicYear.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deleteAcademicYear.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(updateScoreLevel.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateScoreLevel.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateScoreLevel.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      });
  },
});

export default settingSlice.reducer;
