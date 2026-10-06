import { useEffect } from "react";
import { useSystemSettings } from "../features/setting/SystemSettingsContext";

const APP_SUFFIX = "TARAWIT";

/**
 * อัปเดต <title> ของเบราว์เซอร์ ตาม system_name
 *
 * ใช้: useDocumentTitle("หน้าเข้าสู่ระบบ")
 * ผลลัพธ์: "หน้าเข้าสู่ระบบ | TARAWIT"
 *
 * ถ้าไม่ส่ง pageName จะแสดงแค่ shortName
 */
export function useDocumentTitle(pageName?: string) {
  const { shortName } = useSystemSettings();

  useEffect(() => {
    const suffix = shortName || APP_SUFFIX;
    document.title = pageName ? `${pageName} | ${suffix}` : suffix;
  }, [pageName, shortName]);
}
