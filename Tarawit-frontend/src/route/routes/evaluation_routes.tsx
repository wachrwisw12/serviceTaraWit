import EvalHomePage from "@/features/evaluation/pages/EvalHomePage";
import type { RouteObject } from "react-router-dom";

export const evaluationRoutes: RouteObject[] = [
  {
    path: "evalution",
    children: [
      {
        index: true,
        element: <EvalHomePage />,
      },
      //   {
      //     path: "clients",
      //     element: <ApiClientPage />,
      //   },
      //   {
      //     path: "credentials",
      //     element: <CredentialsPage />,
      //   },
      //   {
      //     path: "logs",
      //     element: <RequestLogsPage />,
      //   },
      //   {
      //     path: "audit-logs",
      //     element: <AuditLogsPage />,
      //   },
    ],
  },
];
