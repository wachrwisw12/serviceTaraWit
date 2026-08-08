import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  TemplateDetailResponse,
  QuestionScoreResponse,
} from "../types/template_type";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchTemplateById } from "../api/templateSlice";

const QUESTION_TYPE_LABEL: Record<string, string> = {
  SCALE: "ให้คะแนน (Scale)",
  rating: "ให้คะแนน (1-5)",
  text: "คำตอบแบบบรรยาย",
  choice: "เลือกตอบ",
};

// เรียง question_score ตาม sort_order ให้แสดงจากน้อยไปมาก (1 -> 5)
function getSortedScores(
  questionScore: QuestionScoreResponse[],
): QuestionScoreResponse[] {
  if (!questionScore) return [];
  return [...questionScore].sort((a, b) => a.sort_order - b.sort_order);
}

export default function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { templateDetail, loading, error } = useAppSelector(
    (state) => state.template,
  );

  useEffect(() => {
    if (!templateId) return;

    dispatch(fetchTemplateById(Number(templateId)));
  }, [dispatch, templateId]);

  const template = templateDetail as TemplateDetailResponse | null;
  const totalQuestions =
    template?.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0,
    ) ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">กำลังโหลดข้อมูลแม่แบบ...</p>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-sm">
          <p className="text-red-600 font-medium mb-4">
            {error ?? "ไม่พบข้อมูล"}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
          >
            ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ← กลับไปหน้ารายการ
          </button>

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              template.status === "ACTIVE"
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {template.status}
          </span>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="border-b border-dashed border-slate-200 pb-6 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              {template.template_name}
            </h1>

            <p className="text-sm text-slate-400 mt-1">{template.code}</p>

            <div className="flex gap-6 mt-4 text-sm text-slate-500">
              <span>
                เวอร์ชัน :
                <b className="text-slate-700 ml-1">{template.versions}</b>
              </span>

              <span>
                จำนวนหมวด :
                <b className="text-slate-700 ml-1">
                  {template.sections.length}
                </b>
              </span>

              <span>
                จำนวนข้อ :
                <b className="text-slate-700 ml-1">{totalQuestions}</b>
              </span>
            </div>
          </div>

          <div className="space-y-8">
            {template.sections.map((section, sectionIndex) => (
              <section key={section.section_id}>
                <h2 className="font-semibold text-slate-800 mb-3">
                  {sectionIndex + 1}. {section.name}
                </h2>

                <ol className="space-y-3">
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
                            <span className="text-slate-400">
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
                                  name={`question-${question.id}`}
                                  value={score.score_id}
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
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
