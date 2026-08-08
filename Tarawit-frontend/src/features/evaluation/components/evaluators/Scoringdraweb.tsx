import { useEffect, useState } from "react";
import { Drawer, IconButton } from "@mui/material";
import { X } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../../store/hooks";

import {
  canEvaluatorAnswer,
  getTemplateTypeConfig,
} from "../../helper/templateTypeConfig";

import type { TargetInstanceStatus } from "../../api/batchtargetSlice";

import AttachmentViewer from "../Attachmentviewer";
import EavaluationSectionForm from "../evaluationInstance/EavaluationSectionForm";
import { fetchEvaluatorDetail } from "../../api/EvaluatorSlice";

interface Props {
  open: boolean;
  onClose: () => void;
  targetUserId: number;
  targetName: string;
  instance: TargetInstanceStatus | null;
  onSubmitted?: () => void;
}

export default function ScoringDrawer({
  open,
  onClose,
  instance,
  targetUserId,
  targetName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSubmitted: _onSubmitted,
}: Props) {
  const dispatch = useAppDispatch();

  const { detail, loading } = useAppSelector((state) => state.evaluator);

  const [answers, setAnswers] = useState<Record<number, number>>({});

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  console.log("instance", instance);
  console.log("instance_id", instance?.instance_id);
  console.log("targetUserId", targetUserId);
  /*
   * โหลดรายละเอียดเมื่อเปิด Drawer
   */
  console.log("instance", instance?.instance_id);
  useEffect(() => {
    if (!open || !instance) return;

    dispatch(fetchEvaluatorDetail(instance.instance_id));
  }, [open, instance?.instance_id, targetUserId, dispatch, instance]);

  /*
   * เคลียร์ state เมื่อเปลี่ยนรายการ
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers({});
    setSubmitting(false);
    setSubmitError(null);
  }, [instance?.instance_id, targetUserId]);

  /*
   * อ่าน config จาก template_type
   */
  const templateConfig = detail
    ? getTemplateTypeConfig(detail.template_type)
    : null;

  /*
   * Drawer นี้เป็นหน้าของผู้ประเมิน
   * จึงตอบได้เฉพาะ EVALUATION
   */
  const canEvaluatorScore = detail
    ? canEvaluatorAnswer(detail.template_type)
    : false;

  const shouldShowAttachments = templateConfig?.showAttachments === true;

  /*
   * นับเฉพาะคำถามที่อยู่ใน detail.questions จริง
   */
  const questionIds = detail?.questions?.map((question) => question.id) ?? [];

  const totalQuestions = questionIds.length;

  const answeredCount = questionIds.filter(
    (questionId) => answers[questionId] !== undefined,
  ).length;

  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);

  const isComplete = totalQuestions > 0 && answeredCount === totalQuestions;

  const hasUnsavedAnswers = answeredCount > 0;

  /*
   * เลือกคะแนน
   */
  const handleScoreChange = (questionId: number, score: number) => {
    if (!canEvaluatorScore || submitting) return;

    setAnswers((previous) => ({
      ...previous,
      [questionId]: score,
    }));

    setSubmitError(null);
  };

  /*
   * ปิด Drawer
   */
  const handleRequestClose = () => {
    if (submitting) return;

    if (hasUnsavedAnswers) {
      const confirmed = window.confirm(
        "คะแนนที่กรอกไว้ยังไม่ได้บันทึก คุณต้องการออกและทิ้งคะแนนเหล่านี้หรือไม่?",
      );

      if (!confirmed) return;
    }

    setAnswers({});
    setSubmitError(null);

    onClose();
  };

  /*
   * ตรวจสอบก่อนบันทึก
   *
   * ตอนนี้ยังไม่เรียก API เพราะ MyInstanceSlice
   * ยังไม่มี submitInstanceAnswers
   */
  const handleSubmit = async () => {
    if (!instance || !detail || submitting) {
      return;
    }

    if (!canEvaluatorScore) {
      setSubmitError("แบบสอบถามต้องให้กลุ่มเป้าหมายเป็นผู้ตอบด้วยตนเอง");
      return;
    }

    if (totalQuestions === 0) {
      setSubmitError("ไม่พบคำถามสำหรับการประเมินนี้");
      return;
    }

    if (answeredCount === 0) {
      setSubmitError("กรุณาให้คะแนนก่อนบันทึก");
      return;
    }

    if (!isComplete) {
      setSubmitError(
        `กรุณาให้คะแนนให้ครบทุกข้อ ยังเหลืออีก ${unansweredCount} ข้อ`,
      );
      return;
    }

    /*
     * รอเชื่อม submitInstanceAnswers
     *
     * ห้ามเรียก onSubmitted และ onClose ตอนนี้
     * เพราะข้อมูลยังไม่ได้ถูกบันทึกจริง
     */
    setSubmitError(
      "ให้คะแนนครบแล้ว แต่ยังไม่ได้เชื่อมต่อ API สำหรับบันทึกคะแนน",
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleRequestClose}
      PaperProps={{
        sx: {
          width: {
            xs: "100%",
            md: "90%",
            lg: "1200px",
          },
        },
      }}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              ลงคะแนนประเมิน
            </h2>

            {/* <p className="mt-0.5 text-sm text-gray-500">
              {detail?.template_name ?? "กำลังโหลดข้อมูล"}
            </p> */}

            {targetName && (
              <p className="mt-0.5 text-xs text-gray-400">
                ผู้รับการประเมิน: {targetName}
              </p>
            )}
          </div>

          <IconButton
            onClick={handleRequestClose}
            disabled={submitting}
            aria-label="ปิด"
          >
            <X />
          </IconButton>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            กำลังโหลดข้อมูล...
          </div>
        )}

        {/* Empty */}
        {!loading && !detail && open && (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            ไม่พบรายละเอียดการประเมิน
          </div>
        )}

        {/* Content */}
        {!loading && detail && (
          <div className="flex flex-1 overflow-hidden">
            {/* Attachment */}
            {shouldShowAttachments && (
              <div className="hidden w-1/2 overflow-auto border-r lg:block">
                <AttachmentViewer
                  instanceId={detail.id}
                  targetId={detail.target.id}
                  attachmentIds={
                    detail.attachments?.map(
                      (attachment: { id: unknown }) => attachment.id,
                    ) ?? []
                  }
                />
              </div>
            )}

            {/* Score form */}
            <div
              className={
                shouldShowAttachments
                  ? "w-full overflow-auto p-5 lg:w-1/2"
                  : "w-full overflow-auto p-5"
              }
            >
              {canEvaluatorScore ? (
                <EavaluationSectionForm
                  detail={detail}
                  mode="evaluate"
                  canEditFields={false}
                  canUpload={false}
                  loading={false}
                  showAttachments={false}
                  answers={answers}
                  onAnswerChange={handleScoreChange}
                />
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="font-semibold text-amber-800">แบบสอบถาม</h3>

                  <p className="mt-1 text-sm text-amber-700">
                    แบบสอบถามต้องให้กลุ่มเป้าหมายเป็นผู้ตอบด้วยตนเอง
                    ผู้ประเมินไม่สามารถตอบแทนได้
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && detail && canEvaluatorScore && (
          <div className="flex items-center justify-between gap-4 border-t bg-white px-5 py-4">
            <div className="text-xs">
              {totalQuestions > 0 && (
                <p
                  className={isComplete ? "text-emerald-600" : "text-amber-600"}
                >
                  {isComplete
                    ? `ให้คะแนนครบแล้ว ${answeredCount}/${totalQuestions} ข้อ`
                    : `ให้คะแนนแล้ว ${answeredCount}/${totalQuestions} ข้อ เหลือ ${unansweredCount} ข้อ`}
                </p>
              )}

              {hasUnsavedAnswers && (
                <p className="mt-1 text-amber-600">มีคะแนนที่ยังไม่ได้บันทึก</p>
              )}

              {submitError && (
                <p className="mt-1 text-rose-500">{submitError}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRequestClose}
                disabled={submitting}
                className="h-10 rounded-lg px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="h-10 rounded-lg bg-[#2fae60] px-6 text-sm font-medium text-white transition-colors hover:bg-[#218a4a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "กำลังบันทึก..." : "บันทึกคะแนน"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
