import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Upload,
  X,
  User,
  Loader2,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import { fetchPersonnelById, resetPersonnelPassword, uploadPersonnelAvatar } from "../api/personnelSlice";
import UserAvatar from "../../user/components/UserAvatar";
import ImageCrop from "../../evaluation/components/ImageCrop";
import type { Personnel } from "../personnelType";

export default function PersonnelDetailPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const personnelId = id ? Number(id) : null;
  const { loading } = useAppSelector((state) => state.personnel);

  const [p, setP] = useState<Personnel | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [showResetPw, setShowResetPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    if (!personnelId) return;
    dispatch(fetchPersonnelById(personnelId)).then((res) => {
      if (fetchPersonnelById.fulfilled.match(res)) {
        setP(res.payload);
        setAvatarPreview(res.payload.avatar_url ?? null);
      }
    });
  }, [dispatch, personnelId]);

  const acceptAvatar = useCallback(
    (file: File) => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(file.type)) {
        snackbar.showSnackbar("รองรับเฉพาะไฟล์ JPG, PNG, WEBP, GIF", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        snackbar.showSnackbar("รูปภาพต้องมีขนาดไม่เกิน 5 MB", "error");
        return;
      }
      setCropFile(file);
    },
    [snackbar],
  );

  function handleCropConfirm(croppedFile: File) {
    setCropFile(null);
    setAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(croppedFile));
  }

  function handleCropCancel() {
    setCropFile(null);
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) acceptAvatar(file);
  }

  /* ---- drag & drop ---- */
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptAvatar(file);
  }

  async function handleAvatarUpload() {
    if (!personnelId || !avatarFile) return;
    setUploading(true);
    const res = await dispatch(uploadPersonnelAvatar({ id: personnelId, file: avatarFile }));
    setUploading(false);
    if (uploadPersonnelAvatar.fulfilled.match(res)) {
      snackbar.showSnackbar("อัปเดตรูปโปรไฟล์สำเร็จ", "success");
      setAvatarFile(null);
      // อัปเดตข้อมูลใน state
      setP((prev) => (prev ? { ...prev, avatar_url: res.payload.avatar_url } : prev));
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "อัปโหลดรูปไม่สำเร็จ",
        "error",
      );
    }
  }

  if (loading && !p) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!p) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">ไม่พบข้อมูลบุคลากร</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/personnel/list")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-primary-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปรายชื่อบุคลากร
      </button>

      {/* ===== Header card ===== */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 p-6 shadow-sm transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Avatar + upload */}
          <div className="relative group shrink-0">
            <UserAvatar
              avatarUrl={avatarPreview}
              prefixCode={p.prefix_code}
              prefixes={p.prefix_name}
              firstName={p.first_name}
              className="h-28 w-28 text-3xl"
              alt={`${p.prefix_name ?? ""} ${p.first_name ?? ""} ${p.last_name ?? ""}`}
            />
            {/* overlay ปุ่มแก้ไขรูป */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>

          {/* Name + badges */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-gray-900">
              {p.prefix_name ? `${p.prefix_name} ` : ""}
              {p.first_name} {p.last_name}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              @{p.username}
              {p.nickname && (
                <span className="ml-2 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                  \"{p.nickname}\"
                </span>
              )}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                  p.is_active
                    ? "bg-primary/10 text-primary-dark"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${p.is_active ? "bg-primary" : "bg-gray-400"}`}
                />
                {p.is_active ? "ใช้งานอยู่" : "ไม่ใช้งาน"}
              </span>
              {p.position_name && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <MapPin className="h-3 w-3" />
                  {p.position_name}
                </span>
              )}
              {p.person_type_name && (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <ShieldCheck className="h-3 w-3" />
                  {p.person_type_name}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setShowResetPw(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:border-amber-400 hover:text-amber-600"
            >
              <KeyRound className="h-4 w-4" />
              รีเซ็ตรหัสผ่าน
            </button>
            <button
              onClick={() => navigate(`/personnel/edit/${p.id}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:border-primary hover:text-primary-dark"
            >
              <Pencil className="h-4 w-4" />
              แก้ไข
            </button>
          </div>
        </div>

        {/* Drop hint / Upload preview bar */}
        <div className="mt-4">
          {avatarFile ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3">
              <p className="flex-1 truncate text-sm text-gray-600">
                📷 {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
              </p>
              <button
                type="button"
                onClick={handleAvatarUpload}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
                บันทึกรูป
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(p.avatar_url ?? null);
                }}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                title="ยกเลิก"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : isDragging ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary bg-primary/5 py-6 text-sm text-primary-dark">
              <Upload className="h-4 w-4" />
              วางรูปภาพที่นี่
            </div>
          ) : (
            <p className="text-center text-xs text-gray-400">
              ลากและวางรูปภาพบนหน้านี้ หรือกด 📷 บนรูปเพื่อเลือกไฟล์
            </p>
          )}
        </div>
      </div>

      {/* ===== ข้อมูลส่วนตัว ===== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <User className="h-4 w-4" />
          ข้อมูลส่วนตัว
        </h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <DetailRow label="ชื่อเล่น" value={p.nickname} />
          <DetailRow label="เลขบัตรประชาชน" value={p.cid} />
          <DetailRow label="ระดับ" value={p.person_level != null ? String(p.person_level) : null} />
        </div>
      </div>

      {/* ===== ข้อมูลงาน ===== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <MapPin className="h-4 w-4" />
          ข้อมูลงาน
        </h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <DetailRow label="กลุ่มสาระ/หน่วยงาน" value={p.department_name} />
          <DetailRow label="ประเภทบุคลากร" value={p.person_type_name} />
          <DetailRow label="ตำแหน่ง/วิทยฐานะ" value={p.position_name} />
        </div>
      </div>

      {/* ===== ช่องทางติดต่อ ===== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <Phone className="h-4 w-4" />
          ช่องทางติดต่อ
        </h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <DetailRow
            label="อีเมล"
            value={p.email}
            icon={<Mail className="h-3.5 w-3.5 text-gray-400" />}
          />
          <DetailRow
            label="เบอร์โทรศัพท์"
            value={p.phone}
            icon={<Phone className="h-3.5 w-3.5 text-gray-400" />}
          />
        </div>
      </div>

      {/* ===== ข้อมูลระบบ ===== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">ข้อมูลระบบ</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <DetailRow label="ID" value={String(p.id)} />
          <DetailRow
            label="วันที่สร้าง"
            value={
              p.created_at
                ? new Date(p.created_at).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : null
            }
          />
        </div>
      </div>

      {/* Crop modal */}
      {cropFile && (
        <ImageCrop
          imageFile={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* Reset password dialog */}
      {showResetPw && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 font-semibold text-gray-900">รีเซ็ตรหัสผ่าน</h3>
            <p className="mb-4 text-sm text-gray-500">
              ตั้งรหัสผ่านใหม่ให้ @{p.username}
            </p>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
              className="mb-4 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowResetPw(false);
                  setNewPassword("");
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  if (newPassword.length < 6) {
                    snackbar.showSnackbar("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", "error");
                    return;
                  }
                  setResetting(true);
                  const res = await dispatch(
                    resetPersonnelPassword({ id: p.id, new_password: newPassword }),
                  );
                  setResetting(false);
                  if (resetPersonnelPassword.fulfilled.match(res)) {
                    snackbar.showSnackbar("รีเซ็ตรหัสผ่านสำเร็จ", "success");
                    setShowResetPw(false);
                    setNewPassword("");
                  } else {
                    snackbar.showSnackbar(
                      (res as { payload?: string }).payload ?? "รีเซ็ตรหัสผ่านไม่สำเร็จ",
                      "error",
                    );
                  }
                }}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                {resetting && <Loader2 className="h-4 w-4 animate-spin" />}
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- คอมโพเนนต์ย่อยสำหรับแสดงแถวข้อมูล ---- */
function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">{label}</p>
      {value ? (
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-800">
          {icon}
          {value}
        </p>
      ) : (
        <p className="mt-0.5 text-sm text-gray-300">—</p>
      )}
    </div>
  );
}
