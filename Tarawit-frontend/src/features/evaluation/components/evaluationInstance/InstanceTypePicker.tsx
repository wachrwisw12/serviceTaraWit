import { SvgIcon, ICONS } from "@/design-system/icons";

import type { IconDefinition } from "@/design-system/icons";
import type { TemplateType } from "../types/template_type";
type AccentColor = {
  main: string;
  soft: string;
};

const accent: AccentColor = {
  main: "#2fae60",
  soft: "#2fae601a",
};

export default function InstanceTypePicker({
  value,
  onChange,
}: {
  value: TemplateType;
  onChange: (type: TemplateType) => void;
}) {
  const options: {
    type: TemplateType;
    title: string;
    desc: string;
    icon: IconDefinition;
  }[] = [
    {
      type: "EVALUATION",
      title: "แบบประเมิน",
      desc: "มีผู้ประเมินให้คะแนน/ความเห็นต่อกลุ่มเป้าหมาย",
      icon: ICONS.clipboardCheck,
    },
    {
      type: "SURVEY",
      title: "แบบสอบถาม",
      desc: "ผู้ตอบตอบแบบสอบถามด้วยตนเอง ไม่มีผู้ประเมินแยก",
      icon: ICONS.clipboardList,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => {
        const selected = value === opt.type;

        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => onChange(opt.type)}
            className="text-left rounded-xl border p-4 transition-colors"
            style={{
              borderColor: selected ? accent.main : "#e5e7eb",
              backgroundColor: selected ? accent.soft : "#fff",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                style={{
                  backgroundColor: selected ? accent.main : "#f3f4f6",
                  color: selected ? "#fff" : "#9ca3af",
                }}
              >
                <SvgIcon icon={opt.icon} className="w-5 h-5" />
              </span>

              {selected && (
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full"
                  style={{
                    backgroundColor: accent.main,
                    color: "#fff",
                  }}
                >
                  <SvgIcon icon={opt.icon} className="w-5 h-5" />
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-gray-900 mt-3">
              {opt.title}
            </p>

            <p className="text-xs text-gray-400 mt-1">{opt.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
