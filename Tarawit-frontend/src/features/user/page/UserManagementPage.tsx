import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  ChevronDown,
  Mail,
  Phone,
  Save,
  RotateCcw,
  Check,
} from "lucide-react";
import { fetchUser, fetchUserById, updateUserRole } from "../UserSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import type { UserDetailResponse, UserListResponse } from "../UserType";
import { fetchRoleDef } from "../../role/api/RoleSlice";

import UserTable from "./UserTable";

/**
 * PermissionAssignmentPage
 * -------------------------
 * กำหนดสิทธิ์รายบุคคล — layout แบบ panel ฝังข้างตาราง (ไม่ใช่ overlay ทับ)
 * มี tab: ข้อมูลผู้ใช้ / Business Role / System Role / Permission / Menu Access / Audit Log
 *
 * Responsive behavior:
 *   - < lg: panel เลื่อนลงมาอยู่ใต้ตาราง (stack แนวตั้ง) แทนการฝังข้าง
 *   - >= lg: panel ฝังข้างตารางแบบเดิม กว้างคงที่
 *
 * วิธีใช้ในโปรเจกต์จริง:
 *   GET  /api/business-roles                    -> โหลด Business Role ทั้งหมด (ตอนนี้ hardcode)
 *   GET  /api/system-roles                       -> โหลด System Role ทั้งหมด (ตอนนี้ hardcode)
 *   GET  /api/users/:id                           -> โหลดรายละเอียด user เมื่อกด "จัดการ" (lazy)
 *   PUT  /api/users/:id/roles                     -> บันทึก businessRoleId + systemRoleIds
 */

const COLOR_MAP: Record<string, { bg: string; text: string; iconBg: string }> =
  {
    blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
    green: {
      bg: "bg-[#2fae60]/5",
      text: "text-[#1f7a43]",
      iconBg: "bg-[#2fae60]/10",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      iconBg: "bg-purple-100",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      iconBg: "bg-amber-100",
    },
    gray: { bg: "bg-gray-50", text: "text-gray-600", iconBg: "bg-gray-100" },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      iconBg: "bg-orange-100",
    },
  };

type TabKey =
  | "info"
  | "business_role"
  | "system_role"
  | "permission"
  | "menu_access"
  | "audit_log";

const TABS: { key: TabKey; label: string }[] = [
  { key: "info", label: "ข้อมูลผู้ใช้" },
  { key: "business_role", label: "Business Role" },
  { key: "system_role", label: "System Role" },
  { key: "permission", label: "Permission" },
  { key: "menu_access", label: "Menu Access" },
  { key: "audit_log", label: "Audit Log" },
];

