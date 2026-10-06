import { useEffect, useMemo } from "react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { DEFAULT_SCORE_LEVELS } from "../../../utils/Scorescale";
import { fetchScoreLevels } from "../api/settingSlice";
import type { ScoreLevel as SettingScoreLevel } from "../settingType";

export interface ScoreLevelView {
  score: number;
  label: string;
  color: string;
  textColor: string;
}

function toView(level: SettingScoreLevel): ScoreLevelView {
  return {
    score: level.score,
    label: level.label,
    color: level.color,
    textColor: level.text_color,
  };
}

/**
 * ระดับคะแนน (สเกล 5-1) ที่โหลดจาก /settings/score-levels
 * ถ้ายังโหลดไม่เสร็จ (หรือล้มเหลว) จะใช้ค่าเริ่มต้นจาก Scorescale.ts
 * โหลดครั้งเดียวต่อแอป (guard ด้วย scoreLevelsLoaded)
 */
export function useScoreLevels(): ScoreLevelView[] {
  const dispatch = useAppDispatch();

  const { scoreLevels, scoreLevelsLoaded } = useAppSelector(
    (state) => state.setting,
  );

  useEffect(() => {
    if (!scoreLevelsLoaded) {
      dispatch(fetchScoreLevels());
    }
  }, [dispatch, scoreLevelsLoaded]);

  return useMemo(() => {
    if (scoreLevels && scoreLevels.length > 0) {
      return scoreLevels
        .filter((l) => l.is_active)
        .sort((a, b) => b.score - a.score)
        .map(toView);
    }
    return DEFAULT_SCORE_LEVELS;
  }, [scoreLevels]);
}
