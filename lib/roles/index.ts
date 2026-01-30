export type UserRole = "creator" | "brand";

export function isCreator(role: string | null | undefined): boolean {
  return role === "creator" || !role;
}

export function isBrand(role: string | null | undefined): boolean {
  return role === "brand";
}

export function canAccessMilestones(role: string | null | undefined): boolean {
  return !isBrand(role);
}

export function canAccessPortfolio(role: string | null | undefined): boolean {
  return !isBrand(role);
}
