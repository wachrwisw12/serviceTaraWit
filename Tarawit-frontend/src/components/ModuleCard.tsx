import { Link } from "react-router-dom";

type Accent = "blue" | "emerald" | "amber" | "rose" | "violet" | "cyan";

const ACCENT_STYLES: Record<
  Accent,
  { iconBg: string; iconText: string; hoverBorder: string; hoverBg: string }
> = {
  blue: {
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    hoverBorder: "group-hover:border-blue-200",
    hoverBg: "group-hover:bg-blue-50/50",
  },
  emerald: {
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    hoverBorder: "group-hover:border-emerald-200",
    hoverBg: "group-hover:bg-emerald-50/50",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    hoverBorder: "group-hover:border-amber-200",
    hoverBg: "group-hover:bg-amber-50/50",
  },
  rose: {
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    hoverBorder: "group-hover:border-rose-200",
    hoverBg: "group-hover:bg-rose-50/50",
  },
  violet: {
    iconBg: "bg-violet-50",
    iconText: "text-violet-600",
    hoverBorder: "group-hover:border-violet-200",
    hoverBg: "group-hover:bg-violet-50/50",
  },
  cyan: {
    iconBg: "bg-cyan-50",
    iconText: "text-cyan-600",
    hoverBorder: "group-hover:border-cyan-200",
    hoverBg: "group-hover:bg-cyan-50/50",
  },
};

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  accent?: Accent;
}

/**
 * การ์ดลิงก์ไปหน้าย่อยของโมดูล — ใช้ซ้ำได้ทั้งบนแดชบอร์ดและหน้า homepage ของแต่ละโมดูล
 */
export default function ModuleCard({
  icon,
  title,
  description,
  to,
  accent = "blue",
}: ModuleCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <Link
      to={to}
      className={`group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors ${styles.hoverBg} ${styles.hoverBorder}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      </div>
    </Link>
  );
}
