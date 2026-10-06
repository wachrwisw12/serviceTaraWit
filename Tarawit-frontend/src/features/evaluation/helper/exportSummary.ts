import * as XLSX from "xlsx";

import type { MyCreatedEvaluationSummary } from "../api/createdEvaluationSlice";

// รองรับทั้งตัวพิมพ์เล็ก/ใหญ่ เพราะฐานข้อมูลเก็บเป็นตัวพิมพ์ใหญ่ (DRAFT/OPEN/CLOSED)
const STATUS_LABEL: Record<string, string> = {
  draft: "ฉบับร่าง",
  open: "กำลังประเมิน",
  closed: "ปิดแล้ว",
  DRAFT: "ฉบับร่าง",
  OPEN: "กำลังประเมิน",
  CLOSED: "ปิดแล้ว",
};

function fmtScore(value: number | null | undefined): string {
  return value !== null && value !== undefined ? value.toFixed(2) : "—";
}

function fmtPercent(
  average: number | null | undefined,
  max: number | null | undefined,
): string {
  if (average === null || average === undefined || !max) return "—";
  return `${Math.round((average / max) * 100)}%`;
}

export function exportSummaryToExcel(
  summary: MyCreatedEvaluationSummary,
): void {
  const rows: (string | number)[][] = [];

  // ---------- ข้อมูลทั่วไป ----------
  rows.push(["สรุปการประเมิน", ""]);
  rows.push(["แบบประเมิน", summary.template_name]);
  rows.push(["ชื่อรอบ", summary.instance_name || "—"]);
  rows.push(["ปีการศึกษา", summary.academic_year]);
  rows.push(["รอบ", summary.round]);
  rows.push(["สถานะ", STATUS_LABEL[summary.status] ?? summary.status]);
  rows.push(["ผู้ถูกประเมิน", `${summary.target_count} คน`]);
  rows.push(["ผู้ประเมิน", `${summary.evaluator_count} คน`]);
  rows.push([
    "คะแนนเฉลี่ย",
    summary.max_possible_score
      ? `${fmtScore(summary.average_score)} / ${fmtScore(summary.max_possible_score)}`
      : fmtScore(summary.average_score),
  ]);
  rows.push(["ประเมินแล้ว", `${summary.completed_count} / ${summary.assignment_count}`]);
  rows.push([]);

  // ---------- คะแนนเฉลี่ยรายหมวด ----------
  rows.push(["คะแนนเฉลี่ยรายหมวด", "", "", "", ""]);
  rows.push(["#", "หมวด", "คะแนนเฉลี่ย", "คะแนนเต็ม", "%"]);

  for (const [index, section] of summary.sections.entries()) {
    rows.push([
      index + 1,
      section.name,
      fmtScore(section.average_score),
      section.max_possible_score ?? "—",
      fmtPercent(section.average_score, section.max_possible_score),
    ]);
  }

  rows.push([]);

  // ---------- ผู้ทำการประเมิน ----------
  rows.push(["ผู้ทำการประเมิน", "", "", "", "", ""]);
  rows.push(["#", "ผู้ประเมิน", "ตำแหน่ง", "ประเมินแล้ว", "ทั้งหมด", "สถานะ"]);

  for (const [index, evaluator] of summary.evaluators.entries()) {
    rows.push([
      index + 1,
      evaluator.name_snapshot,
      evaluator.position_snapshot || "—",
      evaluator.completed_count,
      evaluator.assignment_count,
      evaluator.complete ? "ประเมินครบแล้ว" : "ยังไม่ครบ",
    ]);
  }

  rows.push([]);

  // ---------- ผู้ถูกประเมิน ----------
  rows.push(["ผู้ถูกประเมิน", "", "", "", "", ""]);
  rows.push(["#", "ชื่อ", "ตำแหน่ง", "ประเมินแล้ว", "ทั้งหมด", "คะแนนเฉลี่ย"]);

  for (const [index, target] of summary.targets.entries()) {
    rows.push([
      index + 1,
      target.name,
      target.position || "—",
      target.completed_count,
      target.assignment_count,
      fmtScore(target.average_score),
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 42 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "สรุปการประเมิน");

  const filename = `สรุปการประเมิน-${summary.template_name}-${summary.academic_year}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
