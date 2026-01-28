interface InviteStatusBadgeProps {
  isUsed: boolean;
  isExpired: boolean;
  isRevoked: boolean;
}

type InviteStatus = "used" | "revoked" | "expired" | "active";

const statusStyles: Record<InviteStatus, string> = {
  used: "bg-green-100 text-green-700",
  revoked: "bg-red-100 text-red-700",
  expired: "bg-warm-gray-100 text-warm-gray-600",
  active: "bg-blue-100 text-blue-700",
};

const statusLabels: Record<InviteStatus, string> = {
  used: "Used",
  revoked: "Revoked",
  expired: "Expired",
  active: "Active",
};

export function InviteStatusBadge({
  isUsed,
  isExpired,
  isRevoked,
}: InviteStatusBadgeProps) {
  let status: InviteStatus = "active";

  if (isUsed) {
    status = "used";
  } else if (isRevoked) {
    status = "revoked";
  } else if (isExpired) {
    status = "expired";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
