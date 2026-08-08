type Accent = "emerald" | "blue" | "amber" | "rose";

interface QuickActionItem {
  label: string;
  icon: React.ReactNode;
  accent: Accent;
  onClick?: () => void;
}

function TemplateIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7.914a2 2 0 00-.586-1.414l-3.914-3.914A2 2 0 0012.086 2H4z" />
    </svg>
  );
}
function AssessmentIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M6 3a1 1 0 00-1 1v1H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6zm2 4a1 1 0 000 2h4a1 1 0 100-2H8z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function ImportIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6.293-3.707a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L11 10.172V3a1 1 0 10-2 0v7.172L6.707 7.879a1 1 0 10-1.414 1.414l4 4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6zM8 7a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}

// สีตามหมวดเดียวกับการ์ดสรุปบนแดชบอร์ด (emerald = แม่แบบ, blue = การประเมิน,
// amber = บุคลากร, rose = รายงาน) ให้ผู้ใช้จับคู่หมวดหมู่ได้จากสีเดียวกันทั้งหน้า
const ACCENT_STYLES: Record<
  Accent,
  { iconBg: string; iconText: string; hoverBg: string; hoverBorder: string }
> = {
  emerald: {
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    hoverBg: "group-hover:bg-emerald-50/60",
    hoverBorder: "group-hover:border-emerald-200",
  },
  blue: {
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    hoverBg: "group-hover:bg-blue-50/60",
    hoverBorder: "group-hover:border-blue-200",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    hoverBg: "group-hover:bg-amber-50/60",
    hoverBorder: "group-hover:border-amber-200",
  },
  rose: {
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    hoverBg: "group-hover:bg-rose-50/60",
    hoverBorder: "group-hover:border-rose-200",
  },
};

const actions: QuickActionItem[] = [
  { label: "สร้างแม่แบบ", icon: <TemplateIcon />, accent: "emerald" },
  { label: "สร้างการประเมิน", icon: <AssessmentIcon />, accent: "blue" },
  { label: "นำเข้าบุคลากร", icon: <ImportIcon />, accent: "amber" },
  { label: "รายงาน", icon: <ReportIcon />, accent: "rose" },
];

export default function QuickAction() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-5">เมนูลัด</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map(({ label, icon, accent, onClick }) => {
          const styles = ACCENT_STYLES[accent];
          return (
            <button
              key={label}
              onClick={onClick}
              className={`group flex flex-col items-center justify-center gap-2.5 rounded-lg border border-gray-100 h-28 text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${styles.hoverBg} ${styles.hoverBorder}`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${styles.iconBg} ${styles.iconText}`}
              >
                {icon}
              </span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
