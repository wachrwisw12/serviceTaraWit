import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  ContactRound,
  Settings,
  UsersRound,
} from "lucide-react";

import type { MenuItem } from "../../../types/menu";

type MenuVisual = {
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  iconClass: string;
  iconBg: string;
  description: string;
};

const DEFAULT_VISUAL: MenuVisual = {
  icon: ClipboardCheck,
  iconClass: "text-blue-600",
  iconBg: "bg-blue-50",
  description: "เปิดใช้งานและจัดการข้อมูลในส่วนนี้",
};

const MENU_VISUALS: Record<string, MenuVisual> = {
  attendance: {
    icon: Clock3,
    iconClass: "text-cyan-600",
    iconBg: "bg-cyan-50",
    description: "ลงเวลาและตรวจสอบสรุปการมาปฏิบัติงาน",
  },
  evaluation: {
    icon: ClipboardCheck,
    iconClass: "text-blue-600",
    iconBg: "bg-blue-50",
    description: "จัดการงานนิเทศ แบบประเมิน และผลการประเมิน",
  },
  iqa: {
    icon: BadgeCheck,
    iconClass: "text-violet-600",
    iconBg: "bg-violet-50",
    description: "ติดตามรอบและหลักฐานการประกันคุณภาพ",
  },
  "user-management": {
    icon: UsersRound,
    iconClass: "text-emerald-600",
    iconBg: "bg-emerald-50",
    description: "ดูแลบัญชีผู้ใช้ บทบาท และสิทธิ์เข้าถึง",
  },
  personnel: {
    icon: ContactRound,
    iconClass: "text-fuchsia-600",
    iconBg: "bg-fuchsia-50",
    description: "ค้นหาและจัดการข้อมูลบุคลากรของโรงเรียน",
  },
  report: {
    icon: BarChart3,
    iconClass: "text-orange-600",
    iconBg: "bg-orange-50",
    description: "ดูภาพรวม ตัวชี้วัด และรายงานสำหรับผู้บริหาร",
  },
  setting: {
    icon: Settings,
    iconClass: "text-slate-600",
    iconBg: "bg-slate-100",
    description: "กำหนดข้อมูลโรงเรียนและค่าพื้นฐานของระบบ",
  },
};

type MainMenuSectionProps = {
  items: MenuItem[];
};

export default function MainMenuSection({ items }: MainMenuSectionProps) {
  return (
    <section className="rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_40px_rgba(38,85,135,0.08)] sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
            ทางลัดของคุณ
          </p>
          <h2 className="mt-1 text-lg font-bold text-[#132b47]">
            ระบบงานและโมดูลหลัก
          </h2>
        </div>
        <span className="hidden text-xs text-slate-400 sm:block">
          แสดงตามสิทธิ์การใช้งาน
        </span>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const visual = MENU_VISUALS[item.id] ?? DEFAULT_VISUAL;
            const Icon = visual.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                className="group flex min-h-[118px] items-start gap-3 rounded-2xl border border-slate-100 bg-[#f8fbff] p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-[0_12px_26px_rgba(31,92,155,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] ${visual.iconBg} ${visual.iconClass}`}>
                  <Icon size={22} strokeWidth={2.1} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-[#18324f]">
                    {item.label}
                    <ChevronRight size={15} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                  </span>
                  <span className="mt-1.5 block text-xs leading-5 text-slate-500">{visual.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
          ยังไม่มีโมดูลที่เปิดให้ใช้งาน
        </div>
      )}
    </section>
  );
}
