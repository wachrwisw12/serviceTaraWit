import { useEffect, useState } from "react";
import { Globe2, PanelsTopLeft, Save, Smartphone } from "lucide-react";

import ModuleHero from "../../../components/ModuleHero";
import { fetchAllModules, updateModule, type SystemModule } from "../api/moduleSettings";

export default function ModuleSettingsPage() {
  const [items, setItems] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAllModules().then(setItems).catch(() => setMessage("โหลดการตั้งค่าโมดูลไม่สำเร็จ")).finally(() => setLoading(false));
  }, []);

  const change = (key: string, patch: Partial<SystemModule>) =>
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));

  const save = async (item: SystemModule) => {
    setSaving(item.key);
    setMessage("");
    try {
      const updated = await updateModule(item);
      change(item.key, updated);
      setMessage(`บันทึก ${item.name} แล้ว`);
    } catch {
      setMessage(`บันทึก ${item.name} ไม่สำเร็จ`);
    } finally {
      setSaving(null);
    }
  };

  return <div className="space-y-6">
    <ModuleHero icon={<PanelsTopLeft size={26} />} title="การเปิดใช้งานโมดูล" description="กำหนดว่าส่วนงานใดเปิดให้ใช้บนเว็บไซต์และแอปมือถือ" accent="from-slate-800 to-blue-700" />
    {message && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}
    {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">กำลังโหลดการตั้งค่า...</div> :
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => <section key={item.key} className={`overflow-hidden rounded-2xl border bg-white transition ${item.enabled ? "border-slate-200" : "border-slate-200 opacity-75"}`}>
          <div className={`h-1 ${item.enabled ? "bg-emerald-500" : "bg-slate-300"}`} />
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="font-semibold text-slate-900">{item.name}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p></div>
              <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={item.enabled} onChange={(e) => change(item.key, { enabled: e.target.checked })} className="h-5 w-5 accent-emerald-600" /> เปิดใช้</label>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm"><Globe2 size={18} className="text-blue-600" /><span className="flex-1">เว็บไซต์</span><input type="checkbox" disabled={!item.enabled} checked={item.show_on_web} onChange={(e) => change(item.key, { show_on_web: e.target.checked })} className="h-4 w-4 accent-blue-600" /></label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm"><Smartphone size={18} className="text-violet-600" /><span className="flex-1">แอปมือถือ</span><input type="checkbox" disabled={!item.enabled} checked={item.show_on_mobile} onChange={(e) => change(item.key, { show_on_mobile: e.target.checked })} className="h-4 w-4 accent-violet-600" /></label>
            </div>
            <label className="mt-4 block text-xs font-medium text-slate-600">ข้อความเมื่อปิดให้บริการ<input value={item.maintenance_message ?? ""} onChange={(e) => change(item.key, { maintenance_message: e.target.value || null })} placeholder="โมดูลนี้ปิดให้บริการชั่วคราว" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
            <button type="button" disabled={saving !== null} onClick={() => save(item)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"><Save size={16} />{saving === item.key ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</button>
          </div>
        </section>)}
      </div>}
  </div>;
}
