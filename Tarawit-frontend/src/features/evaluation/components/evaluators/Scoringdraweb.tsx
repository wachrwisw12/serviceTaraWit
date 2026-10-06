import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardCheck,
  PanelLeft,
  CheckCircle2,
  Hourglass,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { useDialog } from "../../../../components/dialog";
import {
  canEvaluatorAnswer,
  getTemplateTypeConfig,
} from "../../helper/templateTypeConfig";

import type { TargetInstanceStatus } from "../../api/batchtargetSlice";

import EvaluatorAttachmentUpload from "../EvaluatorAttachmentUpload";
import EavaluationSectionForm from "../evaluationInstance/EavaluationSectionForm";
import EvaluatorScoreCompareTable from "./EvaluatorScoreCompareTable";
import {
  fetchEvaluatorDetail,
  submitEvaluationAnswers,
} from "../../api/EvaluatorSlice";

interface Props {
  open: boolean;
  onClose: () => void;
  targetUserId: number;
  targetName: string;
  assignmentsId: number;
  instance: TargetInstanceStatus | null;
  onSubmitted?: () => void;

  // คิวให้คะแนนต่อเนื่อง (ก่อนหน้า/ถัดไป) — แสดงในหัวข้อเต็มจอ
  onPrev?: () => void;
  onNext?: () => void;
  queueIndex?: number;
  queueTotal?: number;
}

