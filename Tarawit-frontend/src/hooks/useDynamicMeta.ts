import { useEffect } from "react";
import { useSystemSettings } from "../features/setting/SystemSettingsContext";

/**
 * อัปเดต meta tags, theme-color, และ PWA manifest ตาม system_name
 * ใช้ใน App component หลัง settings load แล้ว
 */
export function useDynamicMeta() {
  const { displayName, shortName } = useSystemSettings();

  useEffect(() => {
    // อัปเดต <title>
    document.title = shortName;

    // อัปเดต meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", `${displayName} — ลงเวลา ประเมิน บุคลากร`);
    }

    // อัปเดต meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", "#1f3e57");
    }

    // อัปเดต PWA manifest dynamically
    updateManifest(displayName, shortName);
  }, [displayName, shortName]);
}

function updateManifest(name: string, shortName: string) {
  const manifest = {
    id: "/",
    name,
    short_name: shortName,
    description: `${name} — ลงเวลา ประเมิน บุคลากร`,
    lang: "th",
    dir: "ltr",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#1f3e57",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // ลบ manifest เดิม
  const oldLink = document.querySelector('link[rel="manifest"]');
  if (oldLink) {
    URL.revokeObjectURL(oldLink.getAttribute("href") ?? "");
    oldLink.setAttribute("href", url);
  } else {
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = url;
    document.head.appendChild(link);
  }
}
