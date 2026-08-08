// src/utils/scoreScale.ts
//
// scale สีของระดับคะแนน 5 (ดีที่สุด) → 1 (น้อยที่สุด)
// ใช้ร่วมกันทุกที่ที่ต้องแสดงคะแนนแบบนี้ เพื่อให้สีตรงกันทั้งระบบ

export interface ScoreLevel {
  score: number;
  label: string;
  color: string;
}

export const SCORE_LEVELS: ScoreLevel[] = [
  {
    score: 5,
    label: "มีคุณภาพ มีความชัดเจน มีความเหมาะสม มากที่สุด",
    color: "#2fae60",
  },
  {
    score: 4,
    label: "มีคุณภาพ มีความชัดเจน มีความเหมาะสม มาก",
    color: "#7cb342",
  },
  {
    score: 3,
    label: "มีคุณภาพ มีความชัดเจน มีความเหมาะสม ปานกลาง",
    color: "#d4a017",
  },
  {
    score: 2,
    label: "มีคุณภาพ มีความชัดเจน มีความเหมาะสม น้อย",
    color: "#e07a3f",
  },
  {
    score: 1,
    label: "มีคุณภาพ มีความชัดเจน มีความเหมาะสม น้อยที่สุด",
    color: "#d64545",
  },
];

export function colorForScore(score: number): string {
  return SCORE_LEVELS.find((s) => s.score === score)?.color ?? "#9ca3af";
}
