import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Plus,
  ChevronRight,
  Play,
  CheckCircle2,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import {
  fetchCycles,
  createCycle,
  updateCycleStatus,
} from "../api/iqaSlice";

const STATUS_CONFIG = {
  DRAFT: {
    label: "แบบร่าง",
    icon: Clock,
    className: "bg-gray-100 text-gray-600",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    icon: Play,
    className: "bg-amber-50 text-amber-700",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700",
  },
} as const;

export default function IQACycleListPage() {
  useDocumentTitle("รอบการประกันคุณภาพ ป.ม.");
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { cycles, loading } = useAppSelector((s) => s.iqa);

  const [showCreate, setShowCreate] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear() + 543);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchCycles());
  }, [dispatch]);

  const handleCreate = async () => {
    setCreating(true);
    const res = await dispatch(
      createCycle({
        academic_year: newYear,
        name: newName || `รอบการประกันคุณภาพ ป.ม. ${newYear}`,
      }),
    );
    setCreating(false);

    if (createCycle.fulfilled.match(res)) {
      showSnackbar("สร้างรอบสำเร็จ", "success");
      setShowCreate(false);
      setNewName("");
      dispatch(fetchCycles());
    } else {
      showSnackbar((res.payload as string) || "สร้างไม่สำเร็จ", "error");
    }
  };

  const handleStatusChange = async (
    cycleId: number,
    newStatus: string,
  ) => {
    const res = await dispatch(
      updateCycleStatus({ id: cycleId, status: newStatus }),
    );
    if (updateCycleStatus.fulfilled.match(res)) {
      showSnackbar("เปลี่ยนสถานะสำเร็จ", "success");
      dispatch(fetchCycles());
    } else {
      showSnackbar((res.payload as string) || "เปลี่ยนสถานะไม่สำเร็จ", "error");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <CalendarDays className="h-5 w-5 text-primary-dark" />
            รอบการประกันคุณภาพ ป.ม.
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            จัดการรอบการประกันคุณภาพภายในสถานศึกษา
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          สร้างรอบใหม่
        </button>
      </div>

      {/* Cycle list */}
      {loading && cycles.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-sm text-gray-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          กำลังโหลด...
        </div>
      ) : cycles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            ยังไม่มีรอบการประกันคุณภาพ
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-sm font-medium text-primary-dark hover:underline"
          >
            สร้างรอบแรก
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle) => {
            const config =
              STATUS_CONFIG[cycle.status] ?? STATUS_CONFIG.DRAFT;
            const StatusIcon = config.icon;

            return (
              <div
                key={cycle.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {cycle.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      ปีการศึกษา {cycle.academic_year}
                      {cycle.start_date && ` · เริ่ม ${cycle.start_date}`}
                      {cycle.end_date && ` · สิ้นสุด ${cycle.end_date}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status actions */}
                    {cycle.status === "DRAFT" && (
                      <button
                        onClick={() =>
                          handleStatusChange(cycle.id, "IN_PROGRESS")
                        }
                        className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                      >
                        <Play className="h-3 w-3" />
                        เปิดรอบ
                      </button>
                    )}
                    {cycle.status === "IN_PROGRESS" && (
                      <button
                        onClick={() =>
                          handleStatusChange(cycle.id, "COMPLETED")
                        }
                        className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        ปิดรอบ
                      </button>
                    )}

                    <Link
                      to={`/iqa/cycles/${cycle.id}`}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      ดูรายละเอียด
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create cycle dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                สร้างรอบการประกันคุณภาพใหม่
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  ปีการศึกษา
                </label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  ชื่อรอบ (ถ้าไม่ระบุ จะใช้ค่า默认)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`รอบการประกันคุณภาพ ป.ม. ${newYear}`}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                สร้าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
