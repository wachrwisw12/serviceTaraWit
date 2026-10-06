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
import createdEvaluationReducer from "../features/evaluation/api/createdEvaluationSlice.ts";
import attendanceReducer from "../features/attendance/api/attendanceSlice.ts";
import personnelReducer from "../features/personnel/api/personnelSlice.ts";
import settingReducer from "../features/setting/api/settingSlice.ts";
import reportReducer from "../features/report/api/reportSlice.ts";
import iqaReducer from "../features/iqa/api/iqaSlice.ts";
import evaluationSummaryReducer from "../features/evaluation/api/evaluationSummarySlice.ts";
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
    createdEvaluation: createdEvaluationReducer,
    attendance: attendanceReducer,
    personnel: personnelReducer,
    setting: settingReducer,
    report: reportReducer,
    iqa: iqaReducer,
    evaluationSummary: evaluationSummaryReducer,
    ui: uiReducer,
  },
  devTools: import.meta.env.DEV, // ปิด Redux DevTools ใน production
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
