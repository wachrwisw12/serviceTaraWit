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
  loading?: boolean;
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
  loading = false,
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

  const shouldAllowUpload = config.canUploadAttachments && (canUpload ?? false);

  const scoreMode =
    config.canScore && mode === "evaluate" ? "evaluate" : "view";
  return (
    <>
      {config.showHeader && (
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
        onChange={scoreMode === "evaluate" ? onAnswerChange : undefined}
      />
    </>
  );
}
