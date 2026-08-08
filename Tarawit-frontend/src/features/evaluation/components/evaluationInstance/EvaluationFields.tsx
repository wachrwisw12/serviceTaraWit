import type { InstanceField } from "../../types/EvaluationSectionForm_type";

interface Props {
  fields: InstanceField[];
  values: Record<number, string>;
  editable?: boolean;
  onChange: (values: Record<number, string>) => void;
}

export default function EvaluationFields({
  fields,
  values,
  editable,
  onChange,
}: Props) {
  const handleChange = (id: number, value: string) => {
    onChange({
      ...values,
      [id]: value,
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-600">
          i
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            ข้อมูลการประเมิน
          </h2>

          <p className="text-sm text-gray-500">
            {editable
              ? "กรุณากรอกข้อมูลให้ครบถ้วน"
              : "ข้อมูลที่ผู้รับการประเมินบันทึกไว้"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </label>

            {!editable ? (
              <div className="min-h-[46px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                {values[field.id] ?? field.value ?? (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            ) : field.field_type === "NUMBER" ? (
              <input
                type="number"
                value={values[field.id] ?? ""}
                placeholder={field.placeholder ?? ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            ) : (
              <input
                type="text"
                value={values[field.id] ?? ""}
                placeholder={field.placeholder ?? ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
