import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  ChevronRight,
  Award,
  BookOpen,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { fetchTree, fetchCycles, fetchQualityLevels } from "../api/iqaSlice";

const STATUS_CONFIG = {
  DRAFT: {
    label: "แบบร่าง",
    className: "bg-gray-100 text-gray-600",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    className: "bg-amber-50 text-amber-700",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    className: "bg-emerald-50 text-emerald-700",
  },
} as const;

const STANDARD_ICONS = [Award, BookOpen, GraduationCap];

export default function IQAHomePage() {
  useDocumentTitle("การประกันคุณภาพภายในสถานศึกษา");
  const dispatch = useAppDispatch();
  const { tree, cycles, qualityLevels, loading } = useAppSelector(
    (s) => s.iqa,
  );

  useEffect(() => {
    dispatch(fetchTree());
    dispatch(fetchCycles());
    dispatch(fetchQualityLevels());
  }, [dispatch]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <ClipboardCheck className="h-5 w-5 text-primary-dark" />
            การประกันคุณภาพภายในสถานศึกษา
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            มาตรฐานการประกันคุณภาพภายใน ประเมินและติดตามผล
          </p>
        </div>
        <Link
          to="/iqa/cycles"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <BarChart3 className="h-4 w-4" />
          ดูรอบการประกันคุณภาพ
        </Link>
      </div>

      {/* Quality Levels Legend */}
      {qualityLevels.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            เกณฑ์การให้คะแนน
          </h3>
          <div className="flex flex-wrap gap-3">
            {qualityLevels.map((level) => (
              <div
                key={level.id}
                className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: level.color }}
                />
                <span className="text-xs font-medium text-gray-700">
                  {level.score} — {level.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standards */}
      {loading && tree.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-sm text-gray-400">
          กำลังโหลดข้อมูล...
        </div>
      ) : (
        <div className="space-y-4">
          {tree.map((standard, idx) => {
            const Icon = STANDARD_ICONS[idx] ?? Award;
            const totalIndicators = standard.criteria.reduce(
              (sum, c) => sum + c.indicators.length,
              0,
            );

            return (
              <div
                key={standard.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                {/* Standard header */}
                <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/50 px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary-dark">
                        มาตรฐานที่ {standard.code}
                      </span>
                      <span className="text-xs text-gray-400">
                        {totalIndicators} ตัวชี้วัด
                      </span>
                    </div>
                    <h2 className="mt-1 text-base font-semibold text-gray-900">
                      {standard.name}
                    </h2>
                  </div>
                </div>

                {/* Criteria */}
                <div className="divide-y divide-gray-100">
                  {standard.criteria.map((criterion) => (
                    <div key={criterion.id} className="px-5 py-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-gray-600">
                          {criterion.code}
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          {criterion.name}
                        </span>
                      </div>

                      {/* Indicators */}
                      <div className="ml-4 space-y-1.5">
                        {criterion.indicators.map((indicator) => (
                          <div
                            key={indicator.id}
                            className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          >
                            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                            <div>
                              <span className="mr-1.5 font-mono text-xs text-gray-400">
                                {indicator.code}
                              </span>
                              {indicator.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Cycles */}
      {cycles.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              รอบการประกันคุณภาพล่าสุด
            </h3>
            <Link
              to="/iqa/cycles"
              className="text-xs font-semibold text-primary-dark hover:underline"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <div className="space-y-2">
            {cycles.slice(0, 3).map((cycle) => {
              const config =
                STATUS_CONFIG[cycle.status] ?? STATUS_CONFIG.DRAFT;
              return (
                <Link
                  key={cycle.id}
                  to={`/iqa/cycles/${cycle.id}`}
                  className="group flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {cycle.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ปีการศึกษา {cycle.academic_year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
                    >
                      {config.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
