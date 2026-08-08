import { useState } from "react";
import type { EvaluationSectionForm } from "../../types/EvaluationSectionForm_type";
import EditFieldsModal from "../evaluationsTarget/EditFieldsModal";

interface Props {
  detail: EvaluationSectionForm;
  canEditFields?: boolean;
  loading?: boolean;
  onSave?: (values: Record<number, string>) => Promise<void>;
}

export default function EvaluationHeader({
  detail,
  canEditFields = false,
  loading = false,
  onSave,
}: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      detail.fields.map((field) => [field.id, field.value ?? ""]),
    ),
  );
  const editable = canEditFields && Boolean(onSave);

  const handleSave = async () => {
    if (!onSave) return;
    await onSave(values);
    setOpen(false);
  };

  return (
    <>
      <div className="mb-5">
        <h1 className="text-center text-lg font-bold tracking-tight text-slate-900">
          {detail.template_name}
        </h1>

        <p className="mt-1 text-center text-sm text-slate-500">
          ภาคเรียนที่ {detail.round} ปีการศึกษา {detail.academic_year}
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-400" />

          <div className="bg-white p-5">
            <dl className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-y-0">
              {detail.fields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-0.5 py-2.5 md:px-3"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {field.label}
                  </dt>
                  <dd className="truncate text-sm font-semibold text-slate-800">
                    {field.value || "-"}
                  </dd>
                </div>
              ))}

              <div className="flex flex-col gap-0.5 py-2.5 md:px-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  ชื่อผู้สอน
                </dt>
                <dd className="truncate text-sm font-semibold text-slate-800">
                  {detail.target.name}
                </dd>
              </div>
            </dl>

            {editable && (
              <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                <button
                  onClick={() => setOpen(true)}
                  className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  แก้ไขข้อมูล
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditFieldsModal
        open={open}
        fields={detail.fields}
        values={values}
        loading={loading}
        onClose={() => setOpen(false)}
        onChange={setValues}
        onSavefield={handleSave}
      />
    </>
  );
}
