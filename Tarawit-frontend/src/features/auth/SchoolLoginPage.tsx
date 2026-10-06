import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  MessageCircle,
  ShieldCheck,
  User,
  UsersRound,
} from "lucide-react";
import api from "../../api/axios";
import { setRefreshToken, setToken } from "../../api/tokenStorage";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { loginThunk, verifyTokenThunk } from "./authSlice";
import logo from "../../assets/images/logo_tara.webp";
import campusHero from "../../assets/images/school-campus-hero.jpg";

const SCHOOL_NAME = "โรงเรียนท่าแร่วิทยา";
const SCHOOL_NAME_EN = "THARAE WITTHAYA SCHOOL";
const CURRENT_THAI_YEAR = new Date().getFullYear() + 543;

const FEATURE_ITEMS = [
  {
    label: "บริหารจัดการ\nข้อมูลโรงเรียน",
    Icon: UsersRound,
    boxClass: "from-blue-500 to-blue-700",
  },
  {
    label: "สนับสนุนการเรียน\nการสอน",
    Icon: BookOpen,
    boxClass: "from-violet-500 to-violet-700",
  },
  {
    label: "เชื่อมโยงข้อมูล\nอย่างเป็นระบบ",
    Icon: BarChart3,
    boxClass: "from-emerald-400 to-emerald-600",
  },
  {
    label: "ปลอดภัย\nเชื่อถือได้",
    Icon: ShieldCheck,
    boxClass: "from-orange-400 to-orange-500",
  },
];

function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <img
      src={logo}
      alt="ตราโรงเรียนท่าแร่วิทยา"
      width={size}
      height={size}
      className="shrink-0 object-contain"
    />
  );
}

