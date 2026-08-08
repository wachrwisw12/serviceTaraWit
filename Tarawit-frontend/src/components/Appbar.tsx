import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../features/auth/authSlice";
import { pages } from "../constants/menu.config";
import { filterPagesByPermission } from "../utils/menu";
import logo from "../assets/images/logo.png";

type ResponsiveAppBarProps = {
  /** เรียกเมื่อกดปุ่มเมนูมือถือ ถ้าไม่ส่งมา จะ fallback ไปใช้ dropdown ภายในตัวมันเอง */
  onMenuClick?: () => void;
};

export default function ResponsiveAppBar({
  onMenuClick,
}: ResponsiveAppBarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const { user, status } = useAppSelector((s) => s.auth);
  const visiblePages = filterPagesByPermission(pages, user?.permissions ?? []);

  const [navOpen, setNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const userMenuRef = useRef<HTMLDivElement>(null);
  const navMenuRef = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อคลิกนอกพื้นที่
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        navMenuRef.current &&
        !navMenuRef.current.contains(e.target as Node)
      ) {
        setNavOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      navigate(from, { replace: true });
    } catch {
      // error ถูกจัดการใน slice แล้ว
    }
  };

  const handleMobileMenuButton = () => {
    if (onMenuClick) {
      onMenuClick(); // เปิด Sidebar drawer กลาง
    } else {
      setNavOpen((v) => !v); // fallback: dropdown เดิม
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      {/* แถบ accent บนสุด */}
      <div className="h-1.5 bg-[#68A59F]" />

      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 xl:px-6">
          <div className="h-16 flex items-center gap-4">
            {/* โลโก้ — แสดงเฉพาะ ≥1280px (จุดเดียวกับที่ Sidebar dock ถาวร) */}
            <Link to="/" className="hidden xl:flex items-center gap-2 shrink-0">
              <img src={logo} alt="Logo" className="h-8 w-auto" />
              <span className="text-slate-800 font-semibold text-sm leading-tight">
                ระบบนิเทศภายในสถานศึกษา
                <br />
                <span className="font-normal text-slate-500 text-xs">
                  โรงเรียนท่าแร่วิทยา
                </span>
              </span>
            </Link>

            {/* ปุ่มเมนู — แสดงตั้งแต่มือถือจนถึงจอ <1280px (รวม iPad ทุกแนว) เพื่อเปิด Sidebar drawer */}
            <div className="flex xl:hidden" ref={navMenuRef}>
              <button
                onClick={handleMobileMenuButton}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span className="text-sm font-medium">เมนู</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* fallback dropdown เฉพาะตอนไม่มี onMenuClick */}
              {!onMenuClick && navOpen && (
                <div className="absolute top-full left-2 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
                  {visiblePages.map((page) => (
                    <Link
                      key={page.id}
                      to={page.path}
                      onClick={() => setNavOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {page.icon && <page.icon fontSize="small" />}
                      {page.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ค้นหา */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search here..."
                  className="w-full h-10 pl-3.5 pr-10 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700
                             placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#68A59F]/30 focus:border-[#68A59F]"
                />
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="m21 21-4.3-4.3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* ไอคอนทางลัด — แสดงเฉพาะ ≥1280px คู่กับโลโก้/dock sidebar */}
            {status === "authenticated" && (
              <div className="hidden xl:flex items-center gap-1 shrink-0">
                <button
                  className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="ไฟล์"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="ปฏิทิน"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="16"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M3 9h18M8 3v4M16 3v4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                <button
                  className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="แชท"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 4h16v12H8l-4 4V4Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="ข้อความ"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="m4 6 8 6 8-6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  className="relative p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="การแจ้งเตือน"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.5 18a2.5 2.5 0 0 0 5 0"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
                </button>

                <button
                  className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="ตั้งค่า"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h14M22 17h-2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="16"
                      cy="7"
                      r="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle
                      cx="6"
                      cy="12"
                      r="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle
                      cx="18"
                      cy="17"
                      r="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="ออกจากระบบ"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 17l5-5-5-5M21 12H9"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1" />
              </div>
            )}

            {/* ฝั่งขวา: login หรือ avatar */}
            {status !== "authenticated" ? (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-700
                           hover:bg-slate-100 transition-colors shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M4 20c1.5-3.5 5-5 8-5s6.5 1.5 8 5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                สำหรับเจ้าหน้าที่
              </Link>
            ) : (
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                    {user?.first_name?.charAt(0) ?? "M"}
                  </div>
                  <span className="hidden xl:block text-sm font-medium text-slate-700">
                    {user?.first_name || "ไม่ระบุชื่อ"}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
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
          </div>
        </div>
      </div>
    </header>
  );
}
