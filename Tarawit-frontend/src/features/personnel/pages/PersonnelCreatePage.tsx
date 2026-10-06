import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, Save, UserPlus, X } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import {
  createPersonnel,
  fetchDepartments,
  fetchPersonnelById,
  fetchPersonTypes,
  fetchPositions,
  fetchPrefixes,
  updatePersonnel,
  uploadPersonnelAvatar,
} from "../api/personnelSlice";
import UserAvatar from "../../user/components/UserAvatar";
import ImageCrop from "../../evaluation/components/ImageCrop";

interface FormState {
  username: string;
  password: string;
  nickname: string;
  department_id: string;
  cid: string;
  prefix_id: string;
  first_name: string;
  last_name: string;
  person_type_id: string;
  position_id: string;
  email: string;
  phone: string;
  person_level: string;
}

const emptyForm: FormState = {
  username: "",
  password: "",
  nickname: "",
  department_id: "",
  cid: "",
  prefix_id: "",
  first_name: "",
  last_name: "",
  person_type_id: "",
  position_id: "",
  email: "",
  phone: "",
  person_level: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

export default function PersonnelCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { id } = useParams<{ id: string }>();

  const isEdit = Boolean(id);
  const personnelId = id ? Number(id) : null;

  const { prefixes, personTypes, positions, departments, saving, loading } = useAppSelector(
    (state) => state.personnel,
  );

  const [form, setForm] = useState<FormState>(emptyForm);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const dragCounterRef = useRef(0);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchPrefixes());
    dispatch(fetchPersonTypes());
    dispatch(fetchPositions());
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (!personnelId) return;

    dispatch(fetchPersonnelById(personnelId)).then((res) => {
      if (fetchPersonnelById.fulfilled.match(res)) {
        const p = res.payload;
        setForm({
          username: p.username,
          password: "",
          nickname: p.nickname ?? "",
          department_id: p.department_id ? String(p.department_id) : "",
          cid: p.cid ?? "",
          prefix_id: p.prefix_id ? String(p.prefix_id) : "",
          first_name: p.first_name ?? "",
          last_name: p.last_name ?? "",
          person_type_id: p.person_type_id ? String(p.person_type_id) : "",
          position_id: p.position_id ? String(p.position_id) : "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          person_level: p.person_level ? String(p.person_level) : "",
        });
        setAvatarPreview(p.avatar_url ?? null);
      }
    });
  }, [dispatch, personnelId]);

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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
      // เปิด crop modal แทนที่จะตั้ง preview ตรงๆ
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
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
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
    setUploadingAvatar(true);
    const res = await dispatch(uploadPersonnelAvatar({ id: personnelId, file: avatarFile }));
    setUploadingAvatar(false);
    if (uploadPersonnelAvatar.fulfilled.match(res)) {
      snackbar.showSnackbar("อัปเดตรูปโปรไฟล์สำเร็จ", "success");
      setAvatarFile(null);
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "อัปโหลดรูปไม่สำเร็จ",
        "error",
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isEdit && !form.username.trim()) {
      snackbar.showSnackbar("กรุณาระบุชื่อผู้ใช้ (username)", "error");
      return;
    }
    if (!isEdit && form.password.length < 6) {
      snackbar.showSnackbar(
        "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
        "error",
      );
      return;
    }

    const common = {
      nickname: form.nickname.trim() || null,
      department_id: form.department_id ? Number(form.department_id) : null,
      cid: form.cid.trim() || null,
      prefix_id: form.prefix_id ? Number(form.prefix_id) : null,
      first_name: form.first_name.trim() || null,
      last_name: form.last_name.trim() || null,
      person_type_id: form.person_type_id
        ? Number(form.person_type_id)
        : null,
      position_id: form.position_id ? Number(form.position_id) : null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      person_level: form.person_level ? Number(form.person_level) : null,
    };

    let res;
    if (isEdit && personnelId) {
      res = await dispatch(
        updatePersonnel({ id: personnelId, data: common }),
      );
    } else {
      res = await dispatch(
        createPersonnel({
          ...common,
          username: form.username.trim(),
          password: form.password,
        }),
      );
    }

    if (
      createPersonnel.fulfilled.match(res) ||
      updatePersonnel.fulfilled.match(res)
    ) {
      snackbar.showSnackbar(
        isEdit ? "บันทึกข้อมูลสำเร็จ" : "เพิ่มบุคลากรสำเร็จ",
        "success",
      );
      navigate("/personnel");
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "บันทึกข้อมูลไม่สำเร็จ",
        "error",
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => navigate("/personnel")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-primary-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปรายชื่อบุคลากร
      </button>

      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <UserPlus className="h-5 w-5 text-primary-dark" />
          {isEdit ? "แก้ไขบุคลากร" : "เพิ่มบุคลากร"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEdit
            ? "แก้ไขข้อมูลบุคลากร (ชื่อผู้ใช้และรหัสผ่านไม่สามารถแก้ไขได้)"
            : "สร้างบัญชีผู้ใช้พร้อมข้อมูลบุคลากรใหม่เข้าสู่ระบบ"}
        </p>
      </div>

      {isEdit && loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-16 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังโหลดข้อมูล...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* รูปโปรไฟล์ — drag & drop (เฉพาะโหมดแก้ไข) */}
          {isEdit && (
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mb-6 rounded-xl border-2 border-dashed p-5 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-gray-50/50"
              }`}
            >
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                {/* Avatar + upload button */}
                <div className="relative group shrink-0">
                  <UserAvatar
                    avatarUrl={avatarPreview}
                    firstName={form.first_name || null}
                    prefixCode={null}
                    className="h-20 w-20 text-2xl"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary-dark"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                  </label>
                </div>

                {/* Drop zone text / preview */}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  {avatarFile ? (
                    /* มีไฟล์เลือกแล้ว → แสดง preview bar */
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-700">
                          {avatarFile.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(avatarFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        บันทึกรูป
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(
                            /* คืนค่าเดิมถ้ามี */
                            (form as unknown as { avatar_url?: string | null })
                              .avatar_url ?? null,
                          );
                        }}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        title="ยกเลิก"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    /* ยังไม่ได้เลือก → แสดง drop zone hint */
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        ลากและวางรูปภาพที่นี่
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        หรือกดปุ่ม 📷 บนรูปเพื่อเลือกไฟล์ — รองรับ JPG, PNG, WEBP, GIF ไม่เกิน 5 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* บัญชีผู้ใช้ */}
          <h2 className="mb-4 font-semibold text-gray-900">บัญชีผู้ใช้</h2>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>ชื่อผู้ใช้ (username) *</label>
              <input
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                disabled={isEdit}
                placeholder="เช่น 0812345678 หรือ username"
                className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
              />
            </div>
            <div>
              <label className={labelClass}>รหัสผ่าน *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                disabled={isEdit}
                placeholder={isEdit ? "ไม่สามารถแก้ไขได้" : "อย่างน้อย 6 ตัวอักษร"}
                className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
              />
            </div>
          </div>

          {/* ข้อมูลส่วนตัว */}
          <h2 className="mb-4 font-semibold text-gray-900">ข้อมูลส่วนตัว</h2>
          <div className="mb-4">
            <label className={labelClass}>ชื่อเล่น (Nickname)</label>
            <input
              value={form.nickname}
              onChange={(e) => setField("nickname", e.target.value)}
              placeholder="เช่น บอส, แก๊ป"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>คำนำหน้า</label>
              <select
                value={form.prefix_id}
                onChange={(e) => setField("prefix_id", e.target.value)}
                className={inputClass}
              >
                <option value="">— เลือก —</option>
                {prefixes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_th}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>ชื่อ</label>
              <input
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>นามสกุล</label>
              <input
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>เลขบัตรประชาชน</label>
              <input
                value={form.cid}
                onChange={(e) => setField("cid", e.target.value)}
                maxLength={13}
                placeholder="13 หลัก"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>ระดับ</label>
              <input
                type="number"
                value={form.person_level}
                onChange={(e) => setField("person_level", e.target.value)}
                placeholder="เช่น 1, 2, 3"
                className={inputClass}
              />
            </div>
          </div>

          {/* ข้อมูลงาน */}
          <h2 className="mb-4 mt-8 font-semibold text-gray-900">ข้อมูลงาน</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>กลุ่มสาระ/หน่วยงาน</label>
              <select
                value={form.department_id}
                onChange={(e) => setField("department_id", e.target.value)}
                className={inputClass}
              >
                <option value="">— เลือก —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name_th}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>ประเภทบุคลากร</label>
              <select
                value={form.person_type_id}
                onChange={(e) => setField("person_type_id", e.target.value)}
                className={inputClass}
              >
                <option value="">— เลือก —</option>
                {personTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name_th}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>ตำแหน่ง/วิทยฐานะ</label>
              <select
                value={form.position_id}
                onChange={(e) => setField("position_id", e.target.value)}
                className={inputClass}
              >
                <option value="">— เลือก —</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name_th}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>อีเมล</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>เบอร์โทรศัพท์</label>
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={() => navigate("/personnel")}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEdit ? "บันทึกข้อมูล" : "เพิ่มบุคลากร"}
            </button>
          </div>
        </form>
      )}

      {/* Crop modal */}
      {cropFile && (
        <ImageCrop
          imageFile={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
