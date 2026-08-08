type ActivityType = "template" | "evaluation" | "submission" | "import";

interface Activity {
  id: string;
  type: ActivityType;
  text: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "template",
    text: "สร้างแม่แบบ ประเมินครู ปี 2569",
    time: "10 นาทีที่แล้ว",
  },
  {
    id: "2",
    type: "evaluation",
    text: "เปิดการประเมิน รอบที่ 1",
    time: "1 ชั่วโมงที่แล้ว",
  },
  {
    id: "3",
    type: "submission",
    text: "ครูสมชาย ส่งผลการประเมิน",
    time: "3 ชั่วโมงที่แล้ว",
  },
  {
    id: "4",
    type: "import",
    text: "นำเข้าบุคลากร 120 คน",
    time: "เมื่อวาน",
  },
];

const TYPE_STYLES: Record<
  ActivityType,
  { iconBg: string; iconText: string; icon: string; fillRule?: "evenodd" }
> = {
  template: {
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    icon: "M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7.914a2 2 0 00-.586-1.414l-3.914-3.914A2 2 0 0012.086 2H4z",
  },
  evaluation: {
    iconBg: "bg-violet-50",
    iconText: "text-violet-600",
    icon: "M6 3a1 1 0 00-1 1v1H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6zm2 4a1 1 0 000 2h4a1 1 0 100-2H8z",
    fillRule: "evenodd",
  },
  submission: {
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    icon: "M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414L8.5 12.086l6.79-6.795a1 1 0 011.414 0z",
    fillRule: "evenodd",
  },
  import: {
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    icon: "M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z",
  },
};

function ActivityIcon({ type }: { type: ActivityType }) {
  const styles = TYPE_STYLES[type];
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.iconBg} ${styles.iconText}`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          d={styles.icon}
          fillRule={styles.fillRule}
          clipRule={styles.fillRule}
        />
      </svg>
    </span>
  );
}

export default function RecentActivity() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900">กิจกรรมล่าสุด</h3>
        <button
          type="button"
          className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          ดูทั้งหมด
        </button>
      </div>

      <div className="space-y-0.5">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex items-start gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-slate-50 transition-colors ${
              index !== activities.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <ActivityIcon type={activity.type} />
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm text-gray-800 leading-snug">
                {activity.text}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
