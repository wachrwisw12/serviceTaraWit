import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  SearchX,
  UserPlus,
  Users,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import {
  activatePersonnel,
  deactivatePersonnel,
  fetchPersonnel,
  fetchPersonTypes,
} from "../api/personnelSlice";
import UserAvatar from "../../user/components/UserAvatar";

const PAGE_SIZE = 20;

export default function PersonnelListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  const { personnel, personTypes, loading, saving, total, page, totalPages } =
    useAppSelector((state) => state.personnel);

  const [query, setQuery] = useState("");
  const [personTypeFilter, setPersonTypeFilter] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    dispatch(fetchPersonTypes());
  }, [dispatch]);

  // ค้นหาจาก backend เมื่อ query / ตัวกรองเปลี่ยน (debounce เล็กน้อย)
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        fetchPersonnel({
          search: query.trim() || undefined,
          person_type_id: personTypeFilter || undefined,
          is_active: statusFilter === "all" ? undefined : statusFilter,
          page: 1,
          limit: PAGE_SIZE,
        }),
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, query, personTypeFilter, statusFilter]);

  // เปลี่ยนหน้า
  function goToPage(p: number) {
    dispatch(
      fetchPersonnel({
        search: query.trim() || undefined,
        person_type_id: personTypeFilter || undefined,
        is_active: statusFilter === "all" ? undefined : statusFilter,
        page: p,
        limit: PAGE_SIZE,
      }),
    );
  }

  const activeCount = personnel.filter((item) => item.is_active).length;
  const inactiveCount = personnel.length - activeCount;

  async function handleToggleActive(p: (typeof personnel)[number]) {
    const action = p.is_active ? deactivatePersonnel : activatePersonnel;
    const res = await dispatch(action(p.id));
    if (action.fulfilled.match(res)) {
      snackbar.showSnackbar(
        p.is_active ? "ปิดใช้งานบุคลากรแล้ว" : "เปิดใช้งานบุคลากรแล้ว",
        "success",
      );
      dispatch(fetchPersonnel({}));
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "ดำเนินการไม่สำเร็จ",
        "error",
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* หัวข้อ + ปุ่มเพิ่ม */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">รายชื่อบุคลากร</h1>
          <p className="mt-1 text-sm text-gray-500">
            จัดการข้อมูลบุคลากรทั้งหมดของโรงเรียน            ทั้งหมด {total} คน
          </p>
        </div>
        <button
          onClick={() => navigate("/personnel/create")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          เพิ่มบุคลากร
        </button>
      </div>

      {/* การ์ดสรุป */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-dark">
            <Users size={22} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-gray-500">บุคลากรทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-900">{personnel.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Users size={22} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-gray-500">ใช้งานอยู่</p>
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <UserPlus size={22} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-gray-500">ไม่ใช้งาน</p>
            <p className="text-2xl font-bold text-gray-600">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* ตัวกรอง */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, เลขบัตร, อีเมล, เบอร์โทร..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="relative">
          <select
            value={personTypeFilter}
            onChange={(e) => setPersonTypeFilter(Number(e.target.value))}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-9 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-44"
          >
            <option value={0}>ทุกประเภท</option>
            {personTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name_th}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-9 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-40"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="true">ใช้งานอยู่</option>
            <option value="false">ไม่ใช้งาน</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* ตาราง */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">ชื่อ-นามสกุล</th>
                <th className="px-5 py-3">ตำแหน่ง</th>
                <th className="px-5 py-3">กลุ่มสาระ</th>
                <th className="px-5 py-3">ประเภท</th>
                <th className="px-5 py-3">ติดต่อ</th>
                <th className="px-5 py-3">สถานะ</th>
                <th className="px-5 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => navigate(`/personnel/detail/${p.id}`)}
                      className="flex items-center gap-3 text-left transition hover:opacity-80"
                    >
                      <UserAvatar
                        avatarUrl={p.avatar_url}
                        prefixCode={p.prefix_code}
                        prefixes={p.prefix_name}
                        firstName={p.first_name}
                        className="h-9 w-9 text-sm"
                        alt={`${p.prefix_name ?? ""} ${p.first_name ?? ""} ${p.last_name ?? ""}`}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-800">
                          {p.prefix_name ? `${p.prefix_name} ` : ""}
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="truncate text-xs text-gray-400">
                          @{p.username}
                          {p.nickname ? ` · "${p.nickname}"` : ""}
                          {p.cid ? ` · ${p.cid}` : ""}
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="block max-w-[200px] truncate text-gray-600"
                      title={p.position_name ?? undefined}
                    >
                      {p.position_name || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="block max-w-[160px] truncate text-gray-600"
                      title={p.department_name ?? undefined}
                    >
                      {p.department_name || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {p.person_type_name || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="min-w-0">
                      <div className="truncate text-gray-600">
                        {p.email || "-"}
                      </div>
                      <div className="truncate text-xs text-gray-400">
                        {p.phone || ""}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                        p.is_active
                          ? "bg-primary/10 text-primary-dark"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          p.is_active ? "bg-primary" : "bg-gray-400"
                        }`}
                      />
                      {p.is_active ? "ใช้งานอยู่" : "ไม่ใช้งาน"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/personnel/edit/${p.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary-dark"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleToggleActive(p)}
                        disabled={saving}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                          p.is_active
                            ? "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {p.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>                    <td colSpan={7} className="px-5 py-14 text-center">
                    {!loading && <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>}
                  </td>
                </tr>
              )}

              {!loading && personnel.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <SearchX className="h-8 w-8 text-gray-300" />
                      <p className="text-sm">
                        ไม่พบบุคลากรที่ตรงกับเงื่อนไขการค้นหา
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* แบ่งหน้า */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <div className="text-xs text-gray-500">
            แสดง {(page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, total)} จาก {total} รายการ
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="rounded-lg border border-gray-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              className="rounded-lg border border-gray-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
