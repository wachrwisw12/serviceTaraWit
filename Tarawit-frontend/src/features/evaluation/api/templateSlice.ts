import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import type {
  TemplateApiResponse,
  TemplateDetailResponse,
  TemplateWritePayload,
} from "../types/template_type";
import api from "../../../api/axios";

/* ================== STATE ================== */

type TemplateState = {
  templates: TemplateApiResponse[];
  templatesLoading: boolean;
  templatesError: string | null;
  loading: boolean;
  error: string;
  templateDetail: TemplateDetailResponse | null;
  detailLoading: boolean;
  detailError: string | null;
  saving: boolean;
};

const initialState: TemplateState = {
  templates: [],
  templatesLoading: false,
  templatesError: null,
  loading: false,
  error: "",

  templateDetail: null,
  detailLoading: false,
  detailError: null,
  saving: false,
};

function extractMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } }).response?.data
      ?.message ?? fallback
  );
}

/* ================== GET TEMPLATE ================== */

export const fetchTemplates = createAsyncThunk<
  TemplateApiResponse[],
  void,
  { rejectValue: string }
>("template/getAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<TemplateApiResponse[]>(
      "/evaluation/get-evaluation/template",
    );

    // keep the original API response shape to satisfy TemplateApiResponse
    const templates: TemplateApiResponse[] = res.data ?? [];

    return templates;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลได้");
  }
});

export const fetchTemplateById = createAsyncThunk<
  TemplateDetailResponse,
  number,
  { rejectValue: string }
>("template/getById", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get<TemplateDetailResponse>(
      `/evaluation/get-evaluation/templateByid/${id}`,
    );

    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลแม่แบบได้");
  }
});

export const createTemplate = createAsyncThunk<
  TemplateDetailResponse,
  TemplateWritePayload,
  { rejectValue: string }
>("template/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post<{ data: TemplateDetailResponse }>(
      "/evaluation/templates",
      payload,
    );
    return res.data.data;
  } catch (error: unknown) {
    return rejectWithValue(extractMessage(error, "สร้างแม่แบบไม่สำเร็จ"));
  }
});

/* ================== UPDATE TEMPLATE ================== */

export const updateTemplate = createAsyncThunk<
  TemplateDetailResponse,
  { id: number; data: TemplateWritePayload },
  { rejectValue: string }
>("template/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put<{ data: TemplateDetailResponse }>(
      `/evaluation/templates/${id}`,
      data,
    );
    return res.data.data;
  } catch (error: unknown) {
    return rejectWithValue(extractMessage(error, "อัปเดตแม่แบบไม่สำเร็จ"));
  }
});

/* ================== DELETE TEMPLATE ================== */

export const deleteTemplate = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>("template/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/evaluation/templates/${id}`);
  } catch (error: unknown) {
    return rejectWithValue(extractMessage(error, "ลบแม่แบบไม่สำเร็จ"));
  }
});

/* ================== DUPLICATE TEMPLATE ================== */

export const duplicateTemplate = createAsyncThunk<
  TemplateDetailResponse,
  number,
  { rejectValue: string }
>("template/duplicate", async (id, { rejectWithValue }) => {
  try {
    const res = await api.post<{ data: TemplateDetailResponse }>(
      `/evaluation/templates/${id}/duplicate`,
    );
    return res.data.data;
  } catch (error: unknown) {
    return rejectWithValue(extractMessage(error, "คัดลอกแม่แบบไม่สำเร็จ"));
  }
});

/* ================== UPDATE TEMPLATE STATUS ================== */

export const updateTemplateStatus = createAsyncThunk<
  { id: number; status: string },
  { id: number; status: string },
  { rejectValue: string }
>("template/updateStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    await api.patch(`/evaluation/templates/${id}/status`, { status });
    return { id, status };
  } catch (error: unknown) {
    return rejectWithValue(
      extractMessage(error, "อัปเดตสถานะไม่สำเร็จ"),
    );
  }
});

/* ================== SLICE ================== */

const templateSlice = createSlice({
  name: "template",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      // ---- fetchTemplates (list) ----
      .addCase(fetchTemplates.pending, (state) => {
        state.templatesLoading = true;
        state.templatesError = null;
      })

      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload;
      })

      .addCase(fetchTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.templatesError = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
      })

      // ---- fetchTemplateById (detail / preview) ----
      .addCase(fetchTemplateById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.templateDetail = null;
      })

      .addCase(fetchTemplateById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.templateDetail = action.payload;
      })

      .addCase(fetchTemplateById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
      })

      // ---- createTemplate ----
      .addCase(createTemplate.pending, (state) => {
        state.saving = true;
        state.error = "";
      })
      .addCase(createTemplate.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "";
      })

      // ---- updateTemplate ----
      .addCase(updateTemplate.pending, (state) => {
        state.saving = true;
        state.error = "";
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.saving = false;
        state.templateDetail = action.payload;
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "";
      })

      // ---- deleteTemplate ----
      .addCase(deleteTemplate.pending, (state) => {
        state.saving = true;
      })
      .addCase(deleteTemplate.fulfilled, (state) => {
        state.saving = false;
        state.templateDetail = null;
      })
      .addCase(deleteTemplate.rejected, (state) => {
        state.saving = false;
      })

      // ---- duplicateTemplate ----
      .addCase(duplicateTemplate.pending, (state) => {
        state.saving = true;
      })
      .addCase(duplicateTemplate.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(duplicateTemplate.rejected, (state) => {
        state.saving = false;
      })

      // ---- updateTemplateStatus ----
      .addCase(updateTemplateStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        // อัปเดตใน list
        const item = state.templates.find((t) => t.id === id);
        if (item) {
          item.status = status as TemplateApiResponse["status"];
        }
        // อัปเดต detail
        if (state.templateDetail && state.templateDetail.id === id) {
          state.templateDetail.status = status;
        }
      });
  },
});

export default templateSlice.reducer;
