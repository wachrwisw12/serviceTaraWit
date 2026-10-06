import { useEffect, useState } from "react";
import { Gauge, Loader2, Save } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import { fetchScoreLevels, updateScoreLevel } from "../api/settingSlice";
import type { ScoreLevel } from "../settingType";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function ScoringSettingPage() {
  const dispatch = useAppDispatch();
  const snackbar = useSnackbar();

  const { scoreLevels, loading, saving } = useAppSelector(
    (state) => state.setting,
  );

  // สถานะการแก้ไขเฉพาะหน้าของแต่ละระดับ (id -> ข้อมูล)
  const [drafts, setDrafts] = useState<Record<number, ScoreLevel>>({});

  useEffect(() => {
    dispatch(fetchScoreLevels());
  }, [dispatch]);

  function draftOf(level: ScoreLevel): ScoreLevel {
    return drafts[level.id] ?? level;
  }

  function setDraft(id: number, patch: Partial<ScoreLevel>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? scoreLevels.find((l) => l.id === id)!), ...patch },
    }));
  }

  const isDirty = (level: ScoreLevel) => {
    const d = drafts[level.id];
    if (!d) return false;
    return (
      d.label !== level.label ||
      d.color !== level.color ||
      d.text_color !== level.text_color ||
      d.is_active !== level.is_active
    );
  };

  async function handleSaveLevel(level: ScoreLevel) {
    const d = draftOf(level);

    if (!d.label.trim()) {
      snackbar.showSnackbar("กรุณาระบุชื่อระดับ", "error");
      return;
    }

    const res = await dispatch(
      updateScoreLevel({
        id: level.id,
        data: {
          label: d.label.trim(),
          color: d.color,
          text_color: d.text_color,
          is_active: d.is_active,
        },
      }),
    );

    if (updateScoreLevel.fulfilled.match(res)) {
      snackbar.showSnackbar("บันทึกระดับคะแนนแล้ว", "success");
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[level.id];
        return next;
      });
      dispatch(fetchScoreLevels());
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "บันทึกไม่สำเร็จ",
        "error",
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Gauge className="h-5 w-5 text-primary-dark" />
          ตั้งค่าคะแนน
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          ตั้งค่าเกณฑ์ระดับคะแนน (สเกล 5-1) ที่ใช้ในการให้คะแนนและการแสดงผล
          ทุกหน้า
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading && scoreLevels.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {scoreLevels.map((level) => {
              const d = draftOf(level);
              const dirty = isDirty(level);

              return (
                <li key={level.id} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    {/* ตัวอย่างสี + คะแนน */}
                    <div className="flex shrink-0 items-center gap-3 md:w-40">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold"
                        style={{
                          backgroundColor: d.color,
                          color: d.text_color,
                        }}
                      >
                        {d.score}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          ระดับ {d.score}
                        </p>
                        <p className="text-xs text-gray-400">
                          {d.is_active ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                        </p>
                      </div>
                    </div>

                    {/* ตัวแก้ไข */}
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          ชื่อระดับ
                        </label>
                        <input
                          value={d.label}
                          onChange={(e) =>
                            setDraft(level.id, { label: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          สีพื้นหลัง
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={d.color}
                            onChange={(e) =>
                              setDraft(level.id, { color: e.target.value })
                            }
                            className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
                          />
                          <input
                            value={d.color}
                            onChange={(e) =>
                              setDraft(level.id, { color: e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          สีตัวเลข
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={d.text_color}
                            onChange={(e) =>
                              setDraft(level.id, { text_color: e.target.value })
                            }
                            className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
                          />
                          <input
                            value={d.text_color}
                            onChange={(e) =>
                              setDraft(level.id, { text_color: e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={d.is_active}
                            onChange={(e) =>
                              setDraft(level.id, { is_active: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
                          />
                          ใช้ระดับนี้ในการให้คะแนน
                        </label>
                      </div>
                    </div>

                    {/* บันทึก */}
                    <div className="flex shrink-0 items-center justify-end md:items-start">
                      <button
                        onClick={() => handleSaveLevel(level)}
                        disabled={saving || !dirty}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Save className="h-4 w-4" />
                        {dirty ? "บันทึก" : "บันทึกแล้ว"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 px-5 py-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700">หมายเหตุ</p>
        <p className="mt-1 leading-relaxed">
          การแก้ไขระดับคะแนนที่นี่จะส่งผลทันทีกับหน้าประเมินและหน้าสรุปผลทุกหน้า
          (ชื่อระดับ สีพื้นหลัง และสีตัวเลข)
        </p>
      </div>
    </div>
  );
}