export default function PermissionAssignmentPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const dispatch = useAppDispatch();
  const { user: users } = useAppSelector((state) => state.user);

  const { SystemRoleDef: SYSTEM_ROLES, PersonType: PERSON_TYPES } =
    useAppSelector((state) => state.roleSlice);
  useEffect(() => {
    dispatch(fetchRoleDef());
    dispatch(fetchUser());
  }, [dispatch]);

  const [page, setPage] = useState(1);
  const pageSize = 7;
  const activeRoles = useMemo(
    () => PERSON_TYPES.filter((r) => r.name_th !== "ไม่ระบุ"),
    [PERSON_TYPES],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        !q ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      const matchesRole =
        roleFilter === "all" || u.person_type_code === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage],
  );

  // ----- Panel state -----

  const [activeTab, setActiveTab] = useState<TabKey>("business_role");
  const [businessRoleId, setBusinessRoleId] = useState<number | null>(null);
  const [systemRoleIds, setSystemRoleIds] = useState<number[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetailResponse | null>(
    null,
  );
  async function openAssign(u: UserListResponse) {
    try {
      setLoadingDetail(true);

      const result = await dispatch(fetchUserById(u.id));

      if (fetchUserById.fulfilled.match(result)) {
        const user = result.payload;

        setSelectedUser(user);

        setBusinessRoleId(
          user.person_type_id ? Number(user.person_type_id) : null,
        );

        setSystemRoleIds(user.roles?.map((r) => r.role_id) ?? []);
      }
    } finally {
      setLoadingDetail(false);
    }
  }
  function closePanel() {
    setSelectedUser(null);
    setBusinessRoleId(null);
    setSystemRoleIds([]);
  }

  function toggleSystemRole(id: number) {
    setSystemRoleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  async function handleSave() {
    if (!selectedUser) return;

    try {
      await dispatch(
        updateUserRole({
          id: selectedUser.id,
          person_type_id: businessRoleId,
          role_ids: systemRoleIds,
        }),
      ).unwrap();

      // refresh list
      await dispatch(fetchUser());

      // โหลด detail ใหม่เพื่อดูค่าที่บันทึก
      const updated = await dispatch(fetchUserById(selectedUser.id)).unwrap();

      setSelectedUser(updated);

      setBusinessRoleId(
        updated.person_type_id ? Number(updated.person_type_id) : null,
      );

      setSystemRoleIds(updated.roles?.map((r) => r.role_id) ?? []);
    } catch (err) {
      console.error("update role failed", err);
    }
  }

  // const selectedPersonType = useMemo(
  //   () => PERSON_TYPES.find((r) => r.id === businessRoleId) ?? null,
  //   [PERSON_TYPES, businessRoleId],
  // );
  const systemRolePermCount = useMemo(
    () =>
      SYSTEM_ROLES.filter((r) => systemRoleIds.includes(r.id)).reduce(
        (sum, r) => sum + r.permissionCount,
        0,
      ),
    [systemRoleIds],
  );
  const extraPermCount = 3; // TODO: จาก extra permission จริง

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 font-sans text-gray-800 sm:px-6 sm:py-8">
      <div
        className={`mx-auto flex flex-col gap-6 lg:flex-row ${
          selectedUser ? "max-w-[1500px]" : "max-w-6xl"
        }`}
      >
        {/* ---------- Left: list ---------- */}
        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
              ผู้ใช้งาน
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              จัดการข้อมูลผู้ใช้งานทั้งหมดในระบบ ทั้งหมด {users.length} คน
            </p>
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#2fae60] focus:outline-none focus:ring-2 focus:ring-[#2fae60]/20"
              />
            </div>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-9 text-sm text-gray-700 focus:border-[#2fae60] focus:outline-none focus:ring-2 focus:ring-[#2fae60]/20 sm:w-44"
              >
                <option value="all">ทุกสถานะ</option>
                {activeRoles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name_th}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <UserTable
                users={users}
                activeRoles={activeRoles}
                query={query}
                roleFilter={roleFilter}
                page={currentPage}
                totalPages={totalPages}
                paged={paged}
                filteredCount={filtered.length}
                pageSize={pageSize}
                selectedUserId={selectedUser?.id}
                onQueryChange={(v) => {
                  setQuery(v);
                  setPage(1);
                }}
                onRoleChange={(v) => {
                  setRoleFilter(v);
                  setPage(1);
                }}
                onPageChange={setPage}
                onSelect={openAssign}
              />
            </div>
          </div>
        </div>

        {/* ---------- Right: assignment panel ----------
             < lg: full width, stacked below the table
             >= lg: fixed width, embedded beside the table */}
        {selectedUser && (
          <div className="flex w-full min-w-0 flex-col rounded-xl border border-gray-200 bg-white lg:w-[720px] lg:shrink-0">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2fae60]/10 text-base font-semibold text-[#1f7a43] sm:h-14 sm:w-14 sm:text-lg">
                  {selectedUser.first_name?.[0] ?? ""}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-gray-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                        selectedUser.is_active
                          ? "bg-[#2fae60]/10 text-[#1f7a43]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          selectedUser.is_active
                            ? "bg-[#2fae60]"
                            : "bg-gray-400"
                        }`}
                      />
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {selectedUser.person_type_id}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                    {selectedUser.email && (
                      <span className="flex min-w-0 items-center gap-1">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{selectedUser.email}</span>
                      </span>
                    )}
                    {selectedUser.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {selectedUser.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2">
                <button
                  onClick={handleSave}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2fae60] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#279453] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2fae60]/40 md:flex-none"
                >
                  <Save className="h-3.5 w-3.5" />
                  บันทึก
                </button>
                <button
                  onClick={closePanel}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 md:flex-none"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  ยกเลิก
                </button>
                <button
                  onClick={closePanel}
                  className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                  aria-label="ปิด"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 overflow-x-auto border-b border-gray-100 px-4 sm:gap-5 sm:px-6">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 whitespace-nowrap border-b-2 py-3 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "border-[#2fae60] text-[#1f7a43]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {loadingDetail ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  กำลังโหลด...
                </p>
              ) : activeTab === "business_role" ? (
                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                      <h3 className="font-semibold text-gray-800">
                        ประเภทบุคลากร
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        เลือกประเภทของผู้ใช้งาน
                      </p>
                    </div>

                    <div className="space-y-2 p-4">
                      {PERSON_TYPES.map((item) => (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition
          ${
            businessRoleId === item.id
              ? "border-[#2fae60] bg-[#2fae60]/5"
              : "border-gray-200 hover:bg-gray-50"
          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium text-gray-800">
                              {item.name_th}
                            </div>

                            <div className="text-xs text-gray-400">
                              {item.code}
                            </div>
                          </div>

                          <input
                            type="radio"
                            name="person_type"
                            checked={businessRoleId === item.id}
                            onChange={() => setBusinessRoleId(item.id)}
                            className="h-4 w-4 shrink-0"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* System Role */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      System Role
                    </h3>
                    <p className="mb-3 text-xs text-gray-400">
                      บทบาทในการจัดการระบบ (สิทธิ์แอดมินในแต่ละโมดูล)
                    </p>
                    <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                      {SYSTEM_ROLES.map((r) => {
                        //const Icon = r.icon;
                        const checked = systemRoleIds.includes(r.id);
                        const c = COLOR_MAP[r.color] ?? COLOR_MAP.gray;
                        return (
                          <label
                            key={r.id}
                            className={`flex min-w-0 cursor-pointer flex-col gap-2 rounded-lg border p-3 transition ${
                              checked
                                ? "border-[#2fae60] bg-[#2fae60]/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.iconBg}`}
                              >
                                {/* <Icon className={`h-4 w-4 ${c.text}`} /> */}
                              </div>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSystemRole(r.id)}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-[#2fae60] focus:ring-[#2fae60]/40"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-800">
                                {r.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-gray-400">
                                {r.description}
                              </p>
                            </div>
                            <span
                              className={`w-fit rounded-md px-1.5 py-0.5 text-[11px] font-medium ${c.bg} ${c.text}`}
                            >
                              {r.permissionCount} สิทธิ์
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5 rounded-lg bg-[#2fae60]/5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[#1f7a43]">
                        <Check className="h-3.5 w-3.5" />
                        รวมสิทธิ์จาก System Role
                      </span>
                      <span className="text-sm font-semibold text-[#1f7a43]">
                        {systemRolePermCount} สิทธิ์
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-800">
                      สรุปสิทธิ์ทั้งหมด
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg bg-[#2fae60]/5 p-3 text-center">
                        <p className="text-[11px] text-gray-500">
                          จาก Business Role
                        </p>
                        <p className="text-[11px] text-gray-400">สิทธิ์</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-3 text-center">
                        <p className="text-[11px] text-gray-500">
                          จาก System Role
                        </p>
                        <p className="mt-1 text-lg font-semibold text-blue-600">
                          {systemRolePermCount}
                        </p>
                        <p className="text-[11px] text-gray-400">สิทธิ์</p>
                      </div>
                      <div className="rounded-lg bg-purple-50 p-3 text-center">
                        <p className="text-[11px] text-gray-500">
                          จาก Extra Permission
                        </p>
                        <p className="mt-1 text-lg font-semibold text-purple-600">
                          {extraPermCount}
                        </p>
                        <p className="text-[11px] text-gray-400">สิทธิ์</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <p className="text-[11px] text-gray-500">รวมทั้งหมด</p>
                        <p className="text-[11px] text-gray-400">สิทธิ์</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-gray-400">
                  ยังไม่ได้พัฒนาส่วนนี้ — TODO:{" "}
                  {TABS.find((t) => t.key === activeTab)?.label}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
