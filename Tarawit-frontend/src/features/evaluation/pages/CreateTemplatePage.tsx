import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/hooks";
import { createTemplate } from "../api/templateSlice";
import type {
  TemplateQuestionInput,
  TemplateSectionInput,
  TemplateFieldInput,
  TemplateWritePayload,
} from "../types/template_type";

const emptyQuestion = (): TemplateQuestionInput => ({
  question: "",
  question_type: "SCALE",
  required: true,
  choices: [
    { label: "ควรปรับปรุง", score: 1 },
    { label: "ดี", score: 3 },
    { label: "ดีมาก", score: 5 },
  ],
});

const emptySection = (): TemplateSectionInput => ({
  name: "",
  description: "",
  questions: [emptyQuestion()],
});

const emptyField = (): TemplateFieldInput => ({
  label: "",
  field_type: "TEXT",
  placeholder: "",
  required: false,
});

export default function CreateTemplatePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateWritePayload>({
    code: "",
    template_name: "",
    description: "",
    evaluation_target_id: "TEACHER",
    template_type: "EVALUATION",
    fields: [],
    sections: [emptySection()],
  });

  const updateSection = (
    sectionIndex: number,
    update: Partial<TemplateSectionInput>,
  ) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, index) =>
        index === sectionIndex ? { ...section, ...update } : section,
      ),
    }));
  };

  const updateQuestion = (
    sectionIndex: number,
    questionIndex: number,
    update: Partial<TemplateQuestionInput>,
  ) => {
    const section = form.sections[sectionIndex];
    updateSection(sectionIndex, {
      questions: section.questions.map((question, index) =>
        index === questionIndex ? { ...question, ...update } : question,
      ),
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const template = await dispatch(createTemplate(form)).unwrap();
      navigate(`/evaluation/templates/${template.id}`);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/evaluation/templates")}
            className="mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="กลับไปรายการแม่แบบ"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Template workshop
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              สร้างแม่แบบการประเมิน
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              บันทึกเป็นฉบับร่างก่อน แล้วจึงนำไปใช้สร้างรอบประเมิน
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกฉบับร่าง"}
        </button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          รหัสแม่แบบ
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="TEACHER-2026" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-primary" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          ชื่อแม่แบบ
          <input required value={form.template_name} onChange={(e) => setForm({ ...form, template_name: e.target.value })} placeholder="แบบประเมินการปฏิบัติงาน" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-primary" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          ประเภท
          <select value={form.template_type} onChange={(e) => setForm({ ...form, template_type: e.target.value as TemplateWritePayload["template_type"] })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-primary">
            <option value="EVALUATION">แบบประเมิน</option>
            <option value="SURVEY">แบบสอบถาม</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          กลุ่มเป้าหมาย
          <select value={form.evaluation_target_id} onChange={(e) => setForm({ ...form, evaluation_target_id: e.target.value as TemplateWritePayload["evaluation_target_id"] })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-primary">
            <option value="TEACHER">ครู</option><option value="DIRECTOR">ผู้บริหาร</option><option value="STAFF">บุคลากร</option><option value="STUDENT">นักเรียน</option><option value="PARENT">ผู้ปกครอง</option><option value="ALL">ทุกกลุ่ม</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          คำอธิบาย
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-primary" />
        </label>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">ข้อมูลประกอบ</h2>
            <p className="mt-0.5 text-xs text-slate-500">ข้อมูลเพิ่มเติมที่ต้องกรอกก่อนตอบคำถาม</p>
          </div>
          <button type="button" onClick={() => setForm({ ...form, fields: [...form.fields, emptyField()] })} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"><Plus size={15} /> เพิ่มฟิลด์</button>
        </div>
        {form.fields.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">ยังไม่มีข้อมูลประกอบ — เพิ่มเฉพาะข้อมูลที่ไม่ได้ดึงจากระบบอัตโนมัติ</p>
        ) : (
          <div className="space-y-3 p-5">
            {form.fields.map((field, fieldIndex) => (
              <div key={fieldIndex} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_150px_1fr_auto] md:items-center">
                <input required value={field.label} onChange={(e) => setForm({ ...form, fields: form.fields.map((item, index) => index === fieldIndex ? { ...item, label: e.target.value } : item) })} placeholder="ชื่อฟิลด์ เช่น หน่วยงาน" className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                <select value={field.field_type} onChange={(e) => setForm({ ...form, fields: form.fields.map((item, index) => index === fieldIndex ? { ...item, field_type: e.target.value as TemplateFieldInput["field_type"] } : item) })} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <option value="TEXT">ข้อความสั้น</option><option value="TEXTAREA">ข้อความยาว</option><option value="NUMBER">ตัวเลข</option><option value="DATE">วันที่</option>
                </select>
                <input value={field.placeholder} onChange={(e) => setForm({ ...form, fields: form.fields.map((item, index) => index === fieldIndex ? { ...item, placeholder: e.target.value } : item) })} placeholder="คำแนะนำ (ถ้ามี)" className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                <div className="flex items-center gap-2"><label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-600"><input type="checkbox" checked={field.required} onChange={(e) => setForm({ ...form, fields: form.fields.map((item, index) => index === fieldIndex ? { ...item, required: e.target.checked } : item) })} /> จำเป็น</label><button type="button" onClick={() => setForm({ ...form, fields: form.fields.filter((_, index) => index !== fieldIndex) })} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="ลบฟิลด์"><Trash2 size={16} /></button></div>
              </div>
            ))}
          </div>
        )}
      </section>

      {form.sections.map((section, sectionIndex) => (
        <section key={sectionIndex} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-white">{sectionIndex + 1}</span>
            <input required value={section.name} onChange={(e) => updateSection(sectionIndex, { name: e.target.value })} placeholder="ชื่อหมวดคำถาม" className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-slate-400" />
            {form.sections.length > 1 && <button type="button" onClick={() => setForm({ ...form, sections: form.sections.filter((_, i) => i !== sectionIndex) })} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="ลบหมวด"><Trash2 size={17} /></button>}
          </div>
          <div className="space-y-4 p-5">
            {section.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="rounded-lg border border-slate-200 p-4">
                <div className="flex gap-3">
                  <textarea required value={question.question} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { question: e.target.value })} placeholder={`คำถามข้อ ${questionIndex + 1}`} rows={2} className="min-w-0 flex-1 resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                  <select value={question.question_type} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { question_type: e.target.value as TemplateQuestionInput["question_type"], choices: e.target.value === "TEXT" ? [] : question.choices.length ? question.choices : emptyQuestion().choices })} className="h-10 rounded-md border border-slate-200 px-2 text-sm">
                    <option value="SCALE">ให้คะแนน</option><option value="CHOICE">เลือกตอบ</option><option value="TEXT">บรรยาย</option>
                  </select>
                  <button type="button" disabled={section.questions.length === 1} onClick={() => updateSection(sectionIndex, { questions: section.questions.filter((_, i) => i !== questionIndex) })} className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-25" aria-label="ลบคำถาม"><Trash2 size={17} /></button>
                </div>
                {question.question_type !== "TEXT" && <div className="mt-3 grid gap-2 md:grid-cols-3">{question.choices.map((choice, choiceIndex) => <div key={choiceIndex} className="flex gap-2"><input value={choice.label} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { choices: question.choices.map((item, i) => i === choiceIndex ? { ...item, label: e.target.value } : item) })} placeholder="ตัวเลือก" className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs" /><input type="number" step="0.5" value={choice.score} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { choices: question.choices.map((item, i) => i === choiceIndex ? { ...item, score: Number(e.target.value) } : item) })} className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-xs" /></div>)}</div>}
                {question.question_type !== "TEXT" && <button type="button" onClick={() => updateQuestion(sectionIndex, questionIndex, { choices: [...question.choices, { label: "", score: 0 }] })} className="mt-3 text-xs font-medium text-primary hover:underline">+ เพิ่มตัวเลือก</button>}
              </div>
            ))}
            <button type="button" onClick={() => updateSection(sectionIndex, { questions: [...section.questions, emptyQuestion()] })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><Plus size={16} /> เพิ่มคำถาม</button>
          </div>
        </section>
      ))}
      <button type="button" onClick={() => setForm({ ...form, sections: [...form.sections, emptySection()] })} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-5 py-4 text-sm font-semibold text-primary hover:bg-primary/10"><Plus size={18} /> เพิ่มหมวดคำถาม</button>
    </form>
  );
}
