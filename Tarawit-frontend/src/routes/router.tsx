import { createBrowserRouter, Navigate } from "react-router-dom";

import MainLayout from "../layout/MainLayout";
import LoginPage from "../features/auth/Loginpage";
import ProtectedRoute from "./protectedRoute";

import AuthRoute from "./authRoute";

import HomePage from "../features/dashboard/pages/HomePage";
import TemplateListPage from "../features/evaluation/pages/TemplateListPage";
import CreateEvaluationPage from "../features/evaluation/pages/CreateInstancePage";
import TemplateDetailPage from "../features/evaluation/pages/TemplateDetailPage";
import UserManagementPage from "../features/user/page/UserManagementPage";
import MyEvaluationPage from "../features/evaluation/pages/MyEvaluationPage";
import BatchTargetListPage from "../features/evaluation/pages/BatchTargetListPage";
import MyEvaluationResultDetailPage from "../features/evaluation/pages/MyEvaluationResultDetailPage";
// import RolePage from "../features/role/pages/RolePage";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        // {
        //   path: "report",
        //   element: (
        //     <TeachingEvaluationForm
        //       onSubmit={function (): void | Promise<void> {
        //         throw new Error("Function not implemented.");
        //       }}
        //     />
        //   ),
        // },
        // { path: "track", element: <TeachingEvaluationDashboard /> },

        {
          element: <ProtectedRoute />,
          children: [
            { path: "dashboard", element: <HomePage /> },
            { path: "evaluation/templates", element: <TemplateListPage /> },

            {
              path: "evaluation/instance/create",
              element: <CreateEvaluationPage />,
            },
            {
              path: "/my/evaluation",
              element: <MyEvaluationPage />,
            },
            {
              path: "/my/evaluation-results-detail/:id",
              element: <MyEvaluationResultDetailPage />,
            },

            {
              path: "evaluation/templates/:templateId",
              element: <TemplateDetailPage />,
            },
            {
              path: "evaluation/batches/:batchId",
              element: <BatchTargetListPage />,
            },
            // { path: "/roles", element: <RolePage /> },
            // {
            //   path: "evaluation/instance/list",
            //   element: <EvaluationInstanceList />,
            // },
            { path: "user/manage", element: <UserManagementPage /> },

            // {
            //   path: "/templates",
            //   children: [
            //     {
            //       // index: true,
            //       path: "",
            //       element: <TemplateListPage />,
            //     },
            //     // {
            //     //   path: ":id",
            //     //   element: <ReportDetail />,
            //     // },
            //   ],
            // },
          ],
        },
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
