import { useSystemSettings } from "../SystemSettingsContext";

/**
 * ดึงชื่อระบบจาก SystemSettingsContext
 * ใช้ค่า default ถ้ายังไม่ได้ตั้งค่า
 */
export function useSystemName() {
  const { shortName, displayName, systemName } = useSystemSettings();

  return { shortName, fullName: systemName, displayName };
}
