import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Shield,
  User as UserIcon,
} from "lucide-react";

import api from "../../api/axios";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import useSnackbar from "../../components/snackbar/useSnackbar";
import { setAvatarUrl, verifyTokenThunk } from "../auth/authSlice";
import UserAvatar from "../user/components/UserAvatar";

const ACCENT = "var(--color-primary)";

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);

  const dispatch = useAppDispatch();

  const { showSnackbar } = useSnackbar();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  // ---------- LINE Login ----------
  const [lineEnabled, setLineEnabled] = useState(false);
  const [linkingLine, setLinkingLine] = useState(false);

  // LINE callback redirect กลับมาที่ /profile พร้อม fragment:
  //   #line_linked=1 (เชื่อมสำเร็จ) / #line_error=... (เชื่อมไม่สำเร็จ)
  useEffect(() => {
    api
      .get("/auth/line/config")
      .then((res) => setLineEnabled(!!res.data?.enabled))
      .catch(() => setLineEnabled(false));

    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      return;
    }
    const params = new URLSearchParams(hash);
    // ล้าง fragment ออกจาก URL ทันที
    window.history.replaceState(null, "", window.location.pathname);

    if (params.get("line_linked") === "1") {
      showSnackbar("เชื่อมบัญชี LINE สำเร็จแล้ว", "success");
    } else if (params.get("line_error")) {
      showSnackbar(params.get("line_error")!, "error");
    }
  }, [showSnackbar]);

  const handleLinkLine = async () => {
    setLinkingLine(true);
    try {
      const res = await api.get("/auth/line/link-url");
      // redirect ไปหน้า LINE เพื่อขออนุญาต (กลับมาที่ /profile#line_linked=1)
      window.location.href = res.data.url;
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: {
              data?: {
                error?: string;
              };
            };
          }
        ).response?.data?.error ?? "เชื่อมบัญชี LINE ไม่สำเร็จ";
      showSnackbar(message, "error");
      setLinkingLine(false);
    }
  };

  // ---------- เปลี่ยนรหัสผ่าน ----------
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // ตรวจฝั่ง client ก่อน
    if (newPassword.length < 8) {
      showSnackbar("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน", "error");
      return;
    }
    if (newPassword === currentPassword) {
      showSnackbar("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม", "error");
      return;
    }

    setChangingPassword(true);

    try {
      await api.put("/user/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      showSnackbar("เปลี่ยนรหัสผ่านสำเร็จ", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        ).response?.data?.message ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ";

      showSnackbar(message, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSelectFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showSnackbar("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP, GIF)", "error");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    setUploading(true);

    try {
      const response = await api.post<{ avatar_url: string }>(
        "/user/profile/avatar",
        formData,
      );

      // อัปเดตทันทีให้รูปบน app bar เปลี่ยนโดยไม่ต้องรอ request รอบถัดไป
      dispatch(setAvatarUrl(response.data.avatar_url));
      // ซิงก์ข้อมูลผู้ใช้ทั้งหมดจาก server ต่อในพื้นหลัง
      dispatch(verifyTokenThunk());

      showSnackbar("อัปเดตรูปโปรไฟล์สำเร็จ", "success");
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        ).response?.data?.message ?? "อัปโหลดรูปไม่สำเร็จ";

      showSnackbar(message, "error");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
        <p className="mt-1 text-sm text-gray-500">
          ข้อมูลส่วนตัวและรูปโปรไฟล์ที่แสดงในระบบ
        </p>
      </div>

      {/* Avatar card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <UserAvatar
              avatarUrl={user.avatar_url}
              prefixCode={user.prefix_code}
              prefixes={user.prefixes}
              firstName={user.first_name}
              className="h-28 w-28 rounded-full border-4 border-gray-100 text-4xl font-bold"
              alt={fullName || "รูปโปรไฟล์"}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="เปลี่ยนรูปโปรไฟล์"
              className="
                absolute -bottom-1 -right-1
                flex h-10 w-10 items-center justify-center
                rounded-full
                text-white
                shadow-md
                transition-opacity
                hover:opacity-90
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              style={{ backgroundColor: ACCENT }}
            >
              <Camera className="h-5 w-5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSelectFile}
            />
          </div>

          <div className="min-w-0 text-center sm:text-left">
            <h2 className="truncate text-lg font-semibold text-gray-900">
              {fullName || "ไม่ระบุชื่อ"}
            </h2>
            <p className="text-sm text-gray-500">@{user.username}</p>

            {uploading && (
              <p className="mt-2 text-xs font-medium" style={{ color: ACCENT }}>
                กำลังอัปโหลดรูป...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">ข้อมูลส่วนตัว</h2>
        </div>

        <dl className="divide-y divide-gray-100">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              <UserIcon className="h-5 w-5" />
            </div>

            <dt className="w-32 shrink-0 text-sm text-gray-500">
              ชื่อ-นามสกุล
            </dt>

            <dd className="min-w-0 text-sm font-medium text-gray-800">
              {fullName || "—"}
            </dd>
          </div>

          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              <UserIcon className="h-5 w-5" />
            </div>

            <dt className="w-32 shrink-0 text-sm text-gray-500">ชื่อผู้ใช้</dt>

            <dd className="min-w-0 text-sm font-medium text-gray-800">
              {user.username}
            </dd>
          </div>

          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              <Mail className="h-5 w-5" />
            </div>

            <dt className="w-32 shrink-0 text-sm text-gray-500">อีเมล</dt>

            <dd className="min-w-0 text-sm font-medium text-gray-800">
              {user.email || "—"}
            </dd>
          </div>

          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              <Shield className="h-5 w-5" />
            </div>

            <dt className="w-32 shrink-0 text-sm text-gray-500">บทบาท</dt>

            <dd className="min-w-0">
              <div className="flex flex-wrap gap-1.5">
                {user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <span
                      key={role.role_name}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-dark"
                    >
                      {role.role_name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </dd>
          </div>
        </dl>
      </div>

      {/* เชื่อมบัญชี LINE — แสดงเมื่อตั้งค่า LINE Login แล้วเท่านั้น */}
      {lineEnabled && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <MessageCircle className="h-4 w-4 text-[#06C755]" />
              เข้าสู่ระบบด้วย LINE
            </h2>
          </div>

          <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              เชื่อมบัญชี LINE เพื่อเข้าสู่ระบบครั้งต่อไปได้โดยไม่ต้องกรอก
              รหัสผ่าน
            </div>
            <button
              type="button"
              onClick={handleLinkLine}
              disabled={linkingLine}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-[#06C755]
                         bg-[#06C755]/5 px-5 py-2.5 text-sm font-semibold text-[#06C755]
                         hover:bg-[#06C755] hover:text-white
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              {linkingLine ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {linkingLine ? "กำลังเชื่อม..." : "เชื่อมบัญชี LINE"}
            </button>
          </div>
        </div>
      )}

      {/* เปลี่ยนรหัสผ่าน */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <KeyRound className="h-4 w-4 text-gray-400" />
            เปลี่ยนรหัสผ่าน
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 px-5 py-5">
          <div>
            <label
              htmlFor="current-password"
              className="mb-1 block text-sm font-medium text-gray-600"
            >
              รหัสผ่านเดิม
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="รหัสผ่านปัจจุบัน"
                required
                className="w-full rounded-md border border-gray-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="mb-1 block text-sm font-medium text-gray-600"
            >
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                required
                className="w-full rounded-md border border-gray-200 bg-slate-50 py-2.5 pl-9 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                aria-label={showNewPassword ? "ซ่อนรหัสผ่านใหม่" : "แสดงรหัสผ่านใหม่"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1 block text-sm font-medium text-gray-600"
            >
              ยืนยันรหัสผ่านใหม่
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                required
                className="w-full rounded-md border border-gray-200 bg-slate-50 py-2.5 pl-9 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "ซ่อนรหัสผ่านยืนยัน" : "แสดงรหัสผ่านยืนยัน"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="rounded-md px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              ล้างข้อมูล
            </button>
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              {changingPassword ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
