import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Inbox, Loader2 } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";

import {
  clearMyInstanceDetail,
  fetchInstanceAttachments,
  fetchMyInstanceDetail,
  updateInstanceFields,
} from "../api/MyInstanceSlice";

import {
  canTargetAnswer,
  getTemplateTypeConfig,
} from "../helper/templateTypeConfig";

import { SCORE_LEVELS } from "../../../utils/Scorescale";
import useSnackbar from "../../../components/snackbar/useSnackbar";

import EvaluationSectionForm from "../components/evaluationInstance/EavaluationSectionForm";

interface StatusScreenProps {
  icon: ReactNode;
  tone: "loading" | "error" | "empty";
  children: ReactNode;
}

function StatusScreen({ icon, tone, children }: StatusScreenProps) {
  const toneClass = tone === "error" ? "text-red-500" : "text-gray-400";

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-24 text-center">
      <span className={toneClass}>{icon}</span>

      <p className="text-sm text-gray-500">{children}</p>
    </div>
  );
}

export default function MyEvaluationResultDetailPage() {
  const { id } = useParams<{ id: string }>();

  const instanceId = id ? Number(id) : NaN;

  const dispatch = useAppDispatch();
  const snackbar = useSnackbar();

  const { detail, detailLoading, detailError } = useAppSelector(
    (state) => state.myInstance,
  );

  const currentUser = useAppSelector((state) => state.auth.user);

  /*
   * คำตอบของ Survey
   */
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const [answerError, setAnswerError] = useState<string | null>(null);

  const [submittingAnswers, setSubmittingAnswers] = useState(false);

  /*
   * โหลดรายละเอียด Instance
   */
  useEffect(() => {
    if (!Number.isNaN(instanceId)) {
      dispatch(fetchMyInstanceDetail(instanceId));
    }

    return () => {
      dispatch(clearMyInstanceDetail());
    };
  }, [dispatch, instanceId]);

  /*
   * เคลียร์คำตอบเมื่อเปลี่ยนรายการ
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers({});
    setAnswerError(null);
    setSubmittingAnswers(false);
  }, [instanceId]);

  /*
   * โหลด Attachment เฉพาะ Template
   * ที่กำหนดให้แสดง Attachment
   */
  useEffect(() => {
    if (!detail?.id || !detail.target?.id) {
      return;
    }

    const config = getTemplateTypeConfig(detail.template_type);

    if (!config.showAttachments) {
      return;
    }

    dispatch(
      fetchInstanceAttachments({
        instanceId: detail.id,
        targetId: detail.target.id,
      }),
    );
  }, [dispatch, detail?.id, detail?.target?.id, detail?.template_type]);

  /*
   * Loading
   */
  if (detailLoading) {
    return (
      <StatusScreen
        tone="loading"
        icon={<Loader2 size={28} className="animate-spin" />}
      >
        กำลังโหลดข้อมูล...
      </StatusScreen>
    );
  }

  /*
   * Error
   */
  if (detailError) {
    return (
      <StatusScreen tone="error" icon={<AlertCircle size={28} />}>
        เกิดข้อผิดพลาด: {detailError}
      </StatusScreen>
    );
  }

  /*
   * Empty
   */
  if (!detail) {
    return (
      <StatusScreen tone="empty" icon={<Inbox size={28} />}>
        ไม่พบรายการที่ต้องการ
      </StatusScreen>
    );
  }
  console.log({
    currentUserId: currentUser?.id,
    targetUserId: detail.target?.user_id,
    currentType: typeof currentUser?.id,
    targetType: typeof detail.target?.user_id,
  });
  const templateConfig = getTemplateTypeConfig(detail.template_type);

  const isOwner = currentUser?.id === detail.target?.user_id;

  const normalizedStatus = detail.status?.toUpperCase();

  const isClosed = normalizedStatus === "CLOSED";

  const isDraft = normalizedStatus === "DRAFT";

  /*
   * true เฉพาะ SURVEY
   *
   * หมายถึง Template นี้กำหนดให้ Target
   * หรือเจ้าตัวเป็นผู้ตอบ
   */
  const isTargetResponseTemplate = canTargetAnswer(detail.template_type);

  /*
   * เจ้าตัวตอบ Survey ได้เมื่อ:
   * - เป็น Survey
   * - เป็นเจ้าของรายการ
   * - รายการยังไม่ปิด
   */
  const canAnswerSurvey = isTargetResponseTemplate && isOwner && !isClosed;

  /*
   * Dynamic fields ใช้กับ Evaluation
   *
   * เจ้าตัวแก้ได้เฉพาะตอน DRAFT
   */
  const canEditFields = !isTargetResponseTemplate && isOwner && isDraft;

  /*
   * Upload ได้ตาม Template config
   */
  const canUpload = templateConfig.canUploadAttachments && isOwner && !isClosed;

  /*
   * คำถามทั้งหมด
   */
  const questionIds = detail.questions?.map((question) => question.id) ?? [];

  const totalQuestions = questionIds.length;

  const answeredCount = questionIds.filter(
    (questionId) => answers[questionId] !== undefined,
  ).length;

  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);

  const isComplete = totalQuestions > 0 && answeredCount === totalQuestions;

  /*
   * บันทึก Dynamic Fields
   */
  const handleSaveFields = async (values: Record<number, string>) => {
    if (!canEditFields) return;

    try {
      await dispatch(
        updateInstanceFields({
          instanceId: detail.id,
          fields: values,
        }),
      ).unwrap();

      await dispatch(fetchMyInstanceDetail(detail.id)).unwrap();

      snackbar.showSnackbar("บันทึกข้อมูลเรียบร้อยแล้ว", "success");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      snackbar.showSnackbar("บันทึกข้อมูลไม่สำเร็จ", "error");
    }
  };

  /*
   * เลือกคำตอบของ Survey
   */
  const handleAnswerChange = (questionId: number, score: number) => {
    if (!canAnswerSurvey || submittingAnswers) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [questionId]: score,
    }));

    setAnswerError(null);
  };

  /*
   * ส่งแบบสอบถาม
   *
   * ตอนนี้ตรวจความครบก่อน
   * แต่ยังไม่เรียก API เพราะยังไม่มี
   * submitInstanceAnswers ใน Slice
   */
  const handleSubmitSurvey = async () => {
    if (!canAnswerSurvey || submittingAnswers) {
      return;
    }

    if (totalQuestions === 0) {
      setAnswerError("ไม่พบคำถามในแบบสอบถามนี้");
      return;
    }

    if (answeredCount === 0) {
      setAnswerError("กรุณาตอบแบบสอบถามก่อนส่ง");
      return;
    }

    if (!isComplete) {
      setAnswerError(
        `กรุณาตอบแบบสอบถามให้ครบ ยังเหลืออีก ${unansweredCount} ข้อ`,
      );
      return;
    }

    setAnswerError(
      "ตอบแบบสอบถามครบแล้ว แต่ยังไม่ได้เชื่อมต่อ API สำหรับบันทึกคำตอบ",
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/60 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/my/evaluation"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-[#2fae60]"
        >
          <ArrowLeft size={16} />
          กลับไปยังรายการของฉัน
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <EvaluationSectionForm
            detail={detail}
            answers={answers}
            mode={canAnswerSurvey ? "evaluate" : "view"}
            canEditFields={canEditFields}
            canUpload={canUpload}
            loading={submittingAnswers}
            onSave={canEditFields ? handleSaveFields : undefined}
            onAnswerChange={canAnswerSurvey ? handleAnswerChange : undefined}
          />

          {/* Survey footer */}
          {isTargetResponseTemplate && (
            <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs">
                {totalQuestions > 0 && (
                  <p
                    className={
                      isComplete ? "text-emerald-600" : "text-amber-600"
                    }
                  >
                    {isComplete
                      ? `ตอบครบแล้ว ${answeredCount}/${totalQuestions} ข้อ`
                      : `ตอบแล้ว ${answeredCount}/${totalQuestions} ข้อ เหลือ ${unansweredCount} ข้อ`}
                  </p>
                )}

                {answerError && (
                  <p className="mt-1 text-rose-500">{answerError}</p>
                )}

                {!isOwner && (
                  <p className="mt-1 text-rose-500">
                    คุณไม่มีสิทธิ์ตอบแบบสอบถามรายการนี้
                  </p>
                )}

                {isClosed && (
                  <p className="mt-1 text-gray-500">
                    แบบสอบถามนี้ปิดรับคำตอบแล้ว
                  </p>
                )}
              </div>

              {canAnswerSurvey && (
                <button
                  type="button"
                  onClick={handleSubmitSurvey}
                  disabled={submittingAnswers}
                  className="h-10 rounded-lg bg-[#2fae60] px-6 text-sm font-medium text-white transition-colors hover:bg-[#218a4a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingAnswers ? "กำลังส่ง..." : "ส่งแบบสอบถาม"}
                </button>
              )}
            </div>
          )}

          {/* Evaluator signatures */}
          {!isTargetResponseTemplate &&
            detail.evaluators &&
            detail.evaluators.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2">
                {detail.evaluators.map((evaluator) => (
                  <div
                    key={evaluator.user_id}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="h-10 w-48 border-b border-gray-300" />

                    <p className="mt-2 text-sm text-gray-500">ผู้นิเทศ</p>

                    <p className="mt-3 text-sm font-medium text-gray-800">
                      ({evaluator.name_snapshort})
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      ตำแหน่ง {evaluator.position_snapshort}
                    </p>
                  </div>
                ))}
              </div>
            )}

          {/* Score legend */}
          <div className="mt-10 rounded-xl border border-gray-100 bg-gray-50 p-5">
            <p className="mb-3 text-xs font-medium tracking-wide text-gray-500">
              เกณฑ์การให้คะแนน
            </p>

            <ul className="space-y-2">
              {SCORE_LEVELS.map((item) => (
                <li key={item.score} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{
                      backgroundColor: item.color,
                    }}
                  >
                    {item.score}
                  </span>

                  <span className="text-xs leading-5 text-gray-600">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
