import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutThunk } from "../features/auth/authSlice";
import { filterPagesByPermission } from "../utils/menu";
import { pages } from "../constants/menu.config";
import type { MenuItem } from "../types/menu";
import { fetchMyModules } from "../features/setting/api/moduleSettings";
import UserAvatar from "../features/user/components/UserAvatar";
export type IconProps = {
  fontSize?: "small" | "medium" | "large";
  className?: string;
};

interface SidebarStat {
  label: string;
  value: string;
}

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  stats?: SidebarStat[];
  schoolName?: string;
  systemName?: string;
  showBrand?: boolean;
};

// สีเน้นหลัก — ใช้แทนที่ blue ของ mockup อ้างอิง
const ACCENT = "var(--color-primary)";
const ACCENT_SOFT = "var(--color-primary-soft)";

export default function Sidebar({
  open,
  onClose,
  collapsed = false,
  onToggleCollapsed,
  schoolName,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMyModules()
      .then((modules) => {
        const enabled = new Set(
          modules.filter((m) => m.enabled && m.show_on_web).map((m) => m.key),
        );
        setEnabledModules(enabled);
      })
      .catch(() => {
        // ถ้า error ไม่ filter module
        setEnabledModules(new Set(["attendance", "evaluation", "personnel", "users", "reports", "settings"]));
      });
  }, []);

  const visiblePages = filterPagesByPermission(pages, user?.permissions ?? [], enabledModules);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await dispatch(logoutThunk());
      navigate("/login");
    } catch {
      // error ถูกจัดการใน slice แล้ว
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 top-[70px] z-40 bg-slate-900/40 xl:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed xl:sticky top-[70px] left-0 z-40 h-[calc(100vh-70px)] bg-navy border-r border-black/20
    flex flex-col transition-all duration-200 ease-in-out
    ${collapsed ? "xl:w-[76px]" : "xl:w-64"}
    ${open ? "translate-x-0" : "-translate-x-full"} xl:translate-x-0
    w-64`}
      >
        {/* ผู้ใช้ */}
        {!collapsed && (
          <div className="px-5 pb-4 mt-5 relative" ref={userMenuRef}>
            <div className="flex items-center gap-3">
              <UserAvatar
                avatarUrl={user?.avatar_url}
                prefixCode={user?.prefix_code}
                prefixes={user?.prefixes}
                firstName={user?.first_name}
                className="h-11 w-11 text-sm shrink-0"
                alt={user?.first_name || "ผู้ใช้"}
              />

              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="min-w-0 text-left flex-1"
              >
                <span className="flex items-center gap-1 text-[14px] font-semibold text-white">
                  <span className="truncate">
                    {user?.first_name || "ไม่ระบุชื่อ"}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`shrink-0 transition-transform text-slate-400 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {schoolName && (
                  <p className="mt-0.5 truncate text-[11.5px] text-slate-400">
                    {schoolName}
                  </p>
                )}
              </button>

              <button
                onClick={onClose}
                className="ml-auto xl:hidden p-1.5 rounded-md hover:bg-white/5 text-slate-400 shrink-0"
                aria-label="ปิดเมนู"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {userMenuOpen && (
              <div className="absolute left-5 right-5 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  โปรไฟล์
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  ตั้งค่า
                </Link>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        )}

        {collapsed && (
          <div className="flex xl:hidden justify-end px-3 pt-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-white/5 text-slate-400"
              aria-label="ปิดเมนู"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        {!collapsed && <div className="h-px bg-white/10 mx-5 mb-2" />}

        {/* เมนู — active = พื้นหลังทึบสีเน้น, children ใช้ "--" นำหน้า */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {visiblePages.map((page: MenuItem) => {
            const hasChildren =
              Array.isArray(page.children) && page.children.length > 0;
            const groupOpen = openGroups[page.label] ?? false;

            if (!hasChildren) {
              const active = isActive(page.path);
              return (
                <Link
                  key={page.id}
                  to={page.path}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: active ? ACCENT : "transparent",
                    color: active ? "#ffffff" : "#94a3b8",
                  }}
                  title={collapsed ? page.label : undefined}
                >
                  {page.icon && (
                    <page.icon fontSize="small" className="shrink-0" />
                  )}
                  {!collapsed && <span className="truncate">{page.label}</span>}
                </Link>
              );
            }

            return (
              <div key={page.id}>
                <div className="flex items-center rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
                  <Link
                    to={page.path}
                    onClick={onClose}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5"
                    title={collapsed ? page.label : undefined}
                  >
                    {page.icon && (
                      <page.icon fontSize="small" className="shrink-0" />
                    )}
                    {!collapsed && (
                      <span className="flex-1 truncate">{page.label}</span>
                    )}
                  </Link>

                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(page.label)}
                      className="mr-1 rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                      aria-label={`${groupOpen ? "ยุบ" : "ขยาย"}เมนู${page.label}`}
                      aria-expanded={groupOpen}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={`shrink-0 transition-transform ${
                          groupOpen ? "rotate-90" : ""
                        }`}
                      >
                        <path
                          d="M9 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {groupOpen && !collapsed && (
                  <div className="space-y-1 mt-1 mb-1">
                    {page.children?.map((child: MenuItem) => {
                      const active = isActive(child.path);
                      return (
                        <Link
                          key={child.id}
                          to={child.path}
                          onClick={onClose}
                          className="flex items-center gap-2 rounded-lg pl-7 pr-3 py-2 text-sm transition-colors"
                          style={{
                            backgroundColor: active
                              ? ACCENT_SOFT
                              : "transparent",
                            color: active ? ACCENT : "#94a3b8",
                          }}
                        >
                          <span className="select-none text-slate-500">--</span>
                          {child.icon && (
                            <child.icon fontSize="small" className="shrink-0" />
                          )}
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="hidden xl:flex items-center justify-center gap-2 py-3 border-t border-white/10 text-slate-400 hover:bg-white/5 text-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            >
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {!collapsed && "ย่อเมนู"}
          </button>
        )}
      </aside>
    </>
  );
}
