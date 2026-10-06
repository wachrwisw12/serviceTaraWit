import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  ChevronDown,
  Mail,
  Phone,
  Save,
} from "lucide-react";
import { fetchUser, fetchUserById, updateUserRole } from "../UserSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import type { UserDetailResponse, UserListResponse } from "../UserType";
import { fetchRoleDef } from "../../role/api/RoleSlice";

import UserTable from "./UserTable";
import UserAvatar from "../components/UserAvatar";

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
        u.username?.toLowerCase().includes(q) ||
        u.position?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.person_type_name?.toLowerCase().includes(q);
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
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-9 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-44"
              >
                <option value="all">ทุกประเภท</option>
                {activeRoles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name_th}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="overflow-x-auto">
              <UserTable
                page={currentPage}
                totalPages={totalPages}
                paged={paged}
                filteredCount={filtered.length}
                pageSize={pageSize}
                selectedUserId={selectedUser?.id}
                onPageChange={setPage}
                onSelect={openAssign}
              />
          </div>
        </div>

        {/* ---------- Right: assignment panel ----------
             < lg: full width, stacked below the table
             >= lg: fixed width, embedded beside the table */}
        {selectedUser && (
          <div className="flex w-full min-w-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm lg:w-[520px] lg:shrink-0">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <UserAvatar
                  avatarUrl={selectedUser.avatar_url}
                  prefixCode={undefined}
                  prefixes={selectedUser.prefixes}
                  firstName={selectedUser.first_name}
                  className="h-12 w-12 shrink-0 rounded-full text-base sm:h-14 sm:w-14 sm:text-lg"
                  alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-gray-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                        selectedUser.is_active
                          ? "bg-primary/10 text-primary-dark"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          selectedUser.is_active
                            ? "bg-primary"
                            : "bg-gray-400"
                        }`}
                      />
                      {selectedUser.is_active ? "ใช้งานอยู่" : "ไม่ใช้งาน"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {selectedUser.position ||
                      selectedUser.person_type_name ||
                      selectedUser.person_type_id}
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
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:flex-none"
                >
                  <Save className="h-3.5 w-3.5" />
                  บันทึก
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

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {loadingDetail ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  กำลังโหลด...
                </p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      ประเภทบุคลากร
                    </label>
                    <select
                      value={businessRoleId ?? ""}
                      onChange={(event) =>
                        setBusinessRoleId(
                          event.target.value ? Number(event.target.value) : null,
                        )
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">ไม่ระบุ</option>
                      {PERSON_TYPES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name_th}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* System Role */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      System Role
                    </h3>
                    <p className="mb-3 text-xs text-gray-500">
                      เลือกเฉพาะบทบาทที่ผู้ใช้นี้ต้องใช้
                    </p>
                    <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                      {SYSTEM_ROLES.map((r) => {
                        const checked = systemRoleIds.includes(r.id);
                        return (
                          <label
                            key={r.id}
                            className={`flex cursor-pointer items-center gap-3 px-3 py-3 transition ${checked ? "bg-primary/5" : "hover:bg-gray-50"}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSystemRole(r.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-800">
                                {r.name}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {r.description}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs text-gray-400">
                              {r.permissionCount} สิทธิ์
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
