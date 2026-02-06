interface RecordTypeBadgeProps {
  type: string;
}

const typeStyles: Record<string, string> = {
  user: "bg-coral/10 text-coral",
  invite: "bg-warm-gray-100 text-warm-gray-700",
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
