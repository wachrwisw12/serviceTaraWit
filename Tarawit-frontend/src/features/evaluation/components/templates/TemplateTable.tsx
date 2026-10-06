import { Eye, Pencil, Copy, Play } from "lucide-react";
import TemplateStatusBadge from "./TemplateStatusBadge";
import type { TemplateApiResponse } from "../../types/template_type";

interface TemplateTableProps {
  items?: TemplateApiResponse[];
  loading: boolean;
  errors?: string | null;

  onView?: (item: TemplateApiResponse) => void;
  onEdit?: (item: TemplateApiResponse) => void;
  onDuplicate?: (item: TemplateApiResponse) => void;
  onActivate?: (item: TemplateApiResponse) => void;
}

const ACCENT = "var(--color-primary)";

export default function TemplateTable({
  items = [],
  loading,
  errors,
  onView,
  onEdit,
  onDuplicate,
  onActivate,
}: TemplateTableProps) {
  const activeCount = items.filter((i) => i.status === "ACTIVE").length;

  const draftCount = items.filter((i) => i.status === "DRAFT").length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <p className="text-sm text-gray-500">กำลังโหลดข้อมูลแม่แบบ...</p>
      </div>
    );
  }

  if (errors) {
    return (
      <div className="bg-white rounded-xl border border-red-100 p-12 text-center">
        <p className="text-sm text-red-600 font-medium">{errors}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <p className="text-sm font-medium text-gray-700">
          ยังไม่มีแม่แบบการประเมิน
        </p>

        <p className="text-xs text-gray-400 mt-1">
          เริ่มสร้างแม่แบบแรกของคุณได้เลย
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Summary */}
      <div className="flex items-center gap-6 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
        <span className="text-sm font-semibold text-gray-800">
          ทั้งหมด {items.length} แม่แบบ
        </span>

        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: ACCENT }}
          />
          ใช้งานอยู่ {activeCount}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          ฉบับร่าง {draftCount}
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">
              ชื่อแม่แบบ
            </th>

            <th className="px-3 py-3 text-xs font-medium text-gray-400 text-center">
              Version
            </th>

            <th className="px-3 py-3 text-xs font-medium text-gray-400 text-center">
              หมวด
            </th>

            <th className="px-3 py-3 text-xs font-medium text-gray-400 text-center">
              ข้อ
            </th>

            <th className="px-3 py-3 text-xs font-medium text-gray-400 text-center">
              สถานะ
            </th>

            <th className="px-5 py-3 text-xs font-medium text-gray-400 text-center">
              จัดการ
            </th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr
              key={item.id}
              className={`hover:bg-gray-50 transition-colors ${
                index !== items.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <td className="px-5 py-4">
                <div className="font-semibold text-gray-900">
                  {item.template_name}
                </div>

                <div className="text-xs text-gray-400 mt-0.5 font-mono">
                  {item.code}
                </div>
              </td>

              <td className="text-center">
                <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600">
                  v{item.versions}
                </span>
              </td>

              <td className="text-center text-gray-600">
                {item.sectionCount ?? 0}
              </td>

              <td className="text-center text-gray-600">
                {item.questionCount ?? 0}
              </td>

              <td className="text-center">
                <TemplateStatusBadge status={item.status} />
              </td>

              <td>
                <div className="flex justify-center gap-1">
                  <button
                    onClick={() => onView?.(item)}
                    title="ดูรายละเอียด"
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <Eye size={17} />
                  </button>

                  <button
                    onClick={() => onEdit?.(item)}
                    title="แก้ไข"
                    className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => onDuplicate?.(item)}
                    title="ทำสำเนา"
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <Copy size={17} />
                  </button>

                  <button
                    onClick={() => onActivate?.(item)}
                    title="เปิดใช้งาน"
                    disabled={item.status === "ACTIVE"}
                    className="p-2 rounded-lg text-gray-400 hover:bg-primary/10 hover:text-primary-dark disabled:opacity-25"
                  >
                    <Play size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
