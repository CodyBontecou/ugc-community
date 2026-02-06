interface RecordTypeBadgeProps {
  type: string;
}

const typeStyles: Record<string, string> = {
  user: "bg-purple-100 text-purple-700",
  invite: "bg-blue-100 text-blue-700",
  waitlist: "bg-amber-100 text-amber-700",
};

const typeLabels: Record<string, string> = {
  user: "User",
  invite: "Invite",
  waitlist: "Waitlist",
};

export function RecordTypeBadge({ type }: RecordTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeStyles[type] || "bg-warm-gray-100 text-warm-gray-600"}`}
    >
      {typeLabels[type] || type}
    </span>
  );
}