export default function ScoringDrawer({
  open,
  onClose,
  assignmentsId,
  targetUserId,
  targetName,
  onSubmitted,
  onPrev,
  onNext,
  queueIndex,
  queueTotal,
}: Props) {
  const dispatch = useAppDispatch();
  const { detail, loading } = useAppSelector((state) => state.evaluator);
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // บนมือถือให้เริ่มที่แบบประเมินก่อน หลักฐานยังเปิดดูได้จากปุ่มด้านบน
  const [filesVisible, setFilesVisible] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 768px)").matches,
  );
  const [attachmentCount, setAttachmentCount] = useState(0);



  /*
   * มุมมองสรุปหลัง CLOSED:
   * - "average" → ภาพรวม (เฉลี่ยทุกคน) เหมือนหน้าผู้ถูกประเมิน
   * - "compare" → เปรียบเทียบคะแนนรายผู้ประเมิน (A vs B) สำหรับผู้ดูแล
   */
  const [closedViewMode, setClosedViewMode] = useState<
    "average" | "compare"
  >("average");

  const { confirm } = useDialog();
  /*
   * โหลดรายละเอียดเมื่อเปิด Drawer
   */
  useEffect(() => {
    if (!open || !assignmentsId) return;

    dispatch(fetchEvaluatorDetail(assignmentsId));
  }, [open, assignmentsId, dispatch]);
  /*
   * เคลียร์ state เมื่อเปลี่ยนรายการ
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers({});
    setComment("");
    setSubmitting(false);
    setSubmitError(null);
    setClosedViewMode("average");
    setAttachmentCount(0);
  }, [assignmentsId, targetUserId]);

  /*
   * โหลดคะแนนที่บันทึกไว้แล้วจาก detail (selected_score)
   * ให้แสดงผลเดิมเมื่อเปิดดู/แก้ไขรอบที่ส่งคะแนนไปแล้ว
   */
  useEffect(() => {
    if (!detail) return;

    const savedAnswers: Record<number, number> = {};

    for (const question of detail.questions) {
      const saved = question.selected_score;

      if (saved !== null && saved !== undefined) {
        savedAnswers[question.id] = saved;
      }

    }

    // ซิงก์คะแนนที่บันทึกแล้วจาก detail เข้า state เมื่อโหลดข้อมูลเสร็จ
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(savedAnswers);
    setComment(detail.comment ?? "");
  }, [detail]);

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

  /*
   * assignment นี้ส่งคะแนนแล้วหรือยัง (ดู/แก้ไขไม่ได้ ต้องข้ามไปคนถัดไป)
   */
  const isSubmitted = detail?.assignment_status === "submitted";

  /*
   * รายการยังอยู่ในสถานะฉบับร่าง (DRAFT) — ยังไม่เปิดให้คะแนน
   */
  const isDraft = detail?.status === "DRAFT";

  /*
   * รายการเสร็จสิ้นแล้ว (CLOSED) — แสดงสรุปผลคะแนนจริง (อ่านอย่างเดียว)
   */
  const isClosed = detail?.status === "CLOSED";

  /*
   * ผลประมวลผลหลัง CLOSED:
   * รายการนี้มีผู้ประเมินหลายคน ระบบจึงรวมคะแนนของผู้ประเมินทุกคนที่ส่งแล้ว
   * (submitted) แล้วเฉลี่ย — ใช้ชุดข้อมูล evaluator_scores เดียวกับหน้าผู้ถูกประเมิน
   * เพื่อให้ตัวเลขที่ผู้ประเมินเห็นกับที่ผู้ถูกประเมินเห็นตรงกัน (สอดคล้องกัน)
   */
  const closedViewAnswers = useMemo<Record<number, number>>(() => {
    const result: Record<number, number> = {};
    if (!isClosed) return result;

    for (const question of detail?.questions ?? []) {
      const scores = question.evaluator_scores ?? [];
      if (scores.length === 0) continue;

      const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
      // ปัดเป็นวงกลมเหมือนหน้าผู้ถูกประเมิน (คะแนนจริงไม่ปัดแสดงในแถวเฉลี่ย)
      result[question.id] = Math.round(avg);
    }

    return result;
  }, [detail, isClosed]);

  /*
   * คะแนนเฉลี่ยรวมจริง (ไม่ปัด) — แสดงในแถว "คะแนนเฉลี่ย"
   */
  const closedAverage = useMemo<number | null>(() => {
    if (!isClosed) return null;

    const all: number[] = [];
    for (const question of detail?.questions ?? []) {
      for (const s of question.evaluator_scores ?? []) all.push(s.score);
    }

    return all.length > 0
      ? all.reduce((sum, s) => sum + s, 0) / all.length
      : null;
  }, [detail, isClosed]);

  /*
   * จำนวนผู้ประเมินที่ส่งคะแนนแล้ว (ไม่ซ้ำ) — ใช้แสดงในแถบสรุป
   */
  const submittedEvaluatorCount = useMemo(() => {
    const seen = new Set<number>();

    for (const question of detail?.questions ?? []) {
      for (const s of question.evaluator_scores ?? []) seen.add(s.evaluator_id);
    }

    return seen.size;
  }, [detail]);

  const submittedEvaluatorNames = useMemo(() => {
    const seen = new Map<number, string>();

    for (const question of detail?.questions ?? []) {
      for (const s of question.evaluator_scores ?? []) {
        if (!seen.has(s.evaluator_id)) {
          seen.set(s.evaluator_id, s.evaluator_name);
        }
      }
    }

    return [...seen.values()];
  }, [detail]);

  const shouldShowAttachments =
    templateConfig?.showAttachments === true;

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

  const hasUnsavedAnswers =
    (detail?.questions ?? []).some((question) => {
      const current = answers[question.id];
      const saved = question.selected_score;

      return current !== undefined && current !== saved;
    }) || comment.trim() !== (detail?.comment ?? "").trim();

  /*
   * เลือกคะแนน
   */
  const handleScoreChange = (questionId: number, score: number) => {
    if (
      !canEvaluatorScore ||
      submitting ||
      isDraft ||
      isClosed
    )
      return;

    setAnswers((previous) => ({
      ...previous,
      [questionId]: score,
    }));

    setSubmitError(null);
  };

  /*
   * ปิด Drawer
   */
  /*
   * เลื่อนคิว ก่อนหน้า/ถัดไป — ถ้ามีคะแนนที่ยังไม่ได้บันทึก ให้ยืนยันก่อน
   */
  const handleQueueMove = async (direction: "prev" | "next") => {
    if (submitting) return;

    const move = direction === "prev" ? onPrev : onNext;
    if (!move) return;

    if (hasUnsavedAnswers) {
      const confirmed = await confirm({
        type: "warning",
        title: "ยังมีคะแนนที่ยังไม่ได้บันทึก?",
        message:
          "คุณมีคะแนนที่ยังไม่ได้บันทึก หากไปยังรายการอื่น คะแนนที่กรอกไว้จะหายทั้งหมด",
        confirmText: "ไปต่อ",
        cancelText: "อยู่ต่อ",
      });

      if (!confirmed) return;
    }

    setAnswers({});
    setComment("");
    setSubmitError(null);

    move();
  };

  const handleRequestClose = async () => {
    if (submitting) return;

    if (hasUnsavedAnswers) {
      const confirmed = await confirm({
        type: "warning",
        title: "ยกเลิกการให้คะแนน?",
        message:
          "คุณมีคะแนนที่ยังไม่ได้บันทึก หากออกตอนนี้คะแนนที่กรอกไว้จะหายทั้งหมด",
        confirmText: "ออกโดยไม่บันทึก",
        cancelText: "กลับไปให้คะแนน",
      });

      if (!confirmed) return;
    }

    setAnswers({});
    setComment("");
    setSubmitError(null);

    onClose();
  };

  const handleSubmit = async () => {
    if (!detail || submitting) {
      return;
    }

    if (isDraft) {
      setSubmitError("รายการนิเทศยังอยู่ในสถานะฉบับร่าง (ยังไม่เปิดให้คะแนน)");
      return;
    }

    if (isClosed) {
      setSubmitError("การนิเทศนี้เสร็จสิ้นแล้ว (ไม่สามารถให้คะแนนได้)");
      return;
    }

    if (!canEvaluatorScore) {
      setSubmitError("แบบสอบถามต้องให้กลุ่มเป้าหมายเป็นผู้ตอบด้วยตนเอง");
      return;
    }

    if (totalQuestions === 0) {
      setSubmitError("ไม่พบคำถามสำหรับการนิเทศนี้");
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

    const confirmed = await confirm({
      type: "warning",
      title: "ยืนยันการบันทึกคะแนน?",
      message: "กรุณาตรวจสอบคะแนนให้เรียบร้อยก่อนบันทึกผลการนิเทศ",
      confirmText: "บันทึกคะแนน",
      cancelText: "ตรวจสอบอีกครั้ง",
    });

    if (!confirmed) return;

    const payload = {
      assignment_id: assignmentsId,
      answers: Object.entries(answers).map(([questionId, score]) => ({
        question_id: Number(questionId),
        score,
        answer_text: null,
      })),
      comment: comment.trim() || null,
    };

    try {
      setSubmitting(true);
      setSubmitError(null);

      await dispatch(submitEvaluationAnswers(payload)).unwrap();

      setAnswers({});
      setComment("");

      onSubmitted?.();

      onClose();
    } catch (error) {
      const message =
        typeof error === "string" ? error : "บันทึกคะแนนไม่สำเร็จ";

      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const inQueue =
    typeof queueIndex === "number" &&
    typeof queueTotal === "number" &&
    queueTotal > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-gray-100"
      style={{ animation: "score-panel-in 0.22s ease-out" }}
    >
      {/* ===================== Header ===================== */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 shadow-sm sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleRequestClose}
            disabled={submitting}
            aria-label="ปิด"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-base font-semibold text-gray-900">
                ให้คะแนน
              </h2>

              {detail && (
                <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-dark sm:inline-flex">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  {detail.template_name}
                </span>
              )}

              {isSubmitted && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  ให้คะแนนแล้ว
                </span>
              )}

              {isDraft && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  <Hourglass className="h-3.5 w-3.5" />
                  ฉบับร่าง
                </span>
              )}

              {isClosed && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-dark">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  เสร็จสิ้น
                </span>
              )}
            </div>

            <p className="truncate text-xs text-gray-500">
              ผู้รับการนิเทศ:{" "}
              <span className="font-medium text-gray-700">
                {targetName || detail?.target.name || "-"}
              </span>
              {detail && (
                <>
                  {" "}
                  · ภาคเรียนที่ {detail.round} ปีการศึกษา {detail.academic_year}
                </>
              )}
            </p>
          </div>
        </div>

        {/* ปุ่มเปิด/ปิดแผงไฟล์นำเสนอ */}
        {shouldShowAttachments && (
          <button
            type="button"
            onClick={() => setFilesVisible((v) => !v)}
            aria-expanded={filesVisible}
            aria-controls="evaluator-evidence-panel"
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
              filesVisible
                ? "border-primary/30 bg-primary/5 text-primary-dark"
                : "border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <PanelLeft className="h-4 w-4" />
            <span className="hidden sm:inline">
              {filesVisible ? "ย่อหลักฐาน" : "ขยายหลักฐาน"}
            </span>
            <span className="sm:hidden">
              {filesVisible ? "ซ่อนหลักฐาน" : "ดูหลักฐาน"}
            </span>
            {attachmentCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                {attachmentCount}
              </span>
            )}
          </button>
        )}

        {/* คิวให้คะแนน — ก่อนหน้า/ถัดไป */}
        {inQueue && (
          <div className="order-3 flex w-full shrink-0 items-center justify-between gap-1.5 border-t border-gray-100 pt-2 sm:order-none sm:w-auto sm:justify-start sm:border-0 sm:pt-0">
            <button
              type="button"
              onClick={() => handleQueueMove("prev")}
              disabled={submitting || (queueIndex ?? 0) <= 0}
              className="flex h-10 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              ก่อนหน้า
            </button>

            <span className="px-1 text-xs font-medium text-gray-500">
              {(queueIndex ?? 0) + 1} / {queueTotal}
            </span>

            <button
              type="button"
              onClick={() => handleQueueMove("next")}
              disabled={
                submitting || (queueIndex ?? 0) >= (queueTotal ?? 1) - 1
              }
              className="flex h-10 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ถัดไป
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      {/* ===================== Body ===================== */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* ซ้าย/ด้านบนบนมือถือ: หลักฐานจากผู้รับการประเมิน (อ่านอย่างเดียว) */}
        {shouldShowAttachments && filesVisible && (
          <aside
            id="evaluator-evidence-panel"
            className="flex h-[50dvh] min-h-[280px] shrink-0 flex-col border-b border-gray-200 bg-white md:h-auto md:min-h-0 md:w-[40%] md:min-w-[340px] md:max-w-[560px] md:border-b-0 md:border-r"
          >
            {detail ? (
              <EvaluatorAttachmentUpload
                key={`${detail.id}-${detail.target.id}`}
                instanceId={detail?.id ?? 0}
                targetId={detail?.target.id ?? 0}
                canUpload={!isDraft && !isClosed && currentUserId !== undefined}
                currentUserId={currentUserId}
                title="หลักฐานประกอบการประเมิน"
                description="ดูหลักฐานเดิม หรือเพิ่มภาพและไฟล์สำหรับผู้รับประเมินคนนี้"
                uploadLabel="เพิ่มหลักฐานสำหรับผู้รับประเมินคนนี้"
                fillAvailable
                previewMode="inline"
                onCountChange={setAttachmentCount}
                onCollapse={() => setFilesVisible(false)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                กำลังเตรียมรายการหลักฐาน...
              </div>
            )}
          </aside>
        )}

        {/* ขวา: แบบฟอร์มให้คะแนน */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-3 py-4 [-webkit-overflow-scrolling:touch] sm:p-5">
            {/* Loading */}
            {loading && (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                กำลังโหลดข้อมูล...
              </div>
            )}

            {/* Empty */}
            {!loading && !detail && (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                ไม่พบรายละเอียดการนิเทศ
              </div>
            )}

            {/* Content */}
            {!loading && detail && (
              <>
                {isDraft && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                    <Hourglass className="h-4 w-4 shrink-0" />
                    <span>
                      ตัวอย่าง (ฉบับร่าง) — ยังไม่เปิดให้คะแนน
                      กรุณารอให้เปิดการนิเทศก่อน
                    </span>
                  </div>
                )}

                {isClosed && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      สรุปผลการนิเทศ — คำนวณจากผู้นิเทศที่ส่งแล้ว{" "}
                      <span className="font-semibold">
                        {submittedEvaluatorCount} คน
                      </span>{" "}
                      (อ่านอย่างเดียว)
                      {submittedEvaluatorCount > 0 &&
                        submittedEvaluatorNames.length > 0 && (
                          <span className="text-emerald-600/80">
                            {" "}
                            · {submittedEvaluatorNames.join(", ")}
                          </span>
                        )}
                      {!isSubmitted && submittedEvaluatorCount === 0 && (
                        <span className="font-medium">
                          {" "}
                          · รายการนี้ยังไม่ได้ส่งคะแนน
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {isClosed &&
                  submittedEvaluatorCount >= 2 &&
                  canEvaluatorScore && (
                    <div className="mb-4 flex w-fit items-center rounded-lg bg-gray-100 p-1 text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => setClosedViewMode("average")}
                        className={`rounded-md px-3 py-1.5 transition-colors ${
                          closedViewMode === "average"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        ภาพรวม (เฉลี่ย)
                      </button>
                      <button
                        type="button"
                        onClick={() => setClosedViewMode("compare")}
                        className={`rounded-md px-3 py-1.5 transition-colors ${
                          closedViewMode === "compare"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        เปรียบเทียบรายคน
                      </button>
                    </div>
                  )}

                {canEvaluatorScore && isClosed &&
                closedViewMode === "compare" ? (
                  <EvaluatorScoreCompareTable
                    questions={detail.questions}
                    evaluatorRoster={detail.evaluators}
                  />
                ) : canEvaluatorScore ? (
                  <>
                    <EavaluationSectionForm
                      detail={detail}
                      mode={isDraft || isClosed ? "view" : "evaluate"}
                      canEditFields={false}
                      canUpload={false}
                      loading={false}
                      showHeader={false}
                      showAttachments={false}
                      answers={isClosed ? closedViewAnswers : answers}
                      averageOverride={isClosed ? closedAverage : undefined}
                      comment={isClosed ? detail.comment ?? "" : comment}
                      onCommentChange={setComment}
                      onAnswerChange={handleScoreChange}
                    />

                  </>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <h3 className="font-semibold text-amber-800">
                      แบบสอบถาม
                    </h3>

                    <p className="mt-1 text-sm text-amber-700">
                      แบบสอบถามต้องให้กลุ่มเป้าหมายเป็นผู้ตอบด้วยตนเอง
                      ผู้ประเมินไม่สามารถตอบแทนได้
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ===================== Footer ===================== */}
          {!loading &&
            detail &&
            canEvaluatorScore &&
            !isDraft &&
            !isClosed && (
            <footer className="flex shrink-0 flex-col gap-2 border-t border-gray-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-3">
              <div className="min-w-0 text-xs">
                {totalQuestions > 0 && (
                  <p
                    className={
                      isComplete ? "text-primary-dark" : "text-amber-600"
                    }
                  >
                    ให้คะแนนแล้ว{" "}
                    <span className="font-semibold">{answeredCount}</span>/
                    {totalQuestions} ข้อ
                    {!isComplete && (
                      <span className="text-gray-500">
                        {" "}
                        · เหลืออีก {unansweredCount} ข้อ
                      </span>
                    )}
                  </p>
                )}

                {hasUnsavedAnswers && (
                  <p className="mt-0.5 text-amber-600">
                    มีคะแนนที่ยังไม่ได้บันทึก
                  </p>
                )}

                {isSubmitted && (
                  <p className="mt-0.5 text-emerald-600">
                    รายการนี้ให้คะแนนแล้ว — ยังแก้ไขได้จนกว่าจะปิดการประเมิน
                  </p>
                )}

                {submitError && (
                  <p className="mt-0.5 text-rose-500">{submitError}</p>
                )}
              </div>

              <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:gap-3">
                <button
                  type="button"
                  onClick={handleRequestClose}
                  disabled={submitting}
                  className="h-11 flex-1 rounded-lg px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:flex-none"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || (isSubmitted && !hasUnsavedAnswers)}
                  className="h-11 flex-[2] rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:flex-none"
                >
                  {submitting
                    ? "กำลังบันทึก..."
                    : isSubmitted
                      ? "บันทึกการแก้ไข"
                      : "บันทึกคะแนน"}
                </button>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
