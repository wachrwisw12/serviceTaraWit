import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Grid2X2,
  LogOut,
  Menu,
  PanelLeft,
  Search,
  Settings,
  UserRound,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutThunk } from "../features/auth/authSlice";
import UserAvatar from "../features/user/components/UserAvatar";

type SchoolAppbarProps = {
  onOpenMenu: () => void;
  onToggleSidebar: () => void;
};

export default function SchoolAppbar({
  onOpenMenu,
  onToggleSidebar,
}: SchoolAppbarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [searchValue, setSearchValue] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await dispatch(logoutThunk()).unwrap();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const displayName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ");
  const roleName = user?.roles?.[0]?.role_name || "ผู้ใช้งานระบบ";

  return (
    <header className="sticky top-0 z-30 flex h-[74px] shrink-0 items-center border-b border-[#dce7f5] bg-white/95 px-3 shadow-[0_2px_16px_rgba(28,72,122,0.06)] backdrop-blur md:px-5">
      <button
        type="button"
        onClick={onOpenMenu}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#29415e] transition hover:bg-blue-50 hover:text-[#1473e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 xl:hidden"
        aria-label="เปิดเมนู"
      >
        <Menu size={21} />
      </button>
      <button
        type="button"
        onClick={onToggleSidebar}
        className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl text-[#29415e] transition hover:bg-blue-50 hover:text-[#1473e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 xl:grid"
        aria-label="ย่อหรือขยายเมนู"
      >
        <PanelLeft size={20} />
      </button>

      <div className="ml-2 hidden min-w-0 flex-1 sm:block md:ml-3">
        <label className="relative block max-w-md">
          <span className="sr-only">ค้นหาในระบบ</span>
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c90aa]"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="ค้นหาเมนู รายชื่อ เอกสาร..."
            className="h-10 w-full rounded-xl border border-[#e2eaf4] bg-[#f5f8fc] pl-10 pr-4 text-sm text-[#152c47] outline-none transition placeholder:text-[#8da0b8] focus:border-[#1473e6] focus:bg-white focus:ring-4 focus:ring-[#1473e6]/10"
          />
        </label>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="relative grid h-10 w-10 place-items-center rounded-xl text-[#536a84] transition hover:bg-blue-50 hover:text-[#1473e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="การแจ้งเตือน"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <Link
          to="/dashboard"
          className="grid h-10 w-10 place-items-center rounded-xl text-[#536a84] transition hover:bg-blue-50 hover:text-[#1473e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="เมนูหลัก"
        >
          <Grid2X2 size={18} />
        </Link>

        <div className="mx-1 hidden h-7 w-px bg-[#e2eaf4] sm:block" />

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((current) => !current)}
            className="flex min-h-11 items-center gap-2 rounded-xl px-1.5 text-left transition hover:bg-[#f5f8fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:px-2"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <UserAvatar
              avatarUrl={user?.avatar_url}
              prefixCode={user?.prefix_code}
              prefixes={user?.prefixes}
              firstName={user?.first_name}
              className="h-9 w-9 shrink-0 text-sm"
              alt={displayName || "ผู้ใช้"}
            />
            <span className="hidden max-w-[160px] leading-tight lg:block">
              <span className="block truncate text-xs font-semibold text-[#152c47]">
                {displayName || "ไม่ระบุชื่อ"}
              </span>
              <span className="mt-1 block truncate text-[10px] text-[#7c90aa]">
                {roleName}
              </span>
            </span>
            <ChevronDown
              size={15}
              className={`hidden text-[#7c90aa] transition-transform lg:block ${
                userMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {userMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[#e2eaf4] bg-white py-1.5 shadow-[0_18px_50px_rgba(20,52,88,0.16)]"
            >
              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#29415e] hover:bg-[#f5f8fc]"
              >
                <UserRound size={17} />
                โปรไฟล์
              </Link>
              <Link
                to="/settings"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#29415e] hover:bg-[#f5f8fc]"
              >
                <Settings size={17} />
                ตั้งค่า
              </Link>
              <div className="my-1 h-px bg-[#edf2f7]" />
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={17} />
                ออกจากระบบ
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
