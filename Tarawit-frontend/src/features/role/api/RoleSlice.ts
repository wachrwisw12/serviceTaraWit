// features/role/RoleSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api/axios";
import type {
  PersonType,
  PermissionDef,
  SystemRoleDef,
} from "../roleType";

type RoleState = {
  SystemRoleDef: SystemRoleDef[];
  PersonType: PersonType[];
  permissions: PermissionDef[];
  rolesWithPermissions: SystemRoleDef[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  loaded: boolean; // กันโหลดซ้ำ
};

const initialState: RoleState = {
  SystemRoleDef: [],
  PersonType: [],
  permissions: [],
  rolesWithPermissions: [],
  loading: false,
  saving: false,
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

// รายการ Role พร้อมสิทธิ์ — ใช้ในหน้า Role / Permission
export const fetchRolesWithPermissions = createAsyncThunk<
  SystemRoleDef[],
  void,
  { rejectValue: string }
>("role/fetchRolesWithPermissions", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<SystemRoleDef[]>("/role/roles");
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลบทบาทได้");
  }
});

// รายการ permission ทั้งหมดในระบบ — ใช้ในหน้า Role / Permission
export const fetchPermissions = createAsyncThunk<
  PermissionDef[],
  void,
  { rejectValue: string }
>("role/fetchPermissions", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<PermissionDef[]>("/role/permissions");
    return res.data;
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลสิทธิ์ได้");
  }
});

// ตั้งค่า permission ให้ role
export const updateRolePermissions = createAsyncThunk<
  { roleId: number; permission_ids: number[] },
  { roleId: number; permission_ids: number[] },
  { rejectValue: string }
>(
  "role/updateRolePermissions",
  async ({ roleId, permission_ids }, { rejectWithValue }) => {
    try {
      await api.put(`/role/${roleId}/permissions`, { permission_ids });
      return { roleId, permission_ids };
    } catch {
      return rejectWithValue("บันทึกสิทธิ์ไม่สำเร็จ");
    }
  },
);

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
      })

      // Roles with permissions
      .addCase(fetchRolesWithPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRolesWithPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.rolesWithPermissions = action.payload;
      })
      .addCase(fetchRolesWithPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
      })

      // Permission catalog
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
      })

      // Update role permissions
      .addCase(updateRolePermissions.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateRolePermissions.fulfilled, (state, action) => {
        state.saving = false;
        const { roleId, permission_ids } = action.payload;

        const role = state.rolesWithPermissions.find((r) => r.id === roleId);

        if (role) {
          role.permission_ids = permission_ids;
          role.permissionCount = permission_ids.length;
        }
      })
      .addCase(updateRolePermissions.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "บันทึกสิทธิ์ไม่สำเร็จ";
      });
  },
});

export default roleSlice.reducer;
