import { createBrowserRouter, Navigate } from "react-router-dom";

import MainLayout from "../layout/MainLayout";
import LoginPage from "../features/auth/SchoolLoginPage";
import ProtectedRoute from "./protectedRoute";
import PermissionRoute from "./permissionRoute";
import UnauthorizedPage from "../features/errors/UnauthorizedPage";

import AuthRoute from "./authRoute";

import { Permission } from "../store/hooks/permission";

import HomePage from "../features/dashboard/pages/HomePage";
import TemplateListPage from "../features/evaluation/pages/TemplateListPage";
import TemplateDetailPage from "../features/evaluation/pages/TemplateDetailPage";
import CreateTemplatePage from "../features/evaluation/pages/CreateTemplatePage";
import EditTemplatePage from "../features/evaluation/pages/EditTemplatePage";
import UserManagementPage from "../features/user/page/UserManagementPage";
import MyEvaluationPage from "../features/evaluation/pages/MyEvaluationPage";
import BatchTargetListPage from "../features/evaluation/pages/BatchTargetListPage";
import MyEvaluationResultDetailPage from "../features/evaluation/pages/MyEvaluationResultDetailPage";
import EvaluationPrintPage from "../features/evaluation/pages/EvaluationPrintPage";
import BulkEvaluationPrintPage from "../features/evaluation/pages/BulkEvaluationPrintPage";
import AttachmentImagePrintPage from "../features/evaluation/pages/AttachmentImagePrintPage";
import MyCreatedEvaluationsPage from "../features/evaluation/pages/MyCreatedEvaluationsPage";
import MyCreatedEvaluationSummaryPage from "../features/evaluation/pages/MyCreatedEvaluationSummaryPage";
import CreateEvaluationPage from "@/features/evaluation/pages/CreateInstancePage";
import EditInstancePage from "@/features/evaluation/pages/EditInstancePage";
import ProfilePage from "../features/profile/ProfilePage";
import PersonnelHomePage from "../features/personnel/pages/PersonnelHomePage";
import PersonnelListPage from "../features/personnel/pages/PersonnelListPage";
import PersonnelCreatePage from "../features/personnel/pages/PersonnelCreatePage";
import PersonnelDetailPage from "../features/personnel/pages/PersonnelDetailPage";
import PersonnelImportPage from "../features/personnel/pages/PersonnelImportPage";
import PositionListPage from "../features/personnel/pages/PositionListPage";
import UserManagementHomePage from "../features/user/page/UserManagementHomePage";
import SettingsHomePage from "../features/setting/pages/SettingsHomePage";
import EvaluationRoundsPage from "../features/evaluation/pages/EvaluationRoundsPage";
import EvaluationSubmitPage from "../features/evaluation/pages/EvaluationSubmitPage";
import ResultPersonPage from "../features/evaluation/pages/ResultPersonPage";
import ResultSummaryPage from "../features/evaluation/pages/ResultSummaryPage";
import ResultHistoryPage from "../features/evaluation/pages/ResultHistoryPage";
import SchoolSettingPage from "../features/setting/pages/SchoolSettingPage";
import AcademicYearSettingPage from "../features/setting/pages/AcademicYearSettingPage";
import ScoringSettingPage from "../features/setting/pages/ScoringSettingPage";
import ModuleSettingsPage from "../features/setting/pages/ModuleSettingsPage";
import AttendancePage from "../features/attendance/pages/AttendancePage";
import AttendanceManagePage from "../features/attendance/pages/AttendanceManagePage";
import AttendanceGeofencePage from "../features/attendance/pages/AttendanceGeofencePage";
import EvalHomePage from "@/features/evaluation/pages/EvalHomePage";
import ScoreAssignmentPage from "../features/evaluation/pages/ScoreAssignmentPage";
import RolePage from "../features/role/pages/RolePage";
import PermissionPage from "../features/role/pages/PermissionPage";
import ExecutiveDashboardPage from "../features/report/pages/ExecutiveDashboardPage";
import EvaluationReportPage from "../features/report/pages/EvaluationReportPage";
import IQAHomePage from "../features/iqa/pages/IQAHomePage";
import IQACycleListPage from "../features/iqa/pages/IQACycleListPage";
import IQACycleDetailPage from "../features/iqa/pages/IQACycleDetailPage";
import IQAAssessPage from "../features/iqa/pages/IQAAssessPage";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        {
          element: <ProtectedRoute />,
          children: [
            // ทุกคนที่ login แล้วเข้าถึงได้
            { path: "dashboard", element: <HomePage /> },
            { path: "profile", element: <ProfilePage /> },

            // แดชบอร์ดผู้บริหาร — สถิติข้ามโมดูล
            {
              element: (
                <PermissionRoute permissions={[Permission.REPORT_VIEW]} />
              ),
              children: [
                { path: "reports", element: <ExecutiveDashboardPage /> },
                { path: "reports/evaluation", element: <EvaluationReportPage /> },
              ],
            },

            // การประเมิน — หน้าแรกของโมดูล ผูกกับสิทธิ์เดียวกับเมนู (instance.view)
            {
              element: (
                <PermissionRoute permissions={[Permission.INSTANCE_VIEW]} />
              ),
              children: [{ path: "evaluation", element: <EvalHomePage /> }],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.TEMPLATE_VIEW]} />
              ),
              children: [
                { path: "evaluation/templates", element: <TemplateListPage /> },
                {
                  path: "evaluation/templates/:templateId",
                  element: <TemplateDetailPage />,
                },
              ],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.TEMPLATE_CREATE]} />
              ),
              children: [
                {
                  path: "evaluation/templates/create",
                  element: <CreateTemplatePage />,
                },
                {
                  path: "evaluation/templates/:templateId/edit",
                  element: <EditTemplatePage />,
                },
              ],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.INSTANCE_CREATE]} />
              ),
              children: [
                {
                  path: "evaluation/instance/create",
                  element: <CreateEvaluationPage />,
                },
                {
                  path: "evaluation/my-created",
                  element: <MyCreatedEvaluationsPage />,
                },
                {
                  path: "evaluation/my-created/:id",
                  element: <MyCreatedEvaluationSummaryPage />,
                },
                {
                  path: "evaluation/my-created/:id/edit",
                  element: <EditInstancePage />,
                },
				{
				  path: "evaluation/my-created/:id/print",
				  element: <BulkEvaluationPrintPage />,
				},
				{
				  path: "evaluation/my-created/:id/images/print",
				  element: <AttachmentImagePrintPage />,
				},
              ],
            },
            {
              element: <PermissionRoute />,
              children: [
                { path: "/my/evaluation", element: <MyEvaluationPage /> },
                {
                  path: "/my/evaluation-results-detail/:id",
                  element: <MyEvaluationResultDetailPage />,
                },
                {
                  path: "/my/evaluation-results-detail/:id/print",
                  element: <EvaluationPrintPage />,
                },

                {
                  path: "evaluation/batches/:batchId",
                  element: <BatchTargetListPage />,
                },
              ],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.EVALUATION_ROUND_VIEW]} />
              ),
              children: [
                {
                  path: "evaluation/rounds",
                  element: <EvaluationRoundsPage />,
                },
              ],
            },
            {
              element: <PermissionRoute />,
              children: [
                {
                  path: "evaluation/score/:assignmentId",
                  element: <ScoreAssignmentPage />,
                },
              ],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.EVALUATION_SUBMIT]} />
              ),
              children: [
                {
                  path: "evaluation/submit",
                  element: <EvaluationSubmitPage />,
                },
              ],
            },
            {
              element: (
                <PermissionRoute
                  permissions={[Permission.RESULT_PERSON_VIEW]}
                />
              ),
              children: [
                { path: "results/person", element: <ResultPersonPage /> },
              ],
            },
            {
              element: (
                <PermissionRoute
                  permissions={[Permission.RESULT_SUMMARY_VIEW]}
                />
              ),
              children: [
                { path: "results/summary", element: <ResultSummaryPage /> },
              ],
            },
            {
              element: (
                <PermissionRoute
                  permissions={[Permission.RESULT_HISTORY_VIEW]}
                />
              ),
              children: [
                { path: "results/history", element: <ResultHistoryPage /> },
              ],
            },

            // การประกันคุณภาพภายใน
            {
              element: (
                <PermissionRoute permissions={[Permission.INSTANCE_VIEW]} />
              ),
              children: [
                { path: "iqa", element: <IQAHomePage /> },
                { path: "iqa/cycles", element: <IQACycleListPage /> },
                { path: "iqa/cycles/:cycleId", element: <IQACycleDetailPage /> },
                { path: "iqa/assess/:assessmentId", element: <IQAAssessPage /> },
              ],
            },

            // ลงเวลาปฏิบัติงาน
            {
              element: (
                <PermissionRoute permissions={[Permission.ATTENDANCE_VIEW]} />
              ),
              children: [{ path: "attendance", element: <AttendancePage /> }],
            },
            {
              element: (
                <PermissionRoute
                  permissions={[Permission.ATTENDANCE_MANAGE]}
                />
              ),
              children: [
                {
                  path: "attendance/manage",
                  element: <AttendanceManagePage />,
                },
                {
                  path: "attendance/geofence",
                  element: <AttendanceGeofencePage />,
                },
              ],
            },

            // ข้อมูลบุคลากร
            {
              element: (
                <PermissionRoute permissions={[Permission.PERSONNEL_VIEW]} />
              ),
              children: [
                { path: "personnel", element: <PersonnelHomePage /> },
                { path: "personnel/list", element: <PersonnelListPage /> },
                { path: "personnel/detail/:id", element: <PersonnelDetailPage /> },
              ],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.PERSONNEL_CREATE]} />
              ),
              children: [
                { path: "personnel/create", element: <PersonnelCreatePage /> },
                {
                  path: "personnel/edit/:id",
                  element: <PersonnelCreatePage />,
                },
                { path: "personnel/import", element: <PersonnelImportPage /> },
              ],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.POSITION_VIEW]} />
              ),
              children: [
                { path: "positions", element: <PositionListPage /> },
              ],
            },

            // ตั้งค่าระบบ
            {
              element: (
                <PermissionRoute permissions={[Permission.SETTING_SCHOOL]} />
              ),
              children: [
                { path: "settings/school", element: <SchoolSettingPage /> },
              ],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.SETTING_ACADEMIC]} />
              ),
              children: [
                {
                  path: "settings/academic-year",
                  element: <AcademicYearSettingPage />,
                },
              ],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.SETTING_SCORING]} />
              ),
              children: [
                { path: "settings/scoring", element: <ScoringSettingPage /> },
              ],
            },

            // จัดการผู้ใช้งาน
            {
              element: (
                <PermissionRoute permissions={[Permission.USER_VIEW]} />
              ),
              children: [
                { path: "user", element: <UserManagementHomePage /> },
                { path: "user/manage", element: <UserManagementPage /> },
              ],
            },

            // ตั้งค่าระบบ — หน้าแรกของโมดูล
            {
              element: (
                <PermissionRoute permissions={[Permission.SETTING_MANAGE]} />
              ),
              children: [
                { path: "settings", element: <SettingsHomePage /> },
                { path: "settings/modules", element: <ModuleSettingsPage /> },
              ],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.ROLE_VIEW]} />
              ),
              children: [{ path: "/roles", element: <RolePage /> }],
            },
            {
              element: (
                <PermissionRoute permissions={[Permission.PERMISSION_VIEW]} />
              ),
              children: [
                { path: "/permissions", element: <PermissionPage /> },
              ],
            },

            // {
            //   path: "evaluation/instance/list",
            //   element: <EvaluationInstanceList />,
            // },
          ],
        },

        // 403 — เข้าได้เฉพาะตอน login แล้ว แต่ไม่บังคับ permission
        { path: "unauthorized", element: <UnauthorizedPage /> },
      ],
    },
    {
      element: <AuthRoute />,
      children: [{ path: "login", element: <LoginPage /> }],
    },
  ],
  {
    basename: "/",
  },
);

export default router;
