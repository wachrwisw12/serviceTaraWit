import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Link, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Inbox, Loader2 } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";

import {
  clearMyInstanceDetail,
  fetchInstanceAttachments,
  fetchMyInstanceDetail,
  updateInstanceFields,
} from "../api/MyInstanceSlice";
import { submitEvaluationAnswers } from "../api/EvaluatorSlice";

import {
  canTargetAnswer,
  getTemplateTypeConfig,
} from "../helper/templateTypeConfig";

import { useScoreLevels } from "../../setting/hooks/useScoreLevels";
import useSnackbar from "../../../components/snackbar/useSnackbar";

import EvaluationSectionForm from "../components/evaluationInstance/EavaluationSectionForm";
import EvaluatorScoreCompareTable from "../components/evaluators/EvaluatorScoreCompareTable";
import TargetEvaluationSummary from "../components/evaluators/TargetEvaluationSummary";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTargetId = Number(searchParams.get("target_id"));
  const selectedTargetId = Number.isFinite(requestedTargetId) && requestedTargetId > 0
    ? requestedTargetId
    : undefined;

  const dispatch = useAppDispatch();
  const snackbar = useSnackbar();

  const { detail, detailLoading, detailError } = useAppSelector(
    (state) => state.myInstance,
  );

  const scoreLevels = useScoreLevels();

  const currentUser = useAppSelector((state) => state.auth.user);

  /*
   * คำตอบของ Survey
   */
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const [answerError, setAnswerError] = useState<string | null>(null);

  const [submittingAnswers, setSubmittingAnswers] = useState(false);

  /*
   * มุมมองสรุปหลัง CLOSED (หน้าผู้ถูกประเมิน):
   * - "average" → ภาพรวม (เฉลี่ยทุกคน) / แท็บผู้ประเมินรายคน
   * - "compare" → เปรียบเทียบคะแนนรายผู้ประเมินแบบเคียงข้างกัน (A vs B)
   */
  const [closedViewMode, setClosedViewMode] = useState<
    "average" | "compare"
  >("average");

  /*
   * โหลดรายละเอียด Instance
   */
  useEffect(() => {
    if (!Number.isNaN(instanceId)) {
      dispatch(fetchMyInstanceDetail({ instanceId, targetId: selectedTargetId }));
    }

    return () => {
      dispatch(clearMyInstanceDetail());
    };
  }, [dispatch, instanceId, selectedTargetId]);

  /*
   * เคลียร์คำตอบเมื่อเปลี่ยนรายการ
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers({});
    setAnswerError(null);
    setSubmittingAnswers(false);
    setClosedViewMode("average");
  }, [instanceId]);

  /*
   * โหลดคะแนนที่ผู้ประเมินเลือกไว้ (selected_score) จาก detail
   */
  useEffect(() => {
    if (!detail) return;

    const savedAnswers: Record<number, number> = {};

    for (const question of detail.questions ?? []) {
      const saved = question.selected_score;

      if (saved !== null && saved !== undefined) {
        savedAnswers[question.id] = saved;
      }

    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(savedAnswers);
  }, [detail]);

  /*
   * ผู้ประเมินที่ส่งคะแนนแล้ว (ไม่ซ้ำ) — ใช้เป็นแท็บเลือกดูรายคน
   */
  const evaluatorList = useMemo(() => {
    const seen = new Map<number, string>();

    for (const question of detail?.questions ?? []) {
      for (const es of question.evaluator_scores ?? []) {
        if (!seen.has(es.evaluator_id)) {
          seen.set(es.evaluator_id, es.evaluator_name);
        }
      }
    }

    return [...seen.entries()].map(([evaluator_id, evaluator_name]) => ({
      evaluator_id,
      evaluator_name,
    }));
  }, [detail]);

  /* null = เฉลี่ยทุกคน */
  const [activeEvaluatorId, setActiveEvaluatorId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveEvaluatorId(null);
  }, [detail?.id]);

  /*
   * คะแนนที่แสดงในโหมดดูผล:
   * - null (เฉลี่ย) → ปัดค่าเฉลี่ยรายข้อเป็นวงกลม
   * - ระบุคน → คะแนนของผู้ประเมินคนนั้น
   */
  const viewAnswers = useMemo<Record<number, number>>(() => {
    const result: Record<number, number> = {};

    for (const question of detail?.questions ?? []) {
      const scores = question.evaluator_scores ?? [];

      if (scores.length === 0) continue;

      if (activeEvaluatorId === null) {
        const avg =
          scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

        result[question.id] = Math.round(avg);
      } else {
        const hit = scores.find((s) => s.evaluator_id === activeEvaluatorId);

        if (hit) result[question.id] = hit.score;
      }
    }

    return result;
  }, [detail, activeEvaluatorId]);

  /*
   * คะแนนเฉลี่ยจริง (ไม่ปัด) — แสดงในแถว "คะแนนเฉลี่ย"
   * ตอนแท็บเฉลี่ยที่ answers ถูกปัดเป็นวงกลมแล้ว
   */
  const overallAverage = useMemo<number | null>(() => {
    const all: number[] = [];

    for (const question of detail?.questions ?? []) {
      for (const s of question.evaluator_scores ?? []) {
        if (
          activeEvaluatorId === null ||
          s.evaluator_id === activeEvaluatorId
        ) {
          all.push(s.score);
        }
      }
    }

    return all.length > 0
      ? all.reduce((sum, x) => sum + x, 0) / all.length
      : null;
  }, [detail, activeEvaluatorId]);

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
  const templateConfig = getTemplateTypeConfig(detail.template_type);

  const isOwner = currentUser?.id === detail.target?.user_id;

  const normalizedStatus = detail.status?.toUpperCase();

  const isClosed = normalizedStatus === "CLOSED";

  const currentEvaluator = detail.evaluators?.find(
    (evaluator) => evaluator.user_id === Number(currentUser?.id),
  );
  const isSigner = currentEvaluator?.requires_signature === true;

  // ผู้ลงนามต้องตรวจคะแนนของผู้ประเมินทุกคนได้ก่อนลงนาม แม้รอบยังเปิดอยู่
  const canViewEvaluatorResults = isClosed || isSigner;

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
   * - assignment ยังไม่ได้ส่ง (pending)
   */
  const isAssignmentSubmitted = detail.assignment_status === "submitted";
  const canAnswerSurvey = isTargetResponseTemplate && isOwner && !isClosed && !isAssignmentSubmitted;

  /*
   * Dynamic fields ใช้กับ Evaluation
   *
   * ผู้รับการประเมินแก้ข้อมูลรายการได้จนกว่าจะปิดการประเมิน
   */
  const canEditFields = !isTargetResponseTemplate && isOwner && !isClosed;

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
   * ใช้ submitEvaluationAnswers จาก EvaluatorSlice
   * (backend ใช้ endpoint เดียวกันสำหรับ EVALUATION และ SURVEY)
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

    if (!detail.assignment_id) {
      setAnswerError("ไม่พบรายการประเมินสำหรับส่งคำตอบ");
      return;
    }

    setAnswerError(null);
    setSubmittingAnswers(true);

    try {
      await dispatch(
        submitEvaluationAnswers({
          assignment_id: detail.assignment_id,
          answers: Object.entries(answers).map(([questionId, score]) => ({
            question_id: Number(questionId),
            score,
            answer_text: null,
          })),
        }),
      ).unwrap();

      snackbar.showSnackbar("ส่งแบบสอบถามเรียบร้อยแล้ว", "success");

      // โหลดข้อมูลใหม่เพื่ออัปเดตสถานะ
      await dispatch(fetchMyInstanceDetail(instanceId)).unwrap();
    } catch (error) {
      const message =
        typeof error === "string" ? error : "ส่งแบบสอบถามไม่สำเร็จ";
      setAnswerError(message);
    } finally {
      setSubmittingAnswers(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/my/evaluation"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
          >
            <ArrowLeft size={16} />
            กลับไปยังรายการของฉัน
          </Link>

          {isClosed && !isTargetResponseTemplate && detail && (
            <Link
              to={`/my/evaluation-results-detail/${detail.id}/print?target_id=${detail.target.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              พิมพ์ PDF
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
		  {detail.accessible_targets.length > 1 && (
			<div className="mb-6 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
			  <label htmlFor="result-target" className="mb-2 block text-sm font-semibold text-violet-900">
				เลือกผู้ถูกประเมินที่ต้องการตรวจ
			  </label>
			  <select
				id="result-target"
				value={detail.target.id}
				onChange={(event) => {
				  setClosedViewMode("average");
				  setActiveEvaluatorId(null);
				  setSearchParams({ target_id: event.target.value });
				}}
				className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
			  >
				{detail.accessible_targets.map((target) => (
				  <option key={target.id} value={target.id}>
					{target.name}{target.position ? ` — ${target.position}` : ""}
				  </option>
				))}
			  </select>
			</div>
		  )}
          {canViewEvaluatorResults && !isTargetResponseTemplate && (
            <TargetEvaluationSummary questions={detail.questions ?? []} />
          )}

          {/* สลับผลเฉลี่ยและผลรายผู้ประเมินหลังปิดรอบ */}
          {canViewEvaluatorResults &&
            detail.evaluators.some((evaluator) => evaluator.can_score !== false) &&
            !isTargetResponseTemplate && (
              <div className="mb-5 flex w-full rounded-lg bg-gray-100 p-1 text-sm font-medium sm:w-fit">
                <button
                  type="button"
                  onClick={() => setClosedViewMode("average")}
                  className={`flex-1 rounded-md px-3 py-2 transition-colors sm:flex-none ${
                    closedViewMode === "average"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ผลเฉลี่ยรายข้อ
                </button>
                <button
                  type="button"
                  onClick={() => setClosedViewMode("compare")}
                  className={`flex-1 rounded-md px-3 py-2 transition-colors sm:flex-none ${
                    closedViewMode === "compare"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ผลรายผู้ประเมิน
                </button>
              </div>
            )}

          {closedViewMode === "compare" && canViewEvaluatorResults && !isTargetResponseTemplate ? (
            <EvaluatorScoreCompareTable
              questions={detail.questions ?? []}
              evaluatorRoster={detail.evaluators}
            />
          ) : (
            <>
          {canViewEvaluatorResults && evaluatorList.length >= 1 && !isTargetResponseTemplate && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                ผู้ประเมิน:
              </span>

              <button
                type="button"
                onClick={() => setActiveEvaluatorId(null)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeEvaluatorId === null
                    ? "bg-primary text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                เฉลี่ยทุกคน
              </button>

              {evaluatorList.map((evaluator) => (
                <button
                  key={evaluator.evaluator_id}
                  type="button"
                  onClick={() => setActiveEvaluatorId(evaluator.evaluator_id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeEvaluatorId === evaluator.evaluator_id
                      ? "bg-primary text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {evaluator.evaluator_name}
                </button>
              ))}
            </div>
          )}

          <EvaluationSectionForm
            detail={detail}
            answers={canAnswerSurvey ? answers : viewAnswers}
            mode={canAnswerSurvey ? "evaluate" : "view"}
            canEditFields={canEditFields}
            canUpload={canUpload}
            loading={submittingAnswers}
            averageOverride={canAnswerSurvey ? undefined : overallAverage}
            onSave={canEditFields ? handleSaveFields : undefined}
            onAnswerChange={canAnswerSurvey ? handleAnswerChange : undefined}
          />

          {/* Survey footer */}
          {isTargetResponseTemplate && (
            <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs">
                {totalQuestions > 0 && isAssignmentSubmitted && (
                  <p className="text-primary-dark">
                    ส่งแบบสอบถามแล้ว ✓ ตอบครบ {answeredCount}/{totalQuestions} ข้อ
                  </p>
                )}

                {totalQuestions > 0 && !isAssignmentSubmitted && (
                  <p
                    className={
                      isComplete ? "text-primary-dark" : "text-amber-600"
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
                  className="h-10 rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingAnswers ? "กำลังส่ง..." : "ส่งแบบสอบถาม"}
                </button>
              )}
            </div>
          )}



          {/* Score legend */}
          <div className="mt-10 rounded-xl border border-gray-100 bg-gray-50 p-5">
            <p className="mb-3 text-xs font-medium tracking-wide text-gray-500">
              เกณฑ์การให้คะแนน
            </p>

            <ul className="space-y-2">
              {scoreLevels.map((item) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
