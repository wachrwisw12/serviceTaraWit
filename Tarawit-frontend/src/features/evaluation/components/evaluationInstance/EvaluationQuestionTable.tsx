import { Fragment, useMemo } from "react";
import type { InstanceQuestion } from "../../types/EvaluationSectionForm_type";
import { SCORE_LEVELS, colorForScore } from "../../../../utils/Scorescale";

interface EvaluationQuestionTableProps {
  questions: InstanceQuestion[];

  mode: "view" | "evaluate";

  answers: Record<number, number>;

  onChange?: (questionId: number, score: number) => void;
}

interface QuestionGroup {
  key: string;
  name: string | null; // null => no section header (ungrouped block)
  sortOrder: number;
  questions: InstanceQuestion[];
}

const SCORES = SCORE_LEVELS.map((s) => s.score); // [5, 4, 3, 2, 1]

export default function EvaluationQuestionTable({
  questions,
  mode,
  answers,
  onChange,
}: EvaluationQuestionTableProps) {
  const canScore = mode === "evaluate";
  // console.log("EvaluationQuestionTable canScore", canScore);
  const scores = Object.values(answers);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const averageScore = scores.length > 0 ? totalScore / scores.length : null;
  const averageColor =
    averageScore !== null ? colorForScore(Math.round(averageScore)) : "#9ca3af";
  const totalQuestions = questions.length;

  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined,
  ).length;

  const remainingCount = totalQuestions - answeredCount;

  const progress =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  // Group questions by section_id. Questions with a null section_id/category
  // (forms that don't use sections at all) are collected into a single
  // headerless group and rendered first, exactly like the old flat table.
  const groups = useMemo<QuestionGroup[]>(() => {
    const bySection = new Map<number, QuestionGroup>();
    const ungrouped: InstanceQuestion[] = [];

    for (const q of questions) {
      if (q.section_id === null || q.category === null) {
        ungrouped.push(q);
        continue;
      }

      const existing = bySection.get(q.section_id);
      if (existing) {
        existing.questions.push(q);
      } else {
        bySection.set(q.section_id, {
          key: `section-${q.section_id}`,
          name: q.category,
          sortOrder: q.category_sort_order ?? 0,
          questions: [q],
        });
      }
    }

    const sectionGroups = [...bySection.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    if (ungrouped.length === 0) return sectionGroups;

    return [
      {
        key: "ungrouped",
        name: null,
        sortOrder: -1,
        questions: ungrouped,
      },
      ...sectionGroups,
    ];
  }, [questions]);

  // Section numbering (1, 2, 3...) only counts groups that actually have a
  // name/header; the ungrouped block never gets a number prefix.
  let sectionCounter = 0;

  return (
    <>
      <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
        {canScore && (
          <div className="border-b border-gray-200 bg-white px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  ความคืบหน้าการประเมิน
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  ให้คะแนนแล้ว{" "}
                  <span className="font-semibold text-[#2fae60]">
                    {answeredCount}
                  </span>{" "}
                  จาก <span className="font-semibold">{totalQuestions}</span>{" "}
                  ข้อ
                </p>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  remainingCount === 0
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {remainingCount === 0
                  ? "✓ ให้คะแนนครบแล้ว"
                  : `เหลือ ${remainingCount} ข้อ`}
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#2fae60] transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{progress}%</span>
              <span>
                {answeredCount}/{totalQuestions}
              </span>
            </div>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-center text-xs text-gray-500">
              <th
                rowSpan={2}
                className="w-12 border-r border-gray-100 px-3 py-2 text-left font-medium"
              >
                #
              </th>

              <th
                rowSpan={2}
                className="border-r border-gray-100 px-3 py-2 text-left font-medium"
              >
                รายการ
              </th>

              <th
                colSpan={5}
                className="border-r border-gray-100 px-3 py-2 font-medium"
              >
                ระดับคุณภาพ
              </th>
            </tr>

            <tr className="border-b border-gray-100 bg-gray-50/60 text-center text-xs">
              {SCORES.map((score) => (
                <th
                  key={score}
                  className="w-10 border-r border-gray-100 px-2 py-2"
                >
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full font-semibold text-white"
                    style={{ backgroundColor: colorForScore(score) }}
                  >
                    {score}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => {
              const sortedQuestions = [...group.questions].sort(
                (a, b) => a.sort_order - b.sort_order,
              );

              const sectionNumber =
                group.name !== null ? ++sectionCounter : null;

              return (
                <Fragment key={group.key}>
                  {group.name !== null && (
                    <tr key={`${group.key}-header`} className="bg-gray-50/60">
                      <td
                        colSpan={7}
                        className="border-b border-gray-100 px-3 py-2 text-left text-sm font-semibold text-gray-700"
                      >
                        {sectionNumber}. {group.name}
                      </td>
                    </tr>
                  )}

                  {sortedQuestions.map((q, questionIndex) => {
                    const sortedChoices = [...q.choices].sort(
                      (a, b) => a.sort_order - b.sort_order,
                    );

                    const label =
                      sectionNumber !== null
                        ? `${sectionNumber}.${questionIndex + 1}`
                        : `${questionIndex + 1}`;

                    return (
                      <tr
                        key={q.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="border-r border-gray-50 px-3 py-3 align-top text-gray-400">
                          {label}
                        </td>

                        <td className="border-r border-gray-50 px-3 py-3 text-gray-700">
                          {q.question_text}
                        </td>

                        {SCORES.map((score) => {
                          const hasChoice = sortedChoices.some(
                            (choice) => choice.score === score,
                          );

                          const checked = answers[q.id] === score;
                          const color = colorForScore(score);

                          return (
                            <td
                              key={score}
                              className="border-r border-gray-50 px-2 py-3 text-center"
                            >
                              {!hasChoice ? null : canScore ? (
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  checked={checked}
                                  onChange={() => onChange?.(q.id, score)}
                                  className="h-4 w-4 cursor-pointer"
                                  style={{ accentColor: color }}
                                />
                              ) : (
                                <div
                                  className="mx-auto h-4 w-4 rounded-full border transition-colors"
                                  style={{
                                    borderColor: checked ? color : "#d1d5db",
                                    backgroundColor: checked
                                      ? color
                                      : "transparent",
                                  }}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}

            <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
              <td
                colSpan={2}
                className="border-r border-gray-100 px-3 py-3 text-center text-gray-600"
              >
                รวม
              </td>

              {SCORES.map((score) => {
                const count = scores.filter((s) => s === score).length;
                const color = colorForScore(score);
                return (
                  <td
                    key={score}
                    className="border-r border-gray-100 px-2 py-3 text-center"
                  >
                    {count > 0 ? (
                      <span
                        className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {count}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        <div className="flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
          <span>คะแนนเฉลี่ย</span>
          <span
            className="inline-flex min-w-10 items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold text-white"
            style={{ backgroundColor: averageColor }}
          >
            {averageScore !== null ? averageScore.toFixed(2) : "-"}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-gray-700">
          ข้อเสนอแนะด้านสื่อการสอน
        </p>
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 px-4 py-3 text-sm text-gray-500" />
      </div>
    </>
  );
}
