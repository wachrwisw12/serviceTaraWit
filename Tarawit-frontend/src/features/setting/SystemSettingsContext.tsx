import { createContext, useContext, useEffect, useState } from "react";
import api from "../../api/axios";
import type { SchoolInfo } from "./settingType";

interface SystemSettings {
  systemName: string;
  systemShortName: string;
  schoolName: string;
  /** ชื่อเต็ม = systemName + schoolName */
  displayName: string;
  /** ชื่อย่อ */
  shortName: string;
  /** raw data */
  school: SchoolInfo | null;
}

const defaults: SystemSettings = {
  systemName: "ระบบบริหารจัดการโรงเรียนท่าแร่วิทยา",
  systemShortName: "IQAT SYSTEM",
  schoolName: "โรงเรียนท่าแร่วิทยา",
  displayName: "ระบบบริหารจัดการโรงเรียนท่าแร่วิทยา โรงเรียนท่าแร่วิทยา",
  shortName: "IQAT SYSTEM",
  school: null,
};

const SystemSettingsContext = createContext<SystemSettings>(defaults);

export function useSystemSettings() {
  return useContext(SystemSettingsContext);
}

export function SystemSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<SystemSettings>(defaults);

  useEffect(() => {
    let cancelled = false;

    api
      .get<SchoolInfo>("/settings/school")
      .then((res) => {
        if (cancelled || !res.data) return;

        const s = res.data;
        const systemName = s.system_name?.trim() || defaults.systemName;
        const systemShortName =
          s.system_short_name?.trim() || defaults.systemShortName;
        const schoolName = s.name?.trim() || "";

        setSettings({
          systemName,
          systemShortName,
          schoolName,
          displayName: schoolName ? `${systemName} ${schoolName}` : systemName,
          shortName: systemShortName,
          school: s,
        });
      })
      .catch(() => {
        // ใช้ค่า default
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SystemSettingsContext.Provider value={settings}>
      {children}
    </SystemSettingsContext.Provider>
  );
}
