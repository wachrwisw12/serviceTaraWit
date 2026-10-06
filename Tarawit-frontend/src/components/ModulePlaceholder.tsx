import { Link } from "react-router-dom";
import ConstructionIcon from "@mui/icons-material/Construction";
import HomeIcon from "@mui/icons-material/Home";

interface Props {
  title: string;
  description: string;
}

/**
 * หน้า placeholder สำหรับโมดูลที่ยังอยู่ระหว่างการพัฒนา
 * ใช้เมื่อเมนูมี path แต่ยังไม่ได้สร้างฟีเจอร์จริง
 */
export default function ModulePlaceholder({ title, description }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          อยู่ระหว่างการพัฒนา
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary-dark">
          <ConstructionIcon className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-gray-800">
          หน้านี้อยู่ระหว่างการพัฒนา
        </h2>
        <p className="mt-1 max-w-md text-sm text-gray-500">{description}</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          <HomeIcon className="h-4 w-4" />
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
