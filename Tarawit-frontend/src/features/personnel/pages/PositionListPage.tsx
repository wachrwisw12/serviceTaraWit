import { useEffect, useState } from "react";
import {
  Briefcase,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import {
  createPosition,
  deletePosition,
  fetchPositions,
  updatePosition,
} from "../api/personnelSlice";
import type { Position } from "../personnelType";

interface DialogState {
  open: boolean;
  editing: Position | null;
  code: string;
  name: string;
  level: string;
}

const emptyDialog: DialogState = {
  open: false,
  editing: null,
  code: "",
  name: "",
  level: "0",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function PositionListPage() {
  const dispatch = useAppDispatch();
  const snackbar = useSnackbar();

  const { positions, loading, saving } = useAppSelector(
    (state) => state.personnel,
  );

  const [dialog, setDialog] = useState<DialogState>(emptyDialog);
  const [confirmDelete, setConfirmDelete] = useState<Position | null>(null);

  useEffect(() => {
    dispatch(fetchPositions());
  }, [dispatch]);

  function openCreate() {
    setDialog({ ...emptyDialog, open: true });
  }

  function openEdit(position: Position) {
    setDialog({
      open: true,
      editing: position,
      code: position.code,
      name: position.name_th,
      level: String(position.level ?? 0),
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      code: dialog.code.trim(),
      name_th: dialog.name.trim(),
      level: Number(dialog.level) || 0,
    };

    if (!payload.code || !payload.name_th) {
      snackbar.showSnackbar("กรุณาระบุรหัสและชื่อตำแหน่ง", "error");
      return;
    }

    let res;
    if (dialog.editing) {
      res = await dispatch(
        updatePosition({ id: dialog.editing.id, data: payload }),
      );
    } else {
      res = await dispatch(createPosition(payload));
    }

    if (createPosition.fulfilled.match(res) || updatePosition.fulfilled.match(res)) {
      snackbar.showSnackbar("บันทึกตำแหน่งสำเร็จ", "success");
      setDialog(emptyDialog);
      dispatch(fetchPositions());
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "บันทึกไม่สำเร็จ",
        "error",
      );
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;

    const res = await dispatch(deletePosition(confirmDelete.id));

    if (deletePosition.fulfilled.match(res)) {
      snackbar.showSnackbar("ลบตำแหน่งสำเร็จ", "success");
      setConfirmDelete(null);
      dispatch(fetchPositions());
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "ลบไม่สำเร็จ",
        "error",
      );
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            ตำแหน่ง/วิทยฐานะ
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            จัดการตำแหน่งและวิทยฐานะของบุคลากร ทั้งหมด {positions.length} ตำแหน่ง
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          เพิ่มตำแหน่ง
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">รหัส</th>
                <th className="px-5 py-3">ชื่อตำแหน่ง</th>
                <th className="px-5 py-3">ระดับ</th>
                <th className="px-5 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-medium text-gray-600">
                      {p.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-dark">
                        <Briefcase className="h-4 w-4" />
                      </span>
                      {p.name_th}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {p.level ?? 0}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary-dark"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setConfirmDelete(p)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-14 text-center">
                    <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
                  </td>
                </tr>
              )}

              {!loading && positions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Briefcase className="h-8 w-8 text-gray-300" />
                      <p className="text-sm">ยังไม่มีตำแหน่งในระบบ</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog เพิ่ม/แก้ไข */}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                {dialog.editing ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่ง"}
              </h2>
              <button
                onClick={() => setDialog(emptyDialog)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                aria-label="ปิด"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  รหัสตำแหน่ง *
                </label>
                <input
                  value={dialog.code}
                  onChange={(e) =>
                    setDialog((d) => ({ ...d, code: e.target.value }))
                  }
                  placeholder="เช่น TEACHER, DIRECTOR"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  ชื่อตำแหน่ง *
                </label>
                <input
                  value={dialog.name}
                  onChange={(e) =>
                    setDialog((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="เช่น ครู วิทยฐานะ ครูชำนาญการ"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  ระดับ
                </label>
                <input
                  type="number"
                  value={dialog.level}
                  onChange={(e) =>
                    setDialog((d) => ({ ...d, level: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setDialog(emptyDialog)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
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
              ลบตำแหน่ง
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              ต้องการลบตำแหน่ง{" "}
              <span className="font-medium text-gray-800">
                {confirmDelete.name_th}
              </span>{" "}
              หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
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
                ลบตำแหน่ง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
