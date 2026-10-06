import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";

import { useAppDispatch } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import {
  batchCreatePersonnel,
  fetchPersonnel,
  type BatchCreateResult,
} from "../api/personnelSlice";
import type { CreatePersonnelPayload } from "../personnelType";

/* ── Column mapping ──────────────────────────────────────────── */
const COLUMNS = [
  { key: "username", label: "ชื่อผู้ใช้", required: true },
  { key: "password", label: "รหัสผ่าน", required: true },
  { key: "nickname", label: "ชื่อเล่น", required: false },
  { key: "department_id", label: "รหัสกลุ่มสาระ", required: false },
  { key: "cid", label: "เลขบัตรประชาชน", required: false },
  { key: "prefix_id", label: "รหัสคำนำหน้า", required: false },
  { key: "first_name", label: "ชื่อ", required: false },
  { key: "last_name", label: "นามสกุล", required: false },
  { key: "person_type_id", label: "รหัสประเภทบุคลากร", required: false },
  { key: "position_id", label: "รหัสตำแหน่ง", required: false },
  { key: "email", label: "อีเมล", required: false },
  { key: "phone", label: "เบอร์โทรศัพท์", required: false },
  { key: "person_level", label: "ระดับ", required: false },
] as const;

type ParsedRow = Record<string, string | number | null>;

/* ── Helpers ─────────────────────────────────────────────────── */

function downloadTemplate() {
  const header = COLUMNS.map((c) => c.label);
  const example = [
    "user01",
    "password123",
    "บอส",
    "1234567890123",
    "3",
    "สมชาย",
    "ใจดี",
    "1",
    "1",
    "somchai@example.com",
    "0812345678",
    "1",
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, example]);

  // ความกว้างคอลัมน์
  ws["!cols"] = COLUMNS.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "นำเข้าบุคลากร");
  XLSX.writeFile(wb, "template_นำเข้าบุคลากร.xlsx");
}

function toPayload(row: ParsedRow): CreatePersonnelPayload {
  const num = (v: string | number | null): number | null => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const str = (v: string | number | null): string | null => {
    if (v == null) return null;
    const s = String(v).trim();
    return s || null;
  };

  return {
    username: String(row["ชื่อผู้ใช้"] ?? "").trim(),
    password: String(row["รหัสผ่าน"] ?? "").trim(),
    nickname: str(row["ชื่อเล่น"]),
    department_id: num(row["รหัสกลุ่มสาระ"]),
    cid: str(row["เลขบัตรประชาชน"]),
    prefix_id: num(row["รหัสคำนำหน้า"]),
    first_name: str(row["ชื่อ"]),
    last_name: str(row["นามสกุล"]),
    person_type_id: num(row["รหัสประเภทบุคลากร"]),
    position_id: num(row["รหัสตำแหน่ง"]),
    email: str(row["อีเมล"]),
    phone: str(row["เบอร์โทรศัพท์"]),
    person_level: num(row["ระดับ"]),
  };
}

