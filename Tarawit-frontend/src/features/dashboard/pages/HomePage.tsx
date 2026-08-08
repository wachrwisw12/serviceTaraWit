import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useNavigate } from "react-router-dom";

import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  FileEdit,
  Layers,
} from "lucide-react";

import {
  fetchAllEvaluationTasks,
  type MyEvaluationTask,
} from "../../evaluation/api/MyTaskSlice";

const STATUS_STYLES = {
  closed: {
    label: "เสร็จสิ้น",
    badge: "bg-[#2fae60]/10 text-[#218a4a]",
    icon: CheckCircle2,
    bar: "bg-[#2fae60]",
  },

  open: {
    label: "กำลังดำเนินการ",
    badge: "bg-amber-50 text-amber-700",
    icon: Clock3,
    bar: "bg-amber-500",
  },

  draft: {
    label: "แบบร่าง",
    badge: "bg-gray-100 text-gray-600",
    icon: FileEdit,
    bar: "bg-gray-400",
  },
} as const;

function EvaluationTaskCard({
  item,
  onOpen,
}: {
  item: MyEvaluationTask;
  onOpen: (batchId: string) => void;
}) {
  const title = item.title ?? "นิเทศการสอน";

  const academicYear = item.academic_year ?? 2569;

  const round = item.round ?? "-";

  const total = item.total_target ?? 0;

  const completed = item.completed_target ?? 0;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const remaining = Math.max(total - completed, 0);

  const status = item.status in STATUS_STYLES ? item.status : "open";

  const config = STATUS_STYLES[status];

  const StatusIcon = config.icon;

  return (
    <article
      className="
      rounded-xl
      border
      border-gray-200
      bg-white
      p-5
      transition
      hover:shadow-sm
      "
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div
            className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-lg
            bg-[#2fae60]/10
            text-[#2fae60]
            "
          >
            <ClipboardList size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>

            <p className="text-sm text-gray-500">
              ปี {academicYear}
              {" · "}
              รอบ {round}
            </p>

            <span
              className={`
              mt-2
              inline-flex
              items-center
              gap-1
              rounded-full
              px-2.5
              py-1
              text-xs
              font-medium
              ${config.badge}
              `}
            >
              <StatusIcon size={12} />
              {config.label}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(item.batch_id)}
          className="
          rounded-lg
          bg-[#2fae60]
          px-3
          py-2
          text-sm
          text-white
          hover:bg-[#218a4a]
          "
        >
          ดูรายชื่อ
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-500">ความคืบหน้า</span>

          <span className="font-semibold">
            {completed}/{total}
          </span>
        </div>

        <div
          className="
          h-2
          overflow-hidden
          rounded-full
          bg-gray-100
          "
        >
          <div
            className={`
            h-full
            rounded-full
            ${config.bar}
            `}
            style={{
              width: `${percent}%`,
            }}
          />
        </div>
      </div>

      <div
        className="
        mt-5
        grid
        grid-cols-2
        rounded-lg
        bg-gray-50
        p-3
        "
      >
        <div className="text-center">
          <p className="text-xs text-gray-500">เสร็จแล้ว</p>

          <p className="text-xl font-bold text-green-600">{completed}</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">เหลือ</p>

          <p className="text-xl font-bold text-orange-600">{remaining}</p>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div
      className="
      flex
      items-center
      gap-4
      rounded-2xl
      border
      border-gray-200
      bg-white
      p-5
      shadow-sm
      "
    >
      <div
        className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-xl
        bg-green-50
        text-green-600
        "
      >
        <Icon size={22} />
      </div>

      <div>
        <p className="text-sm text-gray-500">{label}</p>

        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function EvaluationAllPage() {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchAllEvaluationTasks());
  }, [dispatch]);

  const { allTasks, allLoading, allError } = useAppSelector(
    (state) => state.evaluationTask,
  );

  const openBatch = (batchId: string) => {
    navigate(`/evaluation/batches/${batchId}`);
  };

  const tasks = allTasks ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">การประเมินทั้งหมด</h1>

        <p className="mt-1 text-sm text-gray-500">รายการประเมินทุกชุดในระบบ</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={Layers} label="ทั้งหมด" value={tasks.length} />

        <SummaryCard
          icon={Clock3}
          label="กำลังดำเนินการ"
          value={tasks.filter((x) => x.status === "open").length}
        />

        <SummaryCard
          icon={CheckCircle2}
          label="เสร็จสิ้น"
          value={tasks.filter((x) => x.status === "closed").length}
        />
      </div>

      {allLoading && (
        <p className="py-6 text-center text-gray-400">กำลังโหลดข้อมูล...</p>
      )}

      {allError && !allLoading && (
        <p className="py-6 text-center text-red-500">{allError}</p>
      )}

      {!allLoading && !allError && (
        <section
          className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-sm
            "
        >
          <div
            className="
              border-b
              border-gray-100
              px-6
              py-4
              "
          >
            <h2
              className="
              flex
              items-center
              gap-2
              font-semibold
              "
            >
              <ClipboardList size={18} />
              รายการประเมินทั้งหมด
            </h2>
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-4
              p-6
              lg:grid-cols-2
              "
          >
            {tasks.length === 0 ? (
              <p
                className="
                    col-span-full
                    py-6
                    text-center
                    text-gray-400
                    "
              >
                ไม่มีรายการประเมิน
              </p>
            ) : (
              tasks.map((item) => (
                <EvaluationTaskCard
                  key={item.batch_id}
                  item={item}
                  onOpen={openBatch}
                />
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
