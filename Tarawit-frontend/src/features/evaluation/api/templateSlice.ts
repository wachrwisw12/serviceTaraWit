import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import type {
  TemplateApiResponse,
  TemplateDetailResponse,
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
};

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
    const templates: TemplateApiResponse[] = res.data;

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
      });
  },
});

export default templateSlice.reducer;
