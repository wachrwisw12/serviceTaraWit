import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import api from "../../../api/axios";
import type {
  CreatePersonnelPayload,
  OptionItem,
  Personnel,
  PersonnelListFilter,
  Position,
  PositionPayload,
  UpdatePersonnelPayload,
} from "../personnelType";

interface PersonnelState {
  personnel: Personnel[];
  positions: Position[];
  personTypes: OptionItem[];
  departments: OptionItem[];
  prefixes: OptionItem[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  // pagination
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialState: PersonnelState = {
  personnel: [],
  positions: [],
  personTypes: [],
  departments: [],
  prefixes: [],
  loading: false,
  saving: false,
  error: null,
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
};

function extractMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } }).response?.data
      ?.message ?? fallback
  );
}

/* ================== บุคลากร ================== */

export interface PaginatedPersonnelResponse {
  items: Personnel[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const fetchPersonnel = createAsyncThunk<
  PaginatedPersonnelResponse,
  PersonnelListFilter | undefined,
  { rejectValue: string }
>("personnel/list", async (filter, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams();
    if (filter?.search) params.set("search", filter.search);
    if (filter?.person_type_id) params.set("person_type_id", String(filter.person_type_id));
    if (filter?.position_id) params.set("position_id", String(filter.position_id));
    if (filter?.is_active) params.set("is_active", filter.is_active);
    if (filter?.page) params.set("page", String(filter.page));
    if (filter?.limit) params.set("limit", String(filter.limit));

    const qs = params.toString();
    const res = await api.get<PaginatedPersonnelResponse>(`/personnel${qs ? `?${qs}` : ""}`);
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลบุคลากรได้");
  }
});

export const fetchPersonnelById = createAsyncThunk<
  Personnel,
  number,
  { rejectValue: string }
>("personnel/getById", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get<Personnel>(`/personnel/${id}`);
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลบุคลากรได้");
  }
});

export const createPersonnel = createAsyncThunk<
  { id: number },
  CreatePersonnelPayload,
  { rejectValue: string }
>("personnel/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post<{ id: number }>("/personnel", payload);
    return res.data;
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "เพิ่มบุคลากรไม่สำเร็จ"));
  }
});

export const updatePersonnel = createAsyncThunk<
  void,
  { id: number; data: UpdatePersonnelPayload },
  { rejectValue: string }
>("personnel/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    await api.put(`/personnel/${id}`, data);
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "บันทึกข้อมูลไม่สำเร็จ"));
  }
});

export const deactivatePersonnel = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>("personnel/deactivate", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/personnel/${id}`);
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "ปิดใช้งานไม่สำเร็จ"));
  }
});

export const activatePersonnel = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>("personnel/activate", async (id, { rejectWithValue }) => {
  try {
    await api.patch(`/personnel/${id}/activate`);
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "เปิดใช้งานไม่สำเร็จ"));
  }
});

export const uploadPersonnelAvatar = createAsyncThunk<
  { avatar_url: string },
  { id: number; file: File },
  { rejectValue: string }
>("personnel/uploadAvatar", async ({ id, file }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ avatar_url: string; message: string }>(
      `/personnel/${id}/avatar`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return { avatar_url: res.data.avatar_url };
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "อัปโหลดรูปไม่สำเร็จ"));
  }
});

/* ================== รีเซ็ตรหัสผ่าน ================== */

export const resetPersonnelPassword = createAsyncThunk<
  void,
  { id: number; new_password: string },
  { rejectValue: string }
>("personnel/resetPassword", async ({ id, new_password }, { rejectWithValue }) => {
  try {
    await api.put(`/personnel/${id}/reset-password`, { new_password });
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "รีเซ็ตรหัสผ่านไม่สำเร็จ"));
  }
});

/* ================== นำเข้าหลายคน ================== */

export interface BatchCreateError {
  row_index: number;
  username: string;
  message: string;
}

export interface BatchCreateResult {
  total: number;
  success: number;
  failed: number;
  errors: BatchCreateError[];
  created_ids: number[];
}

export const batchCreatePersonnel = createAsyncThunk<
  BatchCreateResult,
  CreatePersonnelPayload[],
  { rejectValue: string }
>("personnel/batchCreate", async (items, { rejectWithValue }) => {
  try {
    const res = await api.post<BatchCreateResult>("/personnel/batch", { items });
    return res.data;
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "นำเข้าข้อมูลไม่สำเร็จ"));
  }
});

/* ================== ตำแหน่ง ================== */

export const fetchPositions = createAsyncThunk<
  Position[],
  void,
  { rejectValue: string }
>("personnel/fetchPositions", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<Position[]>("/positions");
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
  }
});

export const createPosition = createAsyncThunk<
  { id: number },
  PositionPayload,
  { rejectValue: string }
>("personnel/createPosition", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post<{ id: number }>("/positions", payload);
    return res.data;
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "เพิ่มตำแหน่งไม่สำเร็จ"));
  }
});

export const updatePosition = createAsyncThunk<
  void,
  { id: number; data: PositionPayload },
  { rejectValue: string }
>("personnel/updatePosition", async ({ id, data }, { rejectWithValue }) => {
  try {
    await api.put(`/positions/${id}`, data);
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "บันทึกตำแหน่งไม่สำเร็จ"));
  }
});

export const deletePosition = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>("personnel/deletePosition", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/positions/${id}`);
  } catch (err: unknown) {
    return rejectWithValue(extractMessage(err, "ลบตำแหน่งไม่สำเร็จ"));
  }
});

