import { useEffect, useMemo, useState } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { Check, MapPin, Plus, Save, ShieldCheck, Trash2, Users } from "lucide-react";
import "leaflet/dist/leaflet.css";

import {
  deleteGroup,
  deleteLocation,
  getAttendanceGroups,
  getAttendanceUsers,
  getGeofenceConfig,
  getOutsideAccess,
  replaceGroupMembers,
  replaceOutsideAccess,
  saveGroup,
  saveLocation,
  updateGeofenceConfig,
} from "../api/geofenceApi";
import type { AttendanceGroup, AttendanceLocation, AttendanceUserOption } from "../geofenceType";

type LocationDraft = Omit<AttendanceLocation, "id"> & { id?: number };
const EMPTY_LOCATION: LocationDraft = { name: "", latitude: 13.7563, longitude: 100.5018, radius_m: 150, is_active: true };

function MapClick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
}

function messageFrom(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "ดำเนินการไม่สำเร็จ";
}

export default function AttendanceGeofencePage() {
  const [tab, setTab] = useState<"areas" | "access">("areas");
  const [enabled, setEnabled] = useState(false);
  const [accuracy, setAccuracy] = useState(100);
  const [checkInOpen, setCheckInOpen] = useState("05:00");
  const [checkInClose, setCheckInClose] = useState("12:00");
  const [checkOutOpen, setCheckOutOpen] = useState("12:00");
  const [checkOutClose, setCheckOutClose] = useState("23:00");
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [draft, setDraft] = useState<LocationDraft>(EMPTY_LOCATION);
  const [users, setUsers] = useState<AttendanceUserOption[]>([]);
  const [groups, setGroups] = useState<AttendanceGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [outsideUsers, setOutsideUsers] = useState<number[]>([]);
  const [outsideGroups, setOutsideGroups] = useState<number[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [config, userList, groupList, access] = await Promise.all([
        getGeofenceConfig(), getAttendanceUsers(), getAttendanceGroups(), getOutsideAccess(),
      ]);
      setEnabled(config.enabled);
      setAccuracy(config.max_location_accuracy_m);
      setCheckInOpen(config.check_in_open.slice(0, 5));
      setCheckInClose(config.check_in_close.slice(0, 5));
      setCheckOutOpen(config.check_out_open.slice(0, 5));
      setCheckOutClose(config.check_out_close.slice(0, 5));
      setLocations(config.locations);
      setUsers(userList);
      setGroups(groupList);
      setOutsideUsers(access.user_ids ?? []);
      setOutsideGroups(access.group_ids ?? []);
    } catch (error) {
      setNotice({ ok: false, text: messageFrom(error) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const mapCenter = useMemo<[number, number]>(() => [draft.latitude, draft.longitude], [draft.latitude, draft.longitude]);
  const selected = groups.find((group) => group.id === selectedGroup);

  async function run(action: () => Promise<void>, success: string) {
    setSaving(true); setNotice(null);
    try { await action(); setNotice({ ok: true, text: success }); await load(); }
    catch (error) { setNotice({ ok: false, text: messageFrom(error) }); }
    finally { setSaving(false); }
  }

  function toggle(list: number[], id: number, setter: (next: number[]) => void) {
    setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function handleSaveLocation() {
    await run(async () => { await saveLocation(draft); setDraft(EMPTY_LOCATION); }, "บันทึกจุดลงเวลาแล้ว");
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    await run(async () => { await saveGroup({ name: newGroupName.trim(), description: null, is_active: true }); setNewGroupName(""); }, "สร้างกลุ่มแล้ว");
  }

  if (loading) return <div className="py-20 text-center text-sm text-slate-400">กำลังโหลดการตั้งค่าพื้นที่...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-dark">Attendance control</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">พื้นที่และสิทธิ์ลงเวลา</h1>
          <p className="mt-1 text-sm text-slate-500">กำหนดขอบเขตจริงของโรงเรียน และอนุญาตข้อยกเว้นเฉพาะคนที่จำเป็น</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          <button onClick={() => setTab("areas")} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "areas" ? "bg-navy text-white" : "text-slate-500"}`}>พื้นที่บนแผนที่</button>
          <button onClick={() => setTab("access")} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "access" ? "bg-navy text-white" : "text-slate-500"}`}>กลุ่มและข้อยกเว้น</button>
        </div>
      </header>

      {notice && <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><Check size={16} />{notice.text}</div>}

      {tab === "areas" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_380px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">เลือกจุดศูนย์กลาง</h2><p className="mt-1 text-xs text-slate-500">คลิกบนแผนที่เพื่อวางจุด วงกลมแสดงรัศมีที่อนุญาต</p></div>
            <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={16} scrollWheelZoom className="h-[540px] w-full">
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapClick onPick={(latitude, longitude) => setDraft((value) => ({ ...value, latitude, longitude }))} />
              {locations.filter((item) => item.is_active && item.id !== draft.id).map((item) => <Circle key={item.id} center={[item.latitude, item.longitude]} radius={item.radius_m} pathOptions={{ color: "#64748b", fillOpacity: .08 }} />)}
              <Marker position={mapCenter} />
              <Circle center={mapCenter} radius={draft.radius_m} pathOptions={{ color: "#0f8a6a", fillColor: "#0f8a6a", fillOpacity: .18 }} />
            </MapContainer>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">ช่วงเวลาที่อนุญาต</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">เมื่ออยู่นอกช่วงเวลา Backend จะปฏิเสธการลงเวลาทันที</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-slate-600">เริ่มเข้างาน<input type="time" value={checkInOpen} onChange={(e) => setCheckInOpen(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <label className="text-xs font-medium text-slate-600">สิ้นสุดเข้างาน<input type="time" value={checkInClose} onChange={(e) => setCheckInClose(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <label className="text-xs font-medium text-slate-600">เริ่มออกงาน<input type="time" value={checkOutOpen} onChange={(e) => setCheckOutOpen(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <label className="text-xs font-medium text-slate-600">สิ้นสุดออกงาน<input type="time" value={checkOutClose} onChange={(e) => setCheckOutClose(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-slate-900">บังคับตรวจพื้นที่</h2><p className="mt-1 text-xs leading-5 text-slate-500">เมื่อเปิด ผู้ใช้ต้องส่งตำแหน่งที่แม่นยำก่อนลงเวลา</p></div><button onClick={() => setEnabled(!enabled)} className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-primary" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} /></button></div>
              <label className="mt-4 block text-xs font-medium text-slate-600">ความคลาดเคลื่อน GPS สูงสุด (เมตร)</label>
              <input type="number" min={1} max={5000} value={accuracy} onChange={(e) => setAccuracy(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <button disabled={saving} onClick={() => run(() => updateGeofenceConfig(enabled, accuracy, checkInOpen, checkInClose, checkOutOpen, checkOutClose), "บันทึกเวลาและนโยบายพื้นที่แล้ว")} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />บันทึกเวลาและนโยบาย</button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">{draft.id ? "แก้ไขจุดลงเวลา" : "เพิ่มจุดลงเวลา"}</h2>
              <div className="mt-4 space-y-3">
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="ชื่อจุด เช่น อาคารอำนวยการ" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2"><input type="number" value={draft.latitude} onChange={(e) => setDraft({ ...draft, latitude: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" /><input type="number" value={draft.longitude} onChange={(e) => setDraft({ ...draft, longitude: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
                <label className="block text-xs font-medium text-slate-600">รัศมี {draft.radius_m} เมตร<input type="range" min={10} max={2000} step={10} value={draft.radius_m} onChange={(e) => setDraft({ ...draft, radius_m: Number(e.target.value) })} className="mt-2 w-full accent-primary" /></label>
                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />เปิดใช้งานจุดนี้</label>
              </div>
              <div className="mt-4 flex gap-2"><button disabled={saving || !draft.name.trim()} onClick={handleSaveLocation} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><MapPin size={16} />บันทึกจุด</button>{draft.id && <button onClick={() => setDraft(EMPTY_LOCATION)} className="rounded-lg border border-slate-200 px-3 text-sm">ยกเลิก</button>}</div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="px-1 font-semibold text-slate-900">จุดที่กำหนด ({locations.length})</h2><div className="mt-3 space-y-2">{locations.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className={`h-2.5 w-2.5 rounded-full ${item.is_active ? "bg-emerald-500" : "bg-slate-300"}`} /><button onClick={() => setDraft(item)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium text-slate-800">{item.name}</span><span className="text-xs text-slate-400">รัศมี {item.radius_m} ม.</span></button><button onClick={() => run(() => deleteLocation(item.id), "ลบจุดลงเวลาแล้ว")} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></div>)}</div></section>
          </aside>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2"><Users size={19} className="text-primary-dark" /><h2 className="font-semibold text-slate-900">กลุ่มลงเวลานอกพื้นที่</h2></div>
            <div className="mt-4 flex gap-2"><input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="ชื่อกลุ่ม เช่น ออกพื้นที่ราชการ" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button onClick={handleCreateGroup} className="inline-flex items-center gap-1 rounded-lg bg-navy px-3 text-sm text-white"><Plus size={15} />สร้าง</button></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]"><div className="space-y-1">{groups.map((group) => <button key={group.id} onClick={() => { setSelectedGroup(group.id); setMemberIds(group.member_ids ?? []); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selectedGroup === group.id ? "bg-primary/10 font-semibold text-primary-dark" : "text-slate-600 hover:bg-slate-50"}`}><span className="truncate">{group.name}</span><span className="text-xs">{group.member_ids?.length ?? 0}</span></button>)}</div><div>{selected ? <><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-slate-800">สมาชิก: {selected.name}</p><button onClick={() => run(() => deleteGroup(selected.id), "ลบกลุ่มแล้ว")} className="text-red-500"><Trash2 size={16} /></button></div><div className="max-h-72 space-y-1 overflow-y-auto">{users.map((user) => <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"><input type="checkbox" checked={memberIds.includes(user.id)} onChange={() => toggle(memberIds, user.id, setMemberIds)} /><span className="text-sm text-slate-700">{`${user.first_name} ${user.last_name}`.trim() || user.username}</span></label>)}</div><button onClick={() => run(() => replaceGroupMembers(selected.id, memberIds), "บันทึกสมาชิกกลุ่มแล้ว")} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"><Save size={15} />บันทึกสมาชิก</button></> : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-400">เลือกกลุ่มเพื่อจัดสมาชิก</p>}</div></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2"><ShieldCheck size={19} className="text-primary-dark" /><h2 className="font-semibold text-slate-900">อนุญาตลงเวลานอกพื้นที่</h2></div><p className="mt-1 text-xs text-slate-500">เลือกได้ทั้งรายบุคคลและรายกลุ่ม ผู้ได้รับสิทธิ์ยังต้องส่งตำแหน่งเพื่อบันทึกหลักฐาน</p>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">กลุ่ม</h3><div className="mt-2 flex flex-wrap gap-2">{groups.map((group) => <label key={group.id} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${outsideGroups.includes(group.id) ? "border-primary bg-primary/10 text-primary-dark" : "border-slate-200 text-slate-500"}`}><input className="sr-only" type="checkbox" checked={outsideGroups.includes(group.id)} onChange={() => toggle(outsideGroups, group.id, setOutsideGroups)} />{group.name}</label>)}</div>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">รายบุคคล</h3><div className="mt-2 max-h-80 space-y-1 overflow-y-auto rounded-xl border border-slate-100 p-2">{users.map((user) => <label key={user.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"><input type="checkbox" checked={outsideUsers.includes(user.id)} onChange={() => toggle(outsideUsers, user.id, setOutsideUsers)} /><span className="text-sm text-slate-700">{`${user.first_name} ${user.last_name}`.trim() || user.username}</span><span className="ml-auto text-xs text-slate-400">{user.username}</span></label>)}</div>
            <button disabled={saving} onClick={() => run(() => replaceOutsideAccess({ user_ids: outsideUsers, group_ids: outsideGroups }), "บันทึกสิทธิ์ลงเวลานอกพื้นที่แล้ว")} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />บันทึกสิทธิ์ทั้งหมด</button>
          </section>
        </div>
      )}
    </div>
  );
}
