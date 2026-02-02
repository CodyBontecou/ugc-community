// User roles - simplified after removing brand features
// Keeping the type for backwards compatibility
export type UserRole = "creator" | "brand";

export function isCreator(role: string | null | undefined): boolean {
  // All users are treated as creators now
  return true;
}

export function isBrand(role: string | null | undefined): boolean {
  // Brand features removed - always returns false
  return false;
}

export function canAccessMilestones(role: string | null | undefined): boolean {
  return true;
}

export function canAccessPortfolio(role: string | null | undefined): boolean {
  return true;
}
