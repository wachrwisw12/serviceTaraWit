export const EVALUATION_INSTANCE_STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  CLOSED: "closed",
  CANCELLED: "cancelled",
} as const;

export type EvaluationInstanceStatus =
  (typeof EVALUATION_INSTANCE_STATUS)[keyof typeof EVALUATION_INSTANCE_STATUS];

export const EVALUATION_STATUS_LABEL: Record<EvaluationInstanceStatus, string> =
  {
    draft: "ร่าง",
    open: "เปิดประเมิน",
    in_progress: "กำลังประเมิน",
    submitted: "ส่งผลแล้ว",
    closed: "ปิดรอบ",
    cancelled: "ยกเลิก",
  };

export const EVALUATION_STATUS_COLOR: Record<EvaluationInstanceStatus, string> =
  {
    draft: "#9ca3af",
    open: "#22c55e",
    in_progress: "#3b82f6",
    submitted: "#8b5cf6",
    closed: "#6b7280",
    cancelled: "#ef4444",
  };
