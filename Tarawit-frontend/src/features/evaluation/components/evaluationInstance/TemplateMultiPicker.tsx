import { evaluationColor } from "@/design-system/colors";
import SvgIcon from "@/design-system/icons/Icon";
import { ICONS } from "@/design-system/icons/paths";

export type TemplateType = "EVALUATION" | "SURVEY";

interface TemplateOption {
  id: number | string;
  template_name: string;
  template_type: TemplateType;
}

/**
 * เลือกแม่แบบได้หลายรายการต่อการสร้าง 1 ครั้ง
 */
export function TemplateMultiPicker({
  templates,
  templateType,
  selectedIds,
  onChange,
  onPreview,
  loading,
  error,
}: {
  templates: TemplateOption[];
  templateType: TemplateType;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onPreview: (id: string) => void;
  loading?: boolean;
  error?: string | null;
}) {
  const filteredTemplates = templates.filter(
    (t) => t.template_type === templateType,
  );

  const availableTemplates = filteredTemplates.filter(
    (t) => !selectedIds.includes(String(t.id)),
  );

  const selectClass =
    "w-full h-11 px-3 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:border-gray-300 transition-colors bg-white hover:border-gray-300";

  const accentColor = evaluationColor;

  const handleAdd = (id: string) => {
    if (!id) return;
    onChange([...selectedIds, id]);
  };

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  return (
    <div>
      <select
        value=""
        disabled={loading}
        onChange={(e) => {
          handleAdd(e.target.value);
          e.target.value = "";
        }}
        className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{
          ["--tw-ring-color" as string]: `${accentColor.main}33`,
        }}
      >
        <option value="">
          {loading
            ? "กำลังโหลดแม่แบบ..."
            : filteredTemplates.length > 0 && availableTemplates.length === 0
              ? "เลือกครบทุกแม่แบบแล้ว"
              : "เพิ่มแม่แบบ..."}
        </option>

        {availableTemplates.map((t) => (
          <option key={t.id} value={String(t.id)}>
            {t.template_name}
          </option>
        ))}
      </select>

      {error && <p className="text-xs text-rose-500 mt-1.5">{error}</p>}

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {selectedIds.map((id) => {
            const t = templates.find((tpl) => String(tpl.id) === id);

            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full pl-3 pr-1.5 py-1 text-xs text-gray-700 max-w-full"
              >
                <span className="truncate">{t?.template_name ?? id}</span>

                <button
                  type="button"
                  onClick={() => onPreview(id)}
                  className="flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  aria-label={`ดูตัวอย่าง ${t?.template_name ?? id}`}
                >
                  <SvgIcon icon={ICONS.clipboardCheck} className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemove(id)}
                  className="flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                  aria-label={`ลบ ${t?.template_name ?? id}`}
                >
                  <SvgIcon icon={ICONS.clipboardList} className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-1.5">
          ยังไม่ได้เลือกแม่แบบ — เลือกอย่างน้อย 1 แม่แบบ
        </p>
      )}
    </div>
  );
}
