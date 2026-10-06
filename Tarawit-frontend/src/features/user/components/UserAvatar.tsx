import { useMemo, useState } from "react";

import { genderFromPrefix } from "../gender";

interface Props {
  /** URL ของรูปโปรไฟล์จริง (ถ้ามี) */
  avatarUrl?: string | null;
  /** รหัสคำนำหน้า เช่น MR, MRS, MISS */
  prefixCode?: string | null;
  /** ชื่อคำนำหน้า เช่น นาย, นางสาว */
  prefixes?: string | null;
  /** ชื่อจริง — ใช้ตัวอักษรแรกเป็น fallback สุดท้าย */
  firstName?: string | null;
  /** ขนาด + รูปทรง เช่น "h-9 w-9 text-sm" */
  className?: string;
  alt?: string;
}

function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  const value = avatarUrl?.trim();
  if (!value) return null;
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value;

  const apiBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  if (apiBase && /^https?:\/\//i.test(apiBase)) {
    return new URL(value.startsWith("/") ? value : `/${value}`, apiBase).toString();
  }

  return value.startsWith("/") ? value : `/${value}`;
}

export default function UserAvatar({
  avatarUrl,
  prefixCode,
  prefixes,
  firstName,
  className = "h-9 w-9 text-sm",
  alt = "",
}: Props) {
  const gender = useMemo(
    () => genderFromPrefix(prefixCode, prefixes),
    [prefixCode, prefixes],
  );
  const resolvedAvatarUrl = useMemo(() => resolveAvatarUrl(avatarUrl), [avatarUrl]);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  const initial = (firstName ?? "").trim().charAt(0) || "?";

  // มีรูปโปรไฟล์จริง -> แสดงรูป
  if (resolvedAvatarUrl && failedAvatarUrl !== resolvedAvatarUrl) {
    return (
      <img
        src={resolvedAvatarUrl}
        alt={alt}
        decoding="async"
        onError={() => setFailedAvatarUrl(resolvedAvatarUrl)}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  // ไม่มีรูป -> avatar ตามเพศ
  if (gender === "male") {
    return (
      <div
        className={`${className} shrink-0 overflow-hidden rounded-full bg-blue-100`}
        role="img"
        aria-label={alt || "ผู้ชาย"}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-full w-full"
          aria-hidden="true"
        >
          {/* ไหล่ */}
          <path
            d="M3.6 21c1.7-4.2 5.3-6.3 8.4-6.3s6.7 2.1 8.4 6.3"
            fill="#ffffff"
          />
          {/* ศีรษะ */}
          <circle cx="12" cy="8.3" r="4.4" fill="#ffffff" />
          {/* ทรงผมสั้นแบบผู้ชาย */}
          <path
            d="M7.6 8.8c0-2.6 2-4.6 4.4-4.6s4.4 2 4.4 4.6c0 .7-.2 1.4-.4 2-.3-.2-.7-.3-1-.3l-1.3 1-.9-1c-.3 0-.7 0-1 .1l-1 1-1.3-.9c-.4 0-.8.1-1.1.3-.2-.6-.3-1.2-.3-1.9z"
            fill="#334155"
          />
        </svg>
      </div>
    );
  }

  if (gender === "female") {
    return (
      <div
        className={`${className} shrink-0 overflow-hidden rounded-full bg-rose-100`}
        role="img"
        aria-label={alt || "ผู้หญิง"}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-full w-full"
          aria-hidden="true"
        >
          {/* ไหล่ */}
          <path
            d="M3.6 21c1.7-4.2 5.3-6.3 8.4-6.3s6.7 2.1 8.4 6.3"
            fill="#ffffff"
          />
          {/* ศีรษะ */}
          <circle cx="12" cy="8.3" r="4.4" fill="#ffffff" />
          {/* ทรงผมยาวแบบผู้หญิง */}
          <path
            d="M12 3.5c-2.7 0-4.9 2.2-4.9 4.9 0 .7.1 1.3.4 1.9.2-.2.5-.3.8-.3l.6.5.9-.9c.3 0 .6-.1.9-.1l.9 1 .7-1 .9.1.8.9.6-.5c.3 0 .6.1.8.3.2-.6.4-1.2.4-1.9 0-2.7-2.2-4.9-4.8-4.9z"
            fill="#9f1239"
          />
        </svg>
      </div>
    );
  }

  // ไม่ทราบเพศ -> ตัวอักษรแรก (พฤติกรรมเดิม)
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary-dark`}
      role="img"
      aria-label={alt || firstName || "ผู้ใช้"}
    >
      {initial}
    </div>
  );
}
