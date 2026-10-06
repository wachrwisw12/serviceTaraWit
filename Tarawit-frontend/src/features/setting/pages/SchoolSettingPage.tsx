import { useEffect, useState } from "react";
import { Building2, Loader2, Save } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import { fetchSchool, updateSchool } from "../api/settingSlice";

interface FormState {
  code: string;
  name: string;
  type: string;
  province: string;
  address: string;
  phone: string;
  email: string;
  director_name: string;
  system_name: string;
  system_short_name: string;
}

const emptyForm: FormState = {
  code: "",
  name: "",
  type: "",
  province: "",
  address: "",
  phone: "",
  email: "",
  director_name: "",
  system_name: "",
  system_short_name: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

export default function SchoolSettingPage() {
  const dispatch = useAppDispatch();
  const snackbar = useSnackbar();

  const { school, loading, saving } = useAppSelector((state) => state.setting);

  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    dispatch(fetchSchool());
  }, [dispatch]);

  useEffect(() => {
    if (school) {
      setForm({
        code: school.code ?? "",
        name: school.name ?? "",
        type: school.type ?? "",
        province: school.province ?? "",
        address: school.address ?? "",
        phone: school.phone ?? "",
        email: school.email ?? "",
        director_name: school.director_name ?? "",
        system_name: school.system_name ?? "",
        system_short_name: school.system_short_name ?? "",
      });
    }
  }, [school]);

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      snackbar.showSnackbar("กรุณาระบุชื่อโรงเรียน", "error");
      return;
    }

    const res = await dispatch(
      updateSchool({
        code: form.code.trim() || null,
        name: form.name.trim(),
        type: form.type.trim() || null,
        province: form.province.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        director_name: form.director_name.trim() || null,
        system_name: form.system_name.trim() || null,
        system_short_name: form.system_short_name.trim() || null,
      }),
    );

    if (updateSchool.fulfilled.match(res)) {
      snackbar.showSnackbar("บันทึกข้อมูลโรงเรียนสำเร็จ", "success");
      dispatch(fetchSchool());
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "บันทึกไม่สำเร็จ",
        "error",
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Building2 className="h-5 w-5 text-primary-dark" />
          ข้อมูลโรงเรียน
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          ตั้งค่าข้อมูลโรงเรียน ชื่อ ที่อยู่ สังกัด และรายละเอียดหน่วยงาน
        </p>
      </div>

      {loading && !school ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-16 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังโหลดข้อมูล...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>ชื่อโรงเรียน *</label>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>รหัสโรงเรียน (สังกัด)</label>
              <input
                value={form.code}
                onChange={(e) => setField("code", e.target.value)}
                placeholder="เช่น 1047540038"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>ประเภท</label>
              <input
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
                placeholder="เช่น 1 (สพฐ.)"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>จังหวัด</label>
              <input
                value={form.province}
                onChange={(e) => setField("province", e.target.value)}
                placeholder="เช่น สกลนคร"
                className={inputClass}
              />
            </div>
          </div>

          <h2 className="mb-4 mt-8 font-semibold text-gray-900">
            ตั้งค่าชื่อระบบ
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>ชื่อระบบ (เต็ม)</label>
              <input
                value={form.system_name}
                onChange={(e) => setField("system_name", e.target.value)}
                placeholder="เช่น ระบบบริหารจัดการโรงเรียน"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">
                แสดงใน Splash screen และหน้าอื่นๆ
              </p>
            </div>
            <div>
              <label className={labelClass}>ชื่อระบบ (ย่อ)</label>
              <input
                value={form.system_short_name}
                onChange={(e) => setField("system_short_name", e.target.value)}
                placeholder="เช่น TARAWIT"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">
                แสดงใน Appbar และ favicon
              </p>
            </div>
          </div>

          <h2 className="mb-4 mt-8 font-semibold text-gray-900">
            ข้อมูลติดต่อ
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>ที่อยู่</label>
              <textarea
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                rows={2}
                placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>เบอร์โทรศัพท์</label>
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="เช่น 042-123456"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>อีเมล</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="เช่น info@school.ac.th"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>ผู้อำนวยการโรงเรียน</label>
              <input
                value={form.director_name}
                onChange={(e) => setField("director_name", e.target.value)}
                placeholder="ชื่อ-นามสกุลผู้อำนวยการ"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
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
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
