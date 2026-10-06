import logo from "../assets/images/logo_tara.webp";
import { useSystemSettings } from "../features/setting/SystemSettingsContext";

export default function SplashScreen() {
  const { displayName, schoolName } = useSystemSettings();

  return (
    <div
      className="flex h-screen w-full flex-col items-center justify-center gap-8"
      style={{
        background:
          "radial-gradient(circle at 50% 35%, #1f3e57 0%, #151c28 75%)",
      }}
    >
      {/* โลโก้ใหญ่ + ring animation — อยู่กลางจอ */}
      <div className="relative flex items-center justify-center">
        {/* แสงวงแหวนกระจายออก */}
        <span className="absolute h-56 w-56 rounded-full border-2 border-primary/40 animate-splash-ring" />
        <span
          className="absolute h-56 w-56 rounded-full border-2 border-primary/40 animate-splash-ring"
          style={{ animationDelay: "0.7s" }}
        />

        {/* โลโก้ */}
        <div className="animate-splash-fade relative">
          <img
            src={logo}
            alt="โรงเรียนท่าแร่วิทยา"
            className="h-48 w-48 rounded-full object-cover shadow-2xl ring-4 ring-white/10 animate-splash-float"
          />
        </div>
      </div>

      {/* ข้อความ + จุดวิ่ง */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-lg font-semibold tracking-wide text-white">
          {displayName}
        </p>
        {schoolName && (
          <p className="text-sm text-white/50">{schoolName}</p>
        )}

        <div className="mt-1 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-primary animate-splash-dot"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
