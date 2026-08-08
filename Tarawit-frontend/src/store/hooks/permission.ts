export const Permission = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",

  // Report
  REPORT_VIEW: "report.view",
  REPORT_CREATE: "report.create",
  REPORT_EDIT: "report.edit",
  REPORT_DELETE: "report.delete",

  // Evaluation
  EVALUATION_VIEW: "evaluation.view",
  EVALUATION_CREATE: "evaluation.create",
  EVALUATION_EDIT: "evaluation.edit",
  EVALUATION_APPROVE: "evaluation.approve",

  // Template
  TEMPLATE_VIEW: "template.view",
  TEMPLATE_CREATE: "template.create",
  TEMPLATE_EDIT: "template.edit",

  // User
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_EDIT: "user.edit",
  USER_DELETE: "user.delete",
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];
