import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import uiReducer from "./loadingSlice";
import userReducer from "../features/user/UserSlice.tsx";
import templateSlice from "../features/evaluation/api/templateSlice.ts";
import evaluationInstanceReducer from "../features/evaluation/api/evaluationinstanceSlice.ts"; // ← แก้ path ให้ชี้ไปไฟล์ slice จริง ไม่ใช่ component
import myInstanceSlice from "../features/evaluation/api/MyInstanceSlice.ts"; // ← แก้ path ให้ชี้ไปไฟล์ slice จริง ไม่ใช่ component
import evaluationTaskSlice from "../features/evaluation/api/MyTaskSlice.ts";
import batchTargetReducer from "../features/evaluation/api/batchtargetSlice.ts"; // ปรับ path ให้ตรงจริง
import evaluatorSlice from "../features/evaluation/api/EvaluatorSlice.ts";
import roleSlice from "../features/role/api/RoleSlice.ts";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    template: templateSlice,
    user: userReducer,
    evaluationInstance: evaluationInstanceReducer, // ← ชื่อตัวแปรก็เปลี่ยนให้สื่อความหมายตรง
    myInstance: myInstanceSlice,
    evaluationTask: evaluationTaskSlice,
    batchTarget: batchTargetReducer,
    evaluator: evaluatorSlice,
    roleSlice: roleSlice,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
