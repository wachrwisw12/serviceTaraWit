import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Shield,
  KeyRound,
  Users,
  Search,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchPermissions,
  fetchRolesWithPermissions,
  updateRolePermissions,
} from "../api/RoleSlice";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import PermissionTree from "../components/PermissionTree";
import type { SystemRoleDef } from "../roleType";

const COLOR_MAP: Record<string, { bg: string; text: string; iconBg: string }> =
  {
    blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
    green: {
      bg: "bg-primary/5",
      text: "text-primary-dark",
      iconBg: "bg-primary/10",
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

export default function RolePage() {
  const dispatch = useAppDispatch();
  const snackbar = useSnackbar();

  const { rolesWithPermissions, permissions, loading, saving } =
    useAppSelector((state) => state.roleSlice);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<SystemRoleDef | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    dispatch(fetchRolesWithPermissions());
    dispatch(fetchPermissions());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return rolesWithPermissions;

    return rolesWithPermissions.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
    );
  }, [rolesWithPermissions, query]);

  const openEdit = (role: SystemRoleDef) => {
    setEditing(role);
    setSelectedIds([...(role.permission_ids ?? [])]);
  };

  const closeEdit = () => {
    setEditing(null);
    setSelectedIds([]);
  };

  const togglePermission = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!editing) return;

    try {
      await dispatch(
        updateRolePermissions({
          roleId: editing.id,
          permission_ids: selectedIds,
        }),
      ).unwrap();

      snackbar.showSnackbar(
        `บันทึกสิทธิ์ของ "${editing.name}" เรียบร้อยแล้ว`,
        "success",
      );
      closeEdit();
    } catch {
      snackbar.showSnackbar("บันทึกสิทธิ์ไม่สำเร็จ", "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
            Role Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            จัดการกลุ่มสิทธิ์ผู้ใช้งาน — ทั้งหมด {rolesWithPermissions.length}{" "}
            บทบาท
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา role..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && rolesWithPermissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="mt-2 text-sm">กำลังโหลด...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((role) => {
            const c = COLOR_MAP[role.color] ?? COLOR_MAP.gray;

            return (
              <div
                key={role.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.iconBg}`}
                  >
                    <Shield className={`h-5 w-5 ${c.text}`} />
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                      role.is_active
                        ? "bg-primary/10 text-primary-dark"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        role.is_active ? "bg-primary" : "bg-gray-400"
                      }`}
                    />
                    {role.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </div>

                <h2 className="mt-4 text-base font-semibold text-gray-900">
                  {role.name}
                </h2>
                <p className="mt-0.5 font-mono text-xs text-gray-400">
                  {role.code}
                </p>

                {role.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                    {role.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    <span className="font-semibold text-gray-700">
                      {role.permission_ids?.length ?? role.permissionCount}
                    </span>{" "}
                    สิทธิ์
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-gray-400">-</span>
                  </span>
                </div>

                <button
                  onClick={() => openEdit(role)}
                  className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary-dark"
                >
                  จัดการ Permission
                </button>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          ไม่พบ role ที่ค้นหา
        </div>
      )}

      {/* Edit permissions dialog */}
      <Dialog
        open={!!editing}
        onClose={closeEdit}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Shield size={20} />
          จัดการสิทธิ์ — {editing?.name}
          <span className="ml-1 font-mono text-xs font-normal text-gray-400">
            {editing?.code}
          </span>
          <button
            onClick={closeEdit}
            className="ml-auto rounded-md p-1 text-gray-400 hover:bg-gray-100"
            aria-label="ปิด"
          >
            <X size={18} />
          </button>
        </DialogTitle>

        <DialogContent dividers>
          <PermissionTree
            permissions={permissions}
            selectedIds={selectedIds}
            onToggle={togglePermission}
            disabled={saving}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeEdit} color="inherit">
            ยกเลิก
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={saving}
            startIcon={
              saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save size={16} />
              )
            }
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
