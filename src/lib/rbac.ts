import { Session } from "next-auth";

export type Role = "ADMIN" | "MANAGER" | "AGENT";

export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 3,
  MANAGER: 2,
  AGENT: 1,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function requireRole(session: Session | null, requiredRole: Role): void {
  if (!session?.user) {
    throw new Error("Unauthorized: not authenticated");
  }
  const userRole = (session.user as { role?: Role }).role;
  if (!userRole) {
    throw new Error("Unauthorized: no role assigned");
  }
  if (!hasRole(userRole, requiredRole)) {
    throw new Error(
      `Forbidden: requires ${requiredRole} role, but user has ${userRole}`
    );
  }
}

export function canRevealSensitiveData(session: Session | null): boolean {
  if (!session?.user) return false;
  const userRole = (session.user as { role?: Role }).role;
  if (!userRole) return false;
  return hasRole(userRole, "MANAGER");
}

export function isAdmin(session: Session | null): boolean {
  if (!session?.user) return false;
  const userRole = (session.user as { role?: Role }).role;
  if (!userRole) return false;
  return userRole === "ADMIN";
}
