import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  MessageCircle,
  ShieldCheck,
  User,
} from "lucide-react";
import api from "../../api/axios";
import { setRefreshToken, setToken } from "../../api/tokenStorage";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useSystemName } from "../../features/setting/hooks/useSystemName";
import { loginThunk, verifyTokenThunk } from "./authSlice";
import logo from "../../assets/images/logo_tara.webp";

function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <img
      src={logo}
      alt="ตราโรงเรียนท่าแร่วิทยา"
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0 ring-1 ring-white/20"
    />
  );
}

/* รายชื่อโมดูลในระบบ — ใช้แสดงบนหน้า login (จอใหญ่) */
const MODULES = [
  "ลงเวลาปฏิบัติงาน",
  "ประเมินบุคลากร",
  "ข้อมูลบุคลากร",
  "รายงานและสถิติ",
];

const CURRENT_THAI_YEAR = new Date().getFullYear() + 543;

export default function LoginPage() {
  useDocumentTitle("เข้าสู่ระบบ");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error: storeError } = useAppSelector((s) => s.auth);
  const { shortName, displayName } = useSystemName();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [lineEnabled, setLineEnabled] = useState(false);
  // อ่านข้อความ error ที่ส่งผ่าน URL (?error=...) หลัง login ไม่ผ่าน
  const [error, setError] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("error");
  });

  // เช็คว่าเปิด LINE Login หรือยัง (ถ้ายังไม่ตั้งค่า env จะไม่แสดงปุ่ม)
  useEffect(() => {
    api
      .get("/auth/line/config")
      .then((res) => setLineEnabled(!!res.data?.enabled))
      .catch(() => setLineEnabled(false));
  }, []);

  // จัดการผลลัพธ์จาก LINE callback ที่ส่งกลับมาผ่าน URL fragment:
  //   #line_token=...&line_refresh_token=...  (login สำเร็จ)
  //   #line_error=...                         (login ไม่สำเร็จ)
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const lineToken = params.get("line_token");
    const lineRefresh = params.get("line_refresh_token");
    const lineError = params.get("line_error");

    // ล้าง fragment ออกจาก URL ทันที (กัน token ค้างในประวัติ/แท็บ)
    window.history.replaceState(null, "", window.location.pathname);

    if (lineToken) {
      // LINE login = จำไว้ (เก็บใน localStorage เหมือนติ๊ก "จดจำฉันไว้")
      setToken(lineToken, true);
      if (lineRefresh) {
        setRefreshToken(lineRefresh, true);
      }
      dispatch(verifyTokenThunk()).then(() => {
        navigate("/dashboard", { replace: true });
      });
    } else if (lineError) {
      // LINE callback is an external browser event; surface its result in the form.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(lineError);
    }
  }, [dispatch, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await dispatch(loginThunk({ username, password, remember })).unwrap();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // ใช้ข้อความจริงจาก backend (เช่น "รหัสผ่านไม่ถูกต้อง")
      const message =
        typeof err === "string" && err ? err : "เข้าสู่ระบบไม่สำเร็จ";
      setError(message);
      // กันปัญหาหน้าจอขาว: บังคับโหลดหน้าใหม่เพื่อรีเซ็ตสถานะ router ให้สะอาด
      // แล้วแสดงข้อความ error ผ่าน query param
      window.location.assign(`/login?error=${encodeURIComponent(message)}`);
    }
  };

  const displayedError = error || storeError;

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      {/* แถบ accent บนสุด */}
      <div className="h-1.5 bg-primary shrink-0" />

      {/* ===== หัวข้อระบบสำหรับมือถือ (md ขึ้นไปซ่อน) ===== */}
      <div className="md:hidden relative h-40 shrink-0 overflow-hidden bg-navy">
        {/* orbs ละมุน */}
        <div className="absolute -top-10 -right-8 w-44 h-44 rounded-full bg-primary/25 blur-2xl" />
        <div className="absolute -bottom-14 -left-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

        {/* เส้นกราฟไต่ขึ้น (คัดลอกธีมเดียวกับพาเนลซ้ายจอใหญ่) */}
        <svg
          className="absolute -bottom-4 -right-6 w-52 h-52 opacity-20"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M0 160 L40 130 L80 145 L120 95 L160 110 L200 40"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="130" r="4" fill="white" />
          <circle cx="120" cy="95" r="4" fill="white" />
          <circle cx="200" cy="40" r="4" fill="white" />
        </svg>

        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-5 pb-5">
          <LogoMark size={34} />
          <div className="leading-tight">
            <div className="text-white text-lg font-semibold tracking-wide">
              {shortName}
            </div>
            <div className="text-white/70 text-xs tracking-wide mt-0.5">
              {displayName}
            </div>
          </div>
        </div>
      </div>

      {/* ===== เนื้อหาหลัก ===== */}
      <div className="flex flex-1 relative">
        {/* ---- Panel ซ้าย: navy เข้ม (จอใหญ่เท่านั้น) ---- */}
        <div className="hidden md:flex md:w-[45%] lg:w-[42%] bg-navy flex-col px-12 xl:px-16 pt-14 pb-10 relative overflow-hidden">
          {/* orbs ละมุน */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-1/3 -left-28 w-72 h-72 rounded-full bg-white/5 blur-3xl" />

          {/* ลายเส้นกราฟไต่ขึ้น — สื่อถึงพัฒนาการ */}
          <svg
            className="absolute -bottom-6 -left-10 w-[420px] h-[420px] opacity-[0.09]"
            viewBox="0 0 400 400"
            fill="none"
          >
            <path
              d="M0 320 L70 260 L140 290 L210 180 L280 210 L400 60"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="70" cy="260" r="5" fill="white" />
            <circle cx="210" cy="180" r="5" fill="white" />
            <circle cx="400" cy="60" r="5" fill="white" />
          </svg>

          {/* โลโก้ + ชื่อระบบ */}
          <div className="relative z-10 flex items-center gap-3">
            <LogoMark size={38} />
            <div className="leading-tight">
              <div className="text-white text-xl font-semibold tracking-wide">
                {shortName}
              </div>
              <div className="text-white/50 text-xs tracking-wide mt-1">
                {displayName}
              </div>
            </div>
          </div>

          <div className="relative z-10 my-auto max-w-md py-12">
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-300">
              <span className="h-px w-8 bg-emerald-300/70" />
              ระบบสารสนเทศเพื่อโรงเรียน
            </p>
            <h2 className="text-3xl font-semibold leading-[1.4] tracking-tight text-white xl:text-4xl">
              เชื่อมทุกงาน
              <br />
              ให้โรงเรียนเดินหน้า
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
              จัดการข้อมูล บุคลากร และงานประเมินในพื้นที่เดียว
              เพื่อให้ทุกวันทำงานง่ายและเป็นระบบยิ่งขึ้น
            </p>
            <ul className="mt-7 grid grid-cols-2 gap-2.5" aria-label="บริการในระบบ">
              {MODULES.map((module) => (
                <li
                  key={module}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs text-slate-200"
                >
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-300" />
                  {module}
                </li>
              ))}
            </ul>
          </div>

          {/* ฝั่งล่าง: ข้อความสั้น */}
          <div className="relative z-10 mt-auto">
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <ShieldCheck size={14} className="text-primary" />
              <span>ปลอดภัยด้วยการยืนยันตัวตนหลายชั้น</span>
            </div>
          </div>
        </div>

        {/* ---- Panel ขวา: background สื่อการพัฒนา/เติบโต (จอใหญ่เท่านั้น) ---- */}
        <div className="hidden md:block flex-1 relative overflow-hidden bg-gradient-to-br from-[#F8F9FA] via-[#EEF3F1] to-[#E7EEEC]">
          {/* dot grid จางๆ */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.22]"
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="dotgrid"
                width="26"
                height="26"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.4" className="fill-navy" />
              </pattern>
            </defs>
            <rect width="800" height="600" fill="url(#dotgrid)" />
          </svg>

          {/* blob ลอยเบาๆ */}
          <div className="absolute top-[14%] right-[20%] w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-[18%] right-[10%] w-56 h-56 rounded-full bg-primary/10 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />

          {/* กราฟเส้นไต่ขึ้นหลายชั้น */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              d="M 420 460 L 490 400 L 550 430 L 620 340 L 690 370 L 760 250"
              className="stroke-navy"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.55"
            />
            <path
              d="M 440 500 L 510 470 L 570 490 L 640 420 L 710 440 L 780 340"
              className="stroke-primary"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
            />
            {[
              [420, 460],
              [490, 400],
              [620, 340],
              [760, 250],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="9"
                  className="fill-navy"
                  opacity="0.08"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="4.5"
                  className="fill-navy"
                  opacity="0.6"
                />
              </g>
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <rect
                key={i}
                x={560 + i * 26}
                y={560 - (i + 1) * 22}
                width="14"
                height={(i + 1) * 22}
                rx="3"
                className="fill-primary"
                opacity={0.15 + i * 0.06}
              />
            ))}
          </svg>

        </div>

        {/* ===== การ์ด Login =====
            มือถือ: อยู่ในโฟลว์ปกติใต้แถบหัวข้อ กึ่งกลางแนวนอน
            จอใหญ่ (md+): อยู่กึ่งกลางพาเนลด้านขวา */}
        <div
          className="flex-1 flex items-center justify-center px-4 py-10
                     md:absolute md:inset-y-0 md:right-0 md:w-[55%] md:px-8 md:py-10
                     lg:w-[58%] lg:px-12 xl:px-20"
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-2xl shadow-xl shadow-navy/10 ring-1 ring-slate-100
                       px-6 py-8 sm:px-8 sm:py-9 md:px-10 md:py-10
                       animate-[login-card-in_0.5s_ease-out_both]"
          >
            {/* หัวข้อ */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                <LogIn size={19} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800 leading-tight">
                  เข้าสู่ระบบ
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  ใช้บัญชีของโรงเรียนเพื่อเข้าสู่ระบบ
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* ชื่อผู้ใช้ */}
              <label className="block mb-4" htmlFor="username">
                <span className="block text-[13px] font-medium text-slate-600 mb-1.5">
                  ชื่อผู้ใช้หรืออีเมล
                </span>
                <div className="relative">
                  <User
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="กรอกชื่อผู้ใช้หรืออีเมล"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    disabled={loading}
                    aria-invalid={displayedError ? true : undefined}
                    aria-describedby={displayedError ? "login-error" : undefined}
                    className="w-full min-h-12 rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-700
                               placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
                               focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                  />
                </div>
              </label>

              {/* รหัสผ่าน */}
              <label className="block mb-4" htmlFor="password">
                <span className="block text-[13px] font-medium text-slate-600 mb-1.5">
                  รหัสผ่าน
                </span>
                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    aria-invalid={displayedError ? true : undefined}
                    aria-describedby={displayedError ? "login-error" : undefined}
                    className="w-full min-h-12 rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-12 py-3 text-sm text-slate-700
                               placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
                               focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-1 right-1 flex w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {/* จดจำฉันไว้ */}
              <label className="flex min-h-11 items-center gap-2.5 mb-5 px-1 rounded-lg cursor-pointer select-none focus-within:ring-2 focus-within:ring-primary/30">
                <span className="relative inline-flex">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loading}
                    className="peer sr-only"
                  />
                  <span
                    className="h-5 w-5 rounded-md border border-slate-300 bg-white flex items-center justify-center
                                   peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white
                                   peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2
                                   peer-checked:[&>svg]:opacity-100
                                   transition-colors"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="opacity-0 transition-opacity"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </span>
                <span className="text-sm text-slate-600">
                  จดจำฉันไว้
                  <span className="ml-1 hidden text-xs text-slate-400 sm:inline">
                    (ไม่แนะนำบนเครื่องที่ใช้ร่วมกัน)
                  </span>
                </span>
              </label>

              {displayedError && (
                <div
                  id="login-error"
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5"
                >
                  <AlertCircle
                    size={17}
                    className="text-red-600 shrink-0 mt-0.5"
                  />
                  <p className="text-[13px] text-red-700 leading-5">
                    {displayedError}
                  </p>
                </div>
              )}

              {/* ปุ่มเข้าใช้ */}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-12 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide py-3
                           flex items-center justify-center gap-2
                           hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
                           active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none
                           transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <LogIn size={17} />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>

              {/* เข้าสู่ระบบด้วย LINE — แสดงเมื่อตั้งค่า LINE Login แล้วเท่านั้น */}
              {lineEnabled && (
                <>
                  <div className="flex items-center gap-3 my-5">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs text-slate-400">หรือ</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <a
                    href="/api/auth/line"
                    className="w-full min-h-12 rounded-xl border border-[#06C755] bg-[#06C755]/5 text-[#059d43]
                               text-sm font-semibold py-3 flex items-center justify-center gap-2
                               hover:bg-[#06C755] hover:text-white hover:shadow-lg hover:shadow-[#06C755]/25
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755]/40 focus-visible:ring-offset-2
                               active:scale-[0.99] transition-all"
                  >
                    <MessageCircle size={17} />
                    เข้าสู่ระบบด้วย LINE
                  </a>
                </>
              )}

              {/* ลืมรหัสผ่าน */}
              <div className="mt-5 pt-5 border-t border-slate-100 text-center">
                <p className="text-[13px] text-slate-400">
                  ลืมรหัสผ่าน? โปรดติดต่อผู้ดูแลระบบ
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* footer */}
      <footer className="shrink-0 py-3 text-center text-[11px] text-slate-400">
        © {CURRENT_THAI_YEAR} · {displayName}
      </footer>
    </div>
  );
}
