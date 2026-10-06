import type {
  EvaluationSectionForm,
  InstanceQuestion,
} from "../types/EvaluationSectionForm_type";
import { compareSignatureOrder } from "./signatureOrder";

const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
const THAI_SARABUN_FONT = {
  ascii: "TH Sarabun New",
  hAnsi: "TH Sarabun New",
  eastAsia: "TH Sarabun New",
  cs: "TH Sarabun New",
};

function thaiText(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => THAI_DIGITS[Number(digit)]);
}

function averageScore(question: InstanceQuestion): number | null {
  const scores = question.evaluator_scores ?? [];
  if (scores.length === 0) return null;
  return scores.reduce((sum, item) => sum + item.score, 0) / scores.length;
}

function displayScore(value: number | null): string {
  if (value === null) return "-";
  return thaiText(Number.isInteger(value) ? String(value) : value.toFixed(2));
}

function safeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

export async function exportCombinedReportsToWord(
  reports: EvaluationSectionForm[],
): Promise<void> {
  if (reports.length === 0) return;

  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    HeadingLevel,
    NumberFormat,
    PageBreak,
    PageNumber,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import("docx");

  const border = { style: BorderStyle.SINGLE, size: 4, color: "B8C0CC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cellMargins = { top: 100, bottom: 100, left: 120, right: 120 };
  const children: InstanceType<typeof Paragraph | typeof Table>[] = [];

  for (const [reportIndex, detail] of reports.entries()) {
    if (reportIndex > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

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

    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: thaiText(detail.template_name), bold: true })],
      }),
    );

    if (detail.instance_name) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun(thaiText(detail.instance_name))],
        }),
      );
    }

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 220 },
        children: [
          new TextRun(thaiText(`ปีการศึกษา ${detail.academic_year}  รอบ ${detail.round}`)),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: [
          [
            `ผู้รับการประเมิน: ${detail.target.name}`,
            `ตำแหน่ง: ${detail.target.position || "-"}`,
          ],
          [
            `ผู้ประเมิน: ${
              evaluators.length > 0
                ? evaluators.map((item) => item.name_snapshort).join(", ")
                : "-"
            }`,
            "",
          ],
          ...detail.fields.map((field) => [
            `${field.label}: ${field.value || "-"}`,
            "",
          ]),
        ].map(
          ([left, right]) =>
            new TableRow({
              children: [left, right].map(
                (text) =>
                  new TableCell({
                    margins: cellMargins,
                    children: [new Paragraph({ children: [new TextRun(thaiText(text))] })],
                  }),
              ),
            }),
        ),
      }),
      new Paragraph({ spacing: { after: 80 } }),
    );

    const headerCell = (text: string, width: number) =>
      new TableCell({
        width: { size: width, type: WidthType.PERCENTAGE },
        borders,
        margins: cellMargins,
        shading: { fill: "DCE6F1" },
        verticalAlign: "center",
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: thaiText(text), bold: true })],
          }),
        ],
      });
    const bodyCell = (text: string, width: number, centered = false) =>
      new TableCell({
        width: { size: width, type: WidthType.PERCENTAGE },
        borders,
        margins: cellMargins,
        verticalAlign: "center",
        children: [
          new Paragraph({
            alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
            children: [new TextRun(thaiText(text))],
          }),
        ],
      });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              headerCell("ข้อ", 8),
              headerCell("รายการประเมิน", 72),
              headerCell("คะแนนเฉลี่ย", 20),
            ],
          }),
          ...questions.map(
            (question, index) =>
              new TableRow({
                children: [
                  bodyCell(thaiText(index + 1), 8, true),
                  bodyCell(question.question_text, 72),
                  bodyCell(displayScore(averageScore(question)), 20, true),
                ],
              }),
          ),
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                borders,
                margins: cellMargins,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: "รวมคะแนน", bold: true })],
                  }),
                ],
              }),
              bodyCell(displayScore(scored.length > 0 ? total : null), 20, true),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                borders,
                margins: cellMargins,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: "คะแนนเฉลี่ย", bold: true })],
                  }),
                ],
              }),
              bodyCell(displayScore(average), 20, true),
            ],
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 260, after: 80 },
        children: [new TextRun({ text: "ข้อเสนอแนะ", bold: true })],
      }),
      new Paragraph({
        spacing: { after: 320 },
        children: [new TextRun(thaiText(detail.comment || "-"))],
        border: {
          bottom: { style: BorderStyle.DOTTED, size: 4, color: "777777" },
        },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        keepNext: true,
        spacing: { before: 180, after: 240 },
        children: [new TextRun({ text: "ผู้รับการประเมิน", bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        keepNext: true,
        children: [new TextRun("ลงชื่อ ................................................")],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        keepNext: true,
        spacing: { after: detail.target.position ? 60 : 240 },
        children: [new TextRun(thaiText(`(${detail.target.name})`))],
      }),
    );

    if (detail.target.position) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [new TextRun(thaiText(`ตำแหน่ง ${detail.target.position}`))],
        }),
      );
    }

    for (const [signerIndex, signer] of (signers.length > 0 ? signers : evaluators).entries()) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { before: 160, after: 240 },
          children: [
            new TextRun({
              text: thaiText(signer.signature_role || `ผู้ลงนามคนที่ ${signerIndex + 1}`),
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          children: [new TextRun("ลงชื่อ ................................................")],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { after: signer.position_snapshort ? 60 : 200 },
          children: [new TextRun(thaiText(`(${signer.name_snapshort})`))],
        }),
      );
      if (signer.position_snapshort) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun(thaiText(`ตำแหน่ง ${signer.position_snapshort}`))],
          }),
        );
      }
    }
  }

  const document = new Document({
    styles: {
      default: {
        document: {
          run: { font: THAI_SARABUN_FONT, size: 32, color: "000000" },
          paragraph: { spacing: { line: 276 } },
        },
      },
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          next: "Normal",
          run: { font: THAI_SARABUN_FONT, size: 40, bold: true, color: "000000" },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
            pageNumbers: { formatType: NumberFormat.THAI_NUMBERS },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun("หน้า "),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  const first = reports[0];
  link.href = url;
  link.download = `${safeFilename(
    thaiText(`ใบสรุปผลการประเมิน-${first.template_name}-${first.academic_year}`),
  )}.docx`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
