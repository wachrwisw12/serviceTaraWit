import type { EvaluationEvaluator } from "../types/EvaluationSectionForm_type";

function leadershipRank(evaluator: EvaluationEvaluator): number {
  const title = `${evaluator.signature_role ?? ""} ${evaluator.position_snapshort ?? ""}`;

  if (title.includes("รองผู้อำนวยการ") || /รอง\s*ผอ\.?/.test(title)) {
    return 1;
  }
  if (title.includes("ผู้อำนวยการ") || /(?:^|\s)ผอ\.?(?:\s|$)/.test(title)) {
    return 2;
  }
  return 0;
}

export function compareSignatureOrder(
  first: EvaluationEvaluator,
  second: EvaluationEvaluator,
): number {
  return (
    leadershipRank(first) - leadershipRank(second) ||
    (first.signature_order ?? 0) - (second.signature_order ?? 0)
  );
}
