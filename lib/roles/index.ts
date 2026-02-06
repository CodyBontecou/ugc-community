export type UserRole = "creator";

export function isCreator(role: string | null | undefined): boolean {
  return role === "creator" || !role;
}

export function canAccessMilestones(role: string | null | undefined): boolean {
  return true;
}

export function canAccessPortfolio(role: string | null | undefined): boolean {
  return true;
}
