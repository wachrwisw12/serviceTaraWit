// src/utils/Scorescale.ts
//
// ค่ามาตรฐานของระดับคะแนน 5 (ดีที่สุด) → 1 (น้อยที่สุด)
// ใช้เป็นค่า fallback เมื่อยังไม่ได้โหลดค่าจาก API (หน้าตั้งค่าคะแนน)
// ส่วนค่าที่ใช้งานจริงจะ hydrate จาก /settings/score-levels ผ่าน useScoreLevels()

export interface ScoreLevel {
  score: number;
  label: string;
  color: string;
  // สีตัวเลขบนปุ่มวงกลม — ระดับเหลืองต้องใช้สีเข้มเพื่อความคมชัด
  textColor: string;
}

export const DEFAULT_SCORE_LEVELS: ScoreLevel[] = [
  {
    score: 5,
    label: "มีคุณภาพ มีความชัดเจน มีความเหมาะสม มากที่สุด",
    color: "var(--color-primary)",
    textColor: "#ffffff",
  },
  {
    score: 4,
    label: "มีคุณภาพ มีความชัดเจน มีความเหมาะสม มาก",
    color: "#7cb342",
    textColor: "#ffffff",
  },
  {
    score: 3,
    label: "มีคุณภาพ มีความชัดเจน มีความเหมาะสม ปานกลาง",
    color: "#f59e0b",
    textColor: "#422006",
  },
  {
    score: 2,
    label: "มีคุณภาพ มีความชัดเจน มีความเหมาะสม น้อย",
    color: "#e07a3f",
    textColor: "#ffffff",
  },
  {
    score: 1,
    label: "มีคุณภาพ มีความชัดเจน มีความเหมาะสม น้อยที่สุด",
    color: "#d64545",
    textColor: "#ffffff",
  },
];

// หาสีจากค่าคะแนน (ใช้ค่าเริ่มต้น — ใช้เฉพาะตอนยังไม่มีข้อมูลจาก server)
export function colorForScore(score: number): string {
  return (
    DEFAULT_SCORE_LEVELS.find((s) => s.score === score)?.color ?? "#9ca3af"
  );
}

export function scoreTextColor(score: number): string {
  return (
    DEFAULT_SCORE_LEVELS.find((s) => s.score === score)?.textColor ?? "#ffffff"
  );
}
