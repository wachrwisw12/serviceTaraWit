import { SvgIcon, type IconDefinition } from "@/design-system/icons";

/** แถวสรุปในแผงด้านข้าง — ไอคอน + ป้ายกำกับ + ค่า ให้กวาดตาเจอค่าที่ต้องการเร็วขึ้น */
export default function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: IconDefinition;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-gray-400 shrink-0">
        <SvgIcon icon={icon} className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="text-gray-800 font-medium text-right truncate max-w-[160px]">
        {value}
      </span>
    </div>
  );
}
