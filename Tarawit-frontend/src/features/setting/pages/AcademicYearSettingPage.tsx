import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import {
  createAcademicYear,
  deleteAcademicYear,
  fetchAcademicYears,
  setCurrentYear,
  updateAcademicYear,
} from "../api/settingSlice";
import type { AcademicYear } from "../settingType";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AcademicYearSettingPage() {
  const dispatch = useAppDispatch();
  const snackbar = useSnackbar();

  const { academicYears, loading, saving } = useAppSelector(
    (state) => state.setting,
  );

  const [newYear, setNewYear] = useState("");
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [editYear, setEditYear] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AcademicYear | null>(null);

  useEffect(() => {
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  const current = academicYears.find((y) => y.is_current);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    const year = Number(newYear);
    if (!newYear.trim() || Number.isNaN(year)) {
      snackbar.showSnackbar("กรุณาระบุปีการศึกษา", "error");
      return;
    }

    const res = await dispatch(createAcademicYear({ year }));

    if (createAcademicYear.fulfilled.match(res)) {
      snackbar.showSnackbar("เพิ่มปีการศึกษาแล้ว", "success");
      setNewYear("");
      dispatch(fetchAcademicYears());
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "เพิ่มไม่สำเร็จ",
        "error",
      );
    }
  }

  async function handleSetCurrent(year: AcademicYear) {
    const res = await dispatch(setCurrentYear(year.id));
    if (setCurrentYear.fulfilled.match(res)) {
      snackbar.showSnackbar(
        `ตั้งปี ${year.year} เป็นปีการศึกษาปัจจุบันแล้ว`,
        "success",
      );
      dispatch(fetchAcademicYears());
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "ตั้งปีปัจจุบันไม่สำเร็จ",
        "error",
      );
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    const year = Number(editYear);
    if (!editYear.trim() || Number.isNaN(year)) {
      snackbar.showSnackbar("กรุณาระบุปีการศึกษา", "error");
      return;
    }

    const res = await dispatch(updateAcademicYear({ id: editing.id, year }));

    if (updateAcademicYear.fulfilled.match(res)) {
      snackbar.showSnackbar("บันทึกปีการศึกษาแล้ว", "success");
      setEditing(null);
      dispatch(fetchAcademicYears());
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "บันทึกไม่สำเร็จ",
        "error",
      );
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;

    const res = await dispatch(deleteAcademicYear(confirmDelete.id));

    if (deleteAcademicYear.fulfilled.match(res)) {
      snackbar.showSnackbar("ลบปีการศึกษาแล้ว", "success");
      setConfirmDelete(null);
      dispatch(fetchAcademicYears());
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "ลบไม่สำเร็จ",
        "error",
      );
      setConfirmDelete(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <CalendarDays className="h-5 w-5 text-primary-dark" />
          ปีการศึกษา
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          จัดการปีการศึกษาที่ใช้งานในระบบ{" "}
          {current && (
            <span className="font-medium text-primary-dark">
              — ปีปัจจุบัน: {current.year}
            </span>
          )}
        </p>
      </div>

      {/* เพิ่มปีใหม่ */}
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
      >
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            เพิ่มปีการศึกษาใหม่
          </label>
          <input
            type="number"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            placeholder="เช่น 2570"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:mt-6"
        >
          <Plus className="h-4 w-4" />
          เพิ่มปีการศึกษา
        </button>
      </form>

      {/* รายการปี */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังโหลดข้อมูล...
          </div>
        ) : academicYears.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">
            ยังไม่มีปีการศึกษาในระบบ
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {academicYears.map((year) => (
              <li
                key={year.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      year.is_current
                        ? "bg-primary/10 text-primary-dark"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {String(year.year).slice(-2)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">
                      ปีการศึกษา {year.year}
                    </p>
                    <p className="text-xs text-gray-400">
                      เพิ่มเมื่อ{" "}
                      {new Date(year.created_at).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {year.is_current && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary-dark">
                      <Star className="h-3 w-3 fill-current" />
                      ปีปัจจุบัน
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {!year.is_current && (
                    <button
                      onClick={() => handleSetCurrent(year)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary-dark disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      ตั้งเป็นปีปัจจุบัน
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditing(year);
                      setEditYear(String(year.year));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary-dark"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => setConfirmDelete(year)}
                    disabled={year.is_current}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ลบ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dialog แก้ไขปี */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">แก้ไขปีการศึกษา</h2>
              <button
                onClick={() => setEditing(null)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                aria-label="ปิด"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  ปีการศึกษา (พ.ศ.)
                </label>
                <input
                  type="number"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm ลบ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              ลบปีการศึกษา
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              ต้องการลบปีการศึกษา{" "}
              <span className="font-medium text-gray-800">
                {confirmDelete.year}
              </span>{" "}
              หรือไม่?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                ลบปีการศึกษา
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
