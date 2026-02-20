import { hasRole, requireRole, canRevealSensitiveData, isAdmin } from "@/lib/rbac";
import type { Session } from "next-auth";
import type { Role } from "@/lib/rbac";

function makeSession(role: Role): Session {
  return {
    user: {
      id: "test-user",
      email: "test@example.com",
      name: "Test User",
      role,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as unknown as Session;
}

describe("hasRole", () => {
  it("ADMIN has all roles", () => {
    expect(hasRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasRole("ADMIN", "MANAGER")).toBe(true);
    expect(hasRole("ADMIN", "AGENT")).toBe(true);
  });

  it("MANAGER has MANAGER and AGENT but not ADMIN", () => {
    expect(hasRole("MANAGER", "ADMIN")).toBe(false);
    expect(hasRole("MANAGER", "MANAGER")).toBe(true);
    expect(hasRole("MANAGER", "AGENT")).toBe(true);
  });

  it("AGENT only has AGENT", () => {
    expect(hasRole("AGENT", "ADMIN")).toBe(false);
    expect(hasRole("AGENT", "MANAGER")).toBe(false);
    expect(hasRole("AGENT", "AGENT")).toBe(true);
  });
});

describe("requireRole", () => {
  it("should not throw when user has sufficient role", () => {
    expect(() => requireRole(makeSession("ADMIN"), "MANAGER")).not.toThrow();
    expect(() => requireRole(makeSession("MANAGER"), "AGENT")).not.toThrow();
  });

  it("should throw when user has insufficient role", () => {
    expect(() => requireRole(makeSession("AGENT"), "MANAGER")).toThrow("Forbidden");
    expect(() => requireRole(makeSession("AGENT"), "ADMIN")).toThrow("Forbidden");
  });

  it("should throw when session is null", () => {
    expect(() => requireRole(null, "AGENT")).toThrow("Unauthorized: not authenticated");
  });
});

describe("canRevealSensitiveData", () => {
  it("ADMIN can reveal", () => {
    expect(canRevealSensitiveData(makeSession("ADMIN"))).toBe(true);
  });

  it("MANAGER can reveal", () => {
    expect(canRevealSensitiveData(makeSession("MANAGER"))).toBe(true);
  });

  it("AGENT cannot reveal", () => {
    expect(canRevealSensitiveData(makeSession("AGENT"))).toBe(false);
  });

  it("null session cannot reveal", () => {
    expect(canRevealSensitiveData(null)).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true for ADMIN", () => {
    expect(isAdmin(makeSession("ADMIN"))).toBe(true);
  });

  it("returns false for MANAGER and AGENT", () => {
    expect(isAdmin(makeSession("MANAGER"))).toBe(false);
    expect(isAdmin(makeSession("AGENT"))).toBe(false);
  });
});
