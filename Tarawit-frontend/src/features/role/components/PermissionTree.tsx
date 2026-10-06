import { useMemo } from "react";
import { ChevronDown, KeyRound } from "lucide-react";
import type { PermissionDef } from "../roleType";

type Props = {
  permissions: PermissionDef[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  disabled?: boolean;
};

function groupByModule(permissions: PermissionDef[]) {
  const map = new Map<string, PermissionDef[]>();

  for (const p of permissions) {
    const list = map.get(p.module) ?? [];
    list.push(p);
    map.set(p.module, list);
  }

  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export default function PermissionTree({
  permissions,
  selectedIds,
  onToggle,
  disabled = false,
}: Props) {
  const modules = useMemo(() => groupByModule(permissions), [permissions]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <div className="space-y-4">
      {modules.map(([module, list]) => {
        const allChecked = list.every((p) => selectedSet.has(p.id));
        const someChecked = list.some((p) => selectedSet.has(p.id));

        const toggleAll = () => {
          if (allChecked) {
            list.forEach((p) => {
              if (selectedSet.has(p.id)) onToggle(p.id);
            });
          } else {
            list.forEach((p) => {
              if (!selectedSet.has(p.id)) onToggle(p.id);
            });
          }
        };

        return (
          <div
            key={module}
            className="overflow-hidden rounded-xl border border-gray-200"
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
              <label className="flex min-w-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked && !allChecked;
                  }}
                  onChange={toggleAll}
                  disabled={disabled}
                  className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary/40"
                />
                <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <ChevronDown size={16} className="text-gray-400" />
                  {module}
                </span>
              </label>
              <span className="shrink-0 text-xs text-gray-400">
                {list.filter((p) => selectedSet.has(p.id)).length}/{list.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-2">
              {list.map((p) => {
                const checked = selectedSet.has(p.id);

                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition ${
                      checked
                        ? "border-primary/30 bg-primary/5"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(p.id)}
                      disabled={disabled}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary/40"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-800">
                        {p.name || p.code}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                        <KeyRound size={11} className="shrink-0" />
                        <span className="truncate font-mono">{p.code}</span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
