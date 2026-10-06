import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  ChevronRight,
  ClipboardCheck,
  BarChart3,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import {
  fetchAssessments,
  fetchSchoolSummary,
  getOrCreateAssessment,
} from "../api/iqaSlice";

const STATUS_CONFIG = {
  DRAFT: {
    label: "ยังไม่เริ่ม",
    className: "bg-gray-100 text-gray-600",
  },
  IN_PROGRESS: {
    label: "กำลังทำ",
    className: "bg-amber-50 text-amber-700",
  },
  SUBMITTED: {
    label: "ส่งแล้ว",
    className: "bg-emerald-50 text-emerald-700",
  },
} as const;

const LEVEL_COLORS: Record<string, string> = {
  "ดีเลิศ": "bg-emerald-500",
  "ดี": "bg-blue-500",
  "พอใช้": "bg-amber-500",
  "ปรับปรุง": "bg-red-500",
};

export default function IQACycleDetailPage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  useDocumentTitle("รายละเอียดรอบการประกันคุณภาพ");

  const { cycles, assessments, schoolSummary, loading } = useAppSelector(
    (s) => s.iqa,
  );

  const cycle = cycles.find((c) => c.id === Number(cycleId));

  useEffect(() => {
    if (!cycleId) return;
    dispatch(fetchAssessments(Number(cycleId)));
    dispatch(fetchSchoolSummary(Number(cycleId)));
  }, [cycleId, dispatch]);

  const handleStartAssessment = async () => {
    if (!cycleId) return;
    const res = await dispatch(getOrCreateAssessment(Number(cycleId)));
    if (getOrCreateAssessment.fulfilled.match(res)) {
      navigate(`/iqa/assess/${res.payload.id}`);
    }
  };

  const totalIndicators = schoolSummary.length;
  const avgAll =
    totalIndicators > 0
      ? schoolSummary.reduce((sum, s) => sum + s.avg_score, 0) /
        totalIndicators
      : 0;

  const getOverallLevel = (avg: number) => {
    if (avg >= 3.5) return "ดีเลิศ";
    if (avg >= 2.5) return "ดี";
    if (avg >= 1.5) return "พอใช้";
    return "ปรับปรุง";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/iqa/cycles")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {cycle?.name || "รอบการประกันคุณภาพ"}
          </h1>
          <p className="text-sm text-gray-500">
            ปีการศึกษา {cycle?.academic_year} · สถานะ:{" "}
            {cycle?.status}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {assessments.length}
          </p>
          <p className="text-xs text-gray-500">ผู้ประเมินทั้งหมด</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {assessments.filter((a) => a.status === "SUBMITTED").length}
          </p>
          <p className="text-xs text-gray-500">ส่งแล้ว</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {assessments.filter((a) => a.status !== "SUBMITTED").length}
          </p>
          <p className="text-xs text-gray-500">ยังไม่ส่ง</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {avgAll > 0 ? avgAll.toFixed(2) : "-"}
          </p>
          <p className="text-xs text-gray-500">
            เฉลี่ย {totalIndicators} ตัวชี้วัด
          </p>
        </div>
      </div>

      {/* Start my assessment */}
      <button
        onClick={handleStartAssessment}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 py-5 text-sm font-semibold text-primary-dark transition-colors hover:border-primary/60 hover:bg-primary/10"
      >
        <ClipboardCheck className="h-5 w-5" />
        เริ่ม/ทำต่อ การประกันคุณภาพของฉัน
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Assessments list */}
      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Users className="h-4 w-4 text-primary" />
            รายการผู้ประเมิน ({assessments.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            กำลังโหลด...
          </div>
        ) : assessments.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            ยังไม่มีผู้ประเมิน
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {assessments.map((a) => {
              const config =
                STATUS_CONFIG[a.status] ?? STATUS_CONFIG.DRAFT;

              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {a.assessor_name || `ผู้ใช้ #${a.assessor_id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {a.avg_score != null
                        ? `เฉลี่ย ${a.avg_score.toFixed(2)} คะแนน`
                        : "ยังไม่มีคะแนน"}
                      {a.quality_level && ` · ${a.quality_level}`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* School Summary */}
      {schoolSummary.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <BarChart3 className="h-4 w-4 text-primary" />
            สรุปผลระดับโรงเรียน ({schoolSummary.length} ตัวชี้วัด)
          </h3>

          {/* Overall level */}
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-gray-50 p-4">
            <div
              className={`h-4 w-4 rounded-full ${
                LEVEL_COLORS[getOverallLevel(avgAll)] ?? "bg-gray-400"
              }`}
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                ระดับคุณภาพรวม: {getOverallLevel(avgAll)}
              </p>
              <p className="text-xs text-gray-500">
                คะแนนเฉลี่ย {avgAll.toFixed(2)} / 4.00
              </p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="space-y-2">
            {schoolSummary.slice(0, 15).map((s) => (
              <div key={s.indicator_id} className="flex items-center gap-3">
                <div className="w-16 shrink-0 text-right text-[10px] text-gray-400">
                  #{s.indicator_id}
                </div>
                <div className="flex-1">
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        LEVEL_COLORS[s.quality_level] ?? "bg-gray-400"
                      }`}
                      style={{
                        width: `${(s.avg_score / 4) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-20 shrink-0 text-right text-xs font-medium text-gray-700">
                  {s.avg_score.toFixed(2)}
                  <span className="ml-1 text-[10px] text-gray-400">
                    ({s.assessor_count})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
