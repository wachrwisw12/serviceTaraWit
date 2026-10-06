import { Fragment, useMemo } from "react";
import type { InstanceQuestion } from "../../types/EvaluationSectionForm_type";
import { useScoreLevels } from "../../../setting/hooks/useScoreLevels";

interface EvaluationQuestionTableProps {
  questions: InstanceQuestion[];

  mode: "view" | "evaluate";

  answers: Record<number, number>;

  /** คะแนนเฉลี่ยจริงที่จะแสดง (กรณี answers ถูกปัดเป็นวงกลมแล้ว) */
  averageOverride?: number | null;

  comment?: string;

  onCommentChange?: (comment: string) => void;

  onChange?: (questionId: number, score: number) => void;

}

interface QuestionGroup {
  key: string;
  name: string | null; // null => no section header (ungrouped block)
  sortOrder: number;
  questions: InstanceQuestion[];
}

export default function EvaluationQuestionTable({
  questions,
  mode,
  answers,
  averageOverride,
  comment = "",
  onCommentChange,
  onChange,
}: EvaluationQuestionTableProps) {
  const canScore = mode === "evaluate";
  const levels = useScoreLevels();
  const SCORES = levels.map((l) => l.score); // [5, 4, 3, 2, 1]
  const colorFor = (score: number) =>
    levels.find((l) => l.score === score)?.color ?? "#9ca3af";
  const textColorFor = (score: number) =>
    levels.find((l) => l.score === score)?.textColor ?? "#ffffff";
  const scores = useMemo(() => Object.values(answers), [answers]);
  const scoreCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const score of scores) counts.set(score, (counts.get(score) ?? 0) + 1);
    return counts;
  }, [scores]);
  const highestLevelCount = Math.max(1, ...levels.map((level) => scoreCounts.get(level.score) ?? 0));
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const maxPossibleScore = questions.reduce(
    (sum, question) => sum + (question.max_score ?? 0),
    0,
  );
  const averageScore =
    averageOverride !== undefined && averageOverride !== null
      ? averageOverride
      : scores.length > 0
        ? totalScore / scores.length
        : null;
  const averageColor =
    averageScore !== null ? colorFor(Math.round(averageScore)) : "#9ca3af";
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

  // Section numbering only counts named groups and is shared by both the
  // mobile cards and desktop table without relying on render-time mutation.
  const sectionNumberByKey = useMemo(() => {
    const numbers = new Map<string, number>();
    let nextNumber = 1;
    for (const group of groups) {
      if (group.name !== null) numbers.set(group.key, nextNumber++);
    }
    return numbers;
  }, [groups]);

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
                  <span className="font-semibold text-primary">
                    {answeredCount}
                  </span>{" "}
                  จาก <span className="font-semibold">{totalQuestions}</span>{" "}
                  ข้อ
                </p>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  remainingCount === 0
                    ? "bg-primary/10 text-primary-dark"
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
                className="h-full rounded-full bg-primary transition-all duration-300"
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

        <div className="space-y-3 bg-gray-50/60 p-3 md:hidden">
          {groups.map((group) => {
            const sortedQuestions = [...group.questions].sort(
              (a, b) => a.sort_order - b.sort_order,
            );
            const mobileSectionNumber = sectionNumberByKey.get(group.key) ?? null;

            return (
              <section key={`mobile-${group.key}`} className="space-y-2.5">
                {group.name !== null && (
                  <h4 className="px-1 pt-1 text-sm font-semibold text-gray-700">
                    {mobileSectionNumber}. {group.name}
                  </h4>
                )}

                {sortedQuestions.map((q, questionIndex) => {
                  const sortedChoices = [...q.choices].sort(
                    (a, b) => a.sort_order - b.sort_order,
                  );
                  const label =
                    mobileSectionNumber !== null
                      ? `${mobileSectionNumber}.${questionIndex + 1}`
                      : `${questionIndex + 1}`;

                  return (
                    <article
                      key={`mobile-${q.id}`}
                      className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-semibold text-gray-500">
                          {label}
                        </span>
                        <p className="text-sm leading-6 text-gray-800">
                          {q.question_text}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {SCORES.map((score) => {
                          const hasChoice = sortedChoices.some(
                            (choice) => choice.score === score,
                          );
                          const checked = answers[q.id] === score;
                          const color = colorFor(score);

                          return (
                            <button
                              key={score}
                              type="button"
                              aria-label={`ข้อ ${label} ให้คะแนนระดับ ${score}`}
                              aria-pressed={checked}
                              disabled={!hasChoice || !canScore}
                              onClick={() => onChange?.(q.id, score)}
                              className={`flex h-12 min-w-0 items-center justify-center rounded-xl border-2 text-base font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-30 ${
                                checked
                                  ? "scale-[1.03] shadow-sm"
                                  : "border-gray-200 bg-white text-gray-500"
                              }`}
                              style={
                                checked
                                  ? {
                                      backgroundColor: color,
                                      borderColor: color,
                                      color: textColorFor(score),
                                    }
                                  : undefined
                              }
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-sm">
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
                  className="w-14 border-r border-gray-100 px-2 py-2"
                >
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full font-semibold text-white"
                    style={{ backgroundColor: colorFor(score) }}
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

              const sectionNumber = sectionNumberByKey.get(group.key) ?? null;

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
                          const color = colorFor(score);

                          return (
                            <td
                              key={score}
                              className="border-r border-gray-50 px-2 py-3 text-center"
                            >
                              {!hasChoice ? null : canScore ? (
                                <button
                                  type="button"
                                  aria-label={`ให้คะแนนระดับ ${score}`}
                                  aria-pressed={checked}
                                  onClick={() => onChange?.(q.id, score)}
                                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                                    checked
                                      ? "scale-105 shadow-sm"
                                      : "border-gray-300 bg-white text-gray-500 hover:border-primary hover:text-primary"
                                  }`}
                                  style={
                                    checked
                                      ? {
                                          backgroundColor: color,
                                          borderColor: color,
                                          color: textColorFor(score),
                                        }
                                      : undefined
                                  }
                                >
                                  {score}
                                </button>
                              ) : (
                                <span
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold"
                                  style={
                                    checked
                                      ? {
                                          backgroundColor: color,
                                          borderColor: color,
                                          color: textColorFor(score),
                                        }
                                      : {
                                          borderColor: "#d1d5db",
                                          backgroundColor: "transparent",
                                          color: "#9ca3af",
                                        }
                                  }
                                >
                                  {score}
                                </span>
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
                const count = scoreCounts.get(score) ?? 0;
                const color = colorFor(score);
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
        </div>

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

      {/* รวมคำอธิบายระดับและจำนวนข้อไว้ด้วยกัน เพื่อลดการอ่านข้อมูลซ้ำ */}
      <section className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">
            ระดับคุณภาพและสรุปคะแนน
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            จำนวนข้อที่ได้รับคะแนนในแต่ละระดับ
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {levels.map((level) => {
            const count = scoreCounts.get(level.score) ?? 0;
            const shortLabel = level.label
              .replace("มีคุณภาพ มีความชัดเจน มีความเหมาะสม ", "")
              .trim();

            return (
              <div
                key={level.score}
                className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 sm:grid-cols-[2rem_minmax(10rem,1.2fr)_minmax(8rem,1fr)_auto]"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: level.color,
                    color: level.textColor,
                  }}
                >
                  {level.score}
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-800">
                    {shortLabel}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-gray-400" title={level.label}>
                    {level.label}
                  </span>
                </span>

                <span className="col-span-2 mt-2 h-2 overflow-hidden rounded-full bg-gray-100 sm:col-span-1 sm:mt-0">
                  <span
                    className="block h-full min-w-0 rounded-full transition-[width] duration-300"
                    style={{
                      width: `${(count / highestLevelCount) * 100}%`,
                      backgroundColor: level.color,
                    }}
                  />
                </span>

                <span className="row-start-1 whitespace-nowrap text-sm font-semibold text-gray-800 sm:row-auto">
                  {count} ข้อ
                </span>
              </div>
            );
          })}
        </div>

        {/* คะแนนรวมทั้งหมด */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary/15 bg-primary/10 px-4 py-3">
          <span className="text-sm font-medium text-primary-dark">
            คะแนนรวมทั้งหมด
          </span>

          <span className="text-base font-bold text-primary-dark">
            {totalScore}{" "}
            <span className="text-xs font-normal">
              จาก {maxPossibleScore} คะแนน
              {maxPossibleScore > 0
                ? ` (${Math.round((totalScore / maxPossibleScore) * 100)}%)`
                : ""}
            </span>
          </span>
        </div>
      </section>

      <div className="mt-6">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <label htmlFor="evaluation-comment" className="text-sm font-medium text-gray-700">
              ข้อเสนอแนะเพิ่มเติม
            </label>
            <p className="mt-0.5 text-xs text-gray-400">
              ระบุจุดเด่น สิ่งที่ควรพัฒนา หรือแนวทางปรับปรุง
            </p>
          </div>
          {onCommentChange && (
            <span className="shrink-0 text-[11px] text-gray-400">
              {comment.length}/2,000
            </span>
          )}
        </div>

        {onCommentChange ? (
          <textarea
            id="evaluation-comment"
            value={comment}
            maxLength={2000}
            rows={4}
            onChange={(event) => onCommentChange(event.target.value)}
            placeholder="เขียนข้อเสนอแนะสำหรับผู้รับการประเมิน..."
            className="min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-base leading-6 text-gray-800 outline-none transition-colors placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm"
          />
        ) : (
          <div className="min-h-12 whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-600">
            {comment.trim() || "ไม่มีข้อเสนอแนะเพิ่มเติม"}
          </div>
        )}
      </div>
    </>
  );
}
