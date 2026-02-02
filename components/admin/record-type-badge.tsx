import type { RecordType } from "@/app/api/admin/people/route";

interface RecordTypeBadgeProps {
  type: RecordType;
}

const typeStyles: Record<RecordType, string> = {
  user: "bg-purple-100 text-purple-700",
  waitlist: "bg-amber-100 text-amber-700",
};

const typeLabels: Record<RecordType, string> = {
  user: "User",
  waitlist: "Waitlist",
};

export function RecordTypeBadge({ type }: RecordTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeStyles[type]}`}
    >
      {typeLabels[type]}
    </span>
  );
}
