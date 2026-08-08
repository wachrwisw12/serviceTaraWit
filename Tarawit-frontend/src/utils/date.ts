export function formatDateTHBE(iso?: string | null) {
  if (!iso) return "-";

  const date = new Date(iso);
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric", // th-TH = พ.ศ. อัตโนมัติ
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function timeAgo(iso?: string | null) {
  if (!iso) return "-";

  const date = new Date(iso);
  if (isNaN(date.getTime())) return "-";

  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day; // คำนวณแบบเฉลี่ย
  const year = 365 * day; // คำนวณแบบเฉลี่ย

  if (diff < minute) return "เมื่อสักครู่";
  if (diff < hour) return `${Math.floor(diff / minute)} นาทีที่แล้ว`;
  if (diff < day) return `${Math.floor(diff / hour)} ชั่วโมงที่แล้ว`;
  if (diff < week) return `${Math.floor(diff / day)} วันที่แล้ว`;
  if (diff < month) return `${Math.floor(diff / week)} สัปดาห์ที่แล้ว`;
  if (diff < year) return `${Math.floor(diff / month)} เดือนที่แล้ว`;

  return `${Math.floor(diff / year)} ปีที่แล้ว`;
}

export function getCurrentAcademicYear(): number {
  const now = new Date();
  const beYear = now.getFullYear() + 543;
  const month = now.getMonth();
  return month < 4 ? beYear - 1 : beYear;
}
