type TemplateStatus = "ACTIVE" | "DRAFT" | "INACTIVE";

type Props = {
  status: TemplateStatus;
};

const STATUS_CONFIG: Record<
  TemplateStatus,
  {
    label: string;
    className: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-green-100 text-green-700",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-yellow-100 text-yellow-700",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-700",
  },
};

export default function TemplateStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`
        px-3 py-1
        rounded-full
        text-xs
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}
