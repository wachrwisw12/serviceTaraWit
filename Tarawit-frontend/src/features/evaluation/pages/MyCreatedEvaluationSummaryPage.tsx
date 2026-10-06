import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  UserCheck,
  ClipboardCheck,
  Star,
  CheckCircle2,
  Hourglass,
  Printer,
  Images,
  FileSpreadsheet,
  Pencil,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useDialog } from "../../../components/dialog";

import {
  closeEvaluationInstance,
  fetchMyCreatedEvaluationSummary,
} from "../api/createdEvaluationSlice";
import { exportSummaryToExcel } from "../helper/exportSummary";

const ACCENT = "var(--color-primary)";

function StatusBadge({ status }: { status: "draft" | "open" | "closed" }) {
  if (status === "open") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        <Hourglass className="h-3.5 w-3.5" />
        กำลังประเมิน
      </span>
    );
  }

  if (status === "closed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-dark">
        <CheckCircle2 className="h-3.5 w-3.5" />
        ปิดแล้ว
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      ฉบับร่าง
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        <Icon className="h-5.5 w-5.5" strokeWidth={2} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-900">{value}</p>

        {sub && <p className="truncate text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({
  percent,
  color = ACCENT,
}: {
  percent: number;
  color?: string;
}) {
  return (
    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function MyCreatedEvaluationSummaryPage() {
  const { id } = useParams<{ id: string }>();

  const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [printDialogKind, setPrintDialogKind] = useState<"report" | "images" | null>(null);
	const [printMode, setPrintMode] = useState<"all" | "selected">("all");
	const [selectedTargetIds, setSelectedTargetIds] = useState<number[]>([]);

  const { summary, summaryLoading, summaryError, closingId } = useAppSelector(
    (state) => state.createdEvaluation,
  );

  const { confirm, alert } = useDialog();

  useEffect(() => {
    if (id) dispatch(fetchMyCreatedEvaluationSummary(Number(id)));
  }, [dispatch, id]);

  const handleClose = async () => {
    if (!summary) return;

    const confirmed = await confirm({
      type: "warning",
      title: "ปิดการประเมิน?",
      message:
        "เมื่อปิดแล้ว ผู้ประเมินจะไม่สามารถให้คะแนนเพิ่มเติมได้\n" +
        "คุณแน่ใจหรือไม่ว่าต้องการปิดการประเมินนี้",
      confirmText: "ปิดการประเมิน",
      cancelText: "ยกเลิก",
    });

    if (!confirmed) return;

    try {
      await dispatch(closeEvaluationInstance(summary.id)).unwrap();

      await alert({
        type: "success",
        title: "ปิดการประเมินแล้ว",
        message: "การประเมินถูกปิด ผู้ประเมินไม่สามารถให้คะแนนเพิ่มได้",
      });
    } catch (error) {
      await alert({
        type: "error",
        title: "ไม่สามารถปิดได้",
        message: typeof error === "string" ? error : "เกิดข้อผิดพลาด",
      });
    }
  };

	const openPrintDialog = (kind: "report" | "images") => {
	  if (!summary) return;
	  setPrintMode("all");
	  setSelectedTargetIds(summary.targets.map((target) => target.target_id));
	  setPrintDialogKind(kind);
	};

	const handlePrint = () => {
	  if (!summary) return;
	  const ids = printMode === "all"
		? summary.targets.map((target) => target.target_id)
		: selectedTargetIds;
	  if (ids.length === 0) return;
	  const path = printDialogKind === "images" ? "images/print" : "print";
	  navigate(`/evaluation/my-created/${summary.id}/${path}?target_ids=${ids.join(",")}`);
	};

  if (summaryLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        กำลังโหลดสรุป...
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="py-20 text-center text-sm text-red-500">
        เกิดข้อผิดพลาด: {summaryError}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        ไม่พบข้อมูลการประเมิน
      </div>
    );
  }

  // ฐานข้อมูลเก็บสถานะเป็นตัวพิมพ์ใหญ่ (DRAFT/OPEN/CLOSED)
  const instanceStatus = summary.status.toLowerCase() as
    | "draft"
    | "open"
    | "closed";

  const progressPct =
    summary.assignment_count > 0
      ? Math.round(
          (summary.completed_count / summary.assignment_count) * 100,
        )
      : 0;

  const avgScore = summary.average_score;
  const maxScore = summary.max_possible_score;
  const avgPercent =
    avgScore !== null && avgScore !== undefined && maxScore
      ? Math.round((avgScore / maxScore) * 100)
      : null;

  /*
   * คะแนนรวมทั้งหมด (ทุกคนที่ส่งแล้ว) และคะแนนเต็มทั้งหมด:
   * average_score คือค่าเฉลี่ยต่อรอบ ดังนั้นคูณด้วยจำนวนรอบที่ส่งแล้ว
   */
  const totalScore =
    avgScore !== null && avgScore !== undefined && summary.completed_count > 0
      ? avgScore * summary.completed_count
      : null;
  const totalMax =
    maxScore !== null && maxScore !== undefined && summary.completed_count > 0
      ? maxScore * summary.completed_count
      : null;

  const allEvaluatorsDone =
    summary.evaluators.length > 0 &&
    summary.evaluators.every((e) => e.complete);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back */}
      <Link
        to="/evaluation/my-created"
        className="print:hidden inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปรายการการประเมินที่ฉันสร้าง
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              สรุปการประเมิน
            </h1>
            <StatusBadge status={instanceStatus} />
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {summary.template_name}
            {summary.instance_name
              ? ` — ${summary.instance_name}`
              : ""}{" "}
            · ปีการศึกษา {summary.academic_year} · รอบ {summary.round}
          </p>
        </div>

        <div className="print:hidden flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => openPrintDialog("report")}
            className="
              flex items-center gap-2
              rounded-lg
              border border-gray-300
              px-4 py-2.5
              text-sm font-medium
              text-gray-700
              transition-colors
              hover:bg-gray-50
            "
          >
            <Printer className="h-4 w-4" />
            พิมพ์ใบสรุป
          </button>

          <button
            type="button"
            onClick={() => openPrintDialog("images")}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Images className="h-4 w-4" />
            พิมพ์รูปภาพ
          </button>

          <button
            type="button"
            onClick={() => exportSummaryToExcel(summary)}
            className="
              flex items-center gap-2
              rounded-lg
              px-4 py-2.5
              text-sm font-medium
              text-white
              transition-opacity
              hover:opacity-90
            "
            style={{ backgroundColor: ACCENT }}
          >
            <FileSpreadsheet className="h-4 w-4" />
            ส่งออก Excel
          </button>

          {instanceStatus !== "closed" && (
            <Link
              to={`/evaluation/my-created/${summary.id}/edit`}
              className="
                flex items-center gap-2
                rounded-lg
                border border-gray-300
                px-4 py-2.5
                text-sm font-medium
                text-gray-700
                transition-colors
                hover:bg-gray-50
              "
            >
              <Pencil className="h-4 w-4" />
              แก้ไขผู้เกี่ยวข้อง
            </Link>
          )}

          {instanceStatus === "open" && (
            <button
              type="button"
              disabled={closingId === summary.id}
              onClick={handleClose}
              className="
                flex items-center gap-2
                rounded-lg
                px-4 py-2.5
                text-sm font-medium
                text-white
                transition-opacity
                hover:opacity-90
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              style={{ backgroundColor: "#dc2626" }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {closingId === summary.id ? "กำลังปิด..." : "ปิดการประเมิน"}
            </button>
          )}
        </div>
      </div>

	  {printDialogKind && (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onMouseDown={() => setPrintDialogKind(null)}>
		  <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
			<div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
			  <div><h2 className="font-semibold text-gray-900">{printDialogKind === "images" ? "พิมพ์รูปภาพที่แนบไว้" : "จัดทำไฟล์รวมผลการประเมิน"}</h2><p className="mt-0.5 text-xs text-gray-500">{printDialogKind === "images" ? "รวมรูปภาพแนบทั้งหมดไว้ในงานพิมพ์หรือไฟล์ PDF เดียว" : "รวมหลายคนเป็นไฟล์ PDF หรือ Word เดียวได้"}</p></div>
			  <button type="button" onClick={() => setPrintDialogKind(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
			</div>
			<div className="space-y-3 overflow-y-auto p-5">
			  <label className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 p-3"><input type="radio" checked={printMode === "all"} onChange={() => setPrintMode("all")} /><span><strong className="block text-sm">รวมทั้งหมด</strong><span className="text-xs text-gray-500">{printDialogKind === "images" ? `รูปแนบทุกภาพของผู้ถูกประเมิน ${summary.targets.length} คน ในไฟล์เดียว` : `ผู้ถูกประเมิน ${summary.targets.length} คน ในไฟล์เดียว`}</span></span></label>
			  <label className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 p-3"><input type="radio" checked={printMode === "selected"} onChange={() => setPrintMode("selected")} /><span><strong className="block text-sm">เลือกเฉพาะคน</strong><span className="text-xs text-gray-500">เลือกได้มากกว่าหนึ่งคน</span></span></label>
			  {printMode === "selected" && <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl bg-gray-50 p-2">{summary.targets.map((target) => <label key={target.target_id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-white"><input type="checkbox" checked={selectedTargetIds.includes(target.target_id)} onChange={(event) => setSelectedTargetIds((current) => event.target.checked ? [...current, target.target_id] : current.filter((id) => id !== target.target_id))} /><span className="text-sm text-gray-800">{target.name}{target.position ? ` — ${target.position}` : ""}</span></label>)}</div>}
			</div>
			<div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4"><button type="button" onClick={() => setPrintDialogKind(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">ยกเลิก</button><button type="button" disabled={printMode === "selected" && selectedTargetIds.length === 0} onClick={handlePrint} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{printDialogKind === "images" ? <Images className="mr-2 inline h-4 w-4" /> : <Printer className="mr-2 inline h-4 w-4" />}{printDialogKind === "images" ? "เตรียมรูปทั้งหมด" : "จัดทำไฟล์รวม"}</button></div>
		  </div>
		</div>
	  )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Users}
          iconBg="var(--color-primary-soft)"
          iconColor={ACCENT}
          label="ผู้ถูกประเมิน"
          value={`${summary.target_count} คน`}
        />

        <SummaryCard
          icon={UserCheck}
          iconBg="rgba(59,130,246,0.1)"
          iconColor="#3b82f6"
          label="ผู้ประเมิน"
          value={`${summary.evaluator_count} คน`}
          sub={
            allEvaluatorsDone
              ? "ประเมินครบทุกคน"
              : `${summary.evaluators.filter((e) => e.complete).length}/${summary.evaluator_count} คนประเมินครบ`
          }
        />

        <SummaryCard
          icon={Star}
          iconBg="rgba(245,158,11,0.1)"
          iconColor="#f59e0b"
          label="คะแนนเฉลี่ย"
          value={
            avgScore !== null && avgScore !== undefined
              ? avgScore.toFixed(2)
              : "—"
          }
          sub={
            totalScore !== null && totalMax !== null
              ? `รวม ${totalScore.toFixed(
                  totalScore % 1 === 0 ? 0 : 2,
                )}/${totalMax.toFixed(
                  totalMax % 1 === 0 ? 0 : 2,
                )} คะแนน${avgPercent !== null ? ` (${avgPercent}%)` : ""}`
              : undefined
          }
        />

        <SummaryCard
          icon={ClipboardCheck}
          iconBg="rgba(139,92,246,0.1)"
          iconColor="#8b5cf6"
          label="ประเมินแล้ว"
          value={`${summary.completed_count}/${summary.assignment_count}`}
          sub={`${progressPct}% ของรอบทั้งหมด`}
        />
      </div>

      {/* Overall progress */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">
            ความครบถ้วนของการประเมิน
          </p>
          <span className="text-sm font-semibold" style={{ color: ACCENT }}>
            {progressPct}%
          </span>
        </div>

        <ProgressBar percent={progressPct} />

        <p className="mt-2 text-xs text-gray-400">
          {summary.assignment_count === 0
            ? "ยังไม่มีรอบการประเมิน"
            : progressPct === 100
              ? "ประเมินครบทุกคนแล้ว"
              : `ประเมินเสร็จแล้ว ${summary.completed_count} จาก ${summary.assignment_count} รอบ ยังเหลืออีก ${summary.assignment_count - summary.completed_count} รอบ`}
        </p>
      </div>

      {/* Section average scores */}
      {summary.sections.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              คะแนนเฉลี่ยรายหมวด
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              คะแนนเฉลี่ยของแต่ละหมวด/ส่วนของแบบประเมิน (เฉพาะรอบที่ส่งแล้ว)
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {summary.sections.map((section, index) => {
              const avg = section.average_score;
              const max = section.max_possible_score;
              const pct =
                avg !== null && avg !== undefined && max
                  ? Math.round((avg / max) * 100)
                  : null;

              return (
                <div
                  key={section.section_id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {index + 1}. {section.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {avg !== null && avg !== undefined
                        ? `เฉลี่ย ${avg.toFixed(2)} คะแนน`
                        : "ยังไม่มีคะแนน"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {max ? (
                      <>
                        <ProgressBar
                          percent={pct ?? 0}
                          color={pct !== null && pct >= 80 ? ACCENT : "#f59e0b"}
                        />
                        <span className="w-24 text-right text-sm font-semibold text-gray-700">
                          {avg !== null && avg !== undefined
                            ? `${avg.toFixed(2)} / ${max.toFixed(max % 1 === 0 ? 0 : 2)}`
                            : "—"}
                          {pct !== null && (
                            <span className="ml-1 text-xs font-normal text-gray-400">
                              ({pct}%)
                            </span>
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evaluator progress */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">ผู้ทำการประเมิน</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            ตรวจว่าผู้ประเมินแต่ละคนทำครบทุกคนที่ต้องประเมินหรือยัง
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">ผู้ประเมิน</th>
                <th className="px-5 py-3 font-medium">ตำแหน่ง</th>
                <th className="px-5 py-3 font-medium">ความคืบหน้า</th>
                <th className="px-5 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {summary.evaluators.map((evaluator) => {
                const pct =
                  evaluator.assignment_count > 0
                    ? Math.round(
                        (evaluator.completed_count /
                          evaluator.assignment_count) *
                          100,
                      )
                    : 0;

                return (
                  <tr key={evaluator.user_id} className="hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-gray-900">
                      {evaluator.name_snapshot}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                      {evaluator.position_snapshot || "—"}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ProgressBar
                          percent={pct}
                          color={evaluator.complete ? ACCENT : "#f59e0b"}
                        />
                        <span className="text-xs text-gray-500">
                          {evaluator.completed_count}/{evaluator.assignment_count}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5">
                      {evaluator.complete ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-dark">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ประเมินครบแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          <Hourglass className="h-3.5 w-3.5" />
                          ยังไม่ครบ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {summary.evaluators.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-gray-400"
                  >
                    ยังไม่มีผู้ประเมิน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target progress */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">ผู้ถูกประเมิน</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            สถานะการประเมินและคะแนนเฉลี่ยของแต่ละคน
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">ชื่อ</th>
                <th className="px-5 py-3 font-medium">ตำแหน่ง</th>
                <th className="px-5 py-3 font-medium">ประเมินครบ</th>
                <th className="px-5 py-3 font-medium">คะแนนเฉลี่ย</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {summary.targets.map((target) => {
                const pct =
                  target.assignment_count > 0
                    ? Math.round(
                        (target.completed_count / target.assignment_count) *
                          100,
                      )
                    : 0;

                const complete =
                  target.assignment_count > 0 &&
                  target.completed_count === target.assignment_count;

                return (
                  <tr key={target.target_id} className="hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-gray-900">
                      {target.name}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                      {target.position || "—"}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ProgressBar
                          percent={pct}
                          color={complete ? ACCENT : "#f59e0b"}
                        />
                        <span className="text-xs text-gray-500">
                          {target.completed_count}/{target.assignment_count}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5">
                      {target.average_score !== null &&
                      target.average_score !== undefined ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          <Star className="h-3.5 w-3.5" />
                          {target.average_score.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {summary.targets.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-gray-400"
                  >
                    ยังไม่มีผู้ถูกประเมิน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
