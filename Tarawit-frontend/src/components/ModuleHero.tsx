interface ModuleHeroProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: string;
}

/**
 * แบนเนอร์หัวโมดูล — ใช้เหมือนกันทุกหน้า homepage ของแต่ละโมดูล
 * เพื่อให้ผู้ใช้จับคู่ "หน้านี้คือโมดูลอะไร" ได้จากสีและไอคอนเดียวกัน
 */
export default function ModuleHero({
  icon,
  title,
  description,
  accent = "from-[#1b365d] to-[#2c5aa0]",
}: ModuleHeroProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-5 rounded-2xl bg-gradient-to-r ${accent} p-6 text-white shadow-sm sm:p-7`}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-white/70">{description}</p>
      </div>
    </div>
  );
}
