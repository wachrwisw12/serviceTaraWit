import { BadgePlus, Briefcase, FileSpreadsheet, Users } from "lucide-react";

import ModuleHero from "../../../components/ModuleHero";
import ModuleCard from "../../../components/ModuleCard";
import { Permission } from "../../../store/hooks/permission";
import { useAppSelector } from "../../../store/hooks";

const MODULE_LINKS = [
  {
    title: "รายชื่อบุคลากร",
    description: "จัดการข้อมูลบุคลากรทั้งหมดของโรงเรียน",
    path: "/personnel/list",
    permission: Permission.PERSONNEL_VIEW,
    icon: <Users size={22} />,
    accent: "blue" as const,
  },
  {
    title: "เพิ่มบุคลากร",
    description: "เพิ่มบุคลากรใหม่พร้อมกำหนดตำแหน่งและวิทยฐานะ",
    path: "/personnel/create",
    permission: Permission.PERSONNEL_CREATE,
    icon: <BadgePlus size={22} />,
    accent: "emerald" as const,
  },
  {
    title: "นำเข้าบุคลากร",
    description: "นำเข้าบุคลากรหลายคนพร้อมกันจาก Excel หรือ CSV",
    path: "/personnel/import",
    permission: Permission.PERSONNEL_CREATE,
    icon: <FileSpreadsheet size={22} />,
    accent: "violet" as const,
  },
  {
    title: "ตำแหน่ง/วิทยฐานะ",
    description: "จัดการตำแหน่งและวิทยฐานะของบุคลากร",
    path: "/positions",
    permission: Permission.POSITION_VIEW,
    icon: <Briefcase size={22} />,
    accent: "amber" as const,
  },
];

export default function PersonnelHomePage() {
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
        icon={<Users size={26} />}
        title="ข้อมูลบุคลากร"
        description="จัดการข้อมูลบุคลากรทั้งหมดของโรงเรียน ทั้งชื่อ-นามสกุล ตำแหน่ง วิทยฐานะ และข้อมูลติดต่อ"
        accent="from-emerald-700 to-teal-600"
      />

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <Users size={18} />
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