export default function SchoolLoginPage() {
  useDocumentTitle("เข้าสู่ระบบ");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error: storeError } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [lineEnabled, setLineEnabled] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("error");
  });

  useEffect(() => {
    api
      .get("/auth/line/config")
      .then((response) => setLineEnabled(!!response.data?.enabled))
      .catch(() => setLineEnabled(false));
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const lineToken = params.get("line_token");
    const lineRefresh = params.get("line_refresh_token");
    const lineError = params.get("line_error");

    window.history.replaceState(null, "", window.location.pathname);

    if (lineToken) {
      setToken(lineToken, true);
      if (lineRefresh) setRefreshToken(lineRefresh, true);
      dispatch(verifyTokenThunk()).then(() => {
        navigate("/dashboard", { replace: true });
      });
    } else if (lineError) {
      // LINE callback is an external browser event; surface its result in the form.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(lineError);
    }
  }, [dispatch, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await dispatch(loginThunk({ username, password, remember })).unwrap();
      navigate("/dashboard", { replace: true });
    } catch (loginError) {
      const message =
        typeof loginError === "string" && loginError
          ? loginError
          : "เข้าสู่ระบบไม่สำเร็จ";
      setError(message);
      window.location.assign(`/login?error=${encodeURIComponent(message)}`);
    }
  };

  const displayedError = error || storeError;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#eaf4ff] p-3 sm:p-4">
      <div
        className="pointer-events-none absolute -right-36 -top-44 h-[520px] w-[520px] rotate-45 rounded-[80px] bg-white/45"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-56 left-[42%] h-[500px] w-[500px] rotate-45 rounded-[80px] bg-[#cfe5ff]/65"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid min-h-[calc(100dvh-24px)] max-w-[1680px] gap-4 lg:min-h-[calc(100dvh-32px)] lg:grid-cols-[minmax(0,3fr)_minmax(430px,2fr)]">
        <section className="relative hidden overflow-hidden rounded-2xl bg-[#0568d5] shadow-[0_20px_60px_rgba(15,74,145,0.18)] lg:flex lg:flex-col">
          <img
            src={campusHero}
            alt="อาคารและบริเวณโรงเรียนท่าแร่วิทยา"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#0053b8]/95 via-[#096fd1]/45 to-[#082f68]/20"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#003d91]/50 via-transparent to-transparent"
            aria-hidden="true"
          />

          <header className="relative z-10 flex items-center gap-4 px-10 pt-9 xl:px-16 xl:pt-12">
            <LogoMark size={58} />
            <div className="leading-tight text-white">
              <p className="text-xl font-semibold xl:text-2xl">{SCHOOL_NAME}</p>
              <p className="mt-1 text-xs tracking-[0.06em] text-white/85 xl:text-sm">
                {SCHOOL_NAME_EN}
              </p>
            </div>
          </header>

          <div className="relative z-10 max-w-3xl px-10 pt-12 text-white xl:px-20 xl:pt-16">
            <h1 className="text-[clamp(2rem,3vw,3.5rem)] font-semibold leading-[1.28] tracking-tight drop-shadow-sm">
              ยินดีต้อนรับเข้าสู่ IQAT SYSTEM
              <br />
              ระบบสารสนเทศ{SCHOOL_NAME}
            </h1>
            <p className="mt-5 text-lg font-light leading-8 text-white/95 drop-shadow-sm xl:text-xl">
              “บริหารจัดการข้อมูลโรงเรียนอย่างมีประสิทธิภาพ
              <br />
              เพื่อการศึกษาที่ดียิ่งขึ้น”
            </p>
          </div>

          <div className="relative z-10 mt-auto grid grid-cols-4 divide-x divide-slate-300/70 bg-white/85 px-5 py-5 backdrop-blur-md xl:px-8 xl:py-6">
            {FEATURE_ITEMS.map(({ label, Icon, boxClass }) => (
              <div
                key={label}
                className="flex flex-col items-center px-3 text-center"
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${boxClass} text-white shadow-lg xl:h-14 xl:w-14`}
                >
                  <Icon size={26} strokeWidth={2.2} />
                </span>
                <p className="mt-3 whitespace-pre-line text-xs font-medium leading-5 text-slate-800 xl:text-sm">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center py-4 lg:py-8">
          <div className="w-full max-w-[560px] rounded-[24px] border border-white/80 bg-white/95 px-6 py-8 shadow-[0_24px_70px_rgba(23,91,166,0.14)] backdrop-blur sm:px-10 sm:py-10 lg:px-11">
            <header className="text-center">
              <div className="mx-auto mb-3 flex justify-center">
                <LogoMark size={78} />
              </div>
              <h2 className="text-2xl font-semibold text-[#101a3d]">
                {SCHOOL_NAME}
              </h2>
              <p className="mt-1 text-xs tracking-[0.08em] text-[#7183a7]">
                {SCHOOL_NAME_EN}
              </p>
              <div className="mt-6">
                <p className="text-[28px] font-semibold text-[#101a3d]">
                  เข้าสู่ระบบ
                </p>
                <p className="mt-1 text-sm text-[#7183a7]">
                  สำหรับผู้ดูแลระบบ ครู บุคลากร และนักเรียน
                </p>
              </div>
            </header>

            <form onSubmit={handleSubmit} className="mt-6">
              <label htmlFor="username" className="sr-only">
                ชื่อผู้ใช้หรืออีเมล
              </label>
              <div className="relative">
                <User
                  size={20}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7183a7]"
                />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="ชื่อผู้ใช้ / อีเมล"
                  autoComplete="username"
                  required
                  disabled={loading}
                  aria-invalid={displayedError ? true : undefined}
                  aria-describedby={displayedError ? "login-error" : undefined}
                  className="h-14 w-full rounded-xl border border-[#ccd8eb] bg-white pl-12 pr-4 text-sm text-[#101a3d] outline-none transition placeholder:text-[#8493b0] focus:border-[#1272f3] focus:ring-4 focus:ring-[#1272f3]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <label htmlFor="password" className="sr-only">
                รหัสผ่าน
              </label>
              <div className="relative mt-4">
                <Lock
                  size={20}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7183a7]"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="รหัสผ่าน"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  aria-invalid={displayedError ? true : undefined}
                  aria-describedby={displayedError ? "login-error" : undefined}
                  className="h-14 w-full rounded-xl border border-[#ccd8eb] bg-white pl-12 pr-14 text-sm text-[#101a3d] outline-none transition placeholder:text-[#8493b0] focus:border-[#1272f3] focus:ring-4 focus:ring-[#1272f3]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-1 right-1 grid w-12 place-items-center rounded-lg text-[#7183a7] transition hover:bg-blue-50 hover:text-[#1272f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1272f3]/40 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="my-4 flex min-h-11 items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#273657] select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    disabled={loading}
                    className="h-5 w-5 rounded accent-[#1272f3]"
                  />
                  <span>จดจำการเข้าสู่ระบบ</span>
                </label>
                <span className="text-sm font-medium text-[#1272f3]">
                  ลืมรหัสผ่าน?
                </span>
              </div>

              {displayedError ? (
                <div
                  id="login-error"
                  role="alert"
                  className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                >
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />
                  <p className="text-[13px] leading-5 text-red-700">
                    {displayedError}
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#1272f3] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(18,114,243,0.24)] transition hover:bg-[#0864df] hover:shadow-[0_12px_28px_rgba(18,114,243,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1272f3]/50 focus-visible:ring-offset-2 active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <LogIn size={19} />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>

              {lineEnabled ? (
                <>
                  <div
                    className="my-5 flex items-center gap-4"
                    aria-hidden="true"
                  >
                    <span className="h-px flex-1 bg-[#d9e2ef]" />
                    <span className="text-xs text-[#7183a7]">หรือ</span>
                    <span className="h-px flex-1 bg-[#d9e2ef]" />
                  </div>
                  <a
                    href="/api/auth/line"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-[#ccd8eb] bg-white text-sm font-semibold text-[#101a3d] transition hover:border-[#06c755] hover:bg-[#f1fff6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06c755]/40 focus-visible:ring-offset-2"
                  >
                    <MessageCircle size={20} className="text-[#06c755]" />
                    เข้าสู่ระบบด้วยบัญชี LINE
                  </a>
                </>
              ) : null}
            </form>

            <footer className="mt-7 text-center text-xs leading-5 text-[#7183a7]">
              <p>
                © {CURRENT_THAI_YEAR} {SCHOOL_NAME}
              </p>
              <p>อำเภอเมือง จังหวัดสกลนคร</p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
