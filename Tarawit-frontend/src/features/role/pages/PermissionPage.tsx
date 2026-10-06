import { useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Search,
  Loader2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchPermissions, fetchRolesWithPermissions } from "../api/RoleSlice";

export default function PermissionPage() {
  const dispatch = useAppDispatch();
  const { permissions, rolesWithPermissions, loading } = useAppSelector(
    (state) => state.roleSlice,
  );

  const [query, setQuery] = useState("");
  const [activeModule, setActiveModule] = useState<string>("ทั้งหมด");

  useEffect(() => {
    dispatch(fetchPermissions());
    dispatch(fetchRolesWithPermissions());
  }, [dispatch]);

  const modules = useMemo(() => {
    const set = new Set(permissions.map((p) => p.module));
    return ["ทั้งหมด", ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [permissions]);

  const roleNamesByPermission = useMemo(() => {
    const map = new Map<number, string[]>();

    for (const role of rolesWithPermissions) {
      for (const pid of role.permission_ids ?? []) {
        const list = map.get(pid) ?? [];
        list.push(role.name);
        map.set(pid, list);
      }
    }

    return map;
  }, [rolesWithPermissions]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = permissions.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q);
      const matchesModule =
        activeModule === "ทั้งหมด" || p.module === activeModule;

      return matchesQuery && matchesModule;
    });

    const map = new Map<string, typeof filtered>();

    for (const p of filtered) {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    }

    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions, query, activeModule]);

  const totalRoleCount = rolesWithPermissions.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
            Permission
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            รายการสิทธิ์ทั้งหมดในระบบ — {permissions.length} สิทธิ์ /{" "}
            {totalRoleCount} บทบาท
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อสิทธิ์, รหัส, โมดูล..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Module filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {modules.map((m) => (
          <button
            key={m}
            onClick={() => setActiveModule(m)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              activeModule === m
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && permissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="mt-2 text-sm">กำลังโหลด...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([module, list]) => (
            <div
              key={module}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
                <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <ChevronDown size={16} className="text-gray-400" />
                  {module}
                </span>
                <span className="text-xs text-gray-400">
                  {list.length} สิทธิ์
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {list.map((p) => {
                  const holders = roleNamesByPermission.get(p.id) ?? [];

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <KeyRound className="h-4 w-4 text-primary-dark" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {p.name || p.code}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[11px] text-gray-400">
                            {p.code}
                          </p>
                          {p.description && (
                            <p className="mt-1 text-xs text-gray-400">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
                        {holders.length === 0 ? (
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-400">
                            ไม่มี role
                          </span>
                        ) : (
                          holders.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary-dark"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              {name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {grouped.length === 0 && !loading && (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          ไม่พบสิทธิ์ที่ค้นหา
        </div>
      )}
    </div>
  );
}
