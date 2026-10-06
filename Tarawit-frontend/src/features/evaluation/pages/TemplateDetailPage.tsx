import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Copy, Play, Pause, Trash2 } from "lucide-react";
import type {
  TemplateDetailResponse,
  QuestionScoreResponse,
} from "../types/template_type";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import {
  fetchTemplateById,
  deleteTemplate,
  duplicateTemplate,
  updateTemplateStatus,
  fetchTemplates,
} from "../api/templateSlice";

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

  const snackbar = useSnackbar();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const template = templateDetail as TemplateDetailResponse | null;
  const totalQuestions =
    template?.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0,
    ) ?? 0;

  async function handleDelete() {
    if (!template) return;
    const res = await dispatch(deleteTemplate(template.id));
    if (deleteTemplate.fulfilled.match(res)) {
      snackbar.showSnackbar("ลบแม่แบบสำเร็จ", "success");
      dispatch(fetchTemplates());
      navigate("/evaluation/templates");
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "ลบไม่สำเร็จ",
        "error",
      );
    }
    setShowDeleteConfirm(false);
  }

  async function handleDuplicate() {
    if (!template) return;
    const res = await dispatch(duplicateTemplate(template.id));
    if (duplicateTemplate.fulfilled.match(res)) {
      snackbar.showSnackbar("คัดลอกแม่แบบสำเร็จ", "success");
      dispatch(fetchTemplates());
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "คัดลอกไม่สำเร็จ",
        "error",
      );
    }
  }

  async function handleToggleStatus() {
    if (!template) return;
    const newStatus = template.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await dispatch(
      updateTemplateStatus({ id: template.id, status: newStatus }),
    );
    if (updateTemplateStatus.fulfilled.match(res)) {
      snackbar.showSnackbar(
        newStatus === "ACTIVE" ? "เปิดใช้งานแม่แบบแล้ว" : "ปิดใช้งานแม่แบบแล้ว",
        "success",
      );
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "เปลี่ยนสถานะไม่สำเร็จ",
        "error",
      );
    }
  }

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

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                template.status === "ACTIVE"
                  ? "bg-primary/10 text-primary-dark"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {template.status}
            </span>

            {/* ปุ่มจัดการ */}
            <button
              onClick={() =>
                navigate(`/evaluation/templates/${template.id}/edit`)
              }
              title="แก้ไข"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:text-blue-600"
            >
              <Pencil size={14} />
              แก้ไข
            </button>

            <button
              onClick={handleDuplicate}
              title="ทำสำเนา"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
            >
              <Copy size={14} />
              สำเนา
            </button>

            <button
              onClick={handleToggleStatus}
              title={
                template.status === "ACTIVE"
                  ? "ปิดใช้งาน"
                  : "เปิดใช้งาน"
              }
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                template.status === "ACTIVE"
                  ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                  : "border-primary/30 text-primary hover:bg-primary/5"
              }`}
            >
              {template.status === "ACTIVE" ? (
                <>
                  <Pause size={14} />
                  ปิดใช้งาน
                </>
              ) : (
                <>
                  <Play size={14} />
                  เปิดใช้งาน
                </>
              )}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="ลบ"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-red-300 hover:text-red-600"
            >
              <Trash2 size={14} />
              ลบ
            </button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                ยืนยันการลบ
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                ต้องการลบแม่แบบ "{template.template_name}" ใช่หรือไม่?
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        )}

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

          {/* หัวฟิลด์ (Fields) */}
          {template.fields && template.fields.length > 0 && (
            <div className="mb-8">
              <h2 className="font-semibold text-slate-800 mb-3">
                ข้อมูลประกอบ
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {template.fields.map((field, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {field.field_type === "TEXT" && "ข้อความสั้น"}
                        {field.field_type === "TEXTAREA" && "ข้อความยาว"}
                        {field.field_type === "NUMBER" && "ตัวเลข"}
                        {field.field_type === "DATE" && "วันที่"}
                        {field.placeholder && ` — ${field.placeholder}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
