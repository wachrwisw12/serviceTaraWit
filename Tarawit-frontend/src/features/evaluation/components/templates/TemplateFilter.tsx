import { Plus, Search } from "lucide-react";

const ACCENT = "#2fae60";
const ACCENT_DARK = "#1f8a49";

interface TemplateFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  typeValue: string;
  onTypeChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  onCreate: () => void;
}

export default function TemplateFilterBar({
  searchValue,
  onSearchChange,
  typeValue,
  onTypeChange,
  statusValue,
  onStatusChange,
  onCreate,
}: TemplateFilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
      {/* ค้นหา */}
      <div className="relative flex-1 min-w-[240px]">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาแม่แบบ..."
          className="pl-10 pr-4 h-11 w-full border border-gray-200 rounded-lg text-sm outline-none transition-colors focus:ring-2"
          style={{ ["--tw-ring-color" as string]: `${ACCENT}33` }}
          onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "")}
        />
      </div>

      {/* เส้นคั่น */}
      <div className="h-8 w-px bg-gray-200 hidden sm:block" />

      {/* ตัวกรอง */}
      <select
        value={typeValue}
        onChange={(e) => onTypeChange(e.target.value)}
        className="border border-gray-200 rounded-lg h-11 px-3 text-sm text-gray-700 outline-none focus:ring-2 transition-colors"
        style={{ ["--tw-ring-color" as string]: `${ACCENT}33` }}
      >
        <option value="ALL">ทุกประเภท</option>
        <option value="TEACHER">ครู</option>
        <option value="DIRECTOR">ผู้บริหาร</option>
      </select>

      <select
        value={statusValue}
        onChange={(e) => onStatusChange(e.target.value)}
        className="border border-gray-200 rounded-lg h-11 px-3 text-sm text-gray-700 outline-none focus:ring-2 transition-colors"
        style={{ ["--tw-ring-color" as string]: `${ACCENT}33` }}
      >
        <option value="ALL">ทุกสถานะ</option>
        <option value="DRAFT">Draft</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>

      {/* ดันปุ่มสร้างไปขวาสุด */}
      <div className="flex-1 min-w-0 hidden lg:block" />

      <button
        onClick={onCreate}
        className="h-11 px-5 text-white rounded-lg flex items-center gap-2 font-medium transition-colors shrink-0"
        style={{ backgroundColor: ACCENT }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = ACCENT_DARK)
        }
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
      >
        <Plus size={18} />
        สร้างแม่แบบ
      </button>
    </div>
  );
}
