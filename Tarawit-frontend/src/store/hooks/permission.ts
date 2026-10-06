export const Permission = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",
  DASHBOARD_EXPORT: "dashboard.export",

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
  EVALUATION_EVALUATE: "evaluation.evaluate",
  EVALUATION_ROUND_VIEW: "evaluation.round.view",
  EVALUATION_SUBMIT: "evaluation.submit",

  // Instance
  INSTANCE_CREATE: "instance.create",
  INSTANCE_VIEW: "instance.view",

  // Template
  TEMPLATE_VIEW: "template.view",
  TEMPLATE_CREATE: "template.create",
  TEMPLATE_EDIT: "template.edit",

  // Result
  RESULT_PERSON_VIEW: "result.person.view",
  RESULT_SUMMARY_VIEW: "result.summary.view",
  RESULT_HISTORY_VIEW: "result.history.view",

  // User
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_EDIT: "user.edit",
  USER_DELETE: "user.delete",
  USER_UPDATE: "user.update",

  // Role
  ROLE_VIEW: "role.view",
  ROLE_MANAGE: "role.manage",

  // Permission
  PERMISSION_VIEW: "permission.view",

  // Personnel
  PERSONNEL_VIEW: "personnel.view",
  PERSONNEL_CREATE: "personnel.create",
  POSITION_VIEW: "position.view",

  // Attendance
  ATTENDANCE_VIEW: "attendance.view",
  ATTENDANCE_MANAGE: "attendance.manage",

  // Setting
  SETTING_MANAGE: "setting.manage",
  SETTING_SCHOOL: "setting.school",
  SETTING_ACADEMIC: "setting.academic",
  SETTING_SCORING: "setting.scoring",
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];
