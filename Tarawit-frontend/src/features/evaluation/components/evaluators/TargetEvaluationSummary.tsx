import { useMemo } from "react";
import { BarChart3, CheckCircle2, UsersRound } from "lucide-react";

import type { InstanceQuestion } from "../../types/EvaluationSectionForm_type";

interface TargetEvaluationSummaryProps {
  questions: InstanceQuestion[];
}

const formatScore = (value: number | null) =>
  value === null ? "—" : value.toFixed(2);

export default function TargetEvaluationSummary({
  questions,
}: TargetEvaluationSummaryProps) {
  const summary = useMemo(() => {
    const evaluatorMap = new Map<
      number,
      { id: number; name: string; scores: number[] }
    >();
    const sectionMap = new Map<
      string,
      { name: string; sortOrder: number; scores: number[] }
    >();
    const allScores: number[] = [];

    for (const question of questions) {
      const sectionKey = String(question.section_id ?? "ungrouped");
      const section = sectionMap.get(sectionKey) ?? {
        name: question.category?.trim() || "ภาพรวมทั่วไป",
        sortOrder: question.category_sort_order ?? -1,
        scores: [],
      };

      for (const score of question.evaluator_scores ?? []) {
        allScores.push(score.score);
        section.scores.push(score.score);

        const evaluator = evaluatorMap.get(score.evaluator_id) ?? {
          id: score.evaluator_id,
          name: score.evaluator_name,
          scores: [],
        };
        evaluator.scores.push(score.score);
        evaluatorMap.set(score.evaluator_id, evaluator);
      }

      sectionMap.set(sectionKey, section);
    }

    const average = (scores: number[]) =>
      scores.length > 0
        ? scores.reduce((total, score) => total + score, 0) / scores.length
        : null;

    return {
      overallAverage: average(allScores),
      evaluatorCount: evaluatorMap.size,
      answeredQuestionCount: questions.filter(
        (question) => (question.evaluator_scores?.length ?? 0) > 0,
      ).length,
      sections: [...sectionMap.values()]
        .filter((section) => section.scores.length > 0)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => ({
          name: section.name,
          average: average(section.scores),
        })),
      evaluators: [...evaluatorMap.values()].map((evaluator) => ({
        id: evaluator.id,
        name: evaluator.name,
        average: average(evaluator.scores),
      })),
    };
  }, [questions]);

  if (summary.evaluatorCount === 0) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-gray-700">
          ยังไม่มีผลการประเมินที่ส่งแล้ว
        </p>
        <p className="mt-1 text-xs text-gray-500">
          ผลสรุปจะแสดงเมื่อผู้ประเมินส่งคะแนนเรียบร้อย
        </p>
      </div>
    );
  }

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.03]">
      <div className="border-b border-primary/10 px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark">
          ผลการประเมินของฉัน
        </p>
        <h2 className="mt-1 text-lg font-bold text-gray-900">
          สรุปผลหลังปิดรอบการประเมิน
        </h2>
      </div>

      <div className="grid gap-px bg-primary/10 sm:grid-cols-3">
        <div className="bg-white px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <BarChart3 size={16} className="text-primary" />
            คะแนนเฉลี่ยรวม
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
            {formatScore(summary.overallAverage)}
          </p>
          <p className="mt-1 text-xs text-gray-500">จากคะแนนทุกข้อที่ส่งแล้ว</p>
        </div>

        <div className="bg-white px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <UsersRound size={16} className="text-primary" />
            ผู้ประเมินที่ส่งผล
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
            {summary.evaluatorCount}
            <span className="ml-1 text-sm font-medium text-gray-500">คน</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">แสดงผลเฉพาะคะแนนที่ส่งแล้ว</p>
        </div>

        <div className="bg-white px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <CheckCircle2 size={16} className="text-primary" />
            หัวข้อที่มีผล
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
            {summary.answeredQuestionCount}
            <span className="ml-1 text-sm font-medium text-gray-500">
              / {questions.length} ข้อ
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-500">ความครบถ้วนของผลที่ได้รับ</p>
        </div>
      </div>

      <div className="grid gap-6 bg-white px-5 py-5 sm:grid-cols-2 sm:px-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            ค่าเฉลี่ยรายหัวข้อ
          </h3>
          <div className="mt-3 space-y-2">
            {summary.sections.map((section) => (
              <div
                key={section.name}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
              >
                <span className="min-w-0 pr-3 text-sm text-gray-600">
                  {section.name}
                </span>
                <span className="shrink-0 font-bold tabular-nums text-gray-900">
                  {formatScore(section.average)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            ค่าเฉลี่ยรายผู้ประเมิน
          </h3>
          <div className="mt-3 space-y-2">
            {summary.evaluators.map((evaluator) => (
              <div
                key={evaluator.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
              >
                <span className="min-w-0 truncate pr-3 text-sm text-gray-600">
                  {evaluator.name}
                </span>
                <span className="shrink-0 font-bold tabular-nums text-gray-900">
                  {formatScore(evaluator.average)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
