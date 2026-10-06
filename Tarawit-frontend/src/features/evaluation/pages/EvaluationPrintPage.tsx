import { useEffect, useMemo } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  clearMyInstanceDetail,
  fetchMyInstanceDetail,
} from "../api/MyInstanceSlice";
import { printEvaluationReport } from "../helper/printWithFonts";
import { compareSignatureOrder } from "../helper/signatureOrder";
import type { InstanceQuestion } from "../types/EvaluationSectionForm_type";

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getQuestionScore(question: InstanceQuestion): number | null {
  const scores = question.evaluator_scores ?? [];
  if (scores.length > 0) {
    return scores.reduce((sum, item) => sum + item.score, 0) / scores.length;
  }
  return question.selected_score ?? null;
}

function scoreLabel(score: number | null): string {
  if (score === null) return "-";
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

export default function EvaluationPrintPage() {
  const { id } = useParams<{ id: string }>();
  const instanceId = Number(id);
  const [searchParams] = useSearchParams();
  const requestedTargetId = Number(searchParams.get("target_id"));
  const targetId = Number.isFinite(requestedTargetId) && requestedTargetId > 0
    ? requestedTargetId
    : undefined;
  const dispatch = useAppDispatch();
  const { detail, detailLoading, detailError } = useAppSelector(
    (state) => state.myInstance,
  );

  useEffect(() => {
    if (Number.isFinite(instanceId)) {
      dispatch(fetchMyInstanceDetail({ instanceId, targetId }));
    }
    return () => {
      dispatch(clearMyInstanceDetail());
    };
  }, [dispatch, instanceId, targetId]);

  const report = useMemo(() => {
    if (!detail) return null;

    const questions = detail.questions ?? [];
    const scoreValues = new Set<number>();
    for (const question of questions) {
      for (const choice of question.choices ?? []) scoreValues.add(choice.score);
    }
    if (scoreValues.size === 0) {
      for (let score = 5; score >= 1; score -= 1) scoreValues.add(score);
    }

    const levels = [...scoreValues].sort((a, b) => b - a);
    const scored = questions
      .map(getQuestionScore)
      .filter((score): score is number => score !== null);
    const total = scored.reduce((sum, score) => sum + score, 0);
    const average = scored.length > 0 ? total / scored.length : null;

    return { questions, levels, total, average, scoredCount: scored.length };
  }, [detail]);

  if (detailLoading) {
    return <div className="p-10 text-center text-sm text-gray-500">กำลังจัดทำรายงาน...</div>;
  }
  if (detailError || !detail || !report) {
    return (
      <div className="p-10 text-center text-sm text-red-600">
        {detailError ?? "ไม่พบข้อมูลสำหรับจัดทำรายงาน"}
      </div>
    );
  }

  const evaluators = [...detail.evaluators]
    .filter((item) => item.name_snapshort && item.requires_signature !== false)
    .sort(compareSignatureOrder);

  return (
    <div className="evaluation-print-shell min-h-screen bg-slate-100 px-4 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Link
          to={`/my/evaluation-results-detail/${detail.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> กลับไปผลการประเมิน
        </Link>
        <button
          type="button"
          onClick={printEvaluationReport}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          <Printer className="h-4 w-4" /> พิมพ์ / บันทึกเป็น PDF
        </button>
      </div>

      <article className="evaluation-print-page mx-auto bg-white text-black shadow-sm">
        <header className="text-center">
          <h1 className="text-xl font-bold">{detail.template_name}</h1>
          {detail.instance_name ? <p className="mt-1 text-sm">{detail.instance_name}</p> : null}
          <p className="mt-1 text-sm">
            ปีการศึกษา {detail.academic_year} · รอบ {detail.round}
          </p>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <p><strong>ผู้รับการประเมิน:</strong> {detail.target.name}</p>
          <p><strong>ตำแหน่ง:</strong> {detail.target.position || "-"}</p>
          <p><strong>วันที่เริ่ม:</strong> {formatDate(detail.start_date)}</p>
          <p><strong>วันที่สิ้นสุด:</strong> {formatDate(detail.end_date)}</p>
          <div className="col-span-2 flex items-start gap-2">
            <strong className="shrink-0">ผู้ประเมิน:</strong>
            {evaluators.length > 0 ? (
              <ol className="space-y-1">
                {evaluators.map((evaluator, index) => (
                  <li key={evaluator.user_id}>
                    {index + 1}. {evaluator.name_snapshort}
                    {evaluator.position_snapshort
                      ? ` — ${evaluator.position_snapshort}`
                      : ""}
                  </li>
                ))}
              </ol>
            ) : (
              <span>-</span>
            )}
          </div>
          {detail.fields.map((field) => (
            <p key={field.id} className={field.value && field.value.length > 50 ? "col-span-2" : ""}>
              <strong>{field.label}:</strong> {field.value || "-"}
            </p>
          ))}
        </section>

        <table className="evaluation-print-table mt-5 w-full border-collapse text-xs">
          <thead>
            <tr>
              <th rowSpan={2} className="w-10">ข้อ</th>
              <th rowSpan={2}>รายการประเมิน</th>
              <th colSpan={report.levels.length}>ระดับคุณภาพ</th>
              <th rowSpan={2} className="w-16">คะแนน<br />เฉลี่ย</th>
            </tr>
            <tr>
              {report.levels.map((level) => <th key={level} className="w-8">{level}</th>)}
            </tr>
          </thead>
          <tbody>
            {detail.sections.map((section, sectionIndex) => {
              const startIndex = detail.sections
                .slice(0, sectionIndex)
                .reduce((sum, item) => sum + item.questions.length, 0);
              return (
                <SectionRows
                  key={section.id}
                  name={section.name}
                  questions={section.questions}
                  levels={report.levels}
                  startIndex={startIndex}
                />
              );
            })}
            {detail.sections.length === 0 ? (
              <SectionRows
                name="รายการประเมิน"
                questions={report.questions}
                levels={report.levels}
                startIndex={0}
              />
            ) : null}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={2 + report.levels.length} className="text-right">รวมคะแนน</th>
              <th>{scoreLabel(report.scoredCount > 0 ? report.total : null)}</th>
            </tr>
            <tr>
              <th colSpan={2 + report.levels.length} className="text-right">คะแนนเฉลี่ย</th>
              <th>{scoreLabel(report.average)}</th>
            </tr>
          </tfoot>
        </table>

        <section className="mt-5 text-sm">
          <h2 className="font-bold">ข้อเสนอแนะ</h2>
          <div className="mt-2 min-h-20 whitespace-pre-wrap border-b border-dotted border-gray-500 pb-2">
            {detail.comment || "-"}
          </div>
        </section>

        <section className="mt-10 space-y-9 text-sm">
          <h2 className="font-bold">ลายมือชื่อ</h2>
          <div className="avoid-break ml-auto w-80 text-center">
            <p className="mb-5 text-left font-medium">ผู้รับการประเมิน</p>
            <p>ลงชื่อ ........................................................</p>
            <p className="mt-2">({detail.target.name})</p>
            {detail.target.position ? (
              <p className="mt-1">ตำแหน่ง {detail.target.position}</p>
            ) : null}
          </div>
          {(evaluators.length > 0 ? evaluators : [null]).map((evaluator, index) => (
            <div
              key={evaluator?.user_id ?? `empty-${index}`}
              className="avoid-break ml-auto w-80 text-center"
            >
              <p className="mb-5 text-left font-medium">
                {evaluator?.signature_role || `ผู้ประเมินคนที่ ${index + 1}`}
              </p>
              <p>ลงชื่อ ........................................................</p>
              <p className="mt-2">
                ({evaluator?.name_snapshort || "........................................................"})
              </p>
              {evaluator?.position_snapshort ? (
                <p className="mt-1">ตำแหน่ง {evaluator.position_snapshort}</p>
              ) : null}
            </div>
          ))}
        </section>
      </article>
    </div>
  );
}

function SectionRows({
  name,
  questions,
  levels,
  startIndex,
}: {
  name: string;
  questions: InstanceQuestion[];
  levels: number[];
  startIndex: number;
}) {
  return (
    <>
      <tr className="evaluation-print-section">
        <th colSpan={3 + levels.length} className="text-left">{name}</th>
      </tr>
      {questions.map((question, index) => {
        const score = getQuestionScore(question);
        return (
          <tr key={question.id}>
            <td className="text-center">{startIndex + index + 1}</td>
            <td>{question.question_text}</td>
            {levels.map((level) => (
              <td key={level} className="text-center">
                {score !== null && Math.round(score) === level ? "✓" : ""}
              </td>
            ))}
            <td className="text-center">{scoreLabel(score)}</td>
          </tr>
        );
      })}
    </>
  );
}
