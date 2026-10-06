interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}

/** วงกลมโดนัท — วาดด้วย SVG stroke-dasharray ไม่พึ่ง library */
export function DonutChart({ segments, size = 168, thickness = 24 }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  let acc = 0;
  const arcs = segments.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const dash = frac * c;
    const offset = -acc * c;
    acc += frac;
    return { ...s, dash, offset };
  });

  return (
    <div className="flex items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 -rotate-90"
        role="img"
        aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={thickness}
        />
        {arcs.map((s) => (
          <circle
            key={s.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(s.dash - 2, 0)} ${c}`}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="flex flex-col gap-1.5 text-sm">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-gray-600">{s.label}</span>
            <span className="ml-auto font-semibold text-gray-900 tabular-nums">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StackedBarProps {
  data: {
    label: string;
    values: { key: string; value: number; color: string }[];
  }[];
}

/** กราฟแท่ง stacked รายเดือน (แนวโน้มการลงเวลา) */
export function StackedBarChart({ data }: StackedBarProps) {
  const maxTotal = Math.max(
    1,
    ...data.map((d) => d.values.reduce((s, v) => s + v.value, 0)),
  );

  return (
    <div>
      <div className="flex h-44 items-end gap-3">
        {data.map((d) => {
          const total = d.values.reduce((s, v) => s + v.value, 0);
          return (
            <div
              key={d.label}
              className="flex flex-1 flex-col items-center gap-1.5"
              title={`${d.label}: ${total} ครั้ง`}
            >
              <div className="flex h-36 w-full max-w-9 flex-col-reverse justify-start gap-px">
                {d.values.map((v) =>
                  v.value > 0 ? (
                    <div
                      key={v.key}
                      className="w-full rounded-[2px] transition-all"
                      style={{
                        height: `${(v.value / maxTotal) * 100}%`,
                        backgroundColor: v.color,
                      }}
                    />
                  ) : null,
                )}
              </div>
              <span className="text-[11px] font-medium text-gray-500">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HBarProps {
  items: {
    name: string;
    value: number;
    suffix?: string;
  }[];
  color?: string;
  format?: (v: number) => string;
}

/** รายการแท่งแนวนอน (สัดส่วนบุคลากร / คะแนนเฉลี่ยรายแม่แบบ) */
export function HBarList({ items, color = "#1d4ed8", format }: HBarProps) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-3">
      {items.map((i) => (
        <div key={i.name}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-gray-700">{i.name}</span>
            <span className="shrink-0 font-semibold text-gray-900 tabular-nums">
              {format ? format(i.value) : i.value}
              {i.suffix ? ` ${i.suffix}` : ""}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(i.value / max) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
