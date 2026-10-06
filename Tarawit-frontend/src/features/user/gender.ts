export type Gender = "male" | "female" | "unknown";

/**
 * ระบุเพศจากคำนำหน้าชื่อ (prefixes)
 * - ชาย: นาย (MR), เด็กชาย (MASTER)
 * - หญิง: นาง (MRS), นางสาว (MISS), เด็กหญิง (MISS_CHILD)
 * - คำนำหน้าทางวิชาการ (ดร./ผศ./รศ./ศ.) ไม่ระบุเพศ -> unknown
 */
export function genderFromPrefix(
  prefixCode?: string | null,
  prefixes?: string | null,
): Gender {
  const code = (prefixCode ?? "").trim().toUpperCase();
  const name = (prefixes ?? "").trim();

  if (["MR", "MASTER"].includes(code)) return "male";
  if (["MRS", "MISS", "MISS_CHILD"].includes(code)) return "female";

  if (name.startsWith("นาย") || name.startsWith("เด็กชาย")) return "male";
  if (name.startsWith("นาง") || name.startsWith("เด็กหญิง")) return "female";

  return "unknown";
}