function validateRow(row: ParsedRow, index: number): string | null {
  const username = String(row["ชื่อผู้ใช้"] ?? "").trim();
  const password = String(row["รหัสผ่าน"] ?? "").trim();

  if (!username) return `แถว ${index + 1}: กรุณาระบุชื่อผู้ใช้`;
  if (!password) return `แถว ${index + 1}: กรุณาระบุรหัสผ่าน`;
  if (password.length < 6)
    return `แถว ${index + 1}: รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร`;

  const email = String(row["อีเมล"] ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return `แถว ${index + 1}: รูปแบบอีเมลไม่ถูกต้อง`;

  const cid = String(row["เลขบัตรประชาชน"] ?? "").trim();
  if (cid && cid.length !== 13)
    return `แถว ${index + 1}: เลขบัตรประชาชนต้องมี 13 หลัก`;

  return null;
}

/* ── Component ───────────────────────────────────────────────── */

export default function PersonnelImportPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BatchCreateResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  /* ── Parse file ──────────────────────────────── */
  const processFile = useCallback(
    (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
        snackbar.showSnackbar("รองรับเฉพาะไฟล์ .xlsx, .xls, .csv", "error");
        return;
      }

      setFileName(file.name);
      setResult(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: null });

        if (json.length === 0) {
          snackbar.showSnackbar("ไฟล์ไม่มีข้อมูล", "error");
          return;
        }

        setParsedRows(json);

        // validate
        const errors: string[] = [];
        json.forEach((row, i) => {
          const err = validateRow(row, i);
          if (err) errors.push(err);
        });
        setValidationErrors(errors);
      };
      reader.readAsArrayBuffer(file);
    },
    [snackbar],
  );

  /* ── Drag & drop ─────────────────────────────── */
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  /* ── Import ──────────────────────────────────── */
  async function handleImport() {
    if (validationErrors.length > 0) {
      snackbar.showSnackbar("กรุณาแก้ไขข้อผิดพลาดก่อนนำเข้า", "error");
      return;
    }

    setImporting(true);
    const payloads = parsedRows.map(toPayload);
    const res = await dispatch(batchCreatePersonnel(payloads));
    setImporting(false);

    if (batchCreatePersonnel.fulfilled.match(res)) {
      setResult(res.payload);
      if (res.payload.failed === 0) {
        snackbar.showSnackbar(
          `นำเข้าสำเร็จ ${res.payload.success} รายการ`,
          "success",
        );
        dispatch(fetchPersonnel({}));
      } else {
        snackbar.showSnackbar(
          `นำเข้าสำเร็จ ${res.payload.success} / ${res.payload.total} รายการ`,
          "warning",
        );
      }
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "นำเข้าไม่สำเร็จ",
        "error",
      );
    }
  }

  /* ── Reset ───────────────────────────────────── */
  function handleReset() {
    setParsedRows([]);
    setValidationErrors([]);
    setFileName(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/personnel")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-primary-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปจัดการบุคลากร
      </button>

      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <FileSpreadsheet className="h-5 w-5 text-primary-dark" />
          นำเข้าบุคลากรจาก Excel / CSV
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          ดาวน์โหลดเทมเพลต กรอกข้อมูล แล้วอัปโหลดเพื่อนำเข้าพร้อมกันหลายรายการ
        </p>
      </div>

      {/* Step 1: Download template */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">
          1. ดาวน์โหลดเทมเพลต
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          ดาวน์โหลดไฟล์เทมเพลต Excel แล้วกรอกข้อมูลบุคลากรในแต่ละแถว
          <span className="ml-1 text-red-500">*</span> คอลัมน์ที่จำเป็น
        </p>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-primary hover:text-primary-dark"
        >
          <Download className="h-4 w-4" />
          ดาวน์โหลดเทมเพลต (.xlsx)
        </button>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-gray-500">
                {COLUMNS.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-3 py-2">
                    {c.label}
                    {c.required && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="text-gray-400">
                {COLUMNS.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-3 py-2">
                    {c.key === "username"
                      ? "user01"
                      : c.key === "password"
                        ? "••••••"
                        : c.key === "first_name"
                          ? "สมชาย"
                          : c.key === "last_name"
                            ? "ใจดี"
                            : c.key === "email"
                              ? "user@example.com"
                              : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 2: Upload */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">
          2. อัปโหลดไฟล์
        </h2>

        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-200 bg-gray-50/50"
          }`}
        >
          <Upload className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">
            ลากและวางไฟล์ Excel หรือ CSV ที่นี่
          </p>
          <label
            htmlFor="import-file"
            className="cursor-pointer text-sm font-medium text-primary transition hover:text-primary-dark"
          >
            หรือกดเลือกไฟล์
          </label>
          <input
            ref={fileInputRef}
            id="import-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {fileName && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
            <FileSpreadsheet className="h-4 w-4 text-gray-400" />
            <span className="flex-1 truncate text-sm text-gray-700">
              {fileName}
            </span>
            <span className="text-xs text-gray-400">
              {parsedRows.length} แถว
            </span>
            <button
              onClick={handleReset}
              className="rounded p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Step 3: Preview + validate */}
      {parsedRows.length > 0 && !result && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              3. ตรวจสอบข้อมูล ({parsedRows.length} รายการ)
            </h2>
            {validationErrors.length === 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ข้อมูลถูกต้อง
              </span>
            )}
          </div>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-red-700">
                <XCircle className="h-4 w-4" />
                พบข้อผิดพลาด {validationErrors.length} รายการ
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-red-600">
                {validationErrors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview table */}
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-gray-500">
                  <th className="px-3 py-2">#</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-3 py-2">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => {
                  const rowError = validateRow(row, i);
                  return (
                    <tr
                      key={i}
                      className={`border-b border-gray-50 last:border-0 ${
                        rowError ? "bg-red-50/50" : ""
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      {COLUMNS.map((c) => (
                        <td
                          key={c.key}
                          className="whitespace-nowrap px-3 py-2 text-gray-700"
                        >
                          {String(row[c.label] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Import button */}
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              เริ่มใหม่
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validationErrors.length > 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              นำเข้า {parsedRows.length} รายการ
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {result && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">
            ผลการนำเข้า
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
              <p className="text-sm text-emerald-600">สำเร็จ</p>
              <p className="text-2xl font-bold text-emerald-600">
                {result.success}
              </p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
              <p className="text-sm text-red-600">ไม่สำเร็จ</p>
              <p className="text-2xl font-bold text-red-600">{result.failed}</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="mb-2 text-sm font-medium text-red-700">
                รายการที่นำเข้าไม่สำเร็จ
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-red-600">
                      <th className="px-2 py-1">แถว</th>
                      <th className="px-2 py-1">ชื่อผู้ใช้</th>
                      <th className="px-2 py-1">เหตุผล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, i) => (
                      <tr key={i} className="text-red-600">
                        <td className="px-2 py-1">{err.row_index}</td>
                        <td className="px-2 py-1">{err.username}</td>
                        <td className="px-2 py-1">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              นำเข้าเพิ่ม
            </button>
            <button
              onClick={() => navigate("/personnel/list")}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
            >
              ดูรายชื่อบุคลากร
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
