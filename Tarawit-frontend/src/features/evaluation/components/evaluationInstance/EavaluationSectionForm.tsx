import InstanceAttachments from "../InstanceAttachments";
import EvaluationHeader from "./EvaluationHeader";
import EvaluationQuestionTable from "./EvaluationQuestionTable";

import type { EvaluationSectionForm } from "../../types/EvaluationSectionForm_type";
import { getTemplateTypeConfig } from "../../helper/templateTypeConfig";

interface EvaluationSectionProps {
  detail: EvaluationSectionForm;
  answers: Record<number, number>;
  mode: "view" | "evaluate";
  canEditFields?: boolean;
  canUpload?: boolean;
  // ถ้าไม่ส่ง จะใช้ค่าจาก template_type
  showAttachments?: boolean;
  /** ซ่อนหัวรายละเอียดซ้ำ เมื่อ parent มีหัวข้อมูลของตัวเองแล้ว */
  showHeader?: boolean;
  loading?: boolean;
  /** คะแนนเฉลี่ยจริง (กรณี answers ถูกปัดเป็นวงกลม) */
  averageOverride?: number | null;
  comment?: string;
  onCommentChange?: (comment: string) => void;
  onAnswerChange?: (questionId: number, score: number) => void;
  onSave?: (values: Record<number, string>) => Promise<void>;
}

export default function EvaluationSectionForm({
  detail,
  answers,
  mode,
  canEditFields = false,
  canUpload = false,
  showAttachments,
  showHeader,
  loading = false,
  averageOverride,
  comment = "",
  onCommentChange,
  onSave,
  onAnswerChange,
}: EvaluationSectionProps) {
  if (!detail.target) {
    return (
      <div className="py-10 text-center text-gray-400">กำลังโหลดข้อมูล...</div>
    );
  }

  const config = getTemplateTypeConfig(detail.template_type);
  const shouldShowAttachments = showAttachments ?? config.showAttachments;
  const shouldShowHeader = showHeader ?? config.showHeader;

  const shouldAllowUpload = config.canUploadAttachments && (canUpload ?? false);

  const scoreMode =
    config.canScore && mode === "evaluate" ? "evaluate" : "view";
  return (
    <>
      {shouldShowHeader && (
        <EvaluationHeader
          detail={detail}
          canEditFields={canEditFields}
          loading={loading}
          onSave={onSave}
        />
      )}

      {shouldShowAttachments && (
        <InstanceAttachments
          instanceId={detail.id}
          targetId={detail.target.id}
          canUpload={shouldAllowUpload}
        />
      )}

      <EvaluationQuestionTable
        questions={detail.questions}
        mode={scoreMode}
        answers={answers}
        averageOverride={averageOverride}
        comment={comment}
        onCommentChange={scoreMode === "evaluate" ? onCommentChange : undefined}
        onChange={scoreMode === "evaluate" ? onAnswerChange : undefined}
      />
    </>
  );
}
