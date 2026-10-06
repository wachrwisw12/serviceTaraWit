import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Loader2, Printer } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import api from "../../../api/axios";
import { exportCombinedReportsToWord } from "../helper/exportCombinedWord";
import { printEvaluationReport } from "../helper/printWithFonts";
import { compareSignatureOrder } from "../helper/signatureOrder";
import type {
  EvaluationSectionForm,
  InstanceQuestion,
} from "../types/EvaluationSectionForm_type";

function displayScore(value: number | null): string {
  if (value === null) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function averageScore(question: InstanceQuestion): number | null {
  const scores = question.evaluator_scores ?? [];
  if (scores.length === 0) return null;
  return scores.reduce((sum, item) => sum + item.score, 0) / scores.length;
}

function PersonSummary({ detail }: { detail: EvaluationSectionForm }) {
  const questions = [...(detail.questions ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const scored = questions
    .map(averageScore)
    .filter((score): score is number => score !== null);
  const total = scored.reduce((sum, score) => sum + score, 0);
  const average = scored.length > 0 ? total / scored.length : null;
  const evaluators = [...detail.evaluators]
    .filter((item) => item.can_score !== false)
    .sort(compareSignatureOrder);
  const signers = [...detail.evaluators]
    .filter((item) => item.requires_signature !== false)
    .sort(compareSignatureOrder);

  return (
    <article className="evaluation-print-page evaluation-print-batch-page mx-auto bg-white text-black">
      <header className="text-center">
        <h1 className="text-xl font-bold">{detail.template_name}</h1>
        {detail.instance_name && <p className="mt-1 text-sm">{detail.instance_name}</p>}
        <p className="mt-1 text-sm">ปีการศึกษา {detail.academic_year} · รอบ {detail.round}</p>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <p><strong>ผู้รับการประเมิน:</strong> {detail.target.name}</p>
        <p><strong>ตำแหน่ง:</strong> {detail.target.position || "-"}</p>
        <div className="col-span-2 flex gap-2">
          <strong className="shrink-0">ผู้ประเมิน:</strong>
          <span>{evaluators.length > 0 ? evaluators.map((item) => item.name_snapshort).join(", ") : "-"}</span>
        </div>
        {detail.fields.map((field) => (
          <p key={field.id} className={field.value && field.value.length > 50 ? "col-span-2" : ""}>
            <strong>{field.label}:</strong> {field.value || "-"}
          </p>
        ))}
      </section>

      <table className="evaluation-print-table mt-5 w-full border-collapse text-xs">
        <thead><tr><th className="w-10">ข้อ</th><th>รายการประเมิน</th><th className="w-20">คะแนนเฉลี่ย</th></tr></thead>
        <tbody>
          {questions.map((question, index) => (
            <tr key={question.id}>
              <td className="text-center">{index + 1}</td>
              <td>{question.question_text}</td>
              <td className="text-center">{displayScore(averageScore(question))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th colSpan={2} className="text-right">รวมคะแนน</th><th>{displayScore(scored.length > 0 ? total : null)}</th></tr>
          <tr><th colSpan={2} className="text-right">คะแนนเฉลี่ย</th><th>{displayScore(average)}</th></tr>
        </tfoot>
      </table>

      <section className="mt-5 text-sm">
        <h2 className="font-bold">ข้อเสนอแนะ</h2>
        <div className="mt-2 min-h-16 whitespace-pre-wrap border-b border-dotted border-gray-500 pb-2">{detail.comment || "-"}</div>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-x-10 gap-y-8 text-sm">
        <div className="avoid-break col-span-2 ml-auto w-[calc(50%_-_1.25rem)] text-center">
          <p className="mb-5 font-medium">ผู้รับการประเมิน</p>
          <p>ลงชื่อ ................................................</p>
          <p className="mt-2">({detail.target.name})</p>
          {detail.target.position && <p className="mt-1">ตำแหน่ง {detail.target.position}</p>}
        </div>
        {(signers.length > 0 ? signers : evaluators).map((signer, index) => (
          <div key={`${signer.user_id}-${index}`} className="avoid-break text-center">
            <p className="mb-5 font-medium">{signer.signature_role || `ผู้ลงนามคนที่ ${index + 1}`}</p>
            <p>ลงชื่อ ................................................</p>
            <p className="mt-2">({signer.name_snapshort})</p>
            {signer.position_snapshort && <p className="mt-1">ตำแหน่ง {signer.position_snapshort}</p>}
          </div>
        ))}
      </section>
    </article>
  );
}

export default function BulkEvaluationPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const instanceId = Number(id);
  const targetIds = useMemo(
    () => (searchParams.get("target_ids") ?? "")
      .split(",")
      .map(Number)
      .filter((value, index, values) => Number.isInteger(value) && value > 0 && values.indexOf(value) === index),
    [searchParams],
  );
  const [reports, setReports] = useState<EvaluationSectionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all(targetIds.map(async (targetId) => {
      const response = await api.get<EvaluationSectionForm>(
        `/evaluation/instances/get-my-instanceByid/${instanceId}`,
        { params: { target_id: targetId } },
      );
      return response.data;
    }))
      .then((items) => { if (active) setReports(items); })
      .catch(() => { if (active) setError("ไม่สามารถจัดทำใบสรุปได้"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [instanceId, targetIds]);

  const handleExportWord = async () => {
    setExportingWord(true);
    setExportError(null);
    try {
      await exportCombinedReportsToWord(reports);
    } catch {
      setExportError("ไม่สามารถสร้างไฟล์ Word ได้ กรุณาลองอีกครั้ง");
    } finally {
      setExportingWord(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-sm text-gray-500">กำลังจัดทำใบสรุป {targetIds.length} คน...</div>;
  if (error || reports.length === 0) return <div className="p-12 text-center text-sm text-red-600">{error ?? "ไม่ได้เลือกผู้ถูกประเมิน"}</div>;

  return (
    <div className="evaluation-print-shell min-h-screen bg-slate-100 px-4 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Link to={`/evaluation/my-created/${instanceId}`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" />กลับหน้าสรุป</Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span className="text-sm text-gray-500">{reports.length} คน · ไฟล์เดียว</span>
          <button
            type="button"
            disabled={exportingWord}
            onClick={handleExportWord}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingWord ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {exportingWord ? "กำลังสร้าง Word..." : "ดาวน์โหลด Word"}
          </button>
          <button type="button" onClick={printEvaluationReport} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white"><Printer className="h-4 w-4" />พิมพ์ / บันทึก PDF</button>
        </div>
      </div>
      {exportError ? <p className="no-print mx-auto mb-4 max-w-[210mm] text-right text-sm text-red-600">{exportError}</p> : null}
      <div className="space-y-6 print:space-y-0">{reports.map((detail) => <PersonSummary key={detail.target.id} detail={detail} />)}</div>
    </div>
  );
}
