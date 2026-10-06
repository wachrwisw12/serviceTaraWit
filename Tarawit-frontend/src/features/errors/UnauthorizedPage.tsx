import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-[64px] leading-none font-bold text-slate-300">
          403
        </div>
        <h1 className="mt-3 text-xl font-semibold text-slate-800">
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบหากคิดว่านี่เป็น
          ข้อผิดพลาด
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          กลับไปหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
