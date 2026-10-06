import { useMemo } from "react";

import type {
  EvaluationEvaluator,
  InstanceQuestion,
} from "../../types/EvaluationSectionForm_type";

/**
 * ตารางคะแนนรายผู้ประเมิน — สำหรับสรุปผลหลัง CLOSED
 * - แต่ละคอลัมน์ = ผู้ประเมินหนึ่งคน (เฉพาะคนที่ส่งคะแนนแล้ว)
 * - เซลล์ที่ต่างจากค่าเฉลี่ยรายข้อจะไฮไลต์สีอำพันพร้อมตัวเลข ±
 * - แถวล่างสุดสรุปรายคน: คะแนนเฉลี่ย + รวม + ความต่างจากค่าเฉลี่ยรวม
 */
export default function EvaluatorScoreCompareTable({
  questions,
  evaluatorRoster,
}: {
  questions: InstanceQuestion[];
  evaluatorRoster?: EvaluationEvaluator[];
}) {
  const evaluators = useMemo(() => {
    const map = new Map<number, string>();

    for (const evaluator of evaluatorRoster ?? []) {
      if (evaluator.can_score !== false) {
        map.set(evaluator.user_id, evaluator.name_snapshort);
      }
    }

    for (const q of questions) {
      for (const s of q.evaluator_scores ?? []) {
        if (!map.has(s.evaluator_id)) {
          map.set(s.evaluator_id, s.evaluator_name);
        }
      }
    }

    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [questions, evaluatorRoster]);

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.sort_order - b.sort_order),
    [questions],
  );

  /* สถิติรายข้อ: ค่าเฉลี่ย (ไม่ปัด) + ค่าเฉลี่ยปัด (ใช้อ้างอิงไฮไลต์) */
  const questionStats = sortedQuestions.map((question) => {
    const scores = (question.evaluator_scores ?? []).map((s) => s.score);
    const avg =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : null;

    return {
      question,
      avg,
      roundedAvg: avg !== null ? Math.round(avg) : null,
    };
  });

  /* สถิติรายผู้ประเมิน: เฉลี่ย + รวม + ความต่างจากค่าเฉลี่ยรวม */
  const evaluatorStats = evaluators.map((ev) => {
    const scores: number[] = [];

    for (const q of sortedQuestions) {
      const hit = (q.evaluator_scores ?? []).find(
        (s) => s.evaluator_id === ev.id,
      );
      if (hit) scores.push(hit.score);
    }

    return {
      ...ev,
      avg:
        scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : null,
      total: scores.reduce((sum, s) => sum + s, 0),
    };
  });

  const overallAvg = useMemo(() => {
    const all: number[] = [];
    for (const q of sortedQuestions) {
      for (const s of q.evaluator_scores ?? []) all.push(s.score);
    }
    return all.length > 0
      ? all.reduce((sum, s) => sum + s, 0) / all.length
      : null;
  }, [sortedQuestions]);

  const scoreFor = (question: InstanceQuestion, evaluatorId: number) =>
    (question.evaluator_scores ?? []).find(
      (s) => s.evaluator_id === evaluatorId,
    );

  if (evaluators.length === 0) {
    return (
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50/60 p-5 text-center text-sm text-gray-500">
        ยังไม่มีผู้ประเมินที่ส่งคะแนนแล้ว
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-gray-800">
          คะแนนรายผู้ประเมิน
        </p>
        <p className="text-xs text-gray-400">
          ผู้ประเมินตามรายชื่อ {evaluators.length} คน
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
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
              {evaluators.map((ev) => (
                <th
                  key={ev.id}
                  className="border-r border-gray-100 px-3 py-2 font-medium"
                >
                  {ev.name}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">เฉลี่ย</th>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-center text-[11px] text-gray-400">
              {evaluators.map((ev) => (
                <th
                  key={ev.id}
                  className="border-r border-gray-100 px-2 py-1 font-normal"
                >
                  คะแนน
                </th>
              ))}
              <th className="px-2 py-1 font-normal">รายข้อ</th>
            </tr>
          </thead>

          <tbody>
            {questionStats.map(({ question, avg, roundedAvg }, idx) => (
              <tr
                key={question.id}
                className="border-b border-gray-50 last:border-0"
              >
                <td className="border-r border-gray-50 px-3 py-2.5 align-top text-gray-400">
                  {idx + 1}
                </td>

                <td className="border-r border-gray-50 px-3 py-2.5 text-gray-700">
                  {question.question_text}
                </td>

                {evaluators.map((ev) => {
                  const hit = scoreFor(question, ev.id);
                  const differs =
                    hit &&
                    roundedAvg !== null &&
                    Math.abs(hit.score - roundedAvg) >= 1;

                  return (
                    <td
                      key={ev.id}
                      className="border-r border-gray-50 px-2 py-2.5 text-center"
                    >
                      {hit ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                              differs
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {Number.isInteger(hit.score)
                              ? hit.score.toFixed(0)
                              : hit.score.toFixed(1)}
                          </span>

                          {differs && (
                            <span className="text-[10px] font-semibold text-amber-600">
                              {hit.score > (roundedAvg ?? 0) ? "+" : "−"}
                              {Math.abs(hit.score - (roundedAvg ?? 0))}
                            </span>
                          )}

                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  );
                })}

                <td className="px-2 py-2.5 text-center">
                  {avg !== null ? (
                    <span className="text-sm font-bold text-gray-800">
                      {avg.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
              <td
                colSpan={2}
                className="px-3 py-3 text-center text-gray-600"
              >
                สรุปรายคน
              </td>

              {evaluatorStats.map((ev) => (
                <td
                  key={ev.id}
                  className="border-r border-gray-100 px-2 py-3 text-center"
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-bold text-gray-900">
                      {ev.avg !== null ? ev.avg.toFixed(2) : "—"}
                    </span>
                    <span className="text-[11px] font-normal text-gray-500">
                      รวม {ev.total} คะแนน
                    </span>
                    {ev.avg !== null && overallAvg !== null && (
                      <span
                        className={`text-[11px] font-medium ${
                          Math.abs(ev.avg - overallAvg) < 0.01
                            ? "text-gray-400"
                            : "text-amber-600"
                        }`}
                      >
                        {Math.abs(ev.avg - overallAvg) < 0.01
                          ? "เท่ากับเฉลี่ย"
                          : `ต่าง ${
                              ev.avg > overallAvg ? "+" : "−"
                            }${Math.abs(ev.avg - overallAvg).toFixed(2)}`}
                      </span>
                    )}
                  </div>
                </td>
              ))}

              <td className="px-2 py-3 text-center">
                <span className="text-sm font-bold text-primary-dark">
                  {overallAvg !== null ? overallAvg.toFixed(2) : "—"}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 bg-gray-50 px-4 py-3 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-100 ring-1 ring-amber-300" />
          คะแนนต่างจากค่าเฉลี่ยรายข้อ (สีอำพัน + ตัวเลข ±)
        </span>
        <span>เฉลี่ยรายข้อ = ค่าเฉลี่ยไม่ปัดของผู้ประเมินทุกคน</span>
      </div>
    </div>
  );
}
