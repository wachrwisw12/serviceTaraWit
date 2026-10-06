import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";

import type { UserListResponse } from "../UserType";
import UserAvatar from "../components/UserAvatar";

interface Props {
  page: number;
  totalPages: number;
  paged: UserListResponse[];
  filteredCount: number;
  pageSize: number;

  selectedUserId?: number;

  onPageChange: (page: number) => void;

  onSelect: (user: UserListResponse) => void;
}

export default function UserTable({
  page,
  totalPages,
  paged,
  filteredCount,
  pageSize,
  selectedUserId,

  onPageChange,
  onSelect,
}: Props) {
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">ผู้ใช้งาน</th>
              <th className="px-5 py-3">ตำแหน่ง</th>
              <th className="px-5 py-3">ประเภท</th>
              <th className="px-5 py-3">สถานะ</th>
              <th className="px-5 py-3 text-right">จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {paged.map((u) => {
              const selected = selectedUserId === u.id;

              return (
                <tr
                  key={u.id}
                  className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/60 ${
                    selected ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatarUrl={u.avatar_url}
                        prefixCode={u.prefix_code}
                        prefixes={u.prefixes}
                        firstName={u.first_name}
                        className="h-9 w-9 text-sm"
                        alt={`${u.first_name} ${u.last_name}`}
                      />

                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-800">
                          {u.first_name} {u.last_name}
                        </div>

                        <div className="truncate text-xs text-gray-400">
                          {u.username}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    <span
                      className="block max-w-[180px] truncate"
                      title={u.position}
                    >
                      {u.position || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {u.person_type_name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                        u.is_active
                          ? "bg-primary/10 text-primary-dark"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          u.is_active ? "bg-primary" : "bg-gray-400"
                        }`}
                      />
                      {u.is_active ? "ใช้งานอยู่" : "ไม่ใช้งาน"}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onSelect(u)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      จัดการ
                    </button>
                  </td>
                </tr>
              );
            })}

            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <SearchX className="h-8 w-8 text-gray-300" />
                    <p className="text-sm">
                      ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <div className="text-xs text-gray-500">
            แสดง {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, filteredCount)} จาก {filteredCount}{" "}
            รายการ
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-gray-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-gray-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
