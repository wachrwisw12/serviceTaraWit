import { useAppSelector } from "@/store/hooks";
import { ICONS, SvgIcon } from "@/design-system/icons";
import type {
  QuestionScoreResponse,
  TemplateDetailResponse,
} from "../../types/template_type";

function getSortedScores(
  questionScore: QuestionScoreResponse[],
): QuestionScoreResponse[] {
  if (!questionScore) return [];
  return [...questionScore].sort((a, b) => a.sort_order - b.sort_order);
}
const QUESTION_TYPE_LABEL: Record<string, string> = {
  SCALE: "ให้คะแนน (Scale)",
  rating: "ให้คะแนน (1-5)",
  text: "คำตอบแบบบรรยาย",
  choice: "เลือกตอบ",
};
export function TemplatePreviewModal({ onClose }: { onClose: () => void }) {
  const {
    templateDetail,
    detailLoading: loading,
    detailError: error,
  } = useAppSelector((state) => state.template);
  const template = templateDetail as TemplateDetailResponse | null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            ดูตัวอย่างแม่แบบ
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SvgIcon icon={ICONS.x} className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {loading && (
            <p className="text-sm text-gray-400 text-center py-10">
              กำลังโหลดตัวอย่าง...
            </p>
          )}

          {!loading && (error || !template) && (
            <p className="text-sm text-rose-500 text-center py-10">
              {error ?? "ไม่พบข้อมูลแม่แบบ"}
            </p>
          )}

          {!loading && template && (
            <div className="space-y-6">
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {template.template_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{template.code}</p>
              </div>

              {template.sections.map((section, sectionIndex) => (
                <div key={section.section_id}>
                  <p className="text-sm font-semibold text-gray-800 mb-2.5">
                    {sectionIndex + 1}. {section.name}
                  </p>

                  <ol className="space-y-2.5">
                    {section.questions.map((question, questionIndex) => {
                      const sortedScores = getSortedScores(
                        question.question_score,
                      );

                      return (
                        <li
                          key={question.id}
                          className="bg-slate-50 rounded-lg px-4 py-3"
                        >
                          <div className="flex justify-between gap-4">
                            <div className="flex gap-2">
                              <span className="text-slate-400 text-sm">
                                {sectionIndex + 1}.{questionIndex + 1}
                              </span>
                              <span className="text-sm text-slate-700">
                                {question.question}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {QUESTION_TYPE_LABEL[question.quesion_type] ??
                                question.quesion_type}
                            </span>
                          </div>

                          {sortedScores.length > 0 && (
                            <div className="flex gap-5 mt-3 pl-6">
                              {sortedScores.map((score) => (
                                <label
                                  key={score.score_id}
                                  className="flex items-center gap-1.5 text-xs text-slate-400 cursor-not-allowed"
                                >
                                  <input
                                    type="radio"
                                    name={`preview-question-${question.id}`}
                                    disabled
                                    className="accent-slate-400 cursor-not-allowed"
                                  />
                                  {score.label}
                                </label>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
