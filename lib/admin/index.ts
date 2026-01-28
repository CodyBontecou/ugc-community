/**
 * Check if a user email has admin privileges
 * Reads from ADMIN_EMAILS environment variable (comma-separated)
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) || [];
  return adminEmails.includes(email.toLowerCase());
}

/**
 * User status types
 */
export type UserStatus = "active" | "suspended" | "banned";

/**
 * Check if a user status allows access to the dashboard
 */
export function canAccessDashboard(status: UserStatus): boolean {
  return status === "active";
}
