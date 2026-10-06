import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import { useAppSelector } from "../store/hooks";
import { filterPagesByPermission } from "../utils/menu";
import { pages } from "../constants/menu.config";
import type { MenuItem } from "../types/menu";
import { fetchMyModules } from "../features/setting/api/moduleSettings";
import logo from "../assets/images/logo_tara.webp";

type SchoolSidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

const FALLBACK_MODULES = new Set([
  "attendance",
  "evaluation",
  "personnel",
  "users",
  "reports",
  "settings",
]);

export default function SchoolSidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
}: SchoolSidebarProps) {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMyModules()
      .then((modules) => {
        setEnabledModules(
          new Set(
            modules
              .filter((module) => module.enabled && module.show_on_web)
              .map((module) => module.key),
          ),
        );
      })
      .catch(() => setEnabledModules(FALLBACK_MODULES));
  }, []);

  const visiblePages = filterPagesByPermission(
    pages,
    user?.permissions ?? [],
    enabledModules,
  );

  const pathIsActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(`${path}/`));

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#07182d]/55 backdrop-blur-[2px] xl:hidden"
          onClick={onClose}
          aria-label="ปิดเมนู"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[252px] flex-col overflow-hidden border-r border-white/10 bg-[#0b223d] text-white shadow-2xl transition-transform duration-200 xl:sticky xl:top-0 xl:z-40 xl:shrink-0 xl:translate-x-0 xl:shadow-none ${
          collapsed ? "xl:w-[76px]" : "xl:w-[252px]"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[74px] shrink-0 items-center border-b border-white/10 px-4">
          <Link
            to="/dashboard"
            onClick={onClose}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <img
              src={logo}
              alt="ตราโรงเรียนท่าแร่วิทยา"
              className="h-11 w-11 shrink-0 object-contain"
            />
            {!collapsed ? (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-base font-semibold">
                  ท่าแร่วิทยา
                </span>
                <span className="mt-1 block truncate text-[9px] tracking-wide text-slate-400">
                  THARAE WITTHAYA SCHOOL
                </span>
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white xl:hidden"
            aria-label="ปิดเมนู"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar-scrollbar flex-1 space-y-1 overflow-y-auto px-2.5 py-4">
          {visiblePages.map((page: MenuItem) => {
            const hasChildren = Boolean(page.children?.length);
            const childActive = Boolean(
              page.children?.some((child) => pathIsActive(child.path)),
            );
            const active = pathIsActive(page.path) || childActive;
            const groupOpen = openGroups[page.label] ?? childActive;

            if (!hasChildren) {
              return (
                <Link
                  key={page.id}
                  to={page.path}
                  onClick={onClose}
                  title={collapsed ? page.label : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    active
                      ? "bg-[#1473e6] text-white shadow-[0_8px_20px_rgba(20,115,230,0.3)]"
                      : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                  } ${collapsed ? "xl:justify-center xl:px-0" : ""}`}
                >
                  {page.icon ? (
                    <page.icon fontSize="small" className="shrink-0" />
                  ) : null}
                  {!collapsed ? <span className="truncate">{page.label}</span> : null}
                </Link>
              );
            }

            return (
              <div key={page.id}>
                <div
                  className={`flex min-h-11 items-center rounded-lg transition-colors ${
                    active
                      ? "bg-[#1473e6] text-white shadow-[0_8px_20px_rgba(20,115,230,0.3)]"
                      : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <Link
                    to={page.path}
                    onClick={onClose}
                    title={collapsed ? page.label : undefined}
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 text-[13px] font-medium focus-visible:outline-none ${
                      collapsed ? "xl:justify-center xl:px-0" : ""
                    }`}
                  >
                    {page.icon ? (
                      <page.icon fontSize="small" className="shrink-0" />
                    ) : null}
                    {!collapsed ? (
                      <span className="truncate">{page.label}</span>
                    ) : null}
                  </Link>

                  {!collapsed ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((current) => ({
                          ...current,
                          [page.label]: !groupOpen,
                        }))
                      }
                      className="mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-md text-current/70 hover:bg-white/10 hover:text-current"
                      aria-label={`${groupOpen ? "ยุบ" : "ขยาย"}เมนู${page.label}`}
                      aria-expanded={groupOpen}
                    >
                      <ChevronRight
                        size={16}
                        className={`transition-transform ${groupOpen ? "rotate-90" : ""}`}
                      />
                    </button>
                  ) : null}
                </div>

                {groupOpen && !collapsed ? (
                  <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-2">
                    {page.children?.map((child) => {
                      const activeChild = pathIsActive(child.path);
                      return (
                        <Link
                          key={child.id}
                          to={child.path}
                          onClick={onClose}
                          className={`flex min-h-9 items-center rounded-lg px-3 text-xs transition-colors ${
                            activeChild
                              ? "bg-blue-400/15 text-blue-200"
                              : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                          }`}
                        >
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden min-h-12 items-center justify-center gap-2 border-t border-white/10 px-3 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-white xl:flex"
          aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed ? <span>ย่อเมนู</span> : null}
        </button>
      </aside>
    </>
  );
}