/* ================== ตัวเลือก ================== */

export const fetchPersonTypes = createAsyncThunk<
  OptionItem[],
  void,
  { rejectValue: string }
>("personnel/fetchPersonTypes", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<OptionItem[]>("/personnel/person-types");
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดประเภทบุคลากรได้");
  }
});

export const fetchDepartments = createAsyncThunk<
  OptionItem[],
  void,
  { rejectValue: string }
>("personnel/fetchDepartments", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<OptionItem[]>("/personnel/departments");
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดกลุ่มสาระได้");
  }
});

export const fetchPrefixes = createAsyncThunk<
  OptionItem[],
  void,
  { rejectValue: string }
>("personnel/fetchPrefixes", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<OptionItem[]>("/personnel/prefixes");
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดคำนำหน้าได้");
  }
});

const personnelSlice = createSlice({
  name: "personnel",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPersonnel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPersonnel.fulfilled, (state, action) => {
        state.loading = false;
        state.personnel = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.total_pages;
      })
      .addCase(fetchPersonnel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })

      .addCase(fetchPersonnelById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPersonnelById.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchPersonnelById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })

      .addCase(fetchPositions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.loading = false;
        state.positions = action.payload;
      })
      .addCase(fetchPositions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })

      .addCase(fetchPersonTypes.fulfilled, (state, action) => {
        state.personTypes = action.payload;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
      })
      .addCase(fetchPrefixes.fulfilled, (state, action) => {
        state.prefixes = action.payload;
      })

      .addCase(createPersonnel.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createPersonnel.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createPersonnel.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(updatePersonnel.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updatePersonnel.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updatePersonnel.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(deactivatePersonnel.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deactivatePersonnel.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deactivatePersonnel.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(activatePersonnel.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(activatePersonnel.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(activatePersonnel.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(uploadPersonnelAvatar.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(uploadPersonnelAvatar.fulfilled, (state, action) => {
        state.saving = false;
        // อัปเดต avatar_url ใน personnel list
        const found = state.personnel.find((p) => p.id === action.meta.arg.id);
        if (found) {
          found.avatar_url = action.payload.avatar_url;
        }
      })
      .addCase(uploadPersonnelAvatar.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(batchCreatePersonnel.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(batchCreatePersonnel.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(batchCreatePersonnel.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(createPosition.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createPosition.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createPosition.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(updatePosition.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updatePosition.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updatePosition.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      })

      .addCase(deletePosition.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deletePosition.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deletePosition.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? null;
      });
  },
});

export default personnelSlice.reducer;
