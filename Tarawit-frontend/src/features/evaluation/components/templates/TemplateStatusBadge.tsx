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
    className: "bg-primary/10 text-primary-dark",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600",
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
