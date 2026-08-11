// BatchTargetList.tsx

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../../store/hooks";

import {
  fetchBatchTargets,
  clearBatchTargets,
  type BatchTarget,
  type TargetInstanceStatus,
} from "../../api/batchtargetSlice";

import ScoringDrawer from "./Scoringdraweb";
import { TargetRow } from "./TargetRow";

export default function BatchTargetList() {
  const { batchId } = useParams<{ batchId: string }>();

  const dispatch = useAppDispatch();

  const { targets, loading, error } = useAppSelector((s) => s.batchTarget);

  const [search, setSearch] = useState("");
  // ⬇️ ใหม่: ตัวกรอง "แสดงเฉพาะที่ฉันต้องให้คะแนน" — ตัดคนที่ไม่เกี่ยวกับเราออกจากสายตา
  const [onlyMine, setOnlyMine] = useState(false);

  // ⬇️ ใหม่: ยกสถานะ drawer ขึ้นมาที่ระดับบนสุด ใช้ตัวเดียวร่วมกันทั้งหน้า
  const [activeItem, setActiveItem] = useState<{
    target: BatchTarget;
    instance: TargetInstanceStatus;
  } | null>(null);

  useEffect(() => {
    if (batchId) dispatch(fetchBatchTargets(batchId));

    return () => {
      dispatch(clearBatchTargets());
    };
  }, [dispatch, batchId]);

  // ⬇️ ใหม่: รวมรายการที่ "ฉัน" ต้องให้คะแนนจากทุกคนไว้เป็นคิวเดียว
  // ไม่ต้องไล่เปิดทีละแถวเพื่อหาว่าใครยังรอเราอยู่บ้าง
  const pendingQueue = useMemo(
    () =>
      targets.flatMap((t) =>
        t.instances
          .filter((i) => i.my_assignment_id && i.my_status !== "submitted")
          .map((i) => ({ target: t, instance: i })),
      ),
    [targets],
  );

  const filtered = targets.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(q) || t.position.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (onlyMine) {
      return t.instances.some(
        (i) => i.my_assignment_id && i.my_status !== "submitted",
      );
    }
    return true;
  });

  const openScoring = (target: BatchTarget, instance: TargetInstanceStatus) =>
    setActiveItem({ target, instance });

  // ⬇️ ใหม่: หาตำแหน่งของรายการที่กำลังให้คะแนนอยู่ในคิว เพื่อทำปุ่มก่อนหน้า/ถัดไป
  const activeQueueIndex = activeItem
    ? pendingQueue.findIndex(
        (q) =>
          q.target.user_id === activeItem.target.user_id &&
          q.instance.instance_id === activeItem.instance.instance_id,
      )
    : -1;

  const goToQueueOffset = (offset: number) => {
    if (pendingQueue.length === 0) return;
    // ถ้ารายการปัจจุบันหลุดจากคิวไปแล้ว (เพิ่งให้คะแนนเสร็จ) ให้เริ่มนับจากหัว/ท้ายคิวใหม่แทน
    const baseIndex = activeQueueIndex === -1 ? -offset : activeQueueIndex;
    const nextIndex = baseIndex + offset;

    if (nextIndex < 0 || nextIndex >= pendingQueue.length) {
      setActiveItem(null);
      return;
    }
    setActiveItem(pendingQueue[nextIndex]);
  };

  return (
    <div
      className="
rounded-2xl
border
border-gray-200
bg-white
shadow-sm
"
    >
      <div className="p-5 border-b">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h2 className="font-semibold text-gray-900">
            รายชื่อผู้รับการประเมิน
          </h2>

          {/* ⬇️ ใหม่: จุดเข้าเดียวเข้าสู่คิวให้คะแนนของตัวเอง — ไม่ต้องหาเองว่าใครยังรออยู่ */}
          {pendingQueue.length > 0 && (
            <button
              onClick={() => setActiveItem(pendingQueue[0])}
              className="rounded-lg bg-[#2fae60] px-4 py-2 text-xs font-medium text-white hover:bg-[#218a4a] whitespace-nowrap"
            >
              ให้คะแนนต่อ ({pendingQueue.length} รายการรอ)
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search
              size={16}
              className="
absolute
left-3
top-1/2
-translate-y-1/2
text-gray-400
"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ..."
              className="
w-full
rounded-lg
border
border-gray-200
py-2
pl-9
text-sm
focus:border-[#2fae60]
outline-none
"
            />
          </div>

          {/* ⬇️ ใหม่: ตัดคนที่ไม่เกี่ยวกับเราออกจากสายตา ลดการไล่หาด้วยตา */}
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              className="accent-[#2fae60]"
            />
            แสดงเฉพาะที่ฉันต้องให้คะแนน
          </label>
        </div>
      </div>

      {loading && (
        <div className="p-10 text-center text-gray-400">กำลังโหลด...</div>
      )}

      {error && <div className="p-10 text-center text-red-500">{error}</div>}

      {!loading && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr
              className="
border-b
text-xs
uppercase
text-gray-400
"
            >
              <th className="px-4 py-3">ผู้รับการประเมิน</th>

              <th>จำนวน</th>

              <th>ความคืบหน้า</th>

              <th>สถานะ</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((target) => (
              <TargetRow
                key={target.user_id}
                target={target}
                forceOpen={activeItem?.target.user_id === target.user_id}
                activeInstanceId={
                  activeItem?.target.user_id === target.user_id
                    ? activeItem.instance.instance_id
                    : undefined
                }
                onScore={openScoring}
              />
            ))}
          </tbody>
        </table>
      )}

      {/* ⬇️ ใหม่: แถบก่อนหน้า/ถัดไปลอยอยู่ด้านล่าง ใช้ไล่ให้คะแนนทีละคนโดยไม่ต้องปิด drawer แล้วไปหาแถวถัดไปเอง
          z-[60] สูงกว่า drawer (สมมติ drawer อยู่ที่ z-50) เพื่อให้กดได้ตลอดตอน drawer เปิดอยู่ */}
      {activeItem && pendingQueue.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-full bg-gray-900/90 backdrop-blur px-4 py-2.5 text-xs text-white shadow-lg">
          <button
            onClick={() => goToQueueOffset(-1)}
            disabled={activeQueueIndex <= 0}
            className="flex items-center gap-1 disabled:opacity-30"
          >
            <ChevronLeft size={14} />
            ก่อนหน้า
          </button>

          <span className="text-gray-300">
            {activeQueueIndex === -1 ? "-" : activeQueueIndex + 1} /{" "}
            {pendingQueue.length}
          </span>

          <button
            onClick={() => goToQueueOffset(1)}
            className="flex items-center gap-1 font-medium"
          >
            ถัดไป
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <ScoringDrawer
        open={activeItem !== null}
        onClose={() => setActiveItem(null)}
        assignmentsId={activeItem?.instance.my_assignment_id ?? 0}
        targetUserId={activeItem?.target.user_id ?? 0}
        targetName={activeItem?.target.name ?? ""}
        instance={activeItem?.instance ?? null}
        onSubmitted={() => goToQueueOffset(1)}
      />
    </div>
  );
}
