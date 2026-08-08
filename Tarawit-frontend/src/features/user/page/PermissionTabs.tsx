interface Props {
  value: "role" | "extra" | "all";

  onChange: (value: "role" | "extra" | "all") => void;
}

export default function PermissionTabs({ value, onChange }: Props) {
  const tabs = [
    {
      key: "role",
      label: "บทบาท",
    },
    {
      key: "extra",
      label: "สิทธิ์เพิ่มเติม",
    },
    {
      key: "all",
      label: "สิทธิ์ทั้งหมด",
    },
  ] as const;

  return (
    <div
      className="
flex
border-b
px-6
"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`
 flex-1
 py-3
 text-sm
 font-medium

 ${
   value === tab.key
     ? "border-b-2 border-brand-500 text-brand-600"
     : "text-gray-500"
 }

 `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
