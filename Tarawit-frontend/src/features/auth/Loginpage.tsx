import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginThunk } from "./authSlice";

function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L2 20h20L12 2z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="15" r="1.5" fill="white" />
    </svg>
  );
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await dispatch(loginThunk({ username, password })).unwrap();
      navigate("/dashboard", { replace: true });
    } catch {
      // error ถูกจัดการใน slice แล้ว
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* แถบ accent บนสุด */}
      <div className="h-2 bg-[#68A59F] shrink-0" />

      {/* หัวข้อระบบสำหรับมือถือ — เดิมชื่อ "THARAE INSPIRE" อยู่ในพาเนลซ้าย
          ที่มี class "hidden md:flex" เท่านั้น มือถือเลยไม่เห็นชื่อระบบเลย
          ตอนนี้ใส่รูปโรงเรียนเป็นพื้นหลัง + gradient ทับให้ข้อความอ่านง่าย */}
      <div className="md:hidden relative h-44 shrink-0 overflow-hidden bg-[#1F3E57]">
        {/* TODO: เปลี่ยน src เป็นรูปโรงเรียนจริง เช่น /assets/school-hero.jpg */}
        <img
          src="/assets/images/school-hero.png"
          alt="โรงเรียนท่าแร่วิทยา"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F3E57] via-[#1F3E57]/70 to-[#1F3E57]/20" />

        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-6 py-4">
          <LogoMark size={26} />
          <div className="leading-tight">
            <div className="text-white text-base font-semibold tracking-wide">
              THARAE INSPIRE
            </div>
            <div className="text-white/60 text-[11px] tracking-wide">
              ระบบนิเทศน์ภายในสถานศึกษา โรงเรียนท่าแร่วิทยา
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Panel ซ้าย: navy เข้ม + โลโก้ (จอใหญ่เท่านั้น — มือถือใช้แถบหัวข้อด้านบนแทน) */}
        <div className="hidden md:flex md:w-[45%] lg:w-[38%] bg-[#1F3E57] flex-col px-16 pt-16 relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <LogoMark size={30} />
            <div className="leading-tight">
              <div className="text-white text-lg font-semibold tracking-wide">
                THARAE INSPIRE
              </div>
              <div className="text-white/50 text-xs tracking-wide">
                ระบบนิเทศน์ภายในสถานศึกษา โรงเรียนท่าแร่วิทยา
              </div>
            </div>
          </div>

          {/* ลายเส้นกราฟไต่ขึ้น สื่อถึงพัฒนาการ วางเบาๆ มุมล่างซ้าย */}
          <svg
            className="absolute -bottom-6 -left-10 w-[420px] h-[420px] opacity-[0.08]"
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
        </div>

        {/* Panel ขวา: background สื่อการพัฒนา/เติบโต (จอใหญ่เท่านั้น) */}
        <div className="hidden md:block flex-1 relative overflow-hidden bg-gradient-to-br from-[#F8F9FA] via-[#EEF3F1] to-[#E7EEEC]">
          {/* dot grid จางๆ เป็น texture พื้นหลัง */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.25]"
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
                <circle cx="2" cy="2" r="1.4" fill="#1F3E57" />
              </pattern>
            </defs>
            <rect width="800" height="600" fill="url(#dotgrid)" />
          </svg>

          {/* blob ลอยเบาๆ */}
          <div className="absolute top-[12%] right-[18%] w-64 h-64 rounded-full bg-[#68A59F]/15 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-[15%] right-[8%] w-48 h-48 rounded-full bg-[#EF9F27]/15 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />

          {/* กราฟเส้นไต่ขึ้นหลายชั้น สื่อ "พัฒนาการ" อย่างชัดเจน */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* เส้น trend หลัก */}
            <path
              d="M 420 460 L 490 400 L 550 430 L 620 340 L 690 370 L 760 250"
              stroke="#1F3E57"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.55"
            />
            {/* เส้น trend รอง จางกว่า วางเหลื่อมกันให้ดูมีมิติ */}
            <path
              d="M 440 500 L 510 470 L 570 490 L 640 420 L 710 440 L 780 340"
              stroke="#68A59F"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
            />

            {/* จุด node บนเส้นหลัก พร้อม ring ล้อมรอบให้ดูเหมือน "milestone" */}
            {[
              [420, 460],
              [490, 400],
              [620, 340],
              [760, 250],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="9" fill="#1F3E57" opacity="0.08" />
                <circle cx={cx} cy={cy} r="4.5" fill="#1F3E57" opacity="0.6" />
              </g>
            ))}

            {/* แท่ง bar เล็กๆ ไต่ระดับ มุมล่างขวา สื่อ progress */}
            {[0, 1, 2, 3, 4].map((i) => (
              <rect
                key={i}
                x={560 + i * 26}
                y={560 - (i + 1) * 22}
                width="14"
                height={(i + 1) * 22}
                rx="3"
                fill="#EF9F27"
                opacity={0.15 + i * 0.06}
              />
            ))}
          </svg>
        </div>

        {/* การ์ด Login
            มือถือ: อยู่ในโฟลว์ปกติใต้แถบหัวข้อ กึ่งกลางแนวนอน ไม่ทับกับอะไร
            จอใหญ่ (md+): ตำแหน่ง absolute คร่อมเส้นแบ่งพาเนลเหมือนเดิม */}
        <div
          className="flex-1 flex items-center justify-center px-4 py-10 bg-slate-50
                     md:block md:px-0 md:py-0 md:bg-transparent
                     md:absolute md:left-16 md:right-auto md:top-1/2 md:-translate-y-1/2 md:w-[420px]"
        >
          <div className="w-full max-w-sm md:max-w-none bg-white rounded-lg shadow-xl px-8 py-9 md:px-10 md:py-10">
            <h1 className="text-2xl font-semibold text-slate-800 mb-1">
              เข้าสู่ระบบ
            </h1>
            <p className="text-sm text-slate-500 mb-8">
              สำหรับเจ้าหน้าที่และผู้ดูแลระบบ
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="ชื่อผู้ใช้"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-md bg-slate-50 border border-slate-200 px-4 py-3 text-sm
                           placeholder:text-slate-400 mb-4
                           focus:outline-none focus:ring-2 focus:ring-[#68A59F] focus:border-[#68A59F]"
              />

              <input
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md bg-slate-50 border border-slate-200 px-4 py-3 text-sm
                           placeholder:text-slate-400 mb-4
                           focus:outline-none focus:ring-2 focus:ring-[#68A59F] focus:border-[#68A59F]"
              />

              <label className="flex items-center gap-2 mb-6 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#68A59F] focus:ring-[#68A59F]"
                />
                <span className="text-sm text-slate-600">จดจำฉันไว้</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[#68A59F] text-white text-sm font-semibold tracking-wide py-3
                           hover:bg-[#4C7C77] disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors uppercase"
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>

              {error && (
                <p className="text-red-600 text-sm mt-3 text-center">{error}</p>
              )}

              <div className="text-center mt-6">
                <Link
                  to="/report"
                  className="text-sm text-[#1F3E57] hover:underline"
                >
                  ยกเลิก
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
