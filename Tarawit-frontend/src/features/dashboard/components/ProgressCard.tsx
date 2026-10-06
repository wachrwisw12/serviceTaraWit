interface InProgressItem {
  id: string;
  title: string;
  remaining: number;
  total: number;
}

const items: InProgressItem[] = [
  { id: "1", title: "ประเมินครู ปีการศึกษา 2569", remaining: 23, total: 120 },
];

export default function ProgressCard() {
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-900">
        การประเมินที่กำลังดำเนินการ
      </h2>

      <div className="mt-4 space-y-5">
        {items.map((item) => {
          const done = item.total - item.remaining;
          const percent = Math.round((done / item.total) * 100);

          return (
            <div key={item.id}>
              <p className="text-sm font-medium text-gray-800">{item.title}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                เหลือ {item.remaining} จาก {item.total} คน
              </p>

              {/* แถบความคืบหน้าคงสีน้ำเงินไว้ตามเดิม — ใน mockup แดชบอร์ดใช้สีน้ำเงินสำหรับการ์ดนี้โดยเฉพาะ (ต่างจากปุ่ม action หลักที่ใช้ส้ม/เขียว) */}
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-600 w-9 text-right">
                  {percent}%
                </span>
              </div>

              <button
                className="mt-3 rounded-lg border px-4 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  borderColor: "var(--color-primary)",
                  color: "var(--color-primary-dark)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--color-primary-soft)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                รายละเอียด
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
