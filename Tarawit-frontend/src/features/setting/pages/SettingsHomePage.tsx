import {
  Building2,
  CalendarDays,
  Gauge,
  PanelsTopLeft,
  Settings,
} from "lucide-react";

import ModuleHero from "../../../components/ModuleHero";
import ModuleCard from "../../../components/ModuleCard";
import { Permission } from "../../../store/hooks/permission";
import { useAppSelector } from "../../../store/hooks";

const MODULE_LINKS = [
  {
    title: "การเปิดใช้งานโมดูล",
    description: "เปิดหรือปิดส่วนงานที่แสดงบนเว็บไซต์และแอปมือถือ",
    path: "/settings/modules",
    permission: Permission.SETTING_MANAGE,
    icon: <PanelsTopLeft size={22} />,
    accent: "blue" as const,
  },
  {
    title: "ข้อมูลโรงเรียน",
    description: "ตั้งค่าชื่อโรงเรียน ที่อยู่ สังกัด และรายละเอียดหน่วยงาน",
    path: "/settings/school",
    permission: Permission.SETTING_SCHOOL,
    icon: <Building2 size={22} />,
    accent: "blue" as const,
  },
  {
    title: "ปีการศึกษา",
    description: "จัดการปีการศึกษาและรอบการประเมิน",
    path: "/settings/academic-year",
    permission: Permission.SETTING_ACADEMIC,
    icon: <CalendarDays size={22} />,
    accent: "emerald" as const,
  },
  {
    title: "ตั้งค่าคะแนน",
    description: "กำหนดเกณฑ์และการแปลงระดับคะแนน",
    path: "/settings/scoring",
    permission: Permission.SETTING_SCORING,
    icon: <Gauge size={22} />,
    accent: "amber" as const,
  },
];

export default function SettingsHomePage() {
  const permissionList = useAppSelector(
    (state) =>
      new Set(state.auth.user?.permissions.map((p) => p.permission_name) ?? []),
  );

  const visibleLinks = MODULE_LINKS.filter((link) =>
    permissionList.has(link.permission),
  );

  return (
    <div className="space-y-6">
      <ModuleHero
        icon={<Settings size={26} />}
        title="ตั้งค่าระบบ"
        description="ตั้งค่าข้อมูลโรงเรียน ปีการศึกษา และเกณฑ์การให้คะแนนของระบบ"
        accent="from-slate-700 to-slate-500"
      />

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <Settings size={18} />
          เมนูของโมดูล
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleLinks.map((link) => (
            <ModuleCard
              key={link.path}
              icon={link.icon}
              title={link.title}
              description={link.description}
              to={link.path}
              accent={link.accent}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
