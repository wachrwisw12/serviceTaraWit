// features/role/RoleSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api/axios";
import type { PersonType, SystemRoleDef } from "../roleType";

type RoleState = {
  SystemRoleDef: SystemRoleDef[];
  PersonType: PersonType[];
  loading: boolean;
  error: string | null;
  loaded: boolean; // กันโหลดซ้ำ
};

const initialState: RoleState = {
  SystemRoleDef: [],
  PersonType: [],
  loading: false,
  error: null,
  loaded: false,
};

// แก้ไขจุดที่ 1: ปรับ Type และค่าที่ return ให้สอดคล้องกัน (ใช้ RolesDef ทั้งคู่)
export const fetchRoleDef = createAsyncThunk<
  { RolesDef: SystemRoleDef[]; PersonType: PersonType[] }, // <--- Type คาดหวังปุ่ม RolesDef
  void,
  { rejectValue: string }
>("role/fetchRoleDef", async (_, { rejectWithValue }) => {
  try {
    const [roleRes, personTypeRes] = await Promise.all([
      api.get<SystemRoleDef[]>("/role/systemRols"),
      api.get<PersonType[]>("/user/GetpersonType"),
    ]);

    // แก้ไขจุดที่ 2: ส่งกลับเป็น RolesDef ให้ตรงกับ Type ด้านบน
    return { RolesDef: roleRes.data, PersonType: personTypeRes.data };
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลบทบาทได้");
  }
});

const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoleDef.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleDef.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;

        state.SystemRoleDef = action.payload.RolesDef;
        state.PersonType = action.payload.PersonType;
      })
      .addCase(fetchRoleDef.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
      });
  },
});

export default roleSlice.reducer;
